-- Check if high usage users are your own testing sessions
-- This helps identify if the "suspicious" activity is actually your development work

-- 1. Check if these fingerprints appear in conversations/polls you might have created
-- (Adapt table names based on your actual schema)

-- 2. Check timing patterns - does it match your work hours?
SELECT 
    fingerprint,
    total_credits_consumed,
    first_seen_at,
    last_activity_at,
    -- Check if activity was during business hours (9h-18h, weekdays)
    CASE 
        WHEN EXTRACT(HOUR FROM last_activity_at) BETWEEN 9 AND 18 
        AND EXTRACT(DOW FROM last_activity_at) BETWEEN 1 AND 5 
        THEN '⏰ Business Hours - POSSIBLE TESTING'
        ELSE '🌙 Outside Business Hours - LESS LIKELY TESTING'
    END as timing_analysis,
    -- Check if recent (last few days = likely testing)
    CASE 
        WHEN last_activity_at > NOW() - INTERVAL '7 days' THEN '🆕 Recent - LIKELY TESTING'
        ELSE '📅 Older - POSSIBLE REAL USER'
    END as recency_analysis,
    -- Check creation pattern
    EXTRACT(EPOCH FROM (last_activity_at - first_seen_at))/3600 as activity_duration_hours
FROM guest_quotas 
WHERE fingerprint IN ('guest_suspicious_005', 'guest_active_004')
ORDER BY total_credits_consumed DESC;

-- 3. Check for typical testing patterns
SELECT 
    fingerprint,
    conversations_created,
    polls_created,
    ai_messages,
    simulations,
    -- High AI messages + simulations = typical testing pattern
    CASE 
        WHEN ai_messages > 50 AND simulations > 10 THEN '🧪 TESTING PATTERN - High AI + Sims'
        WHEN ai_messages > 30 THEN '🤖 POSSIBLE BOT - High AI only'
        ELSE '👤 USER PATTERN - Normal usage'
    END as pattern_analysis
FROM guest_quotas 
WHERE fingerprint IN ('guest_suspicious_005', 'guest_active_004')
ORDER BY total_credits_consumed DESC;

-- 4. Quick fingerprint check for common development patterns
SELECT 
    fingerprint,
    CASE 
        WHEN fingerprint LIKE 'guest_test%' THEN '🧪 EXPLICIT TEST USER'
        WHEN fingerprint LIKE 'guest_demo%' THEN '🎭 DEMO USER'
        WHEN fingerprint LIKE 'guest_dev%' THEN '💻 DEV USER'
        WHEN fingerprint LIKE 'guest_suspicious%' OR fingerprint LIKE 'guest_active%' THEN '⚠️ POSSIBLE TESTING (Naming suggests investigation)'
        ELSE '❓ UNKNOWN PATTERN'
    END as naming_pattern
FROM guest_quotas 
WHERE total_credits_consumed > 50
ORDER BY total_credits_consumed DESC;
