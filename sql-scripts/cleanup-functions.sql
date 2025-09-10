-- ============================================================================
-- CLEANUP FUNCTIONS FOR CONVERSATIONS SYSTEM
-- ============================================================================
-- Description: Automated cleanup functions for expired and orphaned data
-- Includes functions for guest data expiration and system maintenance
-- ============================================================================

-- ============================================================================
-- FUNCTION: cleanup_expired_guest_conversations
-- ============================================================================
-- Removes expired guest conversations and their messages
-- Should be called regularly via cron job or scheduled function

CREATE OR REPLACE FUNCTION cleanup_expired_guest_conversations()
RETURNS TABLE (
    deleted_conversations INTEGER,
    deleted_messages INTEGER,
    cleanup_timestamp TIMESTAMPTZ
) AS $$
DECLARE
    conversation_count INTEGER := 0;
    message_count INTEGER := 0;
    expired_conversation_ids UUID[];
BEGIN
    -- Get IDs of expired conversations
    SELECT ARRAY_AGG(id) INTO expired_conversation_ids
    FROM conversations 
    WHERE user_id IS NULL 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- Count and delete messages first (due to foreign key constraint)
    IF expired_conversation_ids IS NOT NULL THEN
        SELECT COUNT(*) INTO message_count
        FROM conversation_messages 
        WHERE conversation_id = ANY(expired_conversation_ids);
        
        DELETE FROM conversation_messages 
        WHERE conversation_id = ANY(expired_conversation_ids);
        
        -- Count and delete conversations
        SELECT COUNT(*) INTO conversation_count
        FROM conversations 
        WHERE id = ANY(expired_conversation_ids);
        
        DELETE FROM conversations 
        WHERE id = ANY(expired_conversation_ids);
    END IF;
    
    -- Log cleanup activity
    INSERT INTO conversation_cleanup_log (
        cleanup_type,
        deleted_conversations,
        deleted_messages,
        cleanup_timestamp
    ) VALUES (
        'expired_guest_cleanup',
        conversation_count,
        message_count,
        NOW()
    );
    
    RETURN QUERY SELECT 
        conversation_count,
        message_count,
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: cleanup_orphaned_messages
-- ============================================================================
-- Removes messages that reference non-existent conversations

CREATE OR REPLACE FUNCTION cleanup_orphaned_messages()
RETURNS TABLE (
    deleted_messages INTEGER,
    cleanup_timestamp TIMESTAMPTZ
) AS $$
DECLARE
    message_count INTEGER := 0;
BEGIN
    -- Count orphaned messages
    SELECT COUNT(*) INTO message_count
    FROM conversation_messages cm
    WHERE NOT EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = cm.conversation_id
    );
    
    -- Delete orphaned messages
    DELETE FROM conversation_messages cm
    WHERE NOT EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = cm.conversation_id
    );
    
    -- Log cleanup activity
    INSERT INTO conversation_cleanup_log (
        cleanup_type,
        deleted_conversations,
        deleted_messages,
        cleanup_timestamp
    ) VALUES (
        'orphaned_messages_cleanup',
        0,
        message_count,
        NOW()
    );
    
    RETURN QUERY SELECT 
        message_count,
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: cleanup_old_deleted_conversations
-- ============================================================================
-- Permanently removes conversations marked as 'deleted' after grace period

CREATE OR REPLACE FUNCTION cleanup_old_deleted_conversations(
    grace_period_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    deleted_conversations INTEGER,
    deleted_messages INTEGER,
    cleanup_timestamp TIMESTAMPTZ
) AS $$
DECLARE
    conversation_count INTEGER := 0;
    message_count INTEGER := 0;
    old_deleted_ids UUID[];
