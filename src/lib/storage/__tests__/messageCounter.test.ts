import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConversation,
  addMessages,
  getConversation,
  deleteMessages,
  clearAll
} from '../ConversationStorageSimple';

describe('Message Counter', () => {
  // Clear storage before each test
  beforeEach(() => {
    clearAll();
  });

  it('should initialize messageCount to 0 for new conversations', () => {
    const conversation = createConversation({
      title: 'Test Conversation',
      firstMessage: 'Hello',
      userId: 'test-user'
    });

    expect(conversation.messageCount).toBe(0);
  });

  it('should update messageCount when adding messages', () => {
    const conversation = createConversation({
      title: 'Test Conversation',
      firstMessage: 'Hello',
      userId: 'test-user'
    });

    // Add first message
    addMessages(conversation.id, [
      {
        id: 'msg1',
        conversationId: conversation.id,
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      }
    ]);

    // Verify message count was updated
    const updatedConversation = getConversation(conversation.id);
    expect(updatedConversation?.messageCount).toBe(1);

    // Add another message
    addMessages(conversation.id, [
      {
        id: 'msg2',
        conversationId: conversation.id,
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date()
      }
    ]);

    // Verify message count was updated again
    const finalConversation = getConversation(conversation.id);
    expect(finalConversation?.messageCount).toBe(2);
  });

  it('should reset messageCount to 0 when deleting messages', () => {
    const conversation = createConversation({
      title: 'Test Conversation',
      firstMessage: 'Hello',
      userId: 'test-user'
    });

    // Add some messages
    addMessages(conversation.id, [
      {
        id: 'msg1',
        conversationId: conversation.id,
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      },
      {
        id: 'msg2',
        conversationId: conversation.id,
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date()
      }
    ]);

    // Verify messages were added
    const updatedConversation = getConversation(conversation.id);
    expect(updatedConversation?.messageCount).toBe(2);

    // Delete all messages
    deleteMessages(conversation.id);

    // Verify message count was reset to 0
    const finalConversation = getConversation(conversation.id);
    expect(finalConversation?.messageCount).toBe(0);
  });
});
