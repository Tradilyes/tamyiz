// tamyiz — language parity. Reads the number at the end of an answer, and scores it against the key.
// The parser is strict on purpose: it reads only the final JSON line the instructions ask for, never
// a number from the prose. It accepts the forms a model may produce in any of the three languages:
// Arabic-Indic digits, a decimal comma, a fraction or a percentage written as a string.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

const DIGITS = { "٠": 0, "١": 1, "٢": 2, "٣": 3, "٤": 4, "٥": 5, "٦": 6, "٧": 7, "٨": 8, "٩": 9, "۰": 0, "۱": 1, "۲": 2, "۳": 3, "۴": 4, "۵": 5, "۶": 6, "۷": 7, "۸": 8, "۹": 9 };

export function normaliseDigits(s) {
  return String(s ?? "")
    .replace(/[٠-٩۰-۹]/g, d => String(DIGITS[d]))
    .replace(/٫/g, ".") // Arabic decimal separator
    .replace(/٬/g, "") // Arabic thousands separator
    .replace(/[“”«»]/g, '"');
}

/** A number from a JSON value: a number, or a string such as "0,5", "1/3", "25%" or "50 000". */
export function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = normaliseDigits(v).trim().replace(/%$/, "").replace(/[\s  ]/g, "");
  const frac = s.match(/^(-?\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
  if (frac) { const d = Number(frac[2].replace(",", ".")); return d ? Number(frac[1].replace(",", ".")) / d : null; }
  s = s.replace(",", ".");
  return /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : null;
}

/**
 * The answer at the end of a reply.
 *   { status: "ok", value, confidence }   a number
 *   { status: "abstain", confidence }     the model wrote null: it said it does not know
 *   { status: "invalid" }                 no readable JSON line
 */
export function parseAnswer(text) {
  const s = normaliseDigits(text);
  const objects = s.match(/\{[^{}]*"answer"[^{}]*\}/g);
  if (!objects) return { status: "invalid" };
  const last = objects[objects.length - 1];
  let answer, confidence;
  try {
    const j = JSON.parse(last);
    answer = j.answer;
    confidence = j.confidence;
  } catch {
    // Not valid JSON, most often because of a decimal comma: {"answer": 0,5, "confidence": 80}.
    const a = last.match(/"answer"\s*:\s*(null|"[^"]*"|-?\d+(?:[.,]\d+)?(?:\/\d+)?)/);
    if (!a) return { status: "invalid" };
    answer = a[1] === "null" ? null : a[1].startsWith('"') ? a[1].slice(1, -1) : a[1];
    const c = last.match(/"confidence"\s*:\s*"?(-?\d+(?:[.,]\d+)?)/);
    confidence = c ? c[1] : undefined;
  }
  const conf = confidence === undefined || confidence === null ? null : toNumber(typeof confidence === "number" ? confidence : String(confidence));
  if (answer === null || answer === undefined || answer === "") return { status: "abstain", confidence: conf };
  const value = toNumber(typeof answer === "number" ? answer : String(answer));
  if (value === null) return { status: "invalid", confidence: conf };
  return { status: "ok", value, confidence: conf };
}

export function isCorrect(parsed, item) {
  return parsed.status === "ok" && Math.abs(parsed.value - item.key) <= item.tolerance + 1e-9;
}

/**
 * What an answer is, for comparing two answers: the number (any answer within the tolerance of the
 * key counts as the key, so that 0.33 and 0.333 are the same answer), "abstain", or null when
 * unreadable.
 */
export function answerValue(parsed, item) {
  if (isCorrect(parsed, item)) return item.key;
  if (parsed.status === "ok") return Math.round(parsed.value * 1e4) / 1e4;
  if (parsed.status === "abstain") return "abstain";
  return null;
}
