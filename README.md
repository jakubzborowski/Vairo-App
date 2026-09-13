# Vairo App

Frontend Vairo (Next.js) — landing, auth (Google + magic link via Supabase) i przykładowy dashboard.

## Setup

```bash
npm install
cp .env.example .env.local
```

Uzupełnij `.env.local` wspólnymi wartościami projektu Supabase (ten sam backend dla całego zespołu):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm run dev
```

Aplikacja: [http://localhost:3000](http://localhost:3000)

## Schemat profilu / onboarding

Po rejestracji każdy user musi dokończyć profil (bez pomijania):

1. **Imię i nazwisko** → `profiles.full_name`
2. **Opis pomysłu** → `profiles.idea_description` (wymagany, bez „pomiń”)
3. **Tagi obszarów** → `tags` + `profile_tags` (≥1 wymagany)

SQL: [`supabase/profiles.sql`](supabase/profiles.sql) — wklej w **Supabase → SQL Editor → Run**.

Kluczowe kolumny: `onboarding_step` (`name` → `idea` → `tags` → `done`), `onboarding_completed_at` (null = nieukończone). Widok `profile_onboarding_status` ułatwia gate w aplikacji.

## Profil społeczny

Po onboardingu: [`/app/profile`](http://localhost:3000/app/profile) — skille, avatar, weekly focus, tworzenie teamu.

SQL: [`supabase/profile_social.sql`](supabase/profile_social.sql) (odpal po `profiles.sql`).

## Ważne dla zespołu

- Używajcie **`http://localhost:3000`** (nie `127.0.0.1` / IP w LAN), żeby OAuth i cookies działały z allowlistą Supabase/Google.
- **Nie commitujcie** `.env.local`, kluczy Resend ani Google Client Secret.
- Auth (Google, SMTP/Resend, użytkownicy) jest w **jednym projekcie Supabase** — konfiguracja dashboardu jest wspólna.
- Po zmianach schematu odpal ponownie `supabase/profiles.sql` na wspólnym projekcie.
