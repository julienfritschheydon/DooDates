import { test, expect } from "@playwright/test";

test.describe("Results Access Control - Creator Only", () => {
  test("should show results to creator and deny access to others", async ({ page, context }) => {
    // Créer un Date Poll avec visibilité "Créateur uniquement"
    await page.goto('date-polls/workspace/date");
    await page.waitForLoadState("networkidle");

    await page.fill('input[placeholder*="Réunion"]', "Test Creator Only");
    
    // Ouvrir paramètres
    await page.click('button:has-text("Paramètres et Partage")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Paramètres avancés")');
    await page.waitForTimeout(500);
    
    // Aller à Visibilité
    await page.click('button:has-text("Visibilité")');
    await page.waitForTimeout(500);
    
    // Sélectionner "Créateur uniquement"
    await page.click('input[value="creator-only"]');
    
    // Publier
    await page.click('button:has-text("Publier le sondage")');
    await page.waitForTimeout(2000);
    
    // Récupérer l'URL des résultats
    const resultsUrl = page.url();
    
    // Vérifier que le créateur voit les résultats
    await expect(page.locator('text=Résultats')).toBeVisible();
    
    // Ouvrir un nouvel onglet (simuler un visiteur)
    const newPage = await context.newPage();
    await newPage.goto(resultsUrl);
    await newPage.waitForLoadState("networkidle");
    
    // Vérifier que le message "Accès restreint" est affiché
    await expect(newPage.locator('text=Accès restreint')).toBeVisible();
    await expect(newPage.locator('text=Seul le créateur')).toBeVisible();
    
    await newPage.close();
  });
});

test.describe("Results Access Control - Voters Only", () => {
  test("should show results after voting", async ({ page }) => {
    // Créer un Date Poll avec visibilité "Participants après vote"
    await page.goto('date-polls/workspace/date");
    await page.waitForLoadState("networkidle");

    await page.fill('input[placeholder*="Réunion"]', "Test Voters Only");
    
    // Ouvrir paramètres
    await page.click('button:has-text("Paramètres et Partage")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Paramètres avancés")');
    await page.waitForTimeout(500);
    
    // Aller à Visibilité
    await page.click('button:has-text("Visibilité")');
    await page.waitForTimeout(500);
    
    // Sélectionner "Participants après vote"
    await page.click('input[value="voters"]');
    
    // Publier
    await page.click('button:has-text("Publier le sondage")');
    await page.waitForTimeout(2000);
    
    const resultsUrl = page.url();
    const pollSlug = resultsUrl.split("/results/")[1];
    
    // Aller à la page de vote
    await page.goto('poll/${pollSlug}`);
    await page.waitForLoadState("networkidle");
    
    // Avant de voter, essayer d'accéder aux résultats
    await page.goto(resultsUrl);
    await page.waitForLoadState("networkidle");
    
    // Devrait afficher le message "Vous devez voter"
    await expect(page.locator('text=voter pour voir les résultats')).toBeVisible();
    
    // Retourner voter
    await page.goto('poll/${pollSlug}`);
    await page.waitForLoadState("networkidle");
    
    // Voter (sélectionner une date et soumettre)
    // Note: Ceci dépend de l'implémentation exacte du composant de vote
    await page.click('button:has-text("Disponible")').first();
    await page.click('button:has-text("Valider")');
    await page.waitForTimeout(2000);
    
    // Maintenant accéder aux résultats
    await page.goto(resultsUrl);
    await page.waitForLoadState("networkidle");
    
    // Devrait voir les résultats
    await expect(page.locator('text=Résultats')).toBeVisible();
  });
});

test.describe("Results Access Control - Public", () => {
  test("should show results to everyone", async ({ page, context }) => {
    // Créer un Date Poll avec visibilité "Public"
    await page.goto('date-polls/workspace/date");
    await page.waitForLoadState("networkidle");

    await page.fill('input[placeholder*="Réunion"]', "Test Public");
    
    // Ouvrir paramètres
    await page.click('button:has-text("Paramètres et Partage")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Paramètres avancés")');
    await page.waitForTimeout(500);
    
    // Aller à Visibilité
    await page.click('button:has-text("Visibilité")');
    await page.waitForTimeout(500);
    
    // Sélectionner "Public" (devrait être sélectionné par défaut)
    await page.click('input[value="public"]');
    
    // Publier
    await page.click('button:has-text("Publier le sondage")');
    await page.waitForTimeout(2000);
    
    const resultsUrl = page.url();
    
    // Vérifier que le créateur voit les résultats
    await expect(page.locator('text=Résultats')).toBeVisible();
    
    // Ouvrir un nouvel onglet (simuler un visiteur)
    const newPage = await context.newPage();
    await newPage.goto(resultsUrl);
    await newPage.waitForLoadState("networkidle");
    
    // Vérifier que le visiteur voit aussi les résultats
    await expect(newPage.locator('text=Résultats')).toBeVisible();
    
    await newPage.close();
  });
});

test.describe("Results Access Control - Form Polls", () => {
  test("should enforce access control for form polls", async ({ page }) => {
    // Créer un Form Poll avec visibilité "Créateur uniquement"
    await page.goto('form-polls/workspace/form");
    await page.waitForLoadState("networkidle");

    await page.fill('input[placeholder*="titre"]', "Test Form Access Control");
    
    // Ajouter une question
    await page.click('button:has-text("Ajouter une question")');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="question"]', "Test question");
    
    // Scroll vers paramètres
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Aller à l'onglet Visibilité
    await page.click('button:has-text("Visibilité")');
    await page.waitForTimeout(500);
    
    // Sélectionner "Créateur uniquement"
    await page.click('input[value="creator-only"]');
    
    // Publier
    await page.click('button:has-text("Publier")');
    await page.waitForTimeout(2000);
    
    // Vérifier que les résultats sont visibles pour le créateur
    await expect(page.locator('text=Résultats')).toBeVisible();
  });
});
