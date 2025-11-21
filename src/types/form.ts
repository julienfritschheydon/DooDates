import { Poll } from './poll';
import type { PollSettings, FormQuestionShape } from '../lib/pollStorage';

export interface FormPoll extends Omit<Poll, 'settings' | 'questions'> {
  // Make questions required for forms and use FormQuestionShape
  questions: FormQuestionShape[];
  
  // Make settings required and extend with form-specific settings
  settings: PollSettings & {
    allowAnonymousResponses?: boolean;
    expiresAt?: string;
  };
}

export interface FormPollDraft extends Omit<FormPoll, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}
