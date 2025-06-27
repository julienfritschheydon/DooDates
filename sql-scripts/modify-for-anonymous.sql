-- Modify existing policies to allow anonymous polls
-- Run this AFTER clean-rls-policies.sql

-- ===========================================
-- MODIFY POLLS POLICIES FOR ANONYMOUS ACCESS
-- ===========================================

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own polls" ON polls;

-- Create new anonymous-friendly insert policy
CREATE POLICY "Anyone can create polls" ON polls 
  FOR INSERT WITH CHECK (true);

-- ===========================================
-- MODIFY POLL_OPTIONS POLICIES FOR ANONYMOUS ACCESS
-- ===========================================

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert poll options for own polls" ON poll_options;

-- Create new anonymous-friendly insert policy
CREATE POLICY "Anyone can create poll options" ON poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id
    )
  );

-- ===========================================
-- VERIFICATION
-- ===========================================

-- List all policies to verify they were modified correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('polls', 'poll_options')
AND policyname IN ('Anyone can create polls', 'Anyone can create poll options', 'Anyone can view active polls')
ORDER BY tablename, policyname; 