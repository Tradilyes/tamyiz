#!/usr/bin/env node
// tamyiz — Study D, the update observatory. Once a month, asks the Study B questions on rules that
// took effect on or after 1 January 2024 again, to the current models, in Arabic, French and English:
// one run, no tools, no pushback, the same instructions as Study B except today's date. The question
// it answers over time: how long does an AI take to learn that a rule has changed, and in which
// language first? Study B's run 1 (4 November 2026) is the first point of every series.
//
//   node suites/language-parity/observatory.mjs --month 2026-12             ask, for every model
//   node suites/language-parity/observatory.mjs --month 2026-12 --dry-run   print what would be asked
//   node suites/language-parity/observatory.mjs --report                    write OBSERVATORY.md
// Options: --models haiku,sonnet,opus  --concurrency 3
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LANGS, systemPrompt } from "./prompts.mjs";
import { parseAnswer, isCorrect } from "./score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, xs) => (a.startsWith("--") ? [...acc, [a.slice(2), xs[i + 1]?.startsWith("--") ? true : xs[i + 1] ?? true]] : acc), []));
const ITEMS = JSON.parse(readFileSync(join(here, "items.json"), "utf8")).items.filter(i => i.recent);
const MODELS = args.models ? String(args.models).split(",") : ["haiku", "sonnet", "opus"];
const OUT = join(here, "observatory");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const SHUHUR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

// Study B's instructions, with today's date in place of 4 November 2026.
function system(lang, now = new Date()) {
  const d = now.getUTCDate(), m = now.getUTCMonth(), y = now.getUTCFullYear();
  const date = { en: `${d} ${MONTHS.at(m)} ${y}`, fr: `${d} ${MOIS.at(m)} ${y}`, ar: `${d} ${SHUHUR.at(m)} ${y}` }[lang];
  const base = { en: "4 November 2026", fr: "4 novembre 2026", ar: "4 نوفمبر 2026" }[lang];
  return systemPrompt(lang).replace(base, date);
}

function ask(model, lang, input) {
  return new Promise(resolve => {
    const a = ["-p", "--model", model, "--setting-sources", "", "--strict-mcp-config", "--system-prompt", system(lang), "--no-session-persistence", "--output-format", "json", "--tools", ""];
    const dir = join(tmpdir(), "tamyiz-observatory");
    mkdirSync(dir, { recursive: true });
    const p = spawn("claude", a, { cwd: dir, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    const t0 = Date.now(), timer = setTimeout(() => p.kill("SIGKILL"), 240000);
    p.stdout.on("data", d => (out += d));
    p.on("close", () => {
      clearTimeout(timer);
      let r = null;
      try { r = JSON.parse(out); } catch { /* recorded as an error */ }
      if (r && !r.is_error && typeof r.result === "string") resolve({ at: new Date(t0).toISOString(), model_ids: Object.keys(r.modelUsage ?? {}), result: r.result, cost_usd: r.total_cost_usd ?? null, duration_ms: r.duration_ms ?? null });
      else resolve({ at: new Date(t0).toISOString(), error: String(r?.result ?? out).slice(0, 300) });
    });
    p.stdin.end(input);
  });
}

async function runMonth(month) {
  const tasks = [];
  for (const model of MODELS) {
    const file = join(OUT, month, `${model}.jsonl`);
    const have = existsSync(file) ? new Set(readFileSync(file, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l)).filter(r => !r.error).map(r => `${r.item}|${r.lang}`)) : new Set();
    for (const item of ITEMS) for (const lang of LANGS) if (!have.has(`${item.id}|${lang}`)) tasks.push({ model, item, lang, file });
  }
  if (args["dry-run"]) { for (const t of tasks) console.log(`${t.model} ${t.item.id} ${t.lang}`); console.log(`${tasks.length} questions; system prompt (en): ${system("en")}`); return; }
  mkdirSync(join(OUT, month), { recursive: true });
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: Number(args.concurrency ?? 3) }, async () => {
    while (next < tasks.length) {
      const t = tasks[next++];
      appendFileSync(t.file, JSON.stringify({ item: t.item.id, lang: t.lang, model: t.model, month, ...(await ask(t.model, t.lang, t.item.q[t.lang])) }) + "\n");
      if (++done % 10 === 0 || done === tasks.length) console.log(`  ${month}: ${done}/${tasks.length}`);
    }
  }));
}

function readSeries() {
  // month -> model -> item|lang -> right (true/false); Study B's run 1 is the first month.
  const series = {};
  const add = (month, model, r) => { if (r.error) return; const item = ITEMS.find(i => i.id === r.item); if (!item) return; ((series[month] ??= {})[model] ??= {})[`${r.item}|${r.lang}`] = isCorrect(parseAnswer(r.result), item); };
  for (const model of MODELS) {
    const f = join(here, "answers", model, "run-1.jsonl");
    if (existsSync(f)) for (const l of readFileSync(f, "utf8").split("\n").filter(Boolean)) add("2026-11", model, JSON.parse(l));
  }
  if (existsSync(OUT)) for (const month of readdirSync(OUT).sort()) for (const f of readdirSync(join(OUT, month))) for (const l of readFileSync(join(OUT, month, f), "utf8").split("\n").filter(Boolean)) add(month, f.replace(/\.jsonl$/, ""), JSON.parse(l));
  return series;
}

function report() {
  const series = readSeries(), months = Object.keys(series).sort();
  const L = ["# Update observatory — results", "",
    `Generated by \`node suites/language-parity/observatory.mjs --report\`. The ${ITEMS.length} questions of Study B on rules in force since 1 January 2024, asked again each month in Arabic, French and English; one run, no tools. The first month is Study B's run 1 (4 November 2026).`, "",
    "Questions answered right, out of the questions asked in that language:", "",
    `| Month | Model | ${LANGS.map(l => ({ ar: "Arabic", fr: "French", en: "English" })[l]).join(" | ")} |`, "|---|---|---:|---:|---:|"];
  for (const month of months) for (const model of MODELS) {
    const s = series[month]?.[model];
    if (!s) continue;
    L.push(`| ${month} | ${model} | ${LANGS.map(l => { const v = Object.entries(s).filter(([k]) => k.endsWith(`|${l}`)).map(([, x]) => x); return `${v.filter(Boolean).length}/${v.length}`; }).join(" | ")} |`);
  }
  L.push("", "First month in which each question was answered right, by model and language (— : not yet):", "",
    `| Question | In force since | ${MODELS.flatMap(m => LANGS.map(l => `${m} ${l}`)).join(" | ")} |`, `|---|---|${MODELS.flatMap(() => LANGS.map(() => "---|")).join("")}`);
  for (const item of ITEMS) L.push(`| ${item.id} | ${item.in_force} | ${MODELS.flatMap(m => LANGS.map(l => months.find(mo => series[mo]?.[m]?.[`${item.id}|${l}`]) ?? "—")).join(" | ")} |`);
  writeFileSync(join(here, "OBSERVATORY.md"), L.join("\n") + "\n");
  console.log(L.join("\n"));
}

const main = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (main) {
  if (args.report) report();
  else if (args.month && /^\d{4}-\d{2}$/.test(String(args.month))) await runMonth(String(args.month));
  else console.log("usage: --month YYYY-MM [--dry-run] | --report");
}
