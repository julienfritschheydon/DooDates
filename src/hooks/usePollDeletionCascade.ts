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
  error?: string;
}

export const usePollDeletionCascade = () => {
  const conversations = useConversations();

  /**
   * Clean up conversation metadata when a poll is deleted
   */
  const cleanupConversationLink = useCallback(
    async (pollId: string): Promise<boolean> => {
      try {
        // Find conversations that have this poll linked
        const conversationsWithPoll =
          conversations.conversations.conversations?.filter((conv) =>
            conv.tags?.some((tag) => tag === `poll:${pollId}`),
          ) || [];

        // Update each conversation to remove the poll link
        for (const conversation of conversationsWithPoll) {
          const updatedTags = conversation.tags?.filter((tag) => tag !== `poll:${pollId}`) || [];

          await conversations.updateConversation.mutateAsync({
            id: conversation.id,
            updates: {
              tags: updatedTags,
            },
          });

          logger.info("Removed poll link from conversation", "conversation", {
            conversationId: conversation.id,
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
   */
  const deletePollWithCascade = useCallback(
    async (pollId: string): Promise<PollDeletionResult> => {
      try {
        // First, clean up conversation links
        const conversationCleanup = await cleanupConversationLink(pollId);

        // Then delete the poll from localStorage (dev implementation)
        try {
          const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
          const updatedPolls = polls.filter((poll: any) => poll.id !== pollId);
          localStorage.setItem("dev-polls", JSON.stringify(updatedPolls));

          logger.info("Poll deleted successfully", "poll", { pollId });

          return {
            success: true,
            conversationUpdated: conversationCleanup,
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
            conversationUpdated: conversationCleanup,
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
          error: processedError.message || "Poll deletion cascade failed",
        };
      }
    },
    [cleanupConversationLink],
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
        conversations.conversations.conversations?.filter((conv) =>
          conv.tags?.some((tag) => tag === `poll:${pollId}`),
        ) || [];

      return {
        hasLinks: conversationsWithPoll.length > 0,
        linkedConversations: conversationsWithPoll.map((conv) => conv.id),
      };
    },
    [conversations.conversations.conversations],
  );

  /**
   * Get orphaned conversation links (conversations that reference non-existent polls)
   */
  const getOrphanedLinks = useCallback((): string[] => {
    try {
      const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
      const existingPollIds = new Set(polls.map((poll: any) => poll.id));

      const orphanedConversations: string[] = [];

      conversations.conversations.conversations?.forEach((conv) => {
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
  }, [conversations.conversations.conversations]);

  /**
   * Clean up all orphaned conversation links
   */
  const cleanupOrphanedLinks = useCallback(async (): Promise<number> => {
    const orphanedConversationIds = getOrphanedLinks();
    let cleanedCount = 0;

    try {
      const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
      const existingPollIds = new Set(polls.map((poll: any) => poll.id));

      for (const conversationId of orphanedConversationIds) {
        const conversation = conversations.conversations.conversations?.find(
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
          await conversations.updateConversation.mutateAsync({
            id: conversationId,
            updates: {
              tags: cleanTags,
            },
          });
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
    isDeleting: conversations.updateConversation.isLoading,
    deleteError: conversations.updateConversation.error,
  };
};

export default usePollDeletionCascade;
