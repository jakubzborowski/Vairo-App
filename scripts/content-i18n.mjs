#!/usr/bin/env node
/**
 * Tłumaczenia treści etapów (pytania, podpowiedzi, przewodniki).
 *
 *   node scripts/content-i18n.mjs extract [etap]   tekst źródłowy (pl) → supabase/content/i18n/pl/
 *   node scripts/content-i18n.mjs check            kompletność de/uk/es względem pl
 *   node scripts/content-i18n.mjs build [numer]    migracja <numer>_content_translations.sql (domyślnie 050)
 *
 * Model: polski JSON w `supabase/content/*.json` zostaje jedynym źródłem
 * STRUKTURY. Tłumaczenie to płaska mapa „ścieżka → tekst” w
 * `supabase/content/i18n/<język>/<etap>-v1.json`, np.
 *
 *   "general/pick-change.title": "Wähle etwas, das du ändern willst",
 *   "general/pick-change/catch-problem/problem.question": "…",
 *   "general/pick-change/catch-problem/problem.config.options.tak": "Ja",
 *
 * Ścieżka zbudowana jest z kluczy (`key`), nie z pozycji, więc przestawienie
 * punktów nie rozjeżdża tłumaczeń, a zmiana klucza od razu wychodzi w `check`.
 *
 * `extract` zapisuje też obok każdego tekstu skrót źródła (`pl/<etap>.json`).
 * `check` porównuje skróty: zmieniony polski tekst = tłumaczenie do
 * przejrzenia („nieaktualne”), choć nadal się wyświetla.
 *
 * `build` składa jedną idempotentną migrację, która ustawia kolumnę
 * `translations` (jsonb, migracja 049) w tabelach `stage_*`:
 *   { "de": { "title": "…", "config": { "options": [{ "value": "tak", "label": "Ja" }] } }, … }
 * Aplikacja nakłada to na polski wiersz (`src/lib/stage-i18n.ts`). Brak
 * tłumaczenia = polski tekst, nigdy pusty ekran. Pliki treści 006–042 zostają
 * nietknięte — kolumna powstaje dopiero w 049, więc tłumaczenia idą osobną
 * migracją z wyższym numerem.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "supabase/content");
const I18N = path.join(CONTENT, "i18n");
/**
 * Numer pliku wynikowego. Pierwsza wersja to 050; kolejne tłumaczenia po
 * zmianach w treści idą pod NOWYM numerem (`build 051`, `build 052`…) —
 * odpalona migracja się nie zmienia (CLAUDE.md). Każda wersja ustawia
 * komplet tłumaczeń, więc obowiązuje ta z najwyższym numerem.
 */
function migrationPath(number = "050") {
  return path.join(ROOT, `supabase/migrations/${number}_content_translations.sql`);
}
const STAGES = ["ambition", "idea", "preparation", "execution", "mvp"];
const TARGETS = ["de", "uk", "es"];

// ── Teksty z pliku treści ──────────────────────────────────────────────────

function loadDoc(stage) {
  const doc = JSON.parse(fs.readFileSync(path.join(CONTENT, `${stage}-v1.json`), "utf8"));
  const guidesPath = path.join(CONTENT, `${stage}-v1.guides.json`);
  if (fs.existsSync(guidesPath)) {
    // Tak samo jak build-content.mjs: przewodnik z osobnego pliku nadpisuje punkt.
    const guides = JSON.parse(fs.readFileSync(guidesPath, "utf8"));
    for (const category of doc.categories ?? []) {
      for (const point of category.points ?? []) {
        const guide = guides[category.key]?.[point.guide ?? point.key];
        if (!guide) continue;
        if (guide.body) point.guide_body = guide.body;
        if (guide.sources) point.guide_sources = guide.sources;
      }
    }
  }
  return doc;
}

const TEXT = {
  template: ["title", "subtitle", "intro", "finish_label"],
  category: ["title", "intro"],
  point: ["title", "description", "duration_hint", "guide_body", "guide_source_label"],
  subpoint: ["title", "description"],
  field: ["question", "help", "example"],
};

const CONFIG_SCALARS = ["min_label", "max_label", "unit", "template", "confirm_label", "add_label", "label"];

