# Configuration des Tests de Quota

## Problème Identifié

Les tests qui utilisent des services de quota peuvent échouer silencieusement si `window.__IS_E2E_TESTING__` n'est pas explicitement défini à `undefined` dans le `beforeEach`.

### Symptômes

- Les tests de limites de quota passent alors qu'ils devraient échouer
- Les tests retournent `allowed: true` ou `success: true` sans vérifier les limites
- Le bypass E2E se déclenche de manière inattendue

### Cause

Les services suivants vérifient `isE2ETestingEnvironment()` ou `window.__IS_E2E_TESTING__` :

- `guestQuotaService.ts` → `shouldBypassGuestQuota()`
- `useQuota.ts` → vérifie `window.__IS_E2E_TESTING__`
- `useFreemiumQuota.ts` → `isE2EMode()`
- `useAiMessageQuota.ts` → utilise `useQuota` en interne
- `AuthContext.tsx` → vérifie `__IS_E2E_TESTING__`
- `GeminiChatInterface.tsx` → vérifie `isE2ETestingEnvironment()`
- `useConversations.ts` → vérifie `__IS_E2E_TESTING__`
- `useDashboardData.ts` → vérifie `__IS_E2E_TESTING__`

Si `window.__IS_E2E_TESTING__` n'est pas explicitement défini à `undefined`, il peut être hérité d'un autre test ou d'une configuration globale, ce qui active le bypass E2E.

## Solution

### Helper Disponible

Utiliser le helper `setupQuotaTestWindow()` dans `src/__tests__/helpers/testHelpers.ts` :

```typescript
import { setupQuotaTestWindow, setupMockLocalStorage } from "../../__tests__/helpers/testHelpers";

describe("MonTest", () => {
  beforeEach(() => {
    setupMockLocalStorage();
    setupQuotaTestWindow(); // ⚠️ IMPORTANT pour les tests de quota
    // ... autres configurations
  });
});
```

### Tests Concernés

Tous les tests qui utilisent directement ou indirectement :

- ✅ `guestQuotaService.test.ts` - **DÉJÀ CORRIGÉ**
- ⚠️ `useAiMessageQuota.test.ts` - **À VÉRIFIER**
- ⚠️ `useFreemiumQuota.test.ts.skip` - **À VÉRIFIER** (actuellement skip)
- ⚠️ Tests qui utilisent `useQuota` - **À VÉRIFIER**
- ⚠️ Tests qui utilisent `AuthContext` - **À VÉRIFIER**

### Exemple d'Utilisation

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupQuotaTestWindow, setupMockLocalStorage } from "../../__tests__/helpers/testHelpers";
import * as e2eDetection from "../e2e-detection";

describe("guestQuotaService", () => {
  beforeEach(() => {
    setupMockLocalStorage();
    setupQuotaTestWindow(); // Configure window.__IS_E2E_TESTING__ = undefined
    
    vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(false);
    // ... autres mocks
  });

  it("should respect quota limits", async () => {
    // Le test vérifie maintenant correctement les limites
  });

  it("should bypass in E2E environment", async () => {
    // Pour les tests E2E spécifiques, définir explicitement :
    Object.defineProperty(global, "window", {
      value: {
        ...global.window,
        __IS_E2E_TESTING__: true, // Activer explicitement pour ce test
      },
      writable: true,
      configurable: true,
    });
    
    vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(true);
    // ... test E2E
  });
});
```

## Checklist pour Nouveaux Tests

Lors de la création de nouveaux tests qui utilisent des services de quota :

- [ ] Importer `setupQuotaTestWindow` depuis `testHelpers`
- [ ] Appeler `setupQuotaTestWindow()` dans `beforeEach()`
- [ ] Mock `isE2ETestingEnvironment()` pour retourner `false` par défaut
- [ ] Pour les tests E2E spécifiques, définir explicitement `__IS_E2E_TESTING__: true`
- [ ] Vérifier que les tests de limites fonctionnent correctement

## Vérification

Pour vérifier si un test a ce problème :

1. Exécuter le test isolément
2. Vérifier si les tests de limites passent alors qu'ils devraient échouer
3. Ajouter un log dans `shouldBypassGuestQuota()` pour voir si le bypass se déclenche
4. Si oui, ajouter `setupQuotaTestWindow()` dans le `beforeEach()`

## Historique

- **2025-11-12** : Problème identifié dans `guestQuotaService.test.ts`
- **2025-11-12** : Helper `setupQuotaTestWindow()` créé
- **2025-11-12** : `guestQuotaService.test.ts` corrigé (14/17 tests passent maintenant)
- **2025-11-12** : `useAiMessageQuota.test.ts` corrigé (mock `CONVERSATION_QUOTAS` et `STORAGE_QUOTAS` ajoutés)
- **2025-11-12** : 3 tests restants dans `guestQuotaService.test.ts` nécessitent une investigation approfondie des mocks Supabase :
  - "should create new quota if not found" : `insert` n'est pas appelé (0 appels)
  - "should consume credits successfully" : `aiMessages` est 0 au lieu de 2
  - "should handle missing quota gracefully" : résultat n'est pas `null`

## Problèmes Restants

Les 3 tests qui échouent encore dans `guestQuotaService.test.ts` sont dus à des problèmes de mocks Supabase complexes, pas au bypass E2E. Ces problèmes nécessitent une investigation approfondie de l'ordre des appels Supabase et de la façon dont les mocks sont consommés.

### Tests Concernés

1. **"should create new quota if not found"** : Le mock de `insert` n'est pas appelé (0 appels au lieu d'au moins 1)
2. **"should consume credits successfully"** : Le mock de `single` ne retourne pas les bonnes valeurs (`aiMessages: 0` au lieu de `2`)
3. **"should handle missing quota gracefully"** : Le mock d'erreur ne fonctionne pas (résultat n'est pas `null`)

Ces problèmes étaient masqués par le bypass E2E avant la correction. Maintenant que le bypass est corrigé, ils sont visibles et nécessitent une correction des mocks Supabase.

