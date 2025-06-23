-- Alternative RLS fix for polls table
-- This is a more permissive approach that should definitely work

-- First, temporarily disable RLS to clear any issues
ALTER TABLE polls DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own polls" ON polls;
DROP POLICY IF EXISTS "Users can select own polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
DROP POLICY IF EXISTS "Creator can manage own polls" ON polls;

-- Re-enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for authenticated users
-- This allows any authenticated user to insert polls
CREATE POLICY "Authenticated users can insert polls" ON polls 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Allow users to see their own polls
CREATE POLICY "Users can view own polls" ON polls 
  FOR SELECT TO authenticated 
  USING (creator_id = auth.uid());

-- Allow users to update their own polls
CREATE POLICY "Users can update own polls" ON polls 
  FOR UPDATE TO authenticated 
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Allow users to delete their own polls
CREATE POLICY "Users can delete own polls" ON polls 
  FOR DELETE TO authenticated 
  USING (creator_id = auth.uid());

-- Allow anyone to view active polls (for public sharing)
CREATE POLICY "Anyone can view active polls" ON polls 
  FOR SELECT TO anon, authenticated 
  USING (status = 'active');

-- Fix poll_options policies as well
DROP POLICY IF EXISTS "Users can insert poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can select poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can update poll options for own polls" ON poll_options;
DROP POLICY IF EXISTS "Users can delete poll options for own polls" ON poll_options;

-- More permissive poll_options policies
CREATE POLICY "Authenticated users can manage poll options" ON poll_options 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- Allow viewing poll options for active polls
CREATE POLICY "Anyone can view poll options for active polls" ON poll_options 
  FOR SELECT TO anon, authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.status = 'active'
    )
  ); 