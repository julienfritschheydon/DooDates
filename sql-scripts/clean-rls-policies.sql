-- Clean RLS policies for DooDates database
-- This script removes ALL existing policies before recreating them

-- ===========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ===========================================

-- Drop all existing policies for polls table
DROP POLICY IF EXISTS "Creator can manage own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
DROP POLICY IF EXISTS "Users can insert own polls" ON polls;
DROP POLICY IF EXISTS "Users can select own polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;

-- Drop all existing policies for poll_options table
DROP POLICY IF EXISTS "Poll options follow poll access" ON poll_options;
DROP POLICY IF EXISTS "Creator can manage poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can insert poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can select poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can update poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can delete poll options for own polls" ON poll_options;

-- Drop all existing policies for votes table (if any)
DROP POLICY IF EXISTS "Users can vote on active polls" ON votes;
DROP POLICY IF EXISTS "Users can view votes on accessible polls" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;

-- ===========================================
-- STEP 2: CREATE NEW CLEAN POLICIES
-- ===========================================

-- POLLS TABLE POLICIES
-- Allow creators to insert their own polls
CREATE POLICY "Users can insert own polls" ON polls 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Allow creators to select their own polls
CREATE POLICY "Users can select own polls" ON polls 
  FOR SELECT USING (auth.uid() = creator_id);

-- Allow creators to update their own polls
CREATE POLICY "Users can update own polls" ON polls 
  FOR UPDATE USING (auth.uid() = creator_id);

-- Allow creators to delete their own polls
CREATE POLICY "Users can delete own polls" ON polls 
  FOR DELETE USING (auth.uid() = creator_id);

-- Allow anyone to view active polls (for public access)
CREATE POLICY "Anyone can view active polls" ON polls 
  FOR SELECT USING (status = 'active');

-- POLL_OPTIONS TABLE POLICIES
-- Allow inserting poll options if user owns the poll
CREATE POLICY "Users can insert poll options for own polls" ON poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- Allow selecting poll options if user owns the poll or poll is active
CREATE POLICY "Users can select poll options" ON poll_options 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (polls.creator_id = auth.uid() OR polls.status = 'active')
    )
  );

-- Allow updating poll options if user owns the poll
CREATE POLICY "Users can update poll options for own polls" ON poll_options 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- Allow deleting poll options if user owns the poll
CREATE POLICY "Users can delete poll options for own polls" ON poll_options 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- VOTES TABLE POLICIES (if table exists)
-- Allow anyone to vote on active polls
CREATE POLICY "Users can vote on active polls" ON votes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.status = 'active'
    )
  );

-- Allow viewing votes if user owns the poll or poll is active
CREATE POLICY "Users can view votes on accessible polls" ON votes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (polls.creator_id = auth.uid() OR polls.status = 'active')
    )
  );

-- Allow users to update their own votes
CREATE POLICY "Users can update own votes" ON votes 
  FOR UPDATE USING (voter_id = auth.uid());

-- Allow users to delete their own votes
CREATE POLICY "Users can delete own votes" ON votes 
  FOR DELETE USING (voter_id = auth.uid());

-- ===========================================
-- STEP 3: ENSURE RLS IS ENABLED
-- ===========================================

-- Ensure RLS is enabled on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- Enable RLS on votes table if it exists
-- (This will fail silently if the table doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'votes') THEN
        ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===========================================
-- VERIFICATION
-- ===========================================

-- List all policies to verify they were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('polls', 'poll_options', 'votes')
ORDER BY tablename, policyname; 