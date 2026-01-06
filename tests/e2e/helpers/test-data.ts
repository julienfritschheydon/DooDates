/**
 * Factories pour créer des données de test
 * Centralise la création de données pour éviter la duplication
 */

import { Page } from "@playwright/test";

export interface TestTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TestFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface TestConversation {
  id: string;
  title: string;
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
  firstMessage: string;
  messageCount: number;
  isFavorite: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface TestPoll {
  id: string;
  slug: string;
  title: string;
  type: "date" | "form" | "availability";
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
  creator_id?: string;
  // Specific fields for different types
  resultsVisibility?: "creator-only" | "voters" | "public";
  questions?: any[];
  dates?: any[];
  clientAvailabilities?: string;
  parsedAvailabilities?: any[];
  proposedSlots?: any[];
  validatedSlot?: any;
}

/**
 * Seeding helper to create a poll via page.evaluate (active page)
 */
export async function seedPollViaEvaluate(
  page: Page,
  poll: Partial<TestPoll> & { slug: string; title: string; type: TestPoll["type"] },
): Promise<TestPoll> {
  const testPoll = await page.evaluate(
    ({ p }) => {
      const devId =
        p.creator_id || localStorage.getItem("doodates_device_id") || `dev-${Date.now()}`;
      const selectedDates =
        p.type === "date" && p.dates
          ? p.dates.map((d: any) => (typeof d === "string" ? d : d.date))
          : [];

      const fullPoll: any = {
        id: p.id || p.slug,
        slug: p.slug,
        title: p.title,
        type: p.type,
        status: p.status || "active",
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
        creator_id: devId,
        resultsVisibility: p.resultsVisibility || "creator-only",
        dates: p.dates || [],
        questions: p.questions || [],
        settings: {
          selectedDates: selectedDates,
          resultsVisibility: p.resultsVisibility || "creator-only",
          ...(p.settings || {}),
        },
        // Availabilities
        clientAvailabilities: p.clientAvailabilities,
        parsedAvailabilities: p.parsedAvailabilities,
        proposedSlots: p.proposedSlots,
        validatedSlot: p.validatedSlot,
      };

      const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
      polls.push(fullPoll);
      localStorage.setItem("doodates_polls", JSON.stringify(polls));
      localStorage.setItem("doodates_device_id", devId);
      return fullPoll;
    },
    { p: poll },
  );

  return testPoll;
}

/**
 * Seeding helper to create a poll via page.addInitScript (pre-navigation)
 */
export async function seedPollViaInitScript(
  page: Page,
  poll: Partial<TestPoll> & { slug: string; title: string; type: TestPoll["type"] },
): Promise<void> {
  await page.addInitScript(
    ({ p }) => {
      try {
        const devId =
          p.creator_id || localStorage.getItem("doodates_device_id") || `dev-${Date.now()}`;
        const selectedDates =
          p.type === "date" && p.dates
            ? p.dates.map((d: any) => (typeof d === "string" ? d : d.date))
            : [];

        const fullPoll: any = {
          id: p.id || p.slug,
          slug: p.slug,
          title: p.title,
          type: p.type,
          status: p.status || "active",
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
          creator_id: devId,
          resultsVisibility: p.resultsVisibility || "creator-only",
          dates: p.dates || [],
          questions: p.questions || [],
          settings: {
            selectedDates: selectedDates,
            resultsVisibility: p.resultsVisibility || "creator-only",
            ...(p.settings || {}),
          },
          clientAvailabilities: p.clientAvailabilities,
          parsedAvailabilities: p.parsedAvailabilities,
          proposedSlots: p.proposedSlots,
          validatedSlot: p.validatedSlot,
        };

        const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
        polls.push(fullPoll);
        localStorage.setItem("doodates_polls", JSON.stringify(polls));
        localStorage.setItem("doodates_device_id", devId);
      } catch (e) {}
    },
    { p: poll },
  );
}

/**
 * Crée des tags de test dans localStorage
 *
 * @param page - La page Playwright
 * @param tags - Liste de tags à créer (sans id, généré automatiquement)
 * @returns Les tags créés avec leurs IDs
 *
 * @example
 * ```typescript
 * // ❌ AVANT
 * await page.evaluate(() => {
 *   const tags = [
 *     { id: 'tag-1', name: 'Test Tag 1', color: '#3b82f6', createdAt: new Date().toISOString() },
 *     // ... répété dans chaque test
 *   ];
 *   localStorage.setItem('doodates_tags', JSON.stringify(tags));
 * });
 *
 * // ✅ APRÈS
 * await createTestTags(page, [
 *   { name: 'Test Tag 1', color: '#3b82f6' },
 *   { name: 'Test Tag 2', color: '#ef4444' },
 * ]);
 * ```
 */
export async function createTestTags(
  page: Page,
  tags: Array<{ name: string; color: string }>,
): Promise<TestTag[]> {
  const testTags: TestTag[] = tags.map((tag, index) => ({
    id: `tag-${index + 1}`,
    name: tag.name,
    color: tag.color,
    createdAt: new Date().toISOString(),
  }));

  await page.evaluate((tags) => {
    localStorage.setItem("doodates_tags", JSON.stringify(tags));
  }, testTags);

  return testTags;
}

/**
 * Crée un seul tag de test
 *
 * @param page - La page Playwright
 * @param tag - Le tag à créer
 * @returns Le tag créé avec son ID
 */
export async function createTestTag(
  page: Page,
  tag: { name: string; color: string },
): Promise<TestTag> {
  // Récupérer les tags existants
  const existingTags = await page.evaluate(() => {
    const stored = localStorage.getItem("doodates_tags");
    return stored ? JSON.parse(stored) : [];
  });

  const newTag: TestTag = {
    id: `tag-${Date.now()}`,
    name: tag.name,
    color: tag.color,
    createdAt: new Date().toISOString(),
  };

  const updatedTags = [...existingTags, newTag];

  await page.evaluate((tags) => {
    localStorage.setItem("doodates_tags", JSON.stringify(tags));
  }, updatedTags);

  return newTag;
}

/**
 * Crée des dossiers de test dans localStorage
 *
 * @param page - La page Playwright
 * @param folders - Liste de dossiers à créer
 * @returns Les dossiers créés avec leurs IDs
 */
export async function createTestFolders(
  page: Page,
  folders: Array<{ name: string; color: string; icon: string }>,
): Promise<TestFolder[]> {
  const testFolders: TestFolder[] = folders.map((folder, index) => ({
    id: `folder-${index + 1}`,
    name: folder.name,
    color: folder.color,
    icon: folder.icon,
    createdAt: new Date().toISOString(),
  }));

  await page.evaluate((folders) => {
    localStorage.setItem("doodates_folders", JSON.stringify(folders));
  }, testFolders);

  return testFolders;
}

/**
 * Crée une conversation de test dans localStorage
 *
 * @param page - La page Playwright
 * @param conversation - Données de la conversation (sans id, généré automatiquement)
 * @returns La conversation créée avec son ID
 */
export async function createTestConversation(
  page: Page,
  conversation: Omit<TestConversation, "id" | "createdAt" | "updatedAt">,
): Promise<TestConversation> {
  const testConversation: TestConversation = {
    id: `test-conv-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...conversation,
  };

  // Récupérer les conversations existantes
  const existingConversations = await page.evaluate(() => {
    const stored = localStorage.getItem("doodates_conversations");
    return stored ? JSON.parse(stored) : [];
  });

  // Ajouter la nouvelle conversation
  const updatedConversations = [...existingConversations, testConversation];

  await page.evaluate((conversations) => {
    localStorage.setItem("doodates_conversations", JSON.stringify(conversations));
  }, updatedConversations);

  return testConversation;
}

/**
 * Crée plusieurs conversations de test
 *
 * @param page - La page Playwright
 * @param conversations - Liste de conversations à créer
 * @returns Les conversations créées
 */
export async function createTestConversations(
  page: Page,
  conversations: Array<Omit<TestConversation, "id" | "createdAt" | "updatedAt">>,
): Promise<TestConversation[]> {
  const testConversations: TestConversation[] = conversations.map((conv, index) => ({
    id: `test-conv-${Date.now()}-${index}`,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(), // Dates différentes
    updatedAt: new Date().toISOString(),
    ...conv,
  }));

  await page.evaluate((conversations) => {
    localStorage.setItem("doodates_conversations", JSON.stringify(conversations));
  }, testConversations);

  return testConversations;
}

/**
 * Crée un poll de test dans localStorage
 *
 * @param page - La page Playwright
 * @param poll - Données du poll
 * @returns Le poll créé
 */
/**
 * @deprecated Use seedPollViaEvaluate instead
 */
export async function createTestPoll(
  page: Page,
  poll: Omit<TestPoll, "id" | "created_at" | "updated_at">,
): Promise<TestPoll> {
  return seedPollViaEvaluate(page, poll as any);
}

/**
 * Nettoie toutes les données de test
 *
 * @param page - La page Playwright
 * @param options - Options de nettoyage
 */
export async function clearTestData(
  page: Page,
  options?: {
    tags?: boolean;
    folders?: boolean;
    conversations?: boolean;
    polls?: boolean;
    all?: boolean;
  },
): Promise<void> {
  const clearAll = options?.all ?? false;
  const clearTags = options?.tags ?? clearAll;
  const clearFolders = options?.folders ?? clearAll;
  const clearConversations = options?.conversations ?? clearAll;
  const clearPolls = options?.polls ?? clearAll;

  await page.evaluate(
    ({ clearTags, clearFolders, clearConversations, clearPolls }) => {
      try {
        if (clearTags) localStorage.removeItem("doodates_tags");
        if (clearFolders) localStorage.removeItem("doodates_folders");
        if (clearConversations) localStorage.removeItem("doodates_conversations");
        if (clearPolls) localStorage.removeItem("doodates_polls");
      } catch (error) {
        void error;
      }
    },
    { clearTags, clearFolders, clearConversations, clearPolls },
  );
}

/**
 * Crée un setup complet de données de test (tags + folders + conversations)
 *
 * @param page - La page Playwright
 * @param options - Options de setup
 * @returns Les données créées
 */
export async function setupTestData(
  page: Page,
  options?: {
    tags?: Array<{ name: string; color: string }>;
    folders?: Array<{ name: string; color: string; icon: string }>;
    conversations?: Array<Omit<TestConversation, "id" | "createdAt" | "updatedAt">>;
  },
): Promise<{
  tags: TestTag[];
  folders: TestFolder[];
  conversations: TestConversation[];
}> {
  const tags = options?.tags
    ? await createTestTags(page, options.tags)
    : await createTestTags(page, [
        { name: "Test Tag 1", color: "#3b82f6" },
        { name: "Test Tag 2", color: "#ef4444" },
        { name: "Test Tag 3", color: "#10b981" },
      ]);

  const folders = options?.folders
    ? await createTestFolders(page, options.folders)
    : await createTestFolders(page, [
        { name: "Test Folder 1", color: "#3b82f6", icon: "📁" },
        { name: "Test Folder 2", color: "#ef4444", icon: "📂" },
      ]);

  const conversations = options?.conversations
    ? await createTestConversations(page, options.conversations)
    : await createTestConversation(page, {
        title: "Conversation de test",
        status: "completed",
        firstMessage: "Premier message de test",
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: {},
      }).then((c) => [c]);

  return {
    tags,
    folders,
    conversations: Array.isArray(conversations) ? conversations : [conversations],
  };
}
