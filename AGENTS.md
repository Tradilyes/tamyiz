# Working with tamyiz (for coding agents and assistants)

- A ruling is data: `caselaw/<team>/rulings.json`. Check a file with `validateCaselaw` (engine/caselaw.mjs).
  Never edit a ruling's holding in place: overturn it with a new ruling (`overturn`), so the record keeps both.
- To give any AI tool the team's case law, use `compileInstructions(caselaw, date)` and put the text under the
  playbook in that tool's instructions (for Claude for Legal: in the practice profile, under the NDA triage positions).
- To find questions: run every reviewer on the edge NDAs (`suites/nda-boundary/run.mjs --condition before`), then
  `--report`. A split reading is a question; so is a unanimous reading that differs from the team's position.
- Keys and rulings are fixed before the runs that test them: commit them first, then run.
- Tests: `node --test tests/*.test.mjs`. The engine has no dependencies; keep it that way.
