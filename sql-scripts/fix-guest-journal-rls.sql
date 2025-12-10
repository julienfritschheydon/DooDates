-- Enable RLS on guest_quota_journal if not already enabled
ALTER TABLE guest_quota_journal ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view all journal entries
CREATE POLICY "Admins can view all guest quota journal" ON guest_quota_journal
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'julien.fritsch@gmail.com' OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Optional: Allow guests to view their own entries if needed (based on fingerprint, harder with RLS as fingerprint is not in JWT)
-- For now, we only need admin access.
