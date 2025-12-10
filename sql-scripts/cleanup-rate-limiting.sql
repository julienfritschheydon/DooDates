-- Script pour nettoyer complètement les fonctions existantes
-- Exécuter d'abord ce script, puis le script de création

-- Voir les fonctions existantes
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name LIKE '%consume%' 
       OR routine_name LIKE '%can_consume%' 
       OR routine_name LIKE '%ensure_quota%');

-- Supprimer TOUTES les versions des fonctions
DROP FUNCTION IF EXISTS public.consume_quota_credits CASCADE;
DROP FUNCTION IF EXISTS public.consume_ai_credit CASCADE;
DROP FUNCTION IF EXISTS public.can_consume_rate_limit CASCADE;
DROP FUNCTION IF EXISTS public.ensure_quota_tracking_exists CASCADE;

-- Vérifier qu'elles sont bien supprimées
SELECT 'Functions cleaned up' as status;
