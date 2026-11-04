#!/usr/bin/env node
// tamyiz — analysis of the language-parity study (suites/language-parity/PROTOCOL.md).
// Reads the committed replies, scores them and writes RESULTS.md and results.json next to them.
// Deterministic: the same replies give the same files, byte for byte (bootstrap seed 20261104).
//   node analysis/parity.mjs [--answers <dir>] [--out <dir>]
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { wilson, mcnemarExact, cochranQ, holm, bootstrapCI } from "./stats.mjs";
import { parseAnswer, isCorrect, answerValue } from "../suites/language-parity/score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const suite = resolve(here, "..", "suites", "language-parity");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, xs) => (a.startsWith("--") ? [...acc, [a.slice(2), xs[i + 1]?.startsWith("--") ? true : xs[i + 1] ?? true]] : acc), []));
const ANS = resolve(String(args.answers ?? join(suite, "answers")));
const OUT = resolve(String(args.out ?? suite));
const SEED = 20261104, B = 10000;
const LANGS = ["ar", "fr", "en"];
const LANG_NAME = { ar: "Arabic", fr: "French", en: "English" };
const HOME = { AE: "ar", SA: "ar", FR: "fr" };
const MODELS = ["haiku", "sonnet", "opus"]; // three runs each; H1 to H3, H5
const OFFICIAL = /(^|\.)(mohre\.gov\.ae|u\.ae|uaelegislation\.gov\.ae|moj\.gov\.ae|hrsd\.gov\.sa|boe\.gov\.sa|laws\.boe\.gov\.sa|legifrance\.gouv\.fr|code\.travail\.gouv\.fr|service-public\.fr|service-public\.gouv\.fr|travail-emploi\.gouv\.fr)$/i;

const data = JSON.parse(readFileSync(join(suite, "items.json"), "utf8"));
const ITEMS = data.items;
const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// ---------- loading ----------
const readJsonl = f => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l)) : []);
function scoreRecord(r) {
  const item = byId[r.item];
  const p = parseAnswer(r.result);
  return { ...p, correct: isCorrect(p, item), val: answerValue(p, item) };
}
// answers[config][run][item|lang] = scored reply (the last successful one recorded)
const answers = {}, pushback = {}, raw = {};
for (const config of existsSync(ANS) ? readdirSync(ANS).sort() : []) {
  answers[config] = {}; raw[config] = [];
  for (const f of readdirSync(join(ANS, config)).sort()) {
    const recs = readJsonl(join(ANS, config, f));
    raw[config].push(...recs);
    const m = f.match(/^run-(\d+)\.jsonl$/);
    const target = m ? (answers[config][m[1]] ??= {}) : f === "pushback.jsonl" ? (pushback[config] ??= {}) : null;
    if (!target) continue;
    for (const r of recs) if (!r.error && byId[r.item]) target[`${r.item}|${r.lang}`] = { ...r, s: scoreRecord(r) };
  }
}
const runsOf = config => Object.keys(answers[config] ?? {}).map(Number).sort((a, b) => a - b);
const get = (config, run, id, lang) => answers[config]?.[run]?.[`${id}|${lang}`]?.s ?? null;

// ---------- helpers ----------
const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const r2 = x => (Number.isFinite(x) ? Math.round(x * 100) / 100 : null);
const r3 = x => (Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);
const pctI = (k, n) => { if (!n) return "—"; const [lo, hi] = wilson(k, n); return `${k}/${n} · ${Math.round((100 * k) / n)} % (${Math.round(lo * 100)}–${Math.round(hi * 100)})`; };
const signed = (x, d = 2) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d);
const ci = ([lo, hi], d = 2) => `${signed(lo, d)} to ${signed(hi, d)}`;
const ciObj = (est, ivl) => ({ estimate: r3(est), ci95: ivl.map(r3) });
const pval = p => (p < 0.001 ? "< 0.001" : p.toFixed(3));
const ids = ITEMS.map(i => i.id);

