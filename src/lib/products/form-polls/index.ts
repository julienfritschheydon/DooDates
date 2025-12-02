// Form Polls Service Wrapper
// Réexport des fonctions spécifiques aux form polls

export {
  getFormPolls as getPolls,
  addFormPoll as addPoll,
  deleteFormPollById as deletePollById,
  duplicateFormPoll as duplicatePoll,
  getFormPollBySlugOrId as getPollBySlugOrId,
  saveFormPolls as savePolls,
  addFormResponse,
  getFormResponses,
  getFormResults,
  validateFormPoll as validatePoll
} from './form-polls-service';

export type { 
  FormPoll as Poll, 
  FormPollSettings as PollSettings,
  FormQuestionShape as FormQuestion,
  FormResponse, 
  FormQuestionKind,
  FormQuestionOption,
  DateVoteValue,
  DateQuestionResults,
  FormResults
} from './form-polls-service';

// Helper function pour compatibilité
export function isFormPoll(poll: any): boolean {
  // Explicit type check first
  if (poll?.type === "form") return true;
  // Exclude quizz
  if (poll?.type === "quizz") return false;
  // Fallback: has questions but not quizz-style questions
  if (poll?.questions && Array.isArray(poll.questions)) {
    return !poll.questions.some((q: any) => q.correctAnswer !== undefined);
  }
  return false;
}
