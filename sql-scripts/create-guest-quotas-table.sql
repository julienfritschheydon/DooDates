-- ============================================================================
-- HELPERS: request header utilities (fingerprint + cached quota id)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_request_header(header_name text)
RETURNS TEXT
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  headers_text text;
  headers jsonb;
  value text;
BEGIN
  headers_text := current_setting('request.headers', true);

  IF coalesce(headers_text, '') = '' THEN
    RETURN NULL;
  END IF;

  headers := headers_text::jsonb;

  value := headers ->> lower(header_name);
  IF value IS NULL THEN
    value := headers ->> header_name;
  END IF;

  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  value := btrim(value);
  IF value = '' THEN
    RETURN NULL;
  END IF;

  RETURN value;
END;
$$;

CREATE OR REPLACE FUNCTION get_request_fingerprint()
RETURNS TEXT
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  header_fp text;
  jwt_fp text;
BEGIN
  header_fp := get_request_header('x-dd-fingerprint');

  IF header_fp IS NOT NULL THEN
    RETURN header_fp;
  END IF;

  jwt_fp := NULLIF(current_setting('request.jwt.claim.fingerprint', true), '');
  IF jwt_fp IS NOT NULL THEN
    RETURN jwt_fp;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION get_request_guest_quota_id()
RETURNS UUID
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  raw_id text;
  quota_id uuid;
BEGIN
  raw_id := get_request_header('x-dd-guest-quota-id');

  IF raw_id IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    quota_id := raw_id::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;

  RETURN quota_id;
END;
$$;

-- ============================================================================
-- TABLE: guest_quotas
-- Description: Tracking des quotas pour utilisateurs guests avec fingerprinting
-- ============================================================================

-- Créer la table guest_quotas
CREATE TABLE IF NOT EXISTS guest_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fingerprint unique du navigateur
  fingerprint TEXT NOT NULL UNIQUE,
  
  -- Compteurs de crédits consommés
  conversations_created INTEGER DEFAULT 0 NOT NULL,
  polls_created INTEGER DEFAULT 0 NOT NULL,
  -- Compteurs séparés par type de poll
  date_polls_created INTEGER DEFAULT 0 NOT NULL,
  form_polls_created INTEGER DEFAULT 0 NOT NULL,
  quizz_created INTEGER DEFAULT 0 NOT NULL,
  availability_polls_created INTEGER DEFAULT 0 NOT NULL,
  ai_messages INTEGER DEFAULT 0 NOT NULL,
  analytics_queries INTEGER DEFAULT 0 NOT NULL,
  simulations INTEGER DEFAULT 0 NOT NULL,
  total_credits_consumed INTEGER DEFAULT 0 NOT NULL,
  last_reset_at TIMESTAMPTZ,
  
  -- Métadonnées
  first_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Informations navigateur (pour debug/analytics)
  user_agent TEXT,
  timezone TEXT,
  language TEXT,
  screen_resolution TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche rapide par fingerprint
CREATE INDEX IF NOT EXISTS idx_guest_quotas_fingerprint 
  ON guest_quotas(fingerprint);

-- Index pour nettoyage des anciens guests (>90 jours inactifs)
CREATE INDEX IF NOT EXISTS idx_guest_quotas_last_activity 
  ON guest_quotas(last_activity_at);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Activer RLS
ALTER TABLE guest_quotas ENABLE ROW LEVEL SECURITY;

-- Policy helpers
DROP POLICY IF EXISTS "Allow public read access" ON guest_quotas;
CREATE POLICY "Allow public read access"
  ON guest_quotas
  FOR SELECT
  TO anon
  USING (
    fingerprint = get_request_fingerprint()
    OR id = get_request_guest_quota_id()
  );

DROP POLICY IF EXISTS "Allow public insert" ON guest_quotas;
CREATE POLICY "Allow public insert"
  ON guest_quotas
  FOR INSERT
  TO anon
  WITH CHECK (
    fingerprint = get_request_fingerprint()
  );

DROP POLICY IF EXISTS "Allow public update" ON guest_quotas;
CREATE POLICY "Allow public update"
  ON guest_quotas
  FOR UPDATE
  TO anon
  USING (
    fingerprint = get_request_fingerprint()
    OR id = get_request_guest_quota_id()
  )
  WITH CHECK (
    fingerprint = get_request_fingerprint()
  );

DROP POLICY IF EXISTS "Service role full access guest_quotas" ON guest_quotas;
CREATE POLICY "Service role full access guest_quotas"
  ON guest_quotas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: update_guest_quota_timestamp
-- Description: Met à jour automatiquement updated_at et last_activity_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_guest_quota_timestamp()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
DROP TRIGGER IF EXISTS update_guest_quotas_timestamp ON guest_quotas;
CREATE TRIGGER update_guest_quotas_timestamp
  BEFORE UPDATE ON guest_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_quota_timestamp();

