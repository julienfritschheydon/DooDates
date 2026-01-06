# E2E Test Infrastructure: Exhaustive Analysis Report

## GOALS
- Test should be fast
- Test should be reliable
- Test should be maintainable
- Test should be readable
- Test should be simple

## METHODS TO RESPECT
- Test always as soon as possible
- One test at a time
- Once it's working, commit but don't push until you are done with all the tests

## ✅ Definition of Done

### Success Metrics
- [ ] **0 tests skipped** (baseline all tests to passing state)
- [ ] **0 flaky tests** (≥ 95% pass rate on CI across all browsers)
- [ ] **E2E execution time < 5min** (optimize slow test blocks)
- [ ] **Unit test coverage > 80%** for all helper files
- [x] **All RGPD tests consolidated** into `tests/e2e/rgpd-consolidated.spec.ts`
- [ ] **Rate limiting validated** via integration tests (not mocked E2E)


## 🛠️ Phase 1: Infrastructure Refactoring (Priority 2)

> [!NOTE]
> **Phase 1 is executed AFTER Phase 2** to ensure all refactoring is validated against a passing test suite. This reduces the risk of introducing regressions during structural changes.

### Improvement Suggestions & Expected Gains

### 3. Clean Up [poll-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts)
- **Suggested Action**:
  - Move [sendChatCommand](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#43-94) to [chat-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/chat-helpers.ts).
  - Move voting helpers to a dedicated `vote-helpers.ts`.

### 4. Standardize Helper Signatures
- **Suggested Action**: Standardize all helpers to accept a `context: { page: Page; browserName: string }` object.

### 5. Address TODOs in [supabase-test-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/supabase-test-helpers.ts)
- [deleteTestUser](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/supabase-test-helpers.ts#94-111): Needs a service role key.
- [createTestBetaKey](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/supabase-test-helpers.ts#175-201): Currently a placeholder.

### 6. Audit for "Ghost" References
- Audit `poll-validation-helpers.ts`.

---
## ✅ Verification Status
- **Performance**:
  - RGPD Consolidated: **26.4s** (from 2.5m).
  - Dashboard Edge Cases (50+ polls): **19.6s** (Stable).
- **Analysis**: All core helper files and browser-specific logic analyzed.
- **Access Control**: Verified [results-access-control.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/results-access-control.spec.ts).
- **Hygiene**: Confirmed no broken references to missing files.
- **Infrastructure**: Storage seeding and Dashboard verification consolidated.

----

### 🏗️ **API Dashboard Architecture (Nouveau)**

**Priorité : Haute - Ajouté le 2 janvier 2026**

#### **Objectif**
Créer une API layer pour les dashboards produits.

#### **Approche Hybride**
```typescript
Dashboard React → API Optionnelle → localStorage Fallback
```

#### **Tâches (10h total)**
| Bloc        | Durée | Tâche                                                         |
| ----------- | ----- | ------------------------------------------------------------- |
| 2h Critique | 2h    | **API Dashboard Core**                                        |
| 2h Critique | 2h    | **Intégration Dashboard React**                               |
| 1h Fond     | 1h    | **Tests API Dashboard**                                       |
| 1h Fond     | 1h    | **Documentation API**                                         |
| 1h Fond     | 1h    | **Tests Edge Cases Post-API**                                 |
| 3h Fond     | 3h    | **Déploiement & Monitoring**                                  |

#### **Bénéfices attendus**
- ✅ Tests plus simples
- ✅ Foundation pour mobile apps
- ✅ Performance monitoring

---

### 🧪 **Tests Edge Cases Dashboards Produits (Nouveau)**

**Priorité : Haute - Ajouté le 2 janvier 2026**

#### **Objectif**
Créer des tests edge cases pour les 4 dashboards produits.

#### **Tests à créer**
```
tests/e2e/products/
├── date-polls/
│   ├── date-polls-edge-cases.spec.ts ✅ CRÉÉ
...
```

#### **État actuel Tests PÉRIMÈTRE C**
```
✅ tags-folders.spec.ts - 6/6 passent
✅ product-isolation.spec.ts - 3/3 passents
✅ hyper-task.feature.spec.ts - 2/2 passents
✅ formpolls.feature.spec.ts - Corrigé
❌ dashboard-edge-cases.spec.ts - Supprimé
🔄 Tests dashboards produits - En cours
```

---
> [!NOTE]
> The infrastructure is now well-documented and the path for refactoring is clear.
