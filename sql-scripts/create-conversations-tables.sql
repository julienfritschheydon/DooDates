-- ============================================================================
-- CONVERSATIONS SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Description: Creates tables for storing user conversations and messages
-- Compatible with: Supabase PostgreSQL
-- Version: 1.0.0
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
-- Stores conversation metadata and summary information
CREATE TABLE IF NOT EXISTS conversations (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User association (null for guest users)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core conversation data
    title VARCHAR(100) NOT NULL CHECK (length(title) >= 1),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Message summary
    first_message TEXT NOT NULL CHECK (length(first_message) >= 1 AND length(first_message) <= 100),
    message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
    
    -- Poll integration
    related_poll_id UUID,
    related_poll_slug VARCHAR(50),
    
    -- User preferences
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata (stored as JSONB for flexibility)
    metadata JSONB DEFAULT '{}',
    
    -- Guest user tracking (for cleanup)
    guest_session_id VARCHAR(100),
    expires_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT conversations_title_length CHECK (length(title) <= 100),
    CONSTRAINT conversations_first_message_length CHECK (length(first_message) <= 100),
    CONSTRAINT conversations_poll_slug_format CHECK (
        related_poll_slug IS NULL OR 
        (related_poll_slug ~ '^[a-z0-9-]+$' AND length(related_poll_slug) >= 3)
    ),
    CONSTRAINT conversations_guest_expiry CHECK (
        (user_id IS NOT NULL AND expires_at IS NULL) OR
        (user_id IS NULL AND expires_at IS NOT NULL)
    )
);

-- ============================================================================
-- TABLE: conversation_messages
-- ============================================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS conversation_messages (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to conversation
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Message data
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL CHECK (length(content) >= 1),
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Message metadata (tokens, processing time, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT conversation_messages_content_length CHECK (length(content) <= 50000)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_session ON conversations(guest_session_id) WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_expires_at ON conversations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_poll_id ON conversations(related_poll_id) WHERE related_poll_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_poll_slug ON conversations(related_poll_slug) WHERE related_poll_slug IS NOT NULL;

-- Full-text search index for conversation titles and first messages
CREATE INDEX IF NOT EXISTS idx_conversations_search ON conversations 
USING gin(to_tsvector('french', title || ' ' || first_message));

-- Tags search index
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING gin(tags);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_timestamp ON conversation_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);

-- Full-text search index for message content
CREATE INDEX IF NOT EXISTS idx_conversation_messages_search ON conversation_messages 
USING gin(to_tsvector('french', content));

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations table
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update message count when messages are added/removed
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations 
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations 
        SET message_count = GREATEST(message_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers for message count updates
DROP TRIGGER IF EXISTS update_message_count_insert ON conversation_messages;
CREATE TRIGGER update_message_count_insert
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

DROP TRIGGER IF EXISTS update_message_count_delete ON conversation_messages;
CREATE TRIGGER update_message_count_delete
    AFTER DELETE ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE conversations IS 'Stores conversation metadata and summary information';
COMMENT ON COLUMN conversations.id IS 'Unique identifier for the conversation';
COMMENT ON COLUMN conversations.user_id IS 'Reference to authenticated user (null for guests)';
COMMENT ON COLUMN conversations.title IS 'User-defined or auto-generated conversation title';
COMMENT ON COLUMN conversations.status IS 'Current status: active, archived, or deleted';
COMMENT ON COLUMN conversations.first_message IS 'Preview of the first message (max 100 chars)';
COMMENT ON COLUMN conversations.message_count IS 'Total number of messages in conversation';
COMMENT ON COLUMN conversations.related_poll_id IS 'ID of poll created from this conversation';
COMMENT ON COLUMN conversations.related_poll_slug IS 'URL slug of related poll';
COMMENT ON COLUMN conversations.is_favorite IS 'User favorite flag';
COMMENT ON COLUMN conversations.tags IS 'Array of user-defined tags for categorization';
COMMENT ON COLUMN conversations.metadata IS 'Additional metadata (AI model, language, etc.)';
COMMENT ON COLUMN conversations.guest_session_id IS 'Session ID for guest users';
COMMENT ON COLUMN conversations.expires_at IS 'Expiration date for guest conversations';

COMMENT ON TABLE conversation_messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN conversation_messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN conversation_messages.conversation_id IS 'Reference to parent conversation';
COMMENT ON COLUMN conversation_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN conversation_messages.content IS 'Full message content';
COMMENT ON COLUMN conversation_messages.timestamp IS 'When the message was created';
COMMENT ON COLUMN conversation_messages.metadata IS 'Message metadata (tokens, processing time, etc.)';
