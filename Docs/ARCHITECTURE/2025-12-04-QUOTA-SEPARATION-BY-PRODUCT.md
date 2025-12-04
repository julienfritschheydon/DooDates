# Séparation des Quotas par Produit

**Date :** 4 Décembre 2024  
**Statut :** ✅ Implémenté

## Vue d'ensemble

Ce document décrit l'architecture de la séparation complète des quotas de consommation par type de poll (date, form, quizz, availability). Chaque produit a maintenant son propre compteur et ses propres limites indépendantes.

## Objectifs

1. **Séparation complète** : Chaque type de poll a son propre compteur et sa propre limite
2. **Indépendance des produits** : Un utilisateur peut atteindre la limite d'un type sans affecter les autres
3. **Rétrocompatibilité** : `polls_created` est maintenu pour affichage uniquement (via trigger SQL)
4. **Validation stricte** : `pollType` est obligatoire et validé à chaque création

## Structure de la base de données

### Table `quota_tracking`

Colonnes ajoutées :
- `date_polls_created INTEGER DEFAULT 0 NOT NULL`
- `form_polls_created INTEGER DEFAULT 0 NOT NULL`
- `quizz_created INTEGER DEFAULT 0 NOT NULL`
- `availability_polls_created INTEGER DEFAULT 0 NOT NULL`
- `polls_created INTEGER DEFAULT 0 NOT NULL` (maintenu pour affichage, calculé via trigger)

### Table `guest_quotas`

Mêmes colonnes que `quota_tracking` pour les utilisateurs guests.

### Trigger SQL

Un trigger maintient automatiquement `polls_created` = somme des 4 compteurs :

```sql
CREATE TRIGGER sync_polls_created_trigger
  BEFORE INSERT OR UPDATE ON quota_tracking
  FOR EACH ROW
  WHEN (
    (OLD IS NULL) OR
    (NEW.date_polls_created IS DISTINCT FROM OLD.date_polls_created) OR
    (NEW.form_polls_created IS DISTINCT FROM OLD.form_polls_created) OR
    (NEW.quizz_created IS DISTINCT FROM OLD.quizz_created) OR
    (NEW.availability_polls_created IS DISTINCT FROM OLD.availability_polls_created)
  )
  EXECUTE FUNCTION sync_polls_created_from_separated_counters();
```

## Flux de consommation

### 1. Création d'un poll

```
pollStorage.ts
  ↓ Validation: poll.type doit être défini
  ↓
incrementPollCreated(userId, pollId, poll.type)
  ↓ Validation stricte: pollType obligatoire
  ↓
consumeCredits(userId, 1, "poll_created", { pollId, pollType })
```

### 2. Vérification des limites

**Utilisateurs authentifiés :**
- Edge Function extrait `pollType` depuis `metadata`
- Fonction SQL `consume_quota_credits` vérifie la limite par type
- Incrémente le compteur spécifique

**Utilisateurs guests :**
- `guestQuotaService.ts` vérifie la limite par type
- Incrémente le compteur spécifique dans localStorage/Supabase

### 3. Affichage Dashboard

- `useFreemiumQuota()` récupère les quotas
- Affiche `pollsCreated` (somme) + compteurs séparés si nécessaire

## Interfaces TypeScript

### QuotaConsumedData

```typescript
interface QuotaConsumedData {
  conversationsCreated: number;
  pollsCreated: number;  // Somme des 4 compteurs (affichage uniquement)
  datePollsCreated: number;
  formPollsCreated: number;
  quizzCreated: number;
  availabilityPollsCreated: number;
  aiMessages: number;
  analyticsQueries: number;
  simulations: number;
  totalCreditsConsumed: number;
  subscriptionStartDate?: string;
  lastResetDate?: string;
  userId: string;
}
```

### CreditJournalEntry

```typescript
interface CreditJournalEntry {
  id: string;
  action: CreditActionType;
  credits: number;
  total: number;
  userId: string;
  timestamp: string;
  metadata?: {
    pollId?: string;
    pollType?: "date" | "form" | "quizz" | "availability";  // Obligatoire pour poll_created
  };
}
```

## Validation stricte

### Dans incrementPollCreated

```typescript
export async function incrementPollCreated(
  userId: string | null | undefined,
  pollId: string | undefined,
  pollType: "date" | "form" | "quizz" | "availability",  // OBLIGATOIRE
): Promise<void> {
  if (!pollType || !["date", "form", "quizz", "availability"].includes(pollType)) {
    throw ErrorFactory.validation(
      `pollType is required and must be one of: "date", "form", "quizz", "availability"`,
      `Type de poll requis pour la consommation de quota`,
      { pollType, pollId, userId },
    );
  }
  
  await consumeCredits(userId, 1, "poll_created", { pollId, pollType });
}
```