const has = (value) => typeof value === "string" && value.trim() !== "";

/** Wszystkie teksty do przetłumaczenia: [ścieżka, tekst]. */
function strings(doc) {
  const out = [];
  const add = (key, value) => {
    if (has(value)) out.push([key, value]);
  };

  for (const prop of TEXT.template) add(`template.${prop}`, doc[prop]);

  for (const category of doc.categories ?? []) {
    const c = category.key;
    for (const prop of TEXT.category) add(`${c}.${prop}`, category[prop]);

    for (const point of category.points ?? []) {
      const p = `${c}/${point.key}`;
      for (const prop of TEXT.point) add(`${p}.${prop}`, point[prop]);
      (point.guide_sources ?? []).forEach((source, i) => add(`${p}.guide_sources.${i}`, source));

      for (const subpoint of point.subpoints ?? []) {
        const s = `${p}/${subpoint.key}`;
        for (const prop of TEXT.subpoint) add(`${s}.${prop}`, subpoint[prop]);

        for (const field of subpoint.fields ?? []) {
          const f = `${s}/${field.key}`;
          for (const prop of TEXT.field) add(`${f}.${prop}`, field[prop]);
          const config = field.config ?? {};
          for (const prop of CONFIG_SCALARS) add(`${f}.config.${prop}`, config[prop]);
          for (const option of config.options ?? []) add(`${f}.config.options.${option.value}`, option.label);
          for (const slot of config.slots ?? []) add(`${f}.config.slots.${slot.key}`, slot.label);
          (config.sources ?? []).forEach((source, i) => add(`${f}.config.sources.${i}`, source.label));
          for (const column of config.columns ?? []) {
            add(`${f}.config.columns.${column.key}.label`, column.label);
            add(`${f}.config.columns.${column.key}.placeholder`, column.placeholder);
          }
          for (const input of config.calc?.inputs ?? []) {
            add(`${f}.config.calc.${input.key}.label`, input.label);
            add(`${f}.config.calc.${input.key}.unit`, input.unit);
          }
        }
      }
    }
  }
  return out;
}

const hash = (text) => crypto.createHash("sha1").update(text).digest("hex").slice(0, 10);
const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {});
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};

// ── extract ────────────────────────────────────────────────────────────────

function extract(only) {
  for (const stage of only ? [only] : STAGES) {
    const list = strings(loadDoc(stage));
    const source = Object.fromEntries(list);
    const hashes = Object.fromEntries(list.map(([k, v]) => [k, hash(v)]));
    writeJson(path.join(I18N, "pl", `${stage}-v1.json`), source);
    writeJson(path.join(I18N, "pl", `${stage}-v1.hashes.json`), hashes);
    const chars = list.reduce((n, [, v]) => n + v.length, 0);
    console.log(`✓ ${stage}: ${list.length} tekstów, ${chars} znaków → i18n/pl/${stage}-v1.json`);
  }
}

// ── check ──────────────────────────────────────────────────────────────────

/** Zmienne w szablonie zdania (`{slot}`) muszą przetrwać tłumaczenie. */
const placeholders = (text) => [...String(text).matchAll(/\{([\w-]+)\}/g)].map((m) => m[1]).sort().join(",");

function check() {
  let problems = 0;
  for (const stage of STAGES) {
    const list = strings(loadDoc(stage));
    const hashes = readJson(path.join(I18N, "pl", `${stage}-v1.hashes.json`));
    for (const locale of TARGETS) {
      const tr = readJson(path.join(I18N, locale, `${stage}-v1.json`));
      const meta = readJson(path.join(I18N, locale, `${stage}-v1.meta.json`));
      let missing = 0;
      let stale = 0;
      for (const [key, text] of list) {
        if (!has(tr[key])) {
          missing++;
          continue;
        }
        if (placeholders(text) !== placeholders(tr[key])) {
          problems++;
          console.log(`  ${locale}/${stage}: ${key} — zmienne {${placeholders(text)}} ≠ {${placeholders(tr[key])}}`);
        }
        const translatedFrom = meta[key] ?? hashes[key];
        if (translatedFrom && translatedFrom !== hash(text)) stale++;
      }
      const known = new Set(list.map(([k]) => k));
      const orphans = Object.keys(tr).filter((k) => !known.has(k));
      if (missing || stale || orphans.length) {
        problems += missing + orphans.length;
        console.log(
          `  ${locale}/${stage}: brak ${missing}, nieaktualne ${stale}, sieroty ${orphans.length}` +
            (orphans.length ? ` (np. ${orphans.slice(0, 3).join(", ")})` : "")
        );
      }
    }
  }
  if (problems) {
    console.log(`✗ ${problems} problemów`);
    process.exit(1);
  }
  console.log("✓ treść etapów przetłumaczona w całości");
}