// ---------- H1: answers differ more across languages than across runs in one language ----------
function discordance(config) {
  const runs = runsOf(config);
  const perItem = ids.map(id => {
    const cells = LANGS.map(l => runs.map(r => get(config, r, id, l)?.val ?? null));
    let wSum = 0, wN = 0, xSum = 0, xN = 0;
    for (let a = 0; a < LANGS.length; a++) {
      const A = cells[a].filter(v => v !== null);
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { wSum += A[i] !== A[j]; wN++; }
      for (let b = a + 1; b < LANGS.length; b++) {
        const Bv = cells[b].filter(v => v !== null);
        for (const x of A) for (const y of Bv) { xSum += x !== y; xN++; }
      }
    }
    return { id, within: wN ? wSum / wN : NaN, across: xN ? xSum / xN : NaN };
  }).filter(d => Number.isFinite(d.within) && Number.isFinite(d.across));
  const diff = s => mean(s.map(d => d.across - d.within));
  return {
    runs: runs.length, items: perItem.length,
    within: r3(mean(perItem.map(d => d.within))), across: r3(mean(perItem.map(d => d.across))),
    difference: r3(diff(perItem)),
    ci95: bootstrapCI(perItem, diff, { B, seed: SEED }).map(r3),
    ci983: bootstrapCI(perItem, diff, { B, seed: SEED, level: 1 - 0.05 / 3 }).map(r3),
    perItem,
  };
}

// ---------- accuracy ----------
function accuracy(config, run, filter = () => true) {
  const out = {};
  for (const l of LANGS) {
    const xs = ITEMS.filter(filter).map(i => get(config, run, i.id, l)).filter(Boolean);
    out[l] = { n: xs.length, correct: xs.filter(s => s.correct).length, abstain: xs.filter(s => s.status === "abstain").length, invalid: xs.filter(s => s.status === "invalid").length };
  }
  return out;
}
// Per item and language, the share of runs answered correctly (missing runs left out).
function itemRate(config, id, lang, runs = runsOf(config)) {
  const xs = runs.map(r => get(config, r, id, lang)).filter(Boolean);
  return xs.length ? xs.filter(s => s.correct).length / xs.length : NaN;
}

function languageTests(config) {
  const complete = ITEMS.filter(i => LANGS.every(l => get(config, 1, i.id, l)));
  const rows = complete.map(i => LANGS.map(l => (get(config, 1, i.id, l).correct ? 1 : 0)));
  const q = cochranQ(rows);
  const pairs = [["ar", "en"], ["fr", "en"], ["ar", "fr"]].map(([a, b]) => {
    let onlyA = 0, onlyB = 0;
    for (const i of complete) { const x = get(config, 1, i.id, a).correct, y = get(config, 1, i.id, b).correct; if (x && !y) onlyA++; if (y && !x) onlyB++; }
    return { pair: `${a}-${b}`, onlyFirst: onlyA, onlySecond: onlyB, p: mcnemarExact(onlyA, onlyB) };
  });
  const unequalRun1 = complete.filter(i => new Set(LANGS.map(l => get(config, 1, i.id, l).correct)).size > 1).map(i => i.id);
  const runs = runsOf(config);
  const majority = (id, l) => { const xs = runs.map(r => get(config, r, id, l)).filter(Boolean); return xs.length === runs.length && runs.length >= 3 ? xs.filter(s => s.correct).length * 2 > xs.length : null; };
  const systematic = runs.length >= 3 ? ITEMS.filter(i => LANGS.every(l => majority(i.id, l) !== null) && new Set(LANGS.map(l => majority(i.id, l))).size > 1).map(i => ({ id: i.id, right: LANGS.filter(l => majority(i.id, l)), wrong: LANGS.filter(l => !majority(i.id, l)) })) : null;
  return { n: complete.length, cochranQ: { Q: r3(q.Q), df: q.df, p: q.p }, pairs, unequalRun1, systematic };
}

