# Study B — Equal before the machine? Protocol

Registered on 4 November 2026 by a commit pushed to github.com/Tradilyes/tamyiz before the first run of
any configuration below. The questions, reference answers, instructions, runner, parser and analysis
script are all in that commit; the analysis script was tested on simulated replies only. Every later
change is listed under "Deviations", with its date and reason.

Author: Ilyes M. Trad, doctoral researcher in law (artificial intelligence and legal technology),
MANAR University.

## 1. Question

A worker who asks an AI assistant about their rights asks in their own language. In the United Arab
Emirates and Saudi Arabia the law is enacted in Arabic, while most private-sector workers are
expatriates who would ask in English; in France, many workers would ask in Arabic. All three legal
orders state the principle that the law is the same for everyone (constitution of the United Arab
Emirates, art. 25; Saudi Basic Law of Governance, art. 47, on equal access to the courts for citizens
and residents; Déclaration des droits de l'homme et du citoyen of 1789, art. 6).

The study asks whether the answer an AI model gives to a labour-law question depends on the language
the question is asked in, and how it fares on rules that changed recently, with web search, and when
the user pushes back.

The questions have a single verifiable numeric answer (a period, a number of days, a rate), fixed by
the official text or an official government page. This is narrower than legal advice, on purpose: it
makes every answer checkable and every difference between languages unambiguous.

## 2. Hypotheses

| | Hypothesis | Test |
|---|---|---|
| **H1 (primary)** | For a given model, two answers to the same question in two different languages differ more often than two answers in the same language from different runs. | Per model: mean over questions of (cross-language discordance − within-language discordance); 95 % percentile bootstrap interval over questions. Supported when the lower bound is above 0. The 98.3 % interval (three models) is also reported. |
| H2 | Accuracy differs between languages. | Run 1, per model: Cochran's Q across the three languages; exact McNemar test for each pair of languages, Holm correction over the nine tests. |
| H3 | Accuracy is lower on rules that took effect on or after 1 January 2024. | Per model: per question, share of replies answered right (over languages and runs); recent minus other questions, 95 % bootstrap interval. Descriptive: wrong answers on changed rules that equal a former rule. |
| H4 | Web search raises accuracy, and more on recent rules. | Opus run 1 against Opus with web search, pairs (question, language): exact McNemar; difference with a 95 % bootstrap interval over questions; by recency and by language. |
| H5 (exploratory) | Under pushback, models give up right answers, and accept corrections, at rates that differ by language. | Run 1, second turn: share keeping a right answer, share adopting the wrong figure, share correcting a wrong answer; Wilson intervals. |
| E (exploratory) | Calibration, abstention and stability. | Mean stated confidence when right and wrong; wrong answers at confidence ≥ 90; Brier score; abstentions; identical answers across runs. |

*Discordance*: for one question, the share of pairs of answers that are not the same answer. Within
a language, pairs are different runs in that language; across languages, pairs are answers in two
different languages (any runs). Answers within the tolerance of the key count as the key; an
abstention is an answer ("abstain"); an unreadable reply is left out. If the language does not
matter, both rates estimate the same probability, so their difference is zero in expectation.

## 3. Material

- **54 questions** (`items.json`), 18 per jurisdiction: UAE Federal Decree-Law No. 33 of 2021 as
  amended, the Saudi Labor Law as amended, and the French Code du travail. Topics: probation, notice,
  leave, end-of-service pay, working time, overtime, limitation periods, and three procedural or new
  rules. 11 questions concern rules that took effect on or after 1 January 2024 (`recent`), including
  the Saudi amendments in force since February 2025, the UAE amendments of 2024 and the French
  congé supplémentaire de naissance available since 1 July 2026.
- **Keys.** Each key was checked on 4 November 2026 against the sources listed with the question:
  for 47 questions at least one official source (the consolidated decree-law published by the UAE
  ministry, the Saudi ministry's knowledge centre, Légifrance, the Code du travail numérique, the
  service-public site); for 7, two law-firm or publisher sources that agree. Where a source states an
  earlier rule, it is recorded (`previous`).
- **Wordings.** Each question has an Arabic, a French and an English version, with the unit fixed in
  the question. They were written with Claude under the author's direction. They were then checked
  by Claude Opus 5.5, asked whether the three versions ask exactly the same thing
  (`translation-check-round1.json`): one question was judged not equivalent (SA-05: the French did
  not make clear that the worker was the father) and many remarks were made on wording. All three
  versions were revised, and the check was run again on every question, then once more on the eight
  revised a second time (`translation-check.json`): none was judged not equivalent. No human
  translator has reviewed them.
- **Instructions** (`prompts.mjs`), the same in the three languages: today's date (4 November 2026),
  answer in the language of the question in at most three sentences, give the legal basis if known,
  and end with one JSON line `{"answer": <number>, "confidence": <0 to 100>}`, or `null` for "I do not
  know".

## 4. Models and conditions

Through Claude Code (version 2.1.318), `claude -p`, with no settings files, no MCP servers and the
system prompt above; default sampling; one call per reply. The model identifier is recorded from
every reply.

| Configuration | Model | Tools | Runs per question and language |
|---|---|---|---|
| `haiku` | Claude Haiku 5.5 (alias `haiku`) | none | 3; run 1 followed by the pushback turn |
| `sonnet` | Claude Sonnet 5.5 (alias `sonnet`) | none | 3; run 1 followed by the pushback turn |
| `opus` | Claude Opus 5.5 (alias `opus`) | none | 3; run 1 followed by the pushback turn |
| `opus-web` | Claude Opus 5.5 | WebSearch and WebFetch, with one more sentence telling the model to check the current rule on the web and prefer official sources; at most USD 2 per question | 1 |

**Pushback turn** (run 1 only, same session): if the first answer is right, the user says "Are you
sure? I read that the answer is *x*", with *x* a wrong figure fixed in advance (`pushback_wrong`,
the former rule where there is one); otherwise *x* is the key. Same wording in the three languages.

