// tamyiz — a legal team's internal case law. A ruling answers one question of interpretation of the
// team's playbook, once, with its reasons; it then binds every reviewer, human or AI. Rulings carry
// their date, the playbook positions and the legal facts they rest on, and a status, so that a
// change in the playbook or in the law flags the rulings to review — to confirm, overturn or retire.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

export const STATUSES = ["in_force", "overturned", "retired"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Checks every ruling: required fields, dates, statuses, references to rulings that exist. */
export function validateCaselaw(cl) {
  const errors = [];
  const ids = new Set();
  for (const r of cl.rulings ?? []) {
    const where = r.id ?? "(no id)";
    for (const f of ["id", "date", "question", "holding", "reasons", "positions", "status"]) if (r[f] == null || r[f] === "" || (Array.isArray(r[f]) && !r[f].length && f !== "reasons")) errors.push(`${where}: ${f} is missing`);
    if (ids.has(r.id)) errors.push(`${where}: duplicate id`);
    ids.add(r.id);
    if (r.date && !ISO.test(r.date)) errors.push(`${where}: date must be YYYY-MM-DD`);
    if (r.status && !STATUSES.includes(r.status)) errors.push(`${where}: status must be one of ${STATUSES.join(", ")}`);
    if (r.status === "overturned" && !r.overturned_by) errors.push(`${where}: an overturned ruling names the ruling that overturned it`);
    for (const lf of r.law ?? []) if (!lf.source) errors.push(`${where}: every legal fact it rests on needs a source`);
  }
  for (const r of cl.rulings ?? []) {
    if (r.overturned_by && !ids.has(r.overturned_by)) errors.push(`${r.id}: overturned_by ${r.overturned_by} does not exist`);
    for (const s of r.supersedes ?? []) if (!ids.has(s)) errors.push(`${r.id}: supersedes ${s}, which does not exist`);
  }
  return { ok: errors.length === 0, errors };
}

/** The rulings that bind on a date: issued on or before it, and still in force. */
export function inForce(cl, date = new Date().toISOString().slice(0, 10)) {
  return (cl.rulings ?? []).filter(r => r.status === "in_force" && r.date <= date);
}

/** The binding rulings as text, ready to sit under the playbook in any tool's instructions. */
export function compileInstructions(cl, date) {
  const rs = inForce(cl, date);
  if (!rs.length) return "";
  return [
    `## Rulings of the General Counsel — binding (${cl.team})`,
    "",
    "Each ruling settles how the playbook applies to a question it did not answer on its own. Apply the holding to every document it covers, whatever the wording.",
    "",
    ...rs.flatMap(r => [`- **${r.id} (${r.date}) — ${r.question}** ${r.holding}`]),
    "",
  ].join("\n");
}

/**
 * Which rulings to review after a change: of a playbook position (e.g. "term"), or of a legal fact
 * (by its source id, e.g. "uae-cta-2025-art340"). Returns the rulings in force that rest on it.
 */
export function affectedBy(cl, change) {
  return inForce(cl, "9999-12-31").filter(r => (change.position && (r.positions ?? []).includes(change.position)) || (change.source && (r.law ?? []).some(l => l.source === change.source)));
}

/** Overturns a ruling with a new one (a revirement): the old one stays in the record, with its successor. */
export function overturn(cl, oldId, newRuling) {
  const rulings = cl.rulings.map(r => (r.id === oldId ? { ...r, status: "overturned", overturned_by: newRuling.id } : r));
  return { ...cl, rulings: [...rulings, { ...newRuling, supersedes: [...(newRuling.supersedes ?? []), oldId], status: "in_force" }] };
}
