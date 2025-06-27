-- Fix creator_id column to allow NULL values for anonymous polls
-- This removes the NOT NULL constraint from creator_id

-- Remove NOT NULL constraint from creator_id
ALTER TABLE polls 
ALTER COLUMN creator_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN polls.creator_id IS 'User ID of poll creator. NULL for anonymous polls.';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' 
AND column_name = 'creator_id'; 