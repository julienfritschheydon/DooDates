-- FORCE CLEAN ALL RLS POLICIES
-- This script aggressively removes ALL possible policies before recreating them

-- ===========================================
-- STEP 1: GET ALL EXISTING POLICIES AND DROP THEM
-- ===========================================

-- Drop every possible policy name that might exist for polls
DROP POLICY IF EXISTS "Creator can manage own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
DROP POLICY IF EXISTS "Users can insert own polls" ON polls;
DROP POLICY IF EXISTS "Users can select own polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;
DROP POLICY IF EXISTS "Authenticated users can insert polls" ON polls;
DROP POLICY IF EXISTS "Poll creators can manage polls" ON polls;
DROP POLICY IF EXISTS "Public can view active polls" ON polls;

-- Drop every possible policy name that might exist for poll_options
DROP POLICY IF EXISTS "Poll options follow poll access" ON poll_options;
DROP POLICY IF EXISTS "Creator can manage poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can insert poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can select poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can update poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can delete poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Poll option access" ON poll_options;
DROP POLICY IF EXISTS "Authenticated users can manage poll options" ON poll_options;

-- Drop every possible policy name that might exist for votes
DROP POLICY IF EXISTS "Users can vote on active polls" ON votes;
DROP POLICY IF EXISTS "Users can view votes on accessible polls" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
DROP POLICY IF EXISTS "Vote access policy" ON votes;
DROP POLICY IF EXISTS "Public voting access" ON votes;

-- ===========================================
-- STEP 2: DISABLE RLS TEMPORARILY
-- ===========================================

-- Disable RLS to ensure clean slate
ALTER TABLE polls DISABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options DISABLE ROW LEVEL SECURITY;

-- Try to disable RLS on votes table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'votes') THEN
        ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===========================================
-- STEP 3: RE-ENABLE RLS AND CREATE NEW POLICIES
-- ===========================================

-- Re-enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- POLLS TABLE POLICIES
CREATE POLICY "polls_insert_own" ON polls 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "polls_select_own" ON polls 
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "polls_update_own" ON polls 
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "polls_delete_own" ON polls 
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "polls_view_active" ON polls 
  FOR SELECT USING (status = 'active');

-- POLL_OPTIONS TABLE POLICIES
CREATE POLICY "poll_options_insert_own" ON poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

CREATE POLICY "poll_options_select" ON poll_options 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND (polls.creator_id = auth.uid() OR polls.status = 'active')
    )
  );

CREATE POLICY "poll_options_update_own" ON poll_options 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

CREATE POLICY "poll_options_delete_own" ON poll_options 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- VOTES TABLE POLICIES (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'votes') THEN
        ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "votes_insert_active" ON votes 
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM polls 
              WHERE polls.id = poll_id 
              AND polls.status = 'active'
            )
          );

        CREATE POLICY "votes_select" ON votes 
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM polls 
              WHERE polls.id = poll_id 
              AND (polls.creator_id = auth.uid() OR polls.status = 'active')
            )
          );

        CREATE POLICY "votes_update_own" ON votes 
          FOR UPDATE USING (voter_id = auth.uid());

        CREATE POLICY "votes_delete_own" ON votes 
          FOR DELETE USING (voter_id = auth.uid());
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