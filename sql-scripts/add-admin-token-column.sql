-- Add admin_token column for anonymous poll management
-- This allows anonymous users to manage their polls via a secret token

-- Add admin_token column to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS admin_token TEXT;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_polls_admin_token 
ON polls(admin_token) 
WHERE admin_token IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN polls.admin_token IS 'Secret token for managing anonymous polls. NULL for authenticated user polls.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' 
AND column_name = 'admin_token'; 