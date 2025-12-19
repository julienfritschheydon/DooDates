# EOL: Suppression de `polls_created` (End of Life)

**Date :** 19 Janvier 2025  
**Statut :** ✅ Complété  
**Branche :** `feature/eol-remove-polls-created`

## Vue d'ensemble

Ce document décrit la décision et l'implémentation de la suppression définitive du champ `polls_created` de la base de données et du code, remplacé par un calcul à la volée des compteurs séparés par type de poll.

## Contexte

Avant la séparation des quotas par produit (Décembre 2024), le système utilisait un compteur global `polls_created` pour suivre tous les types de polls. Après la séparation, chaque type de poll a son propre compteur :
- `date_polls_created`
- `form_polls_created`
- `quizz_created`
- `availability_polls_created`

Le champ `polls_created` était maintenu par un trigger SQL pour la rétrocompatibilité, mais n'était plus utilisé dans la logique métier.

## Décision EOL

**Raison :** Simplifier l'architecture en supprimant un champ redondant qui n'est plus nécessaire.

**Impact :** 
- ✅ Réduction de la complexité de la base de données
- ✅ Suppression d'un trigger SQL inutile
- ✅ Code plus simple et maintenable
- ✅ Pas d'impact fonctionnel (le total est calculé à la volée)

## Implémentation

### Phase 1 : Préparation du code (Décembre 2024 - Janvier 2025)

1. **Mise à jour des interfaces TypeScript**
   - Suppression de `pollsCreated` de `QuotaConsumedData`
   - Suppression de `pollsCreated` de `GuestQuotaData`
   - Création de `calculateTotalPollsCreated()` pour calculer le total à la volée

2. **Mise à jour des services**
   - `quotaTracking.ts` : Suppression de `pollsCreated` de la logique
   - `guestQuotaService.ts` : Suppression de `pollsCreated` de la logique
   - Edge Function `quota-tracking` : Suppression de `pollsCreated` des réponses

3. **Mise à jour des composants UI**
   - `AdminQuotaDashboard.tsx` : Utilise `calculateTotalPollsCreated()`
   - `AdminUserActivity.tsx` : Utilise `calculateTotalPollsCreated()`

4. **Mise à jour des scripts SQL**
   - `create-quota-tracking-table.sql` : Suppression de `polls_created`
   - `create-guest-quotas-table.sql` : Suppression de `polls_created`
   - `view-user-quotas.sql` : Utilise calcul à la volée
   - `monitor-guest-quotas.sql` : Utilise calcul à la volée
   - `create-can-consume-function.sql` : Suppression de `polls_created`

5. **Mise à jour des tests**
   - Tests unitaires : Suppression de `pollsCreated` des mocks
   - Tests E2E : Utilisation de `calculateTotalPollsCreated()` pour les assertions

### Phase 2 : Exécution SQL (19 Janvier 2025)

**Script exécuté :** `sql-scripts/eol-remove-polls-created.sql`

**Actions effectuées :**
1. Suppression du trigger `sync_polls_created_trigger` sur `quota_tracking`
2. Suppression du trigger `sync_polls_created_trigger` sur `guest_quotas`
3. Suppression de la fonction `sync_polls_created_from_separated_counters()`
4. Suppression de la colonne `polls_created` de `quota_tracking`
5. Suppression de la colonne `polls_created` de `guest_quotas`
6. Vérification que toutes les suppressions ont réussi

**Résultat :** ✅ Succès - Tous les tests passent après l'exécution

### Phase 3 : Validation (19 Janvier 2025)

**Tests exécutés :**
- ✅ 1274 tests unitaires passés
- ✅ 6 tests E2E critiques passés après exécution SQL
- ✅ Vérification que toutes les anciennes pages redirigent correctement
- ✅ Vérification que tous les composants UI fonctionnent avec calcul à la volée

## Fonction utilitaire

### `calculateTotalPollsCreated()`

```typescript
export function calculateTotalPollsCreated(quota: {
  datePollsCreated: number;
  formPollsCreated: number;
  quizzCreated: number;
  availabilityPollsCreated: number;
}): number {
  return quota.datePollsCreated + quota.formPollsCreated + quota.quizzCreated + quota.availabilityPollsCreated;
}
```

**Utilisation :** Utilisée dans les composants UI pour afficher le total de polls créés sans avoir besoin du champ `polls_created` dans la base de données.

## Migration

**Aucune migration de données nécessaire** car le projet n'est pas encore en production.

Si une migration était nécessaire, elle consisterait à :
1. Calculer `polls_created` à partir des compteurs séparés pour chaque ligne
2. Vérifier la cohérence des données
3. Exécuter le script de suppression

## Fichiers modifiés

### Code TypeScript
- `src/lib/quotaTracking.ts`
- `src/lib/quotaTracking.d.ts`
- `src/lib/guestQuotaService.ts`
- `src/lib/supabase.ts`
- `src/pages/AdminQuotaDashboard.tsx`
- `src/pages/AdminUserActivity.tsx`
- `supabase/functions/quota-tracking/index.ts`

### Scripts SQL
- `sql-scripts/create-quota-tracking-table.sql`
- `sql-scripts/create-guest-quotas-table.sql`
- `sql-scripts/view-user-quotas.sql`
- `sql-scripts/monitor-guest-quotas.sql`
- `sql-scripts/create-can-consume-function.sql`
- `sql-scripts/eol-remove-polls-created.sql` (nouveau)

### Tests
- `src/lib/__tests__/guestQuotaService.test.ts`
- `tests/e2e/quota-tracking-complete.spec.ts`
- `tests/e2e/products/cross-product/cross-product-workflow.spec.ts`
- `src/components/__tests__/GeminiChatInterface.test.tsx.skip`

### Scripts shell
- `scripts/view-quotas.ps1`
- `scripts/view-quotas.sh`

### Documentation
- `Docs/2. Planning - Decembre.md`
- `Docs/ARCHITECTURE/2025-12-04-QUOTA-SEPARATION-BY-PRODUCT.md`

## Notes importantes

1. **Pas de rétrocompatibilité** : Le champ `polls_created` n'existe plus dans la base de données
2. **Calcul à la volée** : Le total est toujours disponible via `calculateTotalPollsCreated()`
3. **Tests validés** : Tous les tests passent après la suppression
4. **Script SQL réversible** : Le script peut être inversé si nécessaire (mais non recommandé)

## Références

- Plan de séparation initial : `Docs/ARCHITECTURE/2025-12-04-QUOTA-SEPARATION-BY-PRODUCT.md`
- Plan EOL : `Docs/2. Planning - Decembre.md` (section EOL)
- Script SQL : `sql-scripts/eol-remove-polls-created.sql`
- Fonction utilitaire : `src/lib/quotaTracking.ts` (ligne 72-78)

## Conclusion

La suppression de `polls_created` a été complétée avec succès. Le système utilise maintenant uniquement les compteurs séparés par type de poll, et le total est calculé à la volée quand nécessaire. Cette simplification améliore la maintenabilité du code sans impact fonctionnel.

