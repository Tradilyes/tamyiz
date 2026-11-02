# Claude for Legal baseline — source and licence

The files in this folder come from Anthropic's
[anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal) (commit
[4a6c651](https://github.com/anthropics/claude-for-legal/tree/4a6c651889c97cc9140580363c73e0eb17379c2b),
23 July 2026, the content behind Claude for Legal's NDA Triager), copied unchanged under the Apache
License 2.0 (`LICENSE` in this folder):

- `commercial-legal/skills/nda-review/SKILL.md` — the NDA triage skill, loaded by `/commercial-legal:review`;
- `commercial-legal/CLAUDE.md` — the template of the plugin's practice profile;
- `references/company-profile-template.md` — the template of the company profile shared by all the plugins.

They are used only by the *cfl* arm of the NDA suites. In the product, the cold-start interview
writes the two profiles from the team's answers; `../../engine/cfl.mjs` fills the templates the way that
interview would for the benchmark's company — an in-house team in Dubai, a lawyer as the user, the
same playbook as every other arm recorded as attorney-reviewed NDA triage positions — and changes
nothing else. `node suites/nda-boundary/run.mjs --show-system cfl` prints exactly what the model receives.
