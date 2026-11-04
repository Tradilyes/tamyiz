# Codebook

Taken from the playbook of the fictional company (`suites/nda-boundary/playbook.md`). A reading is one
routing and a set of issue codes.

## Routing

| Routing | Meaning | Rule |
|---|---|---|
| GREEN | Standard approval | No issue |
| YELLOW | Counsel review | Only YELLOW issues |
| RED | Full legal review | At least one RED issue |

## Issue codes

| Code | Severity | The playbook position it applies |
|---|---|---|
| `UNILATERAL` | RED | Both parties must be bound; only the company is bound |
| `TERM_TOO_LONG` | YELLOW | The term may not exceed three years |
| `SURVIVAL_TOO_LONG` | YELLOW | Confidentiality may survive up to five years after the end |
| `PERPETUAL` | RED | Confidentiality survives without end |
| `CARVEOUT_MISSING` | RED | One of the five standard exclusions is missing: publicly available; already known; independently developed; received from a third party; disclosure required by law |
| `NO_RETENTION_EXCEPTION` | YELLOW | Return or destruction must allow copies kept by law or in back-ups |
| `LIQUIDATED_DAMAGES` | RED | Liquidated damages or a penalty for breach |
| `NON_SOLICIT` | RED | A non-solicitation or no-hire covenant |
| `NON_COMPETE` | RED | A non-compete or exclusivity covenant |
| `RESIDUALS_BROAD` | YELLOW | A residuals clause that lets information kept in memory be used for any purpose |
| `GOVERNING_LAW` | YELLOW | Law or forum other than DIFC, ADGM, UAE onshore (Dubai, Abu Dhabi) or England and Wales |
| `TRANSLATION_MISMATCH` | RED | The English and Arabic versions differ in substance |

When a clause sits on the edge of a position, choose the reading you would defend before the General
Counsel, and say in your reasons what the other reading would be.
