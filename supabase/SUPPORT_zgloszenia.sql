-- ===========================================================================
-- SUPPORT_zgloszenia.sql — zgłoszenia z „Pomoc i opinie” (migracja 043)
-- ===========================================================================
--
-- Odpal w Supabase → SQL Editor. Sekcje są niezależne — zaznacz i uruchom
-- tę, której potrzebujesz.
--
-- Normalnie nic tu nie trzeba robić: każde zgłoszenie przychodzi mailem do
-- skrzynki z SUPPORT_INBOX_EMAIL, a odpowiada się z poczty. Ten plik jest
-- na sytuacje awaryjne i na prośby o usunięcie danych.
-- ===========================================================================


-- 1. NIEDOSTARCZONE — zgłoszenia, których mail nie wyszedł (brak konfiguracji
--    Resend, awaria dostawcy). Odpisz autorowi ręcznie na contact_email.
select reference, created_at, delivery_status, delivery_error,
       contact_name, contact_email, startup_name, kind, page_path, message
  from public.support_requests
 where delivery_status <> 'sent'
 order by created_at;


-- 2. Po ręcznej obsłudze oznacz jako dostarczone (podmień numer)
-- update public.support_requests
--    set delivery_status = 'sent', delivered_at = now(), delivery_error = null
--  where reference = 'VA-XXXXXX';


-- 3. ILE i CZEGO dotyczą zgłoszenia — ostatnie 30 dni (tylko odczyt)
select kind, count(*) as zgloszen,
       count(*) filter (where delivery_status = 'sent') as dostarczonych
  from public.support_requests
 where created_at > now() - interval '30 days'
 group by kind
 order by zgloszen desc;


-- 4. PROŚBA O USUNIĘCIE DANYCH (RODO). Zgłoszenia nie znikają razem z kontem
--    — to korespondencja z firmą. Na prośbę osoby usuń je tutaj i ręcznie
--    z poczty (wątki z tym samym adresem / numerem VA-…).
-- delete from public.support_requests
--  where lower(contact_email) = lower('ADRES@PRZYKLAD.PL');


-- 5. RETENCJA — zgłoszenia starsze niż 24 miesiące (dopasuj do polityki
--    prywatności, zanim odpalisz).
-- delete from public.support_requests
--  where created_at < now() - interval '24 months';
