# Suivi test E2E `tests/e2e/form-poll-results-access.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Primordial (politique de visibilité résultats = sécurité/privacy critique)
- **Mocks utilisés** : `setupGeminiMock` (mock IA uniquement)
- **Dépendances** : Composants FormPoll, gestion localStorage, validation email
- **Objectif** : Valider les politiques de visibilité des résultats FormPoll (creator-only, voters, public) et l'envoi d'email de confirmation

## Analyse actuelle

- 5 tests couvrant : visibilité creator-only, voters, public, email confirmation, validation email
- Guard console dans `beforeEach` mais pas utilisé dans les tests individuels
- Multiples `waitForTimeout` fixes (300ms-2000ms) pour attendre chargement/validation
- Pas de `waitForLoadState` après `goto` → peut flaker si page lente
- Attentes implicites : `waitForTimeout` au lieu d'attentes explicites sur les éléments
- Gestion erreurs : vérifications conditionnelles mais pas toujours d'assertions explicites

### Risques identifiés

1. **Attentes fixes** : `waitForTimeout` de 300ms-2000ms peuvent flaker si UI plus lente que prévu
2. **Pas de waitForLoadState** : Après `goto`, pas d'attente explicite du chargement complet
3. **Guard console non utilisé** : Guard créé dans `beforeEach` mais pas appelé dans les tests
4. **Attentes implicites** : `waitForTimeout` au lieu d'attentes explicites sur les éléments (boutons, messages)
5. **Validation email** : Test complexe avec plusieurs vérifications conditionnelles → pourrait être simplifié

## Actions prévues

| ID  | Action                                                                                 | Priorité | Statut               | Notes                                                                                        |
| --- | -------------------------------------------------------------------------------------- | -------- | -------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Remplacer `waitForTimeout` par attentes explicites (`toBeVisible`, `waitForLoadState`) | Haute    | ✅ Fait (11/11/2025) | Tous les `waitForTimeout` remplacés par `waitFor`, `toBeVisible`, `waitForLoadState`         |
| 2   | Ajouter `waitForLoadState('networkidle')` après chaque `goto`                          | Haute    | ✅ Fait (11/11/2025) | Ajouté après chaque `goto` pour s'assurer du chargement complet                              |
| 3   | Utiliser le guard console dans les tests ou le supprimer du beforeEach                 | Moyenne  | ✅ Fait (11/11/2025) | Guard console supprimé du beforeEach (non utilisé dans les tests)                            |
| 4   | Simplifier test validation email (assertions plus explicites)                          | Moyenne  | ✅ Fait (11/11/2025) | Test simplifié avec assertions explicites au lieu de vérifications conditionnelles complexes |
| 5   | Extraire logique création poll dans helper réutilisable                                | Basse    | ⏳ À faire           | Logique création poll répétée 5 fois, à extraire dans helper                                 |

## Historique

- **11/11/2025** : Audit initial, création du suivi, identification des risques principaux (attentes fixes, pas de waitForLoadState)
- **11/11/2025** : Refactorisation complète du test :
  - Suppression de tous les `waitForTimeout` (remplacés par `waitFor`, `toBeVisible`, `waitForLoadState`)
  - Ajout `waitForLoadState('networkidle')` après chaque `goto`
  - Suppression guard console du `beforeEach` (non utilisé)
  - Simplification test validation email (assertions explicites)
  - Ajout attentes explicites sur tous les éléments interactifs (inputs, boutons, messages)
