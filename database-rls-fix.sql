-- Fix RLS policies for DooDates database
-- This script fixes the Row Level Security policies that are preventing poll creation

-- Drop existing policies for polls table
DROP POLICY IF EXISTS "Creator can manage own polls" ON polls;
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;

-- Create proper RLS policies for polls table
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

-- Ensure RLS is enabled
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Fix poll_options policies as well (they should follow the same pattern)
DROP POLICY IF EXISTS "Poll options follow poll access" ON poll_options;
DROP POLICY IF EXISTS "Creator can manage poll options" ON poll_options;

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

-- Ensure RLS is enabled for poll_options
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- Note: Profile creation is handled automatically by database triggers
-- when users sign up through Supabase Auth

-- Verify that RLS is working correctly
-- You can test this by trying to create a poll after running this script 