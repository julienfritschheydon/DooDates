-- ============================================================================
-- FIX USER_QUOTAS RLS POLICIES
-- ============================================================================
-- Problème détecté : user_quotas a seulement 1 politique SELECT, pas d'INSERT
-- Ce script corrige les politiques RLS pour user_quotas
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
WHERE tablename = 'user_quotas'
ORDER BY policyname;

-- Étape 2 : Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_quotas'
ORDER BY ordinal_position;

-- Étape 3 : Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "user_quotas_select_access" ON user_quotas;
DROP POLICY IF EXISTS "Users can view own user quotas" ON user_quotas;
DROP POLICY IF EXISTS "Users can insert own user quotas" ON user_quotas;
DROP POLICY IF EXISTS "Users can update own user quotas" ON user_quotas;
DROP POLICY IF EXISTS "Service role full access user_quotas" ON user_quotas;

-- Étape 4 : S'assurer que RLS est activé
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- Étape 5 : Créer les politiques RLS correctes

-- Politique SELECT : Les utilisateurs peuvent voir uniquement leurs propres quotas
CREATE POLICY "Users can view own user quotas" ON user_quotas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT : Les utilisateurs peuvent créer leur propre quota
-- Note: Généralement créé automatiquement, mais nécessaire pour les cas manuels
CREATE POLICY "Users can insert own user quotas" ON user_quotas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : Les utilisateurs peuvent mettre à jour leur propre quota
CREATE POLICY "Users can update own user quotas" ON user_quotas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique Service Role : Accès complet pour les Edge Functions et scripts backend
CREATE POLICY "Service role full access user_quotas" ON user_quotas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Étape 6 : Vérification finale
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
WHERE tablename = 'user_quotas'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
1. Cette table est utilisée pour gérer les quotas des utilisateurs (tier, crédits, etc.).
2. Les utilisateurs doivent pouvoir voir et mettre à jour uniquement leurs propres quotas.
3. Le service_role a besoin d'un accès complet pour les Edge Functions et les scripts backend.
4. La colonne user_id est de type UUID, d'où l'utilisation directe de auth.uid().
*/

