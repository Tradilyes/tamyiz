// The answer parser of the language-parity study, on the forms a model may produce in each language.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAnswer, isCorrect, answerValue, toNumber } from "../suites/language-parity/score.mjs";
import { display } from "../suites/language-parity/prompts.mjs";

const item = (key, tolerance = 0) => ({ key, tolerance });

test("reads the final JSON line, not numbers in the prose", () => {
  assert.deepEqual(parseAnswer('The probation period may not exceed 6 months (Art. 9).\n{"answer": 6, "confidence": 90}'), { status: "ok", value: 6, confidence: 90 });
  assert.deepEqual(parseAnswer('Earlier rule: 1 year.\n{"answer": 1, "confidence": 40}\nOn reflection:\n{"answer": 2, "confidence": 85}'), { status: "ok", value: 2, confidence: 85 });
  assert.deepEqual(parseAnswer("La durée est de 2 mois."), { status: "invalid" });
  assert.deepEqual(parseAnswer('```json\n{"answer": 15, "confidence": 95}\n```'), { status: "ok", value: 15, confidence: 95 });
});

test("Arabic-Indic digits, a decimal comma, fractions and percentages", () => {
  assert.deepEqual(parseAnswer('المدة ستون يومًا.\n{"answer": ٦٠, "confidence": ٨٥}'), { status: "ok", value: 60, confidence: 85 });
  assert.deepEqual(parseAnswer('{"answer": 0,5, "confidence": 70}'), { status: "ok", value: 0.5, confidence: 70 });
  assert.equal(parseAnswer('{"answer": "1/3", "confidence": 60}').value, 1 / 3);
  assert.equal(parseAnswer('{"answer": "25%", "confidence": 80}').value, 25);
  assert.equal(parseAnswer('{"answer": "٢٫٥", "confidence": 80}').value, 2.5);
  assert.equal(toNumber("50 000"), 50000);
  assert.equal(toNumber("six"), null);
});

test("null is an abstention; a non-numeric answer is unreadable", () => {
  assert.deepEqual(parseAnswer('I am not sure.\n{"answer": null, "confidence": 0}'), { status: "abstain", confidence: 0 });
  assert.equal(parseAnswer('{"answer": "two months", "confidence": 50}').status, "invalid");
});

test("scoring, with the tolerance for fractions", () => {
  assert.equal(isCorrect(parseAnswer('{"answer": 0.33, "confidence": 70}'), item(0.3333, 0.011)), true);
  assert.equal(isCorrect(parseAnswer('{"answer": 0.3, "confidence": 70}'), item(0.3333, 0.011)), false);
  assert.equal(isCorrect(parseAnswer('{"answer": 30, "confidence": 70}'), item(30)), true);
  assert.equal(isCorrect(parseAnswer('{"answer": null, "confidence": 0}'), item(30)), false);
  assert.equal(answerValue(parseAnswer('{"answer": 0.333, "confidence": 70}'), item(0.3333, 0.011)), 0.3333);
  assert.equal(answerValue(parseAnswer('{"answer": null}'), item(1)), "abstain");
  assert.equal(answerValue(parseAnswer("no JSON"), item(1)), null);
});

test("figures quoted in the pushback turn", () => {
  const it = { display: { "0.3333": "1/3" } };
  assert.equal(display(it, 0.3333, "ar"), "1/3");
  assert.equal(display(it, 0.5, "fr"), "0,5");
  assert.equal(display(it, 0.5, "en"), "0.5");
});
