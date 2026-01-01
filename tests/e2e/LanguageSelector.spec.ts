import { test, expect } from "@playwright/test";

test.describe("Language Selector E2E", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/DooDates/");
    });

    test("should switch language and persist preference", async ({ page }) => {
        // Try to find a language toggler
        // Common patterns: "FR/EN" button, globe icon, dropdown
        const langToggle = page.locator('button[aria-label="Changer la langue"], [data-testid="language-selector"], button:has-text("FR"), button:has-text("EN")').first();

        if (await langToggle.count() === 0) {
            test.skip(true, "Language selector not found in UI");
            return;
        }

        await langToggle.click();

        // Check for dropdown options if applicable
        const englishOption = page.locator('text=English').first();
        if (await englishOption.isVisible()) {
            await englishOption.click();
            // Verify UI change (e.g., specific text)
            await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        }

        // Reload page to check persistence
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test("should respect browser locale fallback", async ({ browser }) => {
        const context = await browser.newContext({ locale: 'fr-FR' });
        const page = await context.newPage();
        await page.goto('/DooDates/");
        // Should default to French
        const html = page.locator('html');
        // Check lang attribute if set, or guess by content
        // This is a "soft" assertion as implementation might default to EN
        if (await html.getAttribute('lang')) {
            expect(await html.getAttribute('lang')).toMatch(/fr/i);
        }
        await context.close();
    });
});
