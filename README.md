# Vairo App

Aplikacja Vairo (Next.js, Supabase, TypeScript). Workspace startupu, pięć etapów programu i warstwa Social.

## Uruchomienie lokalnie

```bash
npm install
cp .env.example .env.local
```

Uzupełnij `.env.local` wartościami wspólnego projektu Supabase. Nie commituj tego pliku.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm run dev
```

Aplikacja: [http://localhost:3000](http://localhost:3000). Używaj `localhost`, nie `127.0.0.1` — inaczej OAuth i ciasteczka nie zejdą się z allowlistą Supabase.

```bash
npm run typecheck
npm run lint
npm run build
```

## Migracje

Pliki leżą w `supabase/migrations/`. Wklejasz je w **Supabase → SQL Editor** i odpalasz **po kolei, według numeru**. Każdy plik jest idempotentny: powtórne odpalenie nie dubluje danych.

Pełna kolejność — razem ze schematem bazowym, który leży **poza** `migrations/` — jest w [`supabase/README.md`](supabase/README.md). Zaczęcie od `002` kończy się błędem „relation does not exist".

Execution Stage (cele, zadania, dowody, warunki Milestones, Rozpiska) jest w `025_execution_goals.sql`. Odpal go po `024` — korzysta z tabel Preparation (`021`). Jeśli wcześniej szedł pod numerem `018`, odpal `025`–`027` jeszcze raz.

Treść MVP Stage jest w `028_content_mvp_v1.sql` — odpal po `027`, bo jej warunki odwołują się do typów celów z Execution.

Tracker w menu (Cele, Taski, Rozpiska) pojawia się, gdy startup domknie Preparation decyzją „kontynuuj”. Domknięcie MVP Stage prowadzi na `/app/stage/complete` (podsumowanie + kontakt w sprawie dalszej współpracy; bez płatności).

Warunki liczby celów wjeżdżają z treści etapu. W JSON podpunktu:

```json
"goal_conditions": [
  { "goal_type_id": "product_test", "min_count": 2, "proof_kind": "link" }
]
```

Potem `npm run content:build -- <plik>`. Typy są stałe: `custom`, `product_test`, `build_result`, `prototype`, `customer`, `research`. Cel liczy się do warunku tylko wtedy, gdy jest jawnie podpięty, ma ten typ, status Ukończony i dowód. Ukończenie zadań tego nie zastępuje.
