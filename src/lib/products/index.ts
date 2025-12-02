// Products Unified Interface
// Interface unifiée pour tous les services produits

import { ErrorFactory } from '../../error-handling';

// Date Polls
export * from './date-polls';

// Form Polls  
export * from './form-polls';

// Quizz
export * from './quizz';

// Helper functions universelles
export function getPollType(poll: any): "date" | "form" | "quizz" | null {
  if (poll?.type === "date" || (poll?.settings?.selectedDates && Array.isArray(poll?.settings?.selectedDates))) {
    return "date";
  }
  if (poll?.type === "form" || (poll?.questions && Array.isArray(poll.questions))) {
    return "form";
  }
  if (poll?.type === "quizz" && Array.isArray(poll?.questions)) {
    return "quizz";
  }
  return null;
}

// Factory functions
export function createPollService(type: "date" | "form" | "quizz") {
  switch (type) {
    case "date":
      return import('./date-polls');
    case "form":
      return import('./form-polls');
    case "quizz":
      return import('./quizz');
    default:
      throw ErrorFactory.createValidationError(
        `Unknown poll type: ${type}`,
        "createPollService",
        { type }
      );
  }
}
