// Products Unified Interface
// Interface unifiée pour tous les services produits

// Date Polls
export * as DatePolls from "./date-polls";

// Form Polls  
export * as FormPolls from "./form-polls";

// Quizz
export * as Quizz from "./quizz";

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
export async function createPollService(type: "date" | "form" | "quizz") {
  switch (type) {
    case "date":
      return await import("./date-polls");
    case "form":
      return await import("./form-polls");
    case "quizz":
      return await import("./quizz");
    default:
      throw new Error(`Unknown poll type: ${type}`);
  }
}
