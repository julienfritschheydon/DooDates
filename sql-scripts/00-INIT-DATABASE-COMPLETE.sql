-- ============================================
-- DooDates - Script d'initialisation complète
-- ============================================
-- Ce script crée toutes les tables nécessaires pour DooDates
-- À exécuter dans le SQL Editor de Supabase
--
-- IMPORTANT : Exécutez ce script UNIQUEMENT si votre base est vide
-- ou si les tables n'existent pas encore
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  preferences JSONB DEFAULT '{}',
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan_type);

-- RLS pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- 2. POLLS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id),  -- NULL pour anonymous
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_poll_slug(poll_title TEXT)
RETURNS TEXT
SET search_path = public, extensions
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convertir le titre en slug
  base_slug := lower(regexp_replace(poll_title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Limiter à 50 caractères
  base_slug := left(base_slug, 50);
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité
  WHILE EXISTS (SELECT 1 FROM polls WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Indexes pour polls
CREATE INDEX IF NOT EXISTS idx_polls_creator ON polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_slug ON polls(slug);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

-- RLS pour polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Creator can manage own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
DROP POLICY IF EXISTS "polls_insert_own" ON polls;
DROP POLICY IF EXISTS "polls_select_own" ON polls;
DROP POLICY IF EXISTS "polls_insert_anonymous" ON polls;
DROP POLICY IF EXISTS "polls_view_active" ON polls;
DROP POLICY IF EXISTS "polls_update_own" ON polls;
DROP POLICY IF EXISTS "polls_delete_own" ON polls;
DROP POLICY IF EXISTS "polls_select_access" ON polls;

-- Allow anyone to create polls (anonymous or authenticated)
CREATE POLICY "polls_insert_anonymous" ON polls 
  FOR INSERT WITH CHECK (true);

-- Allow creators to select their own polls or view active polls
CREATE POLICY "polls_select_access" ON polls 
  FOR SELECT USING (((SELECT auth.uid()) = creator_id) OR status = 'active');

-- Allow creators to update/delete their own polls (if authenticated)
CREATE POLICY "polls_update_own" ON polls 
  FOR UPDATE USING ((SELECT auth.uid()) = creator_id);

CREATE POLICY "polls_delete_own" ON polls 
  FOR DELETE USING ((SELECT auth.uid()) = creator_id);

-- ============================================
-- 3. POLL_OPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_date DATE NOT NULL,
  time_slots JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour poll_options
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_date ON poll_options(option_date);
CREATE INDEX IF NOT EXISTS idx_poll_options_order ON poll_options(poll_id, display_order);

-- RLS pour poll_options
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Poll options follow poll access" ON poll_options;
DROP POLICY IF EXISTS "Creator can manage poll options" ON poll_options;
DROP POLICY IF EXISTS "poll_options_insert_own" ON poll_options;
DROP POLICY IF EXISTS "poll_options_insert_anonymous" ON poll_options;
DROP POLICY IF EXISTS "poll_options_select_public" ON poll_options;
DROP POLICY IF EXISTS "poll_options_modify_own" ON poll_options;
DROP POLICY IF EXISTS "poll_options_select_access" ON poll_options;
DROP POLICY IF EXISTS "poll_options_update_own" ON poll_options;
DROP POLICY IF EXISTS "poll_options_delete_own" ON poll_options;

-- Allow inserting poll options for any poll (anonymous or authenticated)
CREATE POLICY "poll_options_insert_anonymous" ON poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id
    )
  );

-- Anyone can view poll options if they own the poll or poll is active
CREATE POLICY "poll_options_select_access" ON poll_options 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (((SELECT auth.uid()) = polls.creator_id) OR polls.status = 'active')
    )
  );

-- Creator can update/delete poll options
CREATE POLICY "poll_options_update_own" ON poll_options 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (SELECT auth.uid()) = polls.creator_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (SELECT auth.uid()) = polls.creator_id
    )
  );

CREATE POLICY "poll_options_delete_own" ON poll_options 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (SELECT auth.uid()) = polls.creator_id
    )
  );

