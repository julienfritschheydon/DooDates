-- Migration: Fix Index Performance Issues
-- This migration addresses:
-- 1. unindexed_foreign_keys: Add missing indexes for all foreign keys
-- 2. unused_index: Remove indexes that have never been used (excluding FK indexes)

-- ============================================================================
-- FIX 1: Add missing indexes for foreign keys
-- ============================================================================
-- Foreign keys MUST have indexes for performance, even if they appear "unused"
-- in query statistics. They are used internally by PostgreSQL for:
-- - FK constraint checks during DELETE/UPDATE on referenced tables
-- - Cascading DELETE/UPDATE operations
-- - JOIN performance on foreign key columns
--
-- NOTE: The linter may report FK indexes as "unused" because they're not used
-- in SELECT queries, but they're still critical for referential integrity.

-- country_region_map table
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_country_region_map_region_id_fkey 
  ON country_region_map(region_id);

-- beta_keys table
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_beta_keys_created_by_fkey 
  ON beta_keys(created_by)
  WHERE created_by IS NOT NULL;

-- conversations table
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_conversations_poll_id_fkey 
  ON conversations(poll_id)
  WHERE poll_id IS NOT NULL;

-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_conversations_related_poll_id_fkey 
  ON conversations(related_poll_id)
  WHERE related_poll_id IS NOT NULL;

-- guest_quotas table (if user_id column exists)
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_guest_quotas_user_id_fkey 
  ON guest_quotas(user_id)
  WHERE user_id IS NOT NULL;

-- poll_options table
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id_fkey 
  ON poll_options(poll_id);

-- votes table
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_votes_poll_id_fkey 
  ON votes(poll_id);

-- ============================================================================
-- FIX 2: Remove unused non-FK indexes from guest_quotas
-- ============================================================================

-- These indexes have never been used and slow down INSERT/UPDATE operations
DROP INDEX IF EXISTS idx_guest_quotas_confidence_score;

-- ============================================================================
-- FIX 3: Remove unused indexes from conversations table
-- ============================================================================
-- These indexes have never been used and slow down INSERT/UPDATE operations

DROP INDEX IF EXISTS idx_conversations_has_poll_data;
DROP INDEX IF EXISTS idx_conversations_user_updated_at;

-- ============================================================================
-- FIX 4: Remove unused indexes from performance monitoring tables
-- ============================================================================
-- These indexes were created for performance monitoring but have never been used.
-- They can be recreated later if query patterns change.

-- performance_metrics table
DROP INDEX IF EXISTS idx_performance_metrics_timestamp;
DROP INDEX IF EXISTS idx_performance_metrics_source;
DROP INDEX IF EXISTS idx_performance_metrics_workflow;

-- web_vitals table
DROP INDEX IF EXISTS idx_web_vitals_timestamp;
DROP INDEX IF EXISTS idx_web_vitals_session_id;
DROP INDEX IF EXISTS idx_web_vitals_url;

-- performance_alerts table
DROP INDEX IF EXISTS idx_performance_alerts_severity;
DROP INDEX IF EXISTS idx_performance_alerts_timestamp;

