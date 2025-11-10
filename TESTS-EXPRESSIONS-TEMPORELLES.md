# Tests manuels - Expressions temporelles relatives

## 🎯 Objectif
Valider que Gemini comprend et calcule correctement les expressions temporelles relatives après le bugfix.

## 📋 Scénarios de test

### ✅ Test 1: "dans 2 semaines"
**Commande:**
```
réunion d'équipe dans 2 semaines
```

**Résultat attendu:**
- Dates proposées autour de [aujourd'hui + 14 jours]
- Exemple: si aujourd'hui = 10/01/2025 → dates autour du 24/01/2025
- ❌ PAS de dates en novembre/décembre 2025

**Validation:**
- [ ] Les dates sont cohérentes avec "dans 2 semaines"
- [ ] Pas de dates aléatoires ou incohérentes
- [ ] Les dates sont futures (>= aujourd'hui)

---

### ✅ Test 2: "dans 3 semaines"
**Commande:**
```
disponibilité dans 3 semaines
```

**Résultat attendu:**
- Dates proposées autour de [aujourd'hui + 21 jours]
- Exemple: si aujourd'hui = 10/01/2025 → dates autour du 31/01/2025

**Validation:**
- [ ] Les dates sont cohérentes avec "dans 3 semaines"
- [ ] Calcul correct (21 jours ajoutés)

---

### ✅ Test 3: "dans 4 semaines"
**Commande:**
```
réunion d'équipe dans 4 semaines
```

**Résultat attendu:**
- Dates proposées autour de [aujourd'hui + 28 jours]
- Exemple: si aujourd'hui = 10/01/2025 → dates autour du 07/02/2025

**Validation:**
- [ ] Les dates sont cohérentes avec "dans 4 semaines"
- [ ] Changement de mois géré correctement

---

### ✅ Test 4: "dans 5 jours"
**Commande:**
```
rendez-vous dans 5 jours
```

**Résultat attendu:**
- Dates proposées autour de [aujourd'hui + 5 jours]
- Exemple: si aujourd'hui = 10/01/2025 → dates autour du 15/01/2025

**Validation:**
- [ ] Les dates sont cohérentes avec "dans 5 jours"
- [ ] Calcul précis (5 jours exactement)

---

### ✅ Test 5: "dans 1 mois"
**Commande:**
```
réunion dans 1 mois
```

**Résultat attendu:**
- Dates proposées autour de [même jour, mois suivant]
- Exemple: si aujourd'hui = 10/01/2025 → dates autour du 10/02/2025

**Validation:**
- [ ] Les dates sont cohérentes avec "dans 1 mois"
- [ ] Calcul de mois correct

---

### ✅ Test 6: "dans 2 mois"
**Commande:**
```
disponibilité dans 2 mois
```

**Résultat attendu:**
- Dates proposées autour de [même jour, 2 mois plus tard]
- Exemple: si aujourd'hui = 10/01/2025 → dates autour du 10/03/2025

**Validation:**
- [ ] Les dates sont cohérentes avec "dans 2 mois"
- [ ] Calcul de mois correct

---

### ✅ Test 7: Combinaison "dans X semaines" + jour spécifique
**Commande:**
```
réunion lundi dans 2 semaines
```

**Résultat attendu:**
- Dates proposées: lundis autour de [aujourd'hui + 14 jours]
- Exemple: si aujourd'hui = 10/01/2025 (vendredi) → lundis autour du 27/01/2025

**Validation:**
- [ ] Toutes les dates tombent un lundi
- [ ] Les lundis sont autour de la période "dans 2 semaines"
- [ ] Pas de mardi/mercredi/etc.

---

### ✅ Test 8: "cette semaine" (baseline)
**Commande:**
```
réunion cette semaine
```

**Résultat attendu:**
- Dates proposées: du [aujourd'hui] à [aujourd'hui + 7 jours]
- Exemple: si aujourd'hui = 10/01/2025 → dates du 10/01 au 17/01/2025

**Validation:**
- [ ] Les dates sont dans la semaine actuelle
- [ ] Pas de dates passées

---

### ✅ Test 9: "semaine prochaine" (baseline)
**Commande:**
```
réunion semaine prochaine
```

**Résultat attendu:**
- Dates proposées: semaine suivante (après dimanche)
- Exemple: si aujourd'hui = 10/01/2025 (vendredi) → dates du 13/01 au 19/01/2025

**Validation:**
- [ ] Les dates sont dans la semaine prochaine
- [ ] Pas de dates de cette semaine

---

### ✅ Test 10: "demain" (baseline)
**Commande:**
```
rendez-vous demain
```

**Résultat attendu:**
- Dates proposées: [aujourd'hui + 1 jour]
- Exemple: si aujourd'hui = 10/01/2025 → 11/01/2025

**Validation:**
- [ ] La date est exactement demain
- [ ] Calcul précis (+1 jour)

---

## 📊 Résumé des tests

| Test | Expression | Calcul attendu | Statut |
|------|------------|----------------|--------|
| 1 | "dans 2 semaines" | +14 jours | ⏳ |
| 2 | "dans 3 semaines" | +21 jours | ⏳ |
| 3 | "dans 4 semaines" | +28 jours | ⏳ |
| 4 | "dans 5 jours" | +5 jours | ⏳ |
| 5 | "dans 1 mois" | +1 mois | ⏳ |
| 6 | "dans 2 mois" | +2 mois | ⏳ |
| 7 | "lundi dans 2 semaines" | +14 jours + lundi | ⏳ |
| 8 | "cette semaine" | 0 à +7 jours | ⏳ |
| 9 | "semaine prochaine" | +7 à +14 jours | ⏳ |
| 10 | "demain" | +1 jour | ⏳ |

**Légende:**
- ⏳ En attente de test
- ✅ Test passé
- ❌ Test échoué

---

## 🐛 Bugs à surveiller

### Bug original (AVANT correction)
- ❌ "dans 2 semaines" générait des dates en novembre/décembre 2025
- ❌ Dates aléatoires sans cohérence avec la demande
- ❌ Pas de calcul à partir d'aujourd'hui

### Comportement attendu (APRÈS correction)
- ✅ "dans 2 semaines" génère des dates autour de [aujourd'hui + 14 jours]
- ✅ Dates cohérentes et calculées dynamiquement
- ✅ Calcul toujours à partir d'aujourd'hui

---

## 📝 Notes de test

### Date du test: ___________

### Résultats:

**Test 1 - "dans 2 semaines":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

**Test 2 - "dans 3 semaines":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

**Test 3 - "dans 4 semaines":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

**Test 4 - "dans 5 jours":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

**Test 5 - "dans 1 mois":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

**Test 6 - "dans 2 mois":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

**Test 7 - "lundi dans 2 semaines":**
- Dates générées: ___________
- Cohérence: ✅ / ❌
- Commentaires: ___________

---

## ✅ Validation finale

- [ ] Tous les tests passent
- [ ] Aucune régression sur les expressions existantes ("cette semaine", "demain", etc.)
- [ ] Les dates sont toujours futures (>= aujourd'hui)
- [ ] Les calculs sont cohérents avec les expressions demandées

**Statut global:** ⏳ En attente de tests

---

**Testeur:** ___________  
**Date:** ___________  
**Version:** ___________
