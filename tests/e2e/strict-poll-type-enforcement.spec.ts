import { test, expect } from "@playwright/test";

test.describe("Strict Poll Type Enforcement", () => {
  test.only("should block creating a form poll in date workspace", async ({ page }) => {
    // 1. Navigate to Date Workspace
    await page.goto("/DooDates/workspace/date");

    // 2. Mock AI response to propose a FORM poll
    await page.route("**/api/gemini/chat", async (route) => {
      const json = {
        text: "Voici un sondage formulaire.",
        poll: {
          type: "form",
          title: "Sondage Formulaire Interdit",
          questions: [{ title: "Question?", type: "text", required: true }],
        },
      };
      await route.fulfill({ json });
    });

    // 3. Send a message to trigger the mock
    const chatInput = page.getByPlaceholder("Décrivez votre sondage...");
    await chatInput.fill("Crée un formulaire");
    await page.keyboard.press("Enter");

    // 4. Verify error message
    const errorMessage = page.locator("text=Je ne peux pas créer ce type de sondage ici");
    await expect(errorMessage).toBeVisible();
    console.log("Error message content:", await errorMessage.textContent());
    // await expect(page.locator('text=réservée aux sondages de type "date"')).toBeVisible();
  });

  test("should block creating a date poll in form workspace", async ({ page }) => {
    // 1. Navigate to Form Workspace
    await page.goto("/DooDates/workspace/form");

    // 2. Mock AI response to propose a DATE poll
    await page.route("**/api/gemini/chat", async (route) => {
      const json = {
        text: "Voici un sondage de dates.",
        poll: {
          type: "date",
          title: "Sondage Date Interdit",
          dates: ["2030-01-01"],
        },
      };
      await route.fulfill({ json });
    });

    // 3. Send a message to trigger the mock
    const chatInput = page.getByPlaceholder("Décrivez votre sondage...");
    await chatInput.fill("Crée un sondage de date");
    await page.keyboard.press("Enter");

    // 4. Verify error message
    await expect(page.locator("text=Je ne peux pas créer ce type de sondage ici")).toBeVisible();
    await expect(page.locator('text=réservée aux sondages de type "form"')).toBeVisible();
  });
});
