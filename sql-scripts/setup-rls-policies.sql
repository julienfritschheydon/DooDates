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
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND guest_session_id = current_setting('app.guest_session_id', true))
    );

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND guest_session_id = current_setting('app.guest_session_id', true))
    );

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE
    USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND guest_session_id = current_setting('app.guest_session_id', true))
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND guest_session_id = current_setting('app.guest_session_id', true))
    );

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE
    USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND guest_session_id = current_setting('app.guest_session_id', true))
    );

-- ============================================================================
-- CONVERSATION_MESSAGES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view messages from their conversations
CREATE POLICY "Users can view own conversation messages" ON conversation_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_messages.conversation_id 
            AND (
                auth.uid() = c.user_id OR 
                (c.user_id IS NULL AND c.guest_session_id = current_setting('app.guest_session_id', true))
            )
        )
    );

-- Policy: Users can insert messages to their conversations
CREATE POLICY "Users can insert messages to own conversations" ON conversation_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_messages.conversation_id 
            AND (
                auth.uid() = c.user_id OR 
                (c.user_id IS NULL AND c.guest_session_id = current_setting('app.guest_session_id', true))
            )
        )
    );

-- Policy: Users can update messages in their conversations
CREATE POLICY "Users can update own conversation messages" ON conversation_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_messages.conversation_id 
            AND (
                auth.uid() = c.user_id OR 
                (c.user_id IS NULL AND c.guest_session_id = current_setting('app.guest_session_id', true))
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_messages.conversation_id 
            AND (
                auth.uid() = c.user_id OR 
                (c.user_id IS NULL AND c.guest_session_id = current_setting('app.guest_session_id', true))
            )
        )
    );

-- Policy: Users can delete messages from their conversations
CREATE POLICY "Users can delete own conversation messages" ON conversation_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_messages.conversation_id 
            AND (
                auth.uid() = c.user_id OR 
                (c.user_id IS NULL AND c.guest_session_id = current_setting('app.guest_session_id', true))
            )
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS FOR GUEST SESSION MANAGEMENT
-- ============================================================================

-- Function to set guest session ID for current session
CREATE OR REPLACE FUNCTION set_guest_session_id(session_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.guest_session_id', session_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current guest session ID
CREATE OR REPLACE FUNCTION get_guest_session_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.guest_session_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN POLICIES (for system maintenance)
-- ============================================================================

-- Policy: Service role can access all data for maintenance
CREATE POLICY "Service role full access conversations" ON conversations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access messages" ON conversation_messages
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
