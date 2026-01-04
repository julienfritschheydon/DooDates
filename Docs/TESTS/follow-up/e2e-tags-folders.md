# Suivi test E2E `tests/e2e/tags-folders.spec.ts`

## Statut général (11 novembre 2025)

- **Importance** : Primordial (gestion tags/dossiers = back-office critique)
- **Mocks utilisés** : Seed localStorage (tags, dossiers, conversations) + `enableE2ELocalMode`
- **Dépendances** : Dashboard fonctionnel, composants `ConversationCard` et `ManageTagsFolderDialog` opérationnels
- **Objectif** : Valider la gestion complète des tags et dossiers sur les conversations (assignation, retrait, affichage)

## Analyse actuelle

- 6 tests couvrant : ouverture dialogue, assignation tags, assignation dossier, retrait tags/dossier, affichage sur cartes, cas edge (conversation vide)
- Tests en mode `serial` (dépendance entre tests via localStorage)
- Console guard dans `beforeEach` + guards dupliqués dans chaque test
- Multiples `waitForTimeout` fixes (100ms-1500ms) pour attendre mises à jour React/UI
- Sélecteur fragile pour le bouton menu (itération sur tous les boutons de la carte)
- Code dupliqué : logique d'ouverture du dialogue répétée dans chaque test

### Risques identifiés

1. **Attentes fixes** : `waitForTimeout` de 100ms-1500ms peuvent flaker si React/UI plus lent que prévu
2. **Sélecteur menu fragile** : Recherche du bouton menu par itération sur tous les boutons → peut échouer si structure change
3. **Duplication code** : Logique d'ouverture dialogue répétée 6 fois → maintenance difficile, risque d'incohérence
4. **Guards console dupliqués** : Chaque test recrée un guard alors qu'il y en a déjà un dans `beforeEach` → redondance
5. **Gestion erreurs silencieuse** : Try/catch qui ignore les erreurs (ligne 386-388) → peut masquer des bugs
6. **Pas de vérification état initial** : Tests supposent que les données sont chargées mais ne vérifient pas toujours leur présence
7. **Attentes implicites** : `waitForTimeout` au lieu d'attentes explicites sur les éléments (dialogue, checkboxes, toast)

## Actions prévues

| ID  | Action                                                                                               | Priorité | Statut               | Notes                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Extraire logique d'ouverture dialogue dans helper réutilisable                                       | Haute    | ✅ Fait (11/11/2025) | Helper `openTagsFolderDialog` créé dans `utils.ts`, utilisé dans tous les tests                                 |
| 2   | Remplacer `waitForTimeout` par attentes explicites (`toBeVisible`, `toHaveAttribute`, `expect.poll`) | Haute    | ✅ Fait (11/11/2025) | Tous les `waitForTimeout` remplacés par `toBeChecked`, `toHaveAttribute`, `expect.poll` pour fermeture dialogue |
| 3   | Améliorer sélecteur bouton menu (utiliser icône `MoreVertical` ou aria-label)                        | Moyenne  | ✅ Fait (11/11/2025) | Sélecteur amélioré dans `openTagsFolderDialog` avec fallback robuste                                            |
| 4   | Supprimer guards console dupliqués dans les tests individuels                                        | Moyenne  | ✅ Fait (11/11/2025) | Tous les guards dupliqués supprimés, utilisation uniquement du guard du `beforeEach`                            |
| 5   | Ajouter vérifications état initial (tags/dossiers chargés avant actions)                             | Moyenne  | ✅ Fait (11/11/2025) | Helper `verifyTagsFoldersLoaded` créé et utilisé dans tous les tests                                            |
| 6   | Remplacer try/catch silencieux par assertions explicites                                             | Basse    | ✅ Fait (11/11/2025) | Try/catch remplacé par vérifications conditionnelles avec assertions explicites                                 |

## Historique

- **11/11/2025** : Audit initial, création du suivi, identification des risques principaux (attentes fixes, duplication code, sélecteurs fragiles)
- **11/11/2025** : Refactorisation complète du test :
  - Création helpers `openTagsFolderDialog` et `verifyTagsFoldersLoaded` dans `utils.ts`
  - Suppression de tous les `waitForTimeout` (remplacés par attentes explicites)
  - Suppression de tous les guards console dupliqués
  - Ajout vérifications état initial avec `verifyTagsFoldersLoaded`
  - Amélioration sélecteur bouton menu dans le helper
  - Remplacement try/catch silencieux par assertions explicites
  - Utilisation `expect.poll` pour attendre fermeture dialogue
  - Ajout `waitForLoadState('networkidle')` après `goto` pour fiabiliser les chargements
  - Ajout erreur session initialization dans allowlist console guard (Firefox)
  - Ajout `waitForSelector` avant recherche carte pour éviter timeouts Safari/WebKit
