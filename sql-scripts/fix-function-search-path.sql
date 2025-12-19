-- ============================================================================
-- Fix Function Search Path Security Issue
-- Description: Adds SET search_path = public to all SECURITY DEFINER functions
--              to prevent search_path manipulation attacks
-- ============================================================================

-- Fix can_consume_rate_limit (TEXT, TEXT, INTEGER) signature
CREATE OR REPLACE FUNCTION public.can_consume_rate_limit(
    p_user_id TEXT,
    p_action TEXT,
    p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_count INTEGER;
    v_user_id UUID;
BEGIN
    -- Convert text to UUID
    v_user_id := p_user_id::UUID;
    
    -- Get current count based on action
    CASE p_action
        WHEN 'conversation_created' THEN 
            SELECT conversations_created INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'ai_message' THEN 
            SELECT ai_messages INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'poll_created' THEN 
            SELECT polls_created INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'date_poll_created' THEN 
            SELECT date_polls_created INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'form_poll_created' THEN 
            SELECT form_polls_created INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'quizz_created' THEN 
            SELECT quizz_created INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'availability_poll_created' THEN 
            SELECT availability_polls_created INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'analytics_query' THEN 
            SELECT analytics_queries INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        WHEN 'simulation' THEN 
            SELECT simulations INTO v_current_count FROM quota_tracking WHERE user_id = v_user_id;
        ELSE 
            v_current_count := 0;
    END CASE;
    
    -- If no record found, allow consumption
    IF v_current_count IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if under limit
    RETURN v_current_count < p_limit;
    
EXCEPTION WHEN OTHERS THEN
    -- On any error, allow consumption for testing
    RETURN true;
END;
$$;

-- Fix can_consume_rate_limit (TEXT, TEXT, TEXT, INTEGER) signature
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

-- Fix ensure_quota_tracking_exists (TEXT) signature
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

-- Fix consume_quota_credits (TEXT, TEXT, INTEGER, JSONB) signature
CREATE OR REPLACE FUNCTION public.consume_quota_credits(
    p_user_id TEXT,
    p_action TEXT,
    p_credits INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quota RECORD;
BEGIN
    -- Get or create quota record
    SELECT * INTO v_quota FROM public.quota_tracking 
    WHERE user_id = p_user_id::UUID;
    
    IF NOT FOUND THEN
        INSERT INTO public.quota_tracking (
            user_id, conversations_created, polls_created, ai_messages,
            analytics_queries, simulations, total_credits_consumed,
            date_polls_created, form_polls_created, quizz_created, availability_polls_created
        ) VALUES (
            p_user_id::UUID, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ) RETURNING * INTO v_quota;
    END IF;
    
    -- Update the appropriate counter
    CASE p_action
        WHEN 'ai_message' THEN 
            UPDATE public.quota_tracking SET ai_messages = ai_messages + p_credits, total_credits_consumed = total_credits_consumed + p_credits WHERE user_id = p_user_id::UUID;
        WHEN 'conversation_created' THEN 
            UPDATE public.quota_tracking SET conversations_created = conversations_created + p_credits, total_credits_consumed = total_credits_consumed + p_credits WHERE user_id = p_user_id::UUID;
        WHEN 'poll_created' THEN 
            UPDATE public.quota_tracking SET polls_created = polls_created + p_credits, total_credits_consumed = total_credits_consumed + p_credits WHERE user_id = p_user_id::UUID;
        ELSE 
            UPDATE public.quota_tracking SET total_credits_consumed = total_credits_consumed + p_credits WHERE user_id = p_user_id::UUID;
    END CASE;
    
    -- Get updated quota
    SELECT * INTO v_quota FROM public.quota_tracking WHERE user_id = p_user_id::UUID;
    
    -- Insert journal entry
    INSERT INTO public.quota_tracking_journal (
        quota_tracking_id, user_id, action, credits, metadata
    ) VALUES (
        v_quota.id, p_user_id::UUID, p_action, p_credits, p_metadata
    );
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'error', null,
        'creditsConsumed', p_credits,
        'remainingCredits', 50 - v_quota.total_credits_consumed,
        'totalConsumed', v_quota.total_credits_consumed,
        'quota', to_jsonb(v_quota)
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Note: The UUID versions of these functions in create-quota-tracking-table.sql
-- already have SET search_path = public, so they don't need to be fixed here.

COMMENT ON FUNCTION public.can_consume_rate_limit(TEXT, TEXT, INTEGER) IS 'Fixed: Added SET search_path = public for security';
COMMENT ON FUNCTION public.can_consume_rate_limit(TEXT, TEXT, TEXT, INTEGER) IS 'Fixed: Added SET search_path = public for security';
COMMENT ON FUNCTION public.ensure_quota_tracking_exists(TEXT) IS 'Fixed: Added SET search_path = public for security';
COMMENT ON FUNCTION public.consume_quota_credits(TEXT, TEXT, INTEGER, JSONB) IS 'Fixed: Added SET search_path = public for security';

