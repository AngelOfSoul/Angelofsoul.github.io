-- seed-demo-data.sql
-- Pre-populates the 5 Phase-1 demo families (Popescu, Muresan, Ionescu, Moldovan, Popa)
-- with fixed UUIDs so the seed can be reproduced safely.
--
-- Run this in the Supabase SQL Editor AFTER creating the tables (see README-SUPABASE.md).
-- The pin_hash values are base64 encodings of the demo PINs (e.g. '1874' → base64).

-- ── FAMILIES ─────────────────────────────────────────────────────────────────

insert into families
  (id, name, village, since,
   desc_ro, desc_en,
   members_count, generations_count, photos_count,
   show_members, show_generations, show_photos, show_since,
   has_public_photos, has_private_photos,
   pin_hash)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Familia Popescu', 'Calnic', 1874,
    'Familie de agricultori cu radacini adanci, trei generatii in inima satului Calnic.',
    'A farming family with deep roots, three generations in the heart of Calnic village.',
    12, 4, 47,
    true, true, true, true,
    true, true,
    'MTg3NA=='   -- base64('1874')
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Familia Muresan', 'Deal', 1912,
    'Mesteri dulgheri renumiti, detin cea mai veche casa din Deal, construita in 1803.',
    '',
    null, null, null,
    false, false, false, false,
    true, false,
    null
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Familia Ionescu', 'Calnic', 1960,
    'Familie de apicultori, renumita pentru mierea de salcam. Mentinem stupina familiei de peste 60 de ani.',
    'A beekeeping family, renowned for their acacia honey. We have maintained the family apiary for over 60 years.',
    7, 4, 28,
    true, true, true, true,
    true, true,
    'MTk2MA=='   -- base64('1960')
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Familia Moldovan', 'Calnic', 1888,
    'Familie cu traditie in viticultura si pomicultura, cunoscuta pentru vinul de Calnic.',
    'A family with a tradition in viticulture and fruit growing, known for their Calnic wine.',
    4, 3, 7,
    true, true, true, true,
    true, false,
    'MTg4OA=='   -- base64('1888')
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Familia Popa', 'Deal', 1935,
    'Familie de crescatori de albine si fermieri, cu o gospodarie traditionala in Deal.',
    '',
    6, 2, 15,
    true, false, true, true,
    false, true,
    'MTkzNQ=='   -- base64('1935')
  )
on conflict (id) do nothing;

-- ── MEMBERS ──────────────────────────────────────────────────────────────────

insert into members
  (id, family_id, name, initial, role, birth_year, death_year, is_deceased)
values
  -- Familia Popescu
  ('a1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Ion Popescu',      'I', 'Cap de familie', 1948, null, false),
  ('a1000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Maria Popescu',    'M', 'Sotie',          1952, null, false),
  ('a1000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Gheorghe Popescu', 'G', 'Tata',           1920, 1998, true),
  ('a1000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'Ana Popescu',      'A', 'Fiica',          1978, null, false),
  ('a1000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   'Dan Popescu',      'D', 'Fiu',            1981, null, false),
  -- Familia Ionescu
  ('a3000003-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Vasile Ionescu',   'V', 'Cap de familie', 1955, null, false),
  ('a3000003-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'Elena Ionescu',    'E', 'Sotie',          1958, null, false),
  -- Familia Moldovan
  ('a4000004-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
   'Petru Moldovan',   'P', 'Cap de familie', 1962, null, false),
  ('a4000004-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444',
   'Ioana Moldovan',   'I', 'Sotie',          1965, null, false),
  -- Familia Popa
  ('a5000005-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   'Nicolae Popa',     'N', 'Cap de familie', 1970, null, false),
  ('a5000005-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555',
   'Cornelia Popa',    'C', 'Sotie',          1973, null, false)
on conflict (id) do nothing;

-- ── TIMELINE ─────────────────────────────────────────────────────────────────

insert into timeline
  (id, family_id, year, text_ro, text_en)
values
  -- Familia Popescu
  ('b1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   1874,
   'Familia se stabileste in Calnic, venind din zona Sebesului.',
   'The family settles in Calnic, coming from the Sebes area.'),
  ('b1000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   1920,
   'Se construieste casa familiei pe dealul din vestul satului.',
   'The family home is built on the hill west of the village.'),
  ('b1000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   1976,
   'Ion Popescu se casatoreste cu Maria Muresan.',
   'Ion Popescu marries Maria Muresan.'),
  ('b1000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   2002,
   'Ana Popescu se casatoreste cu Mihai Stan.',
   'Ana Popescu marries Mihai Stan.'),
  -- Familia Ionescu
  ('b3000003-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   1960,
   'Familia Ionescu se muta in Calnic din judetul Cluj.',
   'The Ionescu family moves to Calnic from Cluj county.'),
  ('b3000003-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   1985,
   'Incepe stupina familiala, cu primii 10 stupi de albine.',
   'The family apiary begins, with the first 10 beehives.'),
  -- Familia Moldovan
  ('b4000004-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
   1888,
   'Familia Moldovan planteaza primele vii pe dealurile din Calnic.',
   'The Moldovan family plants the first vineyards on the hills of Calnic.'),
  ('b4000004-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444',
   1950,
   'Vinul de Calnic devine cunoscut in toata zona Albei.',
   'Calnic wine becomes known throughout the Alba region.'),
  -- Familia Popa
  ('b5000005-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   1935,
   'Familia Popa se asaza in cartierul Deal, construind o gospodarie traditionala.',
   'The Popa family settles in the Deal area, building a traditional homestead.')
on conflict (id) do nothing;
