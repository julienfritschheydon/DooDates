/**
 * Conversation-specific protection against infinite creation
 */

import { infiniteLoopProtection } from "./InfiniteLoopProtection";
import { logError, ErrorFactory } from "../lib/error-handling";

class ConversationProtectionService {
  private static instance: ConversationProtectionService;
  private initializationInProgress = false;
  private lastConversationCreated: string | null = null;
  private creationAttempts = 0;
  private readonly MAX_CREATION_ATTEMPTS = 3;

  static getInstance(): ConversationProtectionService {
    if (!ConversationProtectionService.instance) {
      ConversationProtectionService.instance =
        new ConversationProtectionService();
    }
    return ConversationProtectionService.instance;
  }

  /**
   * Check if conversation creation should be allowed
   */
  canCreateConversation(): boolean {
    // Use global infinite loop protection
    if (!infiniteLoopProtection.canExecute("conversation_creation")) {
      return false;
    }

    // Check if initialization is already in progress
    if (this.initializationInProgress) {
      console.log("🔒 Conversation creation already in progress");
      return false;
    }

    // Check creation attempts
    if (this.creationAttempts >= this.MAX_CREATION_ATTEMPTS) {
      logError(
        ErrorFactory.rateLimit(
          "Too many conversation creation attempts",
          "Trop de tentatives de création de conversation",
        ),
        {
          component: "ConversationProtection",
          operation: "canCreateConversation",
          metadata: {
            attempts: this.creationAttempts,
            maxAttempts: this.MAX_CREATION_ATTEMPTS,
          },
        },
      );
      return false;
    }

    return true;
  }

  /**
   * Mark conversation creation as started
   */
  startCreation(): void {
    this.initializationInProgress = true;
    this.creationAttempts++;
  }

  /**
   * Mark conversation creation as completed
   */
  completeCreation(conversationId: string): void {
    this.initializationInProgress = false;
    this.lastConversationCreated = conversationId;
    this.creationAttempts = 0;
  }

  /**
   * Mark conversation creation as failed
   */
  failCreation(): void {
    this.initializationInProgress = false;
    // Don't reset attempts to prevent rapid retries
  }

  /**
   * Reset protection state (for new sessions)
   */
  reset(): void {
    this.initializationInProgress = false;
    this.lastConversationCreated = null;
    this.creationAttempts = 0;
  }

  /**
   * Get current protection status
   */
  getStatus() {
    return {
      initializationInProgress: this.initializationInProgress,
      lastConversationCreated: this.lastConversationCreated,
      creationAttempts: this.creationAttempts,
      canCreate: this.canCreateConversation(),
    };
  }
}

export const conversationProtection =
  ConversationProtectionService.getInstance();
