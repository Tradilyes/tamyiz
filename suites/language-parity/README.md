# Study B — Equal before the machine?

The same labour-law question, asked in Arabic, French and English: does the AI's answer depend on the
language? 54 questions on the labour law of the United Arab Emirates, Saudi Arabia and France, each
with one numeric answer checked against the official text or an official government page on
4 November 2026; 11 of them on rules that took effect since 2024. Three Claude models, three runs per
question and language, a pushback turn, and Opus with web search.

**In short:** no language effect beyond the models' own run-to-run variation; on the rules in force
since 2024, the two smaller models were often wrong, and always with the former rule; Opus was right
in every language, with one slip in 486 replies. Details and limits in the [main README](../../README.md#study-b--equal-before-the-machine)
and [RESULTS.md](RESULTS.md).

Status: **registered on 4 November 2026, before any run** ([PROTOCOL.md](PROTOCOL.md)); run from
19:01 that evening (first reply 29 seconds after the registration commit). The account's usage limit
interrupted the runs twice; the last 74 replies of run 3 were asked after it reset, on 5 November
between 00:51 and 00:53. 2,106 replies in all. Results in [RESULTS.md](RESULTS.md), generated from the
replies committed in `answers/`. The deviations, on the
order and timing of the runs only, are listed in the protocol. In the web condition, Claude Code reads web pages with Claude
Haiku 5.5, which is why that model also appears in its replies.

| File | Content |
|---|---|
| [PROTOCOL.md](PROTOCOL.md) | Questions, hypotheses, conditions, scoring and analysis, fixed before the runs |
| [items.json](items.json) | The 54 questions in three languages, keys, tolerance, former rules, sources consulted |
| [prompts.mjs](prompts.mjs) | The instructions and the pushback turn, in the three languages |
| [score.mjs](score.mjs) | The parser: reads only the final JSON line of a reply |
| [run.mjs](run.mjs) | The runner (`claude -p`); records every reply as given; prints progress only |
| [translation-check-round1.json](translation-check-round1.json), [translation-check.json](translation-check.json) | The model check of the three wordings, before and after correction |
| [../../analysis/parity.mjs](../../analysis/parity.mjs) | The analysis, deterministic |
| [observatory.mjs](observatory.mjs) | Study D: the questions on recent rules, asked again each month (`--month YYYY-MM`, `--report`) |

```
node suites/language-parity/run.mjs --prompt SA-04 --lang ar     # what the model receives
node suites/language-parity/run.mjs --config sonnet --run 1      # ask, with the pushback turn
node analysis/parity.mjs                                          # score and write RESULTS.md
```
