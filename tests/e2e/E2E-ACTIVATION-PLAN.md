# 📋 Plan d'Activation Progressive des Tests E2E

## 🎯 Objectif
Activer les tests E2E un par un pour **éviter les coûts API Gemini** et s'assurer que chaque test passe individuellement.

---

## 💰 Stratégie Tests Gemini (MISE À JOUR)

### **Tests Gemini** (`gemini-tests.yml`)
✅ **Configuration intelligente activée** :
- 🔄 **Automatique sur changements** : Tests UNIQUEMENT si modification de fichiers Gemini
- ⏰ **Schedule mensuel** : 1er de chaque mois à 9h UTC (sécurité)
- 👋 **Manuel** : Toujours possible via Actions

**Fichiers surveillés** :
- `src/lib/gemini.ts`
- `src/lib/enhanced-gemini.ts`
- `src/lib/temporal-parser.ts`
- `tests/gemini-*.test.ts`

**Coût estimé** : ~1-2 tests/mois maximum 💰

---

## 💰 Stratégie d'Économie API E2E

### Tests E2E qui UTILISENT l'API Gemini (À ÉVITER) :
- ❌ **Tout test utilisant `/ai-chat`** → Appels directs à Gemini
- ❌ **Tests créant des sondages avec IA** → Parsing Gemini
- ⚠️ **Tests de navigation incluant AI chat** → Charger la page coûte cher

### Tests SANS API Gemini (PRIORITAIRES) :
- ✅ **Navigation basique** → Pas d'API
- ✅ **Authentication/Guest** → LocalStorage uniquement
- ✅ **Vote/Résultats** → Pas d'API
- ✅ **CRUD sondages manuels** → Pas d'API
- ✅ **Performance/Isolation** → Tests techniques

---

## 📊 Inventaire des 9 Fichiers E2E

| Fichier | API Gemini? | Tests Skip | Priorité |
|---------|-------------|------------|----------|
| `ultra-simple.spec.ts` | ⚠️ Possible | 2 | 🟢 Haute |
| `guest-workflow.spec.ts` | ❌ Non | 4+ | 🟢 Haute |
| `authenticated-workflow.spec.ts` | ❌ Non | ? | 🟢 Haute |
| `mobile-voting.spec.ts` | ❌ Non | ? | 🟢 Haute |
| `edge-cases.spec.ts` | ⚠️ Possible | ? | 🟡 Moyenne |
| `poll-actions.spec.ts` | ❌ Non | 1+ | 🟡 Moyenne |
| `navigation-regression.spec.ts` | ⚠️ `/ai-chat` | 10 | 🔴 Basse (API) |
| `security-isolation.spec.ts` | ❌ Non | 8 | 🟡 Moyenne |
| `performance.spec.ts` | ❌ Non | 8 | 🟡 Moyenne |

---

## 🔧 Plan d'Action ✅ MISE À JOUR

### Phase 1 : Correction des Bugs ✅ TERMINÉ
1. ✅ Workflows automatiques sécurisés (Gemini sur changements + mensuel)
2. ✅ Corriger `test.skiptest()` → `test.skip()` - 41 bugs corrigés
3. ✅ E2E nocturnes désactivés (activation progressive)

### **📊 ÉTAT ACTUEL** ⚠️ CORRECTION
- ✅ **10 tests ACTIFS** (50 avec 5 navigateurs)
  - `edge-cases.spec.ts` : 10 tests ✅ (⚠️ 6 échouent)
- ⏸️ **42 tests DÉSACTIVÉS** à activer progressivement
  - `authenticated-workflow.spec.ts` : 8 tests (tous `.skip()`)
  - `guest-workflow.spec.ts` : 7 tests (tous `.skip()`)
  - Autres : 27 tests (tous `.skip()`)
- **0€ coûts API actuels**

Voir détails complets : `E2E-STATUS.md`

---

### Phase 2 : Activer Tests Workflow (15 tests) - SEMAINE 1
**Priorité 1 : Activer tests auth et guest**

**Étape 1 : Débugger edge-cases** (6 tests échouent)
```bash
npx playwright show-report
# Analyser les 6 erreurs et corriger
```

**Étape 2 : Activer authenticated-workflow (8 tests)**
```bash
# Retirer test.skip() manuellement ou avec script
npx playwright test authenticated-workflow.spec.ts --project=chromium
```

**Étape 3 : Activer guest-workflow (7 tests)**
```bash
# Retirer test.skip() manuellement ou avec script
npx playwright test guest-workflow.spec.ts --project=chromium
```

**Total Phase 2** : 25 tests actifs (edge-cases + auth + guest)

---

### Phase 3 : Sondages et Vote (5 tests) - SEMAINE 2
**Priorité : Tests critiques sans API**