## Limites par type

### Configuration actuelle (temporaire)

```typescript
export const POLL_TYPE_QUOTAS = {
  ANONYMOUS: {
    DATE_POLLS: 5,           // ⚠️ À définir dans planning décembre
    FORM_POLLS: 5,          // ⚠️ À définir dans planning décembre
    QUIZZ: 5,               // ⚠️ À définir dans planning décembre
    AVAILABILITY_POLLS: 5,  // ⚠️ À définir dans planning décembre
  },
  AUTHENTICATED: {
    DATE_POLLS: 50,         // ⚠️ À définir dans planning décembre
    FORM_POLLS: 50,         // ⚠️ À définir dans planning décembre
    QUIZZ: 50,              // ⚠️ À définir dans planning décembre
    AVAILABILITY_POLLS: 50, // ⚠️ À définir dans planning décembre
  },
} as const;
```

### Vérification des limites

**Important :** Les vérifications globales (`pollsCreated >= LIMIT`) ont été **supprimées**. Seules les vérifications par type sont effectuées.

## Migration des données

### Script SQL

`sql-scripts/migrate-quota-separation.sql` :
- Répartit `polls_created` existants selon le type depuis `doodates_polls`
- Fallback vers `date_polls_created` si type indéterminable
- Met à jour `polls_created` = somme des 4 compteurs

### Migration localStorage automatique

```typescript
// Migration automatique lors de la lecture
if (userData.datePollsCreated === undefined) userData.datePollsCreated = 0;
if (userData.formPollsCreated === undefined) userData.formPollsCreated = 0;
if (userData.quizzCreated === undefined) userData.quizzCreated = 0;
if (userData.availabilityPollsCreated === undefined) userData.availabilityPollsCreated = 0;
```

## Guide pour développeurs

### Consommer des crédits pour un poll

```typescript
import { incrementPollCreated } from '@/lib/quotaTracking';

// ✅ CORRECT
await incrementPollCreated(userId, pollId, 'date');

// ❌ INCORRECT - pollType manquant
await incrementPollCreated(userId, pollId); // Erreur de validation
```

### Vérifier les limites

```typescript
import { canConsumeCredits } from '@/lib/quotaTracking';

const canCreate = await canConsumeCredits(userId, 1, 'poll_created', {
  pollType: 'date'  // Obligatoire
});

if (!canCreate.allowed) {
  console.error(canCreate.reason); // "date poll limit reached (5)"
}
```

### Lire les quotas

```typescript
import { getQuotaConsumed } from '@/lib/quotaTracking';

const quota = await getQuotaConsumed(userId);

console.log(quota.datePollsCreated);      // 3
console.log(quota.formPollsCreated);      // 2
console.log(quota.quizzCreated);          // 1
console.log(quota.availabilityPollsCreated); // 0
console.log(quota.pollsCreated);          // 6 (somme, pour affichage)
```

## EOL (End of Life) - Planifié

### Janvier 2025

L'ancienne expérience où les produits partageaient un quota global `polls_created` sera complètement supprimée :

1. Suppression de la colonne `polls_created` dans `quota_tracking` et `guest_quotas`
2. Suppression du trigger `sync_polls_created_trigger`
3. Suppression de la fonction `sync_polls_created_from_separated_counters`
4. Nettoyage des interfaces TypeScript (retirer `pollsCreated`)
5. Mise à jour de la documentation

Voir `Docs/2. Planning - Decembre.md` (section EOL) pour plus de détails.

## Fichiers concernés

### Base de données
- `sql-scripts/create-quota-tracking-table.sql`
- `sql-scripts/create-guest-quotas-table.sql`
- `sql-scripts/migrate-quota-separation.sql`

### Code TypeScript
- `src/lib/quotaTracking.ts`
- `src/lib/pollStorage.ts`
- `src/lib/guestQuotaService.ts`
- `supabase/functions/quota-tracking/index.ts`

### Hooks et UI
- `src/hooks/useFreemiumQuota.ts`
- `src/hooks/useQuota.ts`
- `src/components/ui/QuotaIndicator.tsx`
- `src/constants/quotas.ts`

### Scripts et monitoring
- `sql-scripts/view-user-quotas.sql`
- `sql-scripts/monitor-guest-quotas.sql`
- `scripts/view-quotas.ps1`
- `scripts/view-quotas.sh`

### Tests
- `tests/e2e/quota-tracking-complete.spec.ts`
- `tests/load/quota-tracking-load-test.js`

## Références

- Plan de séparation : `Docs/plan_quotas_separation_reste_a_faire.md`
- Plan EOL : `Docs/2. Planning - Decembre.md` (section EOL)
- Script de migration : `sql-scripts/migrate-quota-separation.sql`
- Constantes : `src/constants/quotas.ts`