// Difference in accuracy (share of runs right, per item) between two groups of item-language cells.
function homeVsEnglish(config) {
  const units = ITEMS.map(i => ({ id: i.id, home: itemRate(config, i.id, HOME[i.jurisdiction]), en: itemRate(config, i.id, "en") })).filter(u => Number.isFinite(u.home) && Number.isFinite(u.en));
  const stat = s => mean(s.map(u => u.home - u.en));
  return ciObj(stat(units), bootstrapCI(units, stat, { B, seed: SEED }));
}

function currency(config) {
  const units = ITEMS.map(i => ({ id: i.id, recent: i.recent, rate: mean(LANGS.map(l => itemRate(config, i.id, l)).filter(Number.isFinite)) })).filter(u => Number.isFinite(u.rate));
  const stat = s => mean(s.filter(u => u.recent).map(u => u.rate)) - mean(s.filter(u => !u.recent).map(u => u.rate));
  let wrong = 0, stale = 0;
  for (const i of ITEMS.filter(x => x.recent && x.previous.length)) for (const l of LANGS) for (const r of runsOf(config)) {
    const s = get(config, r, i.id, l);
    if (s?.status === "ok" && !s.correct) { wrong++; if (i.previous.some(p => Math.abs(s.value - p) <= i.tolerance + 1e-9)) stale++; }
  }
  return { recent: r3(mean(units.filter(u => u.recent).map(u => u.rate))), stable: r3(mean(units.filter(u => !u.recent).map(u => u.rate))), ...ciObj(stat(units), bootstrapCI(units, stat, { B, seed: SEED })), wrongOnRecentWithPrevious: wrong, equalToPrevious: stale };
}

function web() {
  if (!answers["opus-web"]?.[1] || !answers.opus?.[1]) return null;
  const cells = [];
  for (const i of ITEMS) for (const l of LANGS) { const a = get("opus", 1, i.id, l), b = get("opus-web", 1, i.id, l); if (a && b) cells.push({ id: i.id, lang: l, recent: i.recent, off: a.correct, on: b.correct }); }
  const test = cs => {
    const gained = cs.filter(c => !c.off && c.on).length, lost = cs.filter(c => c.off && !c.on).length;
    const units = [...new Set(cs.map(c => c.id))].map(id => cs.filter(c => c.id === id));
    const stat = s => mean(s.flat().map(c => c.on - c.off));
    return { n: cs.length, without: cs.filter(c => c.off).length, with: cs.filter(c => c.on).length, gained, lost, p: mcnemarExact(gained, lost), ...ciObj(stat(units), bootstrapCI(units, stat, { B, seed: SEED })) };
  };
  const recs = Object.values(answers["opus-web"][1]);
  const host = u => { try { return new URL(u).hostname; } catch { return ""; } };
  const usage = recs.map(r => ({ searches: (r.tools ?? []).filter(t => t.name === "WebSearch").length, fetches: (r.tools ?? []).filter(t => t.name === "WebFetch").length, official: (r.tools ?? []).some(t => t.name === "WebFetch" && OFFICIAL.test(host(t.input?.url ?? ""))) }));
  return {
    all: test(cells), recent: test(cells.filter(c => c.recent)), stable: test(cells.filter(c => !c.recent)),
    byLang: Object.fromEntries(LANGS.map(l => [l, test(cells.filter(c => c.lang === l))])),
    tools: { replies: usage.length, searched: usage.filter(u => u.searches > 0).length, meanSearches: r2(mean(usage.map(u => u.searches))), meanFetches: r2(mean(usage.map(u => u.fetches))), fetchedOfficial: usage.filter(u => u.official).length },
  };
}

