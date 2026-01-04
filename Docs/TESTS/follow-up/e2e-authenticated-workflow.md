# Suivi test E2E `tests/e2e/authenticated-workflow.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Primordial (expérience utilisateur authentifié = fonctionnalité premium critique)
- **Mocks utilisés** : `setupGeminiMock` (mock IA)
- **Dépendances** : Authentification mockée, localStorage, migration données invités → authentifiés
- **Objectif** : Valider le flux complet utilisateur authentifié (sign up, quotas étendus, migration données, features premium, sign out)

## Analyse actuelle

- 6 tests actifs
- Code dupliqué : logique mock authentification répétée dans chaque test (format incorrect : `supabase.auth.token` au lieu du format Supabase réel)
- Pas de `waitForLoadState` après `goto` et `reload` → peut flaker
- Pas d'utilisation des helpers `mockSupabaseAuth` et `waitForPageLoad` créés précédemment
- Format d'authentification incorrect : utilise `supabase.auth.token` au lieu du format réel Supabase (`sb-{projectId}-auth-token`)
- Pas de gestion spéciale Firefox pour les attentes

### Risques identifiés

1. **Code dupliqué** : Mock authentification répété 6 fois avec format incorrect
2. **Pas de waitForLoadState** : Après `reload()` et certains `goto`, pas d'attente explicite
3. **Format auth incorrect** : Utilise `supabase.auth.token` au lieu du format réel Supabase
4. **Pas d'utilisation des helpers** : `mockSupabaseAuth` et `waitForPageLoad` déjà créés mais non utilisés
5. **Attentes fragiles** : Certaines attentes avec `.catch()` peuvent masquer des erreurs

## Actions prévues

| ID  | Action                                                                           | Priorité | Statut               | Notes                                                                     |
| --- | -------------------------------------------------------------------------------- | -------- | -------------------- | ------------------------------------------------------------------------- |
| 1   | Remplacer tous les mocks auth par `mockSupabaseAuth` helper                      | Haute    | ✅ Fait (11/11/2025) | Helper utilisé avec format Supabase correct (`sb-{projectId}-auth-token`) |
| 2   | Ajouter `waitForPageLoad` après chaque `goto` et `reload`                        | Haute    | ✅ Fait (11/11/2025) | Helper utilisé pour support multi-navigateurs (Firefox, WebKit, Mobile)   |
| 3   | Supprimer les `goto` redondants si beforeEach charge déjà la page                | Moyenne  | ✅ Fait (11/11/2025) | Optimisé comme dans beta-key-activation                                   |
| 4   | Améliorer les attentes fragiles (remplacer `.catch()` par assertions explicites) | Moyenne  | ✅ Fait (11/11/2025) | Attentes améliorées avec vérifications conditionnelles explicites         |
| 5   | Ajouter `waitUntil: 'domcontentloaded'` aux `goto` et `reload`                   | Basse    | ✅ Fait (11/11/2025) | Cohérence avec les autres tests                                           |

## Historique

- **11/11/2025** : Audit initial, création du suivi, identification des risques principaux (code dupliqué, format auth incorrect, pas de waitForLoadState)
- **11/11/2025** : Refactorisation complète du test :
  - Remplacement de tous les mocks auth par `mockSupabaseAuth` helper (format Supabase correct)
  - Ajout `waitForPageLoad` après chaque `goto` et `reload` (support multi-navigateurs)
  - Suppression des `goto` redondants (beforeEach charge déjà la page)
  - Amélioration des attentes fragiles (vérifications conditionnelles explicites au lieu de `.catch()`)
  - Ajout `waitUntil: 'domcontentloaded'` à tous les `goto` et `reload`
  - Correction format auth token dans test "should access premium features" (vérifie format Supabase réel)
  - **Résultat** : 30/30 tests passent sur tous les navigateurs (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
