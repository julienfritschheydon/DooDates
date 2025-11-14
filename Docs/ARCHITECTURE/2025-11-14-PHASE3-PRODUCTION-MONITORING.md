# Protection Production - Phase 3 : Monitoring Complet

## 🎯 Objectif

Mettre en place un système de monitoring proactif pour :
- **Détecter les problèmes avant les utilisateurs**
- **Réduire le MTTR** (Mean Time To Recovery) < 30min
- **Garantir l'uptime** > 99.5%
- **Maintenir les performances** (chargement < 2s)
- **0 incidents non détectés**

**Timing :** Post-bêta (après validation avec beta testers)

---

## 📊 Métriques Cibles

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **MTTR** (Mean Time To Recovery) | < 30min | Temps moyen de résolution d'incident |
| **Uptime** | > 99.5% | Disponibilité de l'application |
| **Temps de chargement** | < 2s | LCP (Largest Contentful Paint) |
| **Taux d'erreur** | < 0.1% | Erreurs / Requêtes totales |
| **Incidents non détectés** | 0 | Tous les incidents doivent être alertés |

---

## 🛠️ Composants du Monitoring

### 1. Monitoring Production (Sentry) ⭐ PRIORITÉ 1

**Objectif :** Tracking d'erreurs et exceptions en temps réel

**Référence :** `Docs/monitoring/2025-10-15-Monitoring-Production.md`

**Tâches :**
- [ ] **Installation Sentry**
  ```bash
  npm install @sentry/react @sentry/tracing
  ```

- [ ] **Configuration dans `src/main.tsx`**
  ```typescript
  import * as Sentry from "@sentry/react";
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1, // 10% des transactions
    replaysSessionSampleRate: 0.1, // 10% des sessions
    replaysOnErrorSampleRate: 1.0, // 100% quand erreur
  });
  ```

- [ ] **Intégration avec logger existant**
  - Modifier `src/lib/logger.ts` pour envoyer les erreurs à Sentry
  - Conserver le logger local pour le développement

- [ ] **Configuration alertes**
  - Email/Slack pour erreurs critiques
  - Alertes si > 10 erreurs/heure
  - Alertes si nouveau type d'erreur
  - Alertes si taux d'erreur > 5%

- [ ] **Source maps en production**
  - Configurer le build pour générer les source maps
  - Upload automatique vers Sentry lors du déploiement

**Métriques à surveiller :**
- Erreurs JavaScript par type
- Erreurs API (Supabase, Edge Functions)
- Erreurs d'authentification
- Performance des transactions (temps de réponse)

**Budget :** Gratuit jusqu'à 5000 événements/mois

---

### 2. Tests de Charge (k6 ou Artillery) ⭐ PRIORITÉ 2

**Objectif :** Vérifier que l'application supporte la charge attendue

**Choix d'outil :**
- **k6** (recommandé) : Scripts JavaScript, intégration CI/CD facile
- **Artillery** : Alternative avec YAML, plus simple pour débutants

**Tâches :**
- [ ] **Installation k6**
  ```bash
  # Windows (via Chocolatey)
  choco install k6
  
  # Ou télécharger depuis https://k6.io/docs/getting-started/installation/
  ```

- [ ] **Créer script de test de charge**
  - `tests/load/quota-tracking-load-test.js`
  - Simuler 50 utilisateurs simultanés
  - Tester les 3 endpoints Edge Function :
    - `checkQuota`
    - `consumeCredits`
    - `getJournal`

- [ ] **Scénarios de test**
  ```javascript
  // tests/load/quota-tracking-load-test.js
  import http from 'k6/http';
  import { check } from 'k6';
  
  export const options = {
    stages: [
      { duration: '30s', target: 10 },  // Montée progressive
      { duration: '1m', target: 50 },  // Charge normale
      { duration: '30s', target: 0 },   // Descente
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'], // 95% des requêtes < 2s
      http_req_failed: ['rate<0.01'],     // < 1% d'erreurs
    },
  };
  
  export default function () {
    const token = __ENV.JWT_TOKEN; // Token depuis variable d'environnement
    const baseUrl = __ENV.SUPABASE_URL || 'https://outmbbisrrdiumlweira.supabase.co';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Test checkQuota
    const checkRes = http.post(
      `${baseUrl}/functions/v1/quota-tracking`,
      JSON.stringify({
        endpoint: 'checkQuota',
        action: 'other',
        credits: 0,
      }),
      { headers }
    );
    
    check(checkRes, {
      'checkQuota status is 200': (r) => r.status === 200,
      'checkQuota response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    // Test consumeCredits
    const consumeRes = http.post(
      `${baseUrl}/functions/v1/quota-tracking`,
      JSON.stringify({
        endpoint: 'consumeCredits',
        action: 'other',
        credits: 1,
      }),
      { headers }
    );
    
    check(consumeRes, {
      'consumeCredits status is 200': (r) => r.status === 200,
    });
  }
  ```

- [ ] **Intégration CI/CD**
  - Exécuter les tests de charge avant chaque déploiement majeur
  - Alertes si les performances se dégradent

