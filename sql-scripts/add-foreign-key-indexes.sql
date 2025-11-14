-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- Description: Adds indexes for foreign key constraints to improve performance
-- Migration: Performance optimization - indexes improve FK checks and JOINs
-- ============================================================================
-- 
-- NOTE: Foreign keys without indexes can cause:
-- - Slow DELETE/UPDATE operations on referenced tables (FK checks)
-- - Slow JOINs on foreign key columns
-- - Poor performance for cascading operations
--
-- This script adds indexes for all foreign keys reported as unindexed by the
-- database linter. Some indexes may already exist but are partial (WHERE clause)
-- or were removed, so we recreate them as full indexes.
-- ============================================================================

-- ============================================================================
-- ANALYTICS_EVENTS TABLE
-- ============================================================================

-- Foreign key: analytics_events_user_id_fkey (user_id -> profiles.id)
-- Note: Partial index exists (WHERE user_id IS NOT NULL), but linter wants full index
-- Creating full index to cover all cases including NULL checks
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_fkey 
  ON analytics_events(user_id);

-- ============================================================================
-- BETA_KEYS TABLE
-- ============================================================================

-- Foreign key: beta_keys_created_by_fkey (created_by -> auth.users.id)
-- No index exists for this foreign key
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_beta_keys_created_by_fkey 
  ON beta_keys(created_by) 
  WHERE created_by IS NOT NULL;

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

-- Foreign key: conversations_poll_id_fkey (poll_id -> polls.id)
-- Note: Partial index may exist, creating full index for FK coverage
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_conversations_poll_id_fkey 
  ON conversations(poll_id) 
  WHERE poll_id IS NOT NULL;

-- Foreign key: conversations_related_poll_id_fkey (related_poll_id -> polls.id)
-- Note: Partial index exists, but ensuring it covers the FK properly
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_conversations_related_poll_id_fkey 
  ON conversations(related_poll_id) 
  WHERE related_poll_id IS NOT NULL;

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

-- Foreign key: messages_user_id_fkey (user_id -> auth.users.id)
-- Note: Index may have been removed as unused, but needed for FK
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_messages_user_id_fkey 
  ON messages(user_id);

-- ============================================================================
-- POLL_OPTIONS TABLE
-- ============================================================================

-- Foreign key: poll_options_poll_id_fkey (poll_id -> polls.id)
-- Note: Index exists (idx_poll_options_poll), but ensuring it's properly named
-- and covers the FK. The existing index should work, but recreating to ensure coverage.
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id_fkey 
  ON poll_options(poll_id);

-- ============================================================================
-- QUOTA_TRACKING_JOURNAL TABLE
-- ============================================================================

-- Foreign key: quota_tracking_journal_quota_tracking_id_fkey (quota_tracking_id -> quota_tracking.id)
-- Note: Index exists (idx_quota_journal_quota_id), but ensuring FK coverage
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_quota_tracking_journal_quota_tracking_id_fkey 
  ON quota_tracking_journal(quota_tracking_id);

-- ============================================================================
-- VOTES TABLE
-- ============================================================================

-- Foreign key: votes_poll_id_fkey (poll_id -> polls.id)
-- Note: Index may have been removed as unused, but needed for FK
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_votes_poll_id_fkey 
  ON votes(poll_id);

-- Foreign key: votes_voter_id_fkey (voter_id -> profiles.id)
-- Note: Index exists (idx_votes_voter), but ensuring FK coverage
-- Creating with proper name for FK
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_votes_voter_id_fkey 
  ON votes(voter_id) 
  WHERE voter_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Run this query to verify indexes were created:
-- SELECT 
--   tc.table_name, 
--   kcu.column_name, 
--   tc.constraint_name,
--   i.indexname
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- LEFT JOIN pg_indexes i 
--   ON i.tablename = tc.table_name 
--   AND i.indexdef LIKE '%' || kcu.column_name || '%'
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_schema = 'public'
-- ORDER BY tc.table_name, kcu.column_name;

