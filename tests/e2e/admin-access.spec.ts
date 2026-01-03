import { test, expect } from "@playwright/test";

test.describe("Admin access control (non-admin)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("Non-admin is blocked from /admin/quotas", async ({ page }) => {
    await page.goto("/admin/quotas", { waitUntil: "domcontentloaded" });

    // Vérifier qu'on est bien bloqué - accepter différents messages d'erreur
    const errorMessages = [
      "Accès restreint",
      "Accès réservé aux administrateurs", 
      "Ce tableau de bord est réservé aux administrateurs",
      "404",
      "Page non trouvée",
      "Unauthorized",
      "Non autorisé"
    ];
    
    let foundError = false;
    for (const message of errorMessages) {
      try {
        await expect(page.getByText(message, { exact: false })).toBeVisible({ timeout: 2000 });
        foundError = true;
        break;
      } catch (e) {
        // Continuer avec le message suivant
      }
    }
    
    if (!foundError) {
      // Fallback: vérifier qu'on est redirigé ou que le contenu admin n'est pas visible
      const url = page.url();
      
      // Vérifier qu'on ne voit pas de contenu admin sensible
      const adminContentSelectors = [
        'text=Utilisateurs',
        'text=Statistiques',
        'text=Administration',
        'text=Dashboard admin',
        '[data-testid="admin-content"]',
        'text=crédits utilisés' // contenu quota admin
      ];
      
      let adminContentFound = false;
      for (const selector of adminContentSelectors) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
          adminContentFound = true;
          break;
        } catch (e) {
          // Continuer
        }
      }
      
      // Si on ne trouve pas de contenu admin, c'est bon
      expect(adminContentFound).toBe(false);
    }
  });

  test("Non-admin is blocked from /admin/user-activity", async ({ page }) => {
    await page.goto("/admin/user-activity", { waitUntil: "domcontentloaded" });

    // Vérifier qu'on est bien bloqué - accepter différents messages d'erreur
    const errorMessages = [
      "Accès restreint",
      "Accès réservé aux administrateurs", 
      "Ce tableau de bord est réservé aux administrateurs",
      "404",
      "Page non trouvée",
      "Unauthorized",
      "Non autorisé"
    ];
    
    let foundError = false;
    for (const message of errorMessages) {
      try {
        await expect(page.getByText(message, { exact: false })).toBeVisible({ timeout: 2000 });
        foundError = true;
        break;
      } catch (e) {
        // Continuer avec le message suivant
      }
    }
    
    if (!foundError) {
      // Fallback: vérifier qu'on est redirigé ou que le contenu admin n'est pas visible
      const url = page.url();
      
      // Vérifier qu'on ne voit pas de contenu admin sensible
      const adminContentSelectors = [
        'text=Utilisateurs',
        'text=Activité',
        'text=Administration',
        'text=Dashboard admin',
        '[data-testid="admin-content"]',
        'text=Journal',
        'text=Logs'
      ];
      
      let adminContentFound = false;
      for (const selector of adminContentSelectors) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
          adminContentFound = true;
          break;
        } catch (e) {
          // Continuer
        }
      }
      
      // Si on ne trouve pas de contenu admin, c'est bon
      expect(adminContentFound).toBe(false);
    }
  });
});
