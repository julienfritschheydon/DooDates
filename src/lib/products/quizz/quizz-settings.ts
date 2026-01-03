/**
 * Settings pour les Quizz (Aide aux Devoirs)
 */

export interface QuizzSettings {
  // UI display settings
  showLogo?: boolean;
  showEstimatedTime?: boolean;
  showQuestionCount?: boolean;
  // Access control settings
  requireAuth?: boolean;
  oneResponsePerPerson?: boolean;
  allowEditAfterSubmit?: boolean;
  maxResponses?: number;
  expiresAt?: string;
  // Email settings
  sendEmailCopy?: boolean;
  emailForCopy?: string;
  // Results visibility
  resultsVisibility?: "creator-only" | "voters" | "public";
  // Quizz-specific
  allowRetry?: boolean;
  showCorrectAnswers?: boolean;
  timeLimit?: number; // en minutes
}
