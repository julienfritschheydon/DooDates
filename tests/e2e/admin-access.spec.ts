import { test, expect } from "@playwright/test";

test.describe("Admin access control (non-admin)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("Non-admin is blocked from /admin/quotas", async ({ page }) => {
    await page.goto('admin/quotas", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Accès restreint" })).toBeVisible();
    await expect(page.getByText("Ce tableau de bord est réservé aux administrateurs.")).toBeVisible();
  });

  test("Non-admin is blocked from /admin/user-activity", async ({ page }) => {
    await page.goto('admin/user-activity", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Accès réservé aux administrateurs")).toBeVisible();
  });
});
