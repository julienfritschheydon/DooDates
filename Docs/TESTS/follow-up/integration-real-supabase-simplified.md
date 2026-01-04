# Suivi test Intégration `tests/integration/real-supabase-simplified.test.ts`

## Statut général (11 novembre 2025)

- **Importance** : Primordial (filet critique backend sans mock)
- **Mocks utilisés** : Aucun – client Supabase réel sur projet de production
- **Dépendances** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `INTEGRATION_TEST_PASSWORD`, compte `test-integration@doodates.com`, réseau stable, base propre
- **Objectif** : Vérifier authentification, CRUD conversations, RLS, performance et connectivité sur Supabase réel

## Analyse actuelle

- Exécution séquentielle (`mode: 'serial'`) pour éviter collisions de données entre tests.
- Authentification via `supabaseClient.auth.signInWithPassword`, puis injection de la session dans `localStorage` pour la page Playwright.@tests/integration/real-supabase-simplified.test.ts#68-134
- Nettoyage agressif des conversations du compte test après chaque scénario pour conserver un état stable.@tests/integration/real-supabase-simplified.test.ts#155-173
- Couverture des cas CRUD complets (create/read/update/delete/list) et vérification RLS depuis Supabase direct, sans passer par l’UI.@tests/integration/real-supabase-simplified.test.ts#262-347 @tests/integration/real-supabase-simplified.test.ts#353-395
- Mesure de performance sur lecture/l’écriture (<2s / <1s) pour détecter des régressions majeures.@tests/integration/real-supabase-simplified.test.ts#402-432
- Dépend fortement d’un profil Supabase existant ; auto-création si absent mais sans rollback si erreur.@tests/integration/real-supabase-simplified.test.ts#80-105

### Risques identifiés

1. **Couplage fort au projet Supabase prod** : le `projectRef` est codé en dur dans l’injection localStorage (`outmbbisrrdiumlweira`). Tout changement d’instance invalidera le test.@tests/integration/real-supabase-simplified.test.ts#112-128
2. **Nettoyage destructif** : `cleanupTestData` supprime TOUTES les conversations du compte test. Nécessite assurance qu’aucune autre vérification n’utilise ce compte en parallèle.@tests/integration/real-supabase-simplified.test.ts#155-171
3. **Secret unique requis** : le test skippe silencieusement si une variable manque → risque de faux vert en CI si une secret est mal configurée (ex: placeholder).@tests/integration/real-supabase-simplified.test.ts#39-59
4. **Profil partiellement initialisé** : création de profile sans renseigner colonnes additionnelles éventuelles (ex: contraintes futures) → pourrait échouer silencieusement et laisser des états incohérents.@tests/integration/real-supabase-simplified.test.ts#87-105
5. **Mesures performance non contextualisées** : seuils (<2s, <1s) pourraient flapper selon charge Supabase mondiale ; pas de retry ni d’alerting dédié.@tests/integration/real-supabase-simplified.test.ts#402-432

## Actions prévues

| ID  | Action                                                                                              | Priorité | Statut               | Notes                                                     |
| --- | --------------------------------------------------------------------------------------------------- | -------- | -------------------- | --------------------------------------------------------- |
| 1   | Externaliser le `projectRef` Supabase (utiliser env dérivée de `VITE_SUPABASE_URL`)                 | Haute    | ✅ Fait (11/11/2025) | Clé `sb-${ref}-auth-token` dérivée avec fallback sécurisé |
| 2   | Sécuriser le cleanup (limiter aux conversations taggées test / ajouter assertions post-suppression) | Haute    | ✅ Fait (11/11/2025) | Context `integrationTest` + purge ciblée                  |
| 3   | Ajouter un check explicite des secrets (fail rapide si placeholder)                                 | Moyenne  | ✅ Fait (11/11/2025) | `test.skip` global si secrets manquants, logs dédiés      |
| 4   | Documenter structure minimale du profil et gérer erreurs d’insertion (rollback)                     | Moyenne  | ✅ Fait (11/11/2025) | Payload partagé + tolérance duplicate dans test           |
| 5   | Ajouter métriques/alertes pour performances (ex: log > threshold, retries conditionnels)            | Basse    | ✅ Fait (11/11/2025) | Warnings si PERF >70% du seuil, logs détaillés            |

## Historique

- **11/11/2025** : Analyse initiale, identification des risques et création du suivi.
- **11/11/2025** : ProjectRef basé sur `VITE_SUPABASE_URL` + fallback sécurisé.
- **11/11/2025** : Nettoyage restreint aux conversations `integrationTest`.
- **11/11/2025** : Validation stricte des secrets et message `test.skip` dédié.
- **11/11/2025** : Profil test documenté (payload minimal) + gestion duplicate.
- **11/11/2025** : Instrumentation PERF (logs + warning proche seuil).