// ── build ──────────────────────────────────────────────────────────────────

const lit = (value) => `'${String(value).replace(/'/g, "''")}'`;
const jsonb = (value) => `${lit(JSON.stringify(value))}::jsonb`;

/** Tłumaczenia jednego wiersza: { de: {...}, uk: {...} } albo null. */
function rowTranslations(maps, prefix, props, configFor) {
  const out = {};
  for (const locale of TARGETS) {
    const tr = maps[locale];
    const row = {};
    for (const prop of props) {
      const value = tr[`${prefix}.${prop}`];
      if (has(value)) row[prop] = value;
    }
    if (configFor) {
      const config = configFor(tr);
      if (config) row.config = config;
    }
    if (Object.keys(row).length) out[locale] = row;
  }
  return Object.keys(out).length ? out : null;
}

function guideSources(tr, prefix, sources) {
  if (!sources?.length) return undefined;
  const out = sources.map((source, i) => tr[`${prefix}.guide_sources.${i}`] ?? source);
  return out.some((value, i) => value !== sources[i]) ? out : undefined;
}

/** Przetłumaczone fragmenty `config` w kształcie oryginału (dla deep-merge). */
function configTranslation(tr, f, config) {
  if (!config) return null;
  const out = {};
  for (const prop of CONFIG_SCALARS) {
    if (has(tr[`${f}.config.${prop}`])) out[prop] = tr[`${f}.config.${prop}`];
  }
  if (config.options?.length) {
    const options = config.options.map((o) => ({ ...o, label: tr[`${f}.config.options.${o.value}`] ?? o.label }));
    if (options.some((o, i) => o.label !== config.options[i].label)) out.options = options;
  }
  if (config.slots?.length) {
    const slots = config.slots.map((s) => ({ ...s, label: tr[`${f}.config.slots.${s.key}`] ?? s.label }));
    if (slots.some((s, i) => s.label !== config.slots[i].label)) out.slots = slots;
  }
  if (config.sources?.length) {
    const sources = config.sources.map((s, i) => ({ ...s, label: tr[`${f}.config.sources.${i}`] ?? s.label }));
    if (sources.some((s, i) => s.label !== config.sources[i].label)) out.sources = sources;
  }
  if (config.columns?.length) {
    const columns = config.columns.map((c) => ({
      ...c,
      label: tr[`${f}.config.columns.${c.key}.label`] ?? c.label,
      ...(c.placeholder !== undefined
        ? { placeholder: tr[`${f}.config.columns.${c.key}.placeholder`] ?? c.placeholder }
        : {}),
    }));
    if (JSON.stringify(columns) !== JSON.stringify(config.columns)) out.columns = columns;
  }
  if (config.calc?.inputs?.length) {
    const inputs = config.calc.inputs.map((input) => ({
      ...input,
      label: tr[`${f}.config.calc.${input.key}.label`] ?? input.label,
      ...(input.unit !== undefined ? { unit: tr[`${f}.config.calc.${input.key}.unit`] ?? input.unit } : {}),
    }));
    if (JSON.stringify(inputs) !== JSON.stringify(config.calc.inputs)) out.calc = { ...config.calc, inputs };
  }
  return Object.keys(out).length ? out : null;
}

