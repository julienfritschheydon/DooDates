# Analyse Performance Tests E2E

**Date**: 3 novembre 2025  
**Problème**: Tests E2E trop lents (2-3 minutes par shard)  
**Objectif**: Réduire le temps d'exécution sans sacrifier la qualité

---

## 🔍 Problèmes Identifiés

### 1. **Attentes Excessives et Inefficaces** ⏱️ (Impact: **ÉLEVÉ**)

#### Problème
Utilisation massive de `waitForTimeout()` avec des durées fixes:

```typescript
// analytics-ai.spec.ts - Exemples
await page.waitForTimeout(3000);  // Ligne 65
await page.waitForTimeout(1000);  // Ligne 75
await page.waitForTimeout(2000);  // Ligne 98
await page.waitForTimeout(5000);  // Ligne 197, 259, 337
```

**Total cumulé par test**: 15-30 secondes d'attentes inutiles

#### Impact
- ❌ Attentes fixes même quand l'élément est déjà prêt
- ❌ Temps perdu si l'action se termine en 100ms mais on attend 3000ms
- ❌ Multiplie les temps d'exécution

#### Solution
✅ Utiliser les assertions auto-wait de Playwright:

```typescript
// ❌ AVANT (lent - 3 secondes minimum)
await page.waitForTimeout(3000);
const button = page.locator('button');

// ✅ APRÈS (rapide - dès que l'élément apparaît)
const button = page.locator('button');
await expect(button).toBeVisible({ timeout: 5000 });
```

**Gain estimé**: 10-20 secondes par test

---

### 2. **Configuration CI Séquentielle** 🚫 (Impact: **ÉLEVÉ**)

#### Problème
```typescript
// playwright.config.ts ligne 10
workers: process.env.CI ? 1 : undefined
```

**1 seul worker = tests séquentiels** au lieu de parallèles

#### Impact
- ❌ Si vous avez 10 tests de 30s chacun: **5 minutes** au lieu de **1 minute** (avec 5 workers)
- ❌ Sharding peu efficace avec 1 worker

#### Solution
```typescript
workers: process.env.CI ? 3 : undefined  // Permet 3 tests en parallèle
```

**Gain estimé**: 50-60% de temps gagné

---

### 3. **Mode Serial Inutile** 🔗 (Impact: **MOYEN**)

#### Problème
```typescript
// De nombreux fichiers
test.describe.configure({ mode: 'serial' });
```

Force l'exécution séquentielle même si les tests sont indépendants.

#### Impact
- ❌ `poll-actions.spec.ts`: mode serial alors qu'un seul test
- ❌ `analytics-ai.spec.ts`: mode serial car les tests partagent un poll (complexe)

#### Solution
**Option A** - Paralléliser avec fixtures:
```typescript
// Supprimer le mode serial
// Chaque test crée son propre poll via une fixture réutilisable
test('test 1', async ({ pollWithVotes }) => {
  // pollWithVotes est un poll déjà créé et voté
});
```

**Option B** - Garder serial mais optimiser le setup:
```typescript
// Garder le mode serial mais réduire les waits
// Créer le poll une fois, tous les tests l'utilisent
```

**Gain estimé**: 30-40% sur les suites concernées

---

### 4. **NetworkIdle Lent** 🌐 (Impact: **MOYEN**)

#### Problème
```typescript
await page.waitForLoadState("networkidle");  // Attend TOUTES les requêtes
```

**NetworkIdle** attend que le réseau soit complètement silencieux (500ms sans requête).

#### Impact
- ❌ Attend les analytics, fonts, images, etc.
- ❌ 1-3 secondes par utilisation
- ❌ Utilisé 50+ fois dans la suite

#### Solution
```typescript
// ✅ Option 1: domcontentloaded (DOM prêt)
await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

// ✅ Option 2: Attendre un élément spécifique
await page.goto('/dashboard');
await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

// ✅ Option 3: load (images peuvent charger après)
await page.goto('/dashboard', { waitUntil: 'load' });
```

**Gain estimé**: 5-10 secondes par test

---

### 5. **Setups Répétitifs** 🔄 (Impact: **ÉLEVÉ**)

#### Problème
Chaque test refait le même setup:
1. Créer un poll via IA (3-5s)
2. Voter 5 fois (5-10s)
3. Clôturer le poll (2-3s)

