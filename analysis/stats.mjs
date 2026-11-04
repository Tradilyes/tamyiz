// Statistics for small evaluation studies: proportions with their uncertainty, paired before/after
// comparisons, and agreement between readers. No dependencies; every function is checked against a
// published worked example in tests/stats.test.mjs.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

/**
 * Wilson score interval for a proportion k/n (Wilson 1927). Behaves well for small n and for
 * proportions near 0 or 1, where the usual "p ± 1.96·SE" interval does not.
 */
export function wilson(k, n, z = 1.96) {
  if (!(n > 0)) return [NaN, NaN];
  const p = k / n, z2 = z * z, d = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / d;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / d;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/**
 * Exact McNemar test (two-sided) for paired binary outcomes. b = pairs that went from wrong to
 * right, c = pairs that went from right to wrong; pairs that did not change carry no information.
 */
export function mcnemarExact(b, c) {
  const m = b + c;
  if (m === 0) return 1;
  const lo = Math.min(b, c);
  let tail = 0;
  for (let i = 0; i <= lo; i++) tail += binom(m, i);
  return Math.min(1, (2 * tail) / 2 ** m);
}

function binom(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/**
 * Fleiss' kappa (Fleiss 1971). counts[i][j] = number of readers who put item i in category j;
 * every item must have the same number of readers. Returns null when kappa is undefined (every
 * reading in a single category).
 */
export function fleissKappa(counts) {
  const N = counts.length;
  if (!N) return null;
  const n = counts[0].reduce((s, x) => s + x, 0);
  if (counts.some(row => row.reduce((s, x) => s + x, 0) !== n)) throw new Error("fleissKappa: every item needs the same number of readers");
  if (n < 2) return null;
  const k = counts[0].length;
  const p = Array.from({ length: k }, (_, j) => counts.reduce((s, row) => s + row[j], 0) / (N * n));
  const Pi = counts.map(row => (row.reduce((s, x) => s + x * x, 0) - n) / (n * (n - 1)));
  const Pbar = Pi.reduce((s, x) => s + x, 0) / N;
  const Pe = p.reduce((s, x) => s + x * x, 0);
  return Pe === 1 ? null : (Pbar - Pe) / (1 - Pe);
}

/**
 * Krippendorff's alpha for nominal data (Krippendorff 2011, "Computing Krippendorff's
 * Alpha-Reliability"). units = array of arrays: the values the readers gave to one unit, with
 * null or undefined for a missing reading. Units with fewer than two readings are ignored.
 * Returns null when alpha is undefined (a single value in all the data).
 */
export function krippendorffAlphaNominal(units) {
  const o = new Map();
  const add = (a, b, w) => { const key = JSON.stringify([a, b]); o.set(key, (o.get(key) ?? 0) + w); };
  for (const unit of units) {
    const vals = unit.filter(v => v !== null && v !== undefined);
    const m = vals.length;
    if (m < 2) continue;
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) add(vals[i], vals[j], 1 / (m - 1));
  }
  const nc = new Map();
  let n = 0;
  for (const [key, w] of o) { const [a] = JSON.parse(key); nc.set(JSON.stringify(a), (nc.get(JSON.stringify(a)) ?? 0) + w); n += w; }
  if (nc.size < 2) return null;
  let disagreeObserved = 0;
  for (const [key, w] of o) { const [a, b] = JSON.parse(key); if (JSON.stringify(a) !== JSON.stringify(b)) disagreeObserved += w; }
  let disagreeExpected = 0;
  const totals = [...nc.entries()];
  for (const [a, na] of totals) for (const [b, nb] of totals) if (a !== b) disagreeExpected += na * nb;
  return 1 - ((n - 1) * disagreeObserved) / disagreeExpected;
}

/** Turns per-item readings into the count matrix fleissKappa expects. */
export function countMatrix(readings) {
  const cats = [...new Set(readings.flat())].sort();
  return { categories: cats, counts: readings.map(r => cats.map(c => r.filter(x => x === c).length)) };
}

/** "8/10 (49–94 %)": a proportion with its 95 % Wilson interval, for reports. */
export function fmt(k, n) {
  const [lo, hi] = wilson(k, n);
  return `${k}/${n} (${Math.round(lo * 100)}–${Math.round(hi * 100)} %)`;
}
