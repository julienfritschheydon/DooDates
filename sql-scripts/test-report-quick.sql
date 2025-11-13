-- ============================================================================
-- TEST RAPIDE DE LA FONCTION generate_guest_quota_report
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- Test 1: Vérifier que la fonction existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'generate_guest_quota_report';

-- Test 2: Exécuter la fonction (format compact)
SELECT generate_guest_quota_report();

-- Test 3: Exécuter la fonction (format lisible)
SELECT jsonb_pretty(generate_guest_quota_report());

-- Test 4: Vérifier les statistiques principales
SELECT 
  (generate_guest_quota_report()->'statistics') as statistics,
  (generate_guest_quota_report()->'alerts') as alerts;

