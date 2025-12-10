-- Fix RLS policies for guest_quotas table
-- This will allow admin users to read all guest quota data

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'guest_quotas';

-- 2. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'guest_quotas';

-- 3. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own guest quotas" ON guest_quotas;
DROP POLICY IF EXISTS "Users can insert own guest quotas" ON guest_quotas;
DROP POLICY IF EXISTS "Users can update own guest quotas" ON guest_quotas;

-- 4. Create admin policy to allow all operations for admin users
CREATE POLICY "Admins can view all guest quotas" ON guest_quotas
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'julien.fritsch@gmail.com' OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- 5. Create insert policy for system (guest quota tracking)
CREATE POLICY "System can insert guest quotas" ON guest_quotas
    FOR INSERT WITH CHECK (true);

-- 6. Create update policy for system
CREATE POLICY "System can update guest quotas" ON guest_quotas
    FOR UPDATE USING (true);

-- 7. Enable RLS if not already enabled
ALTER TABLE guest_quotas ENABLE ROW LEVEL SECURITY;

-- 8. Test the policies by checking data count
SELECT COUNT(*) as total_records FROM guest_quotas;

-- 9. Show sample data to verify access
SELECT fingerprint, total_credits_consumed, last_activity_at 
FROM guest_quotas 
ORDER BY total_credits_consumed DESC 
LIMIT 5;
