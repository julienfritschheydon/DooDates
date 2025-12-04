-- ============================================================================
-- TABLE: quota_tracking
-- Description: Tracking des quotas pour utilisateurs authentifiés
-- Migration Phase 3: Remplace localStorage par validation serveur
-- ============================================================================

-- Créer la table quota_tracking
CREATE TABLE IF NOT EXISTS quota_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence utilisateur (obligatoire pour auth users)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Compteurs de crédits consommés (même structure que guest_quotas)
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
  
  -- Reset mensuel basé sur abonnement
  subscription_start_date TIMESTAMPTZ,
  last_reset_date TIMESTAMPTZ,
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contrainte unique : un seul quota par utilisateur
  UNIQUE(user_id)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_quota_tracking_user_id 
  ON quota_tracking(user_id);

-- Index pour reset mensuel (recherche par période)
CREATE INDEX IF NOT EXISTS idx_quota_tracking_period 
  ON quota_tracking(period_start, period_end);

-- ============================================================================
-- TABLE: quota_tracking_journal
-- Description: Journal détaillé des consommations de crédits (auth users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quota_tracking_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au quota tracking
  quota_tracking_id UUID NOT NULL REFERENCES quota_tracking(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
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
  
  -- Métadonnées (conversationId, pollId, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche par user
CREATE INDEX IF NOT EXISTS idx_quota_journal_user_id 
  ON quota_tracking_journal(user_id);

-- Index pour recherche par quota_tracking_id
CREATE INDEX IF NOT EXISTS idx_quota_journal_quota_id 
  ON quota_tracking_journal(quota_tracking_id);

-- Index pour recherche par date (plus récent en premier)
CREATE INDEX IF NOT EXISTS idx_quota_journal_created_at 
  ON quota_tracking_journal(created_at DESC);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Activer RLS sur quota_tracking
ALTER TABLE quota_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres quotas
DROP POLICY IF EXISTS "Users can view own quotas" ON quota_tracking;
CREATE POLICY "Users can view own quotas"
  ON quota_tracking
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Policy: Les utilisateurs peuvent créer leur propre quota
DROP POLICY IF EXISTS "Users can create own quota" ON quota_tracking;
CREATE POLICY "Users can create own quota"
  ON quota_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leur propre quota
DROP POLICY IF EXISTS "Users can update own quota" ON quota_tracking;
CREATE POLICY "Users can update own quota"
  ON quota_tracking
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Service role a accès complet (pour Edge Functions et monitoring)
DROP POLICY IF EXISTS "Service role full access quota_tracking" ON quota_tracking;
CREATE POLICY "Service role full access quota_tracking"
  ON quota_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Activer RLS sur quota_tracking_journal
ALTER TABLE quota_tracking_journal ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leur propre journal
DROP POLICY IF EXISTS "Users can view own journal" ON quota_tracking_journal;
CREATE POLICY "Users can view own journal"
  ON quota_tracking_journal
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Policy: Les utilisateurs peuvent insérer dans leur propre journal
DROP POLICY IF EXISTS "Users can insert own journal" ON quota_tracking_journal;
CREATE POLICY "Users can insert own journal"
  ON quota_tracking_journal
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Service role a accès complet
DROP POLICY IF EXISTS "Service role full access quota_tracking_journal" ON quota_tracking_journal;
CREATE POLICY "Service role full access quota_tracking_journal"
  ON quota_tracking_journal
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: update_quota_tracking_timestamp
-- Description: Met à jour automatiquement updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_quota_tracking_timestamp()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
DROP TRIGGER IF EXISTS update_quota_tracking_timestamp ON quota_tracking;
CREATE TRIGGER update_quota_tracking_timestamp
  BEFORE UPDATE ON quota_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_quota_tracking_timestamp();

-- ============================================================================
-- FUNCTION: ensure_quota_tracking_exists
-- Description: Crée ou récupère le quota tracking pour un utilisateur
-- Utilisé par Edge Function pour garantir existence
-- ============================================================================

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

COMMENT ON FUNCTION ensure_quota_tracking_exists IS 'Crée ou récupère le quota tracking pour un utilisateur (utilisé par Edge Function)';

-- ============================================================================
-- FUNCTION: consume_quota_credits
-- Description: Consomme des crédits de manière atomique (transaction)
-- Utilisé par Edge Function pour consommation sécurisée
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_quota_credits(
  p_user_id UUID,
  p_action TEXT,
  p_credits INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  quota_id UUID;
  current_total INTEGER;
  current_action_count INTEGER;
  current_poll_type_count INTEGER;
  action_limit INTEGER;
  poll_type_limit INTEGER;
  total_limit INTEGER;
  p_poll_type TEXT;
  result JSONB;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- S'assurer que le quota existe
  SELECT ensure_quota_tracking_exists(p_user_id) INTO quota_id;
  
  -- Extraire pollType depuis metadata si action = 'poll_created'
  IF p_action = 'poll_created' THEN
    p_poll_type := p_metadata->>'pollType';
    
    -- Validation stricte : pollType est obligatoire pour poll_created
    IF p_poll_type IS NULL OR p_poll_type = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'pollType is required in metadata for poll_created action'
      );
    END IF;
    
    -- Valider que pollType est valide
    IF p_poll_type NOT IN ('date', 'form', 'quizz', 'availability') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Invalid pollType: %s. Must be one of: date, form, quizz, availability', p_poll_type)
      );
    END IF;
  END IF;
  
  -- Récupérer le quota avec lock (FOR UPDATE = transaction atomique)
  SELECT 
    total_credits_consumed,
    CASE p_action
      WHEN 'conversation_created' THEN conversations_created
      WHEN 'poll_created' THEN polls_created
      WHEN 'ai_message' THEN ai_messages
      WHEN 'analytics_query' THEN analytics_queries
      WHEN 'simulation' THEN simulations
      ELSE 0
    END,
    CASE 
      WHEN p_action = 'poll_created' AND p_poll_type = 'date' THEN date_polls_created
      WHEN p_action = 'poll_created' AND p_poll_type = 'form' THEN form_polls_created
      WHEN p_action = 'poll_created' AND p_poll_type = 'quizz' THEN quizz_created
      WHEN p_action = 'poll_created' AND p_poll_type = 'availability' THEN availability_polls_created
      ELSE 0
    END
  INTO current_total, current_action_count, current_poll_type_count
  FROM quota_tracking
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Définir les limites selon le tier (pour l'instant, valeurs par défaut)
  -- TODO: Récupérer depuis user_quotas si existe
  total_limit := 100; -- Limite par défaut pour auth users
  action_limit := CASE p_action
    WHEN 'conversation_created' THEN 100
    WHEN 'ai_message' THEN 100
    WHEN 'analytics_query' THEN 100
    WHEN 'simulation' THEN 20
    -- Note: poll_created n'a plus de limite globale, uniquement par type
    ELSE 100
  END;
  
  -- Limites par type de poll (sera défini dans le planning de décembre, valeurs temporaires)
  IF p_action = 'poll_created' THEN
    poll_type_limit := 50; -- Limite temporaire par type, sera définie dans planning décembre
  END IF;
  
  -- Vérifier limites totales
  IF current_total + p_credits > total_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Total credit limit reached',
      'current_total', current_total,
      'limit', total_limit
    );
  END IF;
  
  -- Vérifier limite globale pour l'action (sauf poll_created qui est géré par type uniquement)
  IF p_action != 'poll_created' AND current_action_count >= action_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('%s limit reached', p_action),
      'current_count', current_action_count,
      'limit', action_limit
    );
  END IF;
  
  -- Vérifier limite spécifique par type de poll (SEULE vérification pour poll_created)
  IF p_action = 'poll_created' AND current_poll_type_count >= poll_type_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('%s poll limit reached for type %s', p_action, p_poll_type),
      'current_count', current_poll_type_count,
      'limit', poll_type_limit,
      'poll_type', p_poll_type
    );
  END IF;
  
  -- Mettre à jour les compteurs
  UPDATE quota_tracking
  SET
    total_credits_consumed = total_credits_consumed + p_credits,
    conversations_created = CASE WHEN p_action = 'conversation_created' 
      THEN conversations_created + p_credits ELSE conversations_created END,
    polls_created = CASE WHEN p_action = 'poll_created' 
      THEN polls_created + p_credits ELSE polls_created END,
    -- Incrémenter le compteur spécifique selon pollType
    date_polls_created = CASE WHEN p_action = 'poll_created' AND p_poll_type = 'date'
      THEN date_polls_created + p_credits ELSE date_polls_created END,
    form_polls_created = CASE WHEN p_action = 'poll_created' AND p_poll_type = 'form'
      THEN form_polls_created + p_credits ELSE form_polls_created END,
    quizz_created = CASE WHEN p_action = 'poll_created' AND p_poll_type = 'quizz'
      THEN quizz_created + p_credits ELSE quizz_created END,
    availability_polls_created = CASE WHEN p_action = 'poll_created' AND p_poll_type = 'availability'
      THEN availability_polls_created + p_credits ELSE availability_polls_created END,
    ai_messages = CASE WHEN p_action = 'ai_message' 
      THEN ai_messages + p_credits ELSE ai_messages END,
    analytics_queries = CASE WHEN p_action = 'analytics_query' 
      THEN analytics_queries + p_credits ELSE analytics_queries END,
    simulations = CASE WHEN p_action = 'simulation' 
      THEN simulations + p_credits ELSE simulations END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Ajouter entrée au journal
  INSERT INTO quota_tracking_journal (
    quota_tracking_id,
    user_id,
    action,
    credits,
    metadata
  ) VALUES (
    quota_id,
    p_user_id,
    p_action,
    p_credits,
    p_metadata
  );
  
  -- Retourner le quota mis à jour
  SELECT jsonb_build_object(
    'success', true,
    'quota', row_to_json(qt.*)
  )
  INTO result
  FROM quota_tracking qt
  WHERE qt.user_id = p_user_id;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION consume_quota_credits IS 'Consomme des crédits de manière atomique avec vérification des limites';

