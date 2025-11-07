/**
 * Conversation-specific protection against infinite creation
 */
declare class ConversationProtectionService {
    private static instance;
    private initializationInProgress;
    private lastConversationCreated;
    private creationAttempts;
    private readonly MAX_CREATION_ATTEMPTS;
    static getInstance(): ConversationProtectionService;
    /**
     * Check if conversation creation should be allowed
     */
    canCreateConversation(): boolean;
    /**
     * Mark conversation creation as started
     */
    startCreation(): void;
    /**
     * Mark conversation creation as completed
     */
    completeCreation(conversationId: string): void;
    /**
     * Mark conversation creation as failed
     */
    failCreation(): void;
    /**
     * Reset protection state (for new sessions)
     */
    reset(): void;
    /**
     * Get current protection status
     */
    getStatus(): {
        initializationInProgress: boolean;
        lastConversationCreated: string;
        creationAttempts: number;
        canCreate: boolean;
    };
}
export declare const conversationProtection: ConversationProtectionService;
export {};
