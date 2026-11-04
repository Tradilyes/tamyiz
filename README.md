# tamyiz

A research programme on how AI systems read legal rules, and on how a legal team can make them read
its rules its own way. It builds reference readings with a panel of lawyers, keeps their
disagreements, and measures AI systems against them, in English, French and Arabic.

Status: pilot done (2 November 2026); Study B, on whether the answer depends on the language of the
question, registered on 4 November 2026 before any run ([suites/language-parity/](suites/language-parity/));
Study A in preparation. Author: Ilyes M. Trad, doctoral researcher in law (artificial intelligence and legal technology),
MANAR University.

[Résumé en français](README.fr.md) · [ملخص بالعربية](README.ar.md)

## Question

A contract playbook tells a reviewer, human or AI, which clauses the organisation accepts. It cannot
settle every case. Legal theory has long described this open texture: some cases fall in a penumbra
where competent interpreters differ (Hart 1961), and choosing among the possible readings is a
decision rather than a discovery (Kelsen 1960; Troper 2001). Recent empirical work finds that large
language models answer questions of legal interpretation unstably and are at best moderately aligned
with human judgments (Purushothama et al. 2025; Waldon et al. 2025), and that different models tend
to make the same errors (Kim et al. 2025).

tamyiz asks two questions. Where qualified lawyers disagree on how a rule applies, do AI reviewers
from different providers converge on one reading anyway, closing the question without anyone having
decided it? And can a team's explicit rulings bring every reviewer to the team's reading, without
reaching cases the rulings were not written for?

## Method

1. Each position of a playbook is placed at its limit in short contract clauses ("edge items"), in two
   or three wordings.
2. A panel of lawyers reads every item blind and gives a routing, issue codes and reasons. Their
   disagreement is recorded, not settled by a vote: each item keeps its majority reading, its dissents
   and the reasons for both, in the spirit of perspectivist annotation (Cabitza et al. 2023).
3. AI reviewers from several providers read the same items, several times each, under the same
   instructions.
4. A team's rulings (short, reasoned decisions on the questions in dispute) are added to every
   reviewer's instructions and tested on held-out wordings, and on guard items they must not change.

## Pilot (2 November 2026)

Twenty-five NDAs at the edge of the playbook of a fictional Dubai company: ten questions of
interpretation in two wordings (A reviewed, B held out) and five controls, three of which guard
against a ruling reaching too far. Four reviewers, all from one provider: Claude Opus 5.5 with the
playbook; Claude Opus 5.5 running the NDA Triager of Anthropic's Claude for Legal; Claude Sonnet 5.5;
Claude Haiku 5.5 with the deterministic checks of courtproof, a companion repository not yet public.
One run per reviewer and condition.

| Measure | Result (95 % Wilson interval) |
|---|---|
| Edge items read the same way by the four reviewers | 10/10 (72–100 %) |
| Edge items read as the stipulated key | 8/10 (49–94 %) |
| Held-out wordings, each reviewer, before and after two rulings | 8/10 (49–94 %), then 10/10 (72–100 %); exact McNemar p = 0.50 |
| Controls and guards after the rulings, each reviewer | 5/5 (57–100 %) |

The four reviewers never disagreed with one another on the edge items. On two questions they all
departed from the stated intention of the fictional General Counsel: a three-year NDA that renews
unless a party gives notice, and the protection of trade secrets "for as long as they remain trade
secrets". Two rulings changed both readings for every reviewer, and the guards were unaffected.

None of this is a finding. The key was stipulated by the author, acting as the General Counsel; the
reviewers' own reading of P1 and P2 is defensible. The sample is ten questions, one run and one
provider. The keys were committed locally before the runs, but local commit dates prove nothing to a
third party. The pilot motivates Study A; it does not test its hypotheses. Full re-analysis:
[analysis/PILOT.md](analysis/PILOT.md). Original report: [suites/nda-boundary/RESULTS.md](suites/nda-boundary/RESULTS.md).

## Study A (in preparation)

- H1: on edge items, agreement among AI reviewers from different providers exceeds agreement among
  lawyers.
- H2 (descriptive): on a share of items, the reading most AI reviewers give differs from the reading
  most lawyers give; on some items lawyers split while the AI reviewers are unanimous.
- H3: rulings written on one wording raise agreement with the team's key on held-out wordings, and do
  not lower it on guard items.

At least 40 questions in three wordings, read by at least five lawyers and by at least four model
families, three runs each; English, with French and Arabic versions of a subset; part of the items
kept private so that they cannot be trained on. The protocol is in [PROTOCOL.md](PROTOCOL.md), the
material for the panel in [annotation/](annotation/). Registration on OSF before any run; submission
to ICAIL 2027.

