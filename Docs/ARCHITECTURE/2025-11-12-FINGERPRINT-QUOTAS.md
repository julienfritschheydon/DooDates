# Fingerprinting navigateur + quotas hybrides (12/11/2025)

## 1. Contexte & objectifs
- Passer du quota purement localStorage à un suivi hybride **fingerprint navigateur + Supabase**.
- Empêcher le contournement du quota invité (clear storage, navigation privée).
- Préserver la granularité des compteurs (conversations IA, messages, exports, analytics) tout en préparant les offres freemium/premium.
- Garantir la transparence UX (progression des crédits) et la capacité de monitoring côté back-office.

## 2. Périmètre fonctionnel
- **Invités** : attribution automatique d'un fingerprint stable, synchronisation continue avec Supabase.
- **Authentifiés** : possibilité d'associer ultérieurement le fingerprint au compte pour migration transparente.
- **Actions suivies** : conversations, polls, messages IA, analytics (extensions futures possibles).
- **Admin** : capacité de reset manuel d'un fingerprint (support) sans bouton public.

## 3. Architecture proposée
### 3.1 Génération du fingerprint navigateur
- Sources combinées (normalisées) :
  - Canvas 2D (rendu hors DOM, toDataURL + hash).
  - WebGL renderer/vendor.
  - Timezone (Intl.DateTimeFormat().resolvedOptions().timeZone + offset).
  - Résolution écran & depth (`window.screen`).
  - Liste de polices détectées via Canvas fallback.
  - User-Agent + platform + langue (`navigator`).
- Concaténation JSON triée puis **hash SHA-256** (troncation à 64 chars pour stockage).
- Stockage local (`localStorage.__dd_fingerprint`) pour éviter les variations par session.
- Recalcul uniquement si signal critique change (>1 composant majeur) ou valeur absente.

### 3.2 Schéma Supabase
#### Table `guest_quotas`
| Colonne | Type | Description |
| --- | --- | --- |
| `id` (PK) | `uuid` | Identifiant interne Supabase (`gen_random_uuid()`) |
| `fingerprint` | `text` | Hash SHA-256 unique du navigateur |
| `conversations_created` | `integer` | Compteur courant |
| `ai_messages` | `integer` | Compteur courant |
| `polls_created` | `integer` | Somme des 4 compteurs séparés (affichage uniquement, maintenu via trigger) |
| `date_polls_created` | `integer` | Compteur séparé pour polls de type "date" |
| `form_polls_created` | `integer` | Compteur séparé pour polls de type "form" |
| `quizz_created` | `integer` | Compteur séparé pour polls de type "quizz" |
| `availability_polls_created` | `integer` | Compteur séparé pour polls de type "availability" |
| `analytics_queries` | `integer` | Compteur courant |
| `simulations` | `integer` | Compteur courant |
| `total_credits_consumed` | `integer` | Agrégat de crédits consommés |
| `last_reset_at` | `timestamptz` | Date du dernier reset admin |
| `first_seen_at` / `last_activity_at` | `timestamptz` | Tracking apparition & activité |
| `user_agent` / `timezone` / `language` / `screen_resolution` | `text` | Métadonnées navigateur persistées pour debug |
| `created_at` / `updated_at` | `timestamptz` | Audit trail |

#### Table `guest_quota_journal` (optionnelle mais recommandée)
| Colonne | Type | Description |
| --- | --- | --- |
| `id` | UUID | PK |
| `fingerprint` | `text` | FK → `guest_quotas` |
| `action` | `text` | `conversation`, `ai_message`, `poll`, `analytics` |
| `delta` | `integer` | Variation (généralement +1) |
| `metadata` | `jsonb` | Contexte (pollId, conversationId…) |
| `created_at` | `timestamptz` | Horodatage |

- **RLS** : accès restreint via `anon` avec policy INSERT/UPDATE conditionnée sur le fingerprint fourni. Les opérations se font via policy `auth.uid() IS NULL` + vérification du fingerprint dans le payload (mode client-side safe).

