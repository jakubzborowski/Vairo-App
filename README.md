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

## Ważne dla zespołu

- Używajcie **`http://localhost:3000`** (nie `127.0.0.1` / IP w LAN), żeby OAuth i cookies działały z allowlistą Supabase/Google.
- **Nie commitujcie** `.env.local`, kluczy Resend ani Google Client Secret.
- Auth (Google, SMTP/Resend, użytkownicy) jest w **jednym projekcie Supabase** — konfiguracja dashboardu jest wspólna.
