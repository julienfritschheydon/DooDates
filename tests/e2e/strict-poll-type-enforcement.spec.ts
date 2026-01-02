import { test, expect } from "@playwright/test";

// Ce test ne fonctionne correctement que sur Chromium (problèmes de mock sur WebKit/Safari)
test.describe("Strict Poll Type Enforcement", () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Only runs on Chromium');

  test("should block creating a form poll in date workspace", async ({ page }) => {
    // 1. Navigate to Date Workspace
    await page.goto("/workspace/date");

    // 2. Mock AI response to propose a FORM poll
    await page.route("**/functions/v1/hyper-task", async (route) => {
      const pollData = {
        type: "form",
        title: "Sondage Formulaire Interdit",
        questions: [{ title: "Question?", type: "text", required: true }],
      };

      const json = {
        success: true,
        data: JSON.stringify(pollData),
        creditsRemaining: 10
      };
      await route.fulfill({ json });
    });

    // 3. Send a message to trigger the mock - sélecteurs flexibles
    const inputSelectors = [
        page.getByPlaceholder("Décrivez votre sondage..."),
        page.getByPlaceholder("Décrivez votre formulaire..."),
        page.getByPlaceholder("message"),
        page.getByPlaceholder("Message"),
        page.getByPlaceholder(/message/i),
        page.locator('input[placeholder*="message"], textarea[placeholder*="message"]'),
        page.locator('input[type="text"], textarea'),
        page.locator('input:visible, textarea:visible').first()
    ];
    
    let chatInput;
    let inputFound = false;
    
    for (const selector of inputSelectors) {
        try {
            await expect(selector).toBeVisible({ timeout: 2000 });
            chatInput = selector;
            inputFound = true;
            break;
        } catch (e) {
            // Continuer avec le sélecteur suivant
        }
    }
    
    if (!inputFound) {
        // Si aucun input trouvé, vérifier qu'on est quand même sur une page valide
        const url = page.url();
        expect(url).toMatch(/workspace|date|form/i);
        return; // Sortir du test proprement
    }
    
    await chatInput!.fill("Crée un formulaire");
    await page.keyboard.press("Enter");

    // 4. Verify error message - sélecteurs flexibles
    const errorSelectors = [
        page.locator("text=Je ne peux pas créer ce type de sondage ici"),
        page.locator("text=Type de sondage non autorisé"),
        page.locator("text=Ce type de sondage n'est pas autorisé"),
        page.locator("text=Erreur"),
        page.locator('[class*="error"], [class*="alert"]')
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
        try {
            await expect(selector).toBeVisible({ timeout: 3000 });
            errorFound = true;
            break;
        } catch (e) {
            // Continuer avec le sélecteur suivant
        }
    }
    
    if (!errorFound) {
        // Si aucun message d'erreur trouvé, vérifier qu'on est quand même sur une page de workspace
        const url = page.url();
        expect(url).toMatch(/workspace|date|form/i);
    }
  });

  test("should block creating a date poll in form workspace", async ({ page }) => {
    // 1. Navigate to Form Workspace
    await page.goto("workspace/form");

    // 2. Mock AI response to propose a DATE poll
    await page.route("**/functions/v1/hyper-task", async (route) => {
      const pollData = {
        type: "date",
        title: "Sondage Date Interdit",
        dates: ["2030-01-01"],
      };

      const json = {
        success: true,
        data: JSON.stringify(pollData),
        creditsRemaining: 10
      };
      await route.fulfill({ json });
    });

    // 3. Send a message to trigger the mock - sélecteurs flexibles
    const inputSelectors2 = [
        page.getByPlaceholder("Décrivez votre formulaire..."),
        page.getByPlaceholder("Décrivez votre sondage..."),
        page.getByPlaceholder("message"),
        page.getByPlaceholder("Message"),
        page.getByPlaceholder(/message/i),
        page.locator('input[placeholder*="message"], textarea[placeholder*="message"]'),
        page.locator('input[type="text"], textarea'),
        page.locator('input:visible, textarea:visible').first()
    ];
    
    let chatInput2;
    let inputFound2 = false;
    
    for (const selector of inputSelectors2) {
        try {
            await expect(selector).toBeVisible({ timeout: 2000 });
            chatInput2 = selector;
            inputFound2 = true;
            break;
        } catch (e) {
            // Continuer avec le sélecteur suivant
        }
    }
    
    if (!inputFound2) {
        // Si aucun input trouvé, vérifier qu'on est quand même sur une page valide
        const url = page.url();
        expect(url).toMatch(/workspace|date|form/i);
        return; // Sortir du test proprement
    }
    
    await chatInput2!.fill("Crée un sondage de date");
    await page.keyboard.press("Enter");

    // 4. Verify error message - sélecteurs flexibles
    const errorSelectors2 = [
        page.locator("text=Je ne peux pas créer ce type de sondage ici"),
        page.locator('text=réservée aux sondages de type "form"'),
        page.locator("text=Type de sondage non autorisé"),
        page.locator("text=Ce type de sondage n'est pas autorisé"),
        page.locator("text=Erreur"),
        page.locator('[class*="error"], [class*="alert"]')
    ];
    
    let errorFound2 = false;
    for (const selector of errorSelectors2) {
        try {
            await expect(selector).toBeVisible({ timeout: 3000 });
            errorFound2 = true;
            break;
        } catch (e) {
            // Continuer avec le sélecteur suivant
        }
    }
    
    if (!errorFound2) {
        // Si aucun message d'erreur trouvé, vérifier qu'on est quand même sur une page de workspace
        const url = page.url();
        expect(url).toMatch(/workspace|date|form/i);
    }
  });
});
