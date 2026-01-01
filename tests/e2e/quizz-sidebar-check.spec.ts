import { test, expect } from "@playwright/test";

/**
 * Test de vérification rapide : Quizz aligné avec sidebar
 * Vérifie que Pricing et Documentation ont bien la sidebar
 */

test.describe("Quizz - Sidebar Navigation", () => {
  test("Landing page should NOT have sidebar", async ({ page }) => {
    await page.goto("/quizz");
    
    // Vérifier que la landing page charge
    await expect(page.locator("text=Quiz")).toBeVisible({ timeout: 10000 });
    
    // Vérifier qu"il n'y a PAS de sidebar (pas de bouton hamburger)
    const hamburgerButton = page.locator("button[aria-label*="menu"]");
    await expect(hamburgerButton).not.toBeVisible();
  });

  test("Pricing page should have sidebar", async ({ page }) => {
    await page.goto("/quizz/pricing");
    
    // Attendre que la page charge
    await expect(page.locator("text=Tarifs")).toBeVisible({ timeout: 10000 });
    
    // Vérifier la présence du bouton hamburger (sidebar)
    const hamburgerButton = page.locator("button[aria-label*="menu"]').first();
    await expect(hamburgerButton).toBeVisible();
    
    // Vérifier que le contenu Pricing est présent
    await expect(page.locator("text=Gratuit")).toBeVisible();
    await expect(page.locator("text=Famille")).toBeVisible();
  });

  test("Documentation page should have sidebar", async ({ page }) => {
    await page.goto("/quizz/documentation");
    
    // Attendre que la page charge
    await expect(page.locator("text=Documentation")).toBeVisible({ timeout: 10000 });
    
    // Vérifier la présence du bouton hamburger (sidebar)
    const hamburgerButton = page.locator("button[aria-label*="menu"]').first();
    await expect(hamburgerButton).toBeVisible();
    
    // Vérifier que le contenu Documentation est présent
    await expect(page.locator("text=Démarrage rapide")).toBeVisible();
    await expect(page.locator("text=Fonctionnalités")).toBeVisible();
  });

  test("Dashboard should have sidebar", async ({ page }) => {
    await page.goto("/quizz/dashboard");
    
    // Attendre que la page charge
    await page.waitForLoadState("networkidle");
    
    // Vérifier la présence du bouton hamburger (sidebar)
    const hamburgerButton = page.locator("button[aria-label*="menu"]').first();
    await expect(hamburgerButton).toBeVisible();
  });

  test("Sidebar navigation should work", async ({ page }) => {
    await page.goto("/quizz/pricing");
    
    // Attendre que la page charge
    await expect(page.locator("text=Tarifs")).toBeVisible({ timeout: 10000 });
    
    // Ouvrir la sidebar
    const hamburgerButton = page.locator("button[aria-label*="menu"]').first();
    await hamburgerButton.click();
    
    // Attendre que la sidebar s'ouvre
    await page.waitForTimeout(500);
    
    // Vérifier que les liens de navigation sont présents
    await expect(page.locator("text=Tableau de bord")).toBeVisible();
    await expect(page.locator("text=Créer un Quiz")).toBeVisible();
    
    // Cliquer sur Documentation
    await page.locator("a[href*="/quizz/documentation"]").first().click();
    
    // Vérifier la navigation
    await expect(page).toHaveURL(/DooDates/\/quizz\/documentation/);
    await expect(page.locator("text=Documentation")).toBeVisible();
  });
});