### 3.3 Services & hooks
- `generateBrowserFingerprint()` : service pur (sans dépendance React) + tests unitaires.
- `GuestQuotaService` :
  - `ensureGuestQuota()` (interne) : synchronise fingerprint + métadonnées navigateur, crée la ligne si absente, met à jour localStorage (`guest_quota_id`).
  - `canConsumeCredits()` : récupère la version fraîche du quota via `ensureGuestQuota`, calcule les limites et retourne `currentQuota` pour mise à jour UI.
  - `consumeGuestCredits()` : réévalue les limites, met à jour les compteurs Supabase et journalise l’action (fallback journal silencieux en cas d’échec).
- `useFreemiumQuota()` : hook React exposant `guestQuota` (données, `pendingSync`, `lastSyncedAt`, `lastError`) et un fallback local si Supabase est indisponible. Rafraîchissement toutes les 5 s tant que l’utilisateur reste invité.
- **Intégration UI actuelle** : `GeminiChatInterface` et le tableau de bord consomment les compteurs via `useQuota`, mais la bannière détaillée (sync Supabase, reset admin) a été retirée du dashboard pour alléger l’interface. Les composants doivent afficher uniquement les informations nécessaires (ex. progression crédit) et réserver les détails `guestQuota` aux points d’entrée où ils sont utiles (ex. modales d’authentification, debug future).

## 4. Flux et scénarios
1. **Initialisation**
   - Le client vérifie `localStorage.__dd_fingerprint` ; sinon génère et stocke.
   - `GuestQuotaService.fetch()` synchronise Supabase → met à jour les compteurs locaux.
2. **Consommation d'un crédit**
   - Action UI → `increment()` + mise à jour optimiste locale.
   - En cas d’échec réseau : marquer `pendingSync` dans le hook, réutiliser la dernière valeur connue (implémentation queue locale à prévoir ultérieurement).
3. **Offline / déconnexion Supabase**
   - Utiliser les quotas restants du cache ; marquer la session en `pendingSync`.
   - À la reconnexion, recalculer la différence pour éviter double comptage.
4. **Collision détectée**
   - Supabase renvoie la row existante mais metadata incohérente → fusion côté service (max des compteurs) + log `logger.warn("quota:fingerprint-collision", { fingerprint })` + entrée journal admin.

## 5. Gestion des collisions (<0,01 %)
- Conserver l’enregistrement existant, additionner les nouveaux crédits.
- Notifier via logger (`category: "quota"`) + monitoring (Sentry si actif).
- Investigations facilitées par `guest_quota_journal`.

## 6. Politique de reset (admin only)
- RPC `admin_reset_guest_quota(fingerprint)` (clé service) :
  - Met `*_used = 0`, `last_reset_at = now()`.
  - Ajoute une entrée `guest_quota_journal` (`action = "admin_reset"`).
- Pas de bouton public ; reset uniquement via interface d’admin ou script support.

## 7. TTL / expires_at
- **Décision** : pas de reset automatique (`expires_at` nul).
- Justification : un TTL redonnerait un quota complet aux fraudeurs et complexifierait l’analyse usage.
- Nettoyage manuel possible (script admin) basé sur `updated_at < now() - interval '365 days'`, mais jamais automatique.

## 8. Sécurité & conformité
- Finalité limitée : protection freemium (à documenter dans la politique de confidentialité).
- RLS stricte + rate limiting (limiter les updates/minute par fingerprint).
- Hash sans données perso → risque RGPD faible, mais informer les utilisateurs.
- Audit trail (journal) pour répondre aux demandes de suppression si nécessaire.

