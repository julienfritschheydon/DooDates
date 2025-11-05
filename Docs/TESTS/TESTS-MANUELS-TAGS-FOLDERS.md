# 🧪 Tests Manuels - Tags et Dossiers

**Date de création** : 2025-01-XX  
**Fonctionnalité** : Gestion des tags et dossiers pour les conversations  
**Statut** : ✅ À tester

---

## 📋 Checklist de Tests Manuels

### ✅ Tests Fonctionnels de Base

#### 1. Ouvrir le dialogue de gestion
- [ ] Aller sur le dashboard (`/dashboard`)
- [ ] Identifier une carte de conversation
- [ ] Cliquer sur le menu (trois points `⋯`) en haut à droite de la carte
- [ ] Vérifier que le menu s'ouvre
- [ ] Cliquer sur "Gérer les tags/dossier"
- [ ] **Résultat attendu** : Le dialogue s'ouvre avec les sections "Tags" et "Dossier"

#### 2. Assigner des tags à une conversation
- [ ] Ouvrir le dialogue de gestion tags/dossiers
- [ ] Dans la section "Tags", cocher un ou plusieurs tags
- [ ] Vérifier que les tags cochés sont bien visibles
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu** : 
  - Toast de succès : "Mise à jour réussie"
  - Les tags apparaissent sur la carte de conversation
  - Les tags sont affichés avec leurs couleurs personnalisées

#### 3. Retirer des tags d'une conversation
- [ ] Ouvrir le dialogue pour une conversation qui a déjà des tags
- [ ] Décocher les tags existants
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu** :
  - Toast de succès
  - Les tags disparaissent de la carte

#### 4. Assigner un dossier à une conversation
- [ ] Ouvrir le dialogue de gestion tags/dossiers
- [ ] Dans la section "Dossier", cocher un dossier
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu** :
  - Toast de succès
  - Le dossier apparaît sur la carte avec son icône et son nom
  - Le dossier est affiché avant les tags

#### 5. Retirer un dossier d'une conversation
- [ ] Ouvrir le dialogue pour une conversation qui a déjà un dossier
- [ ] Cocher "Aucun dossier"
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu** :
  - Toast de succès
  - Le dossier disparaît de la carte

#### 6. Assigner plusieurs tags et un dossier simultanément
- [ ] Ouvrir le dialogue
- [ ] Cocher plusieurs tags (2-3)
- [ ] Cocher un dossier
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu** :
  - Toast de succès
  - Tous les tags et le dossier sont visibles sur la carte

---

### ✅ Tests d'Affichage

#### 7. Vérifier l'affichage des tags sur les cartes
- [ ] Créer ou identifier une conversation avec des tags
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - Les tags sont affichés sous forme de badges colorés
  - Chaque tag affiche son icône `Tag` et son nom
  - Les couleurs correspondent aux couleurs définies dans les tags

#### 8. Vérifier l'affichage du dossier sur les cartes
- [ ] Créer ou identifier une conversation avec un dossier
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - Le dossier est affiché avec son icône et son nom
  - Le dossier apparaît avant les tags
  - Le badge du dossier a un style distinct (fond gris)

#### 9. Vérifier l'affichage combiné tags + dossier
- [ ] Créer une conversation avec à la fois des tags et un dossier
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - Le dossier apparaît en premier
  - Les tags apparaissent après le dossier
  - Tous les éléments sont alignés horizontalement avec espacement

---

### ✅ Tests de Filtrage

#### 10. Filtrer par tag
- [ ] Créer plusieurs conversations avec différents tags
- [ ] Aller sur le dashboard
- [ ] Utiliser le filtre par tag dans les filtres du dashboard
- [ ] Sélectionner un tag spécifique
- [ ] **Résultat attendu** :
  - Seules les conversations avec ce tag sont affichées
  - Les autres conversations sont masquées

#### 11. Filtrer par dossier
- [ ] Créer plusieurs conversations, certaines dans des dossiers différents
- [ ] Aller sur le dashboard
- [ ] Utiliser le filtre par dossier dans les filtres du dashboard
- [ ] Sélectionner un dossier spécifique
- [ ] **Résultat attendu** :
  - Seules les conversations dans ce dossier sont affichées
  - Les autres conversations sont masquées

#### 12. Filtrer par tag ET dossier simultanément
- [ ] Créer des conversations avec différentes combinaisons de tags et dossiers
- [ ] Filtrer par un tag spécifique
- [ ] Filtrer également par un dossier spécifique
- [ ] **Résultat attendu** :
  - Seules les conversations qui ont à la fois le tag ET le dossier sont affichées

---

### ✅ Tests de Cas Limites

#### 13. Conversation sans tags ni dossier
- [ ] Créer une conversation sans tags ni dossier
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - La carte s'affiche normalement
  - Aucun badge tag ou dossier n'est affiché
  - Le menu "Gérer les tags/dossier" fonctionne toujours

#### 14. Conversation avec beaucoup de tags (5+)
- [ ] Assigner 5 tags ou plus à une conversation
- [ ] Vérifier l'affichage sur la carte
- [ ] **Résultat attendu** :
  - Les tags s'affichent correctement (wrap si nécessaire)
  - Pas de problème de layout ou de performance

#### 15. Tags avec noms longs
- [ ] Créer un tag avec un nom très long (30+ caractères)
- [ ] L'assigner à une conversation
- [ ] **Résultat attendu** :
  - Le tag s'affiche correctement (tronqué si nécessaire)
  - Pas de problème de layout

