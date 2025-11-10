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
  ai_messages INTEGER DEFAULT 0 NOT NULL,
  analytics_queries INTEGER DEFAULT 0 NOT NULL,
  simulations INTEGER DEFAULT 0 NOT NULL,
  total_credits_consumed INTEGER DEFAULT 0 NOT NULL,
  
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

-- Policy: Tout le monde peut lire (pour vérifier quotas)
CREATE POLICY "Allow public read access"
  ON guest_quotas
  FOR SELECT
  TO public
  USING (true);

-- Policy: Tout le monde peut insérer (nouveau guest)
CREATE POLICY "Allow public insert"
  ON guest_quotas
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Tout le monde peut mettre à jour (consommer crédits)
CREATE POLICY "Allow public update"
  ON guest_quotas
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: update_guest_quota_timestamp
-- Description: Met à jour automatiquement updated_at et last_activity_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_guest_quota_timestamp()
RETURNS TRIGGER AS $$
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
RETURNS INTEGER AS $$
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

CREATE POLICY "Allow public read journal"
  ON guest_quota_journal
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert journal"
  ON guest_quota_journal
  FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE guest_quotas IS 'Tracking des quotas pour utilisateurs guests avec fingerprinting navigateur';
COMMENT ON COLUMN guest_quotas.fingerprint IS 'Empreinte unique du navigateur (canvas + fonts + timezone + screen)';
COMMENT ON COLUMN guest_quotas.total_credits_consumed IS 'Total de tous les crédits consommés (ne se remet jamais à zéro)';
COMMENT ON COLUMN guest_quotas.last_activity_at IS 'Dernière activité - utilisé pour cleanup automatique après 90 jours';

COMMENT ON TABLE guest_quota_journal IS 'Journal détaillé de toutes les consommations de crédits par les guests';
COMMENT ON COLUMN guest_quota_journal.metadata IS 'Métadonnées JSON (conversationId, pollId, etc.)';
