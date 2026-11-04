#!/usr/bin/env node
// tamyiz — runs the boundary NDA suite. The same documents and playbook for every reviewer:
//   --mode plain    the model alone, with a short generic instruction           (e.g. --model opus --effort high)
//   --mode cfl      the model running Claude for Legal's NDA Triager, configured for the team
//   --mode system   the model as an agent with courtproof's tools and nda-triage skill (--courtproof <dir>)
//   --condition before   the playbook only
//   --condition after    the playbook and the General Counsel's rulings in force (caselaw/gulf-horizon)
//   node suites/nda-boundary/run.mjs --arm opus-plain --mode plain --model opus --effort high --condition before [--split mine|test|control]
//   node suites/nda-boundary/run.mjs --mine      how the reviewers read the edge NDAs (before, wording A)
//   node suites/nda-boundary/run.mjs --report    scores every arm, before and after, and writes RESULTS.md
//   node suites/nda-boundary/run.mjs --prompt P1A [--condition after]     prints the task of one case
//   node suites/nda-boundary/run.mjs --show-system cfl [--condition after] prints an arm's instructions
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CASES, CODES, PATTERNS, render } from "./cases.mjs";
import { mine, score, signature } from "../../engine/mine.mjs";
import { compileInstructions } from "../../engine/caselaw.mjs";
import { loadCaselaw } from "../../engine/caselaw-file.mjs";
import { systemPrompt as cflSystemPrompt } from "../../engine/cfl.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, xs) => (a.startsWith("--") ? [...acc, [a.slice(2), xs[i + 1]?.startsWith("--") ? true : xs[i + 1] ?? true]] : acc), []));
const playbook = readFileSync(join(here, "playbook.md"), "utf8");
const caselawFile = join(root, "caselaw", "gulf-horizon", "rulings.json");
const AS_OF = "2026-11-02";
const rulings = condition => (condition === "after" && existsSync(caselawFile) ? compileInstructions(loadCaselaw(caselawFile), AS_OF) : "");
const courtproof = resolve(String(args.courtproof ?? join(root, "..", "courtproof")));

export function task(c, condition = "before") {
  const cl = rulings(condition);
  return `You are in-house counsel at Gulf Horizon Holding LLC, Dubai. The business sends you an NDA from ${c.cp} for signature, in English. Triage it against our playbook (our legal.local.md), as of 3 November 2026.

${playbook}
${cl ? `${cl}\n` : ""}Use only these codes: ${CODES.join(", ")}.

Answer with JSON only: {"classification": "GREEN|YELLOW|RED", "issues": [{"code": "...", "quote": "exact words from the NDA", "reason": "..."}]}

=== ENGLISH VERSION ===
${render(c)}
=== END ===`;
}

function system(mode, condition) {
  const strip = p => readFileSync(p, "utf8").replace(/^---[\s\S]*?---\s*/, "");
  if (mode === "cfl") return cflSystemPrompt(playbook, rulings(condition));
  if (mode === "system") return strip(join(courtproof, "plugins/courtproof/skills/nda-triage/SKILL.md"));
  return "You are a careful in-house lawyer. You answer exactly in the format requested.";
}

function parse(text) {
  const s = String(text ?? "");
  for (let i = s.lastIndexOf("{"); i >= 0; i = s.lastIndexOf("{", i - 1)) {
    try { const j = JSON.parse(s.slice(i, s.lastIndexOf("}") + 1)); if (j && j.classification) return j; } catch { /* keep looking */ }
    if (i === 0) break;
  }
  return null;
}

function runOne(c, mode, condition) {
  const dir = mkdtempSync(join(tmpdir(), "tamyiz-"));
  const argv = ["-p", "--model", String(args.model ?? "opus"), "--output-format", "json", "--no-session-persistence", "--setting-sources", "", "--strict-mcp-config", "--system-prompt", system(mode, condition)];
  if (args.effort) argv.push("--effort", String(args.effort));
  if (mode === "system") {
    const cfg = { mcpServers: { courtproof: { command: process.execPath, args: [join(courtproof, "plugins/courtproof/mcp/courtproof-server.mjs")] } } };
    argv.push("--tools", "", "--mcp-config", JSON.stringify(cfg), "--allowedTools", "mcp__courtproof__verify_quotes,mcp__courtproof__classify_nda", "--max-budget-usd", String(args.budget ?? 1));
  } else argv.push("--tools", "");
  const t0 = Date.now();
  const r = spawnSync("claude", argv, { input: task(c, condition), cwd: dir, encoding: "utf8", maxBuffer: 1 << 26 });
  let j = {};
  try { j = JSON.parse(r.stdout); } catch { j = { result: r.stdout, error: r.stderr }; }
  return { case: c.id, result: j.result ?? "", answer: parse(j.result), cost_usd: j.total_cost_usd ?? null, duration_ms: j.duration_ms ?? Date.now() - t0, turns: j.num_turns ?? null };
}

