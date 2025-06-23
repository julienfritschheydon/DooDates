-- Debug script to check RLS policies and auth state
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check current RLS policies for polls table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'polls';

-- 2. Check if RLS is enabled on polls table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'polls';

-- 3. Test auth.uid() function (this should return the current user's ID when authenticated)
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    auth.role() as current_user_role;

-- 4. Check if user exists in profiles table
SELECT 
    id,
    email,
    full_name,
    created_at
FROM profiles 
WHERE id = auth.uid();

-- 5. Test the exact condition used in the RLS policy
SELECT 
    auth.uid() = 'bb42e3c2-3612-4994-ad15-5cabe847e0c5'::uuid as policy_condition_result,
    auth.uid() as auth_uid,
    'bb42e3c2-3612-4994-ad15-5cabe847e0c5'::uuid as creator_id_from_test; 