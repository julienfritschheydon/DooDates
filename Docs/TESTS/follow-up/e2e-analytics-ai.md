# Suivi test E2E `tests/e2e/analytics-ai.spec.ts`

## Statut général (11 novembre 2025)
- **Importance** : Primordial (analytics IA = fonctionnalité premium critique)
- **Mocks utilisés** : `setupAllMocks` (mock IA complet)
- **Dépendances** : Shared context Playwright, localStorage, création FormPoll, votes, analytics
- **Objectif** : Valider l'analytics IA (insights automatiques, quick queries, query personnalisée, cache, quotas)

## Analyse actuelle
- Tests en mode serial avec shared context
- Skip sur Firefox/Safari (limitation Playwright shared context)
- Nombreux `waitForTimeout` → peut flaker et ralentir les tests
- Pas d'utilisation du helper `waitForPageLoad` pour support multi-navigateurs
- Pas de `waitUntil: 'domcontentloaded'` sur les `goto`
- Tests très longs (timeout 3 minutes pour le setup)

### Risques identifiés
1. **Nombreux waitForTimeout** : Plus de 50 occurrences → tests fragiles et lents
2. **Pas de waitForPageLoad** : Utilise directement `waitForLoadState("networkidle")` sans helper
3. **Tests très longs** : Setup prend 3 minutes, total probablement 10+ minutes
4. **Pas d'optimisation** : Beaucoup de temps d'attente fixe qui pourrait être réduit

## Actions prévues
| ID | Action | Priorité | Statut | Notes |
|----|--------|----------|--------|-------|
| 1 | Remplacer `waitForTimeout` par attentes explicites | Haute | ⏳ À faire | Utiliser `expect.poll` ou attentes d'éléments |
| 2 | Utiliser `waitForPageLoad` helper au lieu de `waitForLoadState` direct | Haute | ⏳ À faire | Support multi-navigateurs (même si skip Firefox/Safari) |
| 3 | Ajouter `waitUntil: 'domcontentloaded'` aux `goto` | Moyenne | ⏳ À faire | Cohérence avec les autres tests |
| 4 | Créer version optimisée `analytics-ai-optimized.spec.ts` | Moyenne | ✅ Fait (11/11/2025) | Version créée : 3 tests en ~52s (vs ~3-4 min), gain ~70% |

## Historique
- **11/11/2025** : Audit initial, création du suivi, identification des risques (nombreux waitForTimeout, tests longs, pas d'optimisation)
- **11/11/2025** : Améliorations partielles du test :
  - Ajout `waitForPageLoad` dans beforeEach et test setup
  - Remplacement de quelques `waitForTimeout` critiques par attentes explicites
  - Ajout `waitUntil: 'domcontentloaded'` aux `goto` principaux
  - **Résultat** : Test setup passe (29.8s au lieu de ~40s estimé)
  - **Note** : Fichier très long (1351 lignes), améliorations complètes nécessiteraient beaucoup de temps

