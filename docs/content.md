# Treść jako dane, nie kod

> Treść etapów jako dane. Obowiązuje przy zmianie pytań w Ambition
> i Idea oraz przy dotykaniu importera.
> Skrót jest w [CLAUDE.md](../CLAUDE.md).


Treść etapów **nigdy** nie trafia do JSX. Źródłem są pliki JSON:

```
supabase/content/ambition-v1.json        struktura pytań
supabase/content/idea-v1.json            struktura pytań
supabase/content/idea-v1.guides.json     przewodniki (proza z dokumentów)
```

Budowanie migracji SQL z treści:

```bash
npm run content:build -- idea-v1
```

Skrypt `scripts/build-content.mjs` **waliduje** (nieznane typy pól, duplikaty
kluczy, `summary` wskazujący na nieistniejące pole), a potem generuje idempotentną
migrację, która usuwa też elementy usunięte z JSON-a.

**Dlaczego tak:** zmiana pytania to jednolinijkowy diff, nie szukanie w SQL-u;
nie wymaga deployu ani migracji pisanej ręcznie; treść jest wersjonowana.

## Plik treści nie może wyprzedzać schematu

Plik treści dostaje **niski numer** (Ambition 006, Idea 007), ale generator
rośnie razem ze schematem. Po scaleniu Preparation i Execution ponowne
`content:build -- idea-v1` dopisywało do każdego podpunktu Idei `skip_when`
(powstaje w 021) i `depends_on` (026) — a na świeżej bazie 007 biegnie
dwadzieścia migracji wcześniej i kończy się „column does not exist". Błąd nie
wychodził przy generowaniu, tylko przy pierwszym stawianiu bazy od zera.

Dlatego `COLUMN_SINCE` w `build-content.mjs` mówi, od której migracji istnieje
każda kolumna, a generator wypisuje ją wyłącznie do plików z wyższym numerem.
Użycie takiej kolumny w szablonie o niższym numerze (np. `skip_when` w Idei)
**zatrzymuje generowanie** z komunikatem — wartość nie znika po cichu.

**Nowa kolumna w generatorze = nowy wpis w `COLUMN_SINCE`**, z numerem
migracji, która ją tworzy. Sprawdzian, że nic się nie rozjechało: ponowne
wygenerowanie wszystkich czterech plików treści ma dać zerowy diff.

### Stabilny `answer_key`

Odpowiedzi kluczujemy po `stage_fields.answer_key`, nie po `field_id`:

```sql
answer_key text generated always as (coalesce(shared_key, id::text)) stored
```

Importer nadaje każdemu polu `shared_key` = `<stage>.<punkt>.<podpunkt>.<pole>`,
więc ponowny import **nie osierocia zapisanych odpowiedzi**. Pola współdzielone
między kategoriami (oznaczone gwiazdką w dokumentach źródłowych) dostają wspólny
`shared_key` → jedno pytanie, jedna odpowiedź, niezależnie od kategorii.
