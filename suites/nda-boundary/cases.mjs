// tamyiz — the "boundary NDA" suite: clauses a playbook does not settle on its own.
// Each pattern is a question of interpretation that a careful reader can answer two ways under the
// same playbook (bench playbook of Gulf Horizon Holding LLC, Dubai). Every pattern has two wordings:
// wording A is used to find the disagreements, wording B is held out to test whether a ruling on A
// carries over to a new text. Two control NDAs (one clean, one plainly wrong) check for drift.
// `key` is what the General Counsel's rulings (caselaw/gulf-horizon/rulings.json) decide.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

const US = "Gulf Horizon Holding LLC";

/** The clauses of a clean mutual NDA under the playbook; a variant replaces or adds one of them. */
const BASE = {
  intro: cp => `This Mutual Non-Disclosure Agreement (the "Agreement") is made on 3 November 2026 between ${US}, a limited liability company licensed in Dubai ("Gulf Horizon"), and ${cp} (the "Counterparty"), each a "Party".`,
  purpose: "The Parties wish to exchange information to evaluate a possible technology partnership (the \"Purpose\").",
  definition: "\"Confidential Information\" means all non-public information disclosed by a Party (the \"Disclosing Party\") to the other Party (the \"Receiving Party\") in connection with the Purpose, in writing, orally or by any other means, that is marked as confidential or would reasonably be understood to be confidential.",
  obligations: "Each Party, as Receiving Party, shall use the Disclosing Party's Confidential Information only for the Purpose and shall protect it with at least the care it gives its own confidential information, and no less than reasonable care.",
  exceptions: [
    "is or becomes publicly available through no fault of the Receiving Party;",
    "was lawfully known to the Receiving Party before its disclosure;",
    "is independently developed by the Receiving Party without use of the Confidential Information;",
    "is rightfully received from a third party without a duty of confidentiality;",
    "must be disclosed by law, regulation or court order, provided that the Receiving Party gives prompt notice where lawful.",
  ],
  permitted: "The Receiving Party may disclose Confidential Information to its employees, officers, affiliates, professional advisers and contractors who need to know it for the Purpose and are bound by confidentiality obligations no less protective than this Agreement.",
  returnClause: "On request, the Receiving Party shall return or destroy the Confidential Information, except copies it must keep by law and copies held in automatic back-up systems, which remain subject to this Agreement.",
  term: "This Agreement lasts for two (2) years from its date.",
  survival: "The obligations of confidentiality survive for three (3) years after the end of this Agreement.",
  remedies: "Each Party acknowledges that damages may not be an adequate remedy for a breach and that the Disclosing Party may seek injunctive relief.",
  extra: [],
  noOther: "Nothing in this Agreement obliges either Party to enter into any further agreement, and no licence is granted under any intellectual property right.",
  law: "This Agreement is governed by the laws of the Dubai International Financial Centre, and the DIFC Courts have exclusive jurisdiction over any dispute arising from it.",
  entire: "This Agreement is the entire agreement of the Parties on its subject matter. It is made in English.",
};

