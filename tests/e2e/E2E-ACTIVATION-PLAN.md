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

## 🔧 Plan d'Action

### Phase 1 : Correction des Bugs (MAINTENANT)
1. ✅ Désactiver workflows automatiques Gemini et E2E
2. ❌ Corriger `test.skiptest()` → `test.skip()` dans tous les fichiers
3. ❌ Créer variable d'env `E2E_SKIP_GEMINI` pour bloquer appels API

### Phase 2 : Tests Sans API (SEMAINE 1)
**Activer dans cet ordre :**
1. `guest-workflow.spec.ts` - Workflow invité sans API
2. `authenticated-workflow.spec.ts` - Auth Supabase
3. `mobile-voting.spec.ts` - Vote mobile
4. `poll-actions.spec.ts` - CRUD sondages

**Commande test individuel :**
```bash
npx playwright test guest-workflow.spec.ts --project=chromium
```

### Phase 3 : Tests Techniques (SEMAINE 2)
5. `security-isolation.spec.ts` - Isolation données
6. `performance.spec.ts` - Performance app
7. `edge-cases.spec.ts` - Cas limites

### Phase 4 : Tests Navigation (SEMAINE 3)
⚠️ **ATTENTION : Ces tests peuvent coûter cher !**
8. `ultra-simple.spec.ts` - Navigation basique (vérifier routes `/create`)
9. `navigation-regression.spec.ts` - TopNav + `/ai-chat` ⚠️ COÛTEUX

**Stratégie pour `/ai-chat` :**
- Mock Gemini avec `page.route()` pour intercepter appels API
- Ou skip complètement les tests AI chat

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

- [ ] Phase 1 : Bugs corrigés
- [ ] Phase 2 : 4 tests sans API activés
- [ ] Phase 3 : 3 tests techniques activés
- [ ] Phase 4 : 2 tests navigation activés (avec mocks API)

**Dernière mise à jour** : 16 octobre 2025
