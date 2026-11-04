# Study C — Divided judges, unanimous machines? Design note

Draft of 4 November 2026, **not registered**. The protocol will be registered here, with the corpus,
before any run (target: 30 November 2026).

## Question

When qualified judges disagree on the meaning of a contract clause, do AI models converge on one
reading anyway, and on whose? The pilot of this repository found four AI configurations unanimous on all
ten borderline clauses, and twice unanimous against the key the author had set himself. Study C
replaces that key with a reference no one in this project wrote: the reasoned disagreement of courts,
in published decisions.

## Why French cassation decisions

French law draws the line this study needs. The judge may not interpret a clear and precise clause
(Code civil, art. 1192: "On ne peut interpréter les clauses claires et précises à peine de
dénaturation"); an ambiguous clause is interpreted according to the parties' common intention (art.
1188 and following), and that interpretation belongs to the trial judges' *pouvoir souverain*. The
Cour de cassation therefore produces two kinds of decisions on the meaning of a clause:

- **Type D, distortion.** The court quashes because the court below distorted a clause it holds clear:
  two courts read the same words differently, and the higher one holds that they bear one meaning.
- **Type S, sovereign interpretation.** The court rejects a ground of distortion because the clause
  was ambiguous and had to be interpreted: the parties, and often the courts below, read it
  differently, and the highest court holds that the text alone does not settle it.

Each decision states the clause (usually verbatim), the readings and the reasons. The disagreement is
recorded by judges, under their duty to give reasons, before any AI was asked.

## Items

One item per decision: the clause as quoted, the question in dispute in neutral terms (for example,
"Does this clause cover a sale to a subsidiary?"), the reading of each court, the type (D or S), the
chamber and date. Names and amounts are removed. Inclusion: decisions of the civil and commercial
chambers published from 2020 onwards, with the clause quoted verbatim; target 40 to 60 items, balanced
between types D and S. Each question in two wordings, in French with English and Arabic versions, so
that the study also tests the language effect of Study B on interpretation rather than on fixed rules.

## What is measured

- Type D: how often the models read the clause as the Cour de cassation did, rather than as the court
  below.
- Type S: how often the models say that the clause is ambiguous, and how often they give one reading
  with high stated confidence.
- Convergence: on each item, agreement across runs, wordings, languages and models, compared between
  type S (where judges split) and type D.

Planned hypotheses, to be fixed at registration: on type S clauses, the models give one confident
reading in most replies, closing a question the courts held open; on type D clauses, they follow the
Cour de cassation more often than the court below.

## Sources and constraints

Decisions of the Cour de cassation are public (courdecassation.fr; the Judilibre API is published on
data.gouv.fr under an open licence). Only French decisions are used, none connected with the author's
functions. The study runs with the means of Study B: Claude models through `claude -p`, keys taken
from the decisions themselves, analysis code committed before the runs.
