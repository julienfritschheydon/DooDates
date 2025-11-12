-- ================================================
-- DooDates - Beta Keys & User Quotas System
-- Date: 3 novembre 2025
-- Version: 1.0
-- ================================================

-- ================================================
-- 1. TABLE: beta_keys
-- ================================================

CREATE TABLE IF NOT EXISTS beta_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code d'activation (Format: BETA-XXXX-XXXX-XXXX)
  code TEXT UNIQUE NOT NULL,
  
  -- Statut de la clé
  status TEXT NOT NULL CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  
  -- Quotas accordés
  credits_monthly INT DEFAULT 1000,
  max_polls INT DEFAULT 999999, -- Illimité
  duration_months INT DEFAULT 3,
  
  -- Attribution
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata admin
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Ex: "Testeur recommandé par Pierre"
  
  -- Tracking engagement
  last_feedback_at TIMESTAMPTZ,
  bugs_reported INT DEFAULT 0,
  feedback_score INT CHECK (feedback_score >= 1 AND feedback_score <= 5)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_beta_keys_code ON beta_keys(code);
CREATE INDEX IF NOT EXISTS idx_beta_keys_status ON beta_keys(status);
CREATE INDEX IF NOT EXISTS idx_beta_keys_assigned_to ON beta_keys(assigned_to);
CREATE INDEX IF NOT EXISTS idx_beta_keys_expires_at ON beta_keys(expires_at);

-- RLS Policies
ALTER TABLE beta_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beta_keys_select_access" ON beta_keys;
DROP POLICY IF EXISTS "beta_keys_insert_admin" ON beta_keys;
DROP POLICY IF EXISTS "beta_keys_update_admin" ON beta_keys;
DROP POLICY IF EXISTS "beta_keys_delete_admin" ON beta_keys;
DROP POLICY IF EXISTS "beta_keys_admin_manage" ON beta_keys;

CREATE POLICY "beta_keys_select_access"
  ON beta_keys
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
        AND ((auth.users.raw_user_meta_data->>'role') = 'admin'
          OR (auth.users.raw_app_meta_data->>'role') = 'admin')
    )
  );

CREATE POLICY "beta_keys_admin_insert"
  ON beta_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
        AND ((auth.users.raw_user_meta_data->>'role') = 'admin'
          OR (auth.users.raw_app_meta_data->>'role') = 'admin')
    )
  );

CREATE POLICY "beta_keys_admin_update"
  ON beta_keys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
        AND ((auth.users.raw_user_meta_data->>'role') = 'admin'
          OR (auth.users.raw_app_meta_data->>'role') = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
        AND ((auth.users.raw_user_meta_data->>'role') = 'admin'
          OR (auth.users.raw_app_meta_data->>'role') = 'admin')
    )
  );

CREATE POLICY "beta_keys_admin_delete"
  ON beta_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
        AND ((auth.users.raw_user_meta_data->>'role') = 'admin'
          OR (auth.users.raw_app_meta_data->>'role') = 'admin')
    )
  );

-- ================================================
-- 2. TABLE: user_quotas
-- ================================================

CREATE TABLE IF NOT EXISTS user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tier et plan
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'pro', 'beta')),
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual')),
  
  -- Crédits IA
  credits_total INT NOT NULL,
  credits_used INT DEFAULT 0,
  credits_remaining INT NOT NULL,
  
  -- Sondages
  max_polls INT NOT NULL, -- 20, 100, 999999
  
  -- Période
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ NOT NULL,
  reset_date TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_quotas_tier ON user_quotas(tier);
CREATE INDEX IF NOT EXISTS idx_user_quotas_reset_date ON user_quotas(reset_date);

-- RLS Policies
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_quotas_select_access" ON user_quotas;
DROP POLICY IF EXISTS "Admin can view all quotas" ON user_quotas;

CREATE POLICY "user_quotas_select_access"
  ON user_quotas
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
        AND (
          auth.users.raw_user_meta_data->>'role' = 'admin'
          OR auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    )
  );

-- ================================================
-- 3. FUNCTION: generate_beta_key
-- ================================================

CREATE OR REPLACE FUNCTION generate_beta_key(
  p_count INT DEFAULT 1,
  p_notes TEXT DEFAULT NULL,
  p_duration_months INT DEFAULT 3
)
RETURNS TABLE (code TEXT, expires_at TIMESTAMPTZ)
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur actuel
  v_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = v_user_id
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent générer des clés bêta';
  END IF;
  
  FOR i IN 1..p_count LOOP
    -- Générer code unique
    LOOP
      v_code := 'BETA-' || 
                upper(substr(md5(random()::text), 1, 4)) || '-' ||
                upper(substr(md5(random()::text), 1, 4)) || '-' ||
                upper(substr(md5(random()::text), 1, 4));
      
      -- Vérifier unicité
      EXIT WHEN NOT EXISTS (SELECT 1 FROM beta_keys WHERE beta_keys.code = v_code);
    END LOOP;
    
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    
    -- Insérer clé (RLS contourné par SECURITY DEFINER)
    INSERT INTO beta_keys (code, status, expires_at, created_by, notes)
    VALUES (v_code, 'active', v_expires_at, v_user_id, p_notes);
    
    RETURN QUERY SELECT v_code, v_expires_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions pour la fonction generate_beta_key
