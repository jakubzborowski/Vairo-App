#!/usr/bin/env node
/**
 * Buduje migrację SQL z pliku treści JSON.
 *
 *   node scripts/build-content.mjs ambition-v1
 *   npm run content:build -- ambition-v1
 *
 * Dlaczego SQL, a nie zapis przez klienta Supabase: zespół i tak wkleja
 * migracje do SQL Editora, więc nie potrzebujemy service role key w .env.
 *
 * Skrypt najpierw WALIDUJE treść (nieznane typy pól, duplikaty kluczy,
 * `summary` wskazujący na nieistniejące pole), a dopiero potem generuje SQL.
 * Wygenerowany plik jest idempotentny i usuwa elementy, które zniknęły z JSON-a.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "supabase", "content");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

const FIELD_KINDS = new Set([
  "short_text", "long_text", "list_short", "list_long", "scale", "select",
  "multi_select", "number", "date", "files", "links", "checkmark",
  "sentence_template", "summary", "records", "action", "people",
]);

const CATEGORY_KEYS = new Set(["general", "saas", "hardware", "b2b", "b2c"]);

/** Numer migracji nadawany per szablon, żeby pliki nie kolidowały. */
const MIGRATION_NUMBER = { ambition: "006", idea: "007", preparation: "017" };

// ---------------------------------------------------------------------------
// Walidacja
// ---------------------------------------------------------------------------

const errors = [];
const fail = (path, message) => errors.push(`${path}: ${message}`);

function validate(doc) {
  if (!doc.key) fail("root", "brak `key`");
  if (!Number.isInteger(doc.version)) fail("root", "`version` musi być liczbą całkowitą");
  if (!doc.title) fail("root", "brak `title`");
  if (!Array.isArray(doc.categories) || doc.categories.length === 0) {
    fail("root", "brak `categories`");
    return new Map();
  }

  // ścieżka pola -> definicja; potrzebne do sprawdzenia źródeł `summary`
  const fieldsByPath = new Map();
  const answerKeys = new Set();
  const skipChecks = [];
  const seen = { categories: new Set(), points: new Set(), subpoints: new Set() };

  for (const category of doc.categories) {
    const cPath = `${doc.key}.${category.key}`;
    if (!CATEGORY_KEYS.has(category.key)) {
      fail(cPath, `nieznana kategoria (dozwolone: ${[...CATEGORY_KEYS].join(", ")})`);
    }
    if (seen.categories.has(category.key)) fail(cPath, "duplikat klucza kategorii");
    seen.categories.add(category.key);

    for (const point of category.points ?? []) {
      const pPath = `${cPath}.${point.key}`;
      if (!point.key) fail(pPath, "punkt bez `key`");
      if (!point.title) fail(pPath, "punkt bez `title`");
      if (seen.points.has(pPath)) fail(pPath, "duplikat klucza punktu");
      seen.points.add(pPath);

      for (const subpoint of point.subpoints ?? []) {
        const sPath = `${pPath}.${subpoint.key}`;
        if (!subpoint.key) fail(sPath, "podpunkt bez `key`");
        if (!subpoint.title) fail(sPath, "podpunkt bez `title`");
        if (seen.subpoints.has(sPath)) fail(sPath, "duplikat klucza podpunktu");
        seen.subpoints.add(sPath);

        const fields = subpoint.fields ?? [];
        if (fields.length === 0) fail(sPath, "podpunkt bez żadnego pola");

        const fieldKeys = new Set();
        for (const field of fields) {
          const fPath = `${sPath}.${field.key}`;
          if (!field.key) fail(fPath, "pole bez `key`");
          if (!field.question) fail(fPath, "pole bez `question`");
          if (!FIELD_KINDS.has(field.kind)) {
            fail(fPath, `nieznany typ pola „${field.kind}”`);
          }
          if (fieldKeys.has(field.key)) fail(fPath, "duplikat klucza pola w podpunkcie");
          fieldKeys.add(field.key);
          if (field.kind === "records" && !(field.config?.columns?.length > 0)) {
            fail(fPath, "bloczek `records` wymaga `config.columns`");
          }
          if (field.kind === "action" && !field.config?.href) {
            fail(fPath, "pole `action` wymaga `config.href`");
          }

          answerKeys.add(
            field.shared ?? `${doc.key}.${point.key}.${subpoint.key}.${field.key}`
          );

          // Ścieżka bez kategorii — `summary` odwołuje się w obrębie szablonu.
          fieldsByPath.set(`${point.key}.${subpoint.key}.${field.key}`, field);
        }

        if (subpoint.skip_when) {
          skipChecks.push([sPath, subpoint.skip_when]);
        }
      }
    }
  }

  for (const [path, skip] of skipChecks) {
    if (!skip.answer_key) fail(path, "skip_when bez answer_key");
    else if (!answerKeys.has(skip.answer_key)) {
      fail(path, `skip_when wskazuje na nieznane pole „${skip.answer_key}”`);
    }
    if (!skip.one_of && !Object.prototype.hasOwnProperty.call(skip, "equals")) {
      fail(path, "skip_when wymaga `one_of` albo `equals`");
    }
  }

  // Źródła `summary` muszą wskazywać na istniejące pola.
  for (const [path, field] of fieldsByPath) {
    if (field.kind !== "summary") continue;
    for (const source of field.config?.sources ?? []) {
      if (!fieldsByPath.has(source.field)) {
        fail(path, `summary wskazuje na nieistniejące pole „${source.field}”`);
      }
    }
  }

  return fieldsByPath;
}

