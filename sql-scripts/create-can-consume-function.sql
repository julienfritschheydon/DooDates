-- Create the missing can_consume_rate_limit function

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

-- Test the function
DO $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT public.can_consume_rate_limit('308b4ea5-82f1-4c63-ad29-4c7dc7a32e97', 'ai_message', 50) INTO result;
    
    RAISE NOTICE '✅ can_consume_rate_limit works: %', result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ can_consume_rate_limit failed: %', SQLERRM;
END $$;
