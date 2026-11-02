# Changes

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
