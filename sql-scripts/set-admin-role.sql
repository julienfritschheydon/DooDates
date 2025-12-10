-- Set admin role for julien.fritsch@gmail.com
-- This will give access to the admin quota dashboard

UPDATE profiles 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'julien.fritsch@gmail.com';

-- Verify the update
SELECT email, preferences->>'role' as role FROM profiles WHERE email = 'julien.fritsch@gmail.com';

-- Alternative: If the above doesn't work, try this more direct approach
UPDATE profiles 
SET preferences = '{"role": "admin"}'
WHERE email = 'julien.fritsch@gmail.com' AND preferences IS NULL;

-- Show all users with their roles for reference
SELECT email, preferences->>'role' as role, created_at 
FROM profiles 
ORDER BY created_at DESC;
