# Suivi test E2E `tests/e2e/analytics-ai-optimized.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Primordial (analytics IA = fonctionnalité premium critique, version CI optimisée)
- **Mocks utilisés** : `setupAllMocks` (mock IA complet)
- **Dépendances** : Shared context Playwright, localStorage, création FormPoll, votes, analytics
- **Objectif** : Version optimisée de `analytics-ai.spec.ts` pour CI (70% plus rapide)

## Analyse actuelle

- 3 tests optimisés (vs 18 dans la version complète)
- Tests combinés pour réduire le temps d'exécution
- Votes réduits de 5 à 3 (suffisant pour tester analytics)
- Attentes explicites au lieu de `waitForTimeout` fixes
- Utilise `waitForPageLoad` helper

### Optimisations appliquées

1. **Réduction votes** : 5 → 3 (suffisant pour analytics)
2. **Tests combinés** : Quick Queries + Query Personnalisée, Quotas + Cache
3. **Attentes explicites** : Remplacement `waitForTimeout` par attentes d'éléments
4. **Timeout réduit** : 3 minutes → 2 minutes pour le setup
5. **Pas de captures d'écran** : Supprimées pour accélérer

### Résultats

- **Temps d'exécution** : ~52s (vs ~3-4 minutes estimé pour version complète)
- **Gain** : ~70% de réduction comme prévu
- **Couverture** : Tests critiques conservés (setup, quick queries, query personnalisée, cache, quotas)

## Historique

- **11/11/2025** : Création de la version optimisée :
  - Réduction votes de 5 à 3
  - Combinaison de tests pour réduire temps d'exécution
  - Remplacement `waitForTimeout` par attentes explicites
  - Utilisation `waitForPageLoad` helper
  - **Résultat** : 3/3 tests passent en ~52s (vs ~3-4 min pour version complète)
