-- ============================================================================
-- VÉRIFIER LES INDEX CRITIQUES
-- ============================================================================
-- Ce script vérifie que tous les index critiques sont présents
-- ============================================================================

-- Vérifier les index critiques spécifiques
SELECT 
  tablename,
  indexname,
  indexdef,
  CASE 
    WHEN tablename = 'polls' AND indexname LIKE '%creator%' THEN '✅ Index polls.creator_id'
    WHEN tablename = 'polls' AND indexname LIKE '%slug%' THEN '✅ Index polls.slug'
    WHEN tablename = 'votes' AND indexname LIKE '%poll_id%' THEN '✅ Index votes.poll_id'
    WHEN tablename = 'conversations' AND indexname LIKE '%user_id%' THEN '✅ Index conversations.user_id'
    WHEN tablename = 'analytics_events' AND indexname LIKE '%created_at%' THEN '✅ Index analytics_events.created_at'
    ELSE 'Autre index'
  END as critical_index_check
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    -- Index critiques
    (tablename = 'polls' AND (indexname LIKE '%creator%' OR indexname LIKE '%slug%')) OR
    (tablename = 'votes' AND indexname LIKE '%poll_id%') OR
    (tablename = 'conversations' AND indexname LIKE '%user_id%') OR
    (tablename = 'analytics_events' AND indexname LIKE '%created_at%')
  )
ORDER BY tablename, indexname;

-- Résumé des index critiques
SELECT 
  CASE 
    WHEN COUNT(CASE WHEN tablename = 'polls' AND indexname LIKE '%creator%' THEN 1 END) > 0 
      THEN '✅ Présent' 
      ELSE '❌ Manquant' 
  END as polls_creator_id,
  CASE 
    WHEN COUNT(CASE WHEN tablename = 'polls' AND indexname LIKE '%slug%' THEN 1 END) > 0 
      THEN '✅ Présent' 
      ELSE '❌ Manquant' 
  END as polls_slug,
  CASE 
    WHEN COUNT(CASE WHEN tablename = 'votes' AND indexname LIKE '%poll_id%' THEN 1 END) > 0 
      THEN '✅ Présent' 
      ELSE '❌ Manquant' 
  END as votes_poll_id,
  CASE 
    WHEN COUNT(CASE WHEN tablename = 'conversations' AND indexname LIKE '%user_id%' THEN 1 END) > 0 
      THEN '✅ Présent' 
      ELSE '❌ Manquant' 
  END as conversations_user_id,
  CASE 
    WHEN COUNT(CASE WHEN tablename = 'analytics_events' AND indexname LIKE '%created_at%' THEN 1 END) > 0 
      THEN '✅ Présent' 
      ELSE '⚠️ Optionnel' 
  END as analytics_events_created_at
FROM pg_indexes
WHERE schemaname = 'public';

-- ============================================================================
-- NOTES
-- ============================================================================
/*
Résultats attendus (basés sur votre vérification du 19/12/2024) :
- polls.creator_id : ✅ idx_polls_creator
- polls.slug : ✅ polls_slug_key (UNIQUE)
- votes.poll_id : ✅ idx_votes_poll_id_fkey
- conversations.user_id : ✅ idx_conversations_user_id + idx_conversations_user
- analytics_events.created_at : ⚠️ Optionnel (peut être ajouté si nécessaire)

Si analytics_events.created_at est manquant et nécessaire :
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
ON analytics_events(created_at DESC);
*/

