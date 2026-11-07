-- SCORE: zadanie pg_cron, które co 5 minut rozlicza kolejkę nagród.
-- Odpal PO 046. Idempotentna (cron.schedule nadpisuje zadanie o tej nazwie).
--
-- pg_cron włącza się w Supabase → Database → Extensions. Supabase sam nadaje
-- wtedy uprawnienia do schematu `cron`. Wcześniejsza wersja tego pliku robiła
-- `create extension` i ręczne `grant` — na hostowanym Supabase kończyło się to
-- błędem 2BP01 („dependent privileges exist”) z jego własnego triggera.
-- Bez włączonego rozszerzenia plik zatrzymuje się z czytelnym komunikatem,
-- zamiast po cichu nic nie zaplanować.
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Włącz pg_cron: Supabase → Database → Extensions → pg_cron, potem odpal ten plik jeszcze raz.';
  end if;
end $$;

select cron.schedule('vairo-score-reward-queue','*/5 * * * *','select public.score_flush_due_rewards();');
