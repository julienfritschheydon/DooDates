-- Clean up dummy/sample data from guest_quotas table
-- This removes only the test data we added, keeping real user data

-- Remove sample data (guest_* patterns we created for testing)
DELETE FROM guest_quotas 
WHERE fingerprint LIKE 'guest_%' 
AND fingerprint IN (
    'guest_high_usage_001',
    'guest_medium_002', 
    'guest_normal_003',
    'guest_normal_004',
    'guest_normal_005',
    'guest_normal_006',
    'guest_normal_007',
    'guest_normal_008',
    'guest_low_009',
    'guest_active_010'
);

-- Verify what was removed and what remains
SELECT 
    'Removed sample data - Records remaining:' as status,
    COUNT(*) as count
FROM guest_quotas 
WHERE fingerprint NOT LIKE 'guest_%';

-- Show remaining real data (should be your actual users)
SELECT 
    fingerprint,
    total_credits_consumed,
    conversations_created,
    polls_created,
    last_activity_at,
    CASE 
        WHEN total_credits_consumed > 50 THEN 'HIGH USAGE'
        WHEN total_credits_consumed > 20 THEN 'MEDIUM USAGE' 
        ELSE 'NORMAL USAGE'
    END as usage_category
FROM guest_quotas 
ORDER BY total_credits_consumed DESC;

-- Show summary statistics
SELECT 
    COUNT(*) as total_real_guests,
    SUM(total_credits_consumed) as total_credits,
    COUNT(CASE WHEN total_credits_consumed > 50 THEN 1 END) as high_usage_guests,
    COUNT(CASE WHEN total_credits_consumed > 20 THEN 1 END) as medium_usage_guests,
    MAX(total_credits_consumed) as max_usage,
    AVG(total_credits_consumed) as avg_usage
FROM guest_quotas 
WHERE fingerprint NOT LIKE 'guest_%' OR fingerprint IS NULL;
