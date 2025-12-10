-- Detailed investigation of high usage users
-- Get comprehensive data about users with high credit consumption

-- 1. Get full details of high usage users (>50 credits)
SELECT 
    fingerprint,
    conversations_created,
    polls_created,
    date_polls_created,
    form_polls_created,
    quizz_created,
    availability_polls_created,
    ai_messages,
    analytics_queries,
    simulations,
    total_credits_consumed,
    first_seen_at,
    last_activity_at,
    last_reset_at,
    -- Calculate usage patterns
    ROUND(total_credits_consumed::numeric / GREATEST(EXTRACT(EPOCH FROM (last_activity_at - first_seen_at))/3600, 1), 2) as credits_per_hour,
    CASE 
        WHEN total_credits_consumed > 150 THEN 'CRITICAL - Possible Abuse'
        WHEN total_credits_consumed > 100 THEN 'VERY HIGH - Investigate'
        WHEN total_credits_consumed > 50 THEN 'HIGH - Monitor'
        ELSE 'Normal'
    END as risk_level
FROM guest_quotas 
WHERE total_credits_consumed > 50
ORDER BY total_credits_consumed DESC;

-- 2. Check if these fingerprints appear in other tables (conversations, polls, etc.)
-- Note: You'll need to adapt table names based on your actual schema

-- 3. Activity pattern analysis - users active in last 24 hours
SELECT 
    fingerprint,
    total_credits_consumed,
    last_activity_at,
    EXTRACT(EPOCH FROM (NOW() - last_activity_at))/3600 as hours_since_last_activity,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - last_activity_at))/3600 < 1 THEN 'Currently Active'
        WHEN EXTRACT(EPOCH FROM (NOW() - last_activity_at))/3600 < 24 THEN 'Recent Activity'
        ELSE 'Inactive'
    END as activity_status
FROM guest_quotas 
WHERE total_credits_consumed > 50
ORDER BY last_activity_at DESC;

-- 4. Credit consumption breakdown by type
SELECT 
    fingerprint,
    total_credits_consumed,
    -- Estimate credits by activity (assuming 1 credit per conversation, 2 per poll, 1 per AI message, etc.)
    conversations_created as estimated_conversation_credits,
    polls_created * 2 as estimated_poll_credits,
    ai_messages as estimated_ai_credits,
    analytics_queries as estimated_analytics_credits,
    simulations * 3 as estimated_simulation_credits,
    -- Total estimated vs actual
    (conversations_created + (polls_created * 2) + ai_messages + analytics_queries + (simulations * 3)) as estimated_total_credits
FROM guest_quotas 
WHERE total_credits_consumed > 50
ORDER BY total_credits_consumed DESC;
