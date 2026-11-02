// tamyiz — reads a case-law file from disk (kept apart so that engine/caselaw.mjs runs in a browser too).
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { readFileSync } from "node:fs";

/** Reads a case-law file: { team, playbook, rulings: [...] }. */
export function loadCaselaw(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