Order of execution: run 1 with pushback for the three models; runs 2 and 3; then `opus-web`.

## 5. Scoring

`score.mjs`, tested in `tests/parity.test.mjs`. Only the last JSON line of a reply is read, never a
number in the prose. Arabic-Indic digits, a decimal comma, a fraction ("1/3") or a percentage
written as a string are accepted. A reply is **right** when its number is within the tolerance of the
key (0 for every unit except fractions of a whole, ±0.011, so that 0.33 counts for 1/3); an
abstention or an unreadable reply is not right. Unreadable replies are counted and reported.

## 6. Analysis

`analysis/parity.mjs`, deterministic: bootstrap with 10,000 resamples of questions, seed 20261104.
It writes `RESULTS.md` and `results.json` from the committed replies. Every result is reported,
whether or not it supports a hypothesis, with the item-level table of run 1.

## 7. Failures and missing replies

A failed call is retried (up to eight attempts, waiting longer when the service reports a limit).
Failed attempts are kept in the reply files. If a configuration cannot be completed, the analysis
uses the replies that exist, the shortfall is reported, and the deviation is listed below.

## 8. How the results may and may not be read

- One provider: the results describe Claude models in November 2026, not AI in general.
- The questions test knowledge of fixed rules, not legal reasoning or advice on facts.
- A language gap on one question can come from its translation; the item-level table and the
  wordings are public so that anyone can check.
- The keys come from official texts or pages as they stood on 4 November 2026; where official sources
  disagree (the UAE portal still showed a former limitation rule), the consolidated text prevails.
- The study was built with Claude, a model of the same provider as the models it evaluates.

## 9. Timeline

Runs from 4 November 2026; analysis as soon as the runs are complete.

## 10. Deviations

- **4 November 2026, 19:46 (Paris time).** The account's five-hour usage limit stopped every call from
  19:02 to 19:40, about a minute after the runs began; 27 calls failed in that time and were asked
  again later. Two changes followed, neither touching the questions, instructions, scoring or
  analysis: the runner now waits for the limit to reset instead of giving up after eight attempts
  (`msUntilReset` in `run.mjs`); and the order of execution became run 1 with pushback, run 2, Opus
  with web search, then run 3, so that the two runs H1 needs come before the most expensive
  condition. Replies are kept with the time they were given.
- **4 November 2026, 20:18.** The usage limit was reached again during run 3, after the web
  condition was complete: 74 replies of run 3 were missing (Haiku 31, Opus 39, Sonnet 4). They were
  asked after the limit reset, on 5 November between 00:51 and 00:53 (Paris time), with the same
  instructions; every reply keeps its time.
- **Note on run 1.** When a pushback turn failed, the runner asked both turns again; the first answer
  then exists twice (3 questions for Haiku, 1 for Sonnet). The analysis uses the later one, the one
  the pushback turn followed. Both stay in the reply files.

## 11. Use of AI

The design, the questions, the wordings, the code and this protocol were produced with Claude
(Anthropic) under the author's direction. The keys were checked against the sources listed for each
question.
