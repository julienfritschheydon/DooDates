/**
 * Delete Cascade Service
 * DooDates - Atomic deletion with 1:1 relation cascade and confirmation
 */
import type { Conversation, ConversationMessage } from "../../types/conversation";
export interface DeleteCascadeOptions {
    /** Language for confirmation messages */
    language?: "fr" | "en";
    /** Skip confirmation (for programmatic deletion) */
    skipConfirmation?: boolean;
    /** Dry run - return what would be deleted without actually deleting */
    dryRun?: boolean;
}
export interface DeleteCascadeResult {
    /** Whether the deletion was successful */
    success: boolean;
    /** Items that were deleted */
    deleted: {
        conversations: string[];
        messages: string[];
        polls: string[];
    };
    /** Confirmation messages for UI */
    confirmationMessages: {
        title: string;
        description: string;
        warningText: string;
        confirmButtonText: string;
        cancelButtonText: string;
    };
    /** Error message if deletion failed */
    error?: string;
    /** Rollback function in case of partial failure */
    rollback?: () => Promise<void>;
}
export interface DeleteCascadeContext {
    /** Storage functions for conversations */
    conversationStorage: {
        getConversation: (id: string) => Promise<Conversation | null>;
        deleteConversation: (id: string) => Promise<void>;
        getMessages: (conversationId: string) => Promise<ConversationMessage[]>;
        deleteMessages: (conversationId: string) => Promise<void>;
    };
    /** Storage functions for polls */
    pollStorage: {
        getPoll: (id: string) => Promise<any | null>;
        deletePoll: (id: string) => Promise<void>;
        findPollByConversationId: (conversationId: string) => Promise<any | null>;
    };
}
/**
 * Prepare cascade deletion with confirmation messages
 */
export declare function prepareCascadeDelete(conversationId: string, context: DeleteCascadeContext, options?: DeleteCascadeOptions): Promise<DeleteCascadeResult>;
/**
 * Execute cascade deletion with atomic rollback
 */
export declare function executeCascadeDelete(conversationId: string, context: DeleteCascadeContext, options?: DeleteCascadeOptions): Promise<DeleteCascadeResult>;
/**
 * Utility function to check if conversation has related content
 */
export declare function hasRelatedContent(conversationId: string, context: DeleteCascadeContext): Promise<{
    hasMessages: boolean;
    hasPoll: boolean;
    messageCount: number;
}>;
