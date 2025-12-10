# Helper navigateToWorkspace - Guide d'utilisation

## Overview

Le helper `navigateToWorkspace` a été amélioré pour supporter tous les types de workspace dans DooDates et fournir une interface unifiée pour naviguer vers la zone de chat dans les tests E2E.

## Nouvelles fonctionnalités

### 1. Support de tous les types de workspace
- `date` - `/DooDates/date-polls/workspace/date`
- `form` - `/DooDates/form-polls/workspace/form`
- `quizz` - `/DooDates/quizz/workspace`
- `availability` - `/DooDates/availability-polls/workspace`
- `default` - `/DooDates/workspace` (par défaut)

### 2. Options flexibles
- `addE2EFlag` - Ajoute automatiquement `?e2e-test=true` à l'URL
- `waitUntil` - Contrôle le moment de considérer la navigation comme terminée

## Syntaxe

```typescript
import { navigateToWorkspace, type WorkspaceType } from './helpers/chat-helpers';

// Syntaxe complète
await navigateToWorkspace(page, browserName, workspaceType, options);

// Syntaxes courantes
await navigateToWorkspace(page, 'chromium', 'default');                    // Workspace principal
await navigateToWorkspace(page, 'chromium', 'date');                       // Date polls
await navigateToWorkspace(page, 'chromium', 'form');                       // Form polls
await navigateToWorkspace(page, 'chromium', 'default', { addE2EFlag: true }); // Avec flag E2E
```

## Exemples d'utilisation

### Avant (ancienne méthode)
```typescript
// ❌ Ancienne méthode - duplication de code
await page.goto('/DooDates/workspace', { waitUntil: 'domcontentloaded' });
await waitForPageLoad(page, browserName);
await waitForChatInput(page);

await page.goto('/DooDates/date-polls/workspace/date', { waitUntil: 'domcontentloaded' });
await waitForPageLoad(page, browserName);
await waitForChatInput(page);

await page.goto('/DooDates/form-polls/workspace/form', { waitUntil: 'domcontentloaded' });
await waitForPageLoad(page, browserName);
await waitForChatInput(page);
```

### Après (nouvelle méthode)
```typescript
// ✅ Nouvelle méthode - unifié et flexible
import { navigateToWorkspace } from './helpers/chat-helpers';

await navigateToWorkspace(page, browserName, 'default');                    // Workspace principal
await navigateToWorkspace(page, browserName, 'date');                       // Date polls
await navigateToWorkspace(page, browserName, 'form');                       // Form polls
await navigateToWorkspace(page, browserName, 'quizz');                      // Quizz
await navigateToWorkspace(page, browserName, 'availability');               // Availability polls
```

### Avec options E2E
```typescript
// ✅ Avec flag E2E automatique
await navigateToWorkspace(page, browserName, 'default', { 
  addE2EFlag: true,
  waitUntil: 'networkidle' 
});
```

## Migration des tests existants

### 1. Remplacements simples
```typescript
// ❌ Ancien code
await page.goto('/DooDates/workspace', { waitUntil: 'domcontentloaded' });
await waitForNetworkIdle(page, { browserName });

// ✅ Nouveau code
await navigateToWorkspace(page, browserName, 'default');
```

### 2. Workspace spécifiques
```typescript
// ❌ Ancien code
await page.goto('/DooDates/date-polls/workspace/date', { waitUntil: 'domcontentloaded' });
await waitForPageLoad(page, browserName);
await waitForChatInput(page);

// ✅ Nouveau code
await navigateToWorkspace(page, browserName, 'date');
```

### 3. Avec flag E2E
```typescript
// ❌ Ancien code
await page.goto('/DooDates/workspace?e2e-test=true', { waitUntil: 'domcontentloaded' });
await waitForNetworkIdle(page, { browserName });

// ✅ Nouveau code
await navigateToWorkspace(page, browserName, 'default', { addE2EFlag: true });
```

## Fonctions dépréciées (compatibilité)

Pour la compatibilité ascendante, des fonctions spécifiques sont disponibles :

```typescript
// ⚠️ Déprécié - utiliser navigateToWorkspace(page, browserName, 'date')
await navigateToDateWorkspace(page, browserName, options);

// ⚠️ Déprécié - utiliser navigateToWorkspace(page, browserName, 'form')
await navigateToFormWorkspace(page, browserName, options);
```

## Avantages

1. **Code unifié** - Une seule fonction pour tous les workspaces
2. **Moins de duplication** - Plus besoin de répéter `waitForPageLoad` + `waitForChatInput`
3. **Type safety** - TypeScript avec `WorkspaceType` pour éviter les erreurs
4. **Options flexibles** - Flag E2E et contrôle du waitUntil
5. **Maintenance facile** - Modification centralisée des URLs de workspace

## Fichiers mis à jour

- `/tests/e2e/helpers/chat-helpers.ts` - Fonction principale améliorée
- `/tests/e2e/mobile-voting.spec.ts` - Migration vers navigateToWorkspace
- `/tests/e2e/security-isolation.spec.ts` - Migration vers navigateToWorkspace
- `/tests/e2e/guest-quota.spec.ts` - Migration vers navigateToWorkspace
- `/tests/smart-navigation.spec.ts` - Migration partielle vers navigateToWorkspace

## Prochaines étapes

Continuer la migration des autres fichiers de tests qui utilisent `page.goto` pour naviguer vers les workspaces :

- `tests/e2e/strict-poll-type-enforcement.spec.ts`
- `tests/e2e/security-rate-limiting-rgpd.spec.ts`
- `tests/e2e/rate-limit-hyper-task-ui.spec.ts`
- Et tous les autres fichiers avec `page.goto('/DooDates/.../workspace/...')`
