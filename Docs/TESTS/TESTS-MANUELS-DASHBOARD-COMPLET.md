# 🧪 Tests Manuels - Dashboard Complet

**Date de création** : 2025-01-XX  
**Fonctionnalité** : Toutes les fonctionnalités du Dashboard  
**Statut** : ✅ À tester

---

## 📋 Vue d'Ensemble

Ce document couvre tous les tests manuels nécessaires pour valider toutes les fonctionnalités du Dashboard, incluant :
- Navigation et affichage
- Recherche et filtres
- Vues (grille/tableau)
- Sélection multiple
- Pagination
- Tags et dossiers
- Actions sur les cartes

---

## ✅ Tests de Navigation et Affichage

### 1. Charger le dashboard
- [ ] Aller sur `/dashboard`
- [ ] **Résultat attendu** :
  - Le dashboard se charge sans erreur
  - Le titre "Mes conversations" est visible
  - Les conversations sont affichées
  - Aucune erreur dans la console

### 2. Afficher l'indicateur de quota
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - L'indicateur de quota est visible en haut
  - Affiche "X/Y conversations utilisées"
  - Barre de progression visible
  - Bouton "En savoir plus" vers /pricing

### 3. Fermer le dashboard (bouton X)
- [ ] Aller sur le dashboard
- [ ] Cliquer sur le bouton X (fermer) en haut à droite
- [ ] **Résultat attendu** :
  - Retour à la page d'accueil (`/`)
  - L'état du poll en cours est nettoyé

---

## ✅ Tests de Recherche

### 4. Rechercher une conversation par titre
- [ ] Aller sur le dashboard avec plusieurs conversations
- [ ] Utiliser la barre de recherche
- [ ] Taper le titre d'une conversation
- [ ] **Résultat attendu** :
  - Les résultats se filtrent en temps réel
  - Seules les conversations correspondantes sont affichées
  - Le debounce fonctionne (pas de recherche à chaque frappe)

### 5. Rechercher par contenu du message
- [ ] Rechercher avec un mot présent dans le premier message
- [ ] **Résultat attendu** :
  - Les conversations correspondantes sont trouvées

### 6. Recherche sans résultats
- [ ] Rechercher avec un terme qui n'existe pas
- [ ] **Résultat attendu** :
  - Message "Aucun résultat" affiché
  - Message "Essayez avec d'autres critères"

### 7. Effacer la recherche
- [ ] Effectuer une recherche
- [ ] Effacer le contenu de la barre de recherche
- [ ] **Résultat attendu** :
  - Toutes les conversations sont réaffichées

---

## ✅ Tests de Filtres par Statut

### 8. Filtrer par "Tous"
- [ ] Cliquer sur le filtre "Tous"
- [ ] **Résultat attendu** :
  - Toutes les conversations sont affichées
  - Le bouton "Tous" est mis en surbrillance (bleu)

### 9. Filtrer par "Brouillons"
- [ ] Cliquer sur le filtre "Brouillons"
- [ ] **Résultat attendu** :
  - Seules les conversations avec polls en brouillon sont affichées
  - Le filtre est actif (bleu)

### 10. Filtrer par "Actifs"
- [ ] Cliquer sur le filtre "Actifs"
- [ ] **Résultat attendu** :
  - Seules les conversations avec polls actifs sont affichées

### 11. Filtrer par "Clôturés"
- [ ] Cliquer sur le filtre "Clôturés"
- [ ] **Résultat attendu** :
  - Seules les conversations avec polls clôturés sont affichées

### 12. Filtrer par "Archivés"
- [ ] Cliquer sur le filtre "Archivés"
- [ ] **Résultat attendu** :
  - Seules les conversations archivées sont affichées

### 13. Combiner recherche et filtre par statut
- [ ] Appliquer un filtre par statut
- [ ] Effectuer une recherche
- [ ] **Résultat attendu** :
  - Les résultats respectent les deux critères

---

## ✅ Tests de Filtres par Tags

### 14. Filtrer par un tag
- [ ] Cliquer sur le bouton "Tags" dans les filtres
- [ ] Sélectionner un tag dans la liste
- [ ] Fermer le menu
- [ ] **Résultat attendu** :
  - Le bouton affiche "Tags (1)"
  - Seules les conversations avec ce tag sont affichées
  - Le tag sélectionné apparaît comme badge sous les filtres

