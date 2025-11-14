-- Fix linter warnings: Update functions to resolve issues
-- ======================================================

-- 1. Fix ensure_quota_tracking_exists: Remove unused column from SELECT
CREATE OR REPLACE FUNCTION ensure_quota_tracking_exists(p_user_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  quota_id UUID;
  subscription_start TIMESTAMPTZ;
BEGIN
  -- Vérifier si quota existe déjà
  SELECT id INTO quota_id
  FROM quota_tracking
  WHERE user_id = p_user_id;
  
  IF quota_id IS NOT NULL THEN
    RETURN quota_id;
  END IF;
  
  -- Récupérer date d'abonnement depuis profiles
  SELECT subscription_expires_at INTO subscription_start
  FROM profiles
  WHERE id = p_user_id
  LIMIT 1;
  
  -- Créer nouveau quota
  INSERT INTO quota_tracking (
    user_id,
    subscription_start_date,
    period_start,
    period_end
  ) VALUES (
    p_user_id,
    COALESCE(subscription_start, NOW()),
    NOW(),
    NOW() + INTERVAL '1 month'
  )
  RETURNING id INTO quota_id;
  
  RETURN quota_id;
END;
$$;

-- 2. Fix redeem_beta_key: Remove unused variable
CREATE OR REPLACE FUNCTION redeem_beta_key(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSON
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- 1. Vérifier que la clé existe et est active
  SELECT * INTO v_key
  FROM beta_keys
  WHERE code = p_code
    AND status = 'active'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Clé invalide, déjà utilisée ou expirée'
    );
  END IF;
  
  -- 2. Vérifier que l'utilisateur n'a pas déjà une clé beta
  IF EXISTS (
    SELECT 1 FROM beta_keys
    WHERE assigned_to = p_user_id
      AND status = 'used'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous avez déjà activé une clé beta'
    );
  END IF;
  
  -- 3. Activer la clé
  UPDATE beta_keys
  SET status = 'used',
      assigned_to = p_user_id,
      redeemed_at = NOW()
  WHERE id = v_key.id;
  
  -- 4. Créer ou upgrader le quota utilisateur vers tier beta
  INSERT INTO user_quotas (
    user_id,
    tier,
    plan,
    credits_total,
    credits_remaining,
    max_polls,
    period_end,
    reset_date
  )
  VALUES (
    p_user_id,
    'beta',
    'monthly',
    v_key.credits_monthly,
    v_key.credits_monthly,
    v_key.max_polls,
    v_key.expires_at,
    v_key.expires_at
  )
  ON CONFLICT (user_id) DO UPDATE
  SET tier = 'beta',
      credits_total = v_key.credits_monthly,
      credits_remaining = v_key.credits_monthly,
      max_polls = v_key.max_polls,
      period_end = v_key.expires_at,
      reset_date = v_key.expires_at,
      updated_at = NOW();
  
  RETURN json_build_object(
    'success', true,
    'tier', 'beta',
    'credits', v_key.credits_monthly,
    'expires_at', v_key.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

