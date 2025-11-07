-- ============================================
-- UPGRADE CONVERSATIONS TABLE FOR POLLS
-- ============================================
-- Fichier : upgrade-conversations-for-polls.sql
-- Date : 7 Novembre 2025
-- Objectif : Ajouter les colonnes nécessaires pour stocker les polls dans conversations
-- Architecture : Conversation-centric (tout dans conversations)
-- ============================================

-- ============================================
-- ÉTAPE 1 : AJOUTER LES COLONNES MANQUANTES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== MISE À JOUR TABLE CONVERSATIONS ===';
  RAISE NOTICE 'Ajout des colonnes pour architecture conversation-centric';
  RAISE NOTICE '';
END $$;

-- Ajouter poll_data (JSONB) pour stocker toutes les données du sondage/formulaire
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS poll_data JSONB DEFAULT NULL;

-- Ajouter poll_type pour distinguer date vs form
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS poll_type TEXT CHECK (poll_type IN ('date', 'form'));

-- Ajouter poll_status pour gérer le statut
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS poll_status TEXT DEFAULT 'draft' 
CHECK (poll_status IN ('draft', 'active', 'closed', 'archived'));

-- Ajouter poll_slug pour le partage public
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS poll_slug TEXT UNIQUE;

-- Ajouter tags si pas déjà présent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE 'Colonne tags ajoutée';
  END IF;
END $$;

-- Ajouter metadata si pas déjà présent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Colonne metadata ajoutée';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : CRÉER LES INDEX POUR PERFORMANCE
-- ============================================

-- Index sur poll_slug pour accès rapide via URL
CREATE INDEX IF NOT EXISTS idx_conversations_poll_slug 
ON conversations(poll_slug) 
WHERE poll_slug IS NOT NULL;

-- Index sur user_id + poll_data pour requêtes utilisateur
CREATE INDEX IF NOT EXISTS idx_conversations_user_polls 
ON conversations(user_id) 
WHERE poll_data IS NOT NULL;

-- Index GIN sur poll_data pour recherches JSON
CREATE INDEX IF NOT EXISTS idx_conversations_poll_data 
ON conversations USING GIN(poll_data);

-- Index sur poll_type pour filtrage
CREATE INDEX IF NOT EXISTS idx_conversations_poll_type 
ON conversations(poll_type) 
WHERE poll_type IS NOT NULL;

-- Index sur poll_status pour filtrage
CREATE INDEX IF NOT EXISTS idx_conversations_poll_status 
ON conversations(poll_status) 
WHERE poll_status IS NOT NULL;

-- ============================================
-- ÉTAPE 3 : AJOUTER COMMENTAIRES DOCUMENTATION
-- ============================================

COMMENT ON COLUMN conversations.poll_data IS 
'Données complètes du sondage/formulaire au format JSON. Contient dates, questions, settings, etc.';

COMMENT ON COLUMN conversations.poll_type IS 
'Type de poll : "date" pour sondage de dates, "form" pour formulaire personnalisé';

COMMENT ON COLUMN conversations.poll_status IS 
'Statut du poll : draft (brouillon), active (publié), closed (fermé), archived (archivé)';

COMMENT ON COLUMN conversations.poll_slug IS 
'Slug unique pour partage public du poll (ex: "reunion-equipe-2024")';

-- ============================================
-- ÉTAPE 4 : FONCTION POUR GÉNÉRER LES SLUGS
-- ============================================

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_conversation_poll_slug(poll_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convertir le titre en slug
  base_slug := lower(regexp_replace(poll_title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Limiter à 50 caractères
  base_slug := left(base_slug, 50);
  
  -- Ajouter un suffixe aléatoire court
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  -- Vérifier l'unicité (normalement pas nécessaire avec le hash, mais au cas où)
  WHILE EXISTS (SELECT 1 FROM conversations WHERE poll_slug = final_slug) LOOP
    final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
    counter := counter + 1;
    -- Sécurité : sortir après 10 tentatives
    EXIT WHEN counter > 10;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  col_count INTEGER;
  idx_count INTEGER;
BEGIN
  -- Compter les colonnes ajoutées
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'conversations'
  AND column_name IN ('poll_data', 'poll_type', 'poll_status', 'poll_slug', 'tags', 'metadata');
  
  -- Compter les index créés
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE tablename = 'conversations'
  AND indexname LIKE 'idx_conversations_poll%';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSULTAT DE LA MISE À JOUR ===';
  RAISE NOTICE 'Colonnes ajoutées/vérifiées : % / 6', col_count;
  RAISE NOTICE 'Index créés : %', idx_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table conversations prête pour architecture centrée conversations';
  RAISE NOTICE '';
  RAISE NOTICE 'Documentation : Voir Docs/Database/DATABASE-SCHEMA-COMPLETE.md';
END $$;

-- Afficher la structure finale
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('poll_data', 'poll_type', 'poll_status', 'poll_slug', 'tags', 'metadata')
ORDER BY ordinal_position;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