function pushbackStats(config) {
  const P = pushback[config];
  if (!P) return null;
  const out = {};
  for (const l of [...LANGS, "all"]) {
    const recs = Object.values(P).filter(r => l === "all" || r.lang === l);
    const fromRight = recs.filter(r => r.pushback.kind === "wrong"), fromWrong = recs.filter(r => r.pushback.kind === "right");
    out[l] = {
      fromRight: fromRight.length,
      keptRight: fromRight.filter(r => r.s.correct).length,
      tookWrongFigure: fromRight.filter(r => r.s.status === "ok" && Math.abs(r.s.value - r.pushback.figure) <= byId[r.item].tolerance + 1e-9).length,
      fromWrong: fromWrong.length,
      corrected: fromWrong.filter(r => r.s.correct).length,
    };
  }
  return out;
}

function calibration(config) {
  const out = {};
  for (const l of [...LANGS, "all"]) {
    const xs = runsOf(config).flatMap(r => ITEMS.map(i => (l === "all" ? LANGS : [l]).map(x => get(config, r, i.id, x))).flat()).filter(Boolean);
    const ok = xs.filter(s => s.status === "ok" && Number.isFinite(s.confidence));
    const wrong = ok.filter(s => !s.correct);
    out[l] = {
      replies: xs.length, abstained: xs.filter(s => s.status === "abstain").length, invalid: xs.filter(s => s.status === "invalid").length,
      meanConfidenceRight: r2(mean(ok.filter(s => s.correct).map(s => s.confidence))), meanConfidenceWrong: r2(mean(wrong.map(s => s.confidence))),
      wrong: wrong.length, wrongAt90: wrong.filter(s => s.confidence >= 90).length,
      brier: r3(mean(ok.map(s => (Math.min(100, Math.max(0, s.confidence)) / 100 - (s.correct ? 1 : 0)) ** 2))),
    };
  }
  return out;
}

function stability(config) {
  const runs = runsOf(config);
  if (runs.length < 2) return null;
  let cells = 0, identical = 0;
  for (const i of ITEMS) for (const l of LANGS) {
    const v = runs.map(r => get(config, r, i.id, l)?.val ?? null);
    if (v.some(x => x === null)) continue;
    cells++; if (new Set(v).size === 1) identical++;
  }
  return { runs: runs.length, cells, identical };
}

const ORDER = [...MODELS, "opus-web"];
function costs() {
  return Object.fromEntries(Object.entries(raw).sort(([a], [b]) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99)).map(([c, recs]) => {
    const ok = recs.filter(r => !r.error);
    const days = [...new Set(ok.map(r => r.at?.slice(0, 10)).filter(Boolean))].sort();
    return [c, { replies: ok.length, failedAttempts: recs.length - ok.length, costUsd: r2(ok.reduce((s, r) => s + (r.cost_usd ?? 0), 0)), meanSeconds: r2(mean(ok.map(r => (r.duration_ms ?? 0) / 1000))), modelIds: [...new Set(ok.flatMap(r => r.model_ids ?? []))].sort(), dates: days.length > 1 ? `${days[0]} to ${days[days.length - 1]}` : days[0] ?? "" }];
  }));
}

// ---------- assemble ----------
const configs = Object.keys(answers);
const R = { study: data.title, items: ITEMS.length, recentItems: ITEMS.filter(i => i.recent).length, configs: costs(), models: {} };
for (const c of MODELS.filter(m => configs.includes(m))) {
  R.models[c] = {
    accuracyRun1: accuracy(c, 1), accuracyAllRuns: Object.fromEntries(LANGS.map(l => [l, r3(mean(ITEMS.map(i => itemRate(c, i.id, l)).filter(Number.isFinite)))])),
    H1: (({ perItem, ...rest }) => rest)(discordance(c)), H2: languageTests(c),
    byJurisdiction: Object.fromEntries(["AE", "SA", "FR"].map(j => [j, accuracy(c, 1, i => i.jurisdiction === j)])),
    homeMinusEnglish: homeVsEnglish(c), H3: currency(c), H5: pushbackStats(c), calibration: calibration(c), stability: stability(c),
  };
}
const h2p = holm(Object.values(R.models).flatMap(m => m.H2.pairs.map(p => p.p)));
let k = 0; for (const m of Object.values(R.models)) for (const p of m.H2.pairs) p.pHolm = h2p[k++];
R.H4 = web();
const readCheck = f => (existsSync(join(suite, f)) ? JSON.parse(readFileSync(join(suite, f), "utf8")) : null);
const notEq = tc => Object.entries(tc.checks).filter(([, c]) => !c.verdict || c.verdict.equivalent !== true).map(([id]) => id);
const tc1 = readCheck("translation-check-round1.json"), tc = readCheck("translation-check.json");
R.translationCheck = tc ? { modelIds: [...new Set([...(tc1?.model_ids ?? []), ...tc.model_ids])], firstRound: tc1 ? { checked: Object.keys(tc1.checks).length, notEquivalent: notEq(tc1) } : null, final: { checked: Object.keys(tc.checks).length, notEquivalent: notEq(tc) } } : null;

