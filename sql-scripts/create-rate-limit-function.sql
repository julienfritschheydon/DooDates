-- ============================================================================
-- FUNCTION: can_consume_rate_limit
-- Description: Vérifie le rate limiting par heure pour un userId et/ou une IP
-- Utilise quota_tracking_journal comme source de vérité
-- ============================================================================

CREATE OR REPLACE FUNCTION can_consume_rate_limit(
  p_user_id UUID,
  p_ip TEXT,
  p_action TEXT,
  p_limit_per_hour INTEGER
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := date_trunc('hour', NOW());
  v_user_count INTEGER := 0;
  v_ip_count INTEGER := 0;
  v_allowed BOOLEAN := true;
BEGIN
  -- Validation basique de la limite
  IF p_limit_per_hour IS NULL OR p_limit_per_hour <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_LIMIT',
      'message', 'p_limit_per_hour must be a positive integer'
    );
  END IF;

  -- Compter les actions pour cet utilisateur sur la fenêtre courante
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_count
    FROM quota_tracking_journal
    WHERE user_id = p_user_id
      AND action = p_action
      AND created_at >= v_window_start;
  END IF;

  -- Compter les actions pour cette IP si on la stocke en metadata->>'ip'
  IF p_ip IS NOT NULL AND p_ip <> '' THEN
    SELECT COUNT(*) INTO v_ip_count
    FROM quota_tracking_journal
    WHERE metadata->>'ip' = p_ip
      AND action = p_action
      AND created_at >= v_window_start;
  END IF;

  -- Règle: on bloque si l'un ou l'autre dépasse la limite
  v_allowed := (v_user_count < p_limit_per_hour)
    AND (v_ip_count < p_limit_per_hour OR v_ip_count IS NULL);

  RETURN jsonb_build_object(
    'success', true,
    'allowed', v_allowed,
    'user_count', v_user_count,
    'ip_count', v_ip_count,
    'limit', p_limit_per_hour,
    'window_start', v_window_start
  );
END;
$$;

COMMENT ON FUNCTION can_consume_rate_limit(UUID, TEXT, TEXT, INTEGER)
  IS 'Vérifie si un userId/IP peut encore consommer une action donnée dans la fenêtre horaire courante';

-- Permissions: appelée depuis Edge Functions via service role
GRANT EXECUTE ON FUNCTION can_consume_rate_limit(UUID, TEXT, TEXT, INTEGER) TO service_role;
