-- Add is_favorite column to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Update RLS policies if necessary (though existing ones should cover update)
-- The existing "polls_update_own" policy allows creators to update their own polls, which covers this new column.
