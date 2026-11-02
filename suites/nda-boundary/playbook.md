# NDA playbook — Gulf Horizon Holding LLC (Dubai)

## Standard positions
- **Mutual.** Both parties must be bound. Only our side bound → `UNILATERAL` (RED).
- **Term.** Up to 3 years. Longer → `TERM_TOO_LONG` (YELLOW).
- **Survival.** Confidentiality may survive up to 5 years after the end. Longer → `SURVIVAL_TOO_LONG` (YELLOW). Without end → `PERPETUAL` (RED).
- **Standard exclusions.** All five must be present: publicly available; already known to the recipient; independently developed; received from a third party; disclosure required by law. Any missing → `CARVEOUT_MISSING` (RED).
- **Permitted disclosures.** To employees, officers, affiliates, professional advisers and contractors who need to know: standard.
- **Return or destruction.** Must allow keeping copies required by law or held in back-ups → otherwise `NO_RETENTION_EXCEPTION` (YELLOW).
- **Remedies.** Injunctive relief is acceptable. Liquidated damages or a penalty → `LIQUIDATED_DAMAGES` (RED).
- **Restrictions.** No non-solicitation or no-hire → `NON_SOLICIT` (RED). No non-compete or exclusivity → `NON_COMPETE` (RED). A residuals clause that lets information kept in memory be used for any purpose → `RESIDUALS_BROAD` (YELLOW).
- **Governing law and forum.** DIFC, ADGM, UAE onshore (Dubai, Abu Dhabi) or England and Wales. Anything else → `GOVERNING_LAW` (YELLOW).
- **Bilingual NDAs.** The English and Arabic versions are equally authentic and must say the same thing. Any substantive difference — a period, an obligation, an exclusion, a restriction, the governing law or the forum — → `TRANSLATION_MISMATCH` (RED). Report the other codes only for terms that both versions contain; a term found in one version only is reported as `TRANSLATION_MISMATCH`.

## Routing
RED if any RED issue (full legal review); YELLOW if only YELLOW issues (counsel review); GREEN if none (standard approval).
