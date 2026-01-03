/* eslint-disable @typescript-eslint/no-explicit-any */
// Quizz Draft Service
// Auto-save functionality for quiz creation
// DooDates - Quizz Product

import { ErrorFactory, logError } from "@/lib/error-handling";
import { logger } from "@/lib/logger";
import type { Quizz, QuizzQuestion, QuizzSettings } from "./quizz-service";

export interface QuizzDraft {
  id: string;
  title: string;
  description: string;
  questions: QuizzQuestion[];
  settings: QuizzSettings;
  createdAt: string;
  updatedAt: string;
}

const DRAFT_KEY = "doodates_quizz_draft";
const DRAFT_METADATA_KEY = "doodates_quizz_draft_metadata";

export interface DraftMetadata {
  id: string;
  hasContent: boolean;
  lastActivity: string;
  questionCount: number;
}

/**
 * Save quiz draft to localStorage
 */
export function saveQuizzDraft(draft: QuizzDraft): void {
  try {
    if (!hasWindow()) return;

    // Validate draft before saving
    if (!draft || !draft.id) {
      throw ErrorFactory.validation(
        "Invalid draft data",
        "Les données du brouillon sont invalides",
        { draft },
      );
    }

    // Update timestamps
    draft.updatedAt = new Date().toISOString();
    if (!draft.createdAt) {
      draft.createdAt = draft.updatedAt;
    }

    // Save draft
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    // Save metadata for quick checks
    const metadata: DraftMetadata = {
      id: draft.id,
      hasContent: !!(draft.title.trim() || draft.questions.length > 0),
      lastActivity: draft.updatedAt,
      questionCount: draft.questions.length,
    };
    window.localStorage.setItem(DRAFT_METADATA_KEY, JSON.stringify(metadata));

    logger.info("Quiz draft saved successfully", "general", {
      draftId: draft.id,
      questionCount: draft.questions.length,
      hasTitle: !!draft.title.trim(),
    });
  } catch (error) {
    logError(error, { operation: "saveQuizzDraft", metadata: { draftId: draft?.id } });
    throw error;
  }
}

/**
 * Load quiz draft from localStorage
 */
export function loadQuizzDraft(): QuizzDraft | null {
  try {
    if (!hasWindow()) return null;

    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw || raw.trim() === "") return null;

    try {
      const draft = JSON.parse(raw);
      
      // Basic validation
      if (!draft || !draft.id || typeof draft.title !== "string") {
        logger.warn("Invalid quiz draft format, clearing...", "general");
        clearQuizzDraft();
        return null;
      }

      // Ensure questions array exists
      if (!Array.isArray(draft.questions)) {
        draft.questions = [];
      }

      // Ensure settings exist with defaults
      if (!draft.settings) {
        draft.settings = getDefaultQuizzSettings();
      }

      logger.info("Quiz draft loaded successfully", "general", {
        draftId: draft.id,
        questionCount: draft.questions.length,
        hasTitle: !!draft.title.trim(),
        lastUpdated: draft.updatedAt,
      });

      return draft;
    } catch (parseError) {
      logger.warn("Failed to parse quiz draft, clearing...", "general", { error: parseError });
      clearQuizzDraft();
      return null;
    }
  } catch (error) {
    logError(error, { operation: "loadQuizzDraft" });
    return null;
  }
}

/**
 * Get draft metadata without loading full draft
 */
export function getDraftMetadata(): DraftMetadata | null {
  try {
    if (!hasWindow()) return null;

    const raw = window.localStorage.getItem(DRAFT_METADATA_KEY);
    if (!raw || raw.trim() === "") return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  } catch (error) {
    logError(error, { operation: "getDraftMetadata" });
    return null;
  }
}

/**
 * Clear quiz draft from localStorage
 */
export function clearQuizzDraft(): void {
  try {
    if (!hasWindow()) return;

    window.localStorage.removeItem(DRAFT_KEY);
    window.localStorage.removeItem(DRAFT_METADATA_KEY);

    logger.info("Quiz draft cleared", "general");
  } catch (error) {
    logError(error, { operation: "clearQuizzDraft" });
  }
}

/**
 * Check if a draft exists and has content
 */
export function hasDraftWithContent(): boolean {
  const metadata = getDraftMetadata();
  return !!(metadata?.hasContent);
}

/**
 * Get draft age in hours
 */
export function getDraftAge(): number {
  const metadata = getDraftMetadata();
  if (!metadata?.lastActivity) return Infinity;

  const lastActivity = new Date(metadata.lastActivity).getTime();
  const now = new Date().getTime();
  const ageMs = now - lastActivity;
  
  return ageMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Check if draft is old (older than 24 hours)
 */
export function isDraftOld(): boolean {
  return getDraftAge() > 24;
}

/**
 * Convert draft to full quiz object
 */
export function draftToQuizz(draft: QuizzDraft): Omit<Quizz, "id" | "slug" | "status" | "created_at" | "updated_at" | "creator_id" | "type"> {
  const maxPoints = draft.questions.reduce((sum, q) => sum + (q.points || 1), 0);

  return {
    title: draft.title,
    description: draft.description,
    questions: draft.questions,
    settings: draft.settings,
    maxPoints,
  };
}

/**
 * Get default quiz settings
 */
function getDefaultQuizzSettings(): QuizzSettings {
  return {
    allowAnonymousResponses: false,
    showCorrectAnswers: true,
    allowRetakes: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    maxResponses: undefined,
  };
}

/**
 * Create a new empty draft
 */
export function createEmptyDraft(): QuizzDraft {
  const now = new Date().toISOString();
  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: "",
    description: "",
    questions: [],
    settings: getDefaultQuizzSettings(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Utility: Check if window is available
 */
function hasWindow(): boolean {
  return typeof window !== "undefined";
}
