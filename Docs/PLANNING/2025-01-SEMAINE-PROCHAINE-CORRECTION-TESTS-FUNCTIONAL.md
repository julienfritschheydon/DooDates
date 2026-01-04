# 🗓️ PLANNING JANVIER 2025 - SEMAINE PROCHAINE

## 🚨 PRIORITÉ CRITIQUE : Correction Tests Functional E2E

### **Problème identifié :**

- Tests functional échouent en CI (ultra-simple-dispo.spec.ts, ultra-simple-form.spec.ts)
- Tests smoke passent ✅
- Tests functional désactivés temporairement 🚫

### **🎯 Objectif semaine prochaine :**

1. **Corriger les tests functional** pour qu'ils passent en CI
2. **Réactiver les tests functional** dans le workflow
3. **Assurer 100% des tests E2E** passent en CI

---

## 📋 DÉTAILS TECHNIQUES À RÉGLER

### **1. ultra-simple-dispo.spec.ts**

**Problème :** Pattern regex URL dashboard incorrect
**État :** ✅ **CORRIGÉ** (local) - `/dashboard$/` au lieu de `/dashboard//`
**Action :** Tester en CI et valider

### **2. ultra-simple-form.spec.ts**

**Problème :** Dashboard polling `[data-testid="poll-item"]` timeout
**État :** ❌ **À CORRIGER**
**Hypothèses :**

- Polls non sauvegardés dans `pollStorage.ts`
- Dashboard ne charge pas les polls créés
- `data-testid="poll-item"` inexistant

### **3. Tests functional vs Smoke**

**Analyse :** Tests functional = tests smoke + étapes supplémentaires
**Solution :** Appliquer même logique que tests smoke qui réussissent

---

## 🔧 ACTIONS PLANIFIÉES

### **Lundi 6 Janvier :**

- [ ] Analyser logs CI ultra-simple-dispo.spec.ts
- [ ] Vérifier si correction URL fonctionne en CI
- [ ] Debug ultra-simple-form.spec.ts dashboard polling

### **Mardi 7 Janvier :**

- [ ] Investiger `pollStorage.ts` sauvegarde polls
- [ ] Vérifier composants dashboard availability/form
- [ ] Corriger data-testid manquants

### **Mercredi 8 Janvier :**

- [ ] Tester corrections locales
- [ ] Valider tous les tests functional passent
- [ ] Préparer commit corrections

### **Jeudi 9 Janvier :**

- [ ] Push corrections en CI
- [ ] Surveiller exécution tests functional
- [ ] Réactiver tests functional dans workflow

### **Vendredi 10 Janvier :**

- [ ] Validation finale 100% tests E2E
- [ ] Documentation des corrections
- [ ] Mise à jour guides tests

---

## 🎯 CRITÈRES DE SUCCÈS

### **✅ Objectif atteint quand :**

- [ ] `ultra-simple-dispo.spec.ts` passe en CI ✅
- [ ] `ultra-simple-form.spec.ts` passe en CI ✅
- [ ] `ultra-simple-quiz.spec.ts` continue de passer ✅
- [ ] `ultra-simple-quizz.spec.ts` continue de passer ✅
- [ ] Tests functional réactivés dans workflow ✅
- [ ] 100% tests E2E passent en CI ✅

### **📊 Métriques cibles :**

- **Temps CI :** < 20 min (avec functional)
- **Taux succès E2E :** 100%
- **Couverture :** Maintenir 507+ tests

---

## 🔗 LIENS UTILES

### **Fichiers concernés :**

- `tests/e2e/ultra-simple-dispo.spec.ts`
- `tests/e2e/ultra-simple-form.spec.ts`
- `.github/workflows/13-preprod-to-main.yml`
- `src/lib/pollStorage.ts`
- `src/app/*/Dashboard.tsx`

### **Commandes de test :**

```bash
# Local testing
npm run test:e2e:smoke
npm run test:e2e:functional

# Specific tests
npx playwright test tests/e2e/ultra-simple-dispo.spec.ts --project=chromium
npx playwright test tests/e2e/ultra-simple-form.spec.ts --project=chromium
```

---

## 📝 NOTES IMPORTANTES

### **Priorité :** 🔴 **CRITIQUE** - Bloque validation pre-prod → main

### **Impact :** Empêche merge automatique vers main

### **Urgence :** Élevée - Tests functional essentiels pour QA

### **Rappel :**

- Tests smoke = validation rapide (critique)
- Tests functional = validation workflow complet (essentiel)
- Les deux doivent passer pour CI verte

---

**Dernière mise à jour :** 4 Janvier 2026
**Statut :** 🚫 Tests functional désactivés - Planification semaine prochaine
