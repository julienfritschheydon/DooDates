-- ============================================================================
-- FIX PROFILES RLS POLICIES
-- ============================================================================
-- Problème détecté : Les utilisateurs voient tous les profils (1010) au lieu d'un seul
-- Ce script vérifie et corrige les politiques RLS pour la table profiles
-- ============================================================================

-- Étape 1 : Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Si rowsecurity = false, exécuter :
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Étape 2 : Vérifier les politiques existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Étape 3 : Supprimer toutes les politiques existantes (pour repartir proprement)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;

-- Étape 4 : Créer les politiques RLS correctes

-- Politique SELECT : Les utilisateurs ne peuvent voir que leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Politique UPDATE : Les utilisateurs ne peuvent modifier que leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique INSERT : Les utilisateurs ne peuvent créer que leur propre profil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Politique DELETE : Les utilisateurs ne peuvent supprimer que leur propre profil
-- (Optionnel - à activer si nécessaire)
-- CREATE POLICY "Users can delete own profile" ON profiles
--   FOR DELETE
--   USING (auth.uid() = id);

-- Étape 5 : Politique pour service_role (pour les scripts backend)
-- Cette politique permet au service_role de voir tous les profils (nécessaire pour les opérations système)
CREATE POLICY "Service role full access profiles" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Étape 6 : S'assurer que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Étape 7 : Vérification finale
-- Exécuter cette requête avec un utilisateur authentifié (pas service_role)
-- Devrait retourner uniquement 1 profil (le sien)
SELECT 
  'profiles' as table_name,
  COUNT(*) as visible_records,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ RLS fonctionne correctement'
    WHEN COUNT(*) > 1 THEN '❌ PROBLÈME : RLS ne fonctionne pas - ' || COUNT(*) || ' profils visibles'
    ELSE '⚠️ Aucun profil trouvé'
  END as status
FROM profiles;

-- Étape 8 : Vérifier les politiques créées
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'ALL' AND roles = '{service_role}' THEN '✅ Service role (accès complet normal)'
    ELSE '⚠️ Vérifier la condition'
  END as security_check,
  CASE 
    WHEN cmd = 'INSERT' THEN COALESCE(with_check, 'NULL') 
    ELSE COALESCE(qual, 'NULL')
  END as condition_used
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
/*
1. Ce script doit être exécuté avec la clé service_role (pas anon_key)
   car il modifie les politiques RLS.

2. Après exécution, testez avec un utilisateur authentifié :
   - Connectez-vous avec un utilisateur via l'interface Auth
   - Exécutez : SELECT COUNT(*) FROM profiles;
   - Devrait retourner 1 (votre propre profil)

3. Si vous testez depuis le SQL Editor de Supabase Dashboard :
   - Le SQL Editor utilise la clé service_role par défaut
   - Pour tester RLS, vous devez utiliser le client Supabase avec la clé anon
   - Ou créer une fonction qui utilise SECURITY DEFINER

4. Pour tester depuis l'application :
   - Utilisez le client Supabase avec VITE_SUPABASE_ANON_KEY
   - Connectez-vous avec un utilisateur
   - Exécutez la requête depuis votre application React
*/