#### 16. Dossier sans icône
- [ ] Créer un dossier sans icône (chaîne vide)
- [ ] L'assigner à une conversation
- [ ] **Résultat attendu** :
  - Le dossier s'affiche avec juste le nom
  - Pas d'erreur dans la console

---

### ✅ Tests d'Erreurs et Validation

#### 17. Annuler les modifications
- [ ] Ouvrir le dialogue
- [ ] Modifier les tags et/ou dossier
- [ ] Cliquer sur "Annuler"
- [ ] **Résultat attendu** :
  - Le dialogue se ferme
  - Aucune modification n'est sauvegardée
  - La carte affiche toujours les valeurs précédentes

#### 18. Fermer le dialogue sans sauvegarder
- [ ] Ouvrir le dialogue
- [ ] Modifier les tags et/ou dossier
- [ ] Cliquer sur le X ou cliquer en dehors du dialogue
- [ ] **Résultat attendu** :
  - Le dialogue se ferme
  - Aucune modification n'est sauvegardée

#### 19. Conversation introuvable
- [ ] Créer une conversation avec un ID
- [ ] Supprimer manuellement la conversation du localStorage
- [ ] Essayer d'ouvrir le dialogue de gestion
- [ ] **Résultat attendu** :
  - Toast d'erreur : "Conversation introuvable"
  - Le dialogue ne s'ouvre pas ou se ferme immédiatement

---

### ✅ Tests de Performance

#### 20. Performance avec beaucoup de tags disponibles
- [ ] Créer 20+ tags dans le système
- [ ] Ouvrir le dialogue de gestion
- [ ] **Résultat attendu** :
  - Le dialogue s'ouvre rapidement (< 1 seconde)
  - Tous les tags sont affichés correctement
  - Pas de lag lors du scroll dans la liste des tags

#### 21. Performance avec beaucoup de dossiers disponibles
- [ ] Créer 20+ dossiers dans le système
- [ ] Ouvrir le dialogue de gestion
- [ ] **Résultat attendu** :
  - Le dialogue s'ouvre rapidement
  - Tous les dossiers sont affichés correctement
  - Pas de lag lors du scroll

---

### ✅ Tests Multi-Navigateurs

#### 22. Test sur Chrome
- [ ] Exécuter les tests 1-6 sur Chrome
- [ ] **Résultat attendu** : Tout fonctionne correctement

#### 23. Test sur Firefox
- [ ] Exécuter les tests 1-6 sur Firefox
- [ ] **Résultat attendu** : Tout fonctionne correctement

#### 24. Test sur Safari
- [ ] Exécuter les tests 1-6 sur Safari
- [ ] **Résultat attendu** : Tout fonctionne correctement

---

### ✅ Tests Responsive

#### 25. Test sur mobile (petit écran)
- [ ] Ouvrir le dashboard sur un appareil mobile ou avec un viewport mobile
- [ ] Tester l'ouverture du dialogue
- [ ] Tester l'assignation de tags et dossiers
- [ ] **Résultat attendu** :
  - Le dialogue est responsive
  - Les checkboxes sont facilement cliquables
  - Le texte est lisible

#### 26. Test sur tablette
- [ ] Ouvrir le dashboard sur une tablette ou avec un viewport tablette
- [ ] Tester toutes les fonctionnalités
- [ ] **Résultat attendu** : Tout fonctionne correctement

---

## 📝 Notes de Test

### Données de Test Recommandées

**Tags de test :**
- Tag 1 : "Prioritaire" (rouge #ef4444)
- Tag 2 : "Client" (bleu #3b82f6)
- Tag 3 : "Interne" (vert #10b981)
- Tag 4 : "Marketing" (orange #f59e0b)
- Tag 5 : "Produit" (violet #8b5cf6)

**Dossiers de test :**
- Dossier 1 : "Projets" (📁, bleu)
- Dossier 2 : "Clients" (📂, rouge)
- Dossier 3 : "Interne" (📋, vert)

### Scénarios de Test Recommandés

1. **Scénario Nouvel Utilisateur** :
   - Créer une conversation
   - Assigner des tags et un dossier
   - Vérifier l'affichage

2. **Scénario Utilisateur Expérimenté** :
   - Avoir plusieurs conversations avec différents tags/dossiers
   - Utiliser les filtres
   - Réorganiser les conversations

3. **Scénario Edge Case** :
   - Conversation sans tags ni dossier
   - Conversation avec tous les tags
   - Conversation dans plusieurs dossiers (ne devrait pas être possible)

---

## 🐛 Bugs Connus à Vérifier

- [ ] Aucun bug connu actuellement

---

## ✅ Critères de Validation

Le test est considéré comme réussi si :
- ✅ Tous les tests fonctionnels de base passent (1-6)
- ✅ L'affichage est correct (7-9)
- ✅ Le filtrage fonctionne (10-12)
- ✅ Les cas limites sont gérés (13-16)
- ✅ Les erreurs sont gérées proprement (17-19)
- ✅ Les performances sont acceptables (20-21)

---

**Dernière mise à jour** : 2025-01-XX  
**Testeur** : ________________  
**Date de test** : ________________  
**Statut global** : ⏳ En attente / ✅ Réussi / ❌ Échec
