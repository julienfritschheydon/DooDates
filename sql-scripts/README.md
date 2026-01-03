# SQL Scripts for DooDates Conversations System

This directory contains SQL scripts for database setup and maintenance of the conversations system.

## 🗄️ Database Schema Files

### `00-INIT-DATABASE-COMPLETE.sql` ⭐ **RECOMMANDÉ**

**Complete database initialization script**

- Creates ALL tables needed for DooDates
- Uses JSONB `messages` field in `conversations` table
- Compatible with TypeScript code (`ConversationStorageSupabase.ts`)
- Includes RLS policies, indexes, and triggers
- **THIS IS THE SCHEMA USED BY THE APPLICATION**

### `create-conversations-tables.sql` ⚠️ **OBSOLÈTE**

**Alternative schema with separate tables**

- Creates `conversations` and `conversation_messages` tables
- Uses separate table for messages (NOT compatible with current code)
- **DO NOT USE unless you modify ConversationStorageSupabase.ts**

**Key Features:**

- UUID primary keys with auto-generation
- Foreign key constraints with CASCADE delete
- Check constraints for data validation
- JSONB metadata storage for flexibility
- Guest session tracking with expiration
- Poll integration fields

### `diagnostic-conversations.sql` 🔧 **NOUVEAU**

**Diagnostic tool for troubleshooting conversations system**

- Checks table structure
- Verifies JSONB `messages` column exists
- Detects schema mismatches
- Shows RLS policies status
- Counts conversations and messages
- **RUN THIS FIRST if you have any issues**

### `setup-rls-policies.sql`

**Row Level Security (RLS) configuration**

- Enables RLS on all tables
- User isolation policies (users see only their data)
- Guest session isolation with session ID matching
- Service role policies for system maintenance
- Helper functions for guest session management

**Security Model:**

- Authenticated users: `user_id = auth.uid()`
- Guest users: `guest_session_id` matching with `user_id IS NULL`
- Service role: Full access for maintenance

### `cleanup-functions.sql`

**Automated cleanup and maintenance functions**

- `cleanup_expired_guest_conversations()` - Removes expired guest data
- `cleanup_orphaned_messages()` - Removes orphaned messages
- `cleanup_old_deleted_conversations()` - Permanent deletion after grace period
- `enforce_guest_quota()` - Enforces guest conversation limits
- `get_storage_statistics()` - Storage usage analytics
- `run_scheduled_cleanup()` - Main function for cron jobs

## 🚀 Deployment Instructions

### 1. Initial Setup

```sql
-- Run in Supabase SQL Editor in this order:
\i create-conversations-tables.sql
\i setup-rls-policies.sql
\i cleanup-functions.sql
```

### 2. Guest Session Usage

```sql
-- Before any guest operations, set session ID:
SELECT set_guest_session_id('guest_' || gen_random_uuid()::text);

-- Then perform normal operations:
INSERT INTO conversations (title, first_message, guest_session_id, expires_at)
VALUES ('My Chat', 'Hello', get_guest_session_id(), NOW() + INTERVAL '30 days');
```

### 3. Scheduled Maintenance

```sql
-- Set up cron job to run daily:
SELECT cron.schedule('cleanup-conversations', '0 2 * * *', 'SELECT run_scheduled_cleanup();');
```

## 📊 Performance Optimizations

### Indexes Created

- **User queries:** `idx_conversations_user_id`
- **Status filtering:** `idx_conversations_status`
- **Time-based queries:** `idx_conversations_created_at`, `idx_conversations_updated_at`
- **Guest cleanup:** `idx_conversations_expires_at`, `idx_conversations_guest_session`
- **Full-text search:** `idx_conversations_search`, `idx_conversation_messages_search`
- **Tags search:** `idx_conversations_tags` (GIN index)
- **Poll integration:** `idx_conversations_poll_id`, `idx_conversations_poll_slug`

### Query Patterns

```sql
-- Optimized user conversations query
SELECT * FROM conversations
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 20;

-- Full-text search with ranking
SELECT *, ts_rank(to_tsvector('french', title || ' ' || first_message), plainto_tsquery('french', 'search terms')) as rank
FROM conversations
WHERE to_tsvector('french', title || ' ' || first_message) @@ plainto_tsquery('french', 'search terms')
ORDER BY rank DESC;
```

## 🔒 Security Features

### Data Isolation

- **RLS Policies:** Automatic user/guest data isolation
- **Guest Sessions:** Temporary data with automatic expiration
- **Service Role:** Controlled access for system operations

### Data Validation

- **Title length:** 1-100 characters
- **Message content:** 1-50,000 characters
- **Poll slug format:** Lowercase alphanumeric with hyphens
- **Status values:** Only 'active', 'archived', 'deleted'
- **Role values:** Only 'user', 'assistant', 'system'

## 🧪 Testing

Integration tests are available in:
`src/lib/storage/__tests__/ConversationStorageSupabase.test.ts`

**Test Coverage:**

- Database schema validation
- RLS policy enforcement
- CRUD operations
- Cleanup functions
- Full-text search
- Error handling
- Performance scenarios

## 📈 Monitoring

### Cleanup Log

All cleanup operations are logged in `conversation_cleanup_log` table:

```sql
-- View recent cleanup activity
SELECT * FROM conversation_cleanup_log
ORDER BY cleanup_timestamp DESC
LIMIT 10;

-- Storage statistics
SELECT * FROM get_storage_statistics();
```

### Health Checks

```sql
-- Check for expired guest data
SELECT COUNT(*) as expired_conversations
FROM conversations
WHERE user_id IS NULL AND expires_at < NOW();

-- Check for orphaned messages
SELECT COUNT(*) as orphaned_messages
FROM conversation_messages cm
WHERE NOT EXISTS (SELECT 1 FROM conversations c WHERE c.id = cm.conversation_id);
```
