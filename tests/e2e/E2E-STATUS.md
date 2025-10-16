# 📊 État Actuel des Tests E2E

**Date** : 16 octobre 2025  
**Total tests** : 260 tests (52 tests × 5 navigateurs)

---

## 🎯 Résumé par Fichier

| Fichier | Tests Actifs | Tests Skip | API Gemini? | Priorité |
|---------|--------------|------------|-------------|----------|
| **authenticated-workflow.spec.ts** | ✅ 8 | ❌ 0 | ❌ Non | 🟢 P1 - ACTIF |
| **edge-cases.spec.ts** | ✅ 10 | ❌ 0 | ❌ Non | 🟢 P1 - ACTIF |
| **guest-workflow.spec.ts** | ✅ 7 | ❌ 0 | ❌ Non | 🟢 P1 - ACTIF |
| **ultra-simple.spec.ts** | ❌ 0 | ✅ 2 | ⚠️ `/create` | 🟡 P2 |
| **mobile-voting.spec.ts** | ❌ 0 | ✅ 2 | ❌ Non | 🟡 P2 |
| **poll-actions.spec.ts** | ❌ 0 | ✅ 1 | ❌ Non | 🟡 P2 |
| **navigation-regression.spec.ts** | ❌ 0 | ✅ 9 | 🔴 `/ai-chat` | 🔴 P4 - COÛTEUX |
| **security-isolation.spec.ts** | ❌ 0 | ✅ 8 | ❌ Non | 🟡 P3 |
| **performance.spec.ts** | ❌ 0 | ✅ 7 | ❌ Non | 🟡 P3 |

**Tests actifs** : 25 tests (125 avec navigateurs)  
**Tests désactivés** : 27 tests (135 avec navigateurs)

---

## ✅ Tests Actuellement Actifs (25 tests)

### **authenticated-workflow.spec.ts** - 8 tests ✅
- ✅ Sign up et accès features premium
- ✅ Création conversations multiples
- ✅ Migration données guest → auth
- ✅ Accès features premium
- ✅ Persistence session
- ✅ Sign out → retour guest
- ✅ Progression quota

**Status** : ACTIFS et fonctionnels

---

### **edge-cases.spec.ts** - 10 tests ✅
- ✅ Network failures gracefully
- ✅ Messages très longs
- ✅ LocalStorage quota exceeded
- ✅ Limite 10 conversations guest
- ✅ Actions rapides consécutives
- ✅ Caractères invalides
- ✅ Navigation back/forward
- ✅ Refresh pendant création
- ✅ Sessions concurrentes
- ✅ Données localStorage malformées

**Status** : ACTIFS et fonctionnels

---

### **guest-workflow.spec.ts** - 7 tests ✅
- ✅ Création première conversation
- ✅ Indicateur quota
- ✅ Modal incentive auth
- ✅ Persistence localStorage
- ✅ Badges premium
- ✅ Gestion limite conversations
- ✅ Maintien session après refresh

**Status** : ACTIFS et fonctionnels

---

## ⏸️ Tests Désactivés à Activer (27 tests)

### 🟡 **Priorité 2 : Sondages et Vote** (5 tests)

#### **ultra-simple.spec.ts** - 2 tests
- ⏸️ Navigation de base + 3 dates + 3 horaires
- ⏸️ Test ultra simple global

**Risque API** : ⚠️ Utilise `/create` (peut charger calendrier)  
**Action** : Activer 1 par 1, vérifier logs

---

#### **mobile-voting.spec.ts** - 2 tests
- ⏸️ DatePoll: sticky submit + back dashboard
- ⏸️ FormPoll: multi-option interactions

**Risque API** : ❌ Aucun  
**Action** : Activer en priorité

---

#### **poll-actions.spec.ts** - 1 test
- ⏸️ Copy, duplicate, edit, delete actions flow

**Risque API** : ❌ Aucun  
**Action** : Activer après mobile-voting

---

### 🟡 **Priorité 3 : Sécurité et Performance** (15 tests)

#### **security-isolation.spec.ts** - 8 tests
- ⏸️ Isolation guest users
- ⏸️ Prevention XSS attacks
- ⏸️ Sanitization input
- ⏸️ Protection localStorage manipulation
- ⏸️ Authentication token security
- ⏸️ Isolation authenticated users
- ⏸️ Prevention session fixation
- ⏸️ Data validation

**Risque API** : ❌ Aucun  
**Action** : Tests de sécurité importants mais non critiques

---

