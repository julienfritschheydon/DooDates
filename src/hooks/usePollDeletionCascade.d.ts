/**
 * Hook for managing cascade deletion of polls and their conversation links
 * DooDates - Poll Deletion Cascade Management
 */
export interface PollDeletionResult {
  success: boolean;
  conversationUpdated?: boolean;
  conversationDeleted?: boolean;
  error?: string;
}
export interface PollDeletionOptions {
  deleteConversation?: boolean;
}
export declare const usePollDeletionCascade: () => {
  deletePollWithCascade: (
    pollId: string,
    options?: PollDeletionOptions,
  ) => Promise<PollDeletionResult>;
  cleanupConversationLink: (pollId: string) => Promise<boolean>;
  checkPollLinks: (pollId: string) => {
    hasLinks: boolean;
    linkedConversations: string[];
  };
  getOrphanedLinks: () => string[];
  cleanupOrphanedLinks: () => Promise<number>;
  isDeleting: boolean;
  deleteError: import("../types/conversation").ConversationError;
};
export default usePollDeletionCascade;
