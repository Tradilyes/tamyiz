// tamyiz — finding the questions a playbook leaves open. Several independent reviewers (AI tools,
// or people) triage the same documents; wherever they do not reach the same answer, the playbook
// can be read two ways on that point. Each disagreement becomes a question for the General Counsel,
// listed with the competing readings and who held them. No model here: only the comparison.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

/** One reviewer's answer reduced to what a lawyer acts on: the routing and the set of issue codes. */
export function signature(answer) {
  if (!answer || !answer.classification) return "unanswered";
  const codes = [...new Set((answer.issues ?? []).map(i => String(i.code ?? i).trim().toUpperCase()))].sort();
  return `${String(answer.classification).toUpperCase()}|${codes.join(",")}`;
}

/** Reads a signature back into its routing and codes. */
export function readSignature(sig) {
  if (sig === "unanswered") return { classification: null, codes: [] };
  const [classification, codes] = sig.split("|");
  return { classification, codes: codes ? codes.split(",") : [] };
}

/**
 * Compares the reviewers case by case.
 * answers: { reviewerName: { caseId: answer } } — an answer is { classification, issues: [{code}] }.
 * Returns, for every case, the readings (groups of reviewers that agree) and, for the cases where they
 * differ, the codes in dispute: the codes some reviewers raised and others did not.
 */
export function mine(answers, caseIds) {
  const reviewers = Object.keys(answers);
  const cases = caseIds.map(id => {
    const groups = new Map();
    for (const r of reviewers) {
      const sig = signature(answers[r][id]);
      groups.set(sig, [...(groups.get(sig) ?? []), r]);
    }
    const readings = [...groups.entries()].map(([sig, who]) => ({ ...readSignature(sig), reviewers: who })).sort((a, b) => b.reviewers.length - a.reviewers.length);
    const answered = readings.filter(x => x.classification);
    const all = new Set(answered.flatMap(x => x.codes));
    const common = answered.length ? answered.map(x => new Set(x.codes)).reduce((a, b) => new Set([...a].filter(k => b.has(k)))) : new Set();
    const disputed = [...all].filter(k => !common.has(k)).sort();
    const routings = new Set(answered.map(x => x.classification));
    return { id, unanimous: readings.length === 1, readings, disputedCodes: disputed, routingInDispute: routings.size > 1 };
  });
  const pairs = [];
  for (let i = 0; i < reviewers.length; i++) for (let j = i + 1; j < reviewers.length; j++) {
    const a = reviewers[i], b = reviewers[j];
    const same = caseIds.filter(id => signature(answers[a][id]) === signature(answers[b][id])).length;
    pairs.push({ a, b, agree: same, of: caseIds.length });
  }
  return {
    reviewers,
    cases,
    unanimous: cases.filter(c => c.unanimous).length,
    questions: cases.filter(c => !c.unanimous),
    pairwise: pairs,
    pairwiseRate: pairs.length ? pairs.reduce((s, p) => s + p.agree, 0) / pairs.reduce((s, p) => s + p.of, 0) : 1,
  };
}

/** Accuracy of one reviewer against keys: right routing, and exactly the right codes. */
export function score(answer, key) {
  const sig = signature(answer), want = `${key.classification}|${[...key.issues].sort().join(",")}`;
  const got = readSignature(sig);
  return { routing: got.classification === key.classification, exact: sig === want, missed: key.issues.filter(k => !got.codes.includes(k)), extra: got.codes.filter(k => !key.issues.includes(k)) };
}
