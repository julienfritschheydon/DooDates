import { Page } from '@playwright/test';

export async function createPollInLocalStorage(
  page: Page,
  pollData: {
    id: string;
    slug: string;
    title: string;
    type: 'availability' | 'form' | 'date';
    status?: string;
    created_at?: string;
    updated_at?: string;
    creator_id?: string;
    dates?: any[];
    clientAvailabilities?: string;
    parsedAvailabilities?: any[];
    proposedSlots?: any[];
    validatedSlot?: any;
  },
): Promise<void> {
  await page.evaluate((data) => {
    try {
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      polls.push(data.poll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
    } catch (e) {
      console.error('Failed to seed poll:', e);
    }
  }, { poll: pollData });
}

export async function createPollInStorage(
  page: Page,
  pollData: {
    slug: string;
    title: string;
    type: 'form' | 'availability';
    resultsVisibility?: 'creator-only' | 'voters' | 'public';
    questions?: any[];
    dates?: any[];
    creator_id?: string;
  },
): Promise<void> {
  await page.addInitScript(({ poll }) => {
    try {
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      const newPoll = {
        id: poll.slug,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...poll,
      };
      polls.push(newPoll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
    } catch { }
  }, { poll: pollData });
}