### 15. Filtrer par plusieurs tags
- [ ] Sélectionner 2-3 tags
- [ ] **Résultat attendu** :
  - Le bouton affiche "Tags (X)"
  - Seules les conversations ayant au moins un des tags sélectionnés sont affichées
  - Tous les tags sélectionnés apparaissent comme badges

### 16. Retirer un tag du filtre
- [ ] Avoir plusieurs tags sélectionnés
- [ ] Cliquer sur le X d'un badge de tag
- [ ] **Résultat attendu** :
  - Le tag est retiré du filtre
  - Les résultats sont mis à jour

### 17. Créer un tag depuis les filtres
- [ ] Cliquer sur "Tags"
- [ ] Dans le champ "Nouveau tag...", taper un nom
- [ ] Cliquer sur "Créer" ou appuyer sur Entrée
- [ ] **Résultat attendu** :
  - Toast de succès : "Tag créé"
  - Le nouveau tag apparaît dans la liste
  - Le tag est automatiquement sélectionné pour le filtre

### 18. Créer un tag avec un nom existant
- [ ] Essayer de créer un tag avec un nom déjà utilisé
- [ ] **Résultat attendu** :
  - Toast d'erreur : "Le tag 'X' existe déjà"
  - Le tag n'est pas créé

---

## ✅ Tests de Filtres par Dossiers

### 19. Filtrer par un dossier
- [ ] Cliquer sur "Tous les dossiers"
- [ ] Sélectionner un dossier
- [ ] **Résultat attendu** :
  - Le bouton affiche le nom du dossier
  - Seules les conversations dans ce dossier sont affichées

### 20. Filtrer par "Tous les dossiers"
- [ ] Avoir un filtre par dossier actif
- [ ] Cliquer sur "Tous les dossiers"
- [ ] **Résultat attendu** :
  - Le filtre est réinitialisé
  - Toutes les conversations sont affichées

### 21. Créer un dossier depuis les filtres
- [ ] Cliquer sur "Tous les dossiers"
- [ ] Dans le champ "Nouveau dossier...", taper un nom
- [ ] Cliquer sur "Créer" ou appuyer sur Entrée
- [ ] **Résultat attendu** :
  - Toast de succès : "Dossier créé"
  - Le nouveau dossier apparaît dans la liste
  - Le dossier est automatiquement sélectionné

### 22. Créer un dossier avec un nom existant
- [ ] Essayer de créer un dossier avec un nom déjà utilisé
- [ ] **Résultat attendu** :
  - Toast d'erreur : "Le dossier 'X' existe déjà"
  - Le dossier n'est pas créé

---

## ✅ Tests de Combinaison de Filtres

### 23. Combiner filtre par statut + tags
- [ ] Appliquer un filtre par statut (ex: "Actifs")
- [ ] Sélectionner un ou plusieurs tags
- [ ] **Résultat attendu** :
  - Les conversations doivent correspondre aux deux critères

### 24. Combiner filtre par statut + dossier
- [ ] Appliquer un filtre par statut
- [ ] Sélectionner un dossier
- [ ] **Résultat attendu** :
  - Les conversations doivent correspondre aux deux critères

### 25. Combiner tags + dossier
- [ ] Sélectionner des tags
- [ ] Sélectionner un dossier
- [ ] **Résultat attendu** :
  - Les conversations doivent avoir les tags ET être dans le dossier

### 26. Combiner recherche + statut + tags + dossier
- [ ] Effectuer une recherche
- [ ] Appliquer un filtre par statut
- [ ] Sélectionner des tags
- [ ] Sélectionner un dossier
- [ ] **Résultat attendu** :
  - Tous les critères sont respectés simultanément

---

## ✅ Tests de Vues (Grille/Tableau)

### 27. Basculer vers la vue tableau
- [ ] Aller sur le dashboard (vue grille par défaut)
- [ ] Cliquer sur l'icône "Table" (vue tableau)
- [ ] **Résultat attendu** :
  - La vue change en tableau
  - L'icône tableau est mise en surbrillance (bleu)
  - Les conversations sont affichées en tableau avec colonnes

### 28. Basculer vers la vue grille
- [ ] Être en vue tableau
- [ ] Cliquer sur l'icône "Grid" (vue grille)
- [ ] **Résultat attendu** :
  - La vue change en grille
  - L'icône grille est mise en surbrillance (bleu)
  - Les conversations sont affichées en cartes

