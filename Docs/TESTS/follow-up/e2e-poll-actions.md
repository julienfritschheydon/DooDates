# Suivi test E2E `tests/e2e/poll-actions.spec.ts`

## Statut général (11 novembre 2025)
- **Importance** : Moyenne (navigation dashboard, actions de base)
- **Mocks utilisés** : Aucun mock explicite (tests de navigation basique)
- **Dépendances** : Navigation, chargement des pages
- **Objectif** : Valider que le dashboard et les pages de création se chargent sans crash

## Analyse actuelle
- 1 test actif (très basique)
- Pas de `waitForLoadState` après les `goto` → peut flaker
- Pas d'utilisation du helper `waitForPageLoad` pour support multi-navigateurs
- Tests très simples (juste vérifier que les pages se chargent)
- Pas de vérification d'éléments spécifiques du dashboard

### Risques identifiés
1. **Pas de waitForLoadState** : Après chaque `goto`, pas d'attente explicite
2. **Tests très basiques** : Ne vérifient que la présence de `body`, pas d'éléments spécifiques
3. **Pas de support multi-navigateurs** : Pas d'utilisation de `waitForPageLoad` pour Firefox/WebKit
4. **Pas de vérification réelle** : Ne teste pas vraiment les "actions" du dashboard

## Actions prévues
| ID | Action | Priorité | Statut | Notes |
|----|--------|----------|--------|-------|
| 1 | Ajouter `waitForPageLoad` après chaque `goto` | Haute | ✅ Fait (11/11/2025) | Support multi-navigateurs |
| 2 | Améliorer les vérifications (éléments spécifiques du dashboard) | Moyenne | ✅ Fait (11/11/2025) | Vérifications dashboard avec fallback |
| 3 | Ajouter `waitUntil: 'domcontentloaded'` aux `goto` | Basse | ✅ Fait (11/11/2025) | Cohérence avec les autres tests |

## Historique
- **11/11/2025** : Audit initial, création du suivi, identification des risques (pas de waitForLoadState, tests très basiques)
- **11/11/2025** : Refactorisation du test :
  - Ajout `waitForPageLoad` après chaque `goto` (support multi-navigateurs)
  - Ajout `waitUntil: 'domcontentloaded'` à tous les `goto`
  - Amélioration vérifications dashboard (éléments spécifiques avec fallback)
  - **Résultat** : 1/1 test passe sur Chromium

