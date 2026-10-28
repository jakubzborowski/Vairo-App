-- Hosted Supabase: enable the real pg_cron extension and register exactly one
-- named job. Fail visibly when Cron is unavailable; never silently skip setup.
begin;
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
select cron.schedule('vairo-score-reward-queue','*/5 * * * *','select public.score_flush_due_rewards();');
commit;
