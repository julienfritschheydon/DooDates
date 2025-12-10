-- Add sample guest quota data for testing the admin dashboard
-- This will create realistic test data to demonstrate the monitoring features

INSERT INTO guest_quotas (
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
  last_reset_at
) VALUES 
-- High usage guest (should trigger alerts)
('guest_high_usage_001', 15, 8, 3, 4, 1, 0, 45, 12, 8, 85, 
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 hours', NULL),

-- Medium usage guest
('guest_medium_002', 8, 4, 2, 1, 1, 0, 22, 6, 3, 42,
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day', NULL),

-- Low usage guest
('guest_low_003', 2, 1, 1, 0, 0, 0, 5, 1, 0, 12,
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days', NULL),

-- Very active recent guest
('guest_active_004', 25, 12, 5, 6, 1, 0, 68, 18, 12, 125,
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 minutes', NULL),

-- Suspicious activity guest (high usage in short time)
('guest_suspicious_005', 40, 20, 8, 10, 2, 0, 95, 25, 15, 180,
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', NULL),

-- Normal usage guests
('guest_normal_006', 5, 2, 1, 1, 0, 0, 12, 3, 1, 25,
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NULL),

('guest_normal_007', 3, 1, 0, 1, 0, 0, 8, 2, 0, 15,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NULL),

('guest_normal_008', 6, 3, 1, 2, 0, 0, 18, 4, 2, 35,
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '6 hours', NULL);

-- Show the inserted data
SELECT 
  fingerprint,
  total_credits_consumed,
  conversations_created,
  polls_created,
  last_activity_at,
  CASE 
    WHEN total_credits_consumed > 50 THEN 'HIGH USAGE'
    WHEN total_credits_consumed > 25 THEN 'MEDIUM USAGE'
    ELSE 'NORMAL USAGE'
  END as usage_category
FROM guest_quotas 
ORDER BY total_credits_consumed DESC;
