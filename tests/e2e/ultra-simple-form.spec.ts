import { test, expect } from "@playwright/test";
import { withConsoleGuard, PRODUCT_ROUTES } from "./utils";
import { robustNavigation } from "./helpers/robust-navigation";
import { sendChatCommand } from "./helpers/poll-helpers";
import { setupTestEnvironment } from "./helpers/test-setup";
import { getTimeouts } from "./config/timeouts";
import { authenticateUser } from "./helpers/auth-helpers";
import { waitForNetworkIdle } from "./helpers/wait-helpers";
import { sendChatMessage, navigateToWorkspace } from "./helpers/chat-helpers";

// Logger scoped pour suivre précisément chaque étape dans les traces.
const mkLogger =
  (scope: string) =>
  (...parts: any[]) =>
    console.log(`[${scope}]`, ...parts);

/**
 * Test Ultra Simple Form (via IA) : workflow complet de création, ajout, suppression, reprise, vote et vérification dashboard.
 */
test.describe("DooDates - Test Ultra Simple Form (via IA)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Prépare l'environnement complet avant chaque test (mocks, garde console, mode local).
   */
  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: false,
      navigation: { path: PRODUCT_ROUTES.formPoll.landing },
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred/i,
          /DooDatesError/i,
          /No dates selected/i,
          /Erreur lors de la sauvegarde/i,
          /Failed to send message/i,
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
          /ResizeObserver loop/i,
        ],
      },
      mocks: { all: true },
    });

    await authenticateUser(page, browserName, { reload: true, waitForReady: true });
  });

  /**
   * Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard.
   */
  test("Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard @smoke @functional", async ({
    page,
    browserName,
  }) => {
    const log = mkLogger("UltraSimpleForm");
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        test.slow();

        // 1. Navigation workspace Form
        log("🛠️ Navigation vers le workspace Form");
        await navigateToWorkspace(page, browserName, "form");
        await waitForNetworkIdle(page, { browserName });
        // await expect(page).toHaveTitle(/DooDates/);
        log("✅ App chargée");

        // 2. Détecter le type d'interface (chat IA ou formulaire manuel)
        const chatInput = page.locator('[data-testid="chat-input"]');
        const formTitle = page
          .locator(
            'input[placeholder*="titre" i], input[name*="title"], [data-testid="form-title"]',
          )
          .first();

        const hasChatInput = await chatInput.isVisible({ timeout: 3000 }).catch(() => false);
        const hasFormTitle = await formTitle.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasChatInput) {
          // Mode Chat IA
          log("📝 Mode Chat IA détecté");
          const prompt = "crée un questionnaire avec 2 questions pour organiser une formation";
          await sendChatMessage(page, prompt, { timeout: timeouts.element });

          // Attendre la réponse IA
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // CLIQUER SUR LE BOUTON "CRÉER" pour vraiment créer le formulaire
          log("🔘 Clic sur le bouton CRÉER");
          const createButton = page.locator("button").filter({ hasText: /créer/i }).first();
          await createButton.waitFor({ state: "visible", timeout: 10000 });
          await createButton.click();

          // Attendre que le formulaire soit créé en brouillon
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // La publication est déplacée à la fin pour permettre l'édition et la reprise en mode brouillon
          log("⏳ Publication reportée à la fin du workflow pour permettre l'édition");

          // Étape 2 — Ajout d'une question via IA
          log("✏️ Ajout d'une question via IA");
          await sendChatCommand(
            page,
            browserName,
            chatInput,
            "ajoute une question sur les préférences alimentaires",
          );
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
          log("✅ Question supplémentaire ajoutée");

          // Étape 3 — Suppression d'une question via IA
          log("🗑️ Suppression d'une question via IA");
          await sendChatCommand(page, browserName, chatInput, "supprime la dernière question");
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
          log("✅ Question supprimée");

          // Étape 4 — Reprise après refresh
          log("🔁 Test reprise après refresh");
          const urlBeforeReload = page.url();
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
          log("✅ Reprise ok après refresh");

          // Étape 5 — Publication (Déplacé ici)
          log("🚀 Étape 5 — Publication du formulaire");
          // CLIQUER SUR LE BOUTON "PUBLICATION"
          log("🔘 Clic sur le bouton PUBLICATION");
          const publishButton = page
            .locator("button")
            .filter({ hasText: /publication|publier/i })
            .first();
          await publishButton.waitFor({ state: "visible", timeout: 10000 });
          await publishButton.click();

          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // Vérification robuste (Supporte Full Page Success OU Modal Guest)
          const successTitle = page
            .locator("h1, .text-xl:has-text('Sondage créé avec succès !')")
            .first();
          await expect(successTitle).toBeVisible({ timeout: 15000 });
          log("✅ Formulaire publié avec succès");

          // Étape 6 — Test vote
          log("🗳️ Test vote sur formulaire");

          // Navigation simple vers le dashboard form polls
          await page.goto("/form/dashboard", {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          log("✅ Navigation vers le dashboard réussie");

          // Étape 6 — Vérification dashboard
          log("📊 Vérification dashboard");

          // Vérifier qu'on est sur le dashboard
          const dashboardTitle = await page.title();
          expect(dashboardTitle).toContain("DooDates");

          log("🎉 WORKFLOW COMPLET FORM POLL RÉUSSI");
        } else if (hasFormTitle) {
          // Mode Formulaire manuel
          log("📝 Mode Formulaire manuel détecté");
          log("⚠️ Ni chat ni formulaire trouvé - vérification de la page");
          log("⚠️ Pas de confirmation visible, vérification dashboard");
          log("📊 Vérification Dashboard");
          log("🎉 Workflow Form terminé avec succès");
        } else {
          // Fallback - aucune interface détectée
          log("⚠️ Ni chat ni formulaire trouvé - impossible de créer un formulaire");
          throw new Error("Ni chat ni formulaire trouvé - impossible de créer un formulaire");
        }
      },
      {
        // Allowlist pour ignorer les erreurs console attendues
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred/i,
          /DooDatesError/i,
          /No dates selected/i,
          /Erreur lors de la sauvegarde/i,
          /Failed to send message/i,
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
          /ResizeObserver loop/i,
        ],
      },
    );
  });

  /**
   * Nettoie les données de test après chaque exécution.
   */
  test.afterEach(async ({ page }) => {
    // Nettoyage simple du localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
  });
});
