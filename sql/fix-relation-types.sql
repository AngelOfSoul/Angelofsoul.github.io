-- fix-relation-types.sql — Calnic Online
-- CRITICAL FIX: Actualizeaza constrangerea CHECK pentru relation_type sa accepte
-- toate tipurile romanesti folosite de interfata.
-- SAFE TO RE-RUN: DROP/ADD pe constraint, CREATE OR REPLACE pe politici.
--
-- Ruleaza in Supabase SQL Editor.

-- ════════════════════════════════════════════════════════════
-- 1. ACTUALIZEAZA CONSTRANGEREA CHECK PENTRU relation_type
-- ════════════════════════════════════════════════════════════
-- Vechea constrangere accepta doar: 'parent','sibling','spouse','in_law','step','adopted'
-- Noua constrangere accepta si tipurile romanesti specifice din UI:
--   tata/mama/fiu/fiica/frate/sora/sot/sotie + bunici + strabunici + familie extinsa

ALTER TABLE member_relations
  DROP CONSTRAINT IF EXISTS member_relations_relation_type_check;

ALTER TABLE member_relations
  ADD CONSTRAINT member_relations_relation_type_check
    CHECK (relation_type IN (
      -- Tipuri vechi (compatibilitate cu date existente)
      'parent', 'sibling', 'spouse', 'in_law', 'child',
      -- Tipuri noi (folosite de UI)
      'tata', 'mama', 'step', 'adopted',
      'bunic', 'bunica', 'strabunic', 'strabunica',
      'fiu', 'fiica',
      'frate', 'sora',
      'sot', 'sotie',
      'unchi', 'matusa', 'nepot', 'nepoata',
      'var', 'vara',
      'socru', 'soacra'
    ));

-- ════════════════════════════════════════════════════════════
-- 2. CORECTEAZA POLITICA RLS PENTRU CITIRE member_relations
-- ════════════════════════════════════════════════════════════
-- Problema: politica veche permite citirea DOAR cand from_member_id e public.
-- Daca relatia e {from: copil_privat, to: parinte_public}, nu e vizibila.
-- Fix: permite citirea daca ORICARE din cei doi membri e vizibil/accesibil.

DO $$ BEGIN
  DROP POLICY IF EXISTS "public read member_relations" ON member_relations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "public read member_relations"
    ON member_relations FOR SELECT
    USING (
      -- Relatia e vizibila daca oricare din membri e public
      EXISTS (
        SELECT 1 FROM members m
        WHERE m.id = member_relations.from_member_id
          AND m.visibility = 'public'
      )
      OR
      EXISTS (
        SELECT 1 FROM members m
        WHERE m.id = member_relations.to_member_id
          AND m.visibility = 'public'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- 3. ADAUGA POLITICA OWNER READ PENTRU member_relations
-- ════════════════════════════════════════════════════════════
-- Problema: proprietarul poate scrie (owner write = ALL), dar ALL include si SELECT
-- cu constrangerea ca from_member_id sa apartina familiei sale.
-- Daca relatia e {from: membru_extern, to: membrul_meu}, proprietarul nu o vede.
-- Fix: adauga politica separata pentru citire care acopera ambele directii.

DO $$ BEGIN
  DROP POLICY IF EXISTS "owner read member_relations" ON member_relations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "owner read member_relations"
    ON member_relations FOR SELECT
    USING (
      -- Proprietarul vede toate relatiile care implica membrii familiei sale
      EXISTS (
        SELECT 1 FROM members m
        JOIN families f ON f.id = m.family_id
        WHERE (m.id = member_relations.from_member_id OR m.id = member_relations.to_member_id)
          AND f.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- 4. CORECTEAZA POLITICA OWNER WRITE PENTRU member_relations
-- ════════════════════════════════════════════════════════════
-- Problema: politica veche verifica doar from_member_id.
-- Daca utilizatorul adauga o relatie {from: membrul_meu, to: altcineva},
-- politica functioneaza. Dar adaugam si WITH CHECK explicit pentru securitate.

DO $$ BEGIN
  DROP POLICY IF EXISTS "owner write member_relations" ON member_relations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "owner write member_relations"
    ON member_relations FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM members m
        JOIN families f ON f.id = m.family_id
        WHERE m.id = member_relations.from_member_id
          AND f.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM members m
        JOIN families f ON f.id = m.family_id
        WHERE m.id = member_relations.from_member_id
          AND f.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- 5. ADAUGA COLOANE LIPSA LA TABELA members (DACA LIPSESC)
-- ════════════════════════════════════════════════════════════
-- Interfata salveaza initial: nv.charAt(0).toUpperCase() la adaugarea membrilor.
-- Migreaza si datele existente.

ALTER TABLE members ADD COLUMN IF NOT EXISTS initial text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

UPDATE members SET initial = upper(substring(name FROM 1 FOR 1))
WHERE initial IS NULL AND name IS NOT NULL AND name <> '';

UPDATE members SET role = 'member' WHERE role IS NULL;

-- ════════════════════════════════════════════════════════════
-- VERIFICARE (optional)
-- ════════════════════════════════════════════════════════════
-- SELECT conname, consrc FROM pg_constraint
-- WHERE conrelid = 'member_relations'::regclass AND contype = 'c';
--
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'member_relations'
-- ORDER BY cmd;
