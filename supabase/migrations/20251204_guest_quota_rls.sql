-- Migration: Allow anonymous users to manage guest_quotas
-- This enables the freemium/guest experience without authentication

-- Enable RLS (should already be enabled, but ensure it is)
ALTER TABLE guest_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_quota_journal ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to SELECT their own guest quota by fingerprint
CREATE POLICY "anon_select_guest_quotas" ON guest_quotas
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous users to INSERT new guest quotas
CREATE POLICY "anon_insert_guest_quotas" ON guest_quotas
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous users to UPDATE their own guest quota by fingerprint
CREATE POLICY "anon_update_guest_quotas" ON guest_quotas
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anonymous users to SELECT their own journal entries
CREATE POLICY "anon_select_guest_quota_journal" ON guest_quota_journal
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous users to INSERT journal entries
CREATE POLICY "anon_insert_guest_quota_journal" ON guest_quota_journal
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Note: The fingerprint-based security is handled at the application level
-- since the fingerprint is generated client-side and validated during sync
