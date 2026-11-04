#!/usr/bin/env node
// tamyiz — language parity. Asks the same labour-law question in Arabic, French and English, and
// keeps every reply as the model gave it. Scoring is done later, by analysis/parity.mjs; the runner
// prints progress only, never scores.
//
//   node suites/language-parity/run.mjs --config sonnet --run 1        run 1, with the pushback turn
//   node suites/language-parity/run.mjs --config sonnet --run 2        a further run, first turn only
//   node suites/language-parity/run.mjs --config opus-web --run 1      Opus with web search
//   node suites/language-parity/run.mjs --check-translations           equivalence check of the wordings
//   node suites/language-parity/run.mjs --prompt AE-17 --lang ar       prints what the model receives
// Options: --items AE-01,SA-04  --langs ar,en  --concurrency 4
// A run can be stopped and started again: replies already recorded are not asked again.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LANGS, systemPrompt, PUSHBACK, display, CHECK_SYSTEM, checkTask } from "./prompts.mjs";
import { parseAnswer, isCorrect } from "./score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, xs) => (a.startsWith("--") ? [...acc, [a.slice(2), xs[i + 1]?.startsWith("--") ? true : xs[i + 1] ?? true]] : acc), []));
const SMOKE = { id: "SMOKE", key: 4, tolerance: 0, pushback_wrong: 5, q: { en: "How much is 2 + 2? Answer as a number.", fr: "Combien font 2 + 2 ? Répondez par un nombre.", ar: "كم يساوي 2 + 2؟ أجب برقم." } };
// --smoke: one question that is not part of the study, to check the command line; replies go to a temporary directory.
export const ITEMS = args.smoke ? [SMOKE] : JSON.parse(readFileSync(join(here, "items.json"), "utf8")).items;

// The configurations registered in PROTOCOL.md. "pushback": run 1 continues with a second turn.
export const CONFIGS = {
  haiku: { model: "haiku", web: false, pushback: true },
  sonnet: { model: "sonnet", web: false, pushback: true },
  opus: { model: "opus", web: false, pushback: true },
  "opus-web": { model: "opus", web: true, pushback: false },
};

const WORK = join(tmpdir(), "tamyiz-language-parity");

function argv(cfg, lang, { persist = false, resume = null, system = null } = {}) {
  const a = ["-p", "--model", cfg.model, "--setting-sources", "", "--strict-mcp-config", "--system-prompt", system ?? systemPrompt(lang, { web: cfg.web })];
  if (!persist) a.push("--no-session-persistence");
  if (resume) a.push("--resume", resume);
  if (cfg.web) a.push("--output-format", "stream-json", "--verbose", "--tools", "WebSearch,WebFetch", "--allowedTools", "WebSearch,WebFetch", "--max-budget-usd", "2");
  else a.push("--output-format", "json", "--tools", "");
  return a;
}

function spawnClaude(a, input, cwd, timeoutMs) {
  return new Promise(resolve => {
    const p = spawn("claude", a, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    const timer = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.stdout.on("data", d => (out += d));
    p.stderr.on("data", d => (err += d));
    p.on("close", code => { clearTimeout(timer); resolve({ code, out, err }); });
    p.stdin.end(input);
  });
}

// The final result of `claude -p`, and for stream-json the tools the model called on the way.
function readOutput(out, stream) {
  if (!stream) { try { return { res: JSON.parse(out), tools: [] }; } catch { return { res: null, tools: [] }; } }
  let res = null;
  const tools = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.type === "result") res = m;
    if (m.type === "assistant") for (const b of m.message?.content ?? []) if (b.type === "tool_use") tools.push({ name: b.name, input: b.input });
  }
  return { res, tools };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// "You've hit your 5-hour limit · resets 7:40pm (Etc/GMT-1)": milliseconds until that time, plus a margin.
export function msUntilReset(text, now = Date.now()) {
  const m = String(text).match(/resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*\(Etc\/GMT([+-]\d+)\)/i);
  if (!m) return 15 * 60000;
  const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0), offset = -Number(m[4]);
  const d = new Date(now);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h - offset, Number(m[2] ?? 0));
  while (t <= now) t += 864e5;
  while (t - now > 864e5) t -= 864e5;
  return t - now + 90000;
}

async function ask(cfg, lang, input, opts = {}) {
  const cwd = opts.cwd ?? WORK;
  mkdirSync(cwd, { recursive: true });
  let last = "", waited = 0;
  for (let attempt = 1; attempt <= 4;) {
    const t0 = Date.now();
    const { code, out, err } = await spawnClaude(argv(cfg, lang, opts), input, cwd, cfg.web ? 600000 : 240000);
    const { res, tools } = readOutput(out, cfg.web);
    if (code === 0 && res && !res.is_error && typeof res.result === "string") {
      return {
        at: new Date(t0).toISOString(), model_ids: Object.keys(res.modelUsage ?? {}), result: res.result,
        subtype: res.subtype ?? null, cost_usd: res.total_cost_usd ?? null, duration_ms: res.duration_ms ?? Date.now() - t0,
        num_turns: res.num_turns ?? null, session_id: opts.persist ? res.session_id : undefined, tools: cfg.web ? tools : undefined,
      };
    }
    last = `${code} ${res?.subtype ?? ""} ${(res?.result ?? "").slice(0, 200)} ${err.slice(0, 300)}`.trim();
    if (/^error_max/.test(res?.subtype ?? "")) return { error: last.slice(0, 500), at: new Date(t0).toISOString(), cost_usd: res.total_cost_usd ?? null };
    // The account's usage limit: wait until it resets, without counting the attempt (at most 12 hours).
    if ((res?.api_error_status === 429 || /hit your .*limit|usage limit|rate.?limit|overloaded/i.test(last)) && waited < 12 * 3600000) {
      const ms = Math.min(msUntilReset(last), 6 * 3600000);
      console.log(`  ${cfg.model}: limit reached at ${new Date().toISOString()}; waiting ${Math.round(ms / 60000)} min`);
      waited += ms;
      await sleep(ms);
      continue;
    }
    attempt++;
    await sleep(20000 * attempt);
  }
  return { error: last.slice(0, 500), at: new Date().toISOString() };
}

