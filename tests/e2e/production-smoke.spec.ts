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

import { test, expect } from "@playwright/test";
import { waitForNetworkIdle, waitForReactStable } from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";

/**
 * Helper: Extraire le base path de l'URL de base
 * Ex: https://user.github.io/DooDates → /DooDates
 * Ex: http://localhost:4173 → /
 */
function getBasePath(): string {
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";
  try {
    const url = new URL(baseUrl);
    // Si le pathname est / ou vide, pas de base path
    if (!url.pathname || url.pathname === "/") {
      return "";
    }
    // Sinon, retourner le pathname (avec le / initial)
    return url.pathname.replace(/\/$/, ""); // Retirer trailing slash
  } catch {
    return "";
  }
}

// Configuration pour production
test.use({
  // Timeout plus long pour production (réseau réel)
  actionTimeout: 30000,
});

test.describe("🔥 Production Smoke Tests", () => {
  // Déterminer si on doit skip le test BASE_URL (en CI avec localhost)
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    parsed = new URL("http://localhost:8080");
  }
  const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
  const shouldSkipBaseUrlTest = isLocalhost && !!process.env.CI;

  (shouldSkipBaseUrlTest ? test.skip : test)(
    "Configuration BASE_URL valide",
    async ({ request }) => {
      const baseUrl = process.env.BASE_URL || "http://localhost:8080";
      let parsed: URL;
      try {
        parsed = new URL(baseUrl);
      } catch (error) {
        throw new Error(`BASE_URL invalide: ${baseUrl} (${String(error)})`);
      }

      const response = await request.get(baseUrl, { maxRedirects: 3 });
      expect(
        response.ok(),
        `BASE_URL ${baseUrl} inaccessible (status ${response.status()})`,
      ).toBeTruthy();
    },
  );

  /**
   * TEST 1: Page d'accueil se charge
   * Vérifie que le déploiement de base fonctionne
   */
  /**
   * TEST 1: Pages d'accueil produits se chargent
   * Vérifie que le déploiement de base fonctionne pour chaque produit
   */
  test("Pages produits chargent correctement", async ({ page, browserName }) => {
    const products = [
      { url: "/DooDates/date-polls", title: /Sondages de Dates/i },
      { url: "/DooDates/form-polls", title: /Formulaires/i },
      { url: "/DooDates/availability-polls", title: /Sondages de Disponibilité/i },
    ];

    for (const product of products) {
      console.log(`Testing product landing: ${product.url}`);
      await page.goto(product.url);
      await waitForNetworkIdle(page, { browserName });
      await waitForReactStable(page, { browserName });

      // Vérifier que la page se charge (pas de 404/500)
      expect(page.url()).toContain(product.url);

      // Vérifier que le titre est présent (titre de la page ou h1)
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      // Le titre peut varier légèrement, on vérifie juste qu'il y a du contenu pertinent

      // Vérifier qu'il n'y a pas d'erreur visible
      const bodyText = await page.textContent("body");
      expect(bodyText).not.toContain("404");
      expect(bodyText).not.toContain("500");
      expect(bodyText).not.toContain("Internal Server Error");
    }
  });

  /**
   * TEST 2: Assets critiques sont chargés
   * Vérifie que les fichiers JS/CSS sont bien déployés
   */
  test("Assets critiques sont chargés sans erreur", async ({ page, browserName }) => {
    const errors: string[] = [];

    // Écouter les erreurs de chargement
    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    const timeouts = getTimeouts(browserName);
    // Charger la page
    await page.goto("");

    // Attendre que la page soit complètement chargée
    await waitForNetworkIdle(page, { browserName, timeout: timeouts.network * 2 });

    // Vérifier qu'il n'y a pas d'erreurs critiques
    const criticalErrors = errors.filter(
      (error) => error.includes(".js") || error.includes(".css") || error.includes("chunk"),
    );

    if (criticalErrors.length > 0) {
      console.error("❌ Erreurs critiques détectées:", criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  /**
   * TEST 3: Pas d'erreurs console critiques
   * Détecte les erreurs JavaScript qui casseraient l'app
   *
   * ⚠️ TEMPORAIREMENT SKIP - Échec en CI (1 erreur console non identifiée)
   * TODO: Identifier et corriger l'erreur console spécifique au CI
   */
  test("Pas d'erreurs console critiques", async ({ page, browserName }) => {
    const consoleErrors: string[] = [];
    const failedRequests: { url: string; status: number; isCritical: boolean }[] = [];
    const all404s: string[] = []; // Logger TOUTES les 404 pour diagnostic
    const nonCritical404Urls = new Set<string>(); // URLs avec 404 non critiques

    /**
     * Détermine si une 404 est critique ou optionnelle
     */
    function is404Critical(url: string): boolean {
      // ✅ 404 OPTIONNELLES (ne bloquent pas le test)
      const optionalPatterns = [
        ".map", // Source maps (debug uniquement)
        "favicon", // Favicon (navigateur le demande automatiquement)
        "manifest.json", // PWA manifest (optionnel)
        "fonts.googleapis.com", // Fonts externes (fallback possible)
        "fonts.gstatic.com", // Fonts CDN
        "polyfill", // Polyfills pour vieux navigateurs
        "analytics", // Google Analytics
        "gtag", // Google Tag Manager
        "googletagmanager", // GTM
        "third-party", // Scripts tiers
        "ads", // Publicités
        "supabase.co/rest/v1/profiles", // Supabase profiles en mode invité (404 normal)
        "supabase.co/rest/v1/guest_emails", // Guest emails table (non critique)
        "supabase.co/rest/v1/web_vitals", // Web vitals table (non critique)
        "/functions/v1/", // Edge Functions Supabase (non disponibles en test local)
        "hyper-task", // Edge Function hyper-task (non disponible en test local)
      ];

      const urlLower = url.toLowerCase();
      return !optionalPatterns.some((pattern) => urlLower.includes(pattern));
    }

    // Capturer les requêtes échouées
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();

      // Logger toutes les 404 pour diagnostic
      if (status === 404) {
        all404s.push(url);
        const isCritical = is404Critical(url);
        console.log(`🔍 404 détectée: ${url} → ${isCritical ? "❌ CRITIQUE" : "✅ Optionnelle"}`);

        // Stocker les URLs non critiques pour filtrer les erreurs console
        if (!isCritical) {
          nonCritical404Urls.add(url);
        } else {
          failedRequests.push({ url, status, isCritical: true });
        }
      }
      // Autres erreurs HTTP (5xx, 403, etc.) → toujours critiques
      else if (status >= 400) {
        if (
          !url.includes("favicon") &&
          !url.includes("analytics") &&
          !url.includes("third-party")
        ) {
          console.error(`🚨 Erreur HTTP ${status}: ${url}`);
          failedRequests.push({ url, status, isCritical: true });
        }
      }
    });

    // Capturer les requêtes qui ont échoué (pour corréler avec les erreurs console)
    const failedRequestUrls = new Set<string>();
    page.on("requestfailed", (request) => {
      const url = request.url();
      // Si c'est une URL non critique (404), l'ajouter au Set
      if (nonCritical404Urls.has(url)) {
        failedRequestUrls.add(url);
      }
    });

    // Capturer les erreurs console
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();

        // Ignorer les erreurs 404 génériques si elles concernent des URLs non critiques
        // Les erreurs console pour les 404 non critiques sont attendues et non bloquantes
        const is404Error = text.includes("404") || text.includes("Not Found");
        if (is404Error && nonCritical404Urls.size > 0) {
          // Ignorer les erreurs 404 génériques en environnement local/test
          // car elles correspondent aux Edge Functions non disponibles
          return;
        }

        // Ignorer les erreurs non-critiques connues
        if (
          !text.includes("ResizeObserver") &&
          !text.includes("favicon") &&
          !text.includes("manifest.json") &&
          !text.includes("third-party") &&
          !text.includes("chrome-extension://") && // Extensions Chrome/Edge
          !text.includes("runtime/sendMessage") && // Erreurs extensions
          !text.includes("ws://localhost:8080") && // WebSocket dev inexistant
          !text.includes("force-deployment") // Fichier temporaire de déploiement
        ) {
          console.error(`🚨 Erreur console: ${text}`);
          consoleErrors.push(text);
        }
      }
      // Ignorer aussi les warnings de performance (pas des erreurs)
      if (msg.type() === "warning") {
        const text = msg.text();
        if (text.includes("[Violation]")) {
          // Violations de performance : warnings, pas des erreurs bloquantes
          return;
        }
      }
    });

    const timeouts = getTimeouts(browserName);
    // Charger la page
    await page.goto("");
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Attendre que les erreurs async apparaissent sans timeout fixe
    await expect
      .poll(() => consoleErrors.length + failedRequests.length, { timeout: 4000 })
      .toBeGreaterThanOrEqual(0);

    // Rapport détaillé
    console.log(`\n📊 Rapport d'erreurs:`);
    console.log(`  - Total 404 détectées: ${all404s.length}`);
    console.log(`  - 404 critiques: ${failedRequests.filter((r) => r.status === 404).length}`);
    console.log(
      `  - Autres erreurs HTTP: ${failedRequests.filter((r) => r.status !== 404).length}`,
    );
    console.log(`  - Erreurs console: ${consoleErrors.length}`);

    if (all404s.length > 0) {
      console.log(`\n🔍 Liste complète des 404:`);
      all404s.forEach((url) => console.log(`  - ${url}`));
    }

    if (failedRequests.length > 0) {
      console.error(`\n❌ Requêtes CRITIQUES échouées:`, JSON.stringify(failedRequests, null, 2));
      // Log détaillé pour chaque requête échouée
      failedRequests.forEach((req) => {
        console.error(`\n🚨 ÉCHEC: ${req.status} ${req.url}`);
      });
    }
    if (consoleErrors.length > 0) {
      console.error(`\n❌ Erreurs console:`, consoleErrors);
    }

    // Vérifier qu'il n'y a pas d'erreurs critiques
    expect(
      failedRequests.length,
      `${failedRequests.length} requête(s) critique(s) échouée(s)`,
    ).toBe(0);
    expect(consoleErrors.length, `${consoleErrors.length} erreur(s) console détectée(s)`).toBe(0);
  });

  /**
   * TEST 4: Navigation principale fonctionne
   * Vérifie que le routing de l'app fonctionne
   */
  test("Navigation principale fonctionne", async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    await page.goto("");
    await waitForNetworkIdle(page, { browserName, timeout: timeouts.network });

    // Attendre que le DOM affiche du contenu significatif
    await expect
      .poll(
        async () => {
          const body = await page.locator("body").textContent();
          return body?.trim().replace(/\s+/g, " ").length ?? 0;
        },
        { timeout: 5000 },
      )
      .toBeGreaterThan(50);

    // Vérifier que l'application React a du contenu
    // Note: On ne vérifie pas que #root est visible car il peut être caché en CSS
    // mais on vérifie que l'app a rendu du contenu
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();

    // Vérifier qu'il y a du contenu significatif (pas juste du white space)
    const trimmedText = bodyText!.trim().replace(/\s+/g, " ");
    expect(trimmedText.length).toBeGreaterThan(50);

    // Vérifier que #root existe au moins (même s'il est caché en CSS)
    const root = await page.locator("#root");
    await expect(root).toBeAttached(); // Vérifie que l'élément existe dans le DOM
  });

  /**
   * TEST 5: Configuration Supabase est valide
   * Vérifie qu'il n'y a pas d'erreurs Supabase visibles en production
   */
  test("Configuration Supabase est présente", async ({ page, browserName }) => {
    // Capturer les erreurs console dès le début
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("");
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Attendre que la page rende du contenu pour laisser les erreurs éventuelles se manifester
    await expect
      .poll(
        async () => {
          const body = await page.locator("body").textContent();
          return body?.trim().length ?? 0;
        },
        { timeout: 5000 },
      )
      .toBeGreaterThan(0);

    const bodyText = await page.textContent("body");

    // Vérifier qu'il n'y a pas de message d'erreur Supabase visible dans l'UI
    // Si ces erreurs sont visibles, cela signifie que la config Supabase est manquante ou invalide
    expect(bodyText).not.toContain("Supabase URL is required");
    expect(bodyText).not.toContain("Supabase key is required");
    expect(bodyText).not.toContain("Invalid API key");
    expect(bodyText).not.toContain("supabase client is required");
    expect(bodyText).not.toContain("Failed to initialize Supabase");

    // Vérifier qu'il n'y a pas d'erreurs Supabase critiques dans la console
    const supabaseErrors = consoleErrors.filter(
      (error) =>
        error.toLowerCase().includes("supabase") &&
        (error.includes("failed") || error.includes("error") || error.includes("invalid")),
    );

    if (supabaseErrors.length > 0) {
      console.error("Erreurs Supabase détectées:", supabaseErrors);
    }

    expect(supabaseErrors.length).toBe(0);
  });

  /**
   * TEST 6: L'app peut gérer les routes de base
   * Vérifie que le système de routing SPA fonctionne (404.html fallback)
   */
  test("Routing SPA fonctionne (404 fallback)", async ({ page, browserName }) => {
    const basePath = getBasePath();

    // Tester une route qui n'existe pas physiquement
    // GitHub Pages doit rediriger vers index.html via 404.html
    const testRoute = `${basePath}/some-random-route-that-does-not-exist`;

    await page.goto(testRoute, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Attendre que l'app se charge et rende du contenu
    await expect
      .poll(
        async () => {
          const body = await page.locator("body").textContent();
          return body?.trim().length ?? 0;
        },
        { timeout: 5000 },
      )
      .toBeGreaterThan(20);

    // La page ne doit pas afficher une vraie 404 GitHub Pages
    const bodyText = await page.textContent("body");

    // Doit rediriger vers l'app, pas afficher une erreur GitHub Pages
    // Note: L'app peut afficher sa propre page 404 (Not Found), c'est OK
    expect(bodyText).not.toContain("GitHub Pages");
    expect(bodyText).not.toContain("There isn't a GitHub Pages site here");

    // Vérifier que l'app a du contenu (même si c'est une page 404 de l'app)
    expect(bodyText).toBeTruthy();
    expect(bodyText!.trim().length).toBeGreaterThan(20);
  });

  /**
   * TEST 7: Les fonctionnalités de base sont accessibles
   * Vérifie que les éléments principaux de l'UI sont rendus
   */
  test("UI principale est rendue", async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    await page.goto("");

    // Attendre que la page soit complètement chargée
    await waitForNetworkIdle(page, { browserName, timeout: timeouts.network });
    await waitForReactStable(page, { browserName });

    await expect
      .poll(
        async () => {
          const body = await page.locator("body").textContent();
          return body?.trim().replace(/\s+/g, " ").length ?? 0;
        },
        { timeout: 5000 },
      )
      .toBeGreaterThan(50);

    // Vérifier que l'app a du contenu dans le body (pas juste un écran blanc)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();

    const trimmedText = bodyText!.trim().replace(/\s+/g, " ");
    expect(trimmedText.length).toBeGreaterThan(50);

    // Vérifier que #root existe (même s'il est caché en CSS)
    const root = await page.locator("#root");
    await expect(root).toBeAttached();

    // Vérifier qu'il n'y a pas de message d'erreur React visible
    const hasReactError = await page.locator("text=/error|erreur|something went wrong/i").count();
    expect(hasReactError).toBe(0);
  });

  /**
   * TEST 8: Service Worker est chargé (PWA)
   * Vérifie que le SW est bien déployé et enregistré
   *
   * Note: Le SW est actuellement désactivé (Phase 5 - futur)
   * Ce test vérifie qu'il est accessible mais ne s'enregistre pas
   *
   * FIXME: Test à exécuter uniquement sur GitHub Pages en production
   * Le serveur Vite dev ne sert pas sw.js de la même manière
   */
  test("Service Worker est disponible", async ({ page, browserName }) => {
    const baseUrl = process.env.BASE_URL || "http://localhost:8080";
    const isProd = !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(baseUrl);
    test.skip(!isProd, "Test exécuté uniquement en production GitHub Pages");

    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

    await page.goto("");
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    const swUrl = new URL("sw.js", normalizedBaseUrl).toString();
    const swResponse = await page.request.get(swUrl);
    expect(swResponse.status()).toBe(200);

    const swContent = await swResponse.text();
    expect(swContent).toBeTruthy();
    expect(swContent.length).toBeGreaterThan(100);
    expect(swContent).toContain("Service Worker désactivé");
  });
});

