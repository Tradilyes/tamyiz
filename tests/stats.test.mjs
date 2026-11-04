// Each statistic against a published worked example.
import { test } from "node:test";
import assert from "node:assert/strict";
import { wilson, mcnemarExact, fleissKappa, krippendorffAlphaNominal, countMatrix, fmt } from "../analysis/stats.mjs";

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
