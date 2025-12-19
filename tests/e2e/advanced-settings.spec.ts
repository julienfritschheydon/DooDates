import { test, expect } from "@playwright/test";

test.describe("Advanced Settings - Date Polls", () => {
  test("should create date poll with advanced settings", async ({ page }) => {
    // Naviguer vers le créateur de Date Poll
    await page.goto("/DooDates/date-polls/workspace/date");
    await page.waitForLoadState("networkidle");

    // Remplir le titre
    await page.fill('input[placeholder*="Réunion"]', "Test Advanced Settings");

    // Sélectionner une date
    await page.click('button[name="Mois suivant"]');
    await page.waitForTimeout(500);
    
    // Ouvrir le panneau Paramètres et Partage
    await page.click('button:has-text("Paramètres et Partage")');
    await page.waitForTimeout(1000);

    // Vérifier que l'onglet "Paramètres avancés" est visible
    const advancedTab = page.locator('button:has-text("Paramètres avancés")');
    await expect(advancedTab).toBeVisible();

    // Cliquer sur l'onglet Paramètres avancés
    await advancedTab.click();
    await page.waitForTimeout(500);

    // Vérifier que les paramètres sont visibles
    await expect(page.locator('text=Afficher le logo DooDates')).toBeVisible();
    await expect(page.locator('text=Connexion requise')).toBeVisible();
    await expect(page.locator('text=Une seule réponse par personne')).toBeVisible();

    // Activer "Connexion requise"
    const connectionToggle = page.locator('input[type="checkbox"]').nth(1);
    await connectionToggle.click();

    // Activer "Une seule réponse par personne"
    const oneResponseToggle = page.locator('input[type="checkbox"]').nth(2);
    await oneResponseToggle.click();

    // Aller à l'onglet Visibilité
    await page.click('button:has-text("Visibilité")');
    await page.waitForTimeout(500);

    // Sélectionner "Créateur uniquement"
    await page.click('input[value="creator-only"]');

    // Publier le sondage
    await page.click('button:has-text("Publier le sondage")');
    await page.waitForTimeout(2000);

    // Vérifier que le sondage a été créé
    await expect(page).toHaveURL(/\/results\//);
  });
});

test.describe("Advanced Settings - Form Polls", () => {
  test("should create form poll with all advanced settings", async ({ page }) => {
    // Naviguer vers le créateur de Form Poll
    await page.goto("/DooDates/form-polls/workspace/form");
    await page.waitForLoadState("networkidle");

    // Remplir le titre
    await page.fill('input[placeholder*="titre"]', "Test Form Advanced Settings");

    // Ajouter une question
    await page.click('button:has-text("Ajouter une question")');
    await page.waitForTimeout(500);

    await page.fill('input[placeholder*="question"]', "Quelle est votre disponibilité?");

    // Scroll vers les paramètres avancés
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Vérifier que la section Paramètres avancés est visible
    await expect(page.locator('text=Paramètres avancés')).toBeVisible();

    // Activer plusieurs paramètres
    await page.click('text=Temps estimé de complétion');
    await page.click('text=Connexion requise');
    await page.click('text=Une seule réponse par personne');

    // Publier le formulaire
    await page.click('button:has-text("Publier")');
    await page.waitForTimeout(2000);

    // Vérifier que le formulaire a été créé
    await expect(page.url()).toContain("/form");
  });
});

test.describe("Advanced Settings - Availability Polls", () => {
  test("should create availability poll with advanced settings", async ({ page }) => {
    // Naviguer vers le créateur d'Availability Poll
    await page.goto("/DooDates/availability-polls/workspace/availability");
    await page.waitForLoadState("networkidle");

    // Remplir le titre
    await page.fill('input[placeholder*="titre"]', "Test Availability Advanced Settings");

    // Scroll vers les paramètres avancés
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Vérifier que la section Paramètres avancés est visible
    await expect(page.locator('text=Paramètres avancés')).toBeVisible();

    // Activer des paramètres
    const toggles = page.locator('input[type="checkbox"]');
    await toggles.nth(0).click(); // Logo
    await toggles.nth(1).click(); // Connexion requise

    // Créer le sondage
    await page.click('button:has-text("Créer le sondage")');
    await page.waitForTimeout(2000);

    // Vérifier que le sondage a été créé
    await expect(page.url()).toContain("/availability");
  });
});

test.describe("Advanced Settings - Quizz", () => {
  test("should create quizz with advanced settings", async ({ page }) => {
    // Naviguer vers le créateur de Quizz
    await page.goto("/DooDates/quizz/create");
    await page.waitForLoadState("networkidle");

    // Remplir le titre
    await page.fill('input[placeholder*="titre"]', "Test Quizz Advanced Settings");

    // Ajouter une question
    await page.click('button:has-text("Ajouter une question")');
    await page.waitForTimeout(500);

    await page.fill('input[placeholder*="question"]', "Quelle est la capitale de la France?");
    await page.fill('input[placeholder*="réponse correcte"]', "Paris");

    // Scroll vers les paramètres avancés
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Vérifier que la section Paramètres avancés est visible (conditionnelle)
    await expect(page.locator('text=Paramètres avancés')).toBeVisible();

    // Activer des paramètres
    await page.click('text=Temps estimé de complétion');
    await page.click('text=Afficher réponses correctes');

    // Créer le quiz
    await page.click('button:has-text("Créer le quiz")');
    await page.waitForTimeout(2000);

    // Vérifier que le quiz a été créé
    await expect(page.url()).toContain("/quizz");
  });
});