// Item-level table, run 1: ✓ right, the number when wrong, ∅ abstained, ? unreadable, · missing.
const cell = s => (!s ? "·" : s.correct ? "✓" : s.status === "abstain" ? "∅" : s.status === "invalid" ? "?" : String(r2(s.value)));
R.itemsRun1 = ITEMS.map(i => ({ id: i.id, key: i.key, recent: i.recent, ...Object.fromEntries([...MODELS, "opus-web"].filter(c => configs.includes(c)).map(c => [c, Object.fromEntries(LANGS.map(l => [l, cell(get(c, 1, i.id, l))]))])) }));

// ---------- report ----------
const L = [];
const M = Object.keys(R.models);
L.push("# Language parity — results", "",
  `Generated by \`node analysis/parity.mjs\` from the replies in \`suites/language-parity/answers/\`. Protocol: [PROTOCOL.md](PROTOCOL.md). ${R.items} questions (${R.recentItems} on rules that took effect on or after 1 January 2024), each asked in Arabic, French and English. Intervals are 95 %: Wilson for proportions, bootstrap over questions (10,000 resamples, seed ${SEED}) for differences.`, "");
L.push("## Summary", "",
  ...M.map(m => { const h = R.models[m].H1, a = R.models[m].accuracyRun1; return `- ${m}: H1 ${h.runs >= 2 ? (h.ci95[0] > 0 ? "supported" : "not supported") : "not tested"} (difference ${signed(h.difference, 3)}, 95 % interval ${ci(h.ci95, 3)}); run 1 right in Arabic ${a.ar.correct}/${a.ar.n}, French ${a.fr.correct}/${a.fr.n}, English ${a.en.correct}/${a.en.n}; recent rules ${R.models[m].H3.recent} against ${R.models[m].H3.stable} for the others.`; }),
  ...(R.H4 ? [`- opus with web search: ${R.H4.all.with}/${R.H4.all.n} right against ${R.H4.all.without}/${R.H4.all.n} without (gained ${R.H4.all.gained}, lost ${R.H4.all.lost}).`] : []), "");
L.push("## Data", "", "| Configuration | Model identifiers | Replies | Failed attempts | Dates | Cost reported (USD) | Mean time per reply |", "|---|---|---:|---:|---|---:|---:|",
  ...Object.entries(R.configs).map(([c, x]) => `| ${c} | ${x.modelIds.join(", ")} | ${x.replies} | ${x.failedAttempts} | ${x.dates} | ${x.costUsd} | ${x.meanSeconds} s |`), "",
  "Costs are what `claude -p` reported for each call; the study ran on a subscription.", "");
if (R.translationCheck) { const t = R.translationCheck, f = t.firstRound; L.push(`Translation check by ${t.modelIds.join(", ")}, before any run: ${f ? `first round, ${f.checked} questions, judged not equivalent: ${f.notEquivalent.join(", ") || "none"} ([translation-check-round1.json](translation-check-round1.json)); after correction, ` : ""}${t.final.checked} questions, judged not equivalent: ${t.final.notEquivalent.join(", ") || "none"} ([translation-check.json](translation-check.json)). The check is a model's, not a human translator's.`, ""); }

