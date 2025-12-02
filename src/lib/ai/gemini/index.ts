// Re-export the main GeminiService and types for backward compatibility
export { GeminiService } from "./gemini-service";
export type {
  FormQuestion,
  FormPollSuggestion,
  DatePollSuggestion,
  PollSuggestion,
  GeminiResponse,
} from "./gemini-service";

// Re-export all modules for advanced usage
export * from "./prompts";
export * from "./hints";