```bash
# Test 1 : Vote mobile (2 tests)
npx playwright test mobile-voting.spec.ts --project=chromium

# Test 2 : Actions sondages (1 test)  
npx playwright test poll-actions.spec.ts --project=chromium

# Test 3 : Navigation basique (2 tests) - ⚠️ Vérifier logs
npx playwright test ultra-simple.spec.ts --project=chromium
```

**Validation** : Aucun appel API détecté → Activer sur tous navigateurs

---

### Phase 4 : Sécurité (8 tests) - SEMAINE 3
**Tests de robustesse**

```bash
npx playwright test security-isolation.spec.ts --project=chromium
```

Tests XSS, injection, isolation sessions

---

### Phase 5 : Performance (7 tests) - SEMAINE 4
**Tests de charge**

```bash
npx playwright test performance.spec.ts --project=chromium
```

Tests conversations multiples, mémoire, concurrence

---

### Phase 6 : Navigation (9 tests) - SEMAINE 5 🔴 ATTENTION
**⚠️ CONTIENT TEST COÛTEUX `/ai-chat`**

**Avant d'activer** :
1. **Implémenter mock Gemini** (voir section ci-dessous)
2. **OU skip le test AI chat** :
   ```typescript
   test.skip('TopNav AI chat page', async ({ page }) => {
     // Skip - coût API Gemini
   });
   ```

```bash
# Seulement après mock
npx playwright test navigation-regression.spec.ts --project=chromium
```

---

## 💡 Protection Anti-Gemini (OBLIGATOIRE Phase 5)

### **Option A : Mock Global dans playwright.config.ts** ⭐ RECOMMANDÉ
```typescript
// playwright.config.ts
export default defineConfig({
  // ... existing config
  use: {
    baseURL: 'http://localhost:8080',
    
    // 🛡️ Mock toutes les requêtes Gemini
    async beforeEach({ page }) {
      await page.route('**/generativelanguage.googleapis.com/**', route => {
        console.log('🚫 Gemini API blocked (mock)');
        route.fulfill({ 
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            candidates: [{
              content: {
                parts: [{ text: 'Mock response - E2E test' }]
              }
            }]
          })
        });
      });
    }
  }
});
```

### **Option B : Mock par Test**
```typescript
test('AI features', async ({ page }) => {
  // Mock Gemini pour ce test uniquement
  await page.route('**/generativelanguage.googleapis.com/**', route => {
    route.fulfill({ 
      status: 200,
      body: JSON.stringify({ mock: true })
    });
  });
  
  // Test normal
  await page.goto('/ai-chat');
});
```

### **Option C : Skip Tests Coûteux**
```typescript
// navigation-regression.spec.ts
test.skip('TopNav AI chat page', async ({ page }) => {
  // ⚠️ Skip to avoid Gemini API costs
  // Enable only after implementing global mock
});
```

### **Option D : Variable d'Environnement**
```bash
# .env.test
E2E_MOCK_GEMINI=true
```

```typescript
// playwright.config.ts
const shouldMockGemini = process.env.E2E_MOCK_GEMINI === 'true';
```

---

## 🚀 Commandes Utiles

### Lister tous les tests
```bash
npx playwright test --list
```

### Tester 1 fichier sur 1 navigateur
```bash
npx playwright test guest-workflow.spec.ts --project=chromium
```

### Tester en mode headed (voir l'exécution)
```bash
npx playwright test guest-workflow.spec.ts --headed
```

### Tester manuellement Gemini (coûteux !)
```bash
npm run test:gemini:production
```

### Lancer workflow E2E manuel (GitHub)
Actions → 🌙 Nightly E2E Matrix → Run workflow

---

## ⚠️ Règles Importantes

1. **JAMAIS** lancer les tests automatiquement sur push
2. **TOUJOURS** tester manuellement d'abord
3. **ÉVITER** les tests qui chargent `/ai-chat`
4. **VÉRIFIER** les coûts API après chaque test Gemini
5. **ACTIVER** un seul test à la fois

---

## 📈 Progression

- [x] Phase 1 : Bugs corrigés ✅
- [x] Tests actuels : 10 tests actifs (edge-cases) - ⚠️ 6 échouent
- [ ] Phase 2 : Activer 15 tests auth/guest + débugger edge-cases
- [ ] Phase 3 : 5 tests sondages/vote
- [ ] Phase 4 : 8 tests sécurité  
- [ ] Phase 5 : 7 tests performance
- [ ] Phase 6 : 9 tests navigation (avec mock Gemini)
- [ ] Nightly E2E : Réactivation après Phase 6

**Dernière mise à jour** : 16 octobre 2025 - Plan complet finalisé  
**Documents** : `E2E-ACTIVATION-PLAN.md` (stratégie) + `E2E-STATUS.md` (détails)
