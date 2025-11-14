/**
 * Mock for ConversationProtection service
 */
export declare const conversationProtection: {
  canCreateConversation: jest.Mock<boolean, [], unknown>;
  startCreation: jest.Mock<void, [], unknown>;
  completeCreation: jest.Mock<void, [string], unknown>;
  failCreation: jest.Mock<void, [Error], unknown>;
  reset: jest.Mock<void, [], unknown>;
  getStatus: jest.Mock<
    {
      initializationInProgress: boolean;
      lastConversationCreated: string | null;
      creationAttempts: number;
      canCreate: boolean;
    },
    [],
    unknown
  >;
};