**Total: 10-18 secondes par test** juste pour le setup.

#### Impact
- ❌ `analytics-ai.spec.ts`: 9 tests × 15s = 2 min 15s de setup
- ❌ Tests similaires dupliqués

#### Solution
✅ **Fixtures Playwright réutilisables**:

```typescript
// fixtures.ts
export const test = base.extend<{
  activePoll: Poll;
  pollWithVotes: Poll;
  closedPollWithAnalytics: Poll;
}>({
  // Poll actif simple (réutilisé par plusieurs tests)
  activePoll: async ({ page }, use) => {
    const poll = await createPollQuick(page);
    await use(poll);
  },
  
  // Poll avec votes (créé une fois, réutilisé)
  pollWithVotes: async ({ page }, use) => {
    const poll = await createPollWithVotes(page, 5);
    await use(poll);
  },
  
  // Poll clôturé avec analytics (setup complet)
  closedPollWithAnalytics: async ({ page }, use) => {
    const poll = await createPollWithVotes(page, 5);
    await closePoll(page, poll.slug);
    await use(poll);
  },
});

// Dans les tests
test('quick query', async ({ closedPollWithAnalytics }) => {
  // Le poll est déjà créé, voté, et clôturé
  await page.goto(`/poll/${closedPollWithAnalytics.slug}/results`);
  // Test commence directement
});
```

**Gain estimé**: 60-80% sur le temps de setup

---

### 6. **Screenshots Excessifs** 📸 (Impact: **FAIBLE**)

#### Problème
```typescript
await page.screenshot({ path: 'test-results/debug-page-vote.png', fullPage: true });
```

- Screenshots en plein milieu des tests (debugging)
- `fullPage: true` = lent (scroll + capture)

#### Impact
- ❌ 200-500ms par screenshot
- ❌ 5-10 screenshots par test = 2-5 secondes

#### Solution
```typescript
// ✅ Seulement en cas d'échec (déjà configuré globalement)
// playwright.config.ts
screenshot: 'only-on-failure'

// ❌ Supprimer les screenshots de debug
// await page.screenshot({ path: '...' });
```

**Gain estimé**: 2-5 secondes par test

---

### 7. **Attentes Redondantes** 🔁 (Impact: **MOYEN**)

#### Problème
```typescript
await page.waitForTimeout(1000);
const element = page.locator('button');
await expect(element).toBeVisible({ timeout: 5000 });
```

L'attente de 1000ms est inutile car `expect().toBeVisible()` attend déjà.

#### Impact
- ❌ 1-2 secondes perdues par occurrence
- ❌ Présent dans 30+ endroits

#### Solution
```typescript
// ✅ Supprimer le waitForTimeout
const element = page.locator('button');
await expect(element).toBeVisible({ timeout: 5000 });
```

**Gain estimé**: 2-4 secondes par test

---

### 8. **Installation Playwright** 🧭 (Impact: **FAIBLE-MOYEN**)

#### Problème
```yaml
# .github/workflows/post-merge.yml ligne 51
- name: 🧭 Install Playwright (Chromium)
  run: npx playwright install --with-deps chromium
```

L'installation se fait à chaque run (même avec cache).

#### Impact
- ❌ 20-40 secondes par job
- ❌ Dépendances système (`--with-deps`)

#### Solution
```yaml
# Améliorer le cache
- name: 🔧 Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}
    
- name: 🧭 Install Playwright
  run: |
    if [ ! -d ~/.cache/ms-playwright/chromium-* ]; then
      npx playwright install --with-deps chromium
    else
      npx playwright install chromium
    fi
```

**Gain estimé**: 10-20 secondes par job

---

## 📊 Résumé des Gains Potentiels

| Optimisation | Difficulté | Gain par test | Impact global |
|--------------|------------|---------------|---------------|
| 1. Supprimer waitForTimeout | **Facile** | 10-20s | ⭐⭐⭐ **Élevé** |
| 2. Workers CI (1→3) | **Très facile** | 50-60% | ⭐⭐⭐ **Élevé** |
| 3. Fixtures réutilisables | **Moyen** | 60-80% setup | ⭐⭐⭐ **Élevé** |
| 4. NetworkIdle → load | **Facile** | 5-10s | ⭐⭐ **Moyen** |
| 5. Supprimer mode serial | **Moyen** | 30-40% | ⭐⭐ **Moyen** |
| 6. Supprimer screenshots | **Très facile** | 2-5s | ⭐ **Faible** |
| 7. Attentes redondantes | **Facile** | 2-4s | ⭐ **Moyen** |

