# Tests E2E - Guide de configuration

Ce document explique comment configurer et exécuter les tests E2E avec la nouvelle configuration centralisée.

## Configuration E2E

### Fichiers principaux

- `tests/e2e/global-setup.ts` : Configuration globale des mocks et du mode E2E
- `tests/e2e/e2e-utils.ts` : Utilitaires pour les tests E2E
- `scripts/update-e2e-tests.ts` : Script pour mettre à jour automatiquement les fichiers de test

### Fonctionnalités

1. **Détection automatique du mode E2E** :
   - Vérifie `window.__IS_E2E_TESTING__`
   - Vérifie le paramètre d'URL `e2e-test=true`
   - Vérifie l'user agent Playwright

2. **Désactivation des quotas** :
   - Désactive les vérifications de quota en mode E2E
   - Empêche l'affichage des modales d'authentification

3. **Optimisations** :
   - Désactive les animations pour des tests plus rapides
   - Gestion automatique des timeouts
   - Meilleure gestion des erreurs

## Comment utiliser

### 1. Importer la configuration E2E

```typescript
import { setupAllMocks } from './global-setup';

test.beforeEach(async ({ page }) => {
  // Configurer les mocks et activer le mode E2E
  await setupAllMocks(page);
  
  // Votre code de test ici
});
```

### 2. Utiliser le paramètre e2e-test

Ajoutez `e2e-test=true` à vos URLs de test :

```typescript
await page.goto('/?e2e-test=true');
// ou
await page.goto(`/poll/${slug}?e2e-test=true`);
```

### 3. Désactiver les quotas

Les quotas sont automatiquement désactivés en mode E2E. Si nécessaire, vous pouvez forcer la désactivation :

```typescript
// Dans votre test
await page.evaluate(() => {
  localStorage.setItem('e2e', '1');
  localStorage.setItem('dev-local-mode', '1');
});
```

## Exécution des tests

### Tous les tests

```bash
npx playwright test
```

### Un seul fichier

```bash
npx playwright test tests/e2e/analytics-ai.spec.ts
```

### Mode debug

```bash
npx playwright test --debug
```

## Dépannage

### Problèmes courants

1. **Erreur de localStorage** :
   - Assurez-vous d'appeler `setupAllMocks` avant d'accéder au localStorage
   - Utilisez `page.waitForLoadState('domcontentloaded')` si nécessaire

2. **Quotas toujours actifs** :
   - Vérifiez que `e2e-test=true` est présent dans l'URL
   - Vérifiez que `window.__IS_E2E_TESTING__` est défini

3. **Animations bloquantes** :
   - Les animations sont désactivées par défaut en mode E2E
   - Si nécessaire, utilisez `page.waitForTimeout()` pour les cas spécifiques

## Bonnes pratiques

1. **Toujours utiliser setupAllMocks** :
   - Assure une configuration cohérente entre les tests
   - Gère automatiquement le mode E2E

2. **Éviter les timeouts fixes** :
   - Utilisez `waitForSelector` ou `waitForLoadState`
   - Évitez les `page.waitForTimeout()` sauf si absolument nécessaire

3. **Isoler les tests** :
   - Chaque test doit pouvoir s'exécuter indépendamment
   - Utilisez `test.describe.configure({ mode: 'serial' })` avec précaution

## Mise à jour des tests existants

Pour mettre à jour automatiquement tous les fichiers de test :

```bash
npx tsx scripts/update-e2e-tests.ts
```

Ce script va :
- Mettre à jour les imports
- Ajouter `setupAllMocks` aux `beforeEach`
- Ajouter `e2e-test=true` aux URLs

## Dépôt Git

Les fichiers modifiés peuvent être ajoutés avec :

```bash
git add tests/e2e/global-setup.ts tests/e2e/e2e-utils.ts scripts/update-e2e-tests.ts
```

Puis commit avec un message clair :

```bash
git commit -m "feat(tests): ajout de la configuration E2E centralisée"
```