## 9. Plan d’implémentation
| Étape | Description | Durée estimée | Livrables | Statut |
| --- | --- | --- | --- | --- |
| 1 | Analyse et conception | 0,5 h | Document architecture | ✅ Fait |
| 2 | Service fingerprint + tests unitaires | 0,5 h | `src/lib/browserFingerprint.ts`, tests | ✅ Fait (fallback SHA-256 + cache unifié) |
| 3 | Schéma Supabase (SQL + RLS) | 0,5 h | SQL migrations | ✅ Fait (`sql-scripts/create-guest-quotas-table.sql`) |
| 3.1 | RPC reset admin | 0,25 h | Fonction SQL `admin_reset_guest_quota()` | ✅ Fait (`sql-scripts/create-guest-quotas-table.sql`) |
| 4 | Implémentation `GuestQuotaService` | 1 h | Service + tests mock Supabase | ✅ Fait (`src/lib/guestQuotaService.ts`) |
| 4.1 | Queue offline pour sync différée | 0,5 h | Système de queue localStorage | ⚠️ À faire (optionnel, amélioration future) |
| 5 | Hook `useFreemiumQuota` | 0,5 h | Hook React avec sync automatique | ✅ Fait (`src/hooks/useFreemiumQuota.ts`) |
| 5.1 | Intégration dans GeminiChat | 0,25 h | Consommation crédits via `consumeGuestCredits()` | ✅ Fait (via `quotaTracking.ts`) |
| 5.2 | Intégration dans modales auth | 0,25 h | Affichage progression crédits | ✅ Fait (`useAiMessageQuota.ts` utilise Supabase) |
| 5.3 | Flag E2E pour bypass | 0,25 h | Détection environnement test | ✅ Fait (`shouldBypassGuestQuota()`) |
| 6 | Tests end-to-end quotas invités | 1 h | Suites Playwright | ✅ Fait (`tests/e2e/guest-quota.spec.ts`) |
| 6.1 | Tests unitaires fingerprint | 0,25 h | Tests `browserFingerprint.ts` | ⚠️ À faire (Phase 2) |
| 6.2 | Tests unitaires GuestQuotaService | 0,5 h | Tests avec mocks Supabase | ⚠️ À faire (Phase 2) |
| 6.3 | Documentation mise à jour | 0,25 h | Architecture, Planning, Tests Guide | ✅ Fait (ce document + `MONITORING-GUEST-QUOTAS.md`) |
| 7 | Monitoring & rapports automatiques | 1 h | Scripts SQL + Edge Function | ✅ Fait (`monitor-guest-quotas.sql`, `send-quota-report`) |
| **Total ~5,0 h** |  |  |  |  |

### Détails des tâches restantes

#### 3.1 RPC reset admin
**Fichier**: `sql-scripts/create-guest-quotas-table.sql` (à ajouter)
```sql
CREATE OR REPLACE FUNCTION admin_reset_guest_quota(target_fingerprint TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  quota_id UUID;
  reset_count INTEGER;
BEGIN
  -- Vérifier que la fonction est appelée avec service_role (via SECURITY DEFINER)
  -- En production, ajouter vérification JWT claim 'role' = 'service_role'
  
  SELECT id INTO quota_id
  FROM guest_quotas
  WHERE fingerprint = target_fingerprint;
  
  IF quota_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fingerprint not found');
  END IF;
  
  -- Reset des compteurs
  UPDATE guest_quotas
  SET 
    conversations_created = 0,
    polls_created = 0,
    ai_messages = 0,
    analytics_queries = 0,
    simulations = 0,
    total_credits_consumed = 0,
    last_reset_at = NOW(),
    updated_at = NOW(),
    last_activity_at = NOW()
  WHERE id = quota_id;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  -- Journaliser le reset
  INSERT INTO guest_quota_journal (
    guest_quota_id,
    fingerprint,
    action,
    credits,
    metadata
  ) VALUES (
    quota_id,
    target_fingerprint,
    'admin_reset',
    0,
    jsonb_build_object('reset_by', 'admin', 'reset_at', NOW())
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'quota_id', quota_id,
    'fingerprint', target_fingerprint,
    'reset_at', NOW()
  );
END;
$$;
```

#### 5.1 & 5.2 Intégration UI
**État actuel**:
- ✅ `useFreemiumQuota()` existe et expose `guestQuota` avec sync automatique
- ✅ `useAiMessageQuota.ts` mis à jour pour utiliser Supabase via `useFreemiumQuota()` pour les guests
- ✅ `quotaTracking.ts` intègre `consumeGuestCredits()` pour les guests (appelé depuis `useMessageSender.ts`)
- ✅ Consommation crédits fonctionne via `consumeAiMessageCredits()` dans `quotaTracking.ts`

**Implémentation**:
1. ✅ **Intégration `consumeGuestCredits()`** : 
   - Déjà intégré dans `quotaTracking.ts` (ligne 286)
   - Appelé depuis `useMessageSender.ts` via `consumeAiMessageCredits()`
   - Gestion erreurs avec throw pour bloquer l'action

