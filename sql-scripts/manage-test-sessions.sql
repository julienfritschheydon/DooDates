-- Manage test sessions in guest_quotas table
-- This script helps identify, organize, and optionally clean up test sessions

-- 1. Identify all test sessions with patterns
SELECT 
    fingerprint,
    total_credits_consumed,
    conversations_created,
    polls_created,
    ai_messages,
    last_activity_at,
    CASE 
        WHEN fingerprint LIKE 'guest_suspicious_%' THEN '🧪 Suspicious Test'
        WHEN fingerprint LIKE 'guest_active_%' THEN '🏃 Active Test' 
        WHEN fingerprint LIKE 'guest_test_%' THEN '🧪 Explicit Test'
        WHEN fingerprint LIKE 'guest_demo_%' THEN '🎭 Demo Test'
        WHEN fingerprint LIKE 'guest_dev_%' THEN '💻 Dev Test'
        WHEN fingerprint LIKE 'guest_high_usage_%' THEN '📈 High Usage Test'
        WHEN fingerprint LIKE 'guest_medium_%' THEN '📊 Medium Test'
        WHEN fingerprint LIKE 'guest_normal_%' THEN '👤 Normal Test'
        WHEN fingerprint LIKE 'guest_low_%' THEN '📉 Low Test'
        ELSE '❓ Unknown Pattern'
    END as test_type,
    'TEST_SESSION' as category
FROM guest_quotas 
WHERE fingerprint LIKE 'guest_%' AND (
    fingerprint LIKE 'guest_suspicious_%' OR
    fingerprint LIKE 'guest_active_%' OR
    fingerprint LIKE 'guest_test_%' OR
    fingerprint LIKE 'guest_demo_%' OR
    fingerprint LIKE 'guest_dev_%' OR
    fingerprint LIKE 'guest_high_usage_%' OR
    fingerprint LIKE 'guest_medium_%' OR
    fingerprint LIKE 'guest_normal_%' OR
    fingerprint LIKE 'guest_low_%'
)
ORDER BY total_credits_consumed DESC;

-- 2. Show real users (non-test sessions)
SELECT 
    fingerprint,
    total_credits_consumed,
    conversations_created,
    polls_created,
    ai_messages,
    last_activity_at,
    'REAL_USER' as category
FROM guest_quotas 
WHERE NOT (
    fingerprint LIKE 'guest_suspicious_%' OR
    fingerprint LIKE 'guest_active_%' OR
    fingerprint LIKE 'guest_test_%' OR
    fingerprint LIKE 'guest_demo_%' OR
    fingerprint LIKE 'guest_dev_%' OR
    fingerprint LIKE 'guest_high_usage_%' OR
    fingerprint LIKE 'guest_medium_%' OR
    fingerprint LIKE 'guest_normal_%' OR
    fingerprint LIKE 'guest_low_%'
)
ORDER BY total_credits_consumed DESC;

-- 3. Summary statistics
SELECT 
    'Test Sessions' as category,
    COUNT(*) as count,
    SUM(total_credits_consumed) as total_credits,
    ROUND(AVG(total_credits_consumed), 2) as avg_credits
FROM guest_quotas 
WHERE fingerprint LIKE 'guest_%' AND (
    fingerprint LIKE 'guest_suspicious_%' OR
    fingerprint LIKE 'guest_active_%' OR
    fingerprint LIKE 'guest_test_%' OR
    fingerprint LIKE 'guest_demo_%' OR
    fingerprint LIKE 'guest_dev_%' OR
    fingerprint LIKE 'guest_high_usage_%' OR
    fingerprint LIKE 'guest_medium_%' OR
    fingerprint LIKE 'guest_normal_%' OR
    fingerprint LIKE 'guest_low_%'
)

UNION ALL

SELECT 
    'Real Users' as category,
    COUNT(*) as count,
    SUM(total_credits_consumed) as total_credits,
    ROUND(AVG(total_credits_consumed), 2) as avg_credits
FROM guest_quotas 
WHERE NOT (
    fingerprint LIKE 'guest_suspicious_%' OR
    fingerprint LIKE 'guest_active_%' OR
    fingerprint LIKE 'guest_test_%' OR
    fingerprint LIKE 'guest_demo_%' OR
    fingerprint LIKE 'guest_dev_%' OR
    fingerprint LIKE 'guest_high_usage_%' OR
    fingerprint LIKE 'guest_medium_%' OR
    fingerprint LIKE 'guest_normal_%' OR
    fingerprint LIKE 'guest_low_%'
);

-- 4. OPTIONAL: Clean up test sessions (UNCOMMENT TO RUN)
-- WARNING: This will permanently delete test session data!
-- DELETE FROM guest_quotas 
-- WHERE fingerprint LIKE 'guest_%' AND (
--     fingerprint LIKE 'guest_suspicious_%' OR
--     fingerprint LIKE 'guest_active_%' OR
--     fingerprint LIKE 'guest_test_%' OR
--     fingerprint LIKE 'guest_demo_%' OR
--     fingerprint LIKE 'guest_dev_%' OR
--     fingerprint LIKE 'guest_high_usage_%' OR
--     fingerprint LIKE 'guest_medium_%' OR
--     fingerprint LIKE 'guest_normal_%' OR
--     fingerprint LIKE 'guest_low_%'
-- );

-- 5. OPTIONAL: Mark test sessions with a flag (alternative to deletion)
-- UPDATE guest_quotas 
-- SET fingerprint = fingerprint || '_TEST'
-- WHERE fingerprint LIKE 'guest_%' AND (
--     fingerprint LIKE 'guest_suspicious_%' OR
--     fingerprint LIKE 'guest_active_%' OR
--     fingerprint LIKE 'guest_test_%' OR
--     fingerprint LIKE 'guest_demo_%' OR
--     fingerprint LIKE 'guest_dev_%' OR
--     fingerprint LIKE 'guest_high_usage_%' OR
--     fingerprint LIKE 'guest_medium_%' OR
--     fingerprint LIKE 'guest_normal_%' OR
--     fingerprint LIKE 'guest_low_%'
-- );