/** Patterns: the question, the playbook position it turns on, two wordings (A to mine, B held out). */
export const PATTERNS = [
  { id: "P1", position: "term", question: "Does a three-year term that renews automatically for one-year periods, unless a Party gives notice, exceed the three-year limit?",
    A: { term: "This Agreement has an initial term of three (3) years and renews automatically for successive periods of one (1) year unless either Party gives thirty (30) days' written notice of non-renewal." },
    B: { term: "This Agreement shall remain in force for thirty-six (36) months and shall thereafter be extended by successive twelve-month periods, unless a Party notifies the other in writing, at least one month before the end of the then-current period, that it does not wish to extend it." } },
  { id: "P2", position: "survival", question: "Is a protection of trade secrets for as long as they remain trade secrets a perpetual confidentiality obligation?",
    A: { survival: "The obligations of confidentiality survive for five (5) years after the end of this Agreement, except that information which constitutes a trade secret shall be protected for as long as it remains a trade secret under applicable law." },
    B: { survival: "Each Party's duties under the Obligations clause continue for a period of five (5) years after expiry or termination; for any Confidential Information that qualifies as a trade secret, those duties continue for so long as such information retains that status." } },
  { id: "P3", position: "exclusions", question: "Is the fifth standard exclusion present when disclosure required by law is excluded without any duty to notify the other Party?",
    A: { exception5: "must be disclosed by law, regulation or court order." },
    B: { exception5: "is required to be disclosed under any applicable law or by order of a competent authority." } },
  { id: "P4", position: "restrictions", question: "Is a narrow, mutual, time-limited covenant not to solicit staff met during the Purpose, with an exception for general advertisements, a non-solicitation covenant?",
    A: { extra: ["Non-solicitation. During the term of this Agreement and for twelve (12) months after it, neither Party shall solicit for employment any employee of the other Party with whom it had contact in connection with the Purpose, provided that general advertisements not targeted at such employees are not a breach."] },
    B: { extra: ["Staff. For one year after the date of this Agreement, each Party agrees not to approach, with a view to hiring, any member of the other Party's staff it has dealt with in relation to the Purpose; responses to public job postings are excluded."] } },
  { id: "P5", position: "restrictions", question: "Is a residuals clause limited to unaided memory, with no licence under patents or copyrights, a broad residuals clause?",
    A: { extra: ["Residuals. Nothing in this Agreement restricts either Party from using, for any purpose, ideas, concepts, know-how or techniques retained in the unaided memory of its personnel who had access to Confidential Information, provided that this does not grant any licence under patents or copyrights."] },
    B: { extra: ["Retained knowledge. Each Party may freely use general skills, knowledge and experience, including information retained in the unassisted memory of its employees, for any purpose; no licence under intellectual property rights is granted."] } },
  { id: "P6", position: "law", question: "Is arbitration seated in the DIFC or in Dubai, under an accepted governing law, an accepted forum?",
    A: { law: "This Agreement is governed by the laws of the Dubai International Financial Centre. Any dispute arising from it shall be finally resolved by arbitration under the Arbitration Rules of the Dubai International Arbitration Centre, seated in the DIFC." },
    B: { law: "The laws of the Emirate of Dubai and the federal laws of the United Arab Emirates govern this Agreement. Disputes shall be referred to arbitration administered by the Dubai International Arbitration Centre, with its seat in Dubai." } },
  { id: "P7", position: "remedies", question: "Is an amount fixed in advance for a breach, called agreed compensation and open to adjustment by the court, liquidated damages?",
    A: { remedies: "Each Party acknowledges that damages may not be an adequate remedy for a breach and that the Disclosing Party may seek injunctive relief. If a Party breaches the Obligations clause, it shall pay the other Party agreed compensation of AED 250,000, without prejudice to the court's power to adjust it under the applicable law." },
    B: { remedies: "The Disclosing Party may seek injunctive relief. The Parties agree in advance that a breach of confidentiality causes damage which they assess at AED 150,000, payable on demand by the breaching Party." } },
  { id: "P8", position: "return", question: "Does an exception for copies the law requires, without back-up copies, satisfy the return-or-destruction position?",
    A: { returnClause: "On request, the Receiving Party shall return or destroy all Confidential Information, except copies it must keep to comply with applicable law." },
    B: { returnClause: "Upon the Disclosing Party's written request, all Confidential Information shall be returned or destroyed, save to the extent retention is mandated by law or regulation." } },
  { id: "P9", position: "mutual", question: "Is an NDA titled mutual, under which only Gulf Horizon is bound while both Parties exchange information, unilateral?",
    A: { definition: "\"Confidential Information\" means all non-public information disclosed by the Counterparty to Gulf Horizon in connection with the Purpose, in writing, orally or by any other means.", obligations: "Gulf Horizon, as Receiving Party, shall use the Counterparty's Confidential Information only for the Purpose and shall protect it with no less than reasonable care.", permitted: "Gulf Horizon may disclose Confidential Information to its employees, officers, affiliates, professional advisers and contractors who need to know it for the Purpose and are bound by confidentiality obligations no less protective than this Agreement.", returnClause: "On request, Gulf Horizon shall return or destroy the Confidential Information, except copies it must keep by law and copies held in automatic back-up systems, which remain subject to this Agreement." },
    B: { definition: "In this Agreement, \"Recipient\" means Gulf Horizon and \"Discloser\" means the Counterparty. \"Confidential Information\" means all non-public information the Discloser provides to the Recipient in connection with the Purpose.", obligations: "The Recipient shall hold the Discloser's Confidential Information in confidence, use it only for the Purpose and protect it with no less than reasonable care.", permitted: "The Recipient may disclose Confidential Information to its employees, officers, affiliates, professional advisers and contractors who need to know it for the Purpose and are bound by confidentiality obligations no less protective than this Agreement.", returnClause: "On request, the Recipient shall return or destroy the Confidential Information, except copies it must keep by law and copies held in automatic back-up systems, which remain subject to this Agreement." } },
  { id: "P10", position: "law", question: "Is an accepted governing law combined with another accepted forum (English law, DIFC or ADGM Courts) acceptable?",
    A: { law: "This Agreement is governed by the laws of England and Wales, and the courts of the Dubai International Financial Centre have exclusive jurisdiction over any dispute arising from it." },
    B: { law: "English law governs this Agreement. The Parties submit to the exclusive jurisdiction of the ADGM Courts." } },
];

