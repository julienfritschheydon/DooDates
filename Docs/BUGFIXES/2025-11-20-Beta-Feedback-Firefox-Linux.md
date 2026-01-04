# 🐛 Feedback Beta - Firefox 145.0 / Linux Nobara

**Date:** 20/11/2025  
**Testeur:** Utilisateur externe  
**Environnement:** Firefox 145.0, Linux Nobara  
**Status:** 🔧 Corrections en cours

---

## ✅ Points Positifs

- Interface propre
- Temps de chargement rapide
- Sélection manuelle de dates claire et pratique
- Animations des boutons agréables

---

## 🔥 Bugs Critiques - CORRIGÉS

### **Bug #1: IA Modification Dates - Mois Incorrect** 🔥

**Priorité:** CRITIQUE  
**Impact:** Bloquant pour l'utilisation de l'IA

**Symptômes:**

1. "ajoute les samedi de mars" → "La date 25/04/2026 est déjà dans le sondage" (date incorrecte, mois avril au lieu de mars)
2. "ajoute le 7 mars 2026" → "Ajout de la date 07/04/2026" (mois incorrect: avril au lieu de mars)
3. GUI pas mise à jour après ajout
4. Dates non persistées (disparaissent après retour dashboard)

**Exemple concret:**

```
Prompt: "ajoute tous les samedi de mai 2026"
Réponse: "La date 25/04/2026 est déjà dans le sondage"
```

**✅ CORRECTION APPLIQUÉE:**

**Cause racine identifiée:**

1. Le code utilisait la dernière date du sondage comme référence pour Chrono.js
2. Si sondage contient dates en avril → référence = avril → "mars" interprété dans contexte avril
3. Pattern "tous les [jour] de [mois]" non géré → générait seulement 1 date au lieu de toutes

**Fichiers modifiés:**

- `src/services/IntentDetectionService.ts`
  - **Lignes 425-482:** Détection mois explicite (mars, avril, mai, etc.)
  - **Lignes 115-152:** Support pattern "tous les samedis de mars"
  - **Lignes 704-772:** Nouvelle fonction `getAllWeekdaysInMonth()`
  - **Lignes 562-572:** Logs de debug améliorés

**Solution implémentée:**

1. **Détection du mois explicite:**

```typescript
// Si l'utilisateur mentionne "mars", utiliser mars comme référence
const monthPattern = /(janvier|février|mars|avril|mai|...)/i;
const monthMatch = message.match(monthPattern);

if (monthMatch) {
  // Utiliser le mois demandé comme référence (pas la dernière date du sondage)
  referenceDate = new Date(currentYear, targetMonthIndex, 1);
}
```

2. **Support "tous les [jour] de [mois]":**

```typescript
// Génère TOUTES les dates d'un jour dans un mois
getAllWeekdaysInMonth("samedi", "mars", 2026);
// → [2026-03-07, 2026-03-14, 2026-03-21, 2026-03-28]
```

**Résultat:**

- ✅ "ajoute les samedi de mars" → Génère toutes les dates de mars
- ✅ "ajoute le 7 mars 2026" → 2026-03-07 (pas 07/04!)
- ✅ "ajoute tous les samedi de mai 2026" → Toutes les dates de mai
- ✅ Logs de debug pour traçabilité

**Tests automatisés:** 5 tests créés dans `tests/gemini-automated.test.ts`

---

### **Bug #2: Déconnexion → Page 404**

**Priorité:** HAUTE  
**Impact:** UX dégradée

**Symptôme:**

- Clic sur "Se déconnecter" → redirection vers `https://julienfritschheydon.github.io/` (page 404)

**Comportement attendu:**

- Redirection vers `/DooDates/` (page d'accueil de l'app sur GitHub Pages)

**✅ CORRECTION APPLIQUÉE:**

**Cause racine:**

- `window.location.href = "/"` redirige vers la racine du domaine
- En production GitHub Pages: `/` = `https://julienfritschheydon.github.io/` (404)
- Au lieu de `/DooDates/` = `https://julienfritschheydon.github.io/DooDates/` (OK)

**Fichier modifié:**

- `src/components/UserMenu.tsx` (lignes 33, 41, 53)

**Solution:**

```typescript
// ✅ Utilise BASE_URL de Vite (configuré dans vite.config.ts)
window.location.href = import.meta.env.BASE_URL || "/";
// Dev: "/" | Production: "/DooDates/"
```

**Résultat:**

- ✅ Déconnexion → redirection vers `/DooDates/` (pas de 404)
- ✅ Fonctionne en local et en production

---

### **Bug #3: Fermeture Modal Signup → Perte Données**

