# Study A — protocol

Draft of 4 November 2026, to be reviewed by the author and registered on OSF before any reading is
collected. After registration, every change is listed under "Deviations" with its date and reason.

**Working title.** Unanimous machines, divided lawyers? How AI contract reviewers read the edges of a
playbook, and whether a team's rulings change it.

## 1. Questions and hypotheses

| | Question | Hypothesis | Test |
|---|---|---|---|
| RQ1 | On edge items, do AI reviewers from different providers agree with one another more than lawyers do? | H1: agreement among AI families exceeds agreement among lawyers | Krippendorff's alpha (nominal, routing), difference AI minus lawyers, 95 % bootstrap interval over questions; supported if its lower bound is above 0 |
| RQ2 | Where do the two groups part? | H2 (descriptive): on some questions the modal AI routing differs from the modal lawyers' routing; on some, lawyers split while AI families are unanimous | Shares with 95 % Wilson intervals; list of the questions concerned |
| RQ3 | Do a team's rulings carry over to new wordings without reaching other cases? | H3a: accuracy against the team key on held-out wordings rises after the rulings. H3b: accuracy on guard items does not fall by more than 10 points | H3a: exact McNemar per AI family, Holm correction; pooled difference with a cluster bootstrap over questions. H3b: lower bound of the 95 % bootstrap interval of the difference above −0.10 |
| RQ4 | How stable is each AI family across runs and wordings? | Exploratory | Alpha within family, across runs and across wordings |

## 2. Design

Every item is read by every reader. Lawyers read each item once, with the playbook only. AI
configurations read each item three times with the playbook only ("before"), and three times with the
playbook and the team's rulings ("after"), the second condition on held-out wordings, controls and
guards only.

Roles are separated:

- **The author** writes the items, runs the AI configurations and analyses the data. He does not read
  as a panel member.
- **The panel** (at least five lawyers) reads every item blind and independently.
- **The team's General Counsel** is one experienced in-house lawyer who is not on the panel. After
  seeing the panel's and the AI readings of wording A only, they write the team key for each question
  and the rulings on the questions they choose. If no such person can be found before registration,
  the key is the panel's modal reading on wording A, and this choice is registered.

## 3. Material

- **Playbook.** The pilot playbook of a fictional Dubai company (`suites/nda-boundary/playbook.md`),
  extended to at least eight positions; English, with French and Arabic translations for the subset
  below.
- **Questions.** At least 40, at least four per playbook position. Each in three wordings: A (seen by
  the General Counsel), B and C (held out). B and C are written by a second person, not the author, so
  that the held-out wordings do not share the author's habits.
- **Guards and controls.** At least ten guard items (cases a ruling must not change) and five controls
  (one clean NDA, the others plainly outside the playbook).
- **Languages.** All items in English. At least twelve questions also in French and Arabic, translated
  by bilingual lawyers and checked by a second one.
- **Private set.** A random third of the questions, with all their wordings, is never published, so
  that future models cannot be trained on it. Only scores on it are published.

## 4. Readers

**Lawyers.** A law degree and either three years of practice in contracts, judicial experience, or
doctoral research in contract or commercial law. Recruited through the author's professional network
in Tunisia, France and the Gulf; target five to ten. Each reader gets the items in a random order,
reads alone, and declares not using any AI tool while reading.

**AI configurations.** At least four families: Anthropic (Claude), OpenAI (GPT), Google (Gemini) and
one open-weight family. The same task text for all; default sampling settings; three runs per item and
condition. Model name, version, interface and date are recorded for every run. Where no API is
available at no cost, the chat interface is used through the runner's paste mode, and this is
recorded.

## 5. What is measured

- A reading is a routing (GREEN, YELLOW or RED) and a set of issue codes (`annotation/codebook.md`).
- Agreement is computed on the routing (primary) and on the exact reading (secondary).
- Accuracy against the team key: the reading equals the key exactly.
- A lawyer's confidence (1 to 5) and reasons are recorded and published with the readings.
- For an AI family, the modal routing over its three runs stands for the family; ties are recorded as
  "split".

## 6. Analysis

- Software: `analysis/stats.mjs`, checked against published worked examples (`tests/stats.test.mjs`).
- Bootstrap: 10,000 resamples of questions, seed fixed and published.
- AI answers that cannot be parsed form their own category, "invalid", and are reported.
- Missing lawyers' readings are left missing; Krippendorff's alpha handles them.
- All results are reported, whether or not they support the hypotheses.

## 7. Sample size

The study is sized for precision, not power. With 40 questions, a proportion of 0.80 has a 95 %
interval of about 65 to 90 %; with the pilot's 10 it was 49 to 94 %. Five lawyers and four AI families
on 40 questions give 200 human and 480 AI readings per condition.

## 8. Ethics and data

Readers give informed consent (`annotation/consent.md`). Readings are published under a pseudonym;
names appear in the acknowledgements only with consent. A reader may withdraw until the analysis
starts. No personal data beyond a professional profile is collected. The author checks with MANAR
University whether review by an ethics committee is required, before registration. Items (except the
private set), readings, rulings and code are published under CC BY 4.0 and MIT.

## 9. Timeline

| Date | Step |
|---|---|
| 25 November 2026 | Registration on OSF |
| 1 December 2026 to 10 January 2027 | Readings by the panel and the AI configurations |
| 20 January 2027 | Analysis |
| 28 January 2027 | Submission to ICAIL 2027 (date from two conference listings; to be confirmed on the official call) |

## 10. Deviations

None yet.

## 11. Use of AI

This protocol was drafted with Claude (Anthropic) under the author's direction, and is reviewed and
registered by the author.