-- Les admins peuvent générer des clés (vérifié dans la fonction via auth.uid())
GRANT EXECUTE ON FUNCTION generate_beta_key(INT, TEXT, INT) TO authenticated, anon;

-- ================================================
-- 4. FUNCTION: redeem_beta_key
-- ================================================

CREATE OR REPLACE FUNCTION redeem_beta_key(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSON
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_key RECORD;
  v_result JSON;
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

-- Permissions pour la fonction redeem_beta_key
GRANT EXECUTE ON FUNCTION redeem_beta_key(UUID, TEXT) TO authenticated, anon;

-- ================================================
-- 5. FUNCTION: consume_credits
-- ================================================

CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id UUID,
  p_amount INT
)
RETURNS JSON
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_quota RECORD;
BEGIN
  -- Vérifier et consommer crédits (avec transaction)
  SELECT * INTO v_quota
  FROM user_quotas
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock pour éviter race condition
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quota non trouvé'
    );
  END IF;
  
  IF v_quota.credits_remaining < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Crédits insuffisants',
      'remaining', v_quota.credits_remaining,
      'needed', p_amount
    );
  END IF;
  
  -- Consommer crédits
  UPDATE user_quotas
  SET credits_used = credits_used + p_amount,
      credits_remaining = credits_remaining - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'consumed', p_amount,
    'remaining', v_quota.credits_remaining - p_amount,
    'total', v_quota.credits_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6. FUNCTION: reset_monthly_quotas
-- ================================================

CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS INT
SET search_path = public, extensions
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Reset quotas mensuels (pas les annuels, pas les beta)
  -- Compter d'abord les lignes à mettre à jour
  SELECT COUNT(*) INTO v_count
  FROM user_quotas
  WHERE plan = 'monthly'
    AND tier != 'beta'
    AND reset_date <= NOW();
  
  -- Mettre à jour les quotas
  UPDATE user_quotas
  SET credits_used = 0,
      credits_remaining = credits_total,
      period_start = NOW(),
      period_end = NOW() + interval '1 month',
      reset_date = NOW() + interval '1 month',
      updated_at = NOW()
  WHERE plan = 'monthly'
    AND tier != 'beta'
    AND reset_date <= NOW();
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 7. FUNCTION: check_and_expire_beta_keys
-- ================================================

CREATE OR REPLACE FUNCTION check_and_expire_beta_keys()
RETURNS INT
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_count INT;
BEGIN
  -- 1. Compter les clés à expirer
  SELECT COUNT(*) INTO v_count
  FROM beta_keys
  WHERE status = 'used'
    AND expires_at <= NOW();
  
  -- 2. Marquer les clés comme expirées
  UPDATE beta_keys
  SET status = 'expired'
  WHERE status = 'used'
    AND expires_at <= NOW();
  
  -- 3. Downgrade les utilisateurs beta → free
  UPDATE user_quotas
  SET tier = 'free',
      credits_total = 20,
      credits_remaining = LEAST(credits_remaining, 20), -- Garder crédits restants si < 20
      max_polls = 20,
      period_end = NOW() + interval '1 month',
      reset_date = NOW() + interval '1 month',
      updated_at = NOW()
  WHERE user_id IN (
    SELECT assigned_to
    FROM beta_keys
    WHERE status = 'expired'
      AND expires_at <= NOW()
  );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. CRON JOBS (optionnel - nécessite pg_cron extension)
-- ================================================
-- NOTE: Cette section est optionnelle. Si pg_cron n'est pas disponible,
-- vous pouvez ignorer cette section ou configurer les tâches cron manuellement.

-- Décommenter les lignes suivantes si pg_cron est disponible :
/*
-- Installer extension si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Reset quotas mensuels (1er du mois à minuit)
SELECT cron.schedule(
  'reset-monthly-quotas',
  '0 0 1 * *', -- Tous les 1er du mois à 00:00
  'SELECT reset_monthly_quotas();'
);

-- Expiration clés beta (tous les jours à 3h du matin)
SELECT cron.schedule(
  'expire-beta-keys',
  '0 3 * * *', -- Tous les jours à 03:00
  'SELECT check_and_expire_beta_keys();'
);
*/

-- ================================================
-- 9. TRIGGERS
-- ================================================

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_quotas_updated_at ON user_quotas;

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 10. DONNÉES INITIALES (optionnel)
-- ================================================

-- Créer quotas pour utilisateurs existants (migration)
-- NOTE: Cette section est optionnelle. Si elle échoue, vous pouvez l'ignorer.
-- Les quotas seront créés automatiquement lors de la première connexion de l'utilisateur.
/*
INSERT INTO user_quotas (user_id, tier, plan, credits_total, credits_remaining, max_polls, period_end, reset_date)
SELECT 
  id,
  'free',
  'monthly',
  20,
  20,
  20,
  NOW() + interval '1 month',
  NOW() + interval '1 month'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_quotas WHERE user_quotas.user_id = auth.users.id
);
*/

-- ================================================
-- FIN
-- ================================================

-- Vérification (simplifiée pour éviter les erreurs)
SELECT 
  'Tables créées' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beta_keys') as beta_keys_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_quotas') as user_quotas_table;