- [ ] **Tests de stress**
  - Identifier le point de rupture
  - Tester avec 100, 200, 500 utilisateurs simultanés

**Métriques à surveiller :**
- Temps de réponse (p50, p95, p99)
- Taux d'erreur sous charge
- Throughput (requêtes/seconde)
- Utilisation CPU/Mémoire Supabase

**Budget :** Gratuit (k6 open-source)

---

### 3. Tests de Régression Visuels (Percy) ⭐ PRIORITÉ 3

**Objectif :** Détecter les changements visuels non désirés

**Tâches :**
- [ ] **Installation Percy**
  ```bash
  npm install --save-dev @percy/cli @percy/playwright
  ```

- [ ] **Configuration dans Playwright**
  ```typescript
  // playwright.config.ts
  import { defineConfig } from '@playwright/test';
  import '@percy/playwright';
  
  export default defineConfig({
    use: {
      // ... config existante
    },
    projects: [
      {
        name: 'visual-regression',
        testMatch: '**/*.visual.spec.ts',
      },
    ],
  });
  ```

- [ ] **Créer tests visuels pour pages critiques**
  - `tests/e2e/visual/dashboard.visual.spec.ts`
  - `tests/e2e/visual/poll-creation.visual.spec.ts`
  - `tests/e2e/visual/journal.visual.spec.ts`

- [ ] **Exemple de test**
  ```typescript
  // tests/e2e/visual/dashboard.visual.spec.ts
  import { test, expect } from '@playwright/test';
  import percySnapshot from '@percy/playwright';
  
  test('Dashboard visual regression', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard');
  });
  ```

- [ ] **Intégration CI/CD**
  - Exécuter les tests visuels sur chaque PR
  - Review des changements visuels avant merge

**Budget :** Gratuit jusqu'à 5000 snapshots/mois

---

### 4. Health Checks Continus ⭐ PRIORITÉ 1

**Objectif :** Surveiller la disponibilité de l'application 24/7

**Options :**
- **UptimeRobot** (gratuit) : Monitoring externe simple
- **Better Uptime** : Alternative moderne avec statut page
- **Supabase Health Checks** : Monitoring interne

**Tâches :**
- [ ] **Créer endpoint health check**
  ```typescript
  // supabase/functions/health-check/index.ts
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
  
  serve(async (req) => {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: await checkDatabase(),
        edgeFunctions: await checkEdgeFunctions(),
        storage: await checkStorage(),
      },
    };
    
    const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok');
    
    return new Response(
      JSON.stringify(checks),
      {
        status: allHealthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
  
  async function checkDatabase() {
    // Vérifier connexion Supabase
    return { status: 'ok', latency: 50 };
  }
  
  async function checkEdgeFunctions() {
    // Vérifier que quota-tracking répond
    return { status: 'ok', latency: 100 };
  }
  
  async function checkStorage() {
    // Vérifier accès storage
    return { status: 'ok', latency: 30 };
  }
  ```

- [ ] **Configurer UptimeRobot**
  - URL : `https://outmbbisrrdiumlweira.supabase.co/functions/v1/health-check`
  - Intervalle : 5 minutes
  - Alertes : Email + Slack si downtime

- [ ] **Créer status page publique**
  - Afficher l'état des services
  - Historique d'incidents
  - Utiliser Better Uptime ou créer une page simple

**Métriques à surveiller :**
- Uptime global
- Temps de réponse health check
- Nombre d'incidents par mois
- MTTR (temps de résolution)

