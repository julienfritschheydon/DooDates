-- ============================================================================
-- DIAGNOSTIC SCRIPT FOR CONVERSATIONS SYSTEM
-- ============================================================================
-- Description: Checks the conversations table structure and configuration
-- Usage: Run this in Supabase SQL Editor to diagnose issues
-- ============================================================================

-- 1. Check if conversations table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations')
    THEN '✅ Table conversations existe'
    ELSE '❌ Table conversations N''EXISTE PAS'
  END as table_status;

-- 2. Check conversations table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'session_id', 'title', 'messages', 'status', 'created_at', 'updated_at') 
    THEN '✅ Colonne requise'
    ELSE 'ℹ️ Colonne optionnelle'
  END as importance
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- 3. Check if messages column exists and is JSONB
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
        AND column_name = 'messages' 
        AND data_type = 'jsonb'
    )
    THEN '✅ Colonne messages (JSONB) existe'
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
        AND column_name = 'messages'
    )
    THEN '⚠️ Colonne messages existe mais n''est PAS de type JSONB'
    ELSE '❌ Colonne messages N''EXISTE PAS'
  END as messages_column_status;

-- 4. Check if conversation_messages table exists (wrong schema)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_messages')
    THEN '⚠️ Table conversation_messages existe (MAUVAIS schéma - voir README)'
    ELSE '✅ Pas de table conversation_messages (bon schéma)'
  END as schema_type;

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;

-- 6. Check if conversations table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'conversations';

-- 7. Count conversations by user type
SELECT 
  CASE 
    WHEN user_id IS NOT NULL THEN 'Authentifiés'
    ELSE 'Invités'
  END as user_type,
  COUNT(*) as total_conversations,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(message_count) as avg_messages
FROM conversations
GROUP BY CASE WHEN user_id IS NOT NULL THEN 'Authentifiés' ELSE 'Invités' END;

-- 8. Check recent conversations (last 10)
SELECT 
  id,
  user_id,
  title,
  message_count,
  jsonb_array_length(messages) as actual_message_count,
  status,
  created_at,
  updated_at
FROM conversations
ORDER BY created_at DESC
LIMIT 10;

-- 9. Check for data inconsistencies
SELECT 
  'Incohérence message_count' as issue_type,
  COUNT(*) as affected_rows
FROM conversations
WHERE message_count != jsonb_array_length(messages);

-- 10. Summary
SELECT 
  '📊 RÉSUMÉ DU DIAGNOSTIC' as title,
  (SELECT COUNT(*) FROM conversations) as total_conversations,
  (SELECT COUNT(*) FROM conversations WHERE user_id IS NOT NULL) as authenticated_conversations,
  (SELECT COUNT(*) FROM conversations WHERE user_id IS NULL) as guest_conversations,
  (SELECT SUM(message_count) FROM conversations) as total_messages;

-- ============================================================================
-- RECOMMENDED FIXES
-- ============================================================================

-- If messages column doesn't exist, run:
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS messages JSONB NOT NULL DEFAULT '[]';

-- If you have conversation_messages table (wrong schema), you need to:
-- 1. Export your data
-- 2. Drop the old tables
-- 3. Run sql-scripts/00-INIT-DATABASE-COMPLETE.sql
-- 4. Import your data

-- If RLS is not enabled, run:
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- If policies are missing, run:
-- sql-scripts/00-INIT-DATABASE-COMPLETE.sql (section RLS policies)

