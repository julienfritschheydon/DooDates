/* eslint-disable @typescript-eslint/no-explicit-any */
// Products Unified Interface
// Interface unifiée pour tous les services produits

import { ErrorFactory } from "../error-handling";

// Date Polls
export * as DatePolls from "./date-polls";

// Form Polls
export * as FormPolls from "./form-polls";

// Quizz
export * as Quizz from "./quizz";

// Helper functions universelles
export function getPollType(poll: any): "date" | "form" | "quizz" | null {
  if (!poll) return null;

  // Check explicit type first
  if (poll.type === "date") return "date";
  if (poll.type === "quizz") return "quizz";
  if (poll.type === "form") return "form";

  // Fallback to structure detection
  if (poll.settings?.selectedDates && Array.isArray(poll.settings.selectedDates)) {
    return "date";
  }
  if (poll.questions && Array.isArray(poll.questions)) {
    // Quizz has correctAnswer in questions, form doesn't
    if (poll.questions.some((q: any) => q.correctAnswer !== undefined)) {
      return "quizz";
    }
    return "form";
  }
  return null;
}

// Factory functions
export async function createPollService(type: "date" | "form" | "quizz") {
  switch (type) {
    case "date":
      return await import("./date-polls");
    case "form":
      return await import("./form-polls");
    case "quizz":
      return await import("./quizz");
    default:
      throw ErrorFactory.validation(`Unknown poll type: ${type}`, `Unknown poll type: ${type}`, {
        type,
      });
  }
}
