#!/usr/bin/env node

/**
 * Test spécifique pour le chat input E2E
 * Utilise le helper navigateToWorkspace existant
 */

const { chromium } = require("playwright");

async function testChatInput() {
  console.log("🔍 Test Chat Input E2E");
  console.log("========================");

  let browser;
  let context;
  let page;

  try {
    // Vérifier serveur
    console.log("🌐 Vérification serveur...");
    try {
      const response = await fetch("http://localhost:8080/DooDates/");
      if (!response.ok) {
        throw new Error(`Serveur répond: ${response.status}`);
      }
      console.log("✅ Serveur accessible");
    } catch (error) {
      console.log("❌ Serveur non accessible");
      console.log("💡 Lancez: npm run dev:e2e");
      process.exit(1);
    }

    // Initialiser Playwright
    console.log("🚀 Initialisation Playwright...");
    browser = await chromium.launch({
      headless: false, // Visible pour voir ce qui se passe
      slowMo: 500,
      timeout: 30000,
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    page = await context.newPage();

    // Logging détaillé
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`❌ [CONSOLE] ${msg.text()}`);
      }
    });

    // Navigation simple
    console.log("🧪 Navigation vers workspace...");
    await page.goto("http://localhost:8080/DooDates/chat", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });

    // Attendre React
    console.log("⏳ Attente React (3s)...");
    await page.waitForTimeout(3000);

    // Chercher le chat input avec plusieurs méthodes
    console.log("🔍 Recherche chat input...");

    const selectors = [
      '[data-testid="chat-input"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      "textarea",
      'input[type="text"]',
      '[contenteditable="true"]',
      ".chat-input textarea",
      "textarea",
    ];

    let foundElement = null;
    let foundSelector = null;

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();

          console.log(`✅ Sélecteur trouvé: ${selector}`);
          console.log(`   - Visible: ${isVisible}`);
          console.log(`   - Enabled: ${isEnabled}`);

          if (isVisible && isEnabled) {
            foundElement = element;
            foundSelector = selector;
            break;
          }
        }
      } catch (e) {
        // Continue avec le sélecteur suivant
      }
    }

    if (!foundElement) {
      // Debug: lister tous les éléments textarea
      console.log("🔍 Recherche de tous les textarea...");
      const allTextareas = await page.$$("textarea");
      console.log(`📊 ${allTextareas.length} textarea trouvés`);

      for (let i = 0; i < allTextareas.length; i++) {
        const textarea = allTextareas[i];
        try {
          const isVisible = await textarea.isVisible();
          const placeholder = await textarea.getAttribute("placeholder");
          const hasTestId = await textarea.getAttribute("data-testid");

          console.log(
            `  ${i + 1}. Visible: ${isVisible}, Placeholder: "${placeholder}", data-testid: "${hasTestId}"`,
          );
        } catch (e) {
          console.log(`  ${i + 1}. Erreur lecture attributs`);
        }
      }

      // Lister tous les inputs
      console.log("🔍 Recherche de tous les inputs...");
      const allInputs = await page.$$("input");
      console.log(`📊 ${allInputs.length} inputs trouvés`);

      throw new Error("Chat input non trouvé");
    }

    // Test d'interaction
    console.log("🧪 Test interaction chat input...");
    await foundElement.click();
    await page.waitForTimeout(500);

    // Taper un message
    await foundElement.fill("Test message E2E");
    await page.waitForTimeout(500);

    const value = await foundElement.inputValue();
    console.log(`✅ Message tapé: "${value}"`);

    // Prendre screenshot
    await page.screenshot({ path: "test-chat-input-success.png", fullPage: true });
    console.log("📸 Screenshot: test-chat-input-success.png");

    console.log("\n✅ Test chat input RÉUSSI !");
    console.log(`🎯 Sélecteur utilisé: ${foundSelector}`);
  } catch (error) {
    console.error("❌ Test échoué:", error.message);

    // Screenshot d'erreur
    if (page && !page.isClosed()) {
      await page.screenshot({ path: "test-chat-input-error.png", fullPage: true });
      console.log("📸 Screenshot erreur: test-chat-input-error.png");
    }

    process.exit(1);
  } finally {
    // Nettoyage
    try {
      if (page && !page.isClosed()) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
      console.log("🧹 Nettoyage terminé");
    } catch (cleanupError) {
      console.log(`⚠️ Erreur nettoyage: ${cleanupError.message}`);
    }
  }
}

// Lancer le test
if (require.main === module) {
  testChatInput().catch(console.error);
}

module.exports = { testChatInput };
