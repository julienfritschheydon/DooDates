-- Verify Foreign Key Indexes
-- Run this in Supabase Dashboard SQL Editor to check which foreign keys exist

-- ============================================================================
-- Check all foreign keys in public schema
-- ============================================================================
SELECT 
  tc.table_name, 
  kcu.column_name, 
  tc.constraint_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (
    tc.table_name = 'country_region_map' OR
    tc.table_name = 'beta_keys' OR
    tc.table_name = 'conversations' OR
    tc.table_name = 'guest_quotas' OR
    tc.table_name = 'poll_options' OR
    tc.table_name = 'votes'
  )
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- Check foreign keys in auth schema (for beta_keys.created_by)
-- ============================================================================
SELECT 
  tc.table_schema,
  tc.table_name, 
  kcu.column_name, 
  tc.constraint_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'beta_keys'
  AND kcu.column_name = 'created_by'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- Check if guest_quotas has a user_id column
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'guest_quotas'
  AND column_name = 'user_id';

-- ============================================================================
-- List all indexes on these tables
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'country_region_map' OR
    tablename = 'beta_keys' OR
    tablename = 'conversations' OR
    tablename = 'guest_quotas' OR
    tablename = 'poll_options' OR
    tablename = 'votes'
  )
  AND indexname LIKE '%_fkey'
ORDER BY tablename, indexname;

