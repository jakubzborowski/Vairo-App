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

### Stabilny `answer_key`

Odpowiedzi kluczujemy po `stage_fields.answer_key`, nie po `field_id`:

```sql
answer_key text generated always as (coalesce(shared_key, id::text)) stored
```

Importer nadaje każdemu polu `shared_key` = `<stage>.<punkt>.<podpunkt>.<pole>`,
więc ponowny import **nie osierocia zapisanych odpowiedzi**. Pola współdzielone
między kategoriami (oznaczone gwiazdką w dokumentach źródłowych) dostają wspólny
`shared_key` → jedno pytanie, jedna odpowiedź, niezależnie od kategorii.