const ansFile = (condition, arm) => join(here, "answers", condition, `${arm}.json`);
function load(condition) {
  const dir = join(here, "answers", condition);
  if (!existsSync(dir)) return {};
  return Object.fromEntries(readdirSync(dir).filter(f => f.endsWith(".json")).map(f => [f.replace(/\.json$/, ""), JSON.parse(readFileSync(join(dir, f), "utf8"))]));
}
// One answer per case per arm (the latest run).
const byCase = data => Object.fromEntries(Object.entries(data).map(([arm, d]) => [arm, Object.fromEntries(d.runs.flat().map(x => [x.case, x.answer]))]));

function report() {
  const before = byCase(load("before")), after = byCase(load("after"));
  const ORDER = ["opus-plain", "opus-cfl", "sonnet-plain", "haiku-system"];
  const reviewers = Object.keys(before).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const keySig = c => `${c.key.classification}|${[...c.key.issues].sort().join(",")}`;
  const reading = r => `${r.classification ?? "no answer"}${r.codes.length ? ` · ${r.codes.join(", ")}` : ""}`;
  const L = ["# Boundary NDAs — results", "",
    `Twenty-five NDAs of Gulf Horizon Holding LLC (Dubai): ten questions of interpretation the playbook does not settle on its own, each in two wordings (A, reviewed by the General Counsel; B, held out), and five controls, three of which guard against a ruling reaching too far. Same playbook and same task text for every reviewer. Keys committed locally before the first run (commit 1016822; guards in a9b6fc0), rulings before any held-out run with them (b24726a); local commit dates are not proof to a third party (see analysis/PILOT.md). *before*: the playbook only. *after*: the playbook and the General Counsel's rulings in force on ${AS_OF} (\`caselaw/gulf-horizon/rulings.json\`).`, "",
    `Reviewers: ${reviewers.join(", ")}.`, ""];
  const mineIds = CASES.filter(c => c.split === "mine").map(c => c.id).filter(id => reviewers.every(r => before[r][id] !== undefined));
  const m = mine(before, mineIds);
  const sameAsTeam = m.cases.filter(c => c.unanimous && `${c.readings[0].classification}|${c.readings[0].codes.join(",")}` === keySig(CASES.find(x => x.id === c.id)));
  const unanimousOther = m.cases.filter(c => c.unanimous && !sameAsTeam.includes(c));
  L.push("## 1. How the reviewers read the edge NDAs, before any ruling (wording A)", "",
    `Unanimous on ${m.unanimous} of ${m.cases.length}. Their common reading is the team's on ${sameAsTeam.length}; on ${unanimousOther.length} (${unanimousOther.map(c => c.id).join(", ") || "none"}) every reviewer read the playbook otherwise than the General Counsel meant — which no comparison between the reviewers can show.`, "",
    "| NDA | Question | Reading (← reviewers) | Team's position | Same? |", "|---|---|---|---|---|",
    ...m.cases.map(c => { const k = CASES.find(x => x.id === c.id); const p = PATTERNS.find(x => `${x.id}A` === c.id); const same = c.unanimous ? (sameAsTeam.includes(c) ? "yes" : "no — all reviewers") : "split"; return `| ${c.id} | ${p?.question ?? ""} | ${c.readings.map(r => `${reading(r)} ← ${r.reviewers.join(", ")}`).join("<br>")} | ${k.key.classification}${k.key.issues.length ? ` · ${k.key.issues.join(", ")}` : ""} | ${same} |`; }), "");
  const guardIds = CASES.filter(c => c.split === "control").map(c => c.id).filter(id => reviewers.every(r => before[r][id] !== undefined));
  const g = mine(before, guardIds);
  L.push("## 2. Controls and guards, before any ruling", "",
    "| NDA | Reading (← reviewers) | Key |", "|---|---|---|",
    ...g.cases.map(c => { const k = CASES.find(x => x.id === c.id); return `| ${c.id}${k.guards ? ` (guards ${k.guards})` : ""} | ${c.readings.map(r => `${reading(r)} ← ${r.reviewers.join(", ")}`).join("<br>")} | ${k.key.classification}${k.key.issues.length ? ` · ${k.key.issues.join(", ")}` : ""} |`; }), "");
  const ids = split => CASES.filter(c => c.split === split).map(c => c.id);
  const exact = (ans, list) => list.filter(id => ans?.[id] !== undefined).map(id => score(ans[id], CASES.find(c => c.id === id).key));
  const frac = xs => (xs.length ? `${xs.filter(x => x.exact).length}/${xs.length}` : "—");
  L.push("## 3. Held-out NDAs and guards, before and after the rulings", "",
    "*Exactly right*: the right routing and exactly the codes of the key, no more, no fewer.", "",
    "| Reviewer | Held-out (B), before | Held-out (B), after | Controls and guards, before | Controls and guards, after |", "|---|---:|---:|---:|---:|",
    ...reviewers.map(r => `| ${r} | ${frac(exact(before[r], ids("test")))} | ${frac(exact(after[r], ids("test")))} | ${frac(exact(before[r], ids("control")))} | ${frac(exact(after[r], ids("control")))} |`), "");
  for (const [name, data] of [["before", before], ["after", after]]) {
    const list = [...ids("test"), ...ids("control")].filter(id => reviewers.every(r => data[r]?.[id] !== undefined));
    if (list.length) { const mm = mine(data, list); L.push(`- ${name}: the reviewers were unanimous on ${mm.unanimous} of ${list.length} held-out and control NDAs (pairwise agreement ${Math.round(mm.pairwiseRate * 100)}%).`); }
  }
  L.push("");
  const costs = ["before", "after"].flatMap(cond => Object.entries(load(cond)).map(([arm, d]) => { const xs = d.runs.flat(); return `| ${arm} | ${cond} | ${xs.length} | ${(xs.reduce((s, x) => s + (x.cost_usd ?? 0), 0) / xs.length).toFixed(4)} | ${(xs.reduce((s, x) => s + (x.duration_ms ?? 0), 0) / xs.length / 1000).toFixed(1)} s |`; }));
  L.push("## 4. Cost and time", "", "| Reviewer | Condition | Reviews | Cost per NDA (USD) | Time per NDA |", "|---|---|---:|---:|---:|", ...costs, "",
    "Costs and times are what `claude -p` reported. One run per reviewer, NDA and condition.", "");
  writeFileSync(join(here, "RESULTS.md"), L.join("\n"));
  writeFileSync(join(here, "summary.json"), JSON.stringify({ reviewers, edge: m, guards: g, scores: Object.fromEntries(reviewers.map(r => [r, { testBefore: frac(exact(before[r], ids("test"))), testAfter: frac(exact(after[r], ids("test"))), controlsBefore: frac(exact(before[r], ids("control"))), controlsAfter: frac(exact(after[r], ids("control"))) }])) }, null, 2) + "\n");
  console.log(L.join("\n"));
}

