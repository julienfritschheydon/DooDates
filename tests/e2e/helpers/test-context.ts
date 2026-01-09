/**
 * Standardized context interface for all E2E test helpers
 * Ensures consistency across the test infrastructure
 */

import type { Page } from "@playwright/test";
import type { BrowserName } from "./poll-core-helpers";

export interface TestContext {
  page: Page;
  browserName: BrowserName;
}

/**
 * Standard options interface that can be extended by specific helpers
 */
export interface BaseTestOptions {
  timeout?: number;
  retries?: number;
}

/**
 * Helper to create context from individual parameters (for backward compatibility)
 */
export function createContext(page: Page, browserName: BrowserName): TestContext {
  return { page, browserName };
}

/**
 * Helper to extract individual parameters from context (for migration)
 */
export function extractFromContext(context: TestContext) {
  return { page: context.page, browserName: context.browserName };
}
