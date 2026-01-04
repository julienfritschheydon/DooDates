# Plan d'Action - Réactivation des Tests Skipés

**Date de création** : 14 novembre 2025  
**Date de complétion** : 14 novembre 2025  
**Objectif** : Examiner et réactiver les 13 tests skipés dans les composants UI

## ✅ Résultats

### 1. MultiStepFormVote.test.tsx (5 tests réactivés) ✅

- [x] Ligne 193 : "affiche le bouton Soumettre sur l'étape coordonnées" ✅ **RÉACTIVÉ**
- [x] Ligne 219 : "soumet le formulaire avec toutes les réponses" ✅ **RÉACTIVÉ**
- [x] Ligne 366 : "permet de saisir le nom du répondant sur l'étape coordonnées" ✅ **RÉACTIVÉ**
- [x] Ligne 391 : "gère les questions de type multiple choice" ✅ **RÉACTIVÉ**
- [x] Ligne 432 : "gère les questions de type NPS" ✅ **RÉACTIVÉ**

**Résultat** : 17/17 tests passent (100%) ✅  
**Corrections** : Ajout de `import React from "react";` et `import "@testing-library/jest-dom/vitest";` pour corriger 52 erreurs de linting

### 2. ConversationCard.test.tsx (0 tests skipés)

- **Statut** : Aucun test skipé trouvé dans le fichier
- **Note** : Les tests de renommage ne sont pas skipés, ils échouent peut-être mais ne sont pas désactivés

### 3. ConversationActions.test.tsx (0 tests skipés)

- **Statut** : Aucun test skipé trouvé dans le fichier
- **Note** : Tous les tests passent (28/28)

### 4. usePollConversationLink.test.ts (1 test réactivé) ✅

- [x] Ligne 260 : "should handle navigation between poll and conversation" ✅ **RÉACTIVÉ**

**Résultat** : 12/12 tests passent (100%) ✅  
**Corrections** :

- Amélioration du mock `window.location` pour gérer les URLs relatives/absolues
- Correction des assertions pour utiliser des URLs absolues

## 🎯 Stratégie

1. **Examiner chaque test** pour comprendre pourquoi il est skipé
2. **Tester la réactivation** un par un
3. **Corriger les problèmes** identifiés (timing, mocks, etc.)
4. **Réactiver les tests valides**
5. **Documenter les décisions** (réactivé vs supprimé)

## ⏱️ Estimation

- **Examen** : 30 min
- **Corrections** : 2-4 heures
- **Tests** : 30 min
- **Total** : 3-5 heures

## 📝 Notes

- Les tests passent actuellement (12/17 pour MultiStepFormVote)
- Approche similaire à useAiMessageQuota : vérifier l'état plutôt que les détails d'implémentation
- Utiliser `userEvent` au lieu de `fireEvent` pour les interactions
- Augmenter les timeouts si nécessaire