const main = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (main) {
  const condition = String(args.condition ?? "before");
  if (args.report) { report(); process.exit(0); }
  if (args.mine) { const b = byCase(load("before")); console.log(JSON.stringify(mine(b, CASES.filter(c => c.split === "mine").map(c => c.id)), null, 2)); process.exit(0); }
  if (args.prompt) { console.log(task(CASES.find(c => c.id === args.prompt), condition)); process.exit(0); }
  if (args["show-system"]) { console.log(system(String(args["show-system"]), condition)); process.exit(0); }
  const mode = String(args.mode ?? "plain");
  const arm = String(args.arm ?? `${args.model ?? "opus"}-${mode}`);
  const pick = args.cases ? String(args.cases).split(",") : CASES.filter(c => !args.split || args.split === "all" || c.split === args.split).map(c => c.id);
  mkdirSync(join(here, "answers", condition), { recursive: true });
  const file = ansFile(condition, arm);
  const prev = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { meta: {}, runs: [] };
  const run = [];
  for (const id of pick) {
    const c = CASES.find(x => x.id === id);
    const x = runOne(c, mode, condition);
    const s = score(x.answer, c.key);
    console.log(`  ${arm} ${condition} ${id}: ${signature(x.answer)}${s.exact ? " ✓" : " ✗"} · $${(x.cost_usd ?? 0).toFixed(4)} · ${(x.duration_ms / 1000).toFixed(1)} s`);
    run.push(x);
  }
  prev.runs.push(run);
  prev.meta = { model: args.model ?? "opus", effort: args.effort ?? null, mode, condition, as_of: AS_OF };
  writeFileSync(file, JSON.stringify(prev, null, 2) + "\n");
}