### 29. Persistance de la préférence de vue
- [ ] Changer de vue (grille ↔ tableau)
- [ ] Fermer le dashboard
- [ ] Revenir sur le dashboard
- [ ] **Résultat attendu** :
  - La dernière vue utilisée est restaurée
  - La préférence est sauvegardée dans localStorage

### 30. Vue tableau - Affichage des colonnes
- [ ] Passer en vue tableau
- [ ] **Résultat attendu** :
  - Colonnes visibles : Titre, Type, Statut, Participants, Votes, Date
  - Données correctement affichées dans chaque colonne

### 31. Vue tableau - Actions
- [ ] Passer en vue tableau
- [ ] Vérifier les actions disponibles sur chaque ligne
- [ ] **Résultat attendu** :
  - Actions disponibles : Reprendre, Résultats, Voter, etc.
  - Menu "Gérer les tags/dossier" accessible

---

## ✅ Tests de Sélection Multiple

### 32. Activer la sélection
- [ ] Cliquer sur le bouton "Sélectionner"
- [ ] **Résultat attendu** :
  - Les checkboxes apparaissent sur chaque carte
  - Le bouton change en "X sélectionné(s)"

### 33. Sélectionner une conversation
- [ ] Activer la sélection
- [ ] Cocher une conversation
- [ ] **Résultat attendu** :
  - La conversation est sélectionnée (checkbox cochée)
  - Le compteur est mis à jour

### 34. Sélectionner plusieurs conversations
- [ ] Activer la sélection
- [ ] Cocher plusieurs conversations
- [ ] **Résultat attendu** :
  - Toutes les conversations cochées sont sélectionnées
  - Le compteur affiche le bon nombre

### 35. Sélectionner tout (page courante)
- [ ] Activer la sélection
- [ ] Cliquer sur "Sélectionner" (qui devient "X sélectionné(s)")
- [ ] **Résultat attendu** :
  - Toutes les conversations de la page courante sont sélectionnées
  - Le compteur affiche le nombre correct

### 36. Désélectionner une conversation
- [ ] Avoir plusieurs conversations sélectionnées
- [ ] Décocher une conversation
- [ ] **Résultat attendu** :
  - La conversation est désélectionnée
  - Le compteur est mis à jour

### 37. Désélectionner tout
- [ ] Avoir des conversations sélectionnées
- [ ] Cliquer sur "Désélectionner tout" (ou "Annuler")
- [ ] **Résultat attendu** :
  - Toutes les sélections sont annulées
  - Le bouton redevient "Sélectionner"
  - Les checkboxes disparaissent

### 38. Barre d'actions flottante
- [ ] Sélectionner une ou plusieurs conversations
- [ ] **Résultat attendu** :
  - Une barre d'actions flottante apparaît en bas
  - Affiche "X élément(s) sélectionné(s)"
  - Boutons "Supprimer" et "Annuler" visibles

### 39. Suppression en masse
- [ ] Sélectionner plusieurs conversations
- [ ] Cliquer sur "Supprimer" dans la barre flottante
- [ ] Confirmer la suppression
- [ ] **Résultat attendu** :
  - Toast de succès avec le nombre d'éléments supprimés
  - Les conversations sont supprimées
  - Le dashboard se rafraîchit

### 40. Annuler la suppression en masse
- [ ] Sélectionner des conversations
- [ ] Cliquer sur "Supprimer"
- [ ] Annuler dans la confirmation
- [ ] **Résultat attendu** :
  - Rien n'est supprimé
  - Les conversations restent sélectionnées

---

## ✅ Tests de Pagination

### 41. Pagination visible
- [ ] Avoir plus de conversations que itemsPerPage
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - La pagination est visible en bas
  - Affiche "Page 1 sur X"
  - Boutons Précédent/Suivant visibles

### 42. Navigation vers la page suivante
- [ ] Avoir plusieurs pages
- [ ] Cliquer sur "Suivant"
- [ ] **Résultat attendu** :
  - La page suivante est affichée
  - Le scroll remonte en haut
  - L'info affiche "Page 2 sur X"

### 43. Navigation vers la page précédente
- [ ] Être sur la page 2
- [ ] Cliquer sur "Précédent"
- [ ] **Résultat attendu** :
  - La page précédente est affichée
  - L'info affiche "Page 1 sur X"

### 44. Navigation vers une page spécifique
- [ ] Avoir plusieurs pages
- [ ] Cliquer sur un numéro de page
- [ ] **Résultat attendu** :
  - La page sélectionnée est affichée
  - Le numéro est mis en surbrillance

