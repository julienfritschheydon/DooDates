/**
 * Hook centralisé pour la création de formulaires
 * Utilisé par FormPollCreator (manuel) et EditorStateProvider (IA)
 */

import { usePolls, type FormPollData } from "./usePolls";
import { logger } from "@/lib/logger";
import type { Poll } from "@/lib/pollStorage";

export interface FormQuestion {
  id: string;
  type: string;
  title: string;
  required?: boolean;
  options?: Array<{ id: string; label: string; isOther?: boolean }>;
  maxChoices?: number;
  placeholder?: string;
  maxLength?: number;
  matrixRows?: any[];
  matrixColumns?: any[];
  matrixType?: "single" | "multiple";
  matrixColumnsNumeric?: boolean;
  ratingScale?: number;
  ratingStyle?: "numbers" | "stars" | "emojis";
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  validationType?: "email" | "phone" | "url" | "number" | "date";
}

export interface CreateFormPollParams {
  title: string;
  description?: string;
  questions: FormQuestion[];
  settings?: {
    allowAnonymousResponses?: boolean;
    expiresAt?: string;
  };
}

export function useFormPollCreation() {
  const { createPoll } = usePolls();

  const createFormPoll = async (
    params: CreateFormPollParams,
  ): Promise<{ poll?: Poll; error?: string }> => {
    try {
      logger.info("💾 Création formulaire via useFormPollCreation", "poll", {
        title: params.title,
      });

      // Mapper les questions au format attendu par createPoll
      const formPollData: FormPollData = {
        type: "form",
        title: params.title,
        description: params.description,
        questions: params.questions.map((q) => ({
          id: q.id,
          kind: q.type as any,
          title: q.title,
          required: q.required || false,
          options: q.options,
          maxChoices: q.maxChoices,
          type: q.type as any, // Legacy compatibility
          placeholder: q.placeholder,
          maxLength: q.maxLength,
          matrixRows: q.matrixRows,
          matrixColumns: q.matrixColumns,
          matrixType: q.matrixType,
          matrixColumnsNumeric: q.matrixColumnsNumeric,
          ratingScale: q.ratingScale,
          ratingStyle: q.ratingStyle,
          ratingMinLabel: q.ratingMinLabel,
          ratingMaxLabel: q.ratingMaxLabel,
          validationType: q.validationType,
        })),
        settings: params.settings || {
          allowAnonymousResponses: true,
          expiresAt: undefined,
        },
      };

      const result = await createPoll(formPollData);

      if (result.error || !result.poll) {
        logger.error("❌ Erreur création formulaire", "poll", {
          error: result.error,
        });
        return { error: result.error || "Impossible de créer le formulaire" };
      }

      logger.info("✅ Formulaire créé et sauvegardé dans Supabase", "poll", {
        pollId: result.poll.id,
        conversationId: result.poll.conversationId,
      });

      return { poll: result.poll };
    } catch (error: any) {
      logger.error("❌ Exception création formulaire", "poll", { error });
      return { error: error.message || "Erreur inconnue" };
    }
  };

  return { createFormPoll };
}
