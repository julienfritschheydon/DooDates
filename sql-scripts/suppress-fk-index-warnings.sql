-- ============================================================================
-- SUPPRESS FOREIGN KEY INDEX WARNINGS
-- Description: Adds comments to foreign key indexes to document why they're kept
-- Migration: Documentation - helps explain why these indexes appear "unused"
-- ============================================================================
-- 
-- This script adds comments to foreign key indexes that may appear unused
-- but are required for referential integrity operations. These comments
-- help document the indexes and can be used to suppress linter warnings
-- if Supabase adds support for comment-based suppression.
-- ============================================================================

-- ============================================================================
-- ANALYTICS_EVENTS TABLE
-- ============================================================================

COMMENT ON INDEX idx_analytics_events_user_id_fkey IS 
'Foreign key index for analytics_events_user_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

-- ============================================================================
-- BETA_KEYS TABLE
-- ============================================================================

COMMENT ON INDEX idx_beta_keys_created_by_fkey IS 
'Foreign key index for beta_keys_created_by_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

COMMENT ON INDEX idx_conversations_poll_id_fkey IS 
'Foreign key index for conversations_poll_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

COMMENT ON INDEX idx_conversations_related_poll_id_fkey IS 
'Foreign key index for conversations_related_poll_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

COMMENT ON INDEX idx_messages_user_id_fkey IS 
'Foreign key index for messages_user_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

-- ============================================================================
-- POLL_OPTIONS TABLE
-- ============================================================================

COMMENT ON INDEX idx_poll_options_poll_id_fkey IS 
'Foreign key index for poll_options_poll_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

-- ============================================================================
-- QUOTA_TRACKING_JOURNAL TABLE
-- ============================================================================

COMMENT ON INDEX idx_quota_tracking_journal_quota_tracking_id_fkey IS 
'Foreign key index for quota_tracking_journal_quota_tracking_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

-- ============================================================================
-- VOTES TABLE
-- ============================================================================

COMMENT ON INDEX idx_votes_poll_id_fkey IS 
'Foreign key index for votes_poll_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

COMMENT ON INDEX idx_votes_voter_id_fkey IS 
'Foreign key index for votes_voter_id_fkey. Required for FK constraint checks and cascading operations. Keep even if appears unused.';

