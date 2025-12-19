-- Script corrigé pour les fonctions de rate limiting
-- Convertit TEXT en UUID pour les comparaisons

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.can_consume_rate_limit(p_user_id TEXT, p_action TEXT, p_ip TEXT, p_limit_per_hour INTEGER);
DROP FUNCTION IF EXISTS public.consume_quota_credits(p_user_id TEXT, p_action TEXT, p_credits INTEGER, p_metadata JSONB);
DROP FUNCTION IF EXISTS public.ensure_quota_tracking_exists(p_user_id TEXT);

-- Fonction principale de rate limiting (corrigée UUID)
CREATE OR REPLACE FUNCTION public.can_consume_rate_limit(
    p_user_id TEXT,
    p_action TEXT,
    p_ip TEXT DEFAULT NULL,
    p_limit_per_hour INTEGER DEFAULT 100
)
RETURNS TABLE(
    allowed BOOLEAN,
    user_count INTEGER,
    ip_count INTEGER,
    hourly_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_count INTEGER := 0;
    v_ip_count INTEGER := 0;
    v_hour_start TIMESTAMP := date_trunc('hour', NOW());
    v_hour_end TIMESTAMP := v_hour_start + INTERVAL '1 hour';
BEGIN
    -- Compter les requêtes utilisateur dans la dernière heure
    -- Conversion TEXT -> UUID pour la comparaison
    SELECT COUNT(*)
    INTO v_user_count
    FROM quota_tracking_journal
    WHERE user_id = p_user_id::UUID
      AND action = p_action
      AND created_at >= v_hour_start
      AND created_at < v_hour_end;
    
    -- Compter les requêtes IP dans la dernière heure (si IP fournie)
    IF p_ip IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_ip_count
        FROM quota_tracking_journal
        WHERE metadata->>'ip' = p_ip
          AND action = p_action
          AND created_at >= v_hour_start
          AND created_at < v_hour_end;
    END IF;
    
    -- Retourner le résultat
    RETURN QUERY SELECT 
        (v_user_count < p_limit_per_hour) AS allowed,
        v_user_count AS user_count,
        v_ip_count AS ip_count,
        p_limit_per_hour AS hourly_limit;
END;
$$;

-- Fonction pour consommer les crédits (corrigée UUID)
CREATE OR REPLACE FUNCTION public.consume_quota_credits(
    p_user_id TEXT,
    p_action TEXT,
    p_credits INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
    success BOOLEAN,
    creditsConsumed INTEGER,
    remainingCredits INTEGER,
    totalConsumed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quota RECORD;
    v_new_total INTEGER;
    v_new_action_count INTEGER;
    v_hourly_limit INTEGER;
    v_success BOOLEAN := FALSE;
BEGIN
    -- Récupérer les limites selon l'action (mode test)
    v_hourly_limit := CASE p_action
        WHEN 'conversation_created' THEN 3
        WHEN 'poll_created' THEN 3
        WHEN 'ai_message' THEN 5
        WHEN 'analytics_query' THEN 5
        WHEN 'simulation' THEN 2
        ELSE 3
    END;
    
    -- Vérifier le rate limiting
    SELECT * INTO v_quota 
    FROM public.can_consume_rate_limit(p_user_id, p_action, NULL, v_hourly_limit)
    LIMIT 1;
    
    IF NOT v_quota.allowed THEN
        RETURN QUERY SELECT FALSE, 0, 0, 0;
        RETURN;
    END IF;
    
    -- Récupérer ou créer le quota tracking
    -- Conversion TEXT -> UUID pour la comparaison
    SELECT * INTO v_quota
    FROM quota_tracking
    WHERE user_id = p_user_id::UUID
    FOR UPDATE;
    
    IF NOT FOUND THEN
        INSERT INTO quota_tracking (
            user_id,
            total_credits_consumed,
            conversations_created,
            polls_created,
            ai_messages,
            analytics_queries,
            simulations
        ) VALUES (
            p_user_id::UUID,
            0, 0, 0, 0, 0, 0
        )
        RETURNING * INTO v_quota;
    END IF;
    
    -- Mettre à jour les compteurs
    v_new_total := v_quota.total_credits_consumed + p_credits;
    
    CASE p_action
        WHEN 'conversation_created' THEN
            v_new_action_count := v_quota.conversations_created + p_credits;
            UPDATE quota_tracking SET 
                total_credits_consumed = v_new_total,
                conversations_created = v_new_action_count
            WHERE user_id = p_user_id::UUID;
        WHEN 'poll_created' THEN
            v_new_action_count := v_quota.polls_created + p_credits;
            UPDATE quota_tracking SET 
                total_credits_consumed = v_new_total,
                polls_created = v_new_action_count
            WHERE user_id = p_user_id::UUID;
        WHEN 'ai_message' THEN
            v_new_action_count := v_quota.ai_messages + p_credits;
            UPDATE quota_tracking SET 
                total_credits_consumed = v_new_total,
                ai_messages = v_new_action_count
            WHERE user_id = p_user_id::UUID;
        WHEN 'analytics_query' THEN
            v_new_action_count := v_quota.analytics_queries + p_credits;
            UPDATE quota_tracking SET 
                total_credits_consumed = v_new_total,
                analytics_queries = v_new_action_count
            WHERE user_id = p_user_id::UUID;
        WHEN 'simulation' THEN
            v_new_action_count := v_quota.simulations + p_credits;
            UPDATE quota_tracking SET 
                total_credits_consumed = v_new_total,
                simulations = v_new_action_count
            WHERE user_id = p_user_id::UUID;
        ELSE
            UPDATE quota_tracking SET 
                total_credits_consumed = v_new_total
            WHERE user_id = p_user_id::UUID;
    END CASE;
    
    -- Ajouter l'entrée dans le journal
    INSERT INTO quota_tracking_journal (
        user_id,
        action,
        credits,
        metadata
    ) VALUES (
        p_user_id::UUID,
        p_action,
        p_credits,
        p_metadata
    );
    
    -- Retourner le succès
    RETURN QUERY SELECT 
        TRUE AS success,
        p_credits AS creditsConsumed,
        (v_hourly_limit - v_quota.user_count - 1) AS remainingCredits,
        v_new_total AS totalConsumed;
END;
$$;

-- Fonction pour s'assurer que le quota tracking existe (corrigée UUID)
CREATE OR REPLACE FUNCTION public.ensure_quota_tracking_exists(
    p_user_id TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    userId TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO quota_tracking (
        user_id,
        total_credits_consumed,
        conversations_created,
        polls_created,
        ai_messages,
        analytics_queries,
        simulations
    ) VALUES (
        p_user_id::UUID,
        0, 0, 0, 0, 0, 0
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN QUERY SELECT TRUE, p_user_id;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.can_consume_rate_limit TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.consume_quota_credits TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_quota_tracking_exists TO authenticated, anon, service_role;

COMMIT;
