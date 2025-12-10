-- Final working version of consume_quota_credits function
-- Returns JSONB to avoid RETURN QUERY syntax issues
-- Handles quota tracking, counter updates, and journal entries

DROP FUNCTION IF EXISTS public.consume_quota_credits(p_user_id TEXT, p_action TEXT, p_credits INTEGER, p_metadata JSONB);

CREATE OR REPLACE FUNCTION public.consume_quota_credits(
    p_user_id TEXT,
    p_action TEXT,
    p_credits INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
