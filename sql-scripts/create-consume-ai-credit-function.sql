-- Fonction pour consommer atomiquement 1 crédit IA
-- Utilisée par l'Edge Function pour sécuriser les quotas

CREATE OR REPLACE FUNCTION consume_ai_credit(p_user_id UUID)
RETURNS JSON
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_quota RECORD;
  v_new_remaining INT;
BEGIN
  -- Vérifier et consommer crédit (transaction atomique avec FOR UPDATE)
  SELECT * INTO v_quota
  FROM user_quotas
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock pour éviter race condition
  
  IF NOT FOUND THEN
    -- Créer un quota par défaut pour les utilisateurs authentifiés
    INSERT INTO user_quotas (
      user_id,
      tier,
      plan,
      credits_total,
      credits_used,
      credits_remaining,
      max_polls,
      period_start,
      period_end,
      reset_date
    )
    VALUES (
      p_user_id,
      'free',
      'monthly',
      20, -- Quota gratuit par défaut
      0,
      20,
      5,
      NOW(),
      NOW() + INTERVAL '1 month',
      DATE_TRUNC('month', NOW() + INTERVAL '1 month') + INTERVAL '1 day'
    )
    RETURNING * INTO v_quota;
  END IF;
  
  -- Vérifier si quota suffisant
  IF v_quota.credits_remaining < 1 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'QUOTA_EXCEEDED',
      'message', 'Quota de crédits IA dépassé',
      'credits_remaining', v_quota.credits_remaining,
      'credits_total', v_quota.credits_total
    );
  END IF;
  
  -- Consommer 1 crédit atomiquement
  v_new_remaining := v_quota.credits_remaining - 1;
  
  UPDATE user_quotas
  SET credits_remaining = v_new_remaining,
      credits_used = credits_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'credits_remaining', v_new_remaining,
    'credits_total', v_quota.credits_total,
    'credits_used', v_quota.credits_used + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rollback un crédit (en cas d'erreur Gemini API)
CREATE OR REPLACE FUNCTION rollback_ai_credit(p_user_id UUID)
RETURNS JSON
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_quota RECORD;
BEGIN
  UPDATE user_quotas
  SET credits_remaining = credits_remaining + 1,
      credits_used = GREATEST(0, credits_used - 1),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_quota;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quota non trouvé'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'credits_remaining', v_quota.credits_remaining,
    'credits_total', v_quota.credits_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION consume_ai_credit(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION rollback_ai_credit(UUID) TO authenticated, anon;

