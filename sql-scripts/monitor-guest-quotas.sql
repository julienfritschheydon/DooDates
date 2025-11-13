-- ============================================================================
-- MONITORING GUEST QUOTAS
-- Requêtes SQL pour surveiller et analyser l'utilisation des quotas guests
-- ============================================================================

-- 1. ACTIVITÉ RÉCENTE (dernières 24h)
-- Voir toutes les consommations de crédits récentes
SELECT 
  j.fingerprint,
  j.action,
  j.credits,
  j.metadata,
  j.created_at,
  q.ai_messages,
  q.total_credits_consumed,
  q.first_seen_at,
  q.last_activity_at
FROM guest_quota_journal j
JOIN guest_quotas q ON j.guest_quota_id = q.id
WHERE j.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY j.created_at DESC
LIMIT 100;

-- 2. TOP CONSOMMATEURS (guests les plus actifs)
-- Identifier les guests qui consomment le plus de crédits
SELECT 
  q.fingerprint,
  q.total_credits_consumed,
  q.ai_messages,
  q.conversations_created,
  q.polls_created,
  q.analytics_queries,
  q.simulations,
  COUNT(j.id) as journal_entries_count,
  q.first_seen_at,
  q.last_activity_at,
  q.last_reset_at,
  q.user_agent,
  q.timezone
FROM guest_quotas q
LEFT JOIN guest_quota_journal j ON j.guest_quota_id = q.id
GROUP BY q.id
ORDER BY q.total_credits_consumed DESC
LIMIT 50;

-- 3. DÉTECTION D'ABUS (consommation rapide)
-- Guests qui ont consommé beaucoup de crédits en peu de temps
SELECT 
  q.fingerprint,
  q.total_credits_consumed,
  COUNT(j.id) as actions_count,
  MIN(j.created_at) as first_action,
  MAX(j.created_at) as last_action,
  EXTRACT(EPOCH FROM (MAX(j.created_at) - MIN(j.created_at))) / 3600 as hours_span,
  CASE 
    WHEN EXTRACT(EPOCH FROM (MAX(j.created_at) - MIN(j.created_at))) / 3600 < 1 
      AND COUNT(j.id) > 10 
    THEN '⚠️ SUSPECT (plus de 10 actions en moins d''1h)'
    WHEN q.total_credits_consumed >= 40 
    THEN '⚠️ LIMITE APPROCHÉE'
    ELSE '✅ Normal'
  END as status,
  q.user_agent,
  q.timezone
FROM guest_quotas q
JOIN guest_quota_journal j ON j.guest_quota_id = q.id
WHERE j.created_at >= NOW() - INTERVAL '7 days'
GROUP BY q.id
HAVING COUNT(j.id) > 5 OR q.total_credits_consumed >= 30
ORDER BY q.total_credits_consumed DESC, actions_count DESC;

-- 4. STATISTIQUES PAR TYPE D'ACTION
-- Répartition des crédits consommés par type d'action
SELECT 
  j.action,
  COUNT(*) as action_count,
  SUM(j.credits) as total_credits,
  AVG(j.credits) as avg_credits,
  MIN(j.created_at) as first_occurrence,
  MAX(j.created_at) as last_occurrence
FROM guest_quota_journal j
WHERE j.created_at >= NOW() - INTERVAL '7 days'
GROUP BY j.action
ORDER BY total_credits DESC;

-- 5. ÉVOLUTION TEMPORELLE (par jour)
-- Consommation de crédits par jour sur la dernière semaine
SELECT 
  DATE(j.created_at) as date,
  COUNT(*) as actions_count,
  SUM(j.credits) as total_credits,
  COUNT(DISTINCT j.fingerprint) as unique_guests,
  COUNT(DISTINCT j.guest_quota_id) as unique_quotas
FROM guest_quota_journal j
WHERE j.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(j.created_at)
ORDER BY date DESC;

-- 6. RECHERCHE PAR FINGERPRINT (pour support)
-- Voir l'historique complet d'un guest spécifique
-- Remplacez 'FINGERPRINT_A_RECHERCHER' par le fingerprint réel
SELECT 
  j.id,
  j.action,
  j.credits,
  j.metadata,
  j.created_at,
  q.total_credits_consumed as quota_total_at_time,
  q.ai_messages,
  q.conversations_created,
  q.polls_created
FROM guest_quota_journal j
JOIN guest_quotas q ON j.guest_quota_id = q.id
WHERE j.fingerprint = 'FINGERPRINT_A_RECHERCHER'
ORDER BY j.created_at DESC;

