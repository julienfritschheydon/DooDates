import { Page, Browser } from "@playwright/test";
import { waitForReactStable } from "./wait-helpers";
import { getTimeouts } from "../config/timeouts";

/**
 * Navigation robuste avec validation complète du chargement page
 * Utilisée pour les tests à risque qui font plusieurs navigations
 */
export async function robustNavigation(
  page: Page,
  url: string,
  browserName: string,
  options?: {
    timeout?: number;
    waitUntil?: "domcontentloaded" | "networkidle" | "load";
    waitForChat?: boolean;
  },
): Promise<void> {
  const timeouts = getTimeouts(browserName);
  const timeout = options?.timeout ?? 15000;
  const waitUntil = options?.waitUntil ?? "networkidle";

  console.log(`🚀 Navigation robuste vers: ${url}`);

  try {
    // 1. Navigation avec timeout explicite
    await page.goto(url, {
      waitUntil,
      timeout,
    });

    console.log(`✅ Navigation terminée: ${page.url()}`);

    // 2. Vérifier que la page n'est pas fermée
    if (page.isClosed()) {
      throw new Error("Page was closed during navigation");
    }

    // 3. Validation du chargement DOM
    console.log("🔍 Validation chargement DOM...");
    await page.waitForLoadState("domcontentloaded", { timeout: Math.min(timeout, 10000) });
    console.log("✅ DOM content loaded");

    // 4. Validation du rendu React
    console.log("🔍 Validation rendu React...");
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        if (!root) return false;

        const content = root.textContent || "";
        return !content.includes("function()") && content.length > 100;
      },
      { timeout: Math.min(timeout, 10000) },
    );
    console.log("✅ React app rendered successfully");

    // 5. Validation du body visible
    const bodyVisible = await page.locator("body").isVisible({ timeout: 5000 });
    if (!bodyVisible) {
      throw new Error("Body element not visible after page load");
    }
    console.log("✅ Body element visible");

    // 6. Stabilité React
    await waitForReactStable(page, {
      timeout: Math.min(timeout, 8000),
      browserName,
    });
    console.log("✅ React stable");

    // 7. Chat input optionnel
    if (options?.waitForChat) {
      console.log("🔍 Recherche chat input...");
      try {
        await page.waitForSelector('[data-testid="chat-input"]', {
          timeout: Math.min(timeout, 8000),
        });
        console.log("✅ Chat input trouvé");
      } catch (error) {
        console.log("⚠️ Chat input non trouvé, continuation...");
        // Ne pas échouer sur le chat input pour la navigation robuste
      }
    }
  } catch (error) {
    console.error("❌ Navigation robuste échouée:", error);

    // Debug info
    try {
      const pageUrl = page.url();
      const pageTitle = await page.title();
      const bodyExists = (await page.locator("body").count()) > 0;
      const bodyVisible = bodyExists ? await page.locator("body").isVisible() : false;

      console.log(`🔍 Debug - URL: ${pageUrl}, Title: ${pageTitle}`);
      console.log(`🔍 Debug - Body exists: ${bodyExists}, visible: ${bodyVisible}`);
      console.log(`🔍 Debug - Page closed: ${page.isClosed()}`);

      // Screenshot
      await page.screenshot({
        path: `debug-robust-navigation-${Date.now()}.png`,
        fullPage: true,
      });
      console.log("📸 Screenshot de debug sauvegardé");
    } catch (debugError) {
      console.log("⚠️ Debug info impossible:", debugError);
    }

    throw new Error(
      `Robust navigation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Navigation sécurisée avec retry automatique pour les tests critiques
 */
export async function safeNavigationWithRetry(
  page: Page,
  url: string,
  browserName: string,
  options?: {
    maxRetries?: number;
    timeout?: number;
    waitUntil?: "domcontentloaded" | "networkidle" | "load";
  },
): Promise<void> {
  const maxRetries = options?.maxRetries ?? 2;
  const timeout = options?.timeout ?? 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Navigation attempt ${attempt}/${maxRetries}`);
      await robustNavigation(page, url, browserName, options);
      console.log(`✅ Navigation réussie à la tentative ${attempt}`);
      return;
    } catch (error) {
      console.log(
        `⚠️ Tentative ${attempt} échouée:`,
        error instanceof Error ? error.message : String(error),
      );

      if (attempt === maxRetries) {
        throw new Error(
          `Navigation failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Attendre avant de réessayer
      console.log(`⏳ Attente avant retry ${attempt + 1}...`);
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    }
  }
}
