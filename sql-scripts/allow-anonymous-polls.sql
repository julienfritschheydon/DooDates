-- Allow Anonymous Polls for DooDates
-- This script allows creating polls without authentication (like Doodle/Framadate)

-- ===========================================
-- POLLS TABLE - Allow anonymous creation
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "polls_insert_own" ON polls;
DROP POLICY IF EXISTS "polls_select_own" ON polls;

-- Allow anyone to create polls (anonymous or authenticated)
CREATE POLICY "polls_insert_anonymous" ON polls 
  FOR INSERT WITH CHECK (true);

-- Allow creators to select their own polls (if authenticated)
CREATE POLICY "polls_select_own" ON polls 
  FOR SELECT USING (auth.uid() = creator_id);

-- Allow anyone to view active polls (public access)
CREATE POLICY "polls_view_active" ON polls 
  FOR SELECT USING (status = 'active');

-- Allow creators to update/delete their own polls (if authenticated)
CREATE POLICY "polls_update_own" ON polls 
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "polls_delete_own" ON polls 
  FOR DELETE USING (auth.uid() = creator_id);

-- ===========================================
-- POLL_OPTIONS TABLE - Allow anonymous creation
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "poll_options_insert_own" ON poll_options;

-- Allow inserting poll options for any poll (anonymous or authenticated)
CREATE POLICY "poll_options_insert_anonymous" ON poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id
    )
  );

-- Keep other policies for poll_options unchanged
-- (select, update, delete still require ownership or active status)

-- ===========================================
-- VERIFICATION
-- ===========================================

-- List all policies to verify they were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('polls', 'poll_options')
ORDER BY tablename, policyname; 