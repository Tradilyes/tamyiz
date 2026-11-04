# Paper outline — Study A

Target: ICAIL 2027, Vienna, 5–9 July 2027; paper deadline 28 January 2027 according to two conference
listings (beri.net, myhuiban.com). Confirm the date, the page limit and the format on the official call
of the International Association for Artificial Intelligence and Law before writing to length.

**Working title.** Unanimous machines, divided lawyers? AI contract reviewers at the edges of a playbook.

## 1. Introduction (1 page)

- The practice: legal teams hand their playbooks to AI reviewers; 78 % of in-house lawyers in one vendor
  survey would delegate a first contract review to an agent under supervision.
- The problem: a playbook has an open texture. Who decides the edge cases when an AI applies it?
- The claim to test: AI reviewers of different providers agree with one another where lawyers do not,
  and so settle questions nobody has decided.
- Contributions: (1) a method that keeps lawyers' disagreement as data; (2) the measurement on N
  questions, M lawyers, K model families; (3) a test of team rulings as a remedy; (4) open items, except
  a private set.

## 2. Background (1.5 pages)

- Open texture and interpretation as decision: Hart; Kelsen; Troper. The unifying role of a court of
  cassation, and the request for an opinion from the French Cour de cassation (to be written by the
  author, with the exact legal references).
- Language models and legal interpretation: Arbel and Hoffman 2024; Purushothama et al. 2025; Waldon et
  al. 2025.
- Correlated errors and monoculture: Kim et al. 2025.
- Disagreement as data: Cabitza, Campagner and Basile 2023; precedents as alignment: Chen and Zhang 2025.
- Legal benchmarks with single answers: LegalBench, ContractNLI, ArabLegalEval.

## 3. Method (2 pages)

As registered (PROTOCOL.md): items, panel, AI configurations, conditions, measures, analysis. Report
every deviation.

## 4. Results (2 pages)

- Agreement among lawyers and among AI families (H1), with intervals.
- Where the groups part (H2): the list of questions, with the lawyers' dissents quoted.
- Rulings (H3): held-out wordings and guards.
- Stability across runs and wordings (RQ4).

## 5. Discussion (1.5 pages)

- Who interprets when an AI applies a rule: the provider by default, the team by ruling.
- Practice: verification duties in court guidance (DIFC Courts guidance note no. 2 of 2023; the ADGM
  costs order in *Arabyads Holding v Alam* [2025] ADGMCFI 0032; QICDRC practice direction no. 1 of 2026);
  UNESCO guidelines for courts (December 2025). To be checked on the primary texts before citing.
- Limits: one contract type, a fictional company, a panel of convenience, models that change.

## 6. Ethics, data and use of AI (0.5 page)

Consent, pseudonyms, private set, licences; the AI-use statement of the README.

## Pilot material that may be reported

Only as motivation, with its limits: `analysis/PILOT.md`.
