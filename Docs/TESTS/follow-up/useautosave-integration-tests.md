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

### 13/11/2025 - Correction complète de tous les tests useAutoSave

#### Phase 1 : `useAutoSave.test.ts` (13/13 tests passent - 100%)
- ✅ Ajout de `incrementConversationCreated`, `incrementPollCreated`, `incrementAiMessages` au mock `quotaTracking`
- ✅ Correction du mock `getConversation` pour retourner la conversation créée selon l'ID
- ✅ Réactivation de 6 tests skippés :
  - `should create conversation on first message` ✅
  - `should convert AI messages correctly` ✅
  - `should handle poll suggestions in metadata` ✅
  - `should return real ID after message is added to temp conversation` ✅
  - `should handle message save errors` ✅
  - `should handle very long message content` ✅

#### Phase 2 : `titleGeneration.useAutoSave.test.ts` (9/9 tests passent - 100%)
- ✅ Correction du mock `getConversation` pour retourner `null` pour les IDs temporaires avant création
- ✅ Ajout de `mockReset()` pour nettoyer les mocks entre les tests
- ✅ Utilisation de `await` pour `addMessage` dans les tests
- ✅ Réactivation de 3 tests skippés :
  - `should integrate with conversation storage updates` ✅
  - `should handle edge cases gracefully` ✅
  - `should handle title generation errors gracefully` ✅

#### Phase 3 : `useAutoSave.titleGeneration.test.ts` (1/1 test passe - 100%)
- ✅ Utilisation de `vi.useRealTimers()` pour gérer le debounce de 1.5s
- ✅ Correction du mock `getMessages` pour retourner les messages ajoutés dynamiquement
- ✅ Correction du mock `getConversation` pour retourner la conversation créée
- ✅ Réactivation du test :
  - `devrait générer un titre après création de sondage` ✅

**Résultat final** : ✅ **Tous les tests passent** (23/23 tests - 100%)