## Repository

| Path | Content |
|---|---|
| `suites/nda-boundary/` | Pilot items, keys, runner and committed answers |
| `caselaw/`, `spec/` | The fictional team's two rulings and the format of a ruling |
| `engine/` | Rulings (validate, compile, overturn) and comparison of readers |
| `analysis/` | Statistics, checked against published worked examples, and the pilot re-analysis |
| `annotation/` | Instructions, codebook, reading form and consent text for the panel |
| `desk/` | A working prototype of the governance layer: a Claude page where a team reviews NDAs, sends open questions to its General Counsel and applies the rulings |
| `paper/` | Outline and checked references for the Study A paper |

```
node --test tests/*.test.mjs          # engine and statistics
node analysis/pilot.mjs               # re-analysis of the pilot from the committed answers
node suites/nda-boundary/run.mjs --report
```

## Related work

Arbel and Hoffman (2024) propose using language models to interpret contracts. Purushothama et al.
(2025) and Waldon et al. (2025) test and criticise their use for the ordinary meaning of statutes;
Kim et al. (2025) measure correlated errors across models; Chen and Zhang (2025) align human and AI
decisions with precedents. Legal benchmarks such as LegalBench (Guha et al. 2023), ContractNLI
(Koreeda and Manning 2021) and, in Arabic, ArabLegalEval (Hijazi et al. 2024) score models against a
single answer. tamyiz differs in three ways: it studies the application of a contract playbook rather
than the meaning of a statute; it compares agreement among machines with disagreement among lawyers
on the same items; and it tests a remedy, the team's rulings, on held-out wordings and guard items.

## Use of AI in this work

The code, the pilot items, keys and rulings, and drafts of this text were written with Claude
(Anthropic) under the author's direction. The research questions, the design and the decision to
publish are the author's. Before Study A the author reviews, and where needed rewrites, the items,
keys and rulings; the panel's readings are human. Every figure on this page is computed by code in
this repository from committed data.

## References

- Arbel, Y. A. and Hoffman, D. A. (2024). Generative Interpretation. *New York University Law Review* 99, 451.
- Cabitza, F., Campagner, A. and Basile, V. (2023). Toward a Perspectivist Turn in Ground Truthing for Predictive Computing. *Proceedings of the AAAI Conference on Artificial Intelligence* 37(6). doi:10.1609/aaai.v37i6.25840.
- Chen, Q. Z. and Zhang, A. X. (2025). Case Law Grounding: Using Precedents to Align Decision-Making for Humans and AI. arXiv:2310.07019.
- Guha, N. et al. (2023). LegalBench: A Collaboratively Built Benchmark for Measuring Legal Reasoning in Large Language Models. *NeurIPS 2023, Datasets and Benchmarks*.
- Hart, H. L. A. (1961). *The Concept of Law*, ch. VII. Oxford: Clarendon Press.
- Hijazi, F. et al. (2024). ArabLegalEval: A Multitask Benchmark for Assessing Arabic Legal Knowledge in Large Language Models. *Proceedings of ArabicNLP 2024*. doi:10.18653/v1/2024.arabicnlp-1.20.
- Kelsen, H. (1960). *Reine Rechtslehre*, 2nd ed., ch. VIII. Vienna: Deuticke. French translation by Ch. Eisenmann, *Théorie pure du droit*, Dalloz, 1962.
- Kim, E. M., Garg, A., Peng, K. and Garg, N. (2025). Correlated Errors in Large Language Models. *ICML 2025*, PMLR 267, 30038–30066.
- Koreeda, Y. and Manning, C. D. (2021). ContractNLI: A Dataset for Document-level Natural Language Inference for Contracts. *Findings of EMNLP 2021*.
- Purushothama, A., Min, J., Waldon, B. and Schneider, N. (2025). Not ready for the bench: LLM legal interpretation is unstable and out of step with human judgments. *NLLP 2025*. arXiv:2510.25356.
- Troper, M. (2001). *La théorie du droit, le droit, l'État*. Paris: PUF.
- Waldon, B., Schneider, N., Wilcox, E., Zeldes, A. and Tobia, K. (2025). Large Language Models for Legal Interpretation? Don't Take Their Word for It. *Georgetown Law Journal* 114, 115.

Full entries: [paper/references.bib](paper/references.bib).

## Licence and citation

MIT; the Claude for Legal files in `baseline/` keep their Apache 2.0 licence. How to cite:
[CITATION.cff](CITATION.cff).
