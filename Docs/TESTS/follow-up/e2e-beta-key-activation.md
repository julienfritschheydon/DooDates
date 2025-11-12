# Suivi test E2E `tests/e2e/beta-key-activation.spec.ts`

## Statut général (11 novembre 2025)
- **Importance** : Primordial (activation clés bêta = fonctionnalité premium critique)
- **Mocks utilisés** : `setupGeminiMock` (mock IA) + `page.route()` pour mock API Supabase
- **Dépendances** : Authentification mockée, API Supabase mockée, validation format clé
- **Objectif** : Valider le flux complet d'activation de clés bêta (validation format, activation, gestion erreurs, formatage input)

## Analyse actuelle
- 9 tests actifs + 2 tests skip (intégration réelle Supabase)
- Tests skip sur WebKit/Safari (bug Playwright `page.route()` non fiable)
- Code dupliqué : logique mock authentification répétée dans chaque test
- Multiples `reload()` sans `waitForLoadState` → peut flaker
- Pas de `waitForLoadState` après certains `goto`
- Test skip avec `waitForTimeout(5000)` → devrait être supprimé ou amélioré
- Tests d'intégration skip par défaut (normal, mais à documenter)

### Risques identifiés
1. **Code dupliqué** : Mock authentification répété 9 fois → maintenance difficile
2. **Pas de waitForLoadState** : Après `reload()` et certains `goto`, pas d'attente explicite
3. **Skip WebKit** : Tests non exécutés sur Safari → couverture incomplète (limitation Playwright)
4. **Test skip avec timeout** : `waitForTimeout(5000)` dans test skip → devrait être supprimé
5. **Attentes implicites** : Pas toujours d'attentes explicites sur les éléments

## Actions prévues
| ID | Action | Priorité | Statut | Notes |
|----|--------|----------|--------|-------|
| 1 | Extraire logique mock authentification dans helper réutilisable | Haute | ✅ Fait (11/11/2025) | Helper `mockSupabaseAuth` créé dans `utils.ts`, utilisé dans tous les tests |
| 2 | Ajouter `waitForLoadState('networkidle')` après chaque `goto` et `reload` | Haute | ✅ Fait (11/11/2025) | Ajouté après chaque `goto` et `reload` pour fiabiliser les chargements |
| 3 | Supprimer `waitForTimeout` du test skip ou améliorer | Moyenne | ✅ Fait (11/11/2025) | `waitForTimeout(5000)` supprimé, commentaire amélioré |
| 4 | Documenter pourquoi skip WebKit (limitation Playwright) | Basse | ✅ Fait (11/11/2025) | Lien vers issue GitHub ajouté dans chaque test skip |
| 5 | Améliorer attentes explicites où nécessaire | Basse | ✅ Fait (11/11/2025) | `waitUntil: 'domcontentloaded'` ajouté à tous les `goto` et `reload` |

## Historique
- **11/11/2025** : Audit initial, création du suivi, identification des risques principaux (code dupliqué, pas de waitForLoadState, skip WebKit)
- **11/11/2025** : Refactorisation complète du test :
  - Création helper `mockSupabaseAuth` dans `utils.ts` (réutilisable)
  - Suppression de tous les `waitForTimeout` (remplacés par `waitForLoadState`)
  - Ajout `waitForLoadState('networkidle')` après chaque `goto` et `reload`
  - Ajout `waitUntil: 'domcontentloaded'` à tous les `goto` et `reload`
  - Documentation skip WebKit améliorée (lien vers issue GitHub)
  - Simplification test skip (suppression timeout fixe, commentaires améliorés)
- **11/11/2025** : Support multi-navigateurs (Firefox, WebKit, Mobile) :
  - Création helper `waitForPageLoad` avec gestion spéciale Firefox (timeout 30s + fallback)
  - Optimisation : suppression des `goto` redondants (beforeEach charge déjà la page)
  - **Résultat** : 32/32 tests actifs passent sur tous les navigateurs (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
  - Tests avec `page.route()` skip sur WebKit/Safari (limitation Playwright documentée)

