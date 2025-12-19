-- Migration: Fix RLS Performance Issues
-- This migration addresses:
-- 1. auth_rls_initplan: Wrap auth function calls in (select ...) to prevent per-row re-evaluation
-- 2. multiple_permissive_policies: Consolidate multiple policies for the same role/action

-- ============================================================================
-- FIX 1: guest_quotas - auth_rls_initplan and multiple_permissive_policies
-- ============================================================================

-- Drop existing policies that will be consolidated
DROP POLICY IF EXISTS "Admins can view all guest quotas" ON guest_quotas;
DROP POLICY IF EXISTS "anon_select_guest_quotas" ON guest_quotas;
DROP POLICY IF EXISTS "anon_insert_guest_quotas" ON guest_quotas;
DROP POLICY IF EXISTS "anon_update_guest_quotas" ON guest_quotas;
DROP POLICY IF EXISTS "System can insert guest quotas" ON guest_quotas;
DROP POLICY IF EXISTS "System can update guest quotas" ON guest_quotas;
DROP POLICY IF EXISTS "Allow public read access" ON guest_quotas;
DROP POLICY IF EXISTS "Allow public insert" ON guest_quotas;
DROP POLICY IF EXISTS "Allow public update" ON guest_quotas;

-- Create SELECT policy for anon (fingerprint-based access only)
CREATE POLICY "anon_select_guest_quotas" ON guest_quotas
  FOR SELECT
  TO anon
  USING (
    fingerprint = get_request_fingerprint()
    OR id = get_request_guest_quota_id()
  );

-- Create SELECT policy for authenticated users (with admin check using optimized auth call)
CREATE POLICY "Admins can view all guest quotas" ON guest_quotas
  FOR SELECT
  TO authenticated
  USING (
    -- Admin check (optimized to prevent per-row evaluation)
    ((SELECT auth.jwt()) ->> 'email' = 'julien.fritsch@gmail.com' OR (SELECT auth.jwt()) ->> 'role' = 'admin')
  );

-- Create consolidated INSERT policy for anon
CREATE POLICY "anon_insert_guest_quotas" ON guest_quotas
  FOR INSERT
  TO anon
  WITH CHECK (
    fingerprint = get_request_fingerprint()
  );

-- Create consolidated UPDATE policy for anon
CREATE POLICY "anon_update_guest_quotas" ON guest_quotas
  FOR UPDATE
  TO anon
  USING (
    fingerprint = get_request_fingerprint()
    OR id = get_request_guest_quota_id()
  )
  WITH CHECK (
    fingerprint = get_request_fingerprint()
  );

-- ============================================================================
-- FIX 2: guest_quota_journal - auth_rls_initplan and multiple_permissive_policies
-- ============================================================================

-- Drop existing policies that will be consolidated
DROP POLICY IF EXISTS "Admins can view all guest quota journal" ON guest_quota_journal;
DROP POLICY IF EXISTS "anon_select_guest_quota_journal" ON guest_quota_journal;
DROP POLICY IF EXISTS "anon_insert_guest_quota_journal" ON guest_quota_journal;
DROP POLICY IF EXISTS "Allow public read journal" ON guest_quota_journal;
DROP POLICY IF EXISTS "Allow public insert journal" ON guest_quota_journal;

-- Create SELECT policy for anon (fingerprint-based access only)
CREATE POLICY "anon_select_guest_quota_journal" ON guest_quota_journal
  FOR SELECT
  TO anon
  USING (
    fingerprint = get_request_fingerprint()
    OR guest_quota_id = get_request_guest_quota_id()
  );

-- Create SELECT policy for authenticated users (with admin check using optimized auth call)
CREATE POLICY "Admins can view all guest quota journal" ON guest_quota_journal
  FOR SELECT
  TO authenticated
  USING (
    -- Admin check (optimized to prevent per-row evaluation)
    ((SELECT auth.jwt()) ->> 'email' = 'julien.fritsch@gmail.com' OR (SELECT auth.jwt()) ->> 'role' = 'admin')
  );

-- Create consolidated INSERT policy for anon
CREATE POLICY "anon_insert_guest_quota_journal" ON guest_quota_journal
  FOR INSERT
  TO anon
  WITH CHECK (
    fingerprint = get_request_fingerprint()
    OR guest_quota_id = get_request_guest_quota_id()
  );

-- ============================================================================
-- FIX 3: web_vitals - auth_rls_initplan
-- ============================================================================

-- Drop and recreate with optimized auth call
DROP POLICY IF EXISTS "Users can read web vitals data" ON web_vitals;

CREATE POLICY "Users can read web vitals data" ON web_vitals
  FOR SELECT USING (
    (SELECT auth.role()) = 'authenticated'
  );

-- ============================================================================
-- FIX 4: performance_metrics - auth_rls_initplan
-- ============================================================================

-- Drop and recreate with optimized auth call
DROP POLICY IF EXISTS "Users can read performance metrics" ON performance_metrics;

CREATE POLICY "Users can read performance metrics" ON performance_metrics
  FOR SELECT USING (
    (SELECT auth.role()) = 'authenticated'
  );

-- ============================================================================
-- FIX 5: performance_alerts - auth_rls_initplan (2 policies)
-- ============================================================================

-- Drop and recreate with optimized auth calls
DROP POLICY IF EXISTS "Users can read performance alerts" ON performance_alerts;
DROP POLICY IF EXISTS "Users can update alerts" ON performance_alerts;

CREATE POLICY "Users can read performance alerts" ON performance_alerts
  FOR SELECT USING (
    (SELECT auth.role()) = 'authenticated'
  );

CREATE POLICY "Users can update alerts" ON performance_alerts
  FOR UPDATE USING (
    (SELECT auth.role()) = 'authenticated'
  );

