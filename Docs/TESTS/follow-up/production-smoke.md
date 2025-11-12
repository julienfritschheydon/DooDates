# Suivi test E2E `tests/e2e/production-smoke.spec.ts`

## Statut général (11 novembre 2025)
- **Importance** : Primordial (filet ultime sans mocks sur build déployé)
- **Mocks utilisés** : Aucun – exécution directe sur `BASE_URL`
- **Dépendances** : URL de prod configurée (`BASE_URL`), réseau externe stable, assets statiques et Supabase opérationnels
- **Objectif** : Détecter tout incident critique sur le déploiement (assets, routing, erreurs console, Supabase)

## Analyse actuelle
- Vérifie accueil, chargement assets, navigation, routing SPA, Supabase, UI principale.
- Tests 3 et 8/10 sont `skip/fixme` (console errors & service worker/assets statiques) → couverture partielle.
- Multiples `waitForTimeout` (2s/3s) pour attendre initialisation.
- Pas de guard centralisé pour console / network en dehors du test skipped.

### Risques identifiés
1. **Test console skip** : `test.skip('Pas d\'erreurs console critiques')` → une régression JS en prod peut passer inaperçue.
2. **Attentes fixes** : `waitForTimeout` de 2–3s peuvent flaker si prod lente.
3. **Routes/Assets** : Tests `fixme` laissent des zones non couvertes (service worker, assets statiques).
4. **Dépendance environnement** : échec silencieux si `BASE_URL` mal configurée (retombe sur localhost). Pas d'assert sur hostname attendu.

## Actions prévues
| ID | Action | Priorité | Statut | Notes |
|----|--------|----------|--------|-------|
| 1 | Diagnostiquer et réactiver le test console (identifier l'erreur 400/WS observée en CI) | Haute | ✅ Fait (11/11/2025) | Allowlist `ws://localhost:8080`, attente networkidle/`expect.poll`, test rejoué |
| 2 | Remplacer `waitForTimeout` par attentes explicites (`toHaveURL`, `toBeVisible`, `waitForLoadState`) | Moyenne | ✅ Fait (11/11/2025) | Usage `expect.poll` + `waitForLoadState`, tous les timeouts fixes retirés |
| 3 | Ajouter vérification `BASE_URL` (hostname attendu, HTTP 200) en préambule | Moyenne | ✅ Fait (11/11/2025) | Nouveau test Playwright `Configuration BASE_URL valide` |
| 4 | Évaluer réactivation tests `fixme` (SW/Assets) ou scission vers run dédié GitHub Pages | Basse | ✅ Fait (11/11/2025) | Tests réactivés avec `test.skip` conditionnel (prod uniquement) |

## Historique
- **11/11/2025** : Audit initial, création du suivi, priorisation réactivation test console et fiabilisation attentes.
- **11/11/2025** : Réactivation test console (allowlist WS localhost, attentes explicites) + exécution Playwright OK.
- **11/11/2025** : Remplacement complet des `waitForTimeout` par `expect.poll`/`waitForLoadState` dans la suite.
- **11/11/2025** : Ajout du test préambule `Configuration BASE_URL valide` (validation hostname + HTTP 200).
- **11/11/2025** : Réactivation tests SW/Assets avec skip conditionnel et requêtes `page.request`.
