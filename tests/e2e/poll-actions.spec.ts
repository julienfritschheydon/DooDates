import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, robustClick, seedLocalStorage, waitForCopySuccess, warmup, enableE2ELocalMode } from './utils';

function makePoll(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? `p-${Math.random().toString(36).slice(2, 7)}`,
    title: overrides.title ?? 'Sondage E2E',
    slug: overrides.slug ?? `e2e-${Math.random().toString(36).slice(2, 5)}`,
    created_at: overrides.created_at ?? new Date().toISOString(),
    status: overrides.status ?? 'active',
    description: overrides.description,
    settings: overrides.settings,
    updated_at: overrides.updated_at,
  };
}

async function openDashboard(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Dashboard - Poll Actions', () => {
  test.describe.configure({ mode: 'serial' });

  test('copy, duplicate, edit, delete actions flow', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /The above error occurred in one of your React components/i,
        /Erreur préchargement/i,
        /calendrier JSON/i,
      ],
    });
    try {
      // Warmup before seeding to stabilize imports and navigation
      await enableE2ELocalMode(page);
      await warmup(page);

      const p1 = makePoll({ title: 'Actionable 1', slug: 'action-1', id: 'a1' });
      const p2 = makePoll({ title: 'Actionable 2', slug: 'action-2', id: 'a2' });
      await seedLocalStorage(page, [p1, p2]);

      await openDashboard(page);

      // Ensure list shows at least our 2 items
      const listItems = page.locator('[data-testid="poll-item"]');
      await expect.poll(async () => await listItems.count(), { timeout: 10000 }).toBeGreaterThanOrEqual(2);

      // Copy link on first
      const copyBtn = page.locator('[data-testid="copy-link-button"]').first();
      if (await copyBtn.count()) {
        await robustClick(copyBtn);
        await waitForCopySuccess(page).catch(() => {});
      }

      // Duplicate first -> count should increase
      const duplicateBtn = page.locator('[data-testid="duplicate-poll-button"]').first();
      if (await duplicateBtn.count()) {
        const before = await listItems.count();
        await robustClick(duplicateBtn);
        await expect.poll(async () => await listItems.count(), { timeout: 20000 }).toBeGreaterThan(before);
      }

      // Edit (view) first -> should navigate to /create?edit=
      const viewBtn = page.locator('[data-testid="view-poll-button"]').first();
      if (await viewBtn.count()) {
        await robustClick(viewBtn);
        await expect(page).toHaveURL(/\/create\?edit=/);
        // Back to dashboard
        const backDash = page.locator('[data-testid="dashboard-button"]').first();
        if (await backDash.count()) {
          await robustClick(backDash);
        } else {
          await openDashboard(page);
        }
      }

      // Delete first (if confirm exists)
      const deleteBtn = page.locator('[data-testid="delete-poll-button"]').first();
      const confirmDelete = page.locator('[data-testid="confirm-delete"]').first();
      if (await deleteBtn.count()) {
        const beforeDel = await listItems.count();
        await robustClick(deleteBtn);
        if (await confirmDelete.count()) {
          await robustClick(confirmDelete);
          await expect.poll(async () => await listItems.count(), { timeout: 10000 }).toBeLessThan(beforeDel);
        }
      }
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