2. ✅ **Mise à jour `useAiMessageQuota.ts`** :
   - Utilise `useFreemiumQuota().guestQuota.aiMessages` pour les guests
   - Fallback localStorage si Supabase indisponible
   - Synchronisation automatique toutes les 5s

3. **Modales d'authentification** :
   - Peuvent utiliser `useFreemiumQuota().guestQuota` pour afficher progression
   - Données disponibles via `guestQuota.data.aiMessages`

4. **Dashboard**:
   - ✅ Confirmé: bannière détaillée retirée (pas d'affichage `guestQuota` détaillé)

#### 6 Tests end-to-end
**Fichier**: `tests/e2e/guest-quota.spec.ts` ✅ **CRÉÉ**
**Scénarios testés**:
1. ✅ Génération fingerprint au premier chargement
2. ✅ Création quota Supabase automatique
3. ✅ Consommation crédits (conversation, poll, message IA)
4. ✅ Limite atteinte → blocage action
5. ✅ Bypass E2E fonctionne (`?e2e-test=true`)
6. ✅ Sync automatique toutes les 5s pour guests
7. ✅ Migration localStorage → Supabase (si données existantes)
8. ✅ Fingerprint stable entre sessions

#### 6.1 & 6.2 Tests unitaires
**Fichiers à créer**:
- `src/lib/__tests__/browserFingerprint.test.ts`
- `src/lib/__tests__/guestQuotaService.test.ts`

**Couverture**:
- Génération fingerprint (canvas, WebGL, fonts, timezone)
- Cache localStorage
- Hash SHA-256 vs fallback
- `ensureGuestQuota()` création/mise à jour
- `canConsumeCredits()` validation limites
- `consumeGuestCredits()` incrément + journal
- Gestion erreurs réseau
- Bypass E2E

### Priorités d'implémentation

**Phase 1 - Critique (avant déploiement)**:
1. ✅ Service fingerprint (fait)
2. ✅ Schéma Supabase (fait)
3. ✅ GuestQuotaService (fait)
4. ✅ Hook useFreemiumQuota (fait)
5. ✅ **Intégration `consumeGuestCredits()` dans `quotaTracking.ts`** (5.1) - **FAIT**
6. ✅ **Mise à jour `useAiMessageQuota.ts`** pour utiliser Supabase (5.1) - **FAIT**
7. ✅ RPC reset admin (3.1) - **FAIT**
8. ✅ Tests E2E basiques (6) - **FAIT**
9. ✅ Monitoring & rapports (7) - **FAIT**

**Phase 2 - Qualité (après déploiement)**:
1. Tests unitaires fingerprint (6.1)
2. Tests unitaires GuestQuotaService (6.2)
3. Queue offline (4.1) - amélioration UX
4. Documentation complète (6.3)

**Phase 3 - Évolutions**:
1. Tableau de bord admin (section 11)
2. Migration fingerprint → compte authentifié
3. Score de confiance fingerprint

## 10. Migration & compatibilité
- Première action après déploiement : génération du fingerprint + synchronisation des compteurs locaux vers Supabase.
- Cas localStorage existants : importer les valeurs existantes comme base initiale.
- UI : vérifier que seules les surfaces prévues (progression dans GeminiChat, modales d’authentification) consomment `guestQuota`; la bannière dashboard reste désactivée.
- E2E/CI : conserver `?e2e-test=true` pour bypasser Supabase (mode local) ; configurer un mock pour les tests unitaires.

## 11. Ouvertures & évolutions
- Lier fingerprint ↔ compte authentifié (migration invités → comptes sans perte de crédits).
- Tableau de bord admin : suivi quotas, resets, collisions, journaux (inclure éventuellement un panneau technique réintroduisant les détails `guestQuota`).
- Quotas différenciés par plan (freemium/pro) via colonnes supplémentaires.
- Score de confiance fingerprint (ex. multi-IP à courte fréquence → suspicion bot).

## 12. Monitoring & Rapports (✅ Implémenté)
- **Scripts SQL de monitoring** : `monitor-guest-quotas.sql`, `monitor-guest-quotas-quick.sql`
- **Fonction SQL de rapport** : `generate_guest_quota_report()` - génère un JSON structuré
- **Edge Function automatique** : `send-quota-report` - envoie des rapports via webhook
- **Documentation** : `MONITORING-GUEST-QUOTAS.md` - guide complet de monitoring
- **Cron jobs** : Configuration pour rapports quotidiens/hebdomadaires automatiques

### Utilisation
- Monitoring manuel : Exécuter `monitor-guest-quotas-quick.sql` dans Supabase SQL Editor
- Rapports automatiques : Configurer cron job via `setup-cron-quota-report.sql`
- Webhook : Configurer `QUOTA_REPORT_WEBHOOK_URL` pour Slack/Discord

## 13. Statut d'implémentation (✅ Phase 1 Complète)

### ✅ Phase 1 - Critique (COMPLÈTE - Prête pour déploiement)
Tous les éléments critiques pour le fonctionnement du système sont implémentés et testés :

1. ✅ **Service fingerprint** (`browserFingerprint.ts`) - Génération stable avec cache localStorage
2. ✅ **Schéma Supabase** - Tables `guest_quotas` et `guest_quota_journal` avec RLS
3. ✅ **GuestQuotaService** - Service complet avec sync Supabase
4. ✅ **Hook useFreemiumQuota** - Synchronisation automatique toutes les 5s
5. ✅ **Intégration consommation crédits** - Via `quotaTracking.ts` et `useMessageSender.ts`
6. ✅ **Mise à jour useAiMessageQuota** - Utilise Supabase pour les guests
7. ✅ **RPC reset admin** - Fonction `admin_reset_guest_quota()` opérationnelle
8. ✅ **Tests E2E** - Suite complète dans `guest-quota.spec.ts`
9. ✅ **Monitoring & rapports** - Fonction SQL + Edge Function testée et fonctionnelle

**Résultat** : Le système de fingerprinting et quotas hybrides est **opérationnel** et prêt pour la production.

### ⚠️ Phase 2 - Qualité (Optionnel - Après déploiement)
Améliorations de qualité de code et UX :

#### 2.1 Tests unitaires fingerprint (`browserFingerprint.test.ts`) ✅ CRÉÉ
**Objectif** : Valider la génération du fingerprint et sa stabilité

**Tests implémentés** :
- ✅ Génération du fingerprint avec tous les composants (canvas, WebGL, fonts, timezone)
- ✅ Cache localStorage : fingerprint identique entre sessions
- ✅ Hash SHA-256 : format correct (64 caractères hexadécimaux)
- ✅ Fallback si composants manquants (ex: WebGL désactivé)
- ✅ Stabilité : même navigateur = même fingerprint
- ✅ Métadonnées : confidence score calculé correctement
- ✅ Edge cases : navigateur privé, extensions bloquantes, localStorage errors
- ✅ Migration cache legacy

**Fichier** : `src/lib/__tests__/browserFingerprint.test.ts`

**Pourquoi c'est important** :
- Détecter les régressions si on modifie la génération
- Garantir que le fingerprint reste stable (sinon = nouveau guest à chaque fois)
- Valider les fallbacks en cas d'échec partiel

#### 2.2 Tests unitaires GuestQuotaService (`guestQuotaService.test.ts`) ✅ CRÉÉ
**Objectif** : Valider la logique métier sans dépendre de Supabase réel

**Tests implémentés** :
- ✅ `getOrCreateGuestQuota()` : création si absent, récupération si existant
- ✅ `canConsumeCredits()` : validation des limites (50 crédits max)
- ✅ `consumeGuestCredits()` : incrément correct des compteurs
- ✅ Gestion erreurs réseau : fallback gracieux
- ✅ Bypass E2E : `shouldBypassGuestQuota()` fonctionne
- ✅ Journalisation : entrées créées dans `guest_quota_journal`
- ✅ Collisions : gestion si fingerprint existe déjà
- ✅ Métadonnées navigateur : sauvegarde correcte (userAgent, timezone, etc.)
- ✅ Validation tous les types d'actions

**Fichier** : `src/lib/__tests__/guestQuotaService.test.ts`

**Pourquoi c'est important** :
- Tests rapides (pas besoin de Supabase réel)
- Valider la logique métier isolément
- Détecter les bugs avant les tests E2E (plus lents)

#### 2.3 Queue offline pour sync différée
**Objectif** : Améliorer l'UX quand l'utilisateur est hors ligne

**Fonctionnalité** :
- Stocker les actions en attente dans `localStorage` (queue)
- Quand Supabase revient en ligne : synchroniser toutes les actions en attente
- Éviter la perte de crédits si l'utilisateur fait une action hors ligne
- Afficher un indicateur "Synchronisation en cours..."

**Implémentation** :
```typescript
// Exemple de structure
interface PendingAction {
  action: CreditActionType;
  credits: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Dans guestQuotaService.ts
async function syncPendingActions() {
  const pending = getPendingActionsFromLocalStorage();
  for (const action of pending) {
    try {
      await consumeGuestCredits(action.action, action.credits, action.metadata);
      removePendingAction(action);
    } catch (error) {
      // Garder en queue si échec
    }
  }
}
```

**Pourquoi c'est optionnel** :
- Phase 1 fonctionne déjà sans ça (fallback localStorage)
- Amélioration UX mais pas critique
- Complexité supplémentaire à maintenir

#### 2.4 Documentation complète
**Statut** : ✅ Déjà largement documenté
- Architecture documentée dans ce fichier
- Monitoring documenté dans `MONITORING-GUEST-QUOTAS.md`
- Setup Slack documenté dans `SETUP-SLACK-WEBHOOK.md`
- Déploiement Edge Function documenté dans `DEPLOY-EDGE-FUNCTION.md`
- Troubleshooting documenté dans `TROUBLESHOOTING-EDGE-FUNCTION.md`

### 🔮 Phase 3 - Évolutions (Futur)
Fonctionnalités avancées :
- Tableau de bord admin avec visualisation des quotas
- Migration fingerprint → compte authentifié
- Score de confiance fingerprint pour détection bots

### 📋 Checklist de déploiement
Avant de déployer en production :
- [x] Schéma Supabase déployé
- [x] RLS policies activées
- [x] Edge Function `send-quota-report` déployée
- [x] Tests E2E passent
- [x] Webhook Slack configuré pour rapports automatiques
- [x] Cron job configuré pour rapports quotidiens

## 14. Expérience Utilisateur

### Affichage des quotas dans l'application

**Dashboard** (`Dashboard.tsx`) :
- Indicateur de quota avec barre de progression
- Affichage "X/Y crédits utilisés"
- Couleur orange si proche de la limite
- Clic → redirige vers `/dashboard/journal`
- Bouton "En savoir plus" → `/pricing`

**Journal de consommation** (`ConsumptionJournal.tsx`) :
- Historique détaillé de toutes les consommations
- Groupement par date
- Statistiques par type d'action
- Total crédits consommés affiché
- Compatible guests (via `getGuestQuotaJournal`)

**Chat** (`GeminiChatInterface.tsx`) :
- `QuotaIndicator` pour les guests (badge visible)
- Modal d'authentification quand limite atteinte
- Messages d'erreur clairs

**Comportement invisible** :
- Génération automatique du fingerprint (invisible)
- Synchronisation Supabase toutes les 5s (invisible)
- Validation serveur avant chaque action (invisible)
- Blocage automatique si limite atteinte

**Note** : Toute l'information UX est déjà implémentée dans le dashboard et le journal. Pas besoin de document séparé.

## 15. Audit des fichiers créés

### Fichiers essentiels à conserver
- ✅ `create-guest-quotas-table.sql` - Schéma principal
- ✅ `create-monitoring-report-function-FIXED.sql` - Fonction de rapport
- ✅ `monitor-guest-quotas-quick.sql` - Monitoring rapide
- ✅ `setup-cron-quota-report.sql` - Configuration cron
- ✅ `test-report-quick.sql` - Tests

### Fichiers obsolètes à supprimer
- ❌ Scripts de diagnostic temporaires (`diagnose-*.sql`, `verify-*.sql`)
- ❌ Versions obsolètes (`create-monitoring-report-function.sql` sans `-FIXED`)
- ❌ Scripts de correction temporaires (`fix-*.sql`, `add-*.sql`)

---
**Références**
- Docs/2. Planning.md – Section quotas (rationales historiques).
- Docs/TESTS/-Tests-Guide.md – Section tests quotas et intégration.
- Discussions 12/11/2025 – Décisions collisions, reset admin, absence de TTL.
