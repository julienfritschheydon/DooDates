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
| `polls_created` | `integer` | Compteur courant |
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
| 2 | Service fingerprint + tests unitaires | 0,5 h | `src/lib/browserFingerprint.ts`, tests | ✅ Fait (fallback SHA-256 + cache unifié) |
| 3 | Schéma Supabase (SQL + RLS) + RPC reset admin | 0,5 h | SQL migrations, doc | En cours (à définir) |
| 4 | Implémentation `GuestQuotaService` (fetch, increment, sync + queue offline) | 1 h | Service + tests mock Supabase | À faire |
| 5 | Intégration `useGuestQuota` dans les surfaces critiques (GeminiChat, modales auth) + flag `__IS_E2E__` | 1 h | Hook mis à jour, fallback E2E, UI épurée (pas de bannière dashboard) | En cours (GeminiChat nettoyé, bannière dashboard retirée) |
| 6 | Tests end-to-end quotas invités + documentation (Architecture, Planning, Tests Guide) | 1 h | Suites Playwright actualisées, docs synchronisées | À faire |
| **Total ~3,0 h** |  |  |  |  |

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

---
**Références**
- Docs/2. Planning.md – Section quotas (rationales historiques).
- Docs/TESTS/-Tests-Guide.md – Section tests quotas et intégration.
- Discussions 12/11/2025 – Décisions collisions, reset admin, absence de TTL.
