/**
 * Mock for ConversationProtection service
 */
export declare const conversationProtection: {
  canCreateConversation: jest.Mock<boolean, [], any>;
  startCreation: jest.Mock<any, any, any>;
  completeCreation: jest.Mock<any, any, any>;
  failCreation: jest.Mock<any, any, any>;
  reset: jest.Mock<any, any, any>;
  getStatus: jest.Mock<
    {
      initializationInProgress: boolean;
      lastConversationCreated: any;
      creationAttempts: number;
      canCreate: boolean;
    },
    [],
    any
  >;
};
