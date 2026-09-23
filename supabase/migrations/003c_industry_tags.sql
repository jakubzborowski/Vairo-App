-- ============================================================================
-- 003c · Pełna lista branż + sprzątanie placeholderów
-- ----------------------------------------------------------------------------
-- Krok wyboru branży pokazywał tylko kilka pozycji i zmuszał do szukania
-- reszty. Przy dwudziestu kilku branżach nie ma powodu, żeby ich nie pokazać
-- wszystkich naraz — wyszukiwarka zostaje wyłącznie do dodawania własnych.
--
-- Dodatkowo chowamy z listy placeholdery z poprzedniego designu
-- („anti-virus", „anti-bot"), które nigdy nie były branżami.
--
-- Odpal PO 003. Idempotentne. Jeśli 003 odpalałeś już w nowej wersji,
-- ten plik nic nie zmieni — i o to chodzi.
-- ============================================================================

update public.industry_tags set is_suggested = false
where slug like 'anti-%'
   or slug in ('b2b', 'b2c', 'saas', 'hardware');

insert into public.industry_tags (slug, label, is_suggested, created_by)
values
  ('ai',             'AI',                    true, null),
  ('fintech',        'Finanse',               true, null),
  ('edtech',         'Edukacja',              true, null),
  ('healthtech',     'Zdrowie',               true, null),
  ('ecommerce',      'E-commerce',            true, null),
  ('marketplace',    'Marketplace',           true, null),
  ('gastronomia',    'Gastronomia',           true, null),
  ('logistyka',      'Logistyka',             true, null),
  ('nieruchomosci',  'Nieruchomości',         true, null),
  ('produktywnosc',  'Produktywność',         true, null),
  ('hr',             'HR i rekrutacja',       true, null),
  ('marketing',      'Marketing i sprzedaż',  true, null),
  ('media',          'Media i treści',        true, null),
  ('rozrywka',       'Rozrywka i gry',        true, null),
  ('sport',          'Sport i kondycja',      true, null),
  ('podroze',        'Podróże',               true, null),
  ('moda',           'Moda i uroda',          true, null),
  ('dom',            'Dom i wnętrza',         true, null),
  ('motoryzacja',    'Motoryzacja',           true, null),
  ('rolnictwo',      'Rolnictwo',             true, null),
  ('budownictwo',    'Budownictwo',           true, null),
  ('energia',        'Energia i środowisko',  true, null),
  ('prawo',          'Prawo',                 true, null),
  ('spolecznosci',   'Społeczności',          true, null)
on conflict (slug) do update
set label = excluded.label, is_suggested = true;

select count(*) as branz_do_wyboru
from public.industry_tags
where is_suggested;