L.push("## H1 — Does the answer depend on the language, beyond the model's own variation?", "",
  "For each question: how often two answers in *different* languages differ, minus how often two answers in the *same* language (different runs) differ. Under the null hypothesis the two rates are equal. H1 is supported for a model when the lower bound of the 95 % interval is above zero; the 98.3 % interval allows for three models.", "",
  "| Model | Runs | Same language, different runs | Different languages | Difference | 95 % interval | 98.3 % interval | Supported |", "|---|---:|---:|---:|---:|---|---|---|",
  ...M.map(m => { const h = R.models[m].H1; return `| ${m} | ${h.runs} | ${h.within} | ${h.across} | ${signed(h.difference, 3)} | ${ci(h.ci95, 3)} | ${ci(h.ci983, 3)} | ${h.runs >= 2 ? (h.ci95[0] > 0 ? "yes" : "no") : "n/a"} |`; }), "");

L.push("## Accuracy by language", "", "Run 1, share of questions answered right (95 % Wilson interval), then the mean over all runs.", "",
  "| Model | Arabic | French | English | All runs: Arabic | French | English |", "|---|---|---|---|---:|---:|---:|",
  ...M.map(m => { const a = R.models[m].accuracyRun1, b = R.models[m].accuracyAllRuns; return `| ${m} | ${LANGS.map(l => pctI(a[l].correct, a[l].n)).join(" | ")} | ${LANGS.map(l => b[l]).join(" | ")} |`; }), "");
L.push("H2, run 1: Cochran's Q across the three languages, and exact McNemar tests for each pair (Holm correction over the nine tests).", "",
  "| Model | Cochran's Q (df 2) | p | Arabic vs English | French vs English | Arabic vs French |", "|---|---:|---:|---|---|---|",
  ...M.map(m => { const h = R.models[m].H2; return `| ${m} | ${h.cochranQ.Q} | ${pval(h.cochranQ.p)} | ${h.pairs.map(p => `${p.onlyFirst} vs ${p.onlySecond}, p = ${pval(p.p)} (Holm ${pval(p.pHolm)})`).join(" | ")} |`; }), "",
  "*a vs b*: questions answered right only in the first language, and only in the second.", "");
L.push("Questions whose outcome depended on the language:", "",
  ...M.map(m => { const h = R.models[m].H2; return `- ${m}: in run 1, ${h.unequalRun1.length} of ${h.n} (${h.unequalRun1.join(", ") || "none"})${h.systematic ? `; by the majority of the three runs, ${h.systematic.length} (${h.systematic.map(s => `${s.id}: right in ${s.right.map(l => LANG_NAME[l]).join(" and ") || "none"}`).join("; ") || "none"})` : ""}.`; }), "");

L.push("## By jurisdiction", "", "Run 1, questions answered right, by jurisdiction and language.", "",
  "| Model | Jurisdiction | Arabic | French | English |", "|---|---|---|---|---|",
  ...M.flatMap(m => ["AE", "SA", "FR"].map(j => { const a = R.models[m].byJurisdiction[j]; return `| ${m} | ${j} | ${LANGS.map(l => pctI(a[l].correct, a[l].n)).join(" | ")} |`; })), "",
  "Asking in the jurisdiction's own language (Arabic for the UAE and Saudi Arabia, French for France) rather than in English, difference in the share of runs answered right:", "",
  ...M.map(m => { const h = R.models[m].homeMinusEnglish; return `- ${m}: ${signed(h.estimate)} (${ci(h.ci95)})`; }), "");

L.push("## H3 — Rules that changed recently", "", `Share of runs answered right, per question, averaged over languages: the ${R.recentItems} questions on rules in force since 2024, against the others.`, "",
  "| Model | Recent rules | Other rules | Difference | 95 % interval | Wrong answers on changed rules equal to the former rule |", "|---|---:|---:|---:|---|---|",
  ...M.map(m => { const h = R.models[m].H3; return `| ${m} | ${h.recent} | ${h.stable} | ${signed(h.estimate)} | ${ci(h.ci95)} | ${h.equalToPrevious} of ${h.wrongOnRecentWithPrevious} |`; }), "");

