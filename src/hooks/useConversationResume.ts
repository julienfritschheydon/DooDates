/**
 * useConversationResume Hook
 * Handle conversation resumption via URL parameters
 * DooDates - Conversation History System
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAutoSave } from "./useAutoSave";
import { ErrorFactory } from "../lib/error-handling";
import { ConversationStorageLocal } from "@/lib/storage/ConversationStorageLocal";
import { logger } from "@/lib/logger";

import type { Conversation } from "../types/conversation";

export interface UseConversationResumeReturn {
  /** Whether a conversation is being resumed */
  isResuming: boolean;
  /** The resumed conversation data */
  resumedConversation: Conversation | null;
  /** Error during resume process */
  resumeError: string | null;
  /** Manually resume a conversation by ID */
  resumeById: (conversationId: string) => Promise<void>;
  /** Clear resume state */
  clearResume: () => void;
}

export const useConversationResume = (): UseConversationResumeReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoSave = useAutoSave({ debug: true });

  const [isResuming, setIsResuming] = useState(false);
  const [resumedConversation, setResumedConversation] =
    useState<Conversation | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Resume conversation by ID
  const resumeById = useCallback(
    async (conversationId: string): Promise<void> => {
      setIsResuming(true);
      setResumeError(null);

      try {
        const conversation = await autoSave.resumeConversation(conversationId);

        if (conversation) {
          setResumedConversation(conversation);

          // Update URL to include resume parameter
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("resume", conversationId);
          setSearchParams(newSearchParams, { replace: true });

          logger.debug("Successfully resumed conversation", "conversation", {
            title: conversation.title,
          });
        } else {
          throw ErrorFactory.storage(
            "Conversation not found",
            "Conversation non trouvée",
            { conversationId },
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to resume conversation";
        setResumeError(errorMessage);
        logger.error("Failed to resume conversation", "conversation", {
          error,
        });

        // Remove invalid resume parameter from URL to prevent infinite loop
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("resume");
        setSearchParams(newSearchParams, { replace: true });
      } finally {
        setIsResuming(false);
      }
    },
    [autoSave, searchParams, setSearchParams],
  );

  // Clear resume state
  const clearResume = useCallback(() => {
    setResumedConversation(null);
    setResumeError(null);

    // Remove resume parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("resume");
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle URL parameter on mount and changes
  useEffect(() => {
    const resumeParam = searchParams.get("resume");

    if (resumeParam && !resumedConversation && !isResuming && !resumeError) {
      // Resuming conversation from URL parameter (reduced logging)
      resumeById(resumeParam).catch(() => {
        // If resume fails, clear the invalid parameter to prevent infinite retry
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("resume");
        setSearchParams(newSearchParams, { replace: true });
      });
    }
  }, [
    searchParams,
    resumedConversation,
    isResuming,
    resumeError,
    resumeById,
    setSearchParams,
  ]);

  return {
    isResuming,
    resumedConversation,
    resumeError,
    resumeById,
    clearResume,
  };
};
