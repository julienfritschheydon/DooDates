# Architecture Frontend Multi-Produits

## 🎯 Objectif
Créer une architecture modulaire pour gérer les différents types de produits (date-polls, form-polls, quizz) de manière évolutive et maintenable.

## 🔍 État Actuel
- Composants mélangés dans `/src/components`
- Pas de séparation claire entre fonctionnalités partagées et spécifiques
- Logique métier potentiellement dupliquée

## 🏗️ Structure Proposée

```
src/
├── components/
│   ├── shared/           # Composants partagés (boutons, inputs, etc.)
│   ├── layout/           # Layouts communs
│   ├── features/         # Fonctionnalités partagées
│   └── products/         # Composants spécifiques aux produits
│       ├── date-polls/        # Composants pour les sondages de dates
│       ├── form-polls/        # Composants pour les formulaires
│       ├── quizz/             # Composants pour les quiz
│       └── availability-polls/ # Composants pour les sondages de disponibilités
│
├── lib/
│   ├── products/         # Logique métier des produits (existant)
│   └── hooks/            # Hooks personnalisés
│
└── app/
    ├── date-polls/        # Routes sondages de dates
    ├── form-polls/        # Routes formulaires
    ├── quizz/             # Routes quiz
    └── availability-polls/ # Routes sondages de disponibilités
```

## 🛠️ Plan d'Action

### 1. Réorganisation des Composants (2h)
- [x] Créer la structure de dossiers
- [x] Déplacer les composants existants dans la nouvelle structure
- [x] Mettre à jour les imports

### 2. Création des Contextes (2h)
- [x] `ProductContext` pour gérer l'état partagé
- [x] `FeatureFlags` pour l'activation/désactivation de fonctionnalités
- [x] `AnalyticsContext` pour le suivi des événements

### 3. Mise en Place du Routing (2h)
- [x] Configurer le routage dynamique par type de produit
- [x] Gérer les redirections et les 404
- [x] Implémenter le chargement paresseux (lazy loading)

### 4. Tests et Documentation (2h)
- [x] Mettre à jour les tests unitaires
- [x] Ajouter des tests d'intégration
- [x] Documenter l'architecture et les bonnes pratiques

## 📦 Composants Clés

### Composants Partagés
- `ProductLayout` - Layout commun à tous les produits
- `ProductHeader` - En-tête avec navigation
- `ProductCard` - Carte d'aperçu de produit
- `ProductForm` - Formulaire de création/édition

### Hooks Personnalisés
- `useProduct` - Gestion de l'état du produit
- `useProductAPI` - Appels API communs
- `useProductValidation` - Validation des données

## 🔄 Workflow de Développement

1. **Nouveau Composant**
   - Créer dans le dossier du produit concerné
   - Extraire la logique partagée dans `/lib`
   - Documenter les props et le comportement

2. **Modification d'Existant**
   - Vérifier l'impact sur les autres produits
   - Mettre à jour la documentation
   - Mettre à jour les tests

## 📈 Métriques de Succès
- Réduction de la duplication de code
- Temps de chargement initial réduit
- Facilité d'ajout de nouveaux types de produits
- Couverture de tests maintenue ou améliorée
