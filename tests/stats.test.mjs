// Each statistic against a published worked example, a textbook critical value or an identity.
import { test } from "node:test";
import assert from "node:assert/strict";
import { wilson, mcnemarExact, fleissKappa, krippendorffAlphaNominal, countMatrix, fmt, chiSquareSurvival, cochranQ, holm, bootstrapCI } from "../analysis/stats.mjs";

const close = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test("Wilson interval: 8/10 and 10/10", () => {
  const [lo, hi] = wilson(8, 10);
  close(lo, 0.490); close(hi, 0.943);
  const [lo2, hi2] = wilson(10, 10);
  close(lo2, 0.722); assert.equal(hi2, 1);
  assert.equal(fmt(8, 10), "8/10 (49–94 %)");
});

test("exact McNemar: two changes in the same direction prove nothing", () => {
  assert.equal(mcnemarExact(2, 0), 0.5);
  assert.equal(mcnemarExact(0, 0), 1);
  close(mcnemarExact(10, 0), 2 / 1024, 1e-9);
  close(mcnemarExact(6, 1), 0.125, 1e-9);
});

test("Fleiss' kappa: the worked example of 10 items, 14 readers, 5 categories (kappa = 0.210)", () => {
  const counts = [
    [0, 0, 0, 0, 14], [0, 2, 6, 4, 2], [0, 0, 3, 5, 6], [0, 3, 9, 2, 0], [2, 2, 8, 1, 1],
    [7, 7, 0, 0, 0], [3, 2, 6, 3, 0], [2, 5, 3, 2, 2], [6, 5, 2, 1, 0], [0, 2, 2, 3, 7],
  ];
  close(fleissKappa(counts), 0.210);
  assert.equal(fleissKappa([[3, 0], [3, 0]]), null);
});

test("Krippendorff's alpha, nominal: the worked example with missing data (alpha = 0.743)", () => {
  const A = [1, 2, 3, 3, 2, 1, 4, 1, 2, null, null, null];
  const B = [1, 2, 3, 3, 2, 2, 4, 1, 2, 5, null, 3];
  const C = [null, 3, 3, 3, 2, 3, 4, 2, 2, 5, 1, null];
  const D = [1, 2, 3, 3, 2, 4, 4, 1, 2, 5, 1, null];
  const units = A.map((_, i) => [A[i], B[i], C[i], D[i]]);
  close(krippendorffAlphaNominal(units), 0.743);
  assert.equal(krippendorffAlphaNominal([["x", "x"], ["x", "x"]]), null);
});

test("count matrix from readings", () => {
  const { categories, counts } = countMatrix([["G", "G", "Y"], ["R", "R", "R"]]);
  assert.deepEqual(categories, ["G", "R", "Y"]);
  assert.deepEqual(counts, [[2, 0, 1], [0, 3, 0]]);
});

test("chi-square survival: textbook critical values and the closed form for 2 df", () => {
  assert.ok(Math.abs(chiSquareSurvival(3.841458820694124, 1) - 0.05) < 1e-7);
  assert.ok(Math.abs(chiSquareSurvival(5.991464547107979, 2) - 0.05) < 1e-7);
  assert.ok(Math.abs(chiSquareSurvival(7.814727903251178, 3) - 0.05) < 1e-7);
  assert.ok(Math.abs(chiSquareSurvival(30.57791416689249, 15) - 0.01) < 1e-7);
  assert.ok(Math.abs(chiSquareSurvival(4.2, 2) - Math.exp(-2.1)) < 1e-12);
  assert.equal(chiSquareSurvival(0, 2), 1);
});

test("Cochran's Q equals McNemar's chi-square when there are two conditions", () => {
  // 3 pairs (1,0), 7 pairs (0,1), 5 pairs (1,1), 5 pairs (0,0): McNemar chi-square (7 − 3)² / 10 = 1.6.
  const rows = [...Array(3).fill([1, 0]), ...Array(7).fill([0, 1]), ...Array(5).fill([1, 1]), ...Array(5).fill([0, 0])];
  const r = cochranQ(rows);
  assert.ok(Math.abs(r.Q - 1.6) < 1e-12);
  assert.equal(r.df, 1);
});

test("Cochran's Q on a worked example with three conditions", () => {
  // Column totals 5, 3, 2; row totals 2, 1, 3, 0, 2, 2: Q = 2 (3·38 − 100) / (30 − 22) = 3.5, p = exp(−1.75).
  const r = cochranQ([[1, 1, 0], [1, 0, 0], [1, 1, 1], [0, 0, 0], [1, 0, 1], [1, 1, 0]]);
  assert.ok(Math.abs(r.Q - 3.5) < 1e-12);
  assert.ok(Math.abs(r.p - Math.exp(-1.75)) < 1e-12);
  assert.deepEqual(cochranQ([[1, 1, 1], [0, 0, 0]]), { Q: 0, df: 2, p: 1 });
});

test("Holm adjustment", () => {
  assert.deepEqual(holm([0.01, 0.04, 0.03]).map(x => Math.round(x * 1e6) / 1e6), [0.03, 0.06, 0.06]);
  assert.deepEqual(holm([0.5]), [0.5]);
});

test("bootstrap: reproducible with a seed, and the interval brackets the mean", () => {
  const xs = [0, 1, 1, 0, 1, 1, 1, 0, 1, 1];
  const mean = s => s.reduce((a, b) => a + b, 0) / s.length;
  const a = bootstrapCI(xs, mean, { B: 2000, seed: 7 }), b = bootstrapCI(xs, mean, { B: 2000, seed: 7 });
  assert.deepEqual(a, b);
  assert.ok(a[0] <= 0.7 && 0.7 <= a[1] && a[0] >= 0 && a[1] <= 1);
  const ys = [0.1, 0.5, 0.9, 1.3, 2.2, 0.7, 3.1, 0.2, 1.8, 0.4];
  assert.notDeepEqual(bootstrapCI(ys, mean, { B: 2000, seed: 8 }), bootstrapCI(ys, mean, { B: 2000, seed: 7 }));
});
