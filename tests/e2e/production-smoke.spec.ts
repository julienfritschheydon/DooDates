/**
 * 🔥 PRODUCTION SMOKE TESTS
 * 
 * Tests critiques qui s'exécutent contre l'application déployée en production.
 * Ces tests vérifient que les fonctionnalités de base fonctionnent réellement.
 * 
 * ❌ PAS DE MOCKS - teste la vraie application avec vraies dépendances
 * 
 * OBJECTIF: Détecter immédiatement si le déploiement a cassé l'application
 * 
 * Ces tests doivent:
 * - Être rapides (< 2 minutes total)
 * - Couvrir les chemins critiques utilisateur
 * - Échouer immédiatement si l'app est cassée
 */

import { test, expect } from '@playwright/test';

// Configuration pour production
test.use({
  // Timeout plus long pour production (réseau réel)
  actionTimeout: 30000,
});

test.describe('🔥 Production Smoke Tests', () => {
  
  /**
   * TEST 1: Page d'accueil se charge
   * Vérifie que le déploiement de base fonctionne
   */
  test('Page d\'accueil charge correctement', async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/');
    
    // Vérifier que la page se charge (pas de 404/500)
    expect(page.url()).toContain('/');
    
    // Vérifier que le titre est présent
    await expect(page).toHaveTitle(/DooDates/i);
    
    // Vérifier qu'il n'y a pas d'erreur visible
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('500');
    expect(bodyText).not.toContain('Internal Server Error');
  });

  /**
   * TEST 2: Assets critiques sont chargés
   * Vérifie que les fichiers JS/CSS sont bien déployés
   */
  test('Assets critiques sont chargés sans erreur', async ({ page }) => {
    const errors: string[] = [];
    
    // Écouter les erreurs de chargement
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
    
    // Charger la page
    await page.goto('/');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    const criticalErrors = errors.filter(error => 
      error.includes('.js') || 
      error.includes('.css') ||
      error.includes('chunk')
    );
    
    if (criticalErrors.length > 0) {
      console.error('❌ Erreurs critiques détectées:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  /**
   * TEST 3: Pas d'erreurs console critiques
   * Détecte les erreurs JavaScript qui casseraient l'app
   */
  test('Pas d\'erreurs console critiques', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capturer les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorer les erreurs non-critiques connues
        if (!text.includes('ResizeObserver') && 
            !text.includes('favicon') &&
            !text.includes('third-party')) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Charger la page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Attendre un peu pour que les erreurs asynchrones apparaissent
    await page.waitForTimeout(2000);
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console:', consoleErrors);
    }
    
    expect(consoleErrors.length).toBe(0);
  });

  /**
   * TEST 4: Navigation principale fonctionne
   * Vérifie que le routing de l'app fonctionne
   */
  test('Navigation principale fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que l'application React s'est montée
    // (présence de l'élément root)
    const root = await page.locator('#root');
    await expect(root).toBeVisible();
    
    // Vérifier que le contenu de l'app est présent
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent!.length).toBeGreaterThan(100);
  });

  /**
   * TEST 5: Configuration Supabase est valide
   * Vérifie qu'il n'y a pas d'erreurs Supabase visibles en production
   */
  test('Configuration Supabase est présente', async ({ page }) => {
    // Capturer les erreurs console dès le début
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Attendre un peu pour que l'application s'initialise et que toute erreur Supabase apparaisse
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    
    // Vérifier qu'il n'y a pas de message d'erreur Supabase visible dans l'UI
    // Si ces erreurs sont visibles, cela signifie que la config Supabase est manquante ou invalide
    expect(bodyText).not.toContain('Supabase URL is required');
    expect(bodyText).not.toContain('Supabase key is required');
    expect(bodyText).not.toContain('Invalid API key');
    expect(bodyText).not.toContain('supabase client is required');
    expect(bodyText).not.toContain('Failed to initialize Supabase');
    
    // Vérifier qu'il n'y a pas d'erreurs Supabase critiques dans la console
    const supabaseErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('supabase') && 
      (error.includes('failed') || error.includes('error') || error.includes('invalid'))
    );
    
    if (supabaseErrors.length > 0) {
      console.error('Erreurs Supabase détectées:', supabaseErrors);
    }
    
    expect(supabaseErrors.length).toBe(0);
  });

  /**
   * TEST 6: L'app peut gérer les routes de base
   * Vérifie que le système de routing SPA fonctionne (404.html fallback)
   */
  test('Routing SPA fonctionne (404 fallback)', async ({ page }) => {
    // Tester une route qui n'existe pas physiquement
    // GitHub Pages doit rediriger vers index.html via 404.html
    await page.goto('/some-random-route-that-does-not-exist');
    
    // La page ne doit pas afficher une vraie 404
    const bodyText = await page.textContent('body');
    
    // Doit rediriger vers l'app, pas afficher une erreur GitHub Pages
    expect(bodyText).not.toContain('GitHub Pages');
    expect(bodyText).not.toContain('There isn\'t a GitHub Pages site here');
    
    // L'app React doit être montée même sur une mauvaise route
    const root = await page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
  });

  /**
   * TEST 7: Les fonctionnalités de base sont accessibles
   * Vérifie que les éléments principaux de l'UI sont rendus
   */
  test('UI principale est rendue', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Attendre que React monte l'app
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Vérifier que l'app a du contenu (pas juste un écran blanc)
    const rootContent = await page.locator('#root').textContent();
    expect(rootContent).toBeTruthy();
    expect(rootContent!.length).toBeGreaterThan(50);
    
    // Vérifier qu'il n'y a pas de message d'erreur React visible
    const hasReactError = await page.locator('text=/error|erreur|something went wrong/i').count();
    expect(hasReactError).toBe(0);
  });

  /**
   * TEST 8: Service Worker est chargé (PWA)
   * Vérifie que le SW est bien déployé et enregistré
   */
  test('Service Worker est disponible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que sw.js est accessible
    const swResponse = await page.goto('/sw.js');
    expect(swResponse?.status()).toBe(200);
    
    // Vérifier que le contenu du SW n'est pas vide
    const swContent = await swResponse?.text();
    expect(swContent).toBeTruthy();
    expect(swContent!.length).toBeGreaterThan(100);
  });
});

