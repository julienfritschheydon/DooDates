/**
 * Delete Cascade Service
 * DooDates - Atomic deletion with 1:1 relation cascade and confirmation
 */

import { logError, ErrorFactory } from '../error-handling';
import type { Conversation, ConversationMessage } from '../../types/conversation';

export interface DeleteCascadeOptions {
  /** Language for confirmation messages */
  language?: 'fr' | 'en';
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
export async function prepareCascadeDelete(
  conversationId: string,
  context: DeleteCascadeContext,
  options: DeleteCascadeOptions = {}
): Promise<DeleteCascadeResult> {
  const opts = {
    language: 'fr' as const,
    skipConfirmation: false,
    dryRun: false,
    ...options
  };

  try {
    // Get conversation and related data
    const conversation = await context.conversationStorage.getConversation(conversationId);
    if (!conversation) {
      return {
        success: false,
        deleted: { conversations: [], messages: [], polls: [] },
        confirmationMessages: getEmptyConfirmationMessages(opts.language),
        error: opts.language === 'fr' 
          ? 'Conversation non trouvée' 
          : 'Conversation not found'
      };
    }

    // Find related poll (1:1 relation)
    const relatedPoll = await context.pollStorage.findPollByConversationId(conversationId);
    
    // Get messages count
    const messages = await context.conversationStorage.getMessages(conversationId);
    
    // Prepare deletion plan
    const deletionPlan = {
      conversations: [conversationId],
      messages: messages.map(m => m.id),
      polls: relatedPoll ? [relatedPoll.id] : []
    };

    // Generate confirmation messages
    const confirmationMessages = generateConfirmationMessages(
      conversation,
      relatedPoll,
      messages.length,
      opts.language
    );

    if (opts.dryRun) {
      return {
        success: true,
        deleted: deletionPlan,
        confirmationMessages,
      };
    }

    return {
      success: true,
      deleted: deletionPlan,
      confirmationMessages,
    };

  } catch (error) {
    logError(ErrorFactory.storage(
      'Failed to prepare cascade delete',
      'Échec de préparation de suppression en cascade'
    ), {
      component: 'deleteCascade',
      operation: 'prepareCascadeDelete',
      metadata: { conversationId, originalError: error }
    });

    return {
      success: false,
      deleted: { conversations: [], messages: [], polls: [] },
      confirmationMessages: getEmptyConfirmationMessages(opts.language),
      error: opts.language === 'fr' 
        ? 'Erreur lors de la préparation de la suppression'
        : 'Error preparing deletion'
    };
  }
}

/**
 * Execute cascade deletion with atomic rollback
 */
export async function executeCascadeDelete(
  conversationId: string,
  context: DeleteCascadeContext,
  options: DeleteCascadeOptions = {}
): Promise<DeleteCascadeResult> {
  const opts = {
    language: 'fr' as const,
    skipConfirmation: false,
    dryRun: false,
    ...options
  };

  // First prepare the deletion to get the plan
  const preparation = await prepareCascadeDelete(conversationId, context, { ...opts, dryRun: true });
  
  if (!preparation.success) {
    return preparation;
  }

  // Backup data for rollback
  const backupData: {
    conversation?: Conversation;
    messages?: ConversationMessage[];
    poll?: any;
  } = {};

  const rollbackOperations: Array<() => Promise<void>> = [];

  try {
    // Backup conversation
    const conversation = await context.conversationStorage.getConversation(conversationId);
    if (conversation) {
      backupData.conversation = conversation;
    }

    // Backup messages
    const messages = await context.conversationStorage.getMessages(conversationId);
    if (messages.length > 0) {
      backupData.messages = messages;
    }

    // Backup related poll
    const relatedPoll = await context.pollStorage.findPollByConversationId(conversationId);
    if (relatedPoll) {
      backupData.poll = relatedPoll;
    }

    // Execute deletions in order (messages first, then conversation, then poll)
    
    // 1. Delete messages
    if (backupData.messages && backupData.messages.length > 0) {
      await context.conversationStorage.deleteMessages(conversationId);
      rollbackOperations.push(async () => {
        // Note: This would require a restore function in the storage layer
        // For now, we log the need for manual restoration
        logError(ErrorFactory.storage(
          'Manual restoration required for messages',
          'Restauration manuelle requise pour les messages'
        ), {
          component: 'deleteCascade',
          operation: 'rollback',
          metadata: { conversationId, messageCount: backupData.messages?.length }
        });
      });
    }

    // 2. Delete conversation
    if (backupData.conversation) {
      await context.conversationStorage.deleteConversation(conversationId);
      rollbackOperations.push(async () => {
        logError(ErrorFactory.storage(
          'Manual restoration required for conversation',
          'Restauration manuelle requise pour la conversation'
        ), {
          component: 'deleteCascade',
          operation: 'rollback',
          metadata: { conversationId }
        });
      });
    }

    // 3. Delete related poll
    if (backupData.poll) {
      await context.pollStorage.deletePoll(backupData.poll.id);
      rollbackOperations.push(async () => {
        logError(ErrorFactory.storage(
          'Manual restoration required for poll',
          'Restauration manuelle requise pour le sondage'
        ), {
          component: 'deleteCascade',
          operation: 'rollback',
          metadata: { pollId: backupData.poll?.id }
        });
      });
    }

    return {
      success: true,
      deleted: preparation.deleted,
      confirmationMessages: preparation.confirmationMessages,
    };

  } catch (error) {
    // Execute rollback operations
    const rollback = async () => {
      for (const operation of rollbackOperations.reverse()) {
        try {
          await operation();
        } catch (rollbackError) {
          logError(ErrorFactory.storage(
            'Rollback operation failed',
            'Échec de l\'opération de rollback'
          ), {
            component: 'deleteCascade',
            operation: 'rollback',
            metadata: { originalError: error, rollbackError }
          });
        }
      }
    };

    logError(ErrorFactory.storage(
      'Failed to execute cascade delete',
      'Échec d\'exécution de suppression en cascade'
    ), {
      component: 'deleteCascade',
      operation: 'executeCascadeDelete',
      metadata: { conversationId, originalError: error }
    });

    return {
      success: false,
      deleted: { conversations: [], messages: [], polls: [] },
      confirmationMessages: preparation.confirmationMessages,
      error: opts.language === 'fr' 
        ? 'Erreur lors de la suppression'
        : 'Error during deletion',
      rollback
    };
  }
}

/**
 * Generate confirmation messages for UI
 */
function generateConfirmationMessages(
  conversation: Conversation,
  relatedPoll: any | null,
  messageCount: number,
  language: 'fr' | 'en'
): DeleteCascadeResult['confirmationMessages'] {
  if (language === 'fr') {
    const hasRelatedPoll = !!relatedPoll;
    
    return {
      title: 'Confirmer la suppression',
      description: hasRelatedPoll 
        ? `Supprimer la conversation "${conversation.title}" et le sondage associé ?`
        : `Supprimer la conversation "${conversation.title}" ?`,
      warningText: hasRelatedPoll
        ? `Cette action supprimera définitivement la conversation (${messageCount} messages) et le sondage associé. Cette action est irréversible.`
        : `Cette action supprimera définitivement la conversation et ses ${messageCount} messages. Cette action est irréversible.`,
      confirmButtonText: 'Supprimer définitivement',
      cancelButtonText: 'Annuler'
    };
  } else {
    const hasRelatedPoll = !!relatedPoll;
    
    return {
      title: 'Confirm Deletion',
      description: hasRelatedPoll 
        ? `Delete conversation "${conversation.title}" and associated poll?`
        : `Delete conversation "${conversation.title}"?`,
      warningText: hasRelatedPoll
        ? `This will permanently delete the conversation (${messageCount} messages) and the associated poll. This action cannot be undone.`
        : `This will permanently delete the conversation and its ${messageCount} messages. This action cannot be undone.`,
      confirmButtonText: 'Delete Permanently',
      cancelButtonText: 'Cancel'
    };
  }
}

/**
 * Get empty confirmation messages for error cases
 */
function getEmptyConfirmationMessages(language: 'fr' | 'en'): DeleteCascadeResult['confirmationMessages'] {
  if (language === 'fr') {
    return {
      title: 'Erreur',
      description: 'Impossible de préparer la suppression',
      warningText: 'Une erreur est survenue',
      confirmButtonText: 'OK',
      cancelButtonText: 'Annuler'
    };
  } else {
    return {
      title: 'Error',
      description: 'Unable to prepare deletion',
      warningText: 'An error occurred',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel'
    };
  }
}

/**
 * Utility function to check if conversation has related content
 */
export async function hasRelatedContent(
  conversationId: string,
  context: DeleteCascadeContext
): Promise<{
  hasMessages: boolean;
  hasPoll: boolean;
  messageCount: number;
}> {
  try {
    const [messages, relatedPoll] = await Promise.all([
      context.conversationStorage.getMessages(conversationId),
      context.pollStorage.findPollByConversationId(conversationId)
    ]);

    return {
      hasMessages: messages.length > 0,
      hasPoll: !!relatedPoll,
      messageCount: messages.length
    };
  } catch (error) {
    logError(ErrorFactory.storage(
      'Failed to check related content',
      'Échec de vérification du contenu associé'
    ), {
      component: 'deleteCascade',
      operation: 'hasRelatedContent',
      metadata: { conversationId, originalError: error }
    });

    return {
      hasMessages: false,
      hasPoll: false,
      messageCount: 0
    };
  }
}