-- 7. GUESTS PROCHES DE LA LIMITE
-- Identifier les guests qui approchent de leurs limites
SELECT 
  q.fingerprint,
  q.total_credits_consumed,
  CASE 
    WHEN q.total_credits_consumed >= 45 THEN '🔴 CRITIQUE (>=45/50)'
    WHEN q.total_credits_consumed >= 40 THEN '🟠 ÉLEVÉ (>=40/50)'
    WHEN q.total_credits_consumed >= 30 THEN '🟡 MOYEN (>=30/50)'
    ELSE '✅ Normal'
  END as level,
  q.ai_messages,
  q.conversations_created,
  q.polls_created,
  q.last_activity_at,
  q.user_agent,
  q.timezone
FROM guest_quotas q
WHERE q.total_credits_consumed >= 25
ORDER BY q.total_credits_consumed DESC;

-- 8. ACTIVITÉ PAR FUSEAU HORAIRE
-- Identifier les patterns d'usage par timezone
SELECT 
  q.timezone,
  COUNT(DISTINCT q.id) as unique_guests,
  SUM(q.total_credits_consumed) as total_credits,
  AVG(q.total_credits_consumed) as avg_credits_per_guest,
  MAX(q.total_credits_consumed) as max_credits
FROM guest_quotas q
WHERE q.timezone IS NOT NULL
GROUP BY q.timezone
ORDER BY total_credits DESC
LIMIT 20;

-- 9. RÉSETS ADMIN (historique)
-- Voir tous les resets effectués par les admins
SELECT 
  j.fingerprint,
  j.metadata->>'reset_by' as reset_by,
  j.metadata->>'reset_at' as reset_at,
  j.metadata->>'reset_type' as reset_type,
  j.created_at,
  q.total_credits_consumed as current_total
FROM guest_quota_journal j
JOIN guest_quotas q ON j.guest_quota_id = q.id
WHERE j.action = 'admin_reset'
ORDER BY j.created_at DESC;

-- 10. STATISTIQUES GLOBALES
-- Vue d'ensemble de l'utilisation
SELECT 
  COUNT(DISTINCT q.id) as total_guests,
  COUNT(DISTINCT q.fingerprint) as unique_fingerprints,
  SUM(q.total_credits_consumed) as total_credits_consumed,
  AVG(q.total_credits_consumed) as avg_credits_per_guest,
  SUM(q.ai_messages) as total_ai_messages,
  SUM(q.conversations_created) as total_conversations,
  SUM(q.polls_created) as total_polls,
  COUNT(DISTINCT j.id) as total_journal_entries,
  COUNT(DISTINCT CASE WHEN q.total_credits_consumed >= 40 THEN q.id END) as guests_near_limit,
  COUNT(DISTINCT CASE WHEN q.last_activity_at >= NOW() - INTERVAL '24 hours' THEN q.id END) as active_last_24h,
  COUNT(DISTINCT CASE WHEN q.last_activity_at >= NOW() - INTERVAL '7 days' THEN q.id END) as active_last_7d
FROM guest_quotas q
LEFT JOIN guest_quota_journal j ON j.guest_quota_id = q.id;

-- 11. ALERTES POTENTIELLES
-- Détecter des patterns suspects
WITH suspicious_patterns AS (
  SELECT 
    q.fingerprint,
    q.total_credits_consumed,
    COUNT(j.id) as rapid_actions,
    MIN(j.created_at) as first_action,
    MAX(j.created_at) as last_action,
    EXTRACT(EPOCH FROM (MAX(j.created_at) - MIN(j.created_at))) / 60 as minutes_span
  FROM guest_quotas q
  JOIN guest_quota_journal j ON j.guest_quota_id = q.id
  WHERE j.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY q.id, q.fingerprint, q.total_credits_consumed
  HAVING COUNT(j.id) > 5
)
SELECT 
  fingerprint,
  total_credits_consumed,
  rapid_actions,
  minutes_span,
  CASE 
    WHEN rapid_actions > 10 AND minutes_span < 10 THEN '🔴 CRITIQUE: Plus de 10 actions en moins de 10 minutes'
    WHEN rapid_actions > 5 AND minutes_span < 5 THEN '🟠 SUSPECT: Plus de 5 actions en moins de 5 minutes'
    ELSE '🟡 ATTENTION: Activité élevée'
  END as alert_level
FROM suspicious_patterns
ORDER BY rapid_actions DESC, minutes_span ASC;

-- 12. REQUÊTE POUR EXPORT (CSV)
-- Format optimisé pour export CSV/Excel
SELECT 
  q.fingerprint,
  q.total_credits_consumed,
  q.ai_messages,
  q.conversations_created,
  q.polls_created,
  q.analytics_queries,
  q.simulations,
  q.first_seen_at,
  q.last_activity_at,
  q.last_reset_at,
  q.user_agent,
  q.timezone,
  q.language,
  q.screen_resolution,
  COUNT(j.id) as journal_entries_count
FROM guest_quotas q
LEFT JOIN guest_quota_journal j ON j.guest_quota_id = q.id
GROUP BY q.id
ORDER BY q.last_activity_at DESC;

