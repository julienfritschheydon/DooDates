# Suivi test E2E `tests/e2e/ultra-simple.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Primordial (parcours DatePoll complet)
- **Mocks utilisés** : `setupGeminiMock` (Edge Function Gemini), utilitaires `enableE2ELocalMode`, `warmup`
- **Données** : Interaction réelle UI + stockage `localStorage` (`dev-polls`, `dev-conversations`)
- **Objectif** : Garantir que la création d’un sondage de dates fonctionne de bout en bout et qu’il apparaît sur le dashboard.

## Analyse actuelle

- Parcours couvert : `/create` → sélection dates & créneaux → saisie titre → finalisation → écran succès → navigation dashboard → vérification du nouveau sondage.
- Assertions principales : visibilité calendrier, présence bouton horaires, titre rempli, succès final, vérification dashboard.
- Captures & logs : screenshots 01-05 + logs console via `attachConsoleGuard`.

### Risques identifiés

1. **Mock IA** : le test ne vérifie pas l’Edge Function réelle. Si l’IA tombe en production, ce test restera vert.
2. **Dépendance `waitForTimeout`** : plusieurs attentes fixes (1–2s) peuvent générer du flaky sous charge.
3. **Vérification lien sondage** : on ne valide pas que l’URL `/poll/{slug}` est accessible après finalisation.
4. **Couverture Supabase** : aucune interaction avec Supabase (normal pour ce test) → besoin d’un filet complémentaire côté prod/integration.

## Actions prévues

| ID  | Action                                                                                 | Priorité | Statut               | Notes                                                            |
| --- | -------------------------------------------------------------------------------------- | -------- | -------------------- | ---------------------------------------------------------------- |
| 1   | Réduire / remplacer `waitForTimeout` par des `expect` ciblés                           | Moyenne  | ✅ Fait (11/11/2025) | Remplacement par attentes explicites (écran succès, networkidle) |
| 2   | Ajouter une vérification explicite du slug (accès à `/poll/{slug}` après finalisation) | Haute    | ✅ Fait (11/11/2025) | Navigation voir le sondage + retour /dashboard, test exécuté     |
| 3   | Documenter dans le guide la dépendance au mock Gemini (fait)                           | Haute    | ✅ Terminé           | Mise à jour `Docs/TESTS/-Tests-Guide.md` (11/11/2025)            |
| 4   | Planifier une variante “sans mock Gemini” (smoke prod IA)                              | Basse    | À planifier          | À envisager dans la suite des travaux                            |

## Historique

- **11/11/2025** : Audit initial, identification des risques, création du présent document.
- **11/11/2025** : Remplacement des `waitForTimeout` par des attentes explicites (écran succès, `waitForLoadState` sur dashboard).
- **11/11/2025** : Ajout d’un contrôle votant `/poll/{slug}` (navigation "Voir le sondage", retour `/dashboard`, test Playwright vert).
