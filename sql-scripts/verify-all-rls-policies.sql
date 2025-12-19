-- ============================================================================
-- VÉRIFIER TOUTES LES POLITIQUES RLS
-- ============================================================================
-- Ce script vérifie que toutes les politiques RLS sont correctement configurées
-- pour toutes les tables sensibles
-- ============================================================================

-- Étape 1 : Vérifier que RLS est activé sur toutes les tables sensibles
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS NON activé'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'polls',
    'votes',
    'conversations',
    'analytics_events',
    'guest_quotas',
    'poll_options',
    'messages',
    'user_quotas',
    'quota_tracking'
  )
ORDER BY tablename;

-- Étape 2 : Vérifier les politiques pour chaque table sensible
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid()%' THEN '✅ Utilise auth.uid()'
    WHEN cmd = 'ALL' AND roles = '{service_role}' THEN '✅ Service role (normal)'
    WHEN cmd = 'ALL' AND qual LIKE '%true%' AND roles = '{service_role}' THEN '✅ Service role (normal)'
    ELSE '⚠️ Vérifier la condition'
  END as security_check,
  roles,
  CASE 
    WHEN cmd = 'INSERT' THEN COALESCE(with_check, 'NULL') 
    ELSE COALESCE(qual, 'NULL')
  END as condition_used
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'polls',
    'votes',
    'conversations',
    'analytics_events',
    'guest_quotas',
    'poll_options',
    'messages',
    'user_quotas',
    'quota_tracking'
  )
ORDER BY tablename, policyname;

-- Étape 3 : Résumé par table
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(CASE WHEN cmd = 'ALL' AND roles = '{service_role}' THEN 1 END) as service_role_policies,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Aucune politique'
    WHEN COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) = 0 THEN '⚠️ Pas de politique SELECT'
    WHEN COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) = 0 THEN '⚠️ Pas de politique INSERT'
    ELSE '✅ Politiques présentes'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'polls',
    'votes',
    'conversations',
    'analytics_events',
    'guest_quotas',
    'poll_options',
    'messages',
    'user_quotas',
    'quota_tracking'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
1. Ce script vérifie uniquement la CONFIGURATION des politiques.
   Pour tester que RLS fonctionne réellement, utilisez la clé anon depuis votre application.

2. Les politiques "Service role" sont normales et nécessaires pour les opérations système.

3. Si une table n'a pas de politique SELECT, les utilisateurs ne pourront pas lire les données.
   Si une table n'a pas de politique INSERT, les utilisateurs ne pourront pas créer de données.

4. Pour tester RLS depuis l'application :
   - Utilisez le client Supabase avec VITE_SUPABASE_ANON_KEY
   - Connectez-vous avec un utilisateur
   - Exécutez des requêtes SELECT/INSERT/UPDATE
   - Vérifiez que seules les données autorisées sont accessibles
*/

