-- ============================================================================
-- MONITORING RAPIDE GUEST QUOTAS
-- Vue d'ensemble rapide pour surveillance quotidienne
-- ============================================================================

-- DASHBOARD RAPIDE
SELECT 
  '📊 STATISTIQUES GLOBALES' as section,
  COUNT(DISTINCT q.id)::text as "Total guests",
  SUM(q.total_credits_consumed)::text as "Total crédits",
  COUNT(DISTINCT CASE WHEN q.last_activity_at >= NOW() - INTERVAL '24 hours' THEN q.id END)::text as "Actifs 24h",
  COUNT(DISTINCT CASE WHEN q.total_credits_consumed >= 40 THEN q.id END)::text as "Proches limite"
FROM guest_quotas q

UNION ALL

SELECT 
  '⚠️ ALERTES',
  COUNT(DISTINCT CASE WHEN q.total_credits_consumed >= 45 THEN q.id END)::text,
  COUNT(DISTINCT CASE WHEN q.last_activity_at >= NOW() - INTERVAL '1 hour' AND q.total_credits_consumed >= 30 THEN q.id END)::text,
  COUNT(DISTINCT j.fingerprint)::text,
  NULL
FROM guest_quotas q
LEFT JOIN guest_quota_journal j ON j.guest_quota_id = q.id 
  AND j.created_at >= NOW() - INTERVAL '1 hour'
  AND j.action != 'admin_reset';

-- TOP 10 CONSOMMATEURS (dernières 24h)
SELECT 
  '🔝 TOP 10 CONSOMMATEURS' as info,
  q.fingerprint,
  q.total_credits_consumed as credits,
  q.ai_messages,
  q.last_activity_at,
  CASE 
    WHEN q.total_credits_consumed >= 45 THEN '🔴 Critique'
    WHEN q.total_credits_consumed >= 40 THEN '🟠 Élevé'
    ELSE '✅ Normal'
  END as status
FROM guest_quotas q
WHERE q.last_activity_at >= NOW() - INTERVAL '24 hours'
ORDER BY q.total_credits_consumed DESC
LIMIT 10;

-- ACTIVITÉ RÉCENTE (dernière heure)
SELECT 
  '⏰ ACTIVITÉ RÉCENTE (1h)' as info,
  j.action,
  COUNT(*) as count,
  SUM(j.credits) as total_credits
FROM guest_quota_journal j
WHERE j.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY j.action
ORDER BY count DESC;

