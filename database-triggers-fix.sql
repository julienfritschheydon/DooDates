-- ============================================
-- CORRECTION URGENTE : TRIGGERS MANQUANTS
-- ============================================
-- Fichier : database-triggers-fix.sql
-- Date : 22 Janvier 2025
-- Problème résolu : "Database error saving new user"

-- 1. FONCTION POUR CRÉATION AUTOMATIQUE DE PROFIL
-- ===============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, timezone, preferences, plan_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Europe/Paris'),
    COALESCE(NEW.raw_user_meta_data->>'preferences', '{}')::jsonb,
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- En cas d'erreur, on log mais on n'empêche pas la création de l'utilisateur
    RAISE WARNING 'Erreur lors de la création du profil pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER POUR CRÉATION AUTOMATIQUE DE PROFIL
-- ==============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. FONCTION POUR MISE À JOUR AUTOMATIQUE DES TIMESTAMPS
-- =======================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGERS POUR UPDATED_AT SUR TOUTES LES TABLES
-- =================================================

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_polls ON public.polls;
CREATE TRIGGER set_updated_at_polls
  BEFORE UPDATE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_votes ON public.votes;
CREATE TRIGGER set_updated_at_votes
  BEFORE UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_conversations ON public.conversations;
CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. PERMISSIONS NÉCESSAIRES
-- ==========================

-- Permissions pour les fonctions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO postgres, service_role;

-- Permissions sur les tables pour les utilisateurs authentifiés
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT INSERT ON public.analytics_events TO authenticated, anon;

-- 6. VÉRIFICATION DES TRIGGERS (REQUÊTE CORRIGÉE)
-- ===============================================

-- Vérifier que les triggers sont bien créés
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname IN ('public', 'auth')
  AND NOT t.tgisinternal
  AND (t.tgname LIKE '%auth_user%' OR t.tgname LIKE '%updated_at%')
ORDER BY n.nspname, c.relname, t.tgname;

-- ============================================
-- INSTRUCTIONS D'EXÉCUTION :
-- ============================================
-- 1. Aller dans Supabase Dashboard
-- 2. SQL Editor
-- 3. Coller ce script complet (CORRIGÉ)
-- 4. Exécuter (RUN)
-- 5. Vérifier les résultats dans la console
-- 6. Tester l'authentification Google
-- ============================================ 