# Suivi de Test : Tests d'intégration useAutoSave

## Objectif
Réactiver les 10 tests skippés dans les suites d'intégration `useAutoSave` :
- `src/hooks/__tests__/useAutoSave.test.ts` → 6 tests `skip` ✅ **RÉACTIVÉS** (13/13 tests passent)
- `src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts` → 3 tests `skip` ⏳ **EN COURS**
- `src/hooks/__tests__/useAutoSave.titleGeneration.test.ts` → 1 test `skip` ⏳ **EN COURS**

## Problèmes Identifiés

### ✅ Problème 1 : Mock `quotaTracking` incomplet (RÉSOLU)
**Symptôme** : `createConversation` n'est jamais appelé dans l'environnement de test  
**Cause** : Le mock de `quotaTracking` ne mockait pas `incrementConversationCreated`, utilisé par le hook  
**Solution** : Ajout de `incrementConversationCreated`, `incrementPollCreated`, et `incrementAiMessages` au mock avec `importOriginal` pour préserver les autres exports

### ✅ Problème 2 : Mock `getConversation` ne retourne pas la conversation créée (RÉSOLU)
**Symptôme** : `getConversation` retourne `undefined` après création de conversation  
**Cause** : Le mock retournait toujours la même conversation, peu importe l'ID  
**Solution** : Utilisation de `mockImplementation` pour retourner la conversation créée selon l'ID (temp-xxx ou conv-xxx)

## Historique

### 13/11/2025 - Correction des tests `useAutoSave.test.ts`
- ✅ Ajout de `incrementConversationCreated` au mock `quotaTracking`
- ✅ Correction du mock `getConversation` pour retourner la conversation créée
- ✅ Réactivation de 6 tests skippés :
  - `should create conversation on first message` ✅
  - `should convert AI messages correctly` ✅
  - `should handle poll suggestions in metadata` ✅
  - `should return real ID after message is added to temp conversation` ✅
  - `should handle message save errors` ✅
  - `should handle very long message content` ✅
- **Résultat** : 13/13 tests passent (100%)

### Prochaines étapes
- ⏳ Réactiver les 3 tests dans `titleGeneration.useAutoSave.test.ts`
- ⏳ Réactiver le test dans `useAutoSave.titleGeneration.test.ts` (problème de timing/debounce)

## Tests Restants

### `titleGeneration.useAutoSave.test.ts` (3 tests)
1. `should integrate with conversation storage updates` - `createConversation` non appelé
2. `should handle edge cases gracefully` - `createConversation` non appelé
3. `should handle title generation errors gracefully` - `createConversation` non appelé

**Problème** : Même problème que `useAutoSave.test.ts` - mock `quotaTracking` et `getConversation` à corriger

### `useAutoSave.titleGeneration.test.ts` (1 test)
1. `devrait générer un titre après création de sondage` - `generateTitle` n'est pas appelé

**Problème** : Problème de timing/debounce - le debounce de 1.5s n'est pas déclenché correctement dans les tests avec fake timers

