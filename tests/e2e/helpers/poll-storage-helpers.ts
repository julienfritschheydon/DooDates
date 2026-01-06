import { Page } from "@playwright/test";
import { PRODUCT_ROUTES } from "../utils";
import { seedPollViaEvaluate, seedPollViaInitScript } from "./test-data";
import { verifyPollVisibility } from "./dashboard-helpers";

/**
 * @deprecated Use seedPollViaEvaluate from test-data.ts instead
 */
export async function createPollInLocalStorage(page: Page, pollData: any): Promise<void> {
  await seedPollViaEvaluate(page, pollData);
}

/**
 * @deprecated Use verifyPollVisibility from dashboard-helpers.ts instead
 */
export async function createPollsAndVerifyInDashboard(
  page: Page,
  browserName: string, // Kept as string for compat
  polls: any[],
  dashboardRoute: string,
  expectedVisible: string[],
  expectedNotVisible: string[] = [],
): Promise<void> {
  // 1. Seed
  for (const poll of polls) {
    await seedPollViaEvaluate(page, poll);
  }

  // 2. Verify Visible
  for (const title of expectedVisible) {
    await verifyPollVisibility(page, browserName as any, {
      route: dashboardRoute,
      title,
      visible: true,
    });
  }

  // 3. Verify Not Visible
  for (const title of expectedNotVisible) {
    await verifyPollVisibility(page, browserName as any, {
      route: dashboardRoute,
      title,
      visible: false,
    });
  }
}

/**
 * @deprecated Use seedPollViaInitScript from test-data.ts instead
 */
export async function createPollInStorage(page: Page, pollData: any): Promise<void> {
  await seedPollViaInitScript(page, pollData);
}
