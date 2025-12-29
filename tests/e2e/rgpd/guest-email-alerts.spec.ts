
import { test, expect } from '@playwright/test';

test.describe('🔒 RGPD - Composants Invité', () => {

    test('RGPD-VERIF-01: La page d\'accueil charge la bannière invité', async ({ page }) => {
        await page.goto('/');
        // Attendre un peu pour le chargement du quota et du useEffect
        await page.waitForTimeout(3000);
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toMatch(/Mode Invité/i);
    });

    test('RGPD-VERIF-02: Le créateur de formulaire affiche le champ email pour les invités', async ({ page }) => {
        await page.goto('/form-polls/workspace/form');
        await page.waitForTimeout(3000);
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('RGPD-VERIF-03: Le créateur de sondage de dates affiche le champ email pour les invités', async ({ page }) => {
        await page.goto('/date-polls/workspace/date');
        await page.waitForTimeout(3000);
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    });
});
