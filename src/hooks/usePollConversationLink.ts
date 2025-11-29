/**
 * Hook for managing bidirectional links between polls and conversations
 * DooDates - Poll-Conversation Linking System
 */

import { useCallback } from "react";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "@/lib/logger";
import { useConversations } from "./useConversations";

export interface PollLinkMetadata {
  conversationId: string;
  messageId: string;
  conversationTitle?: string;
  generatedAt: string;
}

export interface ConversationLinkMetadata {
  pollId: string;
  pollTitle: string;
  createdAt: string;
}

export const usePollConversationLink = () => {
  const conversations = useConversations();

  /**
   * Link a poll to a conversation by updating conversation metadata
   */
  const linkPollToConversation = useCallback(
    async (
      conversationId: string,
      pollData: {
        pollId: string;
        pollTitle: string;
        messageId?: string;
      },
    ) => {
      try {
        const linkMetadata: ConversationLinkMetadata = {
          pollId: pollData.pollId,
          pollTitle: pollData.pollTitle,
          createdAt: new Date().toISOString(),
        };

        // Update conversation with poll link
        await conversations.updateConversation.mutateAsync({
          id: conversationId,
          updates: {
            tags: [`poll:${pollData.pollId}`],
          },
        });

        logger.info("Poll linked to conversation", "poll", {
          conversationId,
          pollId: pollData.pollId,
        });
        return true;
      } catch (error) {
        logError(error as Error, {
          component: "usePollConversationLink",
          operation: "linkPollToConversation",
          conversationId,
          pollId: pollData.pollId,
        });
        return false;
      }
    },
    [conversations.updateConversation],
  );

  /**
   * Get poll metadata for linking to conversation
   */
  const getPollLinkMetadata = useCallback(
    (conversationId: string, messageId: string, conversationTitle?: string): PollLinkMetadata => {
      return {
        conversationId,
        messageId,
        conversationTitle,
        generatedAt: new Date().toISOString(),
      };
    },
    [],
  );

  /**
   * Navigate to conversation from poll
   */
  const navigateToConversation = useCallback((conversationId: string) => {
    // This will be implemented when we have routing
    // For now, we can use URL parameters or local storage
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("conversation", conversationId);
    currentUrl.searchParams.set("source", "poll");

    // Store navigation intent in localStorage for the chat interface
    localStorage.setItem(
      "resumeConversation",
      JSON.stringify({
        conversationId,
        source: "poll",
        timestamp: new Date().toISOString(),
      }),
    );

    // Navigate to chat interface
    window.location.href = currentUrl.toString();
  }, []);

  /**
   * Navigate to poll from conversation
   */
  const navigateToPoll = useCallback((pollId: string) => {
    // Navigate to poll page
    const pollUrl = `/poll/${pollId}?source=conversation`;
    window.location.href = pollUrl;
  }, []);

  /**
   * Check if a conversation has linked polls
   */
  const hasLinkedPoll = useCallback(
    (conversationId: string) => {
      const conversationState = conversations.useConversation(conversationId);
      return conversationState.conversation?.tags?.some((tag) => tag.startsWith("poll:")) || false;
    },
    [conversations],
  );

  /**
   * Get linked poll information from conversation
   */
  const getLinkedPoll = useCallback(
    (conversationId: string) => {
      const conversationState = conversations.useConversation(conversationId);
      const pollTag = conversationState.conversation?.tags?.find((tag) => tag.startsWith("poll:"));
      if (pollTag) {
        const pollId = pollTag.replace("poll:", "");
        return {
          pollId,
          pollTitle: "Poll",
          createdAt: new Date().toISOString(),
        } as ConversationLinkMetadata;
      }
      return undefined;
    },
    [conversations],
  );

  return {
    // Linking functions
    linkPollToConversation,
    getPollLinkMetadata,

    // Navigation functions
    navigateToConversation,
    navigateToPoll,

    // Query functions
    hasLinkedPoll,
    getLinkedPoll,

    // State
    isLinking: conversations.updateConversation.isLoading,
    linkError: conversations.updateConversation.error,
  };
};

export default usePollConversationLink;