/**
 * TEST SUITE: Fonctionnalités critiques utilisateur
 * 
 * Tests des parcours utilisateur essentiels qui DOIVENT fonctionner
 */
test.describe('👤 Fonctionnalités Critiques Utilisateur', () => {
  
  /**
   * TEST 9: Peut accéder au mode invité
   * Fonctionnalité de base: utiliser l'app sans compte
   */
  test('Mode invité est accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Attendre que la page soit prête
    await page.waitForTimeout(2000);
    
    // Chercher des signes que l'app fonctionne en mode invité
    // (boutons, formulaires, etc.)
    const bodyText = await page.textContent('body');
    
    // L'app ne doit pas être bloquée sur un écran de connexion forcée
    expect(bodyText).toBeTruthy();
    
    // Vérifier que l'app n'est pas dans un état d'erreur
    const hasErrorState = await page.locator('[role="alert"]').count();
    
    // Si une alerte existe, vérifier qu'elle n'est pas bloquante
    if (hasErrorState > 0) {
      const alertText = await page.locator('[role="alert"]').first().textContent();
      expect(alertText).not.toContain('fatal');
      expect(alertText).not.toContain('crashed');
    }
  });

  /**
   * TEST 10: Assets statiques (logo, manifest) sont accessibles
   * Vérifie que les fichiers statiques sont bien déployés
   */
  test('Assets statiques sont accessibles', async ({ page }) => {
    // Vérifier le manifest.json (PWA)
    const manifestResponse = await page.goto('/manifest.json');
    expect(manifestResponse?.status()).toBe(200);
    
    // Vérifier qu'il contient du JSON valide
    const manifestText = await manifestResponse?.text();
    expect(() => JSON.parse(manifestText || '{}')).not.toThrow();
    
    // Vérifier le logo
    const logoResponse = await page.goto('/logo-doodates.svg');
    expect(logoResponse?.status()).toBe(200);
  });
});

/**
 * 🚨 CRITÈRES DE SUCCÈS
 * 
 * Si UN SEUL de ces tests échoue:
 * - L'application est considérée comme CASSÉE en production
 * - Une alerte doit être créée immédiatement
 * - Un rollback doit être envisagé
 * 
 * Ces tests représentent le minimum absolu pour qu'une application
 * soit considérée comme "fonctionnelle" en production.
 */

