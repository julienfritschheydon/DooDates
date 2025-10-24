# DooDates — Flux « Sans compte » avec Owner Token

## Objectif
Permettre de créer et gérer un sondage sans compte utilisateur, via un jeton propriétaire (ownerToken) généré à la création. Option de lier plus tard le sondage à un compte (claim).

## Modèle de données (Poll)
- `ownerToken: string | null` — jeton opaque propriétaire (local dev: stocké en clair; serveur: stocker uniquement un hash).
- `ownerUserId: string | null` — ID de l’utilisateur si le sondage a été « réclamé » et associé.
- Autres champs: `id`, `slug`, `title`, `type`, `status`, `created_at`, `updated_at`, etc.

## Génération du token
- Aléatoire cryptographique 128 bits min. Encodage `base64url` ou hex (sans caractères ambigus).
- Exemple (client): `crypto.getRandomValues(new Uint8Array(16))` → encoder.
- Jamais dérivé d’un ID; ne pas le logguer.

## Liens
- Lien public (vote): `/poll/:slug`
- Lien gestion (owner): `/poll/:slug/manage?owner=<ownerToken>`
- Lien résultats (owner): `/poll/:slug/results?owner=<ownerToken>`
- Conseillé: UI affiche distinctement « Lien public » et « Lien gestion (privé) ».

## Règles d’accès (guard)
Pseudocode `useOwnerGuard(poll)`:
- Si `poll.ownerUserId` et `user?.id === poll.ownerUserId` → accès OK.
- Sinon, si `url.owner` présent ET `url.owner === poll.ownerToken` → accès OK.
- Sinon → accès refusé (rediriger/afficher message).

Pages protégées (owner-only):
- `/poll/:slug/results` (résultats détaillés + export CSV)
- `/poll/:slug/manage` (édition, archiver, supprimer, dupliquer)
- Actions `PollActions` sensibles (Exporter, Supprimer, Archiver) doivent vérifier le guard.

## Claim « Associer à mon compte »
- Condition d’affichage: utilisateur authentifié ET accès actuel via ownerToken (poll non encore associé).
- Action:
  1) `poll.ownerUserId = user.id`
  2) Rotation/invalidation: `poll.ownerToken = null` (MVP) 
  3) Sauvegarde. Informer l’utilisateur: « L’ancien lien de gestion n’est plus valide ».
- Après claim: l’accès owner repose sur la session utilisateur.

## Sécurité
- Token opaque long et imprévisible.
- Ne pas indexer/partager publiquement les liens owner; éviter d’inclure ces URLs dans des logs/analytics.
- Après claim, invalider l’ancien token pour supprimer les accès diffusés.
- Côté serveur (plus tard): stocker uniquement `owner_token_hash` (HMAC/SHA-256) et vérifier via hash constant-time.

## UX / UI
- Création: générer et persister `ownerToken`.
  - Afficher 2 CTAs: « Copier lien public » et « Copier lien gestion (privé) ».
- Dashboard: actions sensibles (Exporter, Supprimer, Archiver) passent par le guard.
- Results/Manage: si accès via token et `user` connecté → bouton « Associer à mon compte ».
- États d’erreur: si guard KO → message court + lien vers le vote public.

## Cas limites
- Fuite du lien owner: toute personne avec le token peut gérer; recommander le claim pour sécuriser.
- Perte du token sans compte: pas de récupération (communiquer clairement dès la création).
- Multi-appareils: le lien owner reste la clé jusqu’au claim.

## Tests
- Unit
  - Guard: combinaisons `ownerUserId`/`user.id`/`ownerToken` → autorisé/refusé.
  - Claim: après association, `ownerToken` devient `null`; ancien lien refusé.
- E2E
  - Création sans compte → accès manage via `?owner=...`.
  - Bouton « Associer à mon compte » visible si connecté, puis accès owner sans token.

## Plan d’implémentation (client dev local)
- `src/lib/pollStorage.ts`
  - Étendre type `Poll` avec `ownerToken`, `ownerUserId`.
  - Générer `ownerToken` à la création et le persister.
- `src/hooks/useOwnerGuard.ts` (nouveau)
  - Exposer `canManage`, `reason`, et un helper pour lire le token d’URL.
- Pages
  - `src/pages/Results.tsx` et/ ou `src/pages/Manage.tsx` : intégrer le guard + CTA « Associer à mon compte ».
- Composants
  - `src/components/polls/PollActions.tsx` : vérifier le guard avant actions sensibles.
- Option serveur ultérieure (Supabase)
  - Colonnes: `owner_user_id`, `owner_token_hash`.
  - API: routes owner-only acceptant `?owner=` (en clair → hash en DB) ou session propriétaire.

## Notes d’évolution
- URL signées temporaires (serveur) si on veut éviter `?owner=` permanent.
- Récupération en cas de perte possible uniquement après association compte (support).
