-- ============================================
-- DooDates - Script de nettoyage complet
-- ============================================
-- ATTENTION : Ce script SUPPRIME TOUTES LES TABLES
-- À utiliser UNIQUEMENT pour repartir de zéro
-- ============================================

-- Désactiver les contraintes temporairement
SET session_replication_role = 'replica';

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS generate_poll_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Toutes les tables DooDates ont été supprimées avec succès';
END $$;

