/**
 * Settings pour les Quizz (Aide aux Devoirs)
 */

export interface QuizzSettings {
  // UI display settings
  showEstimatedTime?: boolean;
  showQuestionCount?: boolean;
  // Access control settings
  requireAuth?: boolean;
  oneResponsePerPerson?: boolean;
  maxResponses?: number;
  expiresAt?: string;
  // Results visibility
  resultsVisibility?: "creator-only" | "voters" | "public";
  // Quizz-specific
  allowRetry?: boolean;
  showCorrectAnswers?: boolean;
  timeLimit?: number; // en minutes
}