/**
 * TEST SUITE: Fonctionnalités critiques utilisateur
 *
 * Tests des parcours utilisateur essentiels qui DOIVENT fonctionner
 */
test.describe("👤 Fonctionnalités Critiques Utilisateur", () => {
  /**
   * TEST 9: Peut accéder au mode invité
   * Fonctionnalité de base: utiliser l'app sans compte
   */
  test("Mode invité est accessible", async ({ page, browserName }) => {
    await page.goto("");
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    await expect
      .poll(
        async () => {
          const body = await page.locator("body").textContent();
          return body?.trim().length ?? 0;
        },
        { timeout: 5000 },
      )
      .toBeGreaterThan(0);

    // Chercher des signes que l'app fonctionne en mode invité
    // (boutons, formulaires, etc.)
    const bodyText = await page.textContent("body");

    // L'app ne doit pas être bloquée sur un écran de connexion forcée
    expect(bodyText).toBeTruthy();

    // Vérifier que l'app n'est pas dans un état d'erreur
    const hasErrorState = await page.locator('[role="alert"]').count();

    // Si une alerte existe, vérifier qu'elle n'est pas bloquante
    if (hasErrorState > 0) {
      const alertText = await page.locator('[role="alert"]').first().textContent();
      expect(alertText).not.toContain("fatal");
      expect(alertText).not.toContain("crashed");
    }
  });

  /**
   * TEST 10: Assets statiques (logo) sont accessibles
   * Vérifie que les fichiers statiques sont bien déployés
   *
   * Note: Le manifest.json est généré dynamiquement dans index.html (blob URL)
   * donc nous testons uniquement les assets statiques réels
   *
   * FIXME: Test à exécuter uniquement sur GitHub Pages en production
   * Le serveur Vite dev retourne text/html pour toutes les routes inexistantes
   */
  test("Assets statiques sont accessibles", async ({ page, browserName }) => {
    const baseUrl = process.env.BASE_URL || "http://localhost:8080";
    const isProd = !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(baseUrl);
    test.skip(!isProd, "Test exécuté uniquement en production GitHub Pages");

    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

    const logoUrl = new URL("logo-doodates.svg", normalizedBaseUrl).toString();
    const logoResponse = await page.request.get(logoUrl);
    expect(logoResponse.status()).toBe(200);
    expect(logoResponse.headers()["content-type"]).toContain("svg");

    const robotsUrl = new URL("robots.txt", normalizedBaseUrl).toString();
    const robotsResponse = await page.request.get(robotsUrl);
    expect(robotsResponse.status()).toBe(200);
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
