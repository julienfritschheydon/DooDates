-- Migration: Optimize Slow Queries
-- This migration addresses performance issues identified in slow query analysis:
-- 1. Conversations queries with user_id + poll_data filters
-- 2. Conversations queries with user_id + updated_at ordering
-- 3. Missing composite indexes for common query patterns

-- ============================================================================
-- OPTIMIZATION 1: Composite index for user_id + poll_data IS NOT NULL queries
-- ============================================================================
-- Query pattern: WHERE user_id = $1 AND poll_data IS NOT NULL
-- Current: 33,861 calls, 0.9ms mean (good but can be better with composite index)
-- Impact: Query #3 in slow queries (12.8% of total time)

-- Drop existing partial index if it exists (we'll create a better one)
DROP INDEX IF EXISTS idx_conversations_user_polls;

-- Create optimized composite index for user_id + poll_data queries
-- This index covers the exact query pattern: user_id = X AND poll_data IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_conversations_user_poll_data 
  ON conversations(user_id, updated_at DESC) 
  WHERE poll_data IS NOT NULL;

-- ============================================================================
-- OPTIMIZATION 2: Composite index for user_id + updated_at DESC queries
-- ============================================================================
-- Query pattern: WHERE user_id = $1 ORDER BY updated_at DESC
-- Current: 4,137 calls, 3ms mean
-- Impact: Query #4 in slow queries (5.2% of total time)

-- Create composite index for user conversations ordered by updated_at
-- This covers the common pattern: get user's conversations ordered by most recent
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated_at 
  ON conversations(user_id, updated_at DESC) 
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- OPTIMIZATION 3: Index for poll_data IS NOT NULL filter (if not exists)
-- ============================================================================
-- This helps with queries that filter by poll_data existence
-- Note: GIN index on poll_data already exists, but this helps with IS NOT NULL checks

-- Ensure we have a partial index for poll_data existence
CREATE INDEX IF NOT EXISTS idx_conversations_has_poll_data 
  ON conversations(id) 
  WHERE poll_data IS NOT NULL;

-- ============================================================================
-- OPTIMIZATION 4: Analyze tables to update statistics
-- ============================================================================
-- Update query planner statistics for better index usage

ANALYZE conversations;

-- ============================================================================
-- NOTES ON OTHER SLOW QUERIES
-- ============================================================================

-- Query #1 (25.3%): Dashboard pg_proc query
--   - This is a Supabase dashboard system query
--   - Already has 100% cache hit rate
--   - No action needed - system query

-- Query #2 (19.7%): pg_timezone_names
--   - This is a PostgreSQL system catalog query
--   - 0% cache hit rate indicates it's being called from different contexts
--   - Likely called by Supabase dashboard or system functions
--   - Cannot be optimized directly, but monitoring recommended
--   - If called from application, consider caching timezone list client-side

-- Query #9 (2.9%): consume_ai_credit function
--   - Function call performance is acceptable (2.4ms mean)
--   - Consider reviewing function implementation if it becomes slower

-- Query #17 (1.0%): consume_quota_credits function  
--   - Function call performance acceptable (11.4ms mean)
--   - Monitor for degradation

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================

-- Test query #3 optimization:
-- EXPLAIN ANALYZE
-- SELECT * FROM conversations 
-- WHERE user_id = 'some-uuid' AND poll_data IS NOT NULL
-- LIMIT 10 OFFSET 0;

-- Test query #4 optimization:
-- EXPLAIN ANALYZE
-- SELECT * FROM conversations 
-- WHERE user_id = 'some-uuid'
-- ORDER BY updated_at DESC
-- LIMIT 10 OFFSET 0;

