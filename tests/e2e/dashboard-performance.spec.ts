import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupTestEnvironment } from './helpers/test-setup';
import { createTestConversations, createTestPoll, createTestTags, createTestFolders } from './helpers/test-data';
import { waitForElementReady, waitForNetworkIdle, waitForReactStable } from './helpers/wait-helpers';
import { PERFORMANCE_BENCHMARKS } from '../../src/lib/performance-benchmarks';
import { measurePerformance } from '../../src/lib/performance-measurement';

async function seedDashboardConversations(page: Page, count: number) {
  const createdPoll = await createTestPoll(page, {
    title: 'Sondage performance dashboard',
    slug: `sondage-perf-${count}`,
    type: 'date',
    status: 'active',
    settings: { selectedDates: ['2025-01-01'] },
  });

  await createTestTags(page, Array.from({ length: 25 }).map((_, index) => ({
    name: `Perf Tag ${index + 1}`,
    color: '#3b82f6',
  })));

  await createTestFolders(page, Array.from({ length: 25 }).map((_, index) => ({
    name: `Perf Folder ${index + 1}`,
    color: '#ef4444',
    icon: '📁',
  })));

  await createTestConversations(
    page,
    Array.from({ length: count }).map((_, index) => {
      const i = index + 1;
      return {
        title: `Conversation Perf ${i}`,
        status: 'completed' as const,
        firstMessage: `Premier message ${i}`,
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: {
          pollId: createdPoll.id,
          pollGenerated: true,
          folderId: 'folder-1',
        },
      };
    }),
  );
}

async function measureDurationMs(name: string, fn: () => Promise<void>): Promise<number> {
  let durationMs = 0;
  await measurePerformance(name, async () => {
    const start = Date.now();
    await fn();
    durationMs = Date.now() - start;
  });
  return durationMs;
}

async function measureDashboardLoadMs(page: Page, browserName: string) {
  return measureDurationMs('Dashboard - load', async () => {
    await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForElementReady(page, '[data-testid="dashboard-ready"]', { browserName });
    await waitForReactStable(page, { browserName });
  });
}

async function measureTagsMenuOpenMs(page: Page, browserName: string) {
  const tagsButton = await waitForElementReady(page, 'button:has-text("Tags")', { browserName });

  return measureDurationMs('Dashboard - open tags menu', async () => {
    await tagsButton.click();
    await waitForReactStable(page, { browserName });
    await waitForElementReady(page, 'input[placeholder="Nouveau tag..."]', { browserName });
  });
}

async function measureFoldersMenuOpenMs(page: Page, browserName: string) {
  const foldersButton = await waitForElementReady(page, 'button:has-text("Tous les dossiers")', { browserName });

  return measureDurationMs('Dashboard - open folders menu', async () => {
    await foldersButton.click();
    await waitForReactStable(page, { browserName });
    await waitForElementReady(page, 'input[placeholder="Nouveau dossier..."]', { browserName });
  });
}

async function measureProductDashboardLoadMs(
  page: Page,
  browserName: string,
  options: {
    url: string;
    readySelector: string;
  }
) {
  return measureDurationMs(`Product dashboard - load (${options.url})`, async () => {
    await page.goto(options.url, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForElementReady(page, options.readySelector, { browserName });
    await waitForReactStable(page, { browserName });
  });
}

test.describe('Dashboard - Performance', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'Performance tests run on Chromium only');

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      mocks: { all: true },
      enableE2ELocalMode: true,
      warmup: true,
      clearLocalStorage: false,
      consoleGuard: { enabled: true },
      navigation: { path: '/DooDates/', waitForReady: false },
    });
  });

  test('PERF-UI-01: Dashboard load < 2s for 50 conversations', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const durationMs = await measureDashboardLoadMs(page, browserName);
    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.dashboard.loadMs.conversations50);
  });

  test('PERF-UI-02: Dashboard load < 5s for 200 conversations', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 200);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const durationMs = await measureDashboardLoadMs(page, browserName);
    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.dashboard.loadMs.conversations200);
  });

  test('PERF-UI-03: Tags menu opens < 500ms', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await measureDashboardLoadMs(page, browserName);

    const durationMs = await measureTagsMenuOpenMs(page, browserName);
    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.dashboard.menus.tagsOpenMs);
  });

  test('PERF-UI-04: Folders menu opens < 500ms', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await measureDashboardLoadMs(page, browserName);

    const durationMs = await measureFoldersMenuOpenMs(page, browserName);
    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.dashboard.menus.foldersOpenMs);
  });

  test('PERF-PRODUCT-01: Date dashboard loads < threshold', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const durationMs = await measureProductDashboardLoadMs(page, browserName, {
      url: '/DooDates/date-polls/dashboard',
      // Indicateur stable utilisé dans verify_navigation.spec.ts
      readySelector: 'text=crédits utilisés',
    });

    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.products.dashboards.loadMs.date);
  });

  test('PERF-PRODUCT-02: Form dashboard loads < threshold', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const durationMs = await measureProductDashboardLoadMs(page, browserName, {
      url: '/DooDates/form-polls/dashboard',
      readySelector: 'text=crédits utilisés',
    });

    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.products.dashboards.loadMs.form);
  });

  test('PERF-PRODUCT-03: Availability dashboard loads < threshold', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const durationMs = await measureProductDashboardLoadMs(page, browserName, {
      url: '/DooDates/availability-polls/dashboard',
      readySelector: 'text=crédits utilisés',
    });

    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.products.dashboards.loadMs.availability);
  });

  test('PERF-PRODUCT-04: Quizz dashboard loads < threshold', async ({ page, browserName }) => {
    await seedDashboardConversations(page, 50);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const durationMs = await measureProductDashboardLoadMs(page, browserName, {
      url: '/DooDates/quizz/dashboard',
      // Indicateur stable utilisé dans quizz-sidebar-check.spec.ts
      readySelector: 'button[aria-label*="menu"]',
    });

    expect(durationMs).toBeLessThan(PERFORMANCE_BENCHMARKS.products.dashboards.loadMs.quizz);
  });
});
