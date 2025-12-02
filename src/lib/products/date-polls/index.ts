// Date Polls Service Wrapper
// Réexport des fonctions spécifiques aux date polls

export {
  getDatePolls as getPolls,
  addDatePoll as addPoll,
  deleteDatePollById as deletePollById,
  duplicateDatePoll as duplicatePoll,
  getDatePollBySlugOrId as getPollBySlugOrId,
  saveDatePolls as savePolls,
  buildPublicLink,
  copyToClipboard,
  validateDatePoll as validatePoll
} from './date-polls-service';

export type { 
  DatePoll as Poll, 
  DatePollSettings as PollSettings,
  TimeSlot
} from './date-polls-service';

// Helper function pour compatibilité
export function isDatePoll(poll: any): boolean {
  return poll?.type === "date" || (poll?.settings?.selectedDates && Array.isArray(poll?.settings?.selectedDates));
}
