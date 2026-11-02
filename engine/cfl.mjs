// tamyiz — the "Claude for Legal" arm (adapted from courtproof's NDA benchmark).
// Anthropic's commercial-legal plugin (anthropics/claude-for-legal) runs its NDA Triager from two
// configuration files written by its cold-start interview: the shared company profile and the
// plugin's practice profile. This module fills the two templates, copied unchanged in
// baseline/claude-for-legal/, the way the interview would for the company of the benchmark, so the
// official skill runs as it would for a configured team. The team's binding rulings, when there are
// any, go where a team would keep them: in the practice profile, under its NDA triage positions.
// `node suites/nda-boundary/run.mjs --show-system cfl` prints the result.
// Copyright (c) 2026 ILYES M. TRAD — MIT licence (the copied files keep their Apache-2.0 licence).

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const base = join(here, "..", "baseline", "claude-for-legal");
const read = p => readFileSync(join(base, p), "utf8");
const FILLER = "Not configured (not used for NDA triage)";

// Replaces every [PLACEHOLDER …] (brackets may nest: "capped at [X]") with the filler.
export function replacePlaceholders(text, filler = FILLER) {
  let out = "", i = 0;
  for (;;) {
    const j = text.indexOf("[PLACEHOLDER", i);
    if (j < 0) return out + text.slice(i);
    let depth = 0, k = j;
    for (; k < text.length; k++) {
      if (text[k] === "[") depth++;
      else if (text[k] === "]" && --depth === 0) break;
    }
    out += text.slice(i, j) + filler;
    i = k + 1;
  }
}

function fill(template, set, filler) {
  let t = template.replace(/^<!--[\s\S]*?-->\s*/, "");
  for (const [from, to] of set) {
    const before = t;
    t = t.replace(from, to);
    if (t === before) throw new Error(`template changed: ${from}`);
  }
  t = t.replace(/\[PLACEHOLDER ✓\/✗\]/g, "✗");
  return replacePlaceholders(t, filler);
}

export function companyProfile() {
  return fill(read("references/company-profile-template.md"), [
    ["**Practice setting:** [Solo/small firm | Midsize/large firm | In-house | Government/legal aid/clinic]", "**Practice setting:** In-house"],
    ["**Name:** [Company or firm name]", "**Name:** Gulf Horizon Holding LLC"],
    ["**Industry:** [What the company does / the firm's primary practice areas]", "**Industry:** Diversified holding company — real estate, logistics, retail"],
    ["**What we sell / deliver:** [Products, services, who to — or \"N/A, law firm\"]", "**What we sell / deliver:** Property, logistics and retail services to businesses and consumers in the UAE"],
    ["**Size:** [Employee count / lawyers / relevant headcount]", "**Size:** About 1,200 employees; a legal team of four"],
    ["**Jurisdictions we operate in:** [e.g., US (CA, NY, TX), UK, EU (DE, FR), AU, SG]", "**Jurisdictions we operate in:** UAE (Dubai and Abu Dhabi onshore), DIFC, ADGM"],
    ["**Primary jurisdiction:** [Where the bulk of work happens]", "**Primary jurisdiction:** UAE"],
    ["**Regulators we're subject to:** [SEC, FTC, ICO, EDPB, ASIC, OAIC, etc. — only what applies]", "**Regulators we're subject to:** UAE Data Office; DIFC Commissioner of Data Protection; ADGM Office of Data Protection"],
    ["**Open regulatory matters:** [or none]", "**Open regulatory matters:** None"],
    ["**Overall risk appetite:** [Conservative / middle / aggressive]", "**Overall risk appetite:** Middle"],
    ["**What keeps us up at night:** [The thing that would be a very bad day]", "**What keeps us up at night:** Signing terms we never agreed to"],
    ["**The question leadership always asks:** [or not known yet]", "**The question leadership always asks:** Can we sign it today?"],
    ["**GC / Head of Legal:** [Name]", "**GC / Head of Legal:** The General Counsel"],
    ["**Escalation chain:** [Name → Name → Name, or \"set per plugin\"]", "**Escalation chain:** Counsel → General Counsel"],
  ]);
}

export function practiceProfile(playbook, rulings = "") {
  const positions = playbook.replace(/^# .*\n+/, "").replace(/^## /gm, "##### ");
  const binding = rulings ? `\n${rulings.replace(/^## /gm, "##### ").trim()}\n` : "";
  const block = `#### NDA triage positions\n\n*Attorney-reviewed: approved by the General Counsel on 1 October 2026. The same positions apply on both sides, since our NDAs are mutual.*\n\n${positions.trim()}\n${binding}`;
  return fill(read("commercial-legal/CLAUDE.md"), [
    [/\[Your Company Name\] is a \[entity type\]\.[\s\S]*?contract lifecycle management\./, "Gulf Horizon Holding LLC is a Dubai holding company with subsidiaries in the DIFC and ADGM. The contracts team is four people. The General Counsel is the final escalation point. We process roughly sixty agreements per month, mostly NDAs and vendor agreements, in English and often also in Arabic. We do not use a CLM system."],
    [/\*\*The thing that hurts:\*\* \[PLACEHOLDER[^\]]*\]/, "**The thing that hurts:** \"Routine NDAs take counsel's time.\""],
    [/\*\*Practice setting:\*\* \[PLACEHOLDER[^\]]*\]/, "**Practice setting:** In-house"],
    [/\*\*Role:\*\* \[PLACEHOLDER[^\]]*\]/, "**Role:** Lawyer / legal professional"],
    [/\*\*Attorney contact:\*\* \[PLACEHOLDER[^\]]*\]/, "**Attorney contact:** N/A (lawyer)"],
    [/\*\*Active side:\*\* \[PLACEHOLDER[^\]]*\]/, "**Active side:** both"],
    [/(### Sales-side playbook\n\n\*Applies when[^\n]*\n\n)\*\[Not configured[^\n]*\n/, `$1${block}\n`],
    [/(### Purchasing-side playbook\n\n\*Applies when[^\n]*\n\n)\*\[Not configured[^\n]*\n/, `$1${block}\n`],
    ["confirm_routing: true", "confirm_routing: false"],
    [/closing_action: "\[PLACEHOLDER[^\n]*/, "closing_action: \"Send this triage and the NDA to Legal for final confirmation before signing.\""],
  ]);
}

export function systemPrompt(playbook, rulings = "") {
  const skill = read("commercial-legal/skills/nda-review/SKILL.md").replace(/^---[\s\S]*?---\s*/, "");
  return [
    "You are running the commercial-legal plugin of Claude for Legal for this team. Its two configuration files, written by the cold-start interview, follow.",
    "", "=== ~/.claude/plugins/config/claude-for-legal/company-profile.md ===", companyProfile(),
    "", "=== ~/.claude/plugins/config/claude-for-legal/commercial-legal/CLAUDE.md ===", practiceProfile(playbook, rulings),
    "", "=== Skill: nda-review (loaded by /commercial-legal:review when an NDA is detected) ===", skill,
    "", `This review runs without a person to answer: the configuration above is complete and attorney-reviewed, and the playbook in the user's message is the same as the NDA triage positions${rulings ? ", with the same rulings" : ""}. Do not ask questions: give the final answer in the JSON format the user asks for.`,
  ].join("\n");
}
