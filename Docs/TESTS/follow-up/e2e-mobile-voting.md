# Suivi test E2E `tests/e2e/mobile-voting.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Moyenne (UX mobile, navigation)
- **Mocks utilisés** : Aucun mock explicite (tests de navigation basique)
- **Dépendances** : Navigation, chargement des pages mobile
- **Objectif** : Valider que les pages se chargent correctement sur mobile (DatePoll et FormPoll)

## Analyse actuelle

- 2 tests actifs
- Skip sur Firefox/WebKit (limitation documentée)
- Pas de `waitForLoadState` après les `goto` → peut flaker
- Pas d'utilisation du helper `waitForPageLoad` pour support multi-navigateurs
- Tests déjà assez bien structurés avec attentes explicites

### Risques identifiés

1. **Pas de waitForLoadState** : Après chaque `goto`, pas d'attente explicite
2. **Pas de support multi-navigateurs** : Skip Firefox/WebKit mais pourrait utiliser `waitForPageLoad` pour améliorer
3. **Tests déjà bien structurés** : Utilisent déjà des attentes explicites, juste besoin d'ajouter `waitForPageLoad`

## Actions prévues

| ID  | Action                                             | Priorité | Statut               | Notes                           |
| --- | -------------------------------------------------- | -------- | -------------------- | ------------------------------- |
| 1   | Ajouter `waitForPageLoad` après chaque `goto`      | Haute    | ✅ Fait (11/11/2025) | Support multi-navigateurs       |
| 2   | Ajouter `waitUntil: 'domcontentloaded'` aux `goto` | Basse    | ✅ Fait (11/11/2025) | Cohérence avec les autres tests |

## Historique

- **11/11/2025** : Audit initial, création du suivi, identification des risques (pas de waitForLoadState)
- **11/11/2025** : Refactorisation du test :
  - Ajout `waitForPageLoad` après chaque `goto` (support multi-navigateurs)
  - Ajout `waitUntil: 'domcontentloaded'` à tous les `goto`
  - **Résultat** : 2/2 tests passent sur Mobile Chrome
