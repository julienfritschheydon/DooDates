# DooDates — Intégration Calendrier: Synthèse & Décision

## Objectif
- Construire une intégration calendrier fiable, maintenable et scalable, sans réinventer la roue inutilement.
- Support prioritaire: Google Calendar (grand public), Microsoft 365/Outlook (entreprises), iCloud (optionnel selon demande).

## Options

### 1) Buy (agrégateur) — Cronofy / Merge.dev / Nylas
- __Avantages__
  - Multi-fournisseurs (Google, Microsoft, iCloud/Exchange) via une seule API.
  - Webhooks gérés, gestion des edge cases, conformité (DPA, régions UE), outils d’observabilité.
  - Time-to-market rapide, charge de maintenance réduite.
- __Inconvénients__
  - Coût par compte connecté/MAU et dépendance vendor.
  - Abstraction parfois moins fine pour des cas spécifiques.
- __Quand choisir__
  - Besoin cross-calendars dès le MVP et équipe réduite côté ops.
  - Exigence forte de fiabilité sans construire toute l’infra.

### 2) Build (direct) — Google Calendar + Microsoft Graph (plus tard iCloud)
- __Avantages__
  - Coûts variables faibles, contrôle complet, latence maîtrisée.
  - Excellente marge sur la fonctionnalité payante.
- __Inconvénients__
  - Implémenter/maintenir OAuth, webhooks (watch/subscriptions), delta sync, reconciliations, rate limits.
  - iCloud/CalDAV plus coûteux à faire proprement.
- __Quand choisir__
  - Priorité Google au MVP, capacité tech pour fiabiliser la sync, optimisation des coûts.

### 3) Hybrid (recommandé)
- __Principe__
  - Google en direct (80% des usages), Outlook/iCloud via un agrégateur.
- __Bénéfices__
  - Meilleur équilibre fiabilité/coûts/rapidité.
  - Possibilité de “reprendre” plus tard Outlook en direct si le volume le justifie.

## Fiabilité & Maintenance — Garde‑fous essentiels

- __Auth & tokens__
  - OAuth avec scopes minimaux, stockage chiffré (KMS/Secrets), rotation proactive des refresh tokens.
- __Webhooks__
  - Google: `watch` channels par calendrier (persist `channelId`, `resourceId`, `expiration`).
  - Microsoft Graph: `subscriptions` avec renouvellement avant TTL.
  - Validation des signatures, re‑subscription automatique, alerting avant expiration.
- __Sync incrémentale__
  - Google: `syncToken`. Graph: delta queries. Full resync contrôlé si token invalide.
  - Reconciliation périodique (6–12h) pour rattraper les pertes de webhooks.
- __Idempotence & ordre__
  - Clé idempotente `${provider}:${calendarId}:${eventId}:${etag|updated}`.
  - Sémaphore courte par ressource, retries avec backoff, DLQ.
- __Récurrences & fuseaux__
  - Utiliser les champs API (recurrence, timeZone). Éviter les expansions maison.
- __Rate limits__
  - File/worker (ex. BullMQ), quotas par user, backoff exponentiel.
- __Observabilité__
  - Logs structurés corrélés, métriques (webhooks reçus, expirations, erreurs, retries), alerting.
- __SLO cible__
  - Propagation P95 < 60s. Taux d’échec sync < 0.5%/mois par compte.

## Sécurité & Conformité (RGPD)
- Hébergement UE et DPA avec le vendor (si Buy/Hybrid), chiffrement au repos/en transit.
- Minimisation des données (libre/occupé si possible), purge complète à la révocation (“droit à l’oubli”).
- Gestion des secrets hors code, rotation périodique, journal d’accès.

## Coûts & Marges
- __Buy__: coût/compte connecté; fixer le prix Pro/Team pour conserver un multiple 2–3x au‑dessus du coût provider.
- __Build__: coûts initiaux (2–3 semaines pour Google E2E) + maintenance faible/continue; excellente marge.
- __Hybrid__: coût marginal agrégateur sur Outlook/iCloud, marge maximale sur Google direct.

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
- __Semaine 1–2__
  - Choix vendor (si Hybrid/Buy) après revue DPA/région/cout.
  - Implémentation `CalendarProvider` + OAuth + webhooks + stockage chiffré.
- __Semaine 3__
  - Delta sync + reconciliation + métriques/alerting. Tests d’échec (token expiré, webhook perdu, rate limits).
- __Semaine 4__
  - Mise en prod bêta: Google direct + Outlook/iCloud via agrégateur. Suivi SLO.

## Critères de décision
- __iCloud requis au MVP ?__ Oui → Buy/Hybrid. Non → Build Google d’abord.
- __Capacité ops faible ?__ Oui → Buy/Hybrid.
- __Contrainte coûts forte court terme ?__ Oui → Build Google.
- __Time-to-market critique ?__ Oui → Buy/Hybrid.

## Recommandation
- Adopter l’option __Hybrid__: Google direct dès le MVP (marge et contrôle), Outlook/iCloud via agrégateur (fiabilité/vitesse). Garder l’abstraction `CalendarProvider` pour pouvoir évoluer sans refonte.
