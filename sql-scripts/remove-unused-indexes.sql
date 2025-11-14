-- ============================================================================
-- REMOVE UNUSED INDEXES
-- Description: Removes indexes that have never been used according to database linter
-- Migration: Performance optimization - removes indexes that slow down writes
-- ============================================================================
-- 
-- NOTE: These indexes are marked as unused by the database linter.
-- Removing them will:
-- - Improve INSERT/UPDATE/DELETE performance
-- - Reduce storage overhead
-- - May slow down queries that filter/sort by these columns (if they exist)
--
-- IMPORTANT: Foreign key indexes are NOT removed even if they appear unused.
-- These indexes are critical for:
-- - Foreign key constraint checks during DELETE/UPDATE on referenced tables
-- - Cascading DELETE/UPDATE operations
-- - JOIN performance on foreign key columns
-- 
-- The linter may report FK indexes as "unused" because they're not used in
-- SELECT queries, but they're still needed for referential integrity operations.
--
-- If you notice query performance degradation after removing these indexes,
-- you may need to recreate specific ones based on actual query patterns.
-- ============================================================================

-- ============================================================================
-- FOREIGN KEY INDEXES - DO NOT REMOVE
-- ============================================================================
-- These indexes are required for foreign key performance, even if they appear
-- unused in query statistics. They are used internally by PostgreSQL for FK
-- constraint checks and cascading operations.
--
-- DO NOT REMOVE:
-- - idx_analytics_events_user_id_fkey (analytics_events_user_id_fkey)
-- - idx_beta_keys_created_by_fkey (beta_keys_created_by_fkey)
-- - idx_conversations_poll_id_fkey (conversations_poll_id_fkey)
-- - idx_conversations_related_poll_id_fkey (conversations_related_poll_id_fkey)
-- - idx_messages_user_id_fkey (messages_user_id_fkey)
-- - idx_poll_options_poll_id_fkey (poll_options_poll_id_fkey)
-- - idx_quota_tracking_journal_quota_tracking_id_fkey (quota_tracking_journal_quota_tracking_id_fkey)
-- - idx_votes_poll_id_fkey (votes_poll_id_fkey)
-- - idx_votes_voter_id_fkey (votes_voter_id_fkey)
-- ============================================================================

-- ============================================================================
-- BETA_KEYS TABLE
-- ============================================================================

-- Index: idx_beta_keys_expires_at
-- Note: expires_at IS used in WHERE clauses (expires_at > NOW(), expires_at <= NOW())
-- Consider monitoring query performance after removal
DROP INDEX IF EXISTS idx_beta_keys_expires_at;

-- NOTE: Keeping idx_beta_keys_created_by_fkey - needed for foreign key
-- (beta_keys_created_by_fkey). May appear unused but required for FK checks.

-- ============================================================================
-- USER_QUOTAS TABLE
-- ============================================================================

-- Index: idx_user_quotas_tier
-- Note: tier IS used in WHERE clauses (tier != 'beta')
-- Consider monitoring query performance after removal
DROP INDEX IF EXISTS idx_user_quotas_tier;

-- Index: idx_user_quotas_reset_date
-- Note: reset_date IS used in WHERE clauses (reset_date <= NOW())
-- Consider monitoring query performance after removal
DROP INDEX IF EXISTS idx_user_quotas_reset_date;

-- ============================================================================
-- VOTES TABLE
-- ============================================================================

-- NOTE: Keeping idx_votes_poll, idx_votes_voter, idx_votes_poll_id_fkey, 
-- and idx_votes_voter_id_fkey - needed for foreign keys
-- (votes_poll_id_fkey and votes_voter_id_fkey)
-- These indexes may appear unused but are required for FK constraint checks
DROP INDEX IF EXISTS idx_votes_email;
DROP INDEX IF EXISTS idx_votes_created_at;

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

-- NOTE: Keeping idx_conversations_poll, idx_conversations_related_poll_id,
-- idx_conversations_poll_id_fkey, and idx_conversations_related_poll_id_fkey
-- - needed for foreign keys (conversations_poll_id_fkey, conversations_related_poll_id_fkey)
-- These indexes may appear unused but are required for FK constraint checks
DROP INDEX IF EXISTS idx_conversations_session;
DROP INDEX IF EXISTS idx_conversations_status;
DROP INDEX IF EXISTS idx_conversations_poll_data;
DROP INDEX IF EXISTS idx_conversations_poll_slug;
DROP INDEX IF EXISTS idx_conversations_poll_type;
DROP INDEX IF EXISTS idx_conversations_poll_status;

-- ============================================================================
-- ANALYTICS_EVENTS TABLE
-- ============================================================================

-- NOTE: Keeping idx_analytics_user and idx_analytics_events_user_id_fkey 
-- - needed for foreign key (analytics_events_user_id_fkey)
-- These indexes may appear unused but are required for FK constraint checks
DROP INDEX IF EXISTS idx_analytics_type;
DROP INDEX IF EXISTS idx_analytics_created_at;
DROP INDEX IF EXISTS idx_analytics_session;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_plan;

-- ============================================================================
-- POLLS TABLE
-- ============================================================================

-- Index: idx_polls_slug
-- Note: slug has a UNIQUE constraint, so this index might be redundant
DROP INDEX IF EXISTS idx_polls_slug;

DROP INDEX IF EXISTS idx_polls_created_at;

-- ============================================================================
-- POLL_OPTIONS TABLE
-- ============================================================================

-- NOTE: Keeping idx_poll_options_poll and idx_poll_options_poll_id_fkey
-- - needed for foreign key (poll_options_poll_id_fkey)
-- These indexes may appear unused but are required for FK constraint checks
DROP INDEX IF EXISTS idx_poll_options_date;
DROP INDEX IF EXISTS idx_poll_options_order;

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

-- NOTE: Keeping idx_messages_user_id and idx_messages_user_id_fkey
-- - needed for foreign key (messages_user_id_fkey)
-- These indexes may appear unused but are required for FK constraint checks
DROP INDEX IF EXISTS idx_messages_created_at;

-- ============================================================================
-- QUOTA_TRACKING TABLE
-- ============================================================================

-- Index: idx_quota_tracking_period
-- Note: period_start/period_end might be used for monthly resets
-- Consider monitoring query performance after removal
DROP INDEX IF EXISTS idx_quota_tracking_period;

-- ============================================================================
-- QUOTA_TRACKING_JOURNAL TABLE
-- ============================================================================

-- NOTE: Keeping idx_quota_journal_quota_id and 
-- idx_quota_tracking_journal_quota_tracking_id_fkey
-- - needed for foreign key (quota_tracking_journal_quota_tracking_id_fkey)
-- These indexes may appear unused but are required for FK constraint checks
DROP INDEX IF EXISTS idx_quota_journal_created_at;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Run this query to verify indexes were removed:
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

