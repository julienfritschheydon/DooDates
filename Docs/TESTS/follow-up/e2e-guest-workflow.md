# Suivi test E2E `tests/e2e/guest-workflow.spec.ts`

## Statut général (11 novembre 2025)
- **Importance** : Primordial (expérience utilisateur invité = cœur de la proposition de valeur)
- **Mocks utilisés** : `setupGeminiMock` (mock IA)
- **Dépendances** : localStorage, quotas invités, modals d'incitation auth
- **Objectif** : Valider le flux complet utilisateur invité (création conversation, quotas, modals auth, persistance)

## Analyse actuelle
- 7 tests actifs (actuellement skip)
- Pas de `waitForLoadState` après `goto` et `reload` → peut flaker
- Pas d'utilisation du helper `waitForPageLoad` pour support multi-navigateurs
- Attentes fragiles avec `.catch()` qui peuvent masquer des erreurs
- Pas de `waitUntil: 'domcontentloaded'` sur les `goto`

### Risques identifiés
1. **Test skip** : Actuellement désactivé, doit être réactivé
2. **Pas de waitForLoadState** : Après `reload()` et certains `goto`, pas d'attente explicite
3. **Attentes fragiles** : Utilisation de `.catch()` qui peut masquer des erreurs
4. **Pas d'utilisation des helpers** : `waitForPageLoad` déjà créé mais non utilisé

## Actions prévues
| ID | Action | Priorité | Statut | Notes |
|----|--------|----------|--------|-------|
| 1 | Réactiver le test (retirer `.skip`) | Haute | ✅ Fait (11/11/2025) | Test réactivé avec succès |
| 2 | Ajouter `waitForPageLoad` après chaque `goto` et `reload` | Haute | ✅ Fait (11/11/2025) | Support multi-navigateurs |
| 3 | Améliorer les attentes fragiles (remplacer `.catch()` par assertions explicites) | Moyenne | ✅ Fait (11/11/2025) | Vérifications conditionnelles explicites |
| 4 | Ajouter `waitUntil: 'domcontentloaded'` aux `goto` et `reload` | Basse | ✅ Fait (11/11/2025) | Cohérence avec les autres tests |

## Historique
- **11/11/2025** : Audit initial, création du suivi, identification des risques (test skip, pas de waitForLoadState, attentes fragiles)
- **11/11/2025** : Refactorisation complète du test :
  - Réactivation du test (retrait `.skip`)
  - Ajout `waitForPageLoad` après chaque `goto` et `reload` (support multi-navigateurs)
  - Amélioration attentes fragiles (vérifications conditionnelles explicites au lieu de `.catch()`)
  - Ajout `waitUntil: 'domcontentloaded'` à tous les `goto` et `reload`
  - Suppression des `goto` redondants (beforeEach charge déjà la page)
  - **Résultat** : 7/7 tests passent sur Chromium

