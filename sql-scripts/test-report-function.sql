-- ============================================================================
-- TEST DE LA FONCTION generate_guest_quota_report
-- Exécuter dans Supabase SQL Editor pour tester la fonction
-- ============================================================================

-- Test simple
SELECT generate_guest_quota_report();

-- Test avec formatage JSON lisible
SELECT jsonb_pretty(generate_guest_quota_report());

-- Test d'une section spécifique
SELECT 
  (generate_guest_quota_report()->'statistics') as statistics,
  (generate_guest_quota_report()->'alerts') as alerts;

