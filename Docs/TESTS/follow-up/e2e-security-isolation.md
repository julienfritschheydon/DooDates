# Suivi test E2E `tests/e2e/security-isolation.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Critique (sécurité, isolation des données)
- **Mocks utilisés** : `setupGeminiMock` (mock IA)
- **Dépendances** : Authentification mockée, localStorage, navigation
- **Objectif** : Valider la sécurité (pas de fuite de tokens, navigation sécurisée, isolation des données)

## Analyse actuelle

- 2 tests actifs
- Format auth incorrect : utilise `supabase.auth.token` au lieu du format réel Supabase
- Pas de `waitForLoadState` après `goto` et `reload` → peut flaker
- Pas d'utilisation des helpers `mockSupabaseAuth` et `waitForPageLoad`
- Pas de `waitUntil: 'domcontentloaded'` sur les `goto`

### Risques identifiés

1. **Format auth incorrect** : Utilise `supabase.auth.token` au lieu du format réel Supabase
2. **Pas de waitForLoadState** : Après `reload()` et certains `goto`, pas d'attente explicite
3. **Pas d'utilisation des helpers** : `mockSupabaseAuth` et `waitForPageLoad` déjà créés mais non utilisés
4. **Vérifications de sécurité basiques** : Pourrait être amélioré avec plus de tests

## Actions prévues

| ID  | Action                                                    | Priorité | Statut               | Notes                                       |
| --- | --------------------------------------------------------- | -------- | -------------------- | ------------------------------------------- |
| 1   | Remplacer mock auth par `mockSupabaseAuth` helper         | Haute    | ✅ Fait (11/11/2025) | Helper utilisé avec format Supabase correct |
| 2   | Ajouter `waitForPageLoad` après chaque `goto` et `reload` | Haute    | ✅ Fait (11/11/2025) | Support multi-navigateurs                   |
| 3   | Ajouter `waitUntil: 'domcontentloaded'` aux `goto`        | Basse    | ✅ Fait (11/11/2025) | Cohérence avec les autres tests             |

## Historique

- **11/11/2025** : Audit initial, création du suivi, identification des risques (format auth incorrect, pas de waitForLoadState)
- **11/11/2025** : Refactorisation complète du test :
  - Remplacement mock auth par `mockSupabaseAuth` helper (format Supabase correct)
  - Ajout `waitForPageLoad` après chaque `goto` et `reload` (support multi-navigateurs)
  - Ajout `waitUntil: 'domcontentloaded'` à tous les `goto` et `reload`
  - Correction vérification token (format Supabase réel)
  - **Résultat** : 2/2 tests passent sur Chromium
