/* eslint-disable @typescript-eslint/no-explicit-any */
// Quizz Service Wrapper
// Réexport des fonctions spécifiques aux quizz

export {
  getQuizz as getPolls,
  addQuizz as addPoll,
  deleteQuizzById as deletePollById,
  duplicateQuizz as duplicatePoll,
  getQuizzBySlugOrId as getPollBySlugOrId,
  saveQuizz as savePolls,
  addQuizzResponse,
  getQuizzResponses,
  getQuizzResults,
  validateQuizz as validatePoll,
} from "./quizz-service";

export type {
  Quizz as Poll,
  QuizzSettings as PollSettings,
  QuizzQuestion,
  QuizzResponse,
  QuizzResults,
} from "./quizz-service";

// Helper function pour compatibilité
export function isQuizz(poll: any): boolean {
  return poll?.type === "quizz" && Array.isArray(poll?.questions);
}
