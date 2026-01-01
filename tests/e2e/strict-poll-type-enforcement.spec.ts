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

    // 3. Send a message to trigger the mock
    const chatInput = page.getByPlaceholder("Décrivez votre sondage...");
    await chatInput.fill("Crée un formulaire");
    await page.keyboard.press("Enter");

    // 4. Verify error message
    const errorMessage = page.locator("text=Je ne peux pas créer ce type de sondage ici");
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
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

    // 3. Send a message to trigger the mock
    const chatInput = page.getByPlaceholder("Décrivez votre formulaire...");
    await chatInput.fill("Crée un sondage de date");
    await page.keyboard.press("Enter");

    // 4. Verify error message
    await expect(page.locator("text=Je ne peux pas créer ce type de sondage ici")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=réservée aux sondages de type "form"')).toBeVisible();
  });
});
