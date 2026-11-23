#!/usr/bin/env node
/**
 * Narzędzie do słowników interfejsu (src/i18n/messages/<język>/<przestrzeń>.json).
 *
 *   node scripts/i18n.mjs index   przebudowuje pliki index.ts z listy JSON-ów
 *   node scripts/i18n.mjs check   sprawdza kompletność tłumaczeń względem `pl`
 *
 * `check` zgłasza: brakujące klucze, klucze, których nie ma w `pl` (sieroty),
 * różne zmienne `{name}` niż w polskim oryginale oraz niezbalansowane nawiasy.
 * Kończy się kodem 1, gdy coś jest nie tak — do odpalenia przed scaleniem.
 *
 * Treść etapów ma własne sprawdzanie w `content:build` (supabase/content/i18n).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "src/i18n/messages");
const SOURCE = "pl";
const LOCALES = ["pl", "de", "uk", "es"];

function namespaces(locale) {
  const dir = path.join(DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
}

function load(locale, ns) {
  const file = path.join(DIR, locale, `${ns}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const camel = (ns) => ns.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function buildIndex() {
  const sourceNs = namespaces(SOURCE);
  for (const locale of LOCALES) {
    const present = new Set(namespaces(locale));
    const lines = [
      "// Wygenerowane przez `node scripts/i18n.mjs index` — nie edytować ręcznie.",
      "",
    ];
    const used = sourceNs.filter((ns) => present.has(ns));
    for (const ns of used) lines.push(`import ${camel(ns)} from "./${ns}.json";`);
    lines.push("");
    lines.push("const messages = {");
    for (const ns of used) lines.push(`  "${ns}": ${camel(ns)},`);
    lines.push("};");
    lines.push("");
    lines.push("export default messages;");
    lines.push("");
    fs.mkdirSync(path.join(DIR, locale), { recursive: true });
    fs.writeFileSync(path.join(DIR, locale, "index.ts"), lines.join("\n"));
  }
  console.log(`✓ index.ts dla ${LOCALES.join(", ")} (${sourceNs.length} przestrzeni)`);
}

// Zmienne: `{name}` albo `{name, plural|select, …}` — z rekurencją w warianty.
// Słowa w wariantach („one {osoba}”) to tekst, nie zmienne.
function collectVars(text, out) {
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{") {
      i++;
      continue;
    }
    let depth = 0;
    let end = i;
    for (; end < text.length; end++) {
      if (text[end] === "{") depth++;
      else if (text[end] === "}" && --depth === 0) break;
    }
    const inner = text.slice(i + 1, end);
    const m = inner.match(/^\s*([a-zA-Z_]\w*)\s*(?:,\s*(plural|select)\s*,([\s\S]*))?$/);
    if (m) {
      out.add(m[1]);
      if (m[3]) {
        // warianty: klucz {treść}
        let k = 0;
        const body = m[3];
        while (k < body.length) {
          const open = body.indexOf("{", k);
          if (open < 0) break;
          let d = 0;
          let close = open;
          for (; close < body.length; close++) {
            if (body[close] === "{") d++;
            else if (body[close] === "}" && --d === 0) break;
          }
          collectVars(body.slice(open + 1, close), out);
          k = close + 1;
        }
      }
    }
    i = end + 1;
  }
  return out;
}
const vars = (text) => [...collectVars(String(text), new Set())].sort();

function balanced(text) {
  let depth = 0;
  for (const ch of String(text)) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function check() {
  let problems = 0;
  const report = (msg) => {
    problems++;
    console.log("  " + msg);
  };

  for (const ns of namespaces(SOURCE)) {
    const src = load(SOURCE, ns);
    for (const [key, text] of Object.entries(src)) {
      if (!balanced(text)) report(`pl/${ns}: ${key} — niezbalansowane nawiasy`);
    }
    for (const locale of LOCALES.filter((l) => l !== SOURCE)) {
      const tr = load(locale, ns);
      if (!tr) {
        report(`${locale}/${ns}.json — brak pliku`);
        continue;
      }
      for (const [key, text] of Object.entries(src)) {
        if (!(key in tr)) {
          report(`${locale}/${ns}: brak „${key}”`);
          continue;
        }
        if (!balanced(tr[key])) report(`${locale}/${ns}: ${key} — niezbalansowane nawiasy`);
        const a = vars(text).join(",");
        const b = vars(tr[key]).join(",");
        if (a !== b) report(`${locale}/${ns}: ${key} — zmienne {${a}} ≠ {${b}}`);
      }
      for (const key of Object.keys(tr)) {
        if (!(key in src)) report(`${locale}/${ns}: sierota „${key}” (nie ma w pl)`);
      }
    }
  }

  if (problems) {
    console.log(`✗ ${problems} problemów`);
    process.exit(1);
  }
  console.log("✓ słowniki kompletne");
}

const cmd = process.argv[2];
if (cmd === "index") buildIndex();
else if (cmd === "check") check();
else {
  console.log("użycie: node scripts/i18n.mjs index|check");
  process.exit(1);
}
