-- Migration: Create consume_ai_credit and rollback_ai_credit functions
-- These functions are required by the hyper-task Edge Function for quota management

-- Drop existing functions first to allow changing return types
DROP FUNCTION IF EXISTS public.consume_ai_credit(UUID);
DROP FUNCTION IF EXISTS public.rollback_ai_credit(UUID);

-- Table pour stocker les crédits AI des utilisateurs (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.user_ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 100,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour les lookups rapides par user_id
CREATE INDEX IF NOT EXISTS idx_user_ai_credits_user_id ON public.user_ai_credits(user_id);

-- RLS pour user_ai_credits
ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;

-- Policy: les utilisateurs peuvent voir leurs propres crédits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_ai_credits;
CREATE POLICY "Users can view own credits" ON public.user_ai_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Fonction pour consommer un crédit AI
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_remaining INTEGER;
  v_result JSON;
BEGIN
  -- Insérer un enregistrement si l'utilisateur n'en a pas encore
  INSERT INTO user_ai_credits (user_id, credits_remaining, credits_used)
  VALUES (p_user_id, 100, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Réinitialiser les crédits si plus de 30 jours depuis le dernier reset
  UPDATE user_ai_credits
  SET credits_remaining = 100,
      credits_used = 0,
      last_reset_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND last_reset_at < NOW() - INTERVAL '30 days';

  -- Tenter de consommer un crédit
  UPDATE user_ai_credits
  SET credits_remaining = credits_remaining - 1,
      credits_used = credits_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND credits_remaining > 0
  RETURNING credits_remaining INTO v_credits_remaining;

  -- Vérifier si la mise à jour a réussi
  IF v_credits_remaining IS NOT NULL THEN
    v_result := json_build_object(
      'success', true,
      'credits_remaining', v_credits_remaining,
      'message', 'Crédit consommé avec succès'
    );
  ELSE
    -- Récupérer le nombre de crédits restants
    SELECT credits_remaining INTO v_credits_remaining
    FROM user_ai_credits
    WHERE user_id = p_user_id;

    v_result := json_build_object(
      'success', false,
      'credits_remaining', COALESCE(v_credits_remaining, 0),
      'message', 'Quota de crédits IA épuisé'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Fonction pour rollback un crédit AI (en cas d'erreur Gemini)
CREATE OR REPLACE FUNCTION public.rollback_ai_credit(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_ai_credits
  SET credits_remaining = credits_remaining + 1,
      credits_used = GREATEST(credits_used - 1, 0),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Accorder les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_ai_credit(UUID) TO authenticated;

-- Accorder aussi au service role (pour les Edge Functions)
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.rollback_ai_credit(UUID) TO service_role;

-- Accorder les permissions sur la table
GRANT SELECT, INSERT, UPDATE ON public.user_ai_credits TO authenticated;
GRANT ALL ON public.user_ai_credits TO service_role;
