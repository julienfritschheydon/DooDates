/**
 * Mock for ConversationProtection service
 */

export const conversationProtection = {
  canCreateConversation: jest.fn(() => true),
  startCreation: jest.fn(),
  completeCreation: jest.fn(),
  failCreation: jest.fn(),
  reset: jest.fn(),
  getStatus: jest.fn(() => ({
    initializationInProgress: false,
    lastConversationCreated: null,
    creationAttempts: 0,
    canCreate: true
  }))
};
