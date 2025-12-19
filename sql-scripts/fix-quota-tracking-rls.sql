-- ============================================================================
-- FIX QUOTA_TRACKING RLS POLICIES
-- ============================================================================
-- Problème détecté : quota_tracking a 1 politique mais pas de politique SELECT
-- Ce script corrige les politiques RLS pour quota_tracking
-- ============================================================================

-- Étape 1 : Vérifier l'état actuel
SELECT 
  tablename,
  policyname,
  cmd as operation,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'quota_tracking'
ORDER BY policyname;

-- Étape 2 : Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "quota_tracking_policy" ON quota_tracking;
DROP POLICY IF EXISTS "Users can view own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can view own quotas" ON quota_tracking;
DROP POLICY IF EXISTS "Users can create own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can insert own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can update own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Service role full access quota" ON quota_tracking;
DROP POLICY IF EXISTS "Service role full access quota_tracking" ON quota_tracking;

-- Étape 3 : S'assurer que RLS est activé
ALTER TABLE quota_tracking ENABLE ROW LEVEL SECURITY;

-- Étape 4 : Créer les politiques RLS correctes

-- Politique SELECT : Les utilisateurs peuvent voir uniquement leurs propres quotas
CREATE POLICY "Users can view own quota" ON quota_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT : Les utilisateurs peuvent créer leur propre quota
CREATE POLICY "Users can insert own quota" ON quota_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : Les utilisateurs peuvent mettre à jour leur propre quota
CREATE POLICY "Users can update own quota" ON quota_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE : Les utilisateurs peuvent supprimer leur propre quota (optionnel)
-- CREATE POLICY "Users can delete own quota" ON quota_tracking
--   FOR DELETE
--   TO authenticated
--   USING (auth.uid()::text = user_id);

-- Politique Service Role : Accès complet pour les Edge Functions
CREATE POLICY "Service role full access quota_tracking" ON quota_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Étape 5 : Vérification finale
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'ALL' AND roles = '{service_role}' THEN '✅ Service role (normal)'
    ELSE '⚠️ Vérifier la condition'
  END as security_check
FROM pg_policies
WHERE tablename = 'quota_tracking'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
1. Cette table est utilisée pour suivre les quotas des utilisateurs authentifiés.
2. Les utilisateurs doivent pouvoir voir et mettre à jour uniquement leurs propres quotas.
3. Le service_role a besoin d'un accès complet pour les Edge Functions qui consomment les crédits.
4. La colonne user_id est de type UUID, d'où l'utilisation directe de auth.uid() (sans cast).
*/