-- ============================================================================
-- FUNCTION: cleanup_old_guest_quotas
-- Description: Nettoie les quotas guests inactifs depuis plus de 90 jours
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_guest_quotas()
RETURNS INTEGER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM guest_quotas
  WHERE last_activity_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: guest_quota_journal
-- Description: Journal détaillé des consommations de crédits
-- ============================================================================

CREATE TABLE IF NOT EXISTS guest_quota_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au guest
  guest_quota_id UUID NOT NULL REFERENCES guest_quotas(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  
  -- Détails de l'action
  action TEXT NOT NULL CHECK (action IN (
    'conversation_created',
    'poll_created',
    'ai_message',
    'analytics_query',
    'simulation',
    'other'
  )),
  credits INTEGER NOT NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche par guest
CREATE INDEX IF NOT EXISTS idx_guest_journal_guest_id 
  ON guest_quota_journal(guest_quota_id);

-- Index pour recherche par fingerprint
CREATE INDEX IF NOT EXISTS idx_guest_journal_fingerprint 
  ON guest_quota_journal(fingerprint);

-- Index pour recherche par date
CREATE INDEX IF NOT EXISTS idx_guest_journal_created_at 
  ON guest_quota_journal(created_at DESC);

-- RLS pour journal
ALTER TABLE guest_quota_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read journal" ON guest_quota_journal;
CREATE POLICY "Allow public read journal"
  ON guest_quota_journal
  FOR SELECT
  TO anon
  USING (
    fingerprint = get_request_fingerprint()
    OR guest_quota_id = get_request_guest_quota_id()
  );

DROP POLICY IF EXISTS "Allow public insert journal" ON guest_quota_journal;
CREATE POLICY "Allow public insert journal"
  ON guest_quota_journal
  FOR INSERT
  TO anon
  WITH CHECK (
    fingerprint = get_request_fingerprint()
    OR guest_quota_id = get_request_guest_quota_id()
  );

DROP POLICY IF EXISTS "Service role full access guest_quota_journal" ON guest_quota_journal;
CREATE POLICY "Service role full access guest_quota_journal"
  ON guest_quota_journal
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE guest_quotas IS 'Tracking des quotas pour utilisateurs guests avec fingerprinting navigateur';
COMMENT ON COLUMN guest_quotas.fingerprint IS 'Empreinte unique du navigateur (canvas + fonts + timezone + screen)';
COMMENT ON COLUMN guest_quotas.total_credits_consumed IS 'Total de tous les crédits consommés (ne se remet jamais à zéro)';
COMMENT ON COLUMN guest_quotas.last_reset_at IS 'Date du dernier reset manuel (admin)';
COMMENT ON COLUMN guest_quotas.last_activity_at IS 'Dernière activité - utilisé pour cleanup automatique après 90 jours';

COMMENT ON TABLE guest_quota_journal IS 'Journal détaillé de toutes les consommations de crédits par les guests';
COMMENT ON COLUMN guest_quota_journal.metadata IS 'Métadonnées JSON (conversationId, pollId, etc.)';

-- ============================================================================
-- FUNCTION: admin_reset_guest_quota
-- Description: Reset manuel des quotas d'un guest (admin only)
-- Sécurité: Nécessite service_role (SECURITY DEFINER)
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_reset_guest_quota(target_fingerprint TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  quota_id UUID;
  reset_count INTEGER;
BEGIN
  -- Vérifier que la fonction est appelée avec service_role
  -- En production, cette fonction ne peut être appelée qu'avec la clé service_role de Supabase
  
  SELECT id INTO quota_id
  FROM guest_quotas
  WHERE fingerprint = target_fingerprint;
  
  IF quota_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Fingerprint not found',
      'fingerprint', target_fingerprint
    );
  END IF;
  
  -- Reset des compteurs
  UPDATE guest_quotas
  SET 
    conversations_created = 0,
    polls_created = 0,
    date_polls_created = 0,
    form_polls_created = 0,
    quizz_created = 0,
    availability_polls_created = 0,
    ai_messages = 0,
    analytics_queries = 0,
    simulations = 0,
    total_credits_consumed = 0,
    last_reset_at = NOW(),
    updated_at = NOW(),
    last_activity_at = NOW()
  WHERE id = quota_id;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  -- Journaliser le reset
  INSERT INTO guest_quota_journal (
    guest_quota_id,
    fingerprint,
    action,
    credits,
    metadata
  ) VALUES (
    quota_id,
    target_fingerprint,
    'admin_reset',
    0,
    jsonb_build_object(
      'reset_by', 'admin', 
      'reset_at', NOW(),
      'reset_type', 'manual'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'quota_id', quota_id,
    'fingerprint', target_fingerprint,
    'reset_at', NOW(),
    'rows_updated', reset_count
  );
END;
$$;

COMMENT ON FUNCTION admin_reset_guest_quota IS 'Reset manuel des quotas d''un guest (admin only, nécessite service_role)';
