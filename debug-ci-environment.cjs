const { chromium } = require("playwright");

async function debugCIEnvironment() {
  console.log("🔍 Debug CI Environment - Chat Input Detection");

  const browser = await chromium.launch({
    headless: true, // Mode CI
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Args CI typiques
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Simuler les conditions CI
    console.log("🚀 Navigation vers workspace...");
    await page.goto("http://localhost:8080/DooDates/date-polls/workspace/date", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    console.log(`✅ Navigation terminée: ${page.url()}`);

    // Attendre que la page soit chargée
    await page.waitForLoadState("domcontentloaded");

    // Analyser le DOM
    console.log("🔍 Analyse du DOM...");

    // 1. Vérifier le body
    const bodyVisible = await page.locator("body").isVisible();
    console.log(`📄 Body visible: ${bodyVisible}`);

    // 2. Chercher le chat input principal
    const chatInput = page.locator('[data-testid="chat-input"]');
    const chatInputCount = await chatInput.count();
    const chatInputVisible = chatInputCount > 0 ? await chatInput.isVisible() : false;
    console.log(
      `💬 Chat input [data-testid="chat-input"]: ${chatInputCount} trouvé(s), visible: ${chatInputVisible}`,
    );

    // 3. Chercher tous les inputs/textareas
    const allInputs = page.locator('input, textarea, [contenteditable="true"]');
    const allInputsCount = await allInputs.count();
    console.log(`📝 Tous les inputs/textareas: ${allInputsCount} trouvé(s)`);

    if (allInputsCount > 0) {
      for (let i = 0; i < Math.min(allInputsCount, 5); i++) {
        const input = allInputs.nth(i);
        const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
        const placeholder = await input.getAttribute("placeholder");
        const isVisible = await input.isVisible();
        console.log(`  - ${tagName}: placeholder="${placeholder}", visible=${isVisible}`);
      }
    }

    // 4. Chercher les éléments avec placeholder spécifique
    const placeholders = [
      'textarea[placeholder*="sondage"]',
      'textarea[placeholder*="formulaire"]',
      'textarea[placeholder*="quiz"]',
      'textarea[placeholder*="disponibilités"]',
    ];

    for (const placeholder of placeholders) {
      const element = page.locator(placeholder);
      const count = await element.count();
      if (count > 0) {
        console.log(`🎯 Placeholder trouvé: ${placeholder} (${count} éléments)`);
      }
    }

    // 5. Vérifier l'état de React
    const reactRoot = page.locator("#root");
    const reactRootExists = (await reactRoot.count()) > 0;
    if (reactRootExists) {
      const reactContent = await reactRoot.textContent();
      console.log(`⚛️ React root exists, content length: ${reactContent?.length || 0}`);

      // Vérifier si le contenu est du JavaScript non rendu
      if (reactContent && reactContent.includes("function()")) {
        console.log("⚠️ React root contains JavaScript - app not rendered!");
      }
    }

    // 6. Screenshot pour debug
    await page.screenshot({
      path: `debug-ci-environment-${Date.now()}.png`,
      fullPage: true,
    });
    console.log("📸 Screenshot sauvegardé");
  } catch (error) {
    console.error("❌ Erreur:", error);

    // Screenshot même en cas d'erreur
    try {
      await page.screenshot({
        path: `debug-ci-error-${Date.now()}.png`,
        fullPage: true,
      });
    } catch (screenshotError) {
      console.log("⚠️ Impossible de sauvegarder le screenshot");
    }
  } finally {
    await browser.close();
  }
}

debugCIEnvironment().catch(console.error);
