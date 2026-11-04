# Changes

## 0.2.0 — 4 November 2026

- The repository becomes the home of a research programme. README rewritten as a research report:
  question, method, pilot with 95 % intervals, related work, references, use of AI. French and Arabic
  pages are now summaries of the English text.
- `analysis/`: statistics (Wilson interval, exact McNemar test, Fleiss' kappa, Krippendorff's alpha),
  each checked against a published worked example; re-analysis of the pilot from the committed answers
  (`analysis/PILOT.md`).
- `PROTOCOL.md`: the protocol of Study A, to be registered on OSF before any reading.
- `annotation/`: instructions in English and French, codebook, reading form, consent text;
  `spec/reading.schema.json` and `spec/adjudicated-item.schema.json`.
- `paper/`: outline and checked references; `NOTE-METHODOLOGIQUE.md`: the plan of the note the author
  writes himself.
- Corrected: the keys and rulings of the pilot were committed locally before the runs, which is not
  proof to a third party; the pages now say so. Removed `AGENTS.md`.

## 0.1.0 — 2 November 2026

- Case law engine: rulings with their question, holding, reasons, playbook positions, legal facts and status;
  validation, rulings in force on a date, compiled instructions for any AI tool, the rulings to review after a
  change of position or of law, overturning that keeps the record (`engine/caselaw.mjs`).
- Disagreement finder: readings of several reviewers, case by case, with the codes in dispute and pairwise
  agreement (`engine/mine.mjs`).
- Boundary NDA suite: ten questions of interpretation in two wordings, two controls and three guards; keys fixed
  before any run (`suites/nda-boundary/`).
- First measurement: four reviewers (Claude Opus 5.5 alone and running Claude for Legal's NDA Triager, Claude
  Sonnet 5.5 alone, Claude Haiku 5.5 with courtproof), before and after two rulings of the fictional team's
  General Counsel.
- The NDA desk: a page for claude.ai where Claude reviews NDAs with courtproof's checks as its tools, questions
  go to the General Counsel, rulings bind every later review, and edge probes show how Claude reads the playbook
  (`desk/`).
