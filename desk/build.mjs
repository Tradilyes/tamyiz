#!/usr/bin/env node
// tamyiz — builds the NDA desk: one self-contained page for claude.ai (an Artifact) that runs
// courtproof's deterministic checks in the browser and asks Claude, on the viewer's own account, to
// read the NDA with those checks as tools. Sources: this repository and a courtproof checkout
// beside it (or --courtproof <dir>).
//   node desk/build.mjs [--courtproof ../courtproof]
// Writes desk/artifact.html (the page without a document skeleton, as claude.ai expects).
// Copyright (c) 2026 ILYES M. TRAD — MIT licence.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const argi = process.argv.indexOf("--courtproof");
const courtproof = resolve(argi > 0 ? process.argv[argi + 1] : join(root, "..", "courtproof"));
const ROOTS = { cp: join(courtproof, "plugins", "courtproof"), cpb: courtproof, tz: root };
const ENTRY = ["cp:engine/parity.mjs", "cp:engine/triage.mjs", "cp:engine/hijri.mjs", "cpb:bench/nda/cases.mjs", "tz:suites/nda-boundary/cases.mjs", "tz:engine/mine.mjs", "tz:engine/caselaw.mjs"];

const modules = new Map();
function load(key) {
  if (modules.has(key)) return;
  const [alias, id] = key.split(":");
  const base = ROOTS[alias];
  const src = readFileSync(join(base, id), "utf8");
  const deps = [];
  const exports = new Set();
  let code = src.replace(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)";\s*$/gm, (_, names, from) => {
    if (from.startsWith("node:")) throw new Error(`${key} imports ${from}: not available in a browser`);
    const dep = `${alias}:${relative(base, resolve(dirname(join(base, id)), from)).split("\\").join("/")}`;
    deps.push(dep);
    const destructure = names.split(",").map(s => s.trim()).filter(Boolean).map(s => s.replace(/\s+as\s+/, ": ")).join(", ");
    return `const { ${destructure} } = __load(${JSON.stringify(dep)});`;
  });
  code = code.replace(/^export\s+\{([^}]*)\};\s*$/gm, (_, names) => { for (const n of names.split(",")) { const [a, b] = n.trim().split(/\s+as\s+/); if (a) exports.add(`${b ?? a}: ${a}`); } return ""; });
  code = code.replace(/^export\s+(async\s+function|function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_, kind, name) => { exports.add(`${name}: ${name}`); return `${kind} ${name}`; });
  if (/^\s*(import|export)\s/m.test(code)) throw new Error(`unhandled import/export in ${key}`);
  modules.set(key, { code: `${code}\nreturn { ${[...exports].join(", ")} };`, deps });
  deps.forEach(load);
}
ENTRY.forEach(load);

const bundle = `const __defs = {\n${[...modules].map(([id, m]) => `${JSON.stringify(id)}: function () {\n${m.code}\n}`).join(",\n")}\n};
const __cache = {};
function __load(id) { if (!__cache[id]) __cache[id] = __defs[id](); return __cache[id]; }`;

const playbook = readFileSync(join(root, "suites", "nda-boundary", "playbook.md"), "utf8");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const safe = s => s.replace(/<\/script/gi, "<\\/script");
const page = readFileSync(join(here, "page.html"), "utf8")
  .replace("/*__BUNDLE__*/", () => safe(bundle))
  .replace("__PLAYBOOK__", () => safe(JSON.stringify(playbook)))
  .replace(/__VERSION__/g, version);
writeFileSync(join(here, "artifact.html"), page);
console.log(`desk/artifact.html written (${Math.round(page.length / 1024)} KB, ${modules.size} modules, courtproof from ${relative(root, courtproof) || "."})`);
