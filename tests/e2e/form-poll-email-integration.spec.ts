import { test, expect } from "@playwright/test";

test.describe("Form Poll - Email Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer localStorage avant chaque test
    await page.goto("http://localhost:8080/DooDates");
    await page.evaluate(() => localStorage.clear());
  });

  test("should send confirmation email after form submission", async ({ page }) => {
    // Créer un formulaire
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire de sondage avec email de confirmation");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);
    
    // Remplir le formulaire
    await page.fill('[data-testid="poll-title"]', "Test Email Confirmation");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 2");
    
    // Activer les emails de confirmation
    await page.check('[data-testid="enable-email-confirmation"]');
    await page.fill('[data-testid="creator-email"]', "test@example.com");
    
    // Finaliser le formulaire
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);
    
    // Accéder au formulaire et voter
    const formUrl = page.url();
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "Test Voter");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);
    
    // Vérifier que l'email de confirmation est envoyé (simulé)
    const emailConfirmation = await page.locator('[data-testid="email-confirmation-sent"]').count();
    expect(emailConfirmation).toBeGreaterThan(0);
  });

  test("should send notification email to creator when form receives response", async ({ page }) => {
    // Créer un formulaire avec notification au créateur
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire avec notification créateur");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);
    
    await page.fill('[data-testid="poll-title"]', "Test Notification Creator");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    
    // Activer les notifications au créateur
    await page.check('[data-testid="enable-creator-notification"]');
    await page.fill('[data-testid="creator-email"]', "creator@example.com");
    
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);
    
    // Voter sur le formulaire
    const formUrl = page.url();
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "Test Voter");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);
    
    // Vérifier que la notification au créateur est envoyée
    const creatorNotification = await page.locator('[data-testid="creator-notification-sent"]').count();
    expect(creatorNotification).toBeGreaterThan(0);
  });

  test("should handle email sending errors gracefully", async ({ page }) => {
    // Créer un formulaire avec email invalide pour tester la gestion d'erreur
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire avec email invalide");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);
    
    await page.fill('[data-testid="poll-title"]', "Test Email Error");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    
    // Mettre un email invalide
    await page.check('[data-testid="enable-email-confirmation"]');
    await page.fill('[data-testid="creator-email"]', "email-invalide");
    
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);
    
    // Vérifier que l'erreur d'email est gérée
    const emailError = await page.locator('[data-testid="email-error"]').count();
    expect(emailError).toBeGreaterThan(0);
  });

  test("should include correct email template data", async ({ page }) => {
    // Créer un formulaire complet pour tester le template d'email
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire complet pour test email template");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);
    
    await page.fill('[data-testid="poll-title"]', "Test Email Template");
    await page.fill('[data-testid="poll-description"]', "Description du formulaire de test");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question template test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option A");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option B");
    
    await page.check('[data-testid="enable-email-confirmation"]');
    await page.fill('[data-testid="creator-email"]', "template@example.com");
    
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);
    
    // Voter pour déclencher l'email
    const formUrl = page.url();
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "Template Tester");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);
    
    // Vérifier que les données du template sont correctes
    const emailSent = await page.locator('[data-testid="email-template-data"]').textContent();
    expect(emailSent).toContain("Test Email Template");
    expect(emailSent).toContain("Template Tester");
  });

  test("should respect email preferences", async ({ page }) => {
    // Créer un formulaire et tester les préférences email
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire avec préférences email");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);
    
    await page.fill('[data-testid="poll-title"]', "Test Email Preferences");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    
    // Désactiver les emails
    await page.uncheck('[data-testid="enable-email-confirmation"]');
    await page.uncheck('[data-testid="enable-creator-notification"]');
    
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);
    
    // Voter et vérifier qu'aucun email n'est envoyé
    const formUrl = page.url();
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "No Email Voter");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);
    
    // Vérifier qu'aucun email n'est envoyé
    const emailSent = await page.locator('[data-testid="email-confirmation-sent"]').count();
    expect(emailSent).toBe(0);
  });

  test("should handle bulk email sending for multiple responses", async ({ page }) => {
    // Créer un formulaire et simuler plusieurs réponses
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire pour test emails multiples");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);
    
    await page.fill('[data-testid="poll-title"]', "Test Bulk Emails");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    
    await page.check('[data-testid="enable-email-confirmation"]');
    await page.fill('[data-testid="creator-email"]', "bulk@example.com");
    
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);
    
    const formUrl = page.url();
    
    // Simuler plusieurs votes
    for (let i = 1; i <= 3; i++) {
      await page.goto(formUrl);
      await page.fill('[data-testid="voter-name"]', `Voter ${i}`);
      await page.click('[data-testid="option-0"]');
      await page.click('[data-testid="submit-vote"]');
      await page.waitForTimeout(1000);
    }
    
    // Vérifier que les emails multiples sont gérés
    const bulkEmailIndicator = await page.locator('[data-testid="bulk-email-indicator"]').count();
    expect(bulkEmailIndicator).toBeGreaterThan(0);
  });
});
