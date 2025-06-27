-- Clean and Allow Anonymous Polls for DooDates
-- This script removes ALL existing policies and creates new ones for anonymous polls

-- ===========================================
-- STEP 1: CLEAN ALL EXISTING POLICIES
-- ===========================================

-- Drop ALL possible policies for polls
DROP POLICY IF EXISTS "polls_insert_own" ON polls;
DROP POLICY IF EXISTS "polls_select_own" ON polls;
DROP POLICY IF EXISTS "polls_update_own" ON polls;
DROP POLICY IF EXISTS "polls_delete_own" ON polls;
DROP POLICY IF EXISTS "polls_view_active" ON polls;
DROP POLICY IF EXISTS "Users can insert own polls" ON polls;
DROP POLICY IF EXISTS "Users can select own polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;

-- Drop ALL possible policies for poll_options
DROP POLICY IF EXISTS "poll_options_insert_own" ON poll_options;
DROP POLICY IF EXISTS "poll_options_insert_anonymous" ON poll_options;
DROP POLICY IF EXISTS "poll_options_select" ON poll_options;
DROP POLICY IF EXISTS "poll_options_update_own" ON poll_options;
DROP POLICY IF EXISTS "poll_options_delete_own" ON poll_options;
DROP POLICY IF EXISTS "Users can insert poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can select poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can update poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can delete poll options for own polls" ON poll_options;

-- ===========================================
-- STEP 2: CREATE ANONYMOUS-FRIENDLY POLICIES
-- ===========================================

-- POLLS TABLE POLICIES
-- Allow ANYONE to create polls (anonymous or authenticated)
CREATE POLICY "polls_create_anonymous" ON polls 
  FOR INSERT WITH CHECK (true);

-- Allow ANYONE to view active polls (public access)
CREATE POLICY "polls_public_view" ON polls 
  FOR SELECT USING (status = 'active');

-- Allow creators to manage their own polls (if authenticated)
CREATE POLICY "polls_owner_manage" ON polls 
  FOR ALL USING (auth.uid() = creator_id);

-- POLL_OPTIONS TABLE POLICIES
-- Allow ANYONE to create poll options for any existing poll
CREATE POLICY "poll_options_create_anonymous" ON poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id
    )
  );

-- Allow ANYONE to view poll options for active polls
CREATE POLICY "poll_options_public_view" ON poll_options 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.status = 'active'
    )
  );

-- Allow poll creators to manage options (if authenticated)
CREATE POLICY "poll_options_owner_manage" ON poll_options 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- ===========================================
-- STEP 3: ENSURE RLS IS ENABLED
-- ===========================================

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('polls', 'poll_options')
ORDER BY tablename, policyname; 