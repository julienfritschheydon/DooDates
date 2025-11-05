/**
 * Hook for managing cascade deletion of polls and their conversation links
 * DooDates - Poll Deletion Cascade Management
 */

import { useCallback } from "react";
import { useConversations } from "./useConversations";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "@/lib/logger";

export interface PollDeletionResult {
  success: boolean;
  conversationUpdated?: boolean;
  conversationDeleted?: boolean;
  error?: string;
}

export interface PollDeletionOptions {
  deleteConversation?: boolean;
}

export const usePollDeletionCascade = () => {
  const conversations = useConversations();

  /**
   * Clean up conversation metadata when a poll is deleted
   */
  const cleanupConversationLink = useCallback(
    async (pollId: string): Promise<boolean> => {
      try {
        // Find conversations that have this poll linked via tags or pollId field
        const conversationsWithPoll =
          conversations.conversations?.conversations?.filter(
            (conv) =>
              conv.tags?.some((tag) => tag === `poll:${pollId}`) ||
              (conv as any).pollId === pollId ||
              conv.relatedPollId === pollId,
          ) || [];

        // Update each conversation to remove all poll references
        for (const conversation of conversationsWithPoll) {
          // Remove poll tag
          const updatedTags = conversation.tags?.filter((tag) => tag !== `poll:${pollId}`) || [];

          // Clean metadata to remove poll-related information
          const cleanMetadata = conversation.metadata
            ? {
                ...conversation.metadata,
                pollGenerated: undefined,
                pollTitle: undefined,
                pollId: undefined,
              }
            : undefined;

          if (conversations.updateConversation) {
            await conversations.updateConversation.mutateAsync({
              id: conversation.id,
              updates: {
                tags: updatedTags,
                relatedPollId: undefined,
              },
            });
          }

          logger.info("Removed poll link from conversation", "conversation", {
            conversationId: conversation.id,
            pollId,
          });
        }

        return true;
      } catch (error) {
        const processedError = handleError(
          error,
          {
            component: "usePollDeletionCascade",
            operation: "cleanupConversationLink",
          },
          "Erreur lors du nettoyage des liens de conversation",
        );

        logError(processedError, {
          component: "usePollDeletionCascade",
          operation: "cleanupConversationLink",
        });

        return false;
      }
    },
    [conversations],
  );

  /**
   * Delete a poll and clean up all associated conversation links
   * @param pollId - The ID of the poll to delete
   * @param options - Options for deletion (e.g., whether to delete the conversation)
   */
  const deletePollWithCascade = useCallback(
    async (pollId: string, options: PollDeletionOptions = {}): Promise<PollDeletionResult> => {
      try {
        let conversationDeleted = false;

        // Find conversations linked to this poll
        const conversationsWithPoll =
          conversations.conversations?.conversations?.filter(
            (conv) =>
              conv.tags?.some((tag) => tag === `poll:${pollId}`) ||
              (conv as any).pollId === pollId ||
              conv.relatedPollId === pollId,
          ) || [];

        // If deleteConversation option is true, delete the conversations
        if (
          options.deleteConversation &&
          conversationsWithPoll.length > 0 &&
          conversations.deleteConversation
        ) {
          for (const conversation of conversationsWithPoll) {
            await conversations.deleteConversation.mutateAsync(conversation.id);
            logger.info("Deleted conversation linked to poll", "conversation", {
              conversationId: conversation.id,
              pollId,
            });
          }
          conversationDeleted = true;
        } else {
          // Otherwise, just clean up the links
          await cleanupConversationLink(pollId);
        }

        // Then delete the poll using centralized pollStorage (to trigger pollsChanged event)
        try {
          const { deletePollById } = await import("../lib/pollStorage");
          deletePollById(pollId);

          logger.info("Poll deleted successfully", "poll", { pollId });

          return {
            success: true,
            conversationUpdated: !conversationDeleted,
            conversationDeleted,
          };
        } catch (pollError) {
          const processedError = handleError(
            pollError,
            {
              component: "usePollDeletionCascade",
              operation: "deletePoll",
            },
            "Erreur lors de la suppression du sondage",
          );

          logError(processedError, {
            component: "usePollDeletionCascade",
            operation: "deletePoll",
          });

          return {
            success: false,
            conversationUpdated: !conversationDeleted,
            conversationDeleted,
            error: processedError.message || "Failed to delete poll",
          };
        }
      } catch (error) {
        const processedError = handleError(
          error,
          {
            component: "usePollDeletionCascade",
            operation: "deletePollWithCascade",
          },
          "Erreur lors de la suppression en cascade du sondage",
        );

        logError(processedError, {
          component: "usePollDeletionCascade",
          operation: "deletePollWithCascade",
        });

        return {
          success: false,
          conversationUpdated: false,
          conversationDeleted: false,
          error: processedError.message || "Poll deletion cascade failed",
        };
      }
    },
    [cleanupConversationLink, conversations],
  );

  /**
   * Check if a poll has linked conversations before deletion
   */
  const checkPollLinks = useCallback(
    (
      pollId: string,
    ): {
      hasLinks: boolean;
      linkedConversations: string[];
    } => {
      const conversationsWithPoll =
        conversations.conversations?.conversations?.filter((conv) =>
          conv.tags?.some((tag) => tag === `poll:${pollId}`),
        ) || [];

      return {
        hasLinks: conversationsWithPoll.length > 0,
        linkedConversations: conversationsWithPoll.map((conv) => conv.id),
      };
    },
    [conversations.conversations?.conversations],
  );

  /**
   * Get orphaned conversation links (conversations that reference non-existent polls)
   */
  const getOrphanedLinks = useCallback((): string[] => {
    try {
      const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
      const existingPollIds = new Set(polls.map((poll: any) => poll.id));

      const orphanedConversations: string[] = [];

      conversations.conversations?.conversations?.forEach((conv) => {
        const pollTags = conv.tags?.filter((tag) => tag.startsWith("poll:")) || [];

        pollTags.forEach((tag) => {
          const pollId = tag.replace("poll:", "");
          if (!existingPollIds.has(pollId)) {
            orphanedConversations.push(conv.id);
          }
        });
      });

      return orphanedConversations;
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "usePollDeletionCascade",
          operation: "getOrphanedLinks",
        },
        "Erreur lors de la vérification des liens orphelins",
      );

      logError(processedError, {
        component: "usePollDeletionCascade",
        operation: "getOrphanedLinks",
      });

      return [];
    }
  }, [conversations.conversations?.conversations]);

  /**
   * Clean up all orphaned conversation links
   */
  const cleanupOrphanedLinks = useCallback(async (): Promise<number> => {
    const orphanedConversationIds = getOrphanedLinks();
    let cleanedCount = 0;

    try {
      const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
      const existingPollIds = new Set(polls.map((poll: any) => poll.id));

      for (const conversationId of orphanedConversationIds) {
        const conversation = conversations.conversations?.conversations?.find(
          (c) => c.id === conversationId,
        );
        if (!conversation) continue;

        const cleanTags =
          conversation.tags?.filter((tag) => {
            if (!tag.startsWith("poll:")) return true;
            const pollId = tag.replace("poll:", "");
            return existingPollIds.has(pollId);
          }) || [];

        if (cleanTags.length !== conversation.tags?.length) {
          if (conversations.updateConversation) {
            await conversations.updateConversation.mutateAsync({
              id: conversationId,
              updates: {
                tags: cleanTags,
              },
            });
          }
          cleanedCount++;
        }
      }

      logger.info("Cleaned up orphaned conversation links", "conversation", {
        cleanedCount,
      });
      return cleanedCount;
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "usePollDeletionCascade",
          operation: "cleanupOrphanedLinks",
        },
        "Erreur lors du nettoyage des liens orphelins",
      );

      logError(processedError, {
        component: "usePollDeletionCascade",
        operation: "cleanupOrphanedLinks",
      });

      return 0;
    }
  }, [getOrphanedLinks, conversations]);

  return {
    // Deletion functions
    deletePollWithCascade,
    cleanupConversationLink,

    // Utility functions
    checkPollLinks,
    getOrphanedLinks,
    cleanupOrphanedLinks,

    // State
    isDeleting: conversations.updateConversation?.isLoading ?? false,
    deleteError: conversations.updateConversation?.error,
  };
};

export default usePollDeletionCascade;