### 45. Ellipsis pour beaucoup de pages
- [ ] Avoir 10+ pages
- [ ] **Résultat attendu** :
  - Les ellipsis (...) apparaissent pour les pages intermédiaires
  - La première et dernière page sont toujours visibles
  - Les pages autour de la page courante sont visibles

### 46. Boutons Précédent/Suivant désactivés
- [ ] Être sur la page 1
- [ ] **Résultat attendu** :
  - Le bouton "Précédent" est désactivé (opacité réduite)
- [ ] Aller sur la dernière page
- [ ] **Résultat attendu** :
  - Le bouton "Suivant" est désactivé

### 47. Pagination avec filtres
- [ ] Appliquer un filtre qui réduit le nombre de résultats
- [ ] **Résultat attendu** :
  - La pagination se réinitialise à la page 1
  - Le nombre total de pages est recalculé

---

## ✅ Tests de Tags et Dossiers (Gestion depuis les Cartes)

### 48. Ouvrir le dialogue de gestion tags/dossiers
- [ ] Aller sur le dashboard
- [ ] Cliquer sur le menu (⋯) d'une carte
- [ ] Cliquer sur "Gérer les tags/dossier"
- [ ] **Résultat attendu** :
  - Le dialogue s'ouvre
  - Sections "Tags" et "Dossier" visibles

### 49. Assigner des tags depuis le dialogue
- [ ] Ouvrir le dialogue
- [ ] Cocher un ou plusieurs tags
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu** :
  - Toast de succès
  - Les tags apparaissent sur la carte

### 50. Retirer des tags depuis le dialogue
- [ ] Ouvrir le dialogue pour une conversation avec tags
- [ ] Décocher les tags
- [ ] Enregistrer
- [ ] **Résultat attendu** :
  - Les tags disparaissent de la carte

### 51. Assigner un dossier depuis le dialogue
- [ ] Ouvrir le dialogue
- [ ] Cocher un dossier
- [ ] Enregistrer
- [ ] **Résultat attendu** :
  - Le dossier apparaît sur la carte

### 52. Retirer un dossier depuis le dialogue
- [ ] Ouvrir le dialogue pour une conversation avec dossier
- [ ] Cocher "Aucun dossier"
- [ ] Enregistrer
- [ ] **Résultat attendu** :
  - Le dossier disparaît de la carte

### 53. Annuler les modifications
- [ ] Ouvrir le dialogue
- [ ] Modifier tags/dossiers
- [ ] Cliquer sur "Annuler"
- [ ] **Résultat attendu** :
  - Aucune modification n'est sauvegardée

---

## ✅ Tests d'Affichage des Cartes

### 54. Affichage des informations de base
- [ ] Vérifier une carte de conversation
- [ ] **Résultat attendu** :
  - Titre visible
  - Date de création visible
  - Icône de type (poll/conversation) visible
  - Statistiques (si poll) visibles

### 55. Affichage des tags sur les cartes
- [ ] Avoir une conversation avec tags
- [ ] **Résultat attendu** :
  - Les tags sont affichés avec leurs couleurs
  - Chaque tag a son icône et son nom

### 56. Affichage du dossier sur les cartes
- [ ] Avoir une conversation avec dossier
- [ ] **Résultat attendu** :
  - Le dossier est affiché avec son icône et son nom
  - Le dossier apparaît avant les tags

### 57. Affichage combiné tags + dossier
- [ ] Avoir une conversation avec tags et dossier
- [ ] **Résultat attendu** :
  - Dossier en premier, puis tags
  - Tous les éléments sont alignés horizontalement

### 58. Actions sur les cartes (conversation seule)
- [ ] Vérifier une carte de conversation sans poll
- [ ] **Résultat attendu** :
  - Bouton "Reprendre" visible
  - Menu avec "Gérer les tags/dossier" et "Supprimer"

### 59. Actions sur les cartes (avec poll)
- [ ] Vérifier une carte avec poll
- [ ] **Résultat attendu** :
  - Boutons "Résultats" et "Voter" visibles
  - Menu avec "Gérer les tags/dossier"
  - Actions du poll (PollActions) visibles

---

## ✅ Tests de Cas Limites

### 60. Dashboard vide
- [ ] Aller sur le dashboard sans aucune conversation
- [ ] **Résultat attendu** :
  - Message "Aucune conversation" affiché
  - Message "Commencez une conversation avec l'IA..."

