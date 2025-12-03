-- ============================================================================
-- FIX: Désactiver l'accès direct anon à guest_quotas (403 Forbidden)
-- Description: Force l'utilisation de l'Edge Function uniquement
-- Date: 2025-01-XX
-- ============================================================================
-- 
-- Problème: Erreur 403 Forbidden sur POST /rest/v1/guest_quotas en production
-- Cause: Appels directs depuis le client au lieu de passer par l'Edge Function
-- Solution: Désactiver complètement l'accès anon à guest_quotas
--           L'Edge Function utilise service_role et bypass RLS
-- ============================================================================

BEGIN;

-- Supprimer toutes les politiques anon existantes
DROP POLICY IF EXISTS "Allow public read access" ON guest_quotas;
DROP POLICY IF EXISTS "Allow public insert" ON guest_quotas;
DROP POLICY IF EXISTS "Allow public update" ON guest_quotas;

-- Garder uniquement la politique service_role (pour l'Edge Function)
-- Cette politique existe déjà normalement, mais on la recrée pour être sûr
-- IMPORTANT: Créer la politique AVANT d'activer RLS pour éviter un blocage temporaire
DROP POLICY IF EXISTS "Service role full access guest_quotas" ON guest_quotas;
CREATE POLICY "Service role full access guest_quotas"
  ON guest_quotas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- S'assurer que RLS est activé (après avoir créé la politique service_role)
ALTER TABLE guest_quotas ENABLE ROW LEVEL SECURITY;

-- Vérification: Aucune politique anon ne devrait exister maintenant
-- Les appels directs depuis le client seront bloqués (403)
-- Seule l'Edge Function (service_role) peut accéder à la table

COMMIT;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Les clients DOIVENT utiliser l'Edge Function /functions/v1/quota-tracking
-- 2. L'Edge Function utilise SUPABASE_SERVICE_ROLE_KEY et bypass RLS
-- 3. Les appels directs depuis le client seront maintenant bloqués (403)
-- 4. Cela force la migration vers l'Edge Function pour tous les clients
-- ============================================================================