-- ============================================================================
-- FUNCTION: sync_polls_created_from_separated_counters
-- Description: Maintient automatiquement polls_created = somme des compteurs séparés
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_polls_created_from_separated_counters()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  -- Maintenir polls_created = somme des 4 compteurs séparés
  NEW.polls_created := COALESCE(NEW.date_polls_created, 0) + 
                       COALESCE(NEW.form_polls_created, 0) + 
                       COALESCE(NEW.quizz_created, 0) + 
                       COALESCE(NEW.availability_polls_created, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir polls_created automatiquement
DROP TRIGGER IF EXISTS sync_polls_created_trigger ON quota_tracking;
CREATE TRIGGER sync_polls_created_trigger
  BEFORE INSERT OR UPDATE ON quota_tracking
  FOR EACH ROW
  WHEN (
    -- Se déclencher si un des compteurs séparés change
    (OLD IS NULL) OR
    (NEW.date_polls_created IS DISTINCT FROM OLD.date_polls_created) OR
    (NEW.form_polls_created IS DISTINCT FROM OLD.form_polls_created) OR
    (NEW.quizz_created IS DISTINCT FROM OLD.quizz_created) OR
    (NEW.availability_polls_created IS DISTINCT FROM OLD.availability_polls_created)
  )
  EXECUTE FUNCTION sync_polls_created_from_separated_counters();

COMMENT ON FUNCTION sync_polls_created_from_separated_counters IS 'Maintient automatiquement polls_created = somme des compteurs séparés par type';

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE quota_tracking IS 'Tracking des quotas pour utilisateurs authentifiés (remplace localStorage)';
COMMENT ON COLUMN quota_tracking.total_credits_consumed IS 'Total de tous les crédits consommés';
COMMENT ON COLUMN quota_tracking.subscription_start_date IS 'Date de début d''abonnement (pour reset mensuel)';
COMMENT ON COLUMN quota_tracking.last_reset_date IS 'Date du dernier reset mensuel';

COMMENT ON TABLE quota_tracking_journal IS 'Journal détaillé de toutes les consommations de crédits par les utilisateurs authentifiés';
COMMENT ON COLUMN quota_tracking_journal.metadata IS 'Métadonnées JSON (conversationId, pollId, etc.)';