BEGIN
    -- Get IDs of old deleted conversations
    SELECT ARRAY_AGG(id) INTO old_deleted_ids
    FROM conversations 
    WHERE status = 'deleted' 
    AND updated_at < NOW() - (grace_period_days || ' days')::INTERVAL;
    
    -- Count and delete messages first
    IF old_deleted_ids IS NOT NULL THEN
        SELECT COUNT(*) INTO message_count
        FROM conversation_messages 
        WHERE conversation_id = ANY(old_deleted_ids);
        
        DELETE FROM conversation_messages 
        WHERE conversation_id = ANY(old_deleted_ids);
        
        -- Count and delete conversations
        SELECT COUNT(*) INTO conversation_count
        FROM conversations 
        WHERE id = ANY(old_deleted_ids);
        
        DELETE FROM conversations 
        WHERE id = ANY(old_deleted_ids);
    END IF;
    
    -- Log cleanup activity
    INSERT INTO conversation_cleanup_log (
        cleanup_type,
        deleted_conversations,
        deleted_messages,
        cleanup_timestamp,
        metadata
    ) VALUES (
        'old_deleted_cleanup',
        conversation_count,
        message_count,
        NOW(),
        jsonb_build_object('grace_period_days', grace_period_days)
    );
    
    RETURN QUERY SELECT 
        conversation_count,
        message_count,
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_storage_statistics
-- ============================================================================
-- Returns statistics about conversations storage usage

CREATE OR REPLACE FUNCTION get_storage_statistics()
RETURNS TABLE (
    total_conversations INTEGER,
    active_conversations INTEGER,
    archived_conversations INTEGER,
    deleted_conversations INTEGER,
    guest_conversations INTEGER,
    authenticated_conversations INTEGER,
    total_messages INTEGER,
    expired_guest_conversations INTEGER,
    storage_size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM conversations) as total_conversations,
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE status = 'active') as active_conversations,
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE status = 'archived') as archived_conversations,
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE status = 'deleted') as deleted_conversations,
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE user_id IS NULL) as guest_conversations,
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE user_id IS NOT NULL) as authenticated_conversations,
        (SELECT COUNT(*)::INTEGER FROM conversation_messages) as total_messages,
        (SELECT COUNT(*)::INTEGER FROM conversations WHERE user_id IS NULL AND expires_at < NOW()) as expired_guest_conversations,
        (SELECT ROUND((pg_total_relation_size('conversations') + pg_total_relation_size('conversation_messages'))::NUMERIC / 1024 / 1024, 2)) as storage_size_mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: enforce_guest_quota
-- ============================================================================
-- Enforces quota limits for guest users by removing oldest conversations

CREATE OR REPLACE FUNCTION enforce_guest_quota(
    session_id TEXT,
    max_conversations INTEGER DEFAULT 1
)
RETURNS TABLE (
    deleted_conversations INTEGER,
    deleted_messages INTEGER
) AS $$
DECLARE
    conversation_count INTEGER := 0;
    message_count INTEGER := 0;
    excess_conversations UUID[];
BEGIN
    -- Get excess conversations for this guest session (oldest first)
    SELECT ARRAY_AGG(id) INTO excess_conversations
    FROM (
        SELECT id 
        FROM conversations 
        WHERE guest_session_id = session_id 
        AND user_id IS NULL
        ORDER BY created_at ASC
        OFFSET max_conversations
    ) excess;
    
    -- Delete excess conversations and their messages
    IF excess_conversations IS NOT NULL THEN
        -- Count messages to be deleted
        SELECT COUNT(*) INTO message_count
        FROM conversation_messages 
        WHERE conversation_id = ANY(excess_conversations);
        
        -- Delete messages first
        DELETE FROM conversation_messages 
        WHERE conversation_id = ANY(excess_conversations);
        
        -- Count and delete conversations
        SELECT COUNT(*) INTO conversation_count
        FROM conversations 
        WHERE id = ANY(excess_conversations);
        
        DELETE FROM conversations 
        WHERE id = ANY(excess_conversations);
        
        -- Log quota enforcement
        INSERT INTO conversation_cleanup_log (
            cleanup_type,
            deleted_conversations,
            deleted_messages,
            cleanup_timestamp,
            metadata
        ) VALUES (
            'guest_quota_enforcement',
            conversation_count,
            message_count,
            NOW(),
            jsonb_build_object(
                'guest_session_id', session_id,
                'max_conversations', max_conversations
            )
        );
    END IF;
    
    RETURN QUERY SELECT 
        conversation_count,
        message_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE: conversation_cleanup_log
