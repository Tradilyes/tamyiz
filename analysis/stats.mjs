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

/** A small seeded pseudo-random generator (mulberry32), so that every bootstrap can be reproduced. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Percentile bootstrap: resamples the units (here, questions) with replacement and returns the
 * central interval of stat(sample). Resamples where stat is not a number are dropped.
 */
export function bootstrapCI(units, stat, { B = 10000, seed = 20261104, level = 0.95 } = {}) {
  const rnd = mulberry32(seed), n = units.length, vals = [];
  if (!n) return [NaN, NaN];
  for (let b = 0; b < B; b++) {
    const s = new Array(n);
    for (let i = 0; i < n; i++) s[i] = units[Math.floor(rnd() * n)];
    const v = stat(s);
    if (Number.isFinite(v)) vals.push(v);
  }
  if (!vals.length) return [NaN, NaN];
  vals.sort((x, y) => x - y);
  const a = (1 - level) / 2;
  return [vals[Math.floor(a * vals.length)], vals[Math.min(vals.length - 1, Math.ceil((1 - a) * vals.length) - 1)]];
}

function lnGamma(x) {
  // Lanczos approximation (as in Numerical Recipes, gammln).
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const cj of c) ser += cj / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** Regularised lower incomplete gamma function P(a, x). */
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 0; n < 1000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  // Continued fraction for Q(a, x) (modified Lentz).
  let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}

/** P(X ≥ x) for a chi-square variable with df degrees of freedom. */
export function chiSquareSurvival(x, df) {
  if (!(x > 0)) return 1;
  return Math.min(1, Math.max(0, 1 - gammaP(df / 2, x / 2)));
}

/**
 * Cochran's Q test (Cochran 1950) for k related binary outcomes: rows[i][j] = 1 when subject i
 * succeeded under condition j. With k = 2 it equals McNemar's chi-square without continuity
 * correction. Returns { Q, df, p }, p from the chi-square distribution with k − 1 df.
 */
export function cochranQ(rows) {
  const k = rows[0]?.length ?? 0;
  const C = new Array(k).fill(0);
  let T = 0, sumR2 = 0;
  for (const r of rows) {
    const R = r.reduce((s, x) => s + x, 0);
    T += R; sumR2 += R * R;
    r.forEach((x, j) => (C[j] += x));
  }
  const den = k * T - sumR2;
  if (k < 2 || den === 0) return { Q: 0, df: k - 1, p: 1 };
  const Q = ((k - 1) * (k * C.reduce((s, c) => s + c * c, 0) - T * T)) / den;
  return { Q, df: k - 1, p: chiSquareSurvival(Q, k - 1) };
}

/** Holm's step-down adjustment of p-values (Holm 1979), returned in the original order. */
export function holm(ps) {
  const m = ps.length, order = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]), adj = new Array(m);
  let prev = 0;
  order.forEach(([p, i], r) => { prev = Math.min(1, Math.max(prev, (m - r) * p)); adj[i] = prev; });
  return adj;
}
