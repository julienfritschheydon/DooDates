# Suivi test E2E `tests/e2e/form-poll-regression.spec.ts`

## Statut général (11 novembre 2025)
- **Importance** : Primordial (création/modification FormPoll IA = fonctionnalité critique)
- **Mocks utilisés** : `setupAllMocks` (mock Gemini/IA) + seed localStorage
- **Dépendances** : Chat input fonctionnel, composants FormPoll, IA mockée opérationnelle
- **Objectif** : Valider la création et modification de Form Polls via IA (création, ajout question, suppression, reprise conversation)

## Analyse actuelle
- 4 tests en mode `serial` couvrant : création FormPoll, ajout question, suppression question, reprise conversation
- Tests skip sur Firefox/Safari (bug Playwright shared context)
- Tests 2 et 3 skip sur mobile (textarea caché par z-index)
- Multiples `waitForTimeout` fixes (1000ms-2000ms) pour attendre stabilisation UI
- Nombreux screenshots de debug (TEST1-BEFORE-ENTER.png, etc.) → ne devraient pas être en production
- Logs verbeux avec `mkLogger` → utile pour debug mais peut être simplifié
- Gestion d'erreurs avec try/catch mais pas toujours d'assertions explicites
- Variables partagées (`pollCreated`, `pollUrl`) entre tests → dépendance séquentielle forte

### Risques identifiés
1. **Skip navigateurs** : Tests non exécutés sur Firefox/Safari → couverture incomplète
2. **Skip mobile** : Tests 2 et 3 skip sur mobile → fonctionnalité non testée sur mobile
3. **Attentes fixes** : `waitForTimeout` de 1000ms-2000ms peuvent flaker si UI plus lente
4. **Screenshots debug** : Screenshots systématiques dans chaque test → pollution test-results, ralentissement
5. **Logs verbeux** : Logs de debug partout → utile pour debug mais peut masquer les vraies erreurs
6. **Dépendance séquentielle** : Tests dépendent les uns des autres via variables partagées → fragile si un test échoue
7. **Attentes implicites** : `waitForTimeout` au lieu d'attentes explicites sur les éléments
8. **Gestion mobile** : Problème z-index sur mobile non résolu → tests skip au lieu d'être corrigés

## Actions prévues
| ID | Action | Priorité | Statut | Notes |
|----|--------|----------|--------|-------|
| 1 | Supprimer screenshots de debug (ou les rendre conditionnels via env var) | Haute | ✅ Fait (11/11/2025) | Screenshots conditionnels via `DEBUG_E2E=1`, helper `debugScreenshot` créé |
| 2 | Remplacer `waitForTimeout` par attentes explicites (`toBeVisible`, `expect.poll`) | Haute | ✅ Fait (11/11/2025) | Tous les `waitForTimeout` remplacés par `waitForLoadState`, `expect.poll`, `toBeVisible` |
| 3 | Simplifier logs verbeux (garder seulement les logs critiques) | Moyenne | ✅ Fait (11/11/2025) | Logs conditionnels via `DEBUG_E2E=1`, helper `mkLogger` amélioré |
| 4 | Améliorer gestion mobile (résoudre problème z-index ou améliorer skip message) | Moyenne | ⏳ À faire | Tests 2 et 3 skip sur mobile (z-index), à documenter ou corriger |
| 5 | Réduire dépendance séquentielle (isoler les tests ou améliorer la gestion d'erreur) | Moyenne | ⏳ À faire | Tests dépendent de `pollCreated` et `pollUrl`, à améliorer |
| 6 | Améliorer gestion erreurs (assertions explicites au lieu de try/catch silencieux) | Basse | ✅ Fait (11/11/2025) | Assertions explicites avec `expect.poll` pour attentes dynamiques |
| 7 | Documenter pourquoi skip Firefox/Safari (lien vers issues GitHub) | Basse | ⏳ À faire | Commentaire présent mais pourrait être amélioré |

## Historique
- **11/11/2025** : Audit initial, création du suivi, identification des risques principaux (attentes fixes, screenshots debug, skip navigateurs/mobile)
- **11/11/2025** : Refactorisation partielle du test :
  - Screenshots rendus conditionnels via `DEBUG_E2E=1` (helper `debugScreenshot`)
  - Logs rendus conditionnels via `DEBUG_E2E=1` (helper `mkLogger` amélioré)
  - Suppression de tous les `waitForTimeout` (remplacés par `waitForLoadState`, `expect.poll`, `toBeVisible`)
  - Amélioration attentes dans `beforeEach` (attente explicite éditeur au lieu de timeout fixe)
  - Utilisation `expect.poll` pour attentes dynamiques (ajout/suppression questions)
  - Simplification gestion erreurs IA (assertion explicite au lieu de Promise.race)

