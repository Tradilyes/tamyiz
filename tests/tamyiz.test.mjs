// tamyiz — tests. Run: node --test tests/*.test.mjs
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { CASES, CODES, PATTERNS, render } from "../suites/nda-boundary/cases.mjs";
import { mine, score, signature } from "../engine/mine.mjs";
import { validateCaselaw, inForce, compileInstructions, affectedBy, overturn } from "../engine/caselaw.mjs";
import { loadCaselaw } from "../engine/caselaw-file.mjs";

const caselaw = loadCaselaw(new URL("../caselaw/gulf-horizon/rulings.json", import.meta.url));

test("the suite: ten patterns in two wordings, controls and guards, keys with known codes", () => {
  assert.equal(PATTERNS.length, 10);
  assert.equal(CASES.filter(c => c.split === "mine").length, 10);
  assert.equal(CASES.filter(c => c.split === "test").length, 10);
  assert.equal(CASES.filter(c => c.split === "control").length, 5);
  for (const c of CASES) {
    for (const k of c.key.issues) assert.ok(CODES.includes(k), `${c.id}: ${k}`);
    const text = render(c);
    assert.match(text, /^MUTUAL NON-DISCLOSURE AGREEMENT/);
    assert.ok(text.length > 2500, c.id);
  }
  // Each variant really changes the base text, and the two wordings of a pattern differ.
  const base = render(CASES.find(c => c.id === "C1"));
  for (const p of PATTERNS) {
    const a = render(CASES.find(c => c.id === `${p.id}A`)), b = render(CASES.find(c => c.id === `${p.id}B`));
    assert.notEqual(a.replace(/between[\s\S]*?\(the "Counterparty"\)/, ""), base.replace(/between[\s\S]*?\(the "Counterparty"\)/, ""), `${p.id}A changes the NDA`);
    assert.notEqual(a, b, `${p.id}: two wordings`);
  }
});

test("mining: unanimity, readings, codes in dispute, pairwise agreement", () => {
  const answers = {
    x: { a: { classification: "RED", issues: [{ code: "PERPETUAL" }] }, b: { classification: "GREEN", issues: [] } },
    y: { a: { classification: "RED", issues: [{ code: "perpetual" }, { code: "TERM_TOO_LONG" }] }, b: { classification: "GREEN", issues: [] } },
    z: { a: null, b: { classification: "GREEN", issues: [] } },
  };
  const m = mine(answers, ["a", "b"]);
  assert.equal(m.unanimous, 1);
  const a = m.cases.find(c => c.id === "a");
  assert.equal(a.readings.length, 3);
  assert.deepEqual(a.disputedCodes, ["TERM_TOO_LONG"]);
  assert.equal(a.routingInDispute, false);
  assert.equal(signature(answers.y.a), "RED|PERPETUAL,TERM_TOO_LONG");
  assert.equal(Math.round(m.pairwiseRate * 100), 50);
  assert.deepEqual(score(answers.y.a, { classification: "RED", issues: ["PERPETUAL"] }), { routing: true, exact: false, missed: [], extra: ["TERM_TOO_LONG"] });
});

test("case law: valid, in force by date, compiled for any tool, dependencies, overturning", () => {
  assert.deepEqual(validateCaselaw(caselaw), { ok: true, errors: [] });
  assert.equal(inForce(caselaw, "2026-11-01").length, 0, "nothing before its date");
  assert.equal(inForce(caselaw, "2026-11-02").length, 2);
  const text = compileInstructions(caselaw, "2026-11-02");
  assert.match(text, /R-2026-01/);
  assert.match(text, /binding/);
  assert.deepEqual(affectedBy(caselaw, { position: "survival" }).map(r => r.id), ["R-2026-02"]);
  const next = overturn(caselaw, "R-2026-01", { id: "R-2026-03", date: "2026-12-01", question: "q", holding: "h", reasons: "r", positions: ["term"] });
  assert.equal(next.rulings.find(r => r.id === "R-2026-01").status, "overturned");
  assert.deepEqual(next.rulings.find(r => r.id === "R-2026-03").supersedes, ["R-2026-01"]);
  assert.deepEqual(inForce(next, "2026-12-31").map(r => r.id), ["R-2026-02", "R-2026-03"]);
  assert.equal(validateCaselaw(next).ok, true);
  const broken = { rulings: [{ id: "R-1", date: "2 Nov", question: "q", holding: "h", reasons: "r", positions: ["term"], status: "maybe", law: [{}] }] };
  const v = validateCaselaw(broken);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /date/.test(e)) && v.errors.some(e => /status/.test(e)) && v.errors.some(e => /source/.test(e)));
});

test("every ruling names the edge NDA it was decided on, and its examples exist", () => {
  for (const r of caselaw.rulings) for (const e of r.examples ?? []) assert.ok(CASES.some(c => c.id === e), `${r.id}: ${e}`);
});

test("the desk builds into one page whose scripts parse", { skip: !existsSync(new URL("../desk/artifact.html", import.meta.url)) }, () => {
  const page = readFileSync(new URL("../desk/artifact.html", import.meta.url), "utf8");
  assert.match(page, /<title>Tamyiz NDA Desk<\/title>/);
  const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 2);
  for (const s of scripts) assert.doesNotThrow(() => new Function(s));
  assert.doesNotMatch(page, /__BUNDLE__|__PLAYBOOK__/);
});
