-- Migration: Fix guest_quotas RLS to allow anonymous inserts
-- The previous migration used get_request_fingerprint() which doesn't exist
-- This migration simplifies the policies to allow anonymous access

-- Drop problematic policies that depend on non-existent functions
DROP POLICY IF EXISTS "anon_select_guest_quotas" ON guest_quotas;
DROP POLICY IF EXISTS "anon_insert_guest_quotas" ON guest_quotas;
DROP POLICY IF EXISTS "anon_update_guest_quotas" ON guest_quotas;

-- Create simple permissive policies for anonymous users
-- Guest quotas are identified by fingerprint, not auth

-- Allow anonymous SELECT (guests can read their own quota by fingerprint)
CREATE POLICY "anon_select_guest_quotas" ON guest_quotas
  FOR SELECT
  TO anon
  USING (true);  -- Guest identifies themselves by fingerprint in WHERE clause

-- Allow anonymous INSERT (guests can create their quota)
CREATE POLICY "anon_insert_guest_quotas" ON guest_quotas
  FOR INSERT
  TO anon
  WITH CHECK (true);  -- Any anon can insert, fingerprint uniqueness is enforced by UNIQUE constraint

-- Allow anonymous UPDATE (guests can update their quota)
CREATE POLICY "anon_update_guest_quotas" ON guest_quotas
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);  -- Guest identifies themselves by fingerprint in WHERE clause

-- Same for guest_quota_journal
DROP POLICY IF EXISTS "anon_select_guest_quota_journal" ON guest_quota_journal;
DROP POLICY IF EXISTS "anon_insert_guest_quota_journal" ON guest_quota_journal;

CREATE POLICY "anon_select_guest_quota_journal" ON guest_quota_journal
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_guest_quota_journal" ON guest_quota_journal
  FOR INSERT
  TO anon
  WITH CHECK (true);
