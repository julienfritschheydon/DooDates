-- ============================================
-- CORRECTION DES ERREURS 400 SUPABASE
-- ============================================
-- Fichier : fix-400-errors.sql
-- Date : 7 Novembre 2025
-- Problème résolu : Erreurs 400 sur profiles et conversations

-- ============================================
-- DIAGNOSTIC PRÉALABLE
-- ============================================

-- 1. Vérifier que la table profiles existe et a toutes les colonnes
DO $$
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC TABLE PROFILES ===';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Vérifier que la table conversations existe et a toutes les colonnes
DO $$
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC TABLE CONVERSATIONS ===';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- ============================================
-- CORRECTION 1 : TABLE PROFILES
-- ============================================

-- S'assurer que toutes les colonnes existent
DO $$
BEGIN
  -- Vérifier et ajouter subscription_expires_at si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne subscription_expires_at ajoutée à profiles';
  END IF;

  -- Vérifier et ajouter created_at si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Colonne created_at ajoutée à profiles';
  END IF;

  -- Vérifier et ajouter updated_at si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Colonne updated_at ajoutée à profiles';
  END IF;
END $$;

-- ============================================
-- CORRECTION 2 : RLS POLICIES PROFILES
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy pour SELECT : utilisateur peut voir son propre profil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy pour INSERT : utilisateur peut créer son propre profil
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy pour UPDATE : utilisateur peut modifier son propre profil
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- CORRECTION 3 : TABLE CONVERSATIONS
-- ============================================

-- S'assurer que la table conversations existe
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  title TEXT NOT NULL,
  first_message TEXT,
  message_count INTEGER DEFAULT 0,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  poll_id TEXT,
  related_poll_id TEXT,
  is_favorite BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_poll_id ON public.conversations(poll_id);

-- ============================================
-- CORRECTION 4 : RLS POLICIES CONVERSATIONS
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

-- Activer RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy pour SELECT : utilisateur peut voir ses propres conversations
CREATE POLICY "Users can view own conversations" 
ON public.conversations 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

-- Policy pour INSERT : utilisateur peut créer ses propres conversations
CREATE POLICY "Users can insert own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy pour UPDATE : utilisateur peut modifier ses propres conversations
CREATE POLICY "Users can update own conversations" 
ON public.conversations 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy pour DELETE : utilisateur peut supprimer ses propres conversations
CREATE POLICY "Users can delete own conversations" 
ON public.conversations 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- CORRECTION 5 : TABLE MESSAGES
-- ============================================

-- S'assurer que la table messages existe
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- CORRECTION 6 : RLS POLICIES MESSAGES
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- Activer RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy pour SELECT : utilisateur peut voir ses propres messages
CREATE POLICY "Users can view own messages" 
ON public.messages 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

-- Policy pour INSERT : utilisateur peut créer ses propres messages
CREATE POLICY "Users can insert own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy pour UPDATE : utilisateur peut modifier ses propres messages
CREATE POLICY "Users can update own messages" 
ON public.messages 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy pour DELETE : utilisateur peut supprimer ses propres messages
CREATE POLICY "Users can delete own messages" 
ON public.messages 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- CORRECTION 7 : TRIGGERS UPDATED_AT
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour conversations
DROP TRIGGER IF EXISTS set_updated_at_conversations ON public.conversations;
CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour messages
DROP TRIGGER IF EXISTS set_updated_at_messages ON public.messages;
CREATE TRIGGER set_updated_at_messages
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== VÉRIFICATION FINALE ===';
  RAISE NOTICE 'Script terminé avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE 'Vérifiez maintenant :';
  RAISE NOTICE '1. Que toutes les colonnes existent dans profiles';
  RAISE NOTICE '2. Que toutes les colonnes existent dans conversations';
  RAISE NOTICE '3. Que les RLS policies sont actives';
  RAISE NOTICE '4. Testez la création d''une conversation depuis l''app';
END $$;

-- Afficher le résultat final
SELECT 
  'profiles' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
UNION ALL
SELECT 
  'conversations' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversations'
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages';

