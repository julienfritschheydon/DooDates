import { Page, expect } from "@playwright/test";
import { waitForNetworkIdle, waitForReactStable } from "./wait-helpers";
import { PRODUCT_ROUTES } from "../utils";

export async function createPollInLocalStorage(
  page: Page,
  pollData: {
    id: string;
    slug: string;
    title: string;
    type: "availability" | "form" | "date";
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
  await page.evaluate(
    (data) => {
      try {
        const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
        polls.push(data.poll);
        localStorage.setItem("doodates_polls", JSON.stringify(polls));
      } catch (e) {
        console.error("Failed to seed poll:", e);
      }
    },
    { poll: pollData },
  );
}

/**
 * Helper pour créer des polls dans localStorage et vérifier qu'ils apparaissent dans le dashboard
 * Suit le pattern de product-isolation.spec.ts
 */
export async function createPollsAndVerifyInDashboard(
  page: Page,
  browserName: string,
  polls: Array<{
    id: string;
    slug: string;
    title: string;
    type: "availability" | "form" | "date";
    status?: string;
    created_at?: string;
    updated_at?: string;
    creator_id?: string;
    settings?: any;
  }>,
  dashboardRoute: string,
  expectedVisible: string[],
  expectedNotVisible: string[] = [],
): Promise<void> {
  // 1. Créer les polls si fournis (sinon ils sont déjà créés dans beforeEach)
  if (polls.length > 0) {
    await page.goto(PRODUCT_ROUTES.datePoll.landing);
    for (const poll of polls) {
      await createPollInLocalStorage(page, poll);
    }
  }

  // 2. Naviguer vers le dashboard (comme product-isolation.spec.ts)
  await page.goto(dashboardRoute, { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // 3. Vérifier que les polls attendus sont visibles
  for (const title of expectedVisible) {
    await page.getByText(title).waitFor({ state: "visible", timeout: 5000 });
  }

  // 4. Vérifier que les polls non attendus ne sont pas visibles
  for (const title of expectedNotVisible) {
    const locator = page.getByText(title);
    await expect(locator).not.toBeVisible();
  }
}

export async function createPollInStorage(
  page: Page,
  pollData: {
    slug: string;
    title: string;
    type: "form" | "availability";
    resultsVisibility?: "creator-only" | "voters" | "public";
    questions?: any[];
    dates?: any[];
    creator_id?: string;
  },
): Promise<void> {
  await page.addInitScript(
    ({ poll }) => {
      try {
        const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
        const newPoll = {
          id: poll.slug,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...poll,
        };
        polls.push(newPoll);
        localStorage.setItem("doodates_polls", JSON.stringify(polls));
      } catch {}
    },
    { poll: pollData },
  );
}