### Gain Total Estimé
- **Avant**: 2-3 minutes par shard
- **Après optimisations**: **30-60 secondes par shard**
- **Réduction**: **50-75%** ✅

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Quick Wins (30 min - Gain: 40-50%)
1. ✅ Augmenter workers CI: `1 → 3`
2. ✅ Remplacer `networkidle` par `load` ou `domcontentloaded`
3. ✅ Supprimer screenshots de debug
4. ✅ Améliorer cache Playwright

### Phase 2: Optimisations moyennes (2-3h - Gain: 30%)
5. ✅ Remplacer waitForTimeout par expect().toBeVisible()
6. ✅ Supprimer attentes redondantes
7. ✅ Analyser et optimiser mode serial

### Phase 3: Refactoring avancé (1 jour - Gain: 20%)
8. ✅ Créer fixtures réutilisables (pollWithVotes, etc.)
9. ✅ Extraire helper functions pour setups répétés
10. ✅ Paralléliser tests indépendants

---

## 📝 Exemple de Refactoring

### Avant (lent - ~45 secondes)
```typescript
test('quick query', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  
  // Créer poll (10s)
  const chatInput = page.locator('[data-testid="message-input"]');
  await chatInput.fill("Crée un questionnaire");
  await chatInput.press("Enter");
  await page.waitForTimeout(3000);
  
  // Finaliser (5s)
  const finalizeButton = page.locator('button:has-text("Finaliser")');
  await finalizeButton.click();
  await page.waitForTimeout(2000);
  
  // Voter 5 fois (15s)
  for (let i = 1; i <= 5; i++) {
    await page.goto(`/poll/${slug}/vote`);
    await page.waitForTimeout(1000);
    await page.fill('input', `Vote ${i}`);
    await page.click('button:has-text("Soumettre")');
    await page.waitForTimeout(1000);
  }
  
  // Clôturer (5s)
  await page.goto(`/poll/${slug}/results`);
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Clôturer")');
  await page.waitForTimeout(2000);
  
  // Test réel (5s)
  const quickQuery = page.locator('[data-testid="quick-query-button"]').first();
  await quickQuery.click();
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-testid="analytics-response"]')).toBeVisible();
});
```

### Après (rapide - ~5 secondes)
```typescript
test('quick query', async ({ closedPollWithAnalytics }) => {
  // Poll déjà créé par la fixture (0s)
  await page.goto(`/poll/${closedPollWithAnalytics.slug}/results`, {
    waitUntil: 'domcontentloaded'
  });
  
  // Test réel commence immédiatement
  const quickQuery = page.locator('[data-testid="quick-query-button"]').first();
  await expect(quickQuery).toBeVisible();
  await quickQuery.click();
  
  // Pas de waitForTimeout - auto-wait
  await expect(page.locator('[data-testid="analytics-response"]')).toBeVisible();
});
```

**Temps**: 45s → 5s = **88% plus rapide** 🚀

---

## ✅ Critères de Qualité Maintenus

Les optimisations proposées **ne sacrifient pas** la qualité:

1. ✅ **Fiabilité**: `expect().toBeVisible()` est plus fiable que `waitForTimeout`
2. ✅ **Couverture**: Même nombre de tests, même assertions
3. ✅ **Debuggabilité**: Screenshots on failure conservés
4. ✅ **Stabilité**: Auto-wait réduit les flaky tests
5. ✅ **Lisibilité**: Fixtures rendent le code plus clair

---

## 🔧 Implémentation Pratique

Voir les fichiers suivants pour les changements concrets:
- `tests/e2e/fixtures.ts` (nouveau)
- `playwright.config.ts` (modifié)
- `.github/workflows/post-merge.yml` (modifié)
- `tests/e2e/analytics-ai.spec.ts` (optimisé)

**Temps d'implémentation estimé**: 4-6 heures  
**Gain de temps par run**: 50-75%  
**ROI**: Positif dès la 2ème exécution