**Budget :** Gratuit (UptimeRobot jusqu'à 50 monitors)

---

### 5. Logs & Analytics Structurés ⭐ PRIORITÉ 2

**Objectif :** Centraliser et analyser les logs de production

**Tâches :**
- [ ] **Structured logging dans Edge Functions**
  - Format JSON pour tous les logs
  - Niveaux : DEBUG, INFO, WARN, ERROR
  - Context enrichi (userId, requestId, etc.)

- [ ] **Exemple de log structuré**
  ```typescript
  // supabase/functions/quota-tracking/index.ts
  console.log(JSON.stringify({
    level: 'INFO',
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    userId: userId,
    action: 'consumeCredits',
    credits: credits,
    quota: quota.total_credits_consumed,
  }));
  ```

- [ ] **Centralisation des logs**
  - Utiliser Supabase Logs (déjà disponible)
  - Optionnel : Intégrer avec Datadog/Logtail pour recherche avancée

- [ ] **Dashboard de logs**
  - Filtrer par niveau (ERROR uniquement)
  - Filtrer par utilisateur
  - Filtrer par action (quota, auth, etc.)
  - Alertes sur patterns suspects

- [ ] **Analytics structurés**
  - Événements métier (poll créé, vote enregistré)
  - Métriques de performance (temps de réponse)
  - Métriques d'usage (utilisateurs actifs, actions/jour)

**Métriques à surveiller :**
- Volume de logs par jour
- Taux d'erreur dans les logs
- Patterns d'usage (heures de pointe)
- Anomalies détectées

**Budget :** Gratuit (Supabase Logs inclus) ou ~10€/mois (Logtail)

---

## 📋 Plan d'Implémentation

### Phase 1 : Monitoring Critique (Semaine 1) - 4h
1. ✅ **Sentry** (2h)
   - Installation et configuration
   - Intégration avec logger
   - Configuration alertes

2. ✅ **Health Checks** (2h)
   - Créer endpoint health-check
   - Configurer UptimeRobot
   - Créer status page basique

### Phase 2 : Tests & Performance (Semaine 2) - 6h
3. ✅ **Tests de charge** (4h)
   - Scripts k6 pour Edge Functions
   - Tests de charge pour endpoints critiques
   - Intégration CI/CD

4. ✅ **Logs structurés** (2h)
   - Format JSON dans Edge Functions
   - Dashboard Supabase Logs
   - Alertes sur patterns suspects

### Phase 3 : Qualité Visuelle (Semaine 3) - 4h
5. ✅ **Tests visuels** (4h)
   - Installation Percy
   - Tests pour pages critiques
   - Intégration CI/CD

---

## 🎯 Métriques de Succès

### Immédiat (Semaine 1)
- [ ] Sentry configuré et capturant les erreurs
- [ ] Health checks fonctionnels toutes les 5 minutes
- [ ] Alertes email/Slack configurées

### Court terme (Semaine 2-3)
- [ ] Tests de charge validant 50 utilisateurs simultanés
- [ ] Logs structurés avec recherche fonctionnelle
- [ ] Tests visuels sur pages critiques

### Long terme (Mois 1-3)
- [ ] MTTR < 30min (moyenne sur 3 mois)
- [ ] Uptime > 99.5%
- [ ] 0 incidents non détectés
- [ ] Temps de chargement < 2s (p95)

---

## 📊 Dashboard de Monitoring

### Vue d'ensemble quotidienne
```
📊 Status Global
├── ✅ Application : Online (99.8% uptime)
├── ✅ Edge Functions : Healthy
├── ⚠️  Erreurs aujourd'hui : 3 (0.01%)
└── ✅ Performance : 1.8s (p95)

🔍 Alertes Actives
├── Aucune alerte critique
└── 2 warnings (performance légèrement dégradée)

📈 Métriques Clés
├── Utilisateurs actifs : 45
├── Requêtes/heure : 1200
├── Taux d'erreur : 0.01%
└── Temps de réponse : 180ms (moyenne)
```

### Accès aux dashboards
- **Sentry** : `https://sentry.io/organizations/doodates/`
- **UptimeRobot** : `https://uptimerobot.com/dashboard`
- **Supabase Logs** : Dashboard → Edge Functions → Logs
- **Status Page** : `https://status.doodates.com` (à créer)

---

## 🚨 Procédure d'Incident

### Détection
1. **Alerte automatique** (Sentry/UptimeRobot)
2. **Vérification** du dashboard de monitoring
3. **Identification** du problème (logs, métriques)

### Résolution
1. **Priorisation** selon impact utilisateurs
2. **Diagnostic** via logs et métriques
3. **Correction** ou rollback si nécessaire
4. **Communication** aux utilisateurs si impact majeur

### Post-mortem
1. **Analyse** de la cause racine
2. **Documentation** de l'incident
3. **Améliorations** pour éviter récurrence

---

## 📚 Références

- **Sentry** : `Docs/monitoring/2025-10-15-Monitoring-Production.md`
- **Monitoring Guests** : `Docs/MONITORING-GUEST-QUOTAS.md`
- **Architecture Quotas** : `Docs/ARCHITECTURE/2025-11-12-PHASE3-QUOTA-MIGRATION.md`
- **k6 Documentation** : https://k6.io/docs/
- **Percy Documentation** : https://docs.percy.io/
- **UptimeRobot** : https://uptimerobot.com/

---

## ✅ Checklist de Déploiement

### Pré-requis
- [ ] Compte Sentry créé
- [ ] Compte UptimeRobot créé
- [ ] Compte Percy créé (optionnel)
- [ ] Variables d'environnement configurées

### Phase 1 : Monitoring Critique
- [ ] Sentry installé et configuré
- [ ] Health check endpoint créé et déployé
- [ ] UptimeRobot configuré
- [ ] Alertes email/Slack fonctionnelles
- [ ] Test d'erreur validé dans Sentry

### Phase 2 : Tests & Performance
- [ ] Scripts k6 créés
- [ ] Tests de charge exécutés avec succès
- [ ] Logs structurés dans Edge Functions
- [ ] Dashboard Supabase Logs configuré

### Phase 3 : Qualité Visuelle
- [ ] Percy installé et configuré
- [ ] Tests visuels créés pour pages critiques
- [ ] Intégration CI/CD fonctionnelle
- [ ] Baseline de snapshots créée

### Validation
- [ ] Tous les dashboards accessibles
- [ ] Alertes testées et fonctionnelles
- [ ] Documentation équipe mise à jour
- [ ] Procédure d'incident documentée