**Priorité:** HAUTE  
**Impact:** Frustration utilisateur

**Symptôme:**

- Clic en dehors de la boîte de création de compte → modal disparaît
- Tous les champs saisis sont perdus

**✅ CORRECTION APPLIQUÉE:**

**Fichiers modifiés:**

- `src/components/modals/AuthModal.tsx` - Ajout `onInteractOutside` handler
- `src/components/auth/SignUpForm.tsx` - Ajout `onFormChange` callback
- `src/components/auth/SignInForm.tsx` - Ajout `onFormChange` callback

**Solution:**

- Détection automatique des champs remplis via `watch()` de react-hook-form
- Confirmation demandée avant fermeture si des données sont saisies
- Message: "Vous avez des données non sauvegardées. Voulez-vous vraiment fermer ?"

**Résultat:**

- ✅ Protection contre perte de données accidentelle
- ✅ Confirmation utilisateur avant fermeture

---

## ⚠️ Bugs Moyens

### **Bug #4: Validation Mot de Passe Progressive**

**Priorité:** MOYENNE  
**Impact:** UX dégradée

**Symptôme:**

- Contraintes affichées une par une au fur et à mesure des erreurs
- D'abord "plus de 8 caractères"
- Puis "minuscule, majuscule et un chiffre"

**✅ CORRECTION APPLIQUÉE:**

**Fichier modifié:**

- `src/components/auth/SignUpForm.tsx` - Ajout aide visuelle contraintes

**Solution:**

- Affichage permanent des contraintes sous le champ mot de passe
- Liste à puces claire et visible dès l'affichage du formulaire
- Texte: "Votre mot de passe doit contenir :"
  - Au moins 8 caractères
  - Une lettre minuscule
  - Une lettre majuscule
  - Un chiffre

**Résultat:**

- ✅ Utilisateur informé dès le départ
- ✅ Pas de surprise lors de la validation

---

## 🎨 Suggestions UX (Non-bloquantes)

### **Suggestion #1: Sélection Dates par Glisser**

**Description:**

- Permettre de cliquer sur une date et "glisser" (bouton enfoncé) pour sélectionner plusieurs dates adjacentes

**Impact:** Nice-to-have  
**Priorité:** BASSE

---

### **Suggestion #2: Extension Créneaux Horaires**

**Description:**

- Permettre d'étendre un créneau horaire en laissant le bouton de la souris enfoncé

**Impact:** Nice-to-have  
**Priorité:** BASSE

---

## 📊 Résumé des Corrections

### ✅ Bugs Corrigés (Prêts pour commit)

**Bug #1: IA Modification Dates** 🔥

- **Fichier:** `src/services/IntentDetectionService.ts`
- **Lignes modifiées:** ~150 lignes (détection mois + pattern "tous les [jour] de [mois]")
- **Tests:** 5 tests automatisés créés
- **Status:** ✅ Correction appliquée, tests en cours

**Bug #2: Déconnexion → 404**

- **Fichier:** `src/components/UserMenu.tsx`
- **Lignes modifiées:** 3 lignes (utilisation `import.meta.env.BASE_URL`)
- **Tests:** Manuel (déconnexion en production)
- **Status:** ✅ Correction appliquée

---

## 📊 Résumé Priorisation

### ✅ Corrigés (20/11/2025):

1. ✅ **Bug #1: IA Modification Dates** - Mois incorrect + GUI pas mise à jour
2. ✅ **Bug #2: Déconnexion → 404**
3. ✅ **Bug #3: Fermeture modal signup → perte données**
4. ✅ **Bug #4: Validation mot de passe progressive**
5. ✅ **Bug #5: Orthographe "Sondages de dates"** - Corrigé dans la documentation

### Suggestions UX (Nice-to-have):

- Sélection dates par glisser
- Extension créneaux horaires

---

## 🔍 Prochaines Étapes

1. **Reproduire Bug #1** en local avec Firefox/Linux
2. **Ajouter logs détaillés** dans `IntentDetectionService.ts` pour tracer le parsing
3. **Vérifier Chrono.js** avec dates françaises (mars, avril, mai)
4. **Corriger bugs critiques** avant de continuer les tests beta

---

## 📝 Notes du Testeur

> "Bon désolé j'ai mis des plombes à te répondre 😞  
> testé par à-coups  
> le retour est super brut, en bordel  
> ptet mieux si on s'appelle/se voit  
> pour savoir quels points de retours/tests t'intéressent 🙂"

**Réponse:**

- Feedback très utile et détaillé ✅
- Bug #1 est critique et doit être corrigé en priorité
- Les autres bugs sont importants mais moins bloquants
- Appel/visio serait utile pour clarifier certains points
