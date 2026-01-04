# Suivi test E2E `tests/e2e/dashboard-complete.spec.ts`

## Statut général (12 novembre 2025)

- **Importance** : Primordial (parcours back-office complet)
- **Mocks utilisés** : aucun appel réseau mocké, mais injection locale de l'état (localStorage) + garde console stricte
- **Objectif** : garantir que le dashboard chargé en mode invité reste fonctionnel (recherche, filtres, tags/dossiers, vues, actions) sans bruit console bloquant

## Analyse actuelle

- Parcours couvert : `/dashboard` depuis un navigateur invité, seed des conversations/tags/dossiers/polls en localStorage, navigation dans la grille, recherche, filtres, vues tableau/grille, modifications tags/dossiers, scénarios edge (dashboard vide, recherche sans résultat).
- Assertions principales : visibilité des cartes conversations, fonctionnement des filtres et recherche, navigation entre vues, interactions sur cartes (favoris, tags, dossiers), absence d'erreurs console critiques.
- Console guard : `attachConsoleGuard` appliqué avant chaque test avec allowlist limitée (erreurs connues Google Gemini uniquement). Toute erreur hors liste fait échouer la suite.

## Risques identifiés

1. **Quota invité Supabase** : la moindre indisponibilité du service `guestQuota` déclenchait un console error → échec CI.
2. **Dépendance localStorage** : seed manuel large (conversations/tags) → fragilité si schéma évolue sans mise à jour du seed.
3. **Temps de chargement** : certaines sections dépendent de lazy loading (charts, analytics) → risque de flaky si on ne synchronise pas correctement.
4. **Couverture authentifiée** : ce test reste centré invité + seed local, il ne couvre pas les workflows authentifiés ni la persistance Supabase.

## Actions prévues

| ID  | Action                                                                                | Priorité | Statut               | Notes                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------- | -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Assurer le bypass quota en E2E pour éviter les erreurs Supabase                       | Haute    | ✅ Fait (12/11/2025) | `enableE2ELocalMode` force `__IS_E2E_TESTING__` + `?e2e-test=true` → plus d'appel quota en E2E                                                    |
| 2   | Documenter la dépendance au seed localStorage et prévoir une abstraction partagée     | Moyenne  | ✅ Fait (12/11/2025) | Module commun créé : `tests/e2e/fixtures/dashboardSeed.ts` (seed localStorage + session Supabase). Prochaine étape : adoption dans `tags-folders` |
| 3   | Étendre la couverture aux parcours authentifiés (session seed)                        | Basse    | ✅ Fait (12/11/2025) | Bypass Supabase (AuthContext/useDashboardData) + test Playwright authentifié vert                                                                 |
| 4   | Auditer les temps de chargement (charts/analytics) et ajouter des attentes explicites | Moyenne  | ✅ Fait (12/11/2025) | Pas de charts lazy côté dashboard → ajout data-testid (`dashboard-loading`, `dashboard-ready`) + helper `waitForDashboardReady` dans Playwright   |

## Historique

- **12/11/2025** : Correctif quota invité (flag E2E + query param) → test Playwright vert local.
- **12/11/2025** : Session authentifiée seedée validée (`@functional - Affichage quotas pour un utilisateur authentifié`).
- **12/11/2025** : Ajout des marqueurs de chargement et du helper Playwright `waitForDashboardReady` (Action 4).
- **12/11/2025** : Création du présent document de suivi.