#### **performance.spec.ts** - 7 tests
- ⏸️ Large number conversations
- ⏸️ Large messages
- ⏸️ Rapid user interactions
- ⏸️ Efficient load conversations
- ⏸️ Memory efficiency long session
- ⏸️ Concurrent operations
- ⏸️ UI responsiveness

**Risque API** : ❌ Aucun  
**Action** : Tests de performance, activer en dernier

---

### 🔴 **Priorité 4 : Navigation (COÛTEUX)** (9 tests)

#### **navigation-regression.spec.ts** - 9 tests ⚠️
- ⏸️ TopNav home page
- ⏸️ TopNav dashboard page
- ⏸️ TopNav poll creation page
- ⏸️ 🔴 **TopNav AI chat page** → `/ai-chat` = APPEL GEMINI
- ⏸️ TopNav poll creation flow
- ⏸️ TopNav navigation all pages
- ⏸️ TopNav responsive mobile
- ⏸️ TopNav error pages
- ⏸️ TopNav async operations

**Risque API** : 🔴 **TRÈS ÉLEVÉ** (test 4 charge `/ai-chat`)  
**Action** : 
1. **SKIP le test 4** (`TopNav AI chat page`)
2. Activer les autres avec prudence
3. Ou mock complètement Gemini

---

## 📋 Plan d'Activation Progressif

### **Phase 1 : Validation Tests Actifs** ✅ FAIT
- ✅ 25 tests actifs fonctionnent
- ✅ Aucun appel API Gemini

### **Phase 2 : Sondages et Vote** (5 tests)
```bash
# Semaine 1
npx playwright test mobile-voting.spec.ts --project=chromium
npx playwright test poll-actions.spec.ts --project=chromium

# Semaine 2  
npx playwright test ultra-simple.spec.ts --project=chromium
```

### **Phase 3 : Sécurité** (8 tests)
```bash
# Semaine 3
npx playwright test security-isolation.spec.ts --project=chromium
```

### **Phase 4 : Performance** (7 tests)
```bash
# Semaine 4
npx playwright test performance.spec.ts --project=chromium
```

### **Phase 5 : Navigation (AVEC MOCK GEMINI)** (9 tests)
```bash
# Semaine 5 - ATTENTION
# 1. Ajouter mock Gemini dans playwright.config.ts
# 2. Ou skip test AI chat
npx playwright test navigation-regression.spec.ts --project=chromium
```

---

## 🛡️ Protection Anti-Gemini

### **Option A : Mock Global Playwright**
Ajouter dans `playwright.config.ts` :
```typescript
use: {
  baseURL: 'http://localhost:8080',
  // Mock toutes les requêtes Gemini
  async beforeEach({ page }) {
    await page.route('**/generativelanguage.googleapis.com/**', route => {
      route.fulfill({ 
        status: 200,
        body: JSON.stringify({ mock: true })
      });
    });
  }
}
```

### **Option B : Skip Tests Spécifiques**
Marquer les tests coûteux :
```typescript
test.skip('TopNav AI chat page', async ({ page }) => {
  // Skip pour éviter coûts API
});
```

### **Option C : Variable d'Environnement**
```typescript
const SKIP_GEMINI = process.env.E2E_SKIP_GEMINI === 'true';

test('AI features', async ({ page }) => {
  if (SKIP_GEMINI) {
    test.skip();
  }
  // ...
});
```

---

## 📊 Coûts Estimés

| Phase | Tests | Risque API | Coût Estimé |
|-------|-------|------------|-------------|
| Phase 1 ✅ | 25 actifs | ❌ Aucun | 0€ |
| Phase 2 | 5 sondages | ⚠️ Minimal | ~0€ |
| Phase 3 | 8 sécurité | ❌ Aucun | 0€ |
| Phase 4 | 7 performance | ❌ Aucun | 0€ |
| Phase 5 | 9 navigation | 🔴 1 test coûteux | ⚠️ Variable |

**Total sans mock** : Risque 1 appel API par exécution  
**Total avec mock** : 0€ garanti

---

## 🎯 Recommandation Finale

1. **Immédiat** : Garder 25 tests actifs (0€)
2. **Semaine 1-2** : Activer Phase 2 (sondages/vote)
3. **Semaine 3-4** : Activer Phase 3-4 (sécurité/perf)
4. **Avant Phase 5** : Implémenter mock Gemini
5. **Nightly E2E** : Rester désactivé jusqu'à mock complet

**Status** : Configuration optimale pour économiser API Gemini tout en gardant couverture test robuste.
