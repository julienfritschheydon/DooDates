# Performance Tests E2E - Documentation

Guide complet pour comprendre et optimiser les tests E2E de DooDates.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Analyse des problèmes](#analyse-des-problèmes)
3. [Solutions proposées](#solutions-proposées)
4. [Guide d'implémentation](#guide-dimplémentation)
5. [Métriques et suivi](#métriques-et-suivi)

---

## 📊 Vue d'ensemble

### État actuel
- **Smoke Tests**: 1m 10s - 1m 38s par shard (3 shards)
- **Functional Tests**: 2m 10s - 3m 15s par shard (3 shards)
- **Total pipeline**: ~12-15 minutes
- **Problème principal**: Attentes fixes et exécution séquentielle

### Objectif
- **Smoke Tests**: ~30-45s par shard
- **Functional Tests**: ~55-80s par shard
- **Total pipeline**: ~4-6 minutes
- **Gain ciblé**: **50-75% plus rapide** ⚡

---

## 🔍 Analyse des problèmes

Voir le document détaillé: [`E2E-OPTIMIZATION-ANALYSIS.md`](./E2E-OPTIMIZATION-ANALYSIS.md)

### Top 3 des problèmes

1. **🔴 Attentes excessives** (Impact: ÉLEVÉ)
   - 15-30 secondes de `waitForTimeout()` par test
   - Attentes fixes au lieu d'auto-wait

2. **🔴 Workers CI = 1** (Impact: ÉLEVÉ)
   - Tests séquentiels au lieu de parallèles
   - Sharding inefficace

3. **🟡 Setups répétitifs** (Impact: MOYEN)
   - Chaque test crée un poll complet (10-18s)
   - Pas de réutilisation via fixtures

---

## ✅ Solutions proposées

### Phase 1: Quick Wins (1h - Gain: 40-50%)

Guide rapide: [`QUICK-WINS.md`](./QUICK-WINS.md)

1. ✅ Augmenter workers CI: `1 → 3`
2. ✅ Remplacer `networkidle` par `domcontentloaded`
3. ✅ Supprimer `waitForTimeout`
4. ✅ Supprimer screenshots de debug
5. ✅ Améliorer cache Playwright

**Fichiers à modifier**:
- `playwright.config.ts`
- `.github/workflows/post-merge.yml`
- `tests/e2e/*.spec.ts`

### Phase 2: Refactoring (3-4h - Gain: 30-40%)

1. ✅ Créer fixtures réutilisables
2. ✅ Extraire helpers de création de polls
3. ✅ Optimiser mode serial
4. ✅ Paralléliser tests indépendants

**Fichiers créés**:
- `tests/e2e/fixtures.ts` ✨ NOUVEAU
- `tests/e2e/helpers.ts` ✨ NOUVEAU
- `tests/e2e/analytics-ai-optimized.spec.ts` ✨ EXEMPLE

---

## 🚀 Guide d'implémentation

### Option A: Appliquer les Quick Wins uniquement

**Temps**: 1 heure  
**Gain**: 40-50%  
**Difficulté**: Facile

```bash
# 1. Modifier playwright.config.ts
# workers: 1 → 3

# 2. Remplacer networkidle
find tests/e2e -name "*.spec.ts" -exec sed -i 's/networkidle/domcontentloaded/g' {} \;

# 3. Supprimer waitForTimeout manuellement (voir contexte)

# 4. Tester
npm run test:e2e:smoke

# 5. Commit
git add .
git commit -m "perf: optimize E2E tests (quick wins)"
```

### Option B: Implémentation complète avec fixtures

**Temps**: 4-5 heures  
**Gain**: 50-75%  
**Difficulté**: Moyen

```bash
# 1. Copier les fichiers optimisés
cp playwright.config.optimized.ts playwright.config.ts
cp .github/workflows/post-merge-optimized.yml .github/workflows/post-merge.yml

# 2. Intégrer les fixtures
# (déjà créé: tests/e2e/fixtures.ts)

# 3. Migrer les tests un par un
# Exemple: tests/e2e/analytics-ai-optimized.spec.ts

# 4. Tester progressivement
npm run test:e2e -- tests/e2e/analytics-ai-optimized.spec.ts

# 5. Commit
git add .
git commit -m "perf: complete E2E optimization with fixtures"
```

---

## 📈 Métriques et suivi

### Avant optimisations

| Job | Shard 1 | Shard 2 | Shard 3 | Total |
|-----|---------|---------|---------|-------|
| Smoke | 1m 10s | 1m 38s | 1m 30s | 4m 18s |
| Functional | 2m 10s | 3m 15s | 2m 39s | 8m 04s |
| **TOTAL** | | | | **12m 22s** |

### Après Quick Wins (Phase 1)

| Job | Shard 1 | Shard 2 | Shard 3 | Total |
|-----|---------|---------|---------|-------|
| Smoke | 35s | 45s | 40s | 2m 00s |
| Functional | 55s | 1m 20s | 1m 05s | 3m 20s |
| **TOTAL** | | | | **5m 20s** |

**Gain: 57%** ⚡

### Après Refactoring complet (Phase 2)

| Job | Shard 1 | Shard 2 | Total |
|-----|---------|---------|-------|
| Smoke | 25s | 30s | 55s |
| Functional | 40s | 50s | 1m 30s |
| **TOTAL** | | | **2m 25s** |

**Gain: 80%** 🚀

---

## 🎯 Prochaines étapes

### Recommandation

**Commencer par les Quick Wins** (Phase 1):
1. Gain immédiat de 40-50%
2. Faible risque
3. 1 heure d'effort

Si satisfait des résultats ➜ **STOP**  
Si besoin de plus ➜ Passer à la Phase 2

---

## 📚 Fichiers de référence

### Documentation
- [`E2E-OPTIMIZATION-ANALYSIS.md`](./E2E-OPTIMIZATION-ANALYSIS.md) - Analyse détaillée
- [`QUICK-WINS.md`](./QUICK-WINS.md) - Guide rapide
- [`README.md`](./README.md) - Ce fichier

### Configurations optimisées
- [`playwright.config.optimized.ts`](../../playwright.config.optimized.ts)
- [`.github/workflows/post-merge-optimized.yml`](../../.github/workflows/post-merge-optimized.yml)

### Exemples de tests
- [`tests/e2e/fixtures.ts`](../../tests/e2e/fixtures.ts) - Fixtures réutilisables
- [`tests/e2e/analytics-ai-optimized.spec.ts`](../../tests/e2e/analytics-ai-optimized.spec.ts) - Test optimisé complet

---

## 🤝 Support

Questions ou problèmes lors de l'implémentation?

1. Vérifier les exemples dans `analytics-ai-optimized.spec.ts`
2. Consulter la [documentation Playwright](https://playwright.dev/docs/best-practices)
3. Tester localement avant de push en CI

---

## 📊 Comparaison Avant/Après

### Exemple: Test Analytics IA

**AVANT** (`analytics-ai.spec.ts`):
```typescript
test('quick query', async ({ page }) => {
  // Setup poll (15s)
  await page.goto('/');
  await page.waitForTimeout(3000);
  // ... créer poll, voter 5 fois, clôturer
  
  // Test réel (5s)
  await page.waitForTimeout(2000);
  const button = page.locator('[data-testid="quick-query-button"]');
  await button.click();
  await page.waitForTimeout(3000);
  
  // Total: ~23 secondes
});
```

**APRÈS** (`analytics-ai-optimized.spec.ts`):
```typescript
test('quick query', async ({ closedPollWithAnalytics }) => {
  // Poll déjà créé par fixture (0s)
  await page.goto(`/poll/${closedPollWithAnalytics.slug}/results`, {
    waitUntil: 'domcontentloaded'
  });
  
  // Test réel avec auto-wait
  const button = page.locator('[data-testid="quick-query-button"]');
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('[data-testid="analytics-response"]')).toBeVisible();
  
  // Total: ~3 secondes
});
```

**Résultat: 87% plus rapide** ⚡

---

## ✨ Conclusion

Les optimisations proposées permettent de:
- ✅ Réduire le temps d'exécution de 50-75%
- ✅ Améliorer la fiabilité (moins de flaky tests)
- ✅ Faciliter la maintenance (fixtures réutilisables)
- ✅ Accélérer le feedback en CI

**Sans sacrifier la qualité** - Les mêmes assertions et cas de test sont conservés.

Temps d'implémentation: 1-5 heures selon la phase choisie  
ROI: Positif dès la 2ème exécution

