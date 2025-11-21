import { v4 as uuidv4 } from 'uuid';
import { FormPoll, FormPollDraft } from '../types/form';
import { logger } from './logger';

const STORAGE_KEY = 'doodates_form_polls';

const readFormPolls = (): FormPoll[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error('Error reading form polls from storage', 'poll', { error });
    return [];
  }
};

const writeFormPolls = (polls: FormPoll[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  } catch (error) {
    logger.error('Error writing form polls to storage', 'poll', { error });
  }
};

export const formPollStorage = {
  /**
   * Get all form polls
   */
  getFormPolls(): FormPoll[] {
    return readFormPolls();
  },

  /**
   * Get a form poll by ID
   */
  getFormPoll(id: string): FormPoll | undefined {
    const polls = readFormPolls();
    return polls.find(poll => poll.id === id);
  },

  /**
   * Create a new form poll
   */
  createFormPoll(draft: FormPollDraft): FormPoll {
    const newPoll: FormPoll = {
      ...draft,
      id: draft.id || uuidv4(),
      created_at: draft.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'form',
      status: draft.status || 'draft',
    };

    const polls = readFormPolls();
    writeFormPolls([...polls, newPoll]);
    return newPoll;
  },

  /**
   * Update an existing form poll
   */
  updateFormPoll(id: string, updates: Partial<FormPoll>): FormPoll | null {
    const polls = readFormPolls();
    const index = polls.findIndex(poll => poll.id === id);
    
    if (index === -1) return null;

    const updatedPoll = {
      ...polls[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const newPolls = [...polls];
    newPolls[index] = updatedPoll;
    writeFormPolls(newPolls);
    
    return updatedPoll;
  },

  /**
   * Delete a form poll
   */
  deleteFormPoll(id: string): boolean {
    const polls = readFormPolls();
    const newPolls = polls.filter(poll => poll.id !== id);
    
    if (newPolls.length < polls.length) {
      writeFormPolls(newPolls);
      return true;
    }
    
    return false;
  },

  /**
   * Duplicate a form poll
   */
  duplicateFormPoll(id: string): FormPoll | null {
    const poll = this.getFormPoll(id);
    if (!poll) return null;

    const newPoll: FormPoll = {
      ...poll,
      id: uuidv4(),
      title: `${poll.title} (Copie)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slug: `${poll.slug}-${Math.random().toString(36).substring(2, 8)}`,
    };

    const polls = readFormPolls();
    writeFormPolls([...polls, newPoll]);
    return newPoll;
  },
};
