# Boundary NDAs — results

Twenty-five NDAs of Gulf Horizon Holding LLC (Dubai): ten questions of interpretation the playbook does not settle on its own, each in two wordings (A, reviewed by the General Counsel; B, held out), and five controls, three of which guard against a ruling reaching too far. Same playbook and same task text for every reviewer. Keys committed locally before the first run (commit 1016822; guards in a9b6fc0), rulings before any held-out run with them (b24726a); local commit dates are not proof to a third party (see analysis/PILOT.md). *before*: the playbook only. *after*: the playbook and the General Counsel's rulings in force on 2026-11-02 (`caselaw/gulf-horizon/rulings.json`).

Reviewers: opus-plain, opus-cfl, sonnet-plain, haiku-system.

## 1. How the reviewers read the edge NDAs, before any ruling (wording A)

Unanimous on 10 of 10. Their common reading is the team's on 8; on 2 (P1A, P2A) every reviewer read the playbook otherwise than the General Counsel meant — which no comparison between the reviewers can show.

| NDA | Question | Reading (← reviewers) | Team's position | Same? |
|---|---|---|---|---|
| P1A | Does a three-year term that renews automatically for one-year periods, unless a Party gives notice, exceed the three-year limit? | YELLOW · TERM_TOO_LONG ← haiku-system, opus-cfl, opus-plain, sonnet-plain | GREEN | no — all reviewers |
| P2A | Is a protection of trade secrets for as long as they remain trade secrets a perpetual confidentiality obligation? | RED · PERPETUAL ← haiku-system, opus-cfl, opus-plain, sonnet-plain | GREEN | no — all reviewers |
| P3A | Is the fifth standard exclusion present when disclosure required by law is excluded without any duty to notify the other Party? | GREEN ← haiku-system, opus-cfl, opus-plain, sonnet-plain | GREEN | yes |
| P4A | Is a narrow, mutual, time-limited covenant not to solicit staff met during the Purpose, with an exception for general advertisements, a non-solicitation covenant? | RED · NON_SOLICIT ← haiku-system, opus-cfl, opus-plain, sonnet-plain | RED · NON_SOLICIT | yes |
| P5A | Is a residuals clause limited to unaided memory, with no licence under patents or copyrights, a broad residuals clause? | YELLOW · RESIDUALS_BROAD ← haiku-system, opus-cfl, opus-plain, sonnet-plain | YELLOW · RESIDUALS_BROAD | yes |
| P6A | Is arbitration seated in the DIFC or in Dubai, under an accepted governing law, an accepted forum? | GREEN ← haiku-system, opus-cfl, opus-plain, sonnet-plain | GREEN | yes |
| P7A | Is an amount fixed in advance for a breach, called agreed compensation and open to adjustment by the court, liquidated damages? | RED · LIQUIDATED_DAMAGES ← haiku-system, opus-cfl, opus-plain, sonnet-plain | RED · LIQUIDATED_DAMAGES | yes |
| P8A | Does an exception for copies the law requires, without back-up copies, satisfy the return-or-destruction position? | YELLOW · NO_RETENTION_EXCEPTION ← haiku-system, opus-cfl, opus-plain, sonnet-plain | YELLOW · NO_RETENTION_EXCEPTION | yes |
| P9A | Is an NDA titled mutual, under which only Gulf Horizon is bound while both Parties exchange information, unilateral? | RED · UNILATERAL ← haiku-system, opus-cfl, opus-plain, sonnet-plain | RED · UNILATERAL | yes |
| P10A | Is an accepted governing law combined with another accepted forum (English law, DIFC or ADGM Courts) acceptable? | GREEN ← haiku-system, opus-cfl, opus-plain, sonnet-plain | GREEN | yes |

## 2. Controls and guards, before any ruling

| NDA | Reading (← reviewers) | Key |
|---|---|---|
| C1 | GREEN ← haiku-system, opus-cfl, opus-plain, sonnet-plain | GREEN |
| C2 | RED · PERPETUAL ← haiku-system, opus-cfl, opus-plain, sonnet-plain | RED · PERPETUAL |
| C3 (guards P1) | YELLOW · TERM_TOO_LONG ← haiku-system, opus-cfl, opus-plain, sonnet-plain | YELLOW · TERM_TOO_LONG |
| C4 (guards P2) | RED · PERPETUAL ← haiku-system, opus-cfl, opus-plain, sonnet-plain | RED · PERPETUAL |
| C5 (guards P1) | YELLOW · TERM_TOO_LONG ← haiku-system, opus-cfl, opus-plain<br>RED · PERPETUAL, TERM_TOO_LONG ← sonnet-plain | YELLOW · TERM_TOO_LONG |

## 3. Held-out NDAs and guards, before and after the rulings

*Exactly right*: the right routing and exactly the codes of the key, no more, no fewer.

| Reviewer | Held-out (B), before | Held-out (B), after | Controls and guards, before | Controls and guards, after |
|---|---:|---:|---:|---:|
| opus-plain | 8/10 | 10/10 | 5/5 | 5/5 |
| opus-cfl | 8/10 | 10/10 | 5/5 | 5/5 |
| sonnet-plain | 8/10 | 10/10 | 4/5 | 5/5 |
| haiku-system | 8/10 | 10/10 | 5/5 | 5/5 |

- before: the reviewers were unanimous on 14 of 15 held-out and control NDAs (pairwise agreement 97%).
- after: the reviewers were unanimous on 15 of 15 held-out and control NDAs (pairwise agreement 100%).

## 4. Cost and time

| Reviewer | Condition | Reviews | Cost per NDA (USD) | Time per NDA |
|---|---|---:|---:|---:|
| haiku-system | before | 25 | 0.0035 | 12.8 s |
| opus-cfl | before | 25 | 0.0612 | 7.8 s |
| opus-plain | before | 25 | 0.0459 | 6.8 s |
| sonnet-plain | before | 25 | 0.0229 | 5.3 s |
| haiku-system | after | 15 | 0.0034 | 12.4 s |
| opus-cfl | after | 15 | 0.0635 | 7.0 s |
| opus-plain | after | 15 | 0.0431 | 6.5 s |
| sonnet-plain | after | 15 | 0.0214 | 5.2 s |

Costs and times are what `claude -p` reported. One run per reviewer, NDA and condition.