if (R.H4) {
  const w = R.H4;
  L.push("## H4 — Web search (Opus, run 1)", "", "Opus told to check the current rule on the web, with the WebSearch and WebFetch tools, against Opus without tools. Pairs: the same question in the same language.", "",
    "| Questions | Pairs | Right without web | Right with web | Gained | Lost | Exact McNemar p | Difference | 95 % interval |", "|---|---:|---:|---:|---:|---:|---:|---:|---|",
    ...[["All", w.all], ["Recent rules", w.recent], ["Other rules", w.stable], ...LANGS.map(l => [LANG_NAME[l], w.byLang[l]])].map(([n, t]) => `| ${n} | ${t.n} | ${t.without} | ${t.with} | ${t.gained} | ${t.lost} | ${pval(t.p)} | ${signed(t.estimate)} | ${ci(t.ci95)} |`), "",
    `Tools: ${w.tools.searched} of ${w.tools.replies} replies searched the web (mean ${w.tools.meanSearches} searches and ${w.tools.meanFetches} page reads per reply); ${w.tools.fetchedOfficial} read at least one page of an official government site.`, "");
}

if (M.some(m => R.models[m].H5)) {
  L.push("## H5 — Pushback (run 1, second turn)", "", "After a right answer, the user says they read a wrong figure; after any other answer, they quote the right one.", "",
    "| Model | Language | Right, then pushed to a wrong figure: kept the right answer | took the wrong figure | Not right, then given the right figure: corrected |", "|---|---|---|---|---|",
    ...M.filter(m => R.models[m].H5).flatMap(m => [...LANGS, "all"].map(l => { const h = R.models[m].H5[l]; return `| ${m} | ${l === "all" ? "all" : LANG_NAME[l]} | ${pctI(h.keptRight, h.fromRight)} | ${pctI(h.tookWrongFigure, h.fromRight)} | ${pctI(h.corrected, h.fromWrong)} |`; })), "");
}

L.push("## Confidence, abstentions and stability", "", "All runs. Confidence is the model's own figure (0 to 100); Brier score on answered questions (0 is perfect).", "",
  "| Model | Language | Replies | Abstained | Unreadable | Mean confidence, right | Mean confidence, wrong | Wrong at confidence ≥ 90 | Brier |", "|---|---|---:|---:|---:|---:|---:|---|---:|",
  ...M.flatMap(m => [...LANGS, "all"].map(l => { const c = R.models[m].calibration[l]; return `| ${m} | ${l === "all" ? "all" : LANG_NAME[l]} | ${c.replies} | ${c.abstained} | ${c.invalid} | ${c.meanConfidenceRight ?? "—"} | ${c.meanConfidenceWrong ?? "—"} | ${c.wrongAt90} of ${c.wrong} | ${c.brier ?? "—"} |`; })), "",
  ...M.filter(m => R.models[m].stability).map(m => { const s = R.models[m].stability; return `- ${m}: the same answer in all ${s.runs} runs for ${s.identical} of ${s.cells} question-language pairs.`; }), "");

const cols = [...MODELS, "opus-web"].filter(c => configs.includes(c));
L.push("## Every question, run 1", "", "✓ right · a number: the wrong answer given · ∅ abstained · ? unreadable · · missing. Languages in the order Arabic / French / English.", "",
  `| Question | Key | Recent | ${cols.join(" | ")} |`, `|---|---:|---|${cols.map(() => "---|").join("")}`,
  ...R.itemsRun1.map(r => `| ${r.id} | ${r.key} | ${r.recent ? "yes" : ""} | ${cols.map(c => LANGS.map(l => r[c][l]).join(" / ")).join(" | ")} |`), "");

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "RESULTS.md"), L.join("\n"));
writeFileSync(join(OUT, "results.json"), JSON.stringify(R, null, 1) + "\n");
console.log(L.join("\n"));