function build(number) {
  const lines = [
    "-- 050 · Tłumaczenia treści etapów (de, uk, es)",
    "--",
    "-- WYGENEROWANE: node scripts/content-i18n.mjs build — nie edytować ręcznie.",
    "-- Źródło: supabase/content/i18n/<język>/<etap>-v1.json. Wymaga 049.",
    "-- Idempotentne: każde odpalenie ustawia `translations` od nowa; wiersze",
    "-- bez tłumaczeń dostają '{}', więc usunięte tłumaczenie też znika z bazy.",
    "",
    "begin;",
    "",
  ];

  let rows = 0;
  for (const stage of STAGES) {
    const doc = loadDoc(stage);
    const maps = Object.fromEntries(TARGETS.map((l) => [l, readJson(path.join(I18N, l, `${stage}-v1.json`))]));
    const tKey = lit(doc.key);
    const tVer = Number(doc.version);
    const tWhere = `t.key = ${tKey} and t.version = ${tVer}`;
    const set = (value) => (value ? jsonb(value) : "'{}'::jsonb");

    lines.push(`-- ═══ ${doc.key} v${doc.version} ═══`);
    lines.push(
      `update public.stage_templates t set translations = ${set(rowTranslations(maps, "template", TEXT.template))}`,
      `  where ${tWhere};`
    );
    rows++;

    for (const category of doc.categories ?? []) {
      const c = category.key;
      lines.push(
        `update public.stage_categories c set translations = ${set(rowTranslations(maps, c, TEXT.category))}`,
        `  from public.stage_templates t where c.template_id = t.id and ${tWhere} and c.key = ${lit(c)};`
      );
      rows++;

      for (const point of category.points ?? []) {
        const p = `${c}/${point.key}`;
        const pointTr = rowTranslations(maps, p, TEXT.point);
        // Źródła przewodnika to lista — dokładamy ją do tłumaczenia wiersza osobno.
        for (const locale of TARGETS) {
          const sources = guideSources(maps[locale], p, point.guide_sources);
          if (!sources) continue;
          const target = pointTr ?? {};
          target[locale] = { ...(target[locale] ?? {}), guide_sources: sources };
        }
        lines.push(
          `update public.stage_points p set translations = ${set(pointTr)}`,
          `  from public.stage_categories c, public.stage_templates t`,
          `  where p.category_id = c.id and c.template_id = t.id and ${tWhere}`,
          `    and c.key = ${lit(c)} and p.key = ${lit(point.key)};`
        );
        rows++;

        for (const subpoint of point.subpoints ?? []) {
          const s = `${p}/${subpoint.key}`;
          lines.push(
            `update public.stage_subpoints s set translations = ${set(rowTranslations(maps, s, TEXT.subpoint))}`,
            `  from public.stage_points p, public.stage_categories c, public.stage_templates t`,
            `  where s.point_id = p.id and p.category_id = c.id and c.template_id = t.id and ${tWhere}`,
            `    and c.key = ${lit(c)} and p.key = ${lit(point.key)} and s.key = ${lit(subpoint.key)};`
          );
          rows++;

          for (const field of subpoint.fields ?? []) {
            const f = `${s}/${field.key}`;
            const tr = rowTranslations(maps, f, TEXT.field, (m) => configTranslation(m, f, field.config));
            lines.push(
              `update public.stage_fields f set translations = ${set(tr)}`,
              `  from public.stage_subpoints s, public.stage_points p, public.stage_categories c, public.stage_templates t`,
              `  where f.subpoint_id = s.id and s.point_id = p.id and p.category_id = c.id and c.template_id = t.id`,
              `    and ${tWhere} and c.key = ${lit(c)} and p.key = ${lit(point.key)}`,
              `    and s.key = ${lit(subpoint.key)} and f.key = ${lit(field.key)};`
            );
            rows++;
          }
        }
      }
    }
    lines.push("");
  }

  lines.push("commit;", "");
  const target = migrationPath(number);
  fs.writeFileSync(target, lines.join("\n"));
  console.log(`✓ ${rows} wierszy → ${path.relative(ROOT, target)}`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "extract") extract(arg);
else if (cmd === "check") check();
else if (cmd === "build") build(arg);
else {
  console.log("użycie: node scripts/content-i18n.mjs extract [etap] | check | build");
  process.exit(1);
}