### 61. Beaucoup de conversations (performance)
- [ ] Créer 50+ conversations
- [ ] Aller sur le dashboard
- [ ] **Résultat attendu** :
  - Le dashboard se charge rapidement (< 2s)
  - La pagination fonctionne
  - Pas de lag lors du scroll

### 62. Beaucoup de tags (performance)
- [ ] Créer 20+ tags
- [ ] Ouvrir le menu des tags
- [ ] **Résultat attendu** :
  - Le menu s'ouvre rapidement
  - Scroll fluide dans la liste
  - Pas de lag

### 63. Beaucoup de dossiers (performance)
- [ ] Créer 20+ dossiers
- [ ] Ouvrir le menu des dossiers
- [ ] **Résultat attendu** :
  - Le menu s'ouvre rapidement
  - Scroll fluide dans la liste

### 64. Tags avec noms très longs
- [ ] Créer un tag avec un nom de 50+ caractères
- [ ] L'assigner à une conversation
- [ ] **Résultat attendu** :
  - Le tag s'affiche correctement (tronqué si nécessaire)
  - Pas de problème de layout

### 65. Recherche avec caractères spéciaux
- [ ] Rechercher avec des caractères spéciaux (é, @, #, etc.)
- [ ] **Résultat attendu** :
  - La recherche fonctionne correctement
  - Pas d'erreur

---

## ✅ Tests Responsive

### 66. Dashboard sur mobile
- [ ] Ouvrir le dashboard sur mobile (viewport < 768px)
- [ ] **Résultat attendu** :
  - Layout adapté (1 colonne en grille)
  - Filtres empilés verticalement
  - Boutons accessibles (taille suffisante)
  - Pagination fonctionne

### 67. Dashboard sur tablette
- [ ] Ouvrir le dashboard sur tablette (viewport 768-1024px)
- [ ] **Résultat attendu** :
  - Layout adapté (2 colonnes en grille)
  - Tous les éléments sont accessibles

### 68. Dashboard sur desktop
- [ ] Ouvrir le dashboard sur desktop (viewport > 1024px)
- [ ] **Résultat attendu** :
  - Layout optimal (3 colonnes en grille)
  - Tous les éléments sont visibles

---

## ✅ Tests Multi-Navigateurs

### 69. Test sur Chrome
- [ ] Exécuter les tests critiques (1-20) sur Chrome
- [ ] **Résultat attendu** : Tout fonctionne correctement

### 70. Test sur Firefox
- [ ] Exécuter les tests critiques (1-20) sur Firefox
- [ ] **Résultat attendu** : Tout fonctionne correctement

### 71. Test sur Safari
- [ ] Exécuter les tests critiques (1-20) sur Safari
- [ ] **Résultat attendu** : Tout fonctionne correctement

---

## 📝 Notes de Test

### Données de Test Recommandées

**Conversations de test :**
- 3-5 conversations avec différents statuts
- Certaines avec tags, d'autres sans
- Certaines avec dossiers, d'autres sans
- Certaines avec polls, d'autres sans

**Tags de test :**
- Tag 1 : "Prioritaire" (rouge)
- Tag 2 : "Client" (bleu)
- Tag 3 : "Interne" (vert)
- Tag 4 : "Marketing" (orange)
- Tag 5 : "Produit" (violet)

**Dossiers de test :**
- Dossier 1 : "Projets" (📁, bleu)
- Dossier 2 : "Clients" (📂, rouge)
- Dossier 3 : "Interne" (📋, vert)

---

## ✅ Critères de Validation Globaux

Le dashboard est considéré comme validé si :
- ✅ Tous les tests de navigation passent (1-3)
- ✅ La recherche fonctionne (4-7)
- ✅ Tous les filtres fonctionnent (8-26)
- ✅ Les vues fonctionnent (27-31)
- ✅ La sélection multiple fonctionne (32-40)
- ✅ La pagination fonctionne (41-47)
- ✅ Tags et dossiers fonctionnent (48-53)
- ✅ L'affichage est correct (54-59)
- ✅ Les cas limites sont gérés (60-65)
- ✅ Le responsive fonctionne (66-68)
- ✅ Compatible multi-navigateurs (69-71)

---

**Dernière mise à jour** : 2025-01-XX  
**Testeur** : ________________  
**Date de test** : ________________  
**Statut global** : ⏳ En attente / ✅ Réussi / ❌ Échec
