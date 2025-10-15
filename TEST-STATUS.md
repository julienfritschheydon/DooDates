# État des Tests DooDates

**Dernière mise à jour** : 15/10/2025 16:20

## 📊 Status Actuel

**Tests qui passent** : 385/410 (93.9%) ⬆️ +26 tests
**Tests skippés** : 25 tests (10 calendar + 15 mocks/mutations)
**Fichiers en `.skip`** : 6 fichiers (migration Jest→Vitest en cours)

---

## ⏸️ Fichiers à Migrer (7 fichiers en `.skip`)

### Hooks (2 fichiers + 2 complétés)
- ✅ ~~`useConversations.test.ts`~~ - **14/14 tests (100%)** - TERMINÉ 🎉
- ✅ ~~`useConversationStorage.test.ts`~~ - **6/13 tests (46%, 7 skipped)** - Partiel ⚠️
- `useAutoSave.test.ts.skip` - Timeout + timer mocks
- `useFreemiumQuota.test.ts.skip` - ⚠️ API changée (refactor complet)

### Composants (3 fichiers)
- `ConversationHistory.test.tsx.skip` - Migration Jest→Vitest
- `GeminiChatInterface.integration.test.tsx.skip` - Migration Jest→Vitest
- `QuotaIndicator.test.tsx.skip` - ⚠️ API changée (refactor complet)

### Intégration (1 fichier)
- `unified-flow.test.ts.skip` - Fix import paths

### Tests Individuels Skippés (17 tests)
- 10 calendar-integration (volontaire)
- 1 usePollConversationLink (window.location)
- 2 ConversationActions (mocks complexes)
- 4 ConversationCard (rename timing issue)

---

## 🔧 Guide Technique Migration Jest→Vitest

### Checklist Rapide

```typescript
// ❌ Ancien (Jest)
jest.mock('../module');
const mockFn = jest.fn();
jest.spyOn(obj, 'method');

// ✅ Nouveau (Vitest)
vi.mock('../module');
const mockFn = vi.fn();
vi.spyOn(obj, 'method');
```

### Problèmes Connus

**useAutoSave.test.ts**
- Timeout 5000ms → utiliser `vi.useFakeTimers()`

**useConversationStorage.test.ts**
- Erreur module → remplacer `require()` dynamique par `vi.mock()`

**unified-flow.test.ts**
- Fix path: `../../src/lib/` → `../lib/`

---

## 📝 Notes

**Plan détaillé** : Voir `Docs/2. Planning.md` section "Cette semaine"

**Priorité cette semaine** : Phase 3 (3 hooks critiques)

**À reporter** : useFreemiumQuota + QuotaIndicator (refactor API complet)