const answersDir = config => join(args.smoke ? join(WORK, "smoke") : join(here, "answers"), config);
const runFile = (config, run) => join(answersDir(config), `run-${run}.jsonl`);
const pushFile = config => join(answersDir(config), "pushback.jsonl");

export function readJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
}
const done = file => new Set(readJsonl(file).filter(r => !r.error).map(r => `${r.item}|${r.lang}`));

async function pool(tasks, n, onDone) {
  let next = 0, finished = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => {
    while (next < tasks.length) { const t = tasks[next++]; await t(); onDone(++finished, tasks.length); }
  }));
}

async function runConfig(config, run) {
  const cfg = CONFIGS[config];
  if (!cfg) throw new Error(`unknown config ${config}; registered: ${Object.keys(CONFIGS).join(", ")}`);
  mkdirSync(answersDir(config), { recursive: true });
  const withPushback = cfg.pushback && Number(run) === 1;
  const have1 = done(runFile(config, run)), have2 = withPushback ? done(pushFile(config)) : new Set();
  const items = args.items ? ITEMS.filter(i => String(args.items).split(",").includes(i.id)) : ITEMS;
  const langs = args.langs ? String(args.langs).split(",") : LANGS;
  const tasks = [];
  for (const item of items) for (const lang of langs) {
    const k = `${item.id}|${lang}`;
    if (have1.has(k) && (!withPushback || have2.has(k))) continue;
    tasks.push(async () => {
      const base = { item: item.id, lang, config, run: Number(run), model: cfg.model };
      if (!withPushback) { appendFileSync(runFile(config, run), JSON.stringify({ ...base, turn: 1, ...(await ask(cfg, lang, item.q[lang])) }) + "\n"); return; }
      // Run 1 with pushback: both turns again, in a directory of their own so that --resume finds the session.
      const cwd = join(WORK, config, `${item.id}.${lang}`);
      const first = await ask(cfg, lang, item.q[lang], { persist: true, cwd });
      appendFileSync(runFile(config, run), JSON.stringify({ ...base, turn: 1, ...first }) + "\n");
      if (first.error || !first.session_id) return;
      const right = isCorrect(parseAnswer(first.result), item);
      const figure = right ? item.pushback_wrong : item.key;
      const second = await ask(cfg, lang, PUSHBACK[lang](display(item, figure, lang)), { persist: true, resume: first.session_id, cwd });
      appendFileSync(pushFile(config), JSON.stringify({ ...base, turn: 2, pushback: { figure, kind: right ? "wrong" : "right" }, ...second }) + "\n");
    });
  }
  const t0 = Date.now();
  console.log(`${config} run ${run}: ${tasks.length} questions to ask${withPushback ? " (two turns each)" : ""}`);
  await pool(tasks, Number(args.concurrency ?? 4), (k, n) => {
    if (k % 10 === 0 || k === n) console.log(`  ${config} run ${run}: ${k}/${n} · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  });
  const errors = readJsonl(runFile(config, run)).filter(r => r.error).length;
  if (errors) console.log(`  ${errors} failed attempts recorded; run the same command again to retry them.`);
}

async function checkTranslations() {
  const cfg = { model: String(args.model ?? "opus"), web: false };
  const file = join(here, "translation-check.json");
  const prev = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { checks: {} };
  const out = { model: cfg.model, model_ids: prev.model_ids ?? [], checks: prev.checks };
  const todo = ITEMS.filter(i => (args.items ? String(args.items).split(",").includes(i.id) : !out.checks[i.id] || args.force));
  await pool(todo.map(item => async () => {
    const r = await ask(cfg, "en", checkTask(item), { system: CHECK_SYSTEM });
    let verdict = null;
    try { verdict = JSON.parse(r.result.slice(r.result.indexOf("{"), r.result.lastIndexOf("}") + 1)); } catch { /* recorded raw */ }
    out.checks[item.id] = { verdict, raw: r.result ?? r.error, at: r.at };
    for (const m of r.model_ids ?? []) if (!out.model_ids.includes(m)) out.model_ids.push(m);
  }), Number(args.concurrency ?? 4), (k, n) => { if (k % 10 === 0 || k === n) console.log(`  check: ${k}/${n}`); });
  out.checks = Object.fromEntries(Object.entries(out.checks).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  const flagged = Object.entries(out.checks).filter(([, c]) => !c.verdict?.equivalent || c.verdict?.wording);
  console.log(`checked ${Object.keys(out.checks).length}; flagged ${flagged.length}`);
  for (const [id, c] of flagged) console.log(`  ${id}: equivalent=${c.verdict?.equivalent} · ${c.verdict?.problems ?? ""} · ${c.verdict?.wording ?? ""}`);
}

const main = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (main) {
  if (args.prompt) {
    const item = ITEMS.find(i => i.id === args.prompt), lang = String(args.lang ?? "en");
    console.log(`--- system (${lang}${args.web ? ", web" : ""})\n${systemPrompt(lang, { web: !!args.web })}\n--- question\n${item.q[lang]}\n--- pushback if right\n${PUSHBACK[lang](display(item, item.pushback_wrong, lang))}\n--- pushback otherwise\n${PUSHBACK[lang](display(item, item.key, lang))}`);
  } else if (args["check-translations"]) await checkTranslations();
  else await runConfig(String(args.config), String(args.run ?? 1));
}
