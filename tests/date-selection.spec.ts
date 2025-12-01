import { test, expect } from "@playwright/test";

test.describe("Date Selection - Desktop Urgent", () => {

    // Desktop Test
    test("Desktop: Click and Drag Selection", async ({ page }, testInfo) => {
        // Skip if running on mobile project
        if (testInfo.project.name.includes('Mobile')) test.skip();

        await page.setViewportSize({ width: 1920, height: 1080 });
        // Using port 8080 as discovered
        await page.goto("http://localhost:8080/DooDates/workspace/date");

        // Wait for calendar
        const calendar = page.locator('[data-testid="calendar"]');
        await expect(calendar).toBeVisible({ timeout: 30000 });

        // Find visible date buttons
        const dateButtons = page.locator('button[data-date]:visible');
        const count = await dateButtons.count();
        expect(count).toBeGreaterThan(0);

        // 1. Click Selection
        const targetDate = dateButtons.nth(15);
        await expect(targetDate).toBeVisible();
        await targetDate.click();
        await expect(targetDate).toHaveClass(/bg-blue-600/);

        // 2. Drag Selection
        const dateButtonStart = dateButtons.nth(16);
        const dateButtonEnd = dateButtons.nth(18);

        await expect(dateButtonStart).toBeVisible();
        await expect(dateButtonEnd).toBeVisible();

        // Use dragTo which is more robust
        await dateButtonStart.dragTo(dateButtonEnd);

        // Verify start and end are selected
        await expect(dateButtonStart).toHaveClass(/bg-blue-600/);
        await expect(dateButtonEnd).toHaveClass(/bg-blue-600/);
    });
});