// ---------------------------------------------------------------------------
// Generowanie SQL
// ---------------------------------------------------------------------------

/** Literał SQL albo NULL. */
const lit = (value) =>
  value === undefined || value === null || value === ""
    ? "null"
    : `'${String(value).replace(/'/g, "''")}'`;

const jsonLit = (value) =>
  value === undefined || value === null
    ? "'{}'::jsonb"
    : `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;

const bool = (value) => (value ? "true" : "false");

/** Tablica kluczy do czyszczenia elementów usuniętych z JSON-a. */
const keyArray = (keys) =>
  keys.length === 0 ? "array[]::text[]" : `array[${keys.map(lit).join(", ")}]`;

function buildSql(doc) {
  const out = [];
  const w = (line = "") => out.push(line);

  w("-- ============================================================================");
  w(`-- ${MIGRATION_NUMBER[doc.key] ?? "0xx"} · Treść etapu: ${doc.title} (v${doc.version})`);
  w("-- ----------------------------------------------------------------------------");
  w("-- PLIK GENEROWANY — nie edytuj ręcznie.");
  w(`-- Źródło: supabase/content/${doc.key}-v${doc.version}.json`);
  w(`-- Regeneracja: npm run content:build -- ${doc.key}-v${doc.version}`);
  w("--");
  w("-- Idempotentny: ponowne uruchomienie aktualizuje treść i usuwa elementy,");
  w("-- które zniknęły z pliku źródłowego. Odpowiedzi userów zostają nietknięte,");
  w("-- bo są kluczowane po answer_key, nie po id.");
  w("-- ============================================================================");
  w();
  w("do $$");
  w("declare");
  w("  v_template uuid;");
  w("  v_category uuid;");
  w("  v_point    uuid;");
  w("  v_subpoint uuid;");
  w("begin");
  w();

  w("  insert into public.stage_templates");
  w("    (key, version, title, subtitle, intro, position, finish_label, published_at)");
  w(`  values (${lit(doc.key)}, ${doc.version}, ${lit(doc.title)}, ${lit(doc.subtitle)},`);
  w(`          ${lit(doc.intro)}, ${doc.position ?? 1}, ${lit(doc.finish_label)}, now())`);
  w("  on conflict (key, version) do update set");
  w("    title = excluded.title, subtitle = excluded.subtitle, intro = excluded.intro,");
  w("    position = excluded.position, finish_label = excluded.finish_label,");
  w("    published_at = now()");
  w("  returning id into v_template;");
  w();

  const categoryKeys = [];

  doc.categories.forEach((category, ci) => {
    categoryKeys.push(category.key);
    w(`  -- ═══ kategoria: ${category.title} ═══`);
    w("  insert into public.stage_categories");
    w("    (template_id, key, title, intro, always_active, position)");
    w(`  values (v_template, ${lit(category.key)}, ${lit(category.title)}, ${lit(category.intro)},`);
    w(`          ${bool(category.always_active)}, ${ci + 1})`);
    w("  on conflict (template_id, key) do update set");
    w("    title = excluded.title, intro = excluded.intro,");
    w("    always_active = excluded.always_active, position = excluded.position");
    w("  returning id into v_category;");
    w();

    const pointKeys = [];

    (category.points ?? []).forEach((point, pi) => {
      pointKeys.push(point.key);
      w(`  -- ── punkt ${pi + 1}: ${point.title}`);
      w("  insert into public.stage_points");
      w("    (category_id, key, title, description, duration_hint,");
      w("     guide_body, guide_sources, guide_source_label, shared_key, position)");
      w(`  values (v_category, ${lit(point.key)}, ${lit(point.title)}, ${lit(point.description)},`);
      w(`          ${lit(point.duration_hint)}, ${lit(point.guide_body)},`);
      w(`          ${jsonLit(point.guide_sources ?? [])}, ${lit(point.guide_source_label)},`);
      w(`          ${lit(point.shared ?? null)}, ${pi + 1})`);
      w("  on conflict (category_id, key) do update set");
      w("    title = excluded.title, description = excluded.description,");
      w("    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,");
      w("    guide_sources = excluded.guide_sources,");
      w("    guide_source_label = excluded.guide_source_label,");
      w("    shared_key = excluded.shared_key, position = excluded.position");
      w("  returning id into v_point;");
      w();

      const subpointKeys = [];

      (point.subpoints ?? []).forEach((subpoint, si) => {
        subpointKeys.push(subpoint.key);
        const skipSql = subpoint.skip_when ? jsonLit(subpoint.skip_when) : "null";
        w("  insert into public.stage_subpoints");
        w("    (point_id, key, title, description, is_optional, shared_key, skip_when, position)");
        w(`  values (v_point, ${lit(subpoint.key)}, ${lit(subpoint.title)},`);
        w(`          ${lit(subpoint.description)}, ${bool(subpoint.is_optional)},`);
        w(`          ${lit(subpoint.shared ?? null)}, ${skipSql}, ${si + 1})`);
        w("  on conflict (point_id, key) do update set");
        w("    title = excluded.title, description = excluded.description,");
        w("    is_optional = excluded.is_optional, shared_key = excluded.shared_key,");
        w("    skip_when = excluded.skip_when,");
        w("    position = excluded.position");
        w("  returning id into v_subpoint;");
        w();

        const fieldKeys = [];

        (subpoint.fields ?? []).forEach((field, fi) => {
          fieldKeys.push(field.key);
          // Stabilny answer_key: gdyby zależał od wygenerowanego id, ponowny
          // import treści osierociłby wszystkie zapisane odpowiedzi.
          const sharedKey =
            field.shared ??
            `${doc.key}.${point.key}.${subpoint.key}.${field.key}`;

          w("  insert into public.stage_fields");
          w("    (subpoint_id, key, kind, question, help, example,");
          w("     is_required, shared_key, config, position)");
          w(`  values (v_subpoint, ${lit(field.key)}, ${lit(field.kind)},`);
          w(`          ${lit(field.question)}, ${lit(field.help)}, ${lit(field.example)},`);
          w(`          ${bool(field.is_required !== false)}, ${lit(sharedKey)},`);
          w(`          ${jsonLit(field.config ?? {})}, ${fi + 1})`);
          w("  on conflict (subpoint_id, key) do update set");
          w("    kind = excluded.kind, question = excluded.question,");
          w("    help = excluded.help, example = excluded.example,");
          w("    is_required = excluded.is_required, shared_key = excluded.shared_key,");
          w("    config = excluded.config, position = excluded.position;");
          w();
        });

        w(`  delete from public.stage_fields`);
        w(`  where subpoint_id = v_subpoint and key <> all(${keyArray(fieldKeys)});`);
        w();
      });

      w(`  delete from public.stage_subpoints`);
      w(`  where point_id = v_point and key <> all(${keyArray(subpointKeys)});`);
      w();
    });

    w(`  delete from public.stage_points`);
    w(`  where category_id = v_category and key <> all(${keyArray(pointKeys)});`);
    w();
  });

  w(`  delete from public.stage_categories`);
  w(`  where template_id = v_template and key <> all(${keyArray(categoryKeys)});`);
  w();
  w("end;");
  w("$$;");
  w();
  w("-- Weryfikacja: policz, co wjechało");
  w("select");
  w("  (select count(*) from public.stage_points p");
  w("     join public.stage_categories c on c.id = p.category_id");
  w("     join public.stage_templates t on t.id = c.template_id");
  w(`     where t.key = ${lit(doc.key)}) as punktow,`);
  w("  (select count(*) from public.stage_subpoints s");
  w("     join public.stage_points p on p.id = s.point_id");
  w("     join public.stage_categories c on c.id = p.category_id");
  w("     join public.stage_templates t on t.id = c.template_id");
  w(`     where t.key = ${lit(doc.key)}) as podpunktow,`);
  w("  (select count(*) from public.stage_fields f");
  w("     join public.stage_subpoints s on s.id = f.subpoint_id");
  w("     join public.stage_points p on p.id = s.point_id");
  w("     join public.stage_categories c on c.id = p.category_id");
  w("     join public.stage_templates t on t.id = c.template_id");
  w(`     where t.key = ${lit(doc.key)}) as pol;`);
  w();

  return out.join("\n");
}

// ---------------------------------------------------------------------------

const name = process.argv[2];
if (!name) {
  console.error("Użycie: npm run content:build -- <nazwa-pliku-bez-rozszerzenia>");
  console.error("Przykład: npm run content:build -- ambition-v1");
  process.exit(1);
}

const source = join(CONTENT_DIR, `${name}.json`);
if (!existsSync(source)) {
  console.error(`Nie ma pliku ${source}`);
  process.exit(1);
}

const doc = JSON.parse(readFileSync(source, "utf8"));

// Przewodniki trzymamy osobno — to setki linii prozy wyciągniętej z sekcji
// „Przewodnik" w dokumentach merytorycznych. W głównym pliku treści
// zasłaniałyby strukturę pytań.
const guidesPath = join(CONTENT_DIR, `${name}.guides.json`);
if (existsSync(guidesPath)) {
  const guides = JSON.parse(readFileSync(guidesPath, "utf8"));
  for (const category of doc.categories ?? []) {
    for (const point of category.points ?? []) {
      const guide = guides[category.key]?.[point.guide ?? point.key];
      if (!guide) continue;
      point.guide_body = point.guide_body ?? guide.body ?? null;
      point.guide_sources = point.guide_sources ?? guide.sources ?? [];
    }
  }
}

validate(doc);

if (errors.length > 0) {
  console.error(`\n✖ Treść ma ${errors.length} ${errors.length === 1 ? "błąd" : "błędów"}:\n`);
  for (const error of errors) console.error(`   ${error}`);
  console.error("");
  process.exit(1);
}

const number = MIGRATION_NUMBER[doc.key] ?? "0xx";
const target = join(MIGRATIONS_DIR, `${number}_content_${name.replace(/-/g, "_")}.sql`);
writeFileSync(target, buildSql(doc), "utf8");

const counts = doc.categories.reduce(
  (acc, c) => {
    acc.points += (c.points ?? []).length;
    for (const p of c.points ?? []) {
      acc.subpoints += (p.subpoints ?? []).length;
      for (const s of p.subpoints ?? []) acc.fields += (s.fields ?? []).length;
    }
    return acc;
  },
  { points: 0, subpoints: 0, fields: 0 }
);

console.log(`✓ ${doc.title} v${doc.version}`);
console.log(
  `  ${doc.categories.length} kategorii · ${counts.points} punktów · ` +
    `${counts.subpoints} podpunktów · ${counts.fields} pól`
);
console.log(`  → ${target.replace(ROOT + "\\", "").replace(ROOT + "/", "")}`);