-- ============================================
-- 4. VOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  voter_email TEXT NOT NULL,
  voter_name TEXT NOT NULL,
  voter_id UUID REFERENCES profiles(id), -- NULL si anonyme
  selections JSONB NOT NULL,
  comment TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour votes
CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_email ON votes(poll_id, voter_email);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

-- RLS pour votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "votes_insert_public" ON votes;
DROP POLICY IF EXISTS "votes_select_public" ON votes;
DROP POLICY IF EXISTS "votes_update_own" ON votes;
DROP POLICY IF EXISTS "votes_delete_own" ON votes;

-- Allow anyone to vote (anonymous or authenticated)
CREATE POLICY "votes_insert_public" ON votes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.status = 'active'
    )
  );

-- Anyone can view votes for active polls
CREATE POLICY "votes_select_public" ON votes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.status = 'active'
    )
  );

-- Voters can update their own votes
CREATE POLICY "votes_update_own" ON votes 
  FOR UPDATE USING (
    ((SELECT auth.uid()) = voter_id) OR 
    (voter_email = (SELECT current_setting('request.jwt.claims', true))::json->>'email')
  );

-- Voters can delete their own votes
CREATE POLICY "votes_delete_own" ON votes 
  FOR DELETE USING (
    ((SELECT auth.uid()) = voter_id) OR 
    (voter_email = (SELECT current_setting('request.jwt.claims', true))::json->>'email')
  );

-- ============================================
-- 5. CONVERSATIONS TABLE (Historique IA)
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),  -- NULL pour invités
  session_id TEXT NOT NULL,
  title TEXT,
  first_message TEXT,  -- Premier message pour aperçu
  message_count INTEGER DEFAULT 0,  -- Nombre de messages
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  poll_id UUID REFERENCES polls(id),  -- Lien optionnel vers un poll créé
  related_poll_id UUID REFERENCES polls(id),  -- Alias pour compatibilité
  is_favorite BOOLEAN DEFAULT FALSE,  -- Conversation favorite
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_poll ON conversations(poll_id) WHERE poll_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- RLS pour conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_select_own" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_own" ON conversations;

-- Allow users to access only their own conversations
CREATE POLICY "Users can view own conversations" ON conversations 
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations" ON conversations 
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations 
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 6. ANALYTICS_EVENTS TABLE (Optionnel)
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- RLS pour analytics_events (permissif pour tracking)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "analytics_insert_all" ON analytics_events;
DROP POLICY IF EXISTS "analytics_select_own" ON analytics_events;

-- Allow anyone to insert analytics events
CREATE POLICY "analytics_insert_all" ON analytics_events 
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own analytics
CREATE POLICY "analytics_select_own" ON analytics_events 
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Function pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur les tables pertinentes
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_polls ON polls;
CREATE TRIGGER set_updated_at_polls
  BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_votes ON votes;
CREATE TRIGGER set_updated_at_votes
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_conversations ON conversations;
CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VERIFICATION
-- ============================================

-- Afficher toutes les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'polls', 'poll_options', 'votes', 'conversations', 'analytics_events')
ORDER BY table_name;

-- Afficher toutes les policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'polls', 'poll_options', 'votes', 'conversations', 'analytics_events')
ORDER BY tablename, policyname;

-- Compter les objets créés
DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'polls', 'poll_options', 'votes', 'conversations', 'analytics_events');
  
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename IN ('profiles', 'polls', 'poll_options', 'votes', 'conversations', 'analytics_events');
  
  SELECT COUNT(*) INTO trigger_count 
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'polls', 'poll_options', 'votes', 'conversations', 'analytics_events')
  AND NOT t.tgisinternal;
  
  RAISE NOTICE 'DooDates - Installation réussie !';
  RAISE NOTICE '  Tables créées: % / 6', table_count;
  RAISE NOTICE '  Policies créées: %', policy_count;
  RAISE NOTICE '  Triggers créés: %', trigger_count;
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Les tables sont maintenant créées et configurées !
-- Votre application DooDates devrait fonctionner.
-- ============================================

