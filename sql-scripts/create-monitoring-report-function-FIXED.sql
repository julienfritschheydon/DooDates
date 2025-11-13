-- ============================================================================
-- FONCTION AUTOMATISÉE DE RAPPORT DE MONITORING (VERSION CORRIGÉE)
-- Génère un rapport JSON structuré pour surveillance automatique
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_guest_quota_report()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  report JSONB;
BEGIN
  SELECT jsonb_build_object(
    'generated_at', NOW(),
    'period', 'last_24_hours',
    
    -- Statistiques globales
    'statistics', (
      SELECT jsonb_build_object(
        'total_guests', COUNT(DISTINCT q.id),
        'active_last_24h', COUNT(DISTINCT CASE WHEN q.last_activity_at >= NOW() - INTERVAL '24 hours' THEN q.id END),
        'active_last_7d', COUNT(DISTINCT CASE WHEN q.last_activity_at >= NOW() - INTERVAL '7 days' THEN q.id END),
        'total_credits_consumed', SUM(q.total_credits_consumed),
        'avg_credits_per_guest', ROUND(AVG(q.total_credits_consumed)::numeric, 2),
        'total_ai_messages', SUM(q.ai_messages),
        'total_conversations', SUM(q.conversations_created),
        'total_polls', SUM(q.polls_created)
      )
      FROM guest_quotas q
    ),
    
    -- Alertes
    'alerts', (
      SELECT jsonb_build_object(
        'critical', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'fingerprint', q.fingerprint,
            'total_credits', q.total_credits_consumed,
            'status', 'critical'
          )), '[]'::jsonb)
          FROM (
            SELECT fingerprint, total_credits_consumed
            FROM guest_quotas
            WHERE total_credits_consumed >= 45
            ORDER BY total_credits_consumed DESC
            LIMIT 10
          ) q
        ),
        'near_limit', (
          SELECT COUNT(*)
          FROM guest_quotas q
          WHERE q.total_credits_consumed >= 40 AND q.total_credits_consumed < 45
        ),
        'suspicious_activity', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'fingerprint', suspicious.fingerprint,
            'rapid_actions', suspicious.rapid_actions,
            'minutes_span', suspicious.minutes_span
          )), '[]'::jsonb)
          FROM (
            SELECT 
              q.fingerprint,
              COUNT(j.id) as rapid_actions,
              EXTRACT(EPOCH FROM (MAX(j.created_at) - MIN(j.created_at))) / 60 as minutes_span
            FROM guest_quotas q
            JOIN guest_quota_journal j ON j.guest_quota_id = q.id
            WHERE j.created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY q.id, q.fingerprint
            HAVING COUNT(j.id) > 5
            LIMIT 10
          ) suspicious
        )
      )
    ),
    
    -- Top consommateurs
    'top_consumers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'fingerprint', top.fingerprint,
        'total_credits', top.total_credits_consumed,
        'ai_messages', top.ai_messages,
        'conversations', top.conversations_created,
        'polls', top.polls_created,
        'last_activity', top.last_activity_at
      ) ORDER BY top.total_credits_consumed DESC), '[]'::jsonb)
      FROM (
        SELECT 
          fingerprint,
          total_credits_consumed,
          ai_messages,
          conversations_created,
          polls_created,
          last_activity_at
        FROM guest_quotas
        WHERE last_activity_at >= NOW() - INTERVAL '24 hours'
        ORDER BY total_credits_consumed DESC
        LIMIT 10
      ) top
    ),
    
    -- Activité récente par type
    'recent_activity_by_type', (
      SELECT COALESCE(jsonb_object_agg(
        activity.action,
        jsonb_build_object(
          'count', activity.action_count,
          'total_credits', activity.total_credits
        )
      ), '{}'::jsonb)
      FROM (
        SELECT 
          action,
          COUNT(*) as action_count,
          SUM(credits) as total_credits
        FROM guest_quota_journal
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY action
      ) activity
    ),
    
    -- Évolution temporelle (dernières 7 jours)
    'daily_trend', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'date', trend.date,
        'actions', trend.actions,
        'total_credits', trend.total_credits,
        'unique_guests', trend.unique_guests
      ) ORDER BY trend.date DESC), '[]'::jsonb)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as actions,
          SUM(credits) as total_credits,
          COUNT(DISTINCT fingerprint) as unique_guests
        FROM guest_quota_journal
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
      ) trend
    ),
    
    -- Résumé par fuseau horaire
    'by_timezone', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'timezone', tz.timezone,
        'unique_guests', tz.unique_guests,
        'total_credits', tz.total_credits
      ) ORDER BY tz.total_credits DESC), '[]'::jsonb)
      FROM (
        SELECT 
          timezone,
          COUNT(DISTINCT id) as unique_guests,
          SUM(total_credits_consumed) as total_credits
        FROM guest_quotas
        WHERE timezone IS NOT NULL
          AND last_activity_at >= NOW() - INTERVAL '7 days'
        GROUP BY timezone
        ORDER BY total_credits DESC
        LIMIT 10
      ) tz
    )
  ) INTO report;
  
  RETURN report;
END;
$$;

COMMENT ON FUNCTION generate_guest_quota_report IS 'Génère un rapport JSON structuré de monitoring des quotas guests';

