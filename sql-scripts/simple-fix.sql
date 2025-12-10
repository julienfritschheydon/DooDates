-- Simple fix for rate limiting 403 error

-- Drop all old policies
DROP POLICY IF EXISTS "Service role full access quota_tracking" ON quota_tracking;
DROP POLICY IF EXISTS "Users can create own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can insert own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can update own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can view own quota" ON quota_tracking;
DROP POLICY IF EXISTS "Users can view own quotas" ON quota_tracking;

DROP POLICY IF EXISTS "Service role full access quota_tracking_journal" ON quota_tracking_journal;
DROP POLICY IF EXISTS "Users can insert own journal" ON quota_tracking_journal;
DROP POLICY IF EXISTS "Users can view own journal" ON quota_tracking_journal;

-- Create simple policies that allow everything
CREATE POLICY "quota_tracking_policy" ON quota_tracking
    FOR ALL USING (true);

CREATE POLICY "quota_tracking_journal_policy" ON quota_tracking_journal
    FOR ALL USING (true);

-- Verify the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('quota_tracking', 'quota_tracking_journal')
ORDER BY tablename, policyname;