/** What the General Counsel's rulings decide for each pattern (both wordings). */
const KEYS = {
  P1: { classification: "GREEN", issues: [] },
  P2: { classification: "GREEN", issues: [] },
  P3: { classification: "GREEN", issues: [] },
  P4: { classification: "RED", issues: ["NON_SOLICIT"] },
  P5: { classification: "YELLOW", issues: ["RESIDUALS_BROAD"] },
  P6: { classification: "GREEN", issues: [] },
  P7: { classification: "RED", issues: ["LIQUIDATED_DAMAGES"] },
  P8: { classification: "YELLOW", issues: ["NO_RETENTION_EXCEPTION"] },
  P9: { classification: "RED", issues: ["UNILATERAL"] },
  P10: { classification: "GREEN", issues: [] },
};

const COUNTERPARTIES = ["Nordlicht Technologies GmbH", "Saqr Logistics LLC", "Brightwater Analytics Ltd", "Al Waha Foods Company", "Meridian Pharma Ltd", "Kyrenia Shipping Ltd", "Najm Industrial Company", "Helix Software Inc.", "Sahara Retail Group LLC", "Dhow Capital Partners Ltd", "Thames Engineering Ltd", "Corniche Medical LLC"];

export const CASES = [
  ...PATTERNS.flatMap((p, i) => ["A", "B"].map(w => ({
    id: `${p.id}${w}`, pattern: p.id, split: w === "A" ? "mine" : "test", cp: COUNTERPARTIES[(i * 2 + (w === "B" ? 1 : 0)) % COUNTERPARTIES.length],
    variant: p[w], key: KEYS[p.id],
  }))),
  { id: "C1", pattern: null, split: "control", cp: "Oasis Media FZ-LLC", variant: {}, key: { classification: "GREEN", issues: [] } },
  { id: "C2", pattern: null, split: "control", cp: "Falcon Security Systems LLC", variant: { survival: "The obligations of confidentiality survive indefinitely after the end of this Agreement." }, key: { classification: "RED", issues: ["PERPETUAL"] } },
];

export const CODES = ["UNILATERAL", "CARVEOUT_MISSING", "PERPETUAL", "NON_SOLICIT", "NON_COMPETE", "LIQUIDATED_DAMAGES", "TRANSLATION_MISMATCH", "TERM_TOO_LONG", "SURVIVAL_TOO_LONG", "RESIDUALS_BROAD", "NO_RETENTION_EXCEPTION", "GOVERNING_LAW"];

/** Renders the NDA of a case in English. */
export function render(c) {
  const v = { ...BASE, ...c.variant };
  const exceptions = [...BASE.exceptions];
  if (v.exception5) exceptions[4] = v.exception5;
  const out = ["MUTUAL NON-DISCLOSURE AGREEMENT", "", BASE.intro(c.cp), ""];
  let n = 0;
  const clause = (title, ...paras) => { n++; out.push(`${n}. ${title}`, "", ...paras.flatMap(p => [p, ""])); return n; };
  clause("Purpose", v.purpose);
  clause("Confidential Information", v.definition);
  const obligationsNo = clause("Obligations", v.obligations);
  n++;
  out.push(`${n}. Exceptions`, "", "The obligations in this Agreement do not apply to information that:", "", ...exceptions.flatMap((e, i) => [`${n}.${i + 1} ${e}`, ""]));
  clause("Permitted disclosures", v.permitted);
  clause("Return or destruction", v.returnClause);
  clause("Term and survival", `${v.term} ${v.survival}`);
  clause("Remedies", v.remedies);
  for (const x of v.extra ?? []) { const [title, ...rest] = x.split(". "); clause(title, rest.join(". ")); }
  clause("No other obligations", v.noOther);
  clause("Governing law and forum", v.law);
  clause("Entire agreement and language", v.entire);
  return out.join("\n").replace(/the Obligations clause/g, `clause ${obligationsNo} (Obligations)`);
}
