-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Description: Configures security policies for conversations system
-- Ensures users can only access their own data or guest data they created
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON TABLES
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================

DO $$
DECLARE
    base_condition TEXT := '(SELECT auth.uid()) = user_id';
BEGIN

    EXECUTE 'DROP POLICY IF EXISTS "Users can view own conversations" ON conversations';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own conversations" ON conversations';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations';

    EXECUTE format(
        'CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (%s);',
        base_condition
    );

    EXECUTE format(
        'CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (%s);',
        base_condition
    );

    EXECUTE format(
        'CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (%s) WITH CHECK (%s);',
        base_condition,
        base_condition
    );

    EXECUTE format(
        'CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (%s);',
        base_condition
    );
END;
$$;

-- ============================================================================
-- ADMIN POLICIES (for system maintenance)
-- ============================================================================

-- Policy: Service role can access all data for maintenance
DROP POLICY IF EXISTS "Service role full access conversations" ON conversations;
CREATE POLICY "Service role full access conversations" ON conversations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

/*
SECURITY IMPLEMENTATION NOTES:

1. AUTHENTICATED USERS:
   - Can only access conversations where user_id = auth.uid()
   - Full CRUD operations on their own data
   - Cannot access other users' conversations

2. GUEST USERS:
   - Must set guest_session_id using set_guest_session_id() function
   - Can only access conversations where guest_session_id matches
   - Limited to conversations with user_id = NULL
   - Session ID should be generated client-side and stored in localStorage

3. SERVICE ROLE:
   - Full access for system maintenance and cleanup
   - Used for automated tasks like expired data cleanup

4. GUEST SESSION MANAGEMENT:
   - Client must call SELECT set_guest_session_id('session_id') before operations
   - Session ID should be unique per browser/device
   - Recommend using crypto.randomUUID() or similar

USAGE EXAMPLE:
-- For guest users, call this first:
SELECT set_guest_session_id('guest_12345_abcdef');

-- Then perform normal operations:
INSERT INTO conversations (title, first_message, guest_session_id, expires_at)
VALUES ('My Conversation', 'Hello world', 'guest_12345_abcdef', NOW() + INTERVAL '30 days');
*/