-- ============================================================================
-- Logs cleanup activities for monitoring and debugging

CREATE TABLE IF NOT EXISTS conversation_cleanup_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cleanup_type VARCHAR(50) NOT NULL,
    deleted_conversations INTEGER NOT NULL DEFAULT 0,
    deleted_messages INTEGER NOT NULL DEFAULT 0,
    cleanup_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT cleanup_log_type_check CHECK (
        cleanup_type IN (
            'expired_guest_cleanup',
            'orphaned_messages_cleanup', 
            'old_deleted_cleanup',
            'guest_quota_enforcement',
            'manual_cleanup'
        )
    )
);

-- Index for cleanup log queries
CREATE INDEX IF NOT EXISTS idx_cleanup_log_timestamp ON conversation_cleanup_log(cleanup_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cleanup_log_type ON conversation_cleanup_log(cleanup_type);

-- ============================================================================
-- SCHEDULED CLEANUP FUNCTION (for cron jobs)
-- ============================================================================
-- Main function to run all cleanup tasks

CREATE OR REPLACE FUNCTION run_scheduled_cleanup()
RETURNS TABLE (
    task VARCHAR(50),
    deleted_conversations INTEGER,
    deleted_messages INTEGER,
    execution_time TIMESTAMPTZ
) AS $$
DECLARE
    start_time TIMESTAMPTZ := NOW();
BEGIN
    -- Run expired guest cleanup
    INSERT INTO conversation_cleanup_log (cleanup_type, deleted_conversations, deleted_messages, cleanup_timestamp)
    SELECT 'expired_guest_cleanup', deleted_conversations, deleted_messages, cleanup_timestamp
    FROM cleanup_expired_guest_conversations();
    
    -- Run orphaned messages cleanup
    INSERT INTO conversation_cleanup_log (cleanup_type, deleted_conversations, deleted_messages, cleanup_timestamp)
    SELECT 'orphaned_messages_cleanup', 0, deleted_messages, cleanup_timestamp
    FROM cleanup_orphaned_messages();
    
    -- Run old deleted conversations cleanup (7 day grace period)
    INSERT INTO conversation_cleanup_log (cleanup_type, deleted_conversations, deleted_messages, cleanup_timestamp)
    SELECT 'old_deleted_cleanup', deleted_conversations, deleted_messages, cleanup_timestamp
    FROM cleanup_old_deleted_conversations(7);
    
    -- Return summary of all cleanup tasks
    RETURN QUERY
    SELECT 
        ccl.cleanup_type::VARCHAR(50) as task,
        ccl.deleted_conversations,
        ccl.deleted_messages,
        ccl.cleanup_timestamp as execution_time
    FROM conversation_cleanup_log ccl
    WHERE ccl.cleanup_timestamp >= start_time
    ORDER BY ccl.cleanup_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION cleanup_expired_guest_conversations() IS 'Removes expired guest conversations and their messages';
COMMENT ON FUNCTION cleanup_orphaned_messages() IS 'Removes messages that reference non-existent conversations';
COMMENT ON FUNCTION cleanup_old_deleted_conversations(INTEGER) IS 'Permanently removes conversations marked as deleted after grace period';
COMMENT ON FUNCTION get_storage_statistics() IS 'Returns comprehensive statistics about conversations storage usage';
COMMENT ON FUNCTION enforce_guest_quota(TEXT, INTEGER) IS 'Enforces quota limits for guest users by removing oldest conversations';
COMMENT ON FUNCTION run_scheduled_cleanup() IS 'Main function to run all cleanup tasks, suitable for cron jobs';

COMMENT ON TABLE conversation_cleanup_log IS 'Logs all cleanup activities for monitoring and debugging';
COMMENT ON COLUMN conversation_cleanup_log.cleanup_type IS 'Type of cleanup operation performed';
COMMENT ON COLUMN conversation_cleanup_log.deleted_conversations IS 'Number of conversations deleted in this operation';
COMMENT ON COLUMN conversation_cleanup_log.deleted_messages IS 'Number of messages deleted in this operation';
COMMENT ON COLUMN conversation_cleanup_log.metadata IS 'Additional metadata about the cleanup operation';
