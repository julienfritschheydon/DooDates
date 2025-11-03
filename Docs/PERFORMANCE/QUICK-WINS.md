# Quick Wins - Optimisations E2E

Guide rapide pour appliquer les optimisations les plus impactantes.

---

## 🚀 Étape 1: Augmenter les Workers CI (5 min)

### Fichier: `playwright.config.ts`

```diff
- workers: process.env.CI ? 1 : undefined,
+ workers: process.env.CI ? 3 : undefined,
```

**Gain**: 50-60% plus rapide  
**Risque**: Aucun  
**Effort**: 1 ligne de code

---

## ⚡ Étape 2: Remplacer networkidle par domcontentloaded (15 min)

### Avant (lent)
```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

### Après (rapide)
```typescript
await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
```

**Trouver et remplacer dans tous les tests**:
```bash
# Trouver les occurrences
grep -r "networkidle" tests/e2e/

# Remplacer automatiquement
find tests/e2e -name "*.spec.ts" -type f -exec sed -i 's/networkidle/domcontentloaded/g' {} \;
```

**Gain**: 5-10s par test  
**Risque**: Faible (attendre élément spécifique après si besoin)  
**Effort**: 15 minutes

---

## 🗑️ Étape 3: Supprimer waitForTimeout (20 min)

### Pattern à rechercher
```typescript
await page.waitForTimeout(1000);
await page.waitForTimeout(2000);
await page.waitForTimeout(3000);
await page.waitForTimeout(5000);
```

### Remplacer par
```typescript
// Si attente d'un élément
await expect(page.locator('[data-testid="element"]')).toBeVisible({ timeout: 5000 });

// Si attente d'une condition
await page.waitForFunction(() => /* condition */);

// Si vraiment nécessaire (rare)
await page.waitForLoadState('load');
```

### Script de migration
```bash
# Trouver toutes les occurrences
grep -n "waitForTimeout" tests/e2e/*.spec.ts

# Les remplacer manuellement (nécessite contexte)
# Voir le fichier avant/après dans analytics-ai-optimized.spec.ts
```

**Gain**: 10-20s par test  
**Risque**: Moyen (vérifier que tests passent)  
**Effort**: 20-30 minutes

---

## 📸 Étape 4: Supprimer screenshots de debug (5 min)

### Pattern à rechercher
```typescript
await page.screenshot({ path: 'test-results/debug-*.png', fullPage: true });
await page.screenshot({ path: 'Docs/screenshots/*.png' });
```

### Action
Commenter ou supprimer ces lignes (garder seulement ceux vraiment nécessaires).

**Gain**: 2-5s par test  
**Risque**: Aucun (screenshots on failure sont conservés)  
**Effort**: 5 minutes

---

## 🔧 Étape 5: Améliorer cache Playwright CI (10 min)

### Fichier: `.github/workflows/post-merge.yml`

```diff
- name: 🧭 Install Playwright (Chromium)
-   run: npx playwright install --with-deps chromium
+ name: 🧭 Install Playwright browsers
+   run: |
+     if [ ! -d ~/.cache/ms-playwright/chromium-* ]; then
+       echo "Installing Playwright with deps..."
+       npx playwright install --with-deps chromium
+     else
+       echo "Playwright already cached, skipping deps..."
+       npx playwright install chromium
+     fi
```

**Gain**: 10-20s par job  
**Risque**: Aucun  
**Effort**: 10 minutes

---

## 📊 Résultats Attendus

### Avant optimisations
```
E2E Smoke Tests (1): 1m 10s
E2E Smoke Tests (2): 1m 38s
E2E Smoke Tests (3): 1m 30s
E2E Functional Tests (1): 2m 10s
E2E Functional Tests (2): 3m 15s
E2E Functional Tests (3): 2m 39s

Total: ~12 minutes
```

### Après Quick Wins (Étapes 1-5)
```
E2E Smoke Tests (1): 35s
E2E Smoke Tests (2): 45s
E2E Smoke Tests (3): 40s
E2E Functional Tests (1): 55s
E2E Functional Tests (2): 1m 20s
E2E Functional Tests (3): 1m 05s

Total: ~5 minutes
```

**Gain total: 58% plus rapide** 🎉

---

## ✅ Checklist d'application

- [ ] Étape 1: Workers CI (1→3)
- [ ] Étape 2: networkidle→domcontentloaded
- [ ] Étape 3: Supprimer waitForTimeout
- [ ] Étape 4: Supprimer screenshots debug
- [ ] Étape 5: Cache Playwright amélioré
- [ ] Tester localement: `npm run test:e2e:smoke`
- [ ] Commit et push
- [ ] Vérifier temps CI sur GitHub Actions

---

## 🚨 Points d'attention

1. **Tests flaky**: Si des tests deviennent instables après suppression des `waitForTimeout`, ajouter des attentes spécifiques:
   ```typescript
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

2. **Timing critique**: Certains tests peuvent nécessiter des attentes réelles (animations, etc.). Identifier et conserver ces cas.

3. **CI vs Local**: Tester en local ET en CI pour valider les optimisations.

---

## 📚 Ressources

- [Documentation Playwright - Auto-waiting](https://playwright.dev/docs/actionability)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- Exemple complet: `tests/e2e/analytics-ai-optimized.spec.ts`
- Configuration optimisée: `playwright.config.optimized.ts`

