# DooDates — Intégration Calendrier: Synthèse & Décision

## Objectif

- Construire une intégration calendrier fiable, maintenable et scalable, sans réinventer la roue inutilement.
- Support prioritaire: Google Calendar (grand public), Microsoft 365/Outlook (entreprises), iCloud (optionnel selon demande).

## Options

### 1) Buy (agrégateur) — Cronofy / Merge.dev / Nylas

- **Avantages**
  - Multi-fournisseurs (Google, Microsoft, iCloud/Exchange) via une seule API.
  - Webhooks gérés, gestion des edge cases, conformité (DPA, régions UE), outils d’observabilité.
  - Time-to-market rapide, charge de maintenance réduite.
- **Inconvénients**
  - Coût par compte connecté/MAU et dépendance vendor.
  - Abstraction parfois moins fine pour des cas spécifiques.
- **Quand choisir**
  - Besoin cross-calendars dès le MVP et équipe réduite côté ops.
  - Exigence forte de fiabilité sans construire toute l’infra.

### 2) Build (direct) — Google Calendar + Microsoft Graph (plus tard iCloud)

- **Avantages**
  - Coûts variables faibles, contrôle complet, latence maîtrisée.
  - Excellente marge sur la fonctionnalité payante.
- **Inconvénients**
  - Implémenter/maintenir OAuth, webhooks (watch/subscriptions), delta sync, reconciliations, rate limits.
  - iCloud/CalDAV plus coûteux à faire proprement.
- **Quand choisir**
  - Priorité Google au MVP, capacité tech pour fiabiliser la sync, optimisation des coûts.

### 3) Hybrid (recommandé)

- **Principe**
  - Google en direct (80% des usages), Outlook/iCloud via un agrégateur.
- **Bénéfices**
  - Meilleur équilibre fiabilité/coûts/rapidité.
  - Possibilité de “reprendre” plus tard Outlook en direct si le volume le justifie.

## Fiabilité & Maintenance — Garde‑fous essentiels

- **Auth & tokens**
  - OAuth avec scopes minimaux, stockage chiffré (KMS/Secrets), rotation proactive des refresh tokens.
- **Webhooks**
  - Google: `watch` channels par calendrier (persist `channelId`, `resourceId`, `expiration`).
  - Microsoft Graph: `subscriptions` avec renouvellement avant TTL.
  - Validation des signatures, re‑subscription automatique, alerting avant expiration.
- **Sync incrémentale**
  - Google: `syncToken`. Graph: delta queries. Full resync contrôlé si token invalide.
  - Reconciliation périodique (6–12h) pour rattraper les pertes de webhooks.
- **Idempotence & ordre**
  - Clé idempotente `${provider}:${calendarId}:${eventId}:${etag|updated}`.
  - Sémaphore courte par ressource, retries avec backoff, DLQ.
- **Récurrences & fuseaux**
  - Utiliser les champs API (recurrence, timeZone). Éviter les expansions maison.
- **Rate limits**
  - File/worker (ex. BullMQ), quotas par user, backoff exponentiel.
- **Observabilité**
  - Logs structurés corrélés, métriques (webhooks reçus, expirations, erreurs, retries), alerting.
- **SLO cible**
  - Propagation P95 < 60s. Taux d’échec sync < 0.5%/mois par compte.

## Sécurité & Conformité (RGPD)

- Hébergement UE et DPA avec le vendor (si Buy/Hybrid), chiffrement au repos/en transit.
- Minimisation des données (libre/occupé si possible), purge complète à la révocation (“droit à l’oubli”).
- Gestion des secrets hors code, rotation périodique, journal d’accès.

## Coûts & Marges

- **Buy**: coût/compte connecté; fixer le prix Pro/Team pour conserver un multiple 2–3x au‑dessus du coût provider.
- **Build**: coûts initiaux (2–3 semaines pour Google E2E) + maintenance faible/continue; excellente marge.
- **Hybrid**: coût marginal agrégateur sur Outlook/iCloud, marge maximale sur Google direct.

## Interface d’abstraction (à implémenter)

- `CalendarProvider` (façade Node/TS recommandé):
  - `connect(userId): AuthUrl`
  - `handleOAuthCallback(payload): Connection`
  - `subscribe(connectionId, calendarId)` / `unsubscribe(...)`
  - `listAvailability(connectionId, timeRange)`
  - `listEvents(connectionId, cursor?) -> { events, nextCursor }`
  - `handleWebhook(event)`
- Permet d’échanger facilement le backend (agrégateur vs direct) sans impacter le code métier.

## Plan d’exécution proposé

- **Semaine 1–2**
  - Choix vendor (si Hybrid/Buy) après revue DPA/région/cout.
  - Implémentation `CalendarProvider` + OAuth + webhooks + stockage chiffré.
- **Semaine 3**
  - Delta sync + reconciliation + métriques/alerting. Tests d’échec (token expiré, webhook perdu, rate limits).
- **Semaine 4**
  - Mise en prod bêta: Google direct + Outlook/iCloud via agrégateur. Suivi SLO.

## Critères de décision

- **iCloud requis au MVP ?** Oui → Buy/Hybrid. Non → Build Google d’abord.
- **Capacité ops faible ?** Oui → Buy/Hybrid.
- **Contrainte coûts forte court terme ?** Oui → Build Google.
- **Time-to-market critique ?** Oui → Buy/Hybrid.

## Recommandation

- Adopter l'option **Hybrid**: Google direct dès le MVP (marge et contrôle), Outlook/iCloud via agrégateur (fiabilité/vitesse). Garder l'abstraction `CalendarProvider` pour pouvoir évoluer sans refonte.

## Statut d'implémentation

### ✅ Prototype Google Calendar terminé (Nov 2025)

- **Page de test** : `/calendar-prototype`
- **Service** : `src/lib/google-calendar.ts` - `GoogleCalendarService`
- **Fonctionnalités validées** :
  - ✅ OAuth Google avec Supabase (scopes `calendar.readonly` + `calendar`)
  - ✅ Lecture événements (`getEvents`)
  - ✅ Lecture créneaux libres/occupés (`getFreeBusy`)
  - ✅ Création événements (`createEvent`)
  - ✅ Callback OAuth (`/auth/callback`)
- **Configuration requise** :
  - Google Cloud Console : Client ID + Client Secret configurés dans Supabase
  - API Google Calendar activée dans Google Cloud Console
  - Utilisateurs test ajoutés dans OAuth consent screen (mode Test)
- **Prochaines étapes** : Intégration dans feature "Agenda Intelligent" (Sondage Inversé)
