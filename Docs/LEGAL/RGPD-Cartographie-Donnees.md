# Cartographie des données – DooDates

> Version initiale – 08/12/2025
>
> Objectif : document interne de référence pour le bloc « Socle commun RGPD (tous produits) ».
>
> Produits couverts :
> - Produit 1 – Sondages de dates
> - Produit 2 – Formulaires / Form Polls
> - Produit 3 – Quizz
> - Produit 4 – Chat IA (Gemini)

---

## 1. Vue d’ensemble par type de données

| Type de donnée                      | Exemple                                    | Produits concernés                  | Localisation principale                           | Durée cible (à affiner)             | Finalités principales                                      |
|------------------------------------|--------------------------------------------|-------------------------------------|---------------------------------------------------|-------------------------------------|-----------------------------------------------------------|
| Identité légère                    | Nom / pseudo                               | Dates, Forms, Quizz, Chat IA        | Supabase (tables polls/réponses), localStorage    | 12 mois après fin d’usage du sondage/quizz/chat | Affichage des réponses, personnalisation minimale, suivi des participations |
| Coordonnées                        | Email (créateur / participant)             | Dates, Forms, Quizz, Support        | Supabase (profils, réponses), fournisseur email   | 24 mois après dernier contact actif | Contact, envoi de liens de sondage, reset compte, support |
| Données de réponse aux sondages   | Choix, texte libre, matrices, dates, scores| Dates, Forms, Quizz                 | Supabase (tables réponses), exports locaux        | 12 mois après clôture / dernière activité       | Analyse de résultats, exports, amélioration produit       |
| Données de disponibilité          | Dates choisies, créneaux horaires          | Sondages de dates, Availability     | Supabase (réponses), localStorage                 | 12 mois après date de l’événement   | Organisation d’événements, coordination                   |
| Données techniques client         | DeviceId/fingerprint, user-agent, IP (proxy)| Tous produits / quotas / sécurité  | Supabase (quotas, logs), localStorage             | 12 mois (logs) / 24 mois (quota anti-abus)      | Anti-abus, quotas invités, sécurité                          |
| Données IA (contenu chat)         | Messages, prompts, contexte sondage        | Chat IA, création/modification      | Fournisseur IA (Gemini), logs internes limités    | 12 mois max, voire moins si possible           | Assistance à la création, suggestions IA                  |
| Données analytics                 | Pages vues, funnels, conversions           | Tous produits                       | Outil analytics (Plausible/Posthog, etc.)         | 25 mois (fenêtre d’analyse standard)           | Amélioration UX, product analytics                         |
| Données support                   | Emails support, tickets, résumés IA        | Tous produits                       | Supabase (support_*), fournisseur email           | 24 mois après clôture du ticket               | Support client, diagnostic problèmes                      |

> Remarque : les durées sont des cibles raisonnables pour démarrer. Elles devront être confirmées et recoupées avec les besoins business et légaux avant mise en production.

---

## 2. Cartographie par produit

### 2.1 Produit 1 – Sondages de dates

**Données collectées (invités / votants)**
- Identité légère : nom ou pseudo (champ libre, souvent facultatif)
- Réponses au sondage : choix de dates, statuts (oui / non / peut-être), éventuellement créneaux horaires
- Métadonnées techniques : deviceId/fingerprint invité, timestamps de vote

**Créateur de sondage**
- Identité : email, nom / pseudo (via compte ou mode invité)
- Paramètres du sondage : titre, description, dates proposées, options d’affichage

**Stockage / flux**
- Front (navigateur) :
  - localStorage pour brouillons / préférences (ex : derniers sondages, deviceId)
- Backend / Base de données :
  - Supabase – tables `polls`, `poll_options`, `poll_votes`, éventuellement tables de quotas
- Exports :
  - CSV / PDF / autres formats générés côté client à partir des données de Supabase

**Risques principaux / points RGPD**
- Noms des participants visibles dans les résultats
- Conservation trop longue des réponses liées à un événement passé
- Corrélation potentielle via deviceId/fingerprint entre plusieurs sondages

---

### 2.2 Produit 2 – Formulaires / Form Polls

**Données collectées (répondants)**
- Identité légère : nom ou pseudo (champ « Votre nom »)
- Coordonnées facultatives : email (champ dédié si configuré)
- Réponses de formulaire :
  - textes libres (questions ouvertes)
  - choix uniques / multiples
  - matrices (lignes/colonnes, éventuels scores)
  - dates, NPS, rating, etc.
- Métadonnées : deviceId/fingerprint, date/heure de réponse

**Créateur de formulaire**
- Identité : compte Supabase (email, éventuellement nom)
- Contenu : structure des questions, règles conditionnelles, paramètres de visibilité des résultats

**Stockage / flux**
- Front :
  - localStorage pour brouillons de formulaire, état d’édition, éventuellement autosave des réponses invitées
- Backend :
  - Supabase – tables pour `polls`, `form_questions`, `form_responses` (structure exacte selon implémentation existante)
- Exports :
  - CSV, JSON, Markdown, PDF (exports déjà implémentés)

**Spécificités RGPD déjà en place**
- Notice RGPD concise avant le formulaire (texte explicite sur conservation / droits à finaliser dans la doc publique)
- Fonction d’anonymisation des réponses : suppression des noms/emails dans les réponses stockées + bouton créateur dans l’écran de résultats

**Risques principaux / points RGPD**
- Réponses libres pouvant contenir des données sensibles non prévues
- Couplage nom + email + contenu des réponses si conservation longue
- Exports envoyés par email ou stockés localement sans contrôle de durée

---

### 2.3 Produit 3 – Quizz

**Données collectées (participants)**
- Identité : pseudo ou nom saisi dans le champ « prénom de l'enfant » (`respondentName`),
  éventuellement email (`respondentEmail` – non encore utilisé dans l'UI mais prévu par le modèle)
- Réponses au quizz (structure `QuizzResponse`) :
  - identifiant de réponse (`id`)
  - identifiant du quizz (`pollId`)
  - réponses par question (`answers[]`) : `questionId`, `answer` (string / string[] / booléen),
    indicateur de correction (`isCorrect`), points obtenus (`points`)
  - score agrégé : total de points (`totalPoints`), points max (`maxPoints`), pourcentage (`percentage`)
  - métadonnées : `created_at` (horodatage ISO), `deviceId` (voir ci‑dessous)
- Historique enfant (`ChildHistory`, calculé à la volée) :
  - agrégats par `childName` (total de quiz, moyenne, meilleur score, streaks)
  - liste des badges obtenus (`badges[]`)
  - liste des réponses associées (`responses[]`)

**Métadonnées techniques**
- Identifiant de device (`deviceId`) : généré via `getDeviceId()` et stocké dans
  `localStorage["doodates_device_id"]` sous la forme `device_<timestamp>_<random>`.
  Utilisé pour :
  - distinguer les appareils / navigateurs,
  - éviter les collisions d'ID invités.

**Créateur de quizz**
- Identité : compte Supabase (email)
- Contenu : questions, réponses correctes, logique de score, paramètres d’affichage des scores

**Stockage / flux (implémentation actuelle MVP)**
- Front / navigateur uniquement (pas encore de persistance Supabase pour les quizz) :
  - `localStorage["doodates_quizz"]` : tableau de `Quizz` (structure complète du quizz :
    `id`, `creator_id`, `title`, `description`, `slug`, `settings`, `status`, `expires_at` (facultatif),
    `created_at`, `updated_at`, `creatorEmail` (facultatif), `questions[]`, `maxPoints`, `themeId`,
    `relatedConversationId`, `conversationId`, `resultsVisibility`).
  - `localStorage["doodates_quizz_responses"]` : tableau de `QuizzResponse` (voir ci‑dessus) pour
    tous les participants et tous les quizz.
  - `localStorage["doodates_device_id"]` : identifiant technique du navigateur (partagé avec
    d'autres modules qui réutilisent le même deviceId).

- Backend :
  - Pas de table quizz dédiée en base à ce stade : l'intégralité du stockage persistant se fait en
    localStorage côté navigateur (MVP / tests familiaux). La cartographie table Supabase pour quizz
    reste donc **prospective** (prévue pour une future version multi-appareils).

- Exports / Partages :
  - Partage de lien vers le quizz et vers la page de résultats (URL publique),
  - Statistiques et classements calculés côté client à partir de `doodates_quizz_responses`.

**Risques principaux / points RGPD**
- Scores associés à des pseudonymes identifiables ou à des emails (même si l'usage cible est
  familial, un pseudo peut identifier un enfant au sein d'un foyer ou d'une classe)
- Conservation potentiellement longue dans `localStorage` si aucun mécanisme de purge ou de
  reset n'est prévu côté créateur (classements et historiques de performances persistants sur
  l'appareil)
- Utilisation potentielle des scores et de l'historique (`ChildHistory`) pour du profilage
  (progression, badges, streaks) non documenté côté utilisateur final si la policy n'est pas à jour
- Nécessité de :
  - documenter clairement les données stockées (présent document + Policy publique Quizz),
  - prévoir un bouton de **reset/suppression des scores** (par enfant et/ou par quizz),
  - aligner la conservation sur la règle globale des **12 mois** pour les réponses aux quizz
    (cf. §6.1), avec anonymisation ou suppression au‑delà.

---

### 2.4 Produit 4 – Chat IA (Gemini)

**Données collectées**
- Contenu des messages utilisateur :
  - texte libre pouvant contenir noms, emails, numéros de téléphone, détails d’événements, etc.
- Contexte technique :
  - éventuel lien avec un sondage / formulaire en cours (ID de poll, structure des questions)
- Métadonnées : timestamps, deviceId/fingerprint, langue, type de poll associé

**Flux vers le fournisseur IA**
- Envoi des prompts vers Gemini (Google) via API, incluant :
  - message utilisateur
  - contexte de sondage (structure, extraits anonymisés autant que possible)

**Stockage / logs**
- Côté DooDates :
  - historique de conversation (selon implémentation actuelle) éventuellement stocké côté Supabase ou localStorage
- Côté fournisseur IA :
  - logs de requêtes selon politique du fournisseur (à documenter précisément dans la Policy)

**Risques principaux / points RGPD**
- Transmission de données personnelles et/ou sensibles au fournisseur IA
- Utilisation des données par le fournisseur à des fins d’entraînement (à désactiver si possible)
- Manque de transparence sans documentation claire dans la Politique de confidentialité

---

## 3. Synthèse par localisation technique

### 3.1 Navigateur (localStorage / sessionStorage)

- Brouillons de sondages et formulaires
- Identifiants techniques (deviceId/fingerprint simplifié)
- Préférences UI (thème, langue, derniers écrans)

**Risques** :
- Données qui persistent indéfiniment sur l’appareil si aucune politique de purge n’est implémentée
- Partage de machine (PC partagé) → exposition à des tiers

### 3.2 Supabase (Base de données principale)

- Polls / formulaires / quizz : structures et métadonnées
- Réponses : toutes les participations (dates, forms, quizz)
- Comptes utilisateurs : email, métadonnées de profil
- Quotas et fingerprints : tables `guest_quotas`, etc.
- Support : tickets, messages, résumés IA

**Risques** :
- Conservation trop longue si aucune durée de rétention globale n’est définie
- Agrégation d’informations permettant de profiler des utilisateurs au-delà du besoin

### 3.3 Fournisseurs externes

- **Email** : fournisseur SMTP / transactional pour envoi de liens, confirmations, support
- **IA (Gemini)** : traitement des messages de chat, prompts, résumés
- **Analytics** : mesure d’usage, conversion, funnels

**Risques** :
- Transferts hors UE (surtout IA / analytics)
- DPA manquants ou non archivés
- Utilisation secondaire des données par les fournisseurs (training, publicité)

---

## 4. Prochaines étapes pour le socle commun

1. Valider cette cartographie et la compléter au besoin (par ex. tables Supabase exactes, champs précis).
2. En déduire les **bases légales par finalité** (contrat / intérêt légitime / consentement) et les documenter.
3. Fixer les **durées de conservation** finales pour chaque catégorie et les implémenter (tâches cron / scripts de purge / anonymisation).
4. Mettre à jour la **Politique de confidentialité** publique avec :
   - les 4 produits,
   - l’usage de l’IA,
   - la liste des sous-traitants (Supabase, email, analytics, IA) et leurs DPA.
5. Définir et documenter le **processus d’export / suppression / anonymisation** pour répondre aux demandes des utilisateurs (outil interne / pages admin).

---

## 5. Bases légales par finalité (socle commun)

Ce tableau sert de référence commune pour les 4 produits et leurs futurs sites dédiés. Chaque site pourra en reprendre les éléments pertinents dans sa propre Politique de confidentialité.

| Finalité principale                                | Catégories de données clés                              | Produits concernés                   | Base légale principale                          | Commentaires |
|----------------------------------------------------|---------------------------------------------------------|--------------------------------------|--------------------------------------------------|-------------|
| Fonctionnement du service & gestion de compte      | Identité légère créateur, email, paramètres de sondage  | Tous (créateurs)                     | **Contrat** (exécution du service)              | Nécessaire pour créer, modifier, fermer des sondages/formulaires/quizz. |
| Participation à un sondage / formulaire / quizz    | Nom/pseudo, éventuellement email, réponses, scores      | Dates, Forms, Quizz                  | **Intérêt légitime** de l’organisateur          | Intérêt légitime à organiser un événement / collecter des réponses, avec information claire et possibilité de demander suppression/anonymisation. |
| Fonctionnement des quotas invités / anti-abus      | deviceId/fingerprint, compteurs, timestamps             | Tous produits (mode invité)          | **Intérêt légitime** (sécurité, lutte anti-abus)| Limiter le spam et les abus, équilibrer l’usage du service. |
| Analytics produit (mesure d’usage agrégée)         | Données analytics pseudonymisées/agrégées               | Tous produits                        | **Intérêt légitime** ou **consentement** selon l’outil | Objectif d’amélioration du produit ; à basculer vers consentement explicite si l’outil ou la granularité le requiert. |
| Assistance IA à la création / modification          | Messages chat IA, contexte de sondage                   | Produit 4 (Chat IA) + éditeurs IA    | **Contrat** / **intérêt légitime**             | L’IA est utilisée pour fournir la fonctionnalité demandée (aide à la création) ; nécessite transparence et possibilité d’usage sans IA pour certains cas. |
| Support client                                    | Emails, contenu des tickets, résumés IA                 | Tous produits                        | **Intérêt légitime** (support)                  | Traitements limités au diagnostic et à la résolution des problèmes. |
| Communication transactionnelle                     | Emails de confirmation, liens de sondage, notifications | Tous produits                        | **Contrat** / **intérêt légitime**             | Emails nécessaires au fonctionnement (lien d’accès, confirmations). |

### 5.1 Principes transverses

- **Minimisation** : chaque produit doit limiter les champs « obligatoires » au strict nécessaire pour la finalité (par exemple, nom facultatif quand c’est possible).
- **Transparence** : pour chaque site produit, la politique doit expliquer clairement quelles données sont collectées pour quelles finalités (en se basant sur la cartographie ci-dessus).
- **Choix utilisateur** :
  - possibilité de répondre de façon anonyme/pseudonyme lorsque c’est compatible avec la finalité ;
  - possibilité de demander export, anonymisation ou suppression de ses données (voir futur processus de droits).
- **Limitation des transferts** : les données envoyées à des fournisseurs (IA, analytics, email) doivent être limitées à ce qui est strictement nécessaire ; les DPA doivent couvrir ces traitements.

---
## 6. Durées de conservation (règles internes)

Les durées ci‑dessous prolongent le tableau du §1 et servent de base pour les futures politiques publiques des 4 sites produits.

### 6.1 Règles par catégorie de données

- **Réponses aux sondages / formulaires / quizz**
  - Conservation maximale recommandée : **12 mois** après clôture du sondage/quizz ou dernière activité significative.
  - Au‑delà :
    - soit anonymisation (suppression des identifiants directs : nom, email, deviceId si possible),
    - soit suppression complète des réponses si elles ne sont plus nécessaires.

- **Données de disponibilité (sondages de dates / availability)**
  - Conservation maximale recommandée : **12 mois** après la date de l’événement (ou la dernière date proposée).
  - Objectif : permettre le ré‑usage d’un modèle de sondage similaire à court terme, sans constituer un historique permanent des disponibilités.

- **Identité légère et coordonnées (créateurs / participants)**
  - Créateurs (comptes) : tant que le compte est actif + **24 mois** après dernière activité pour gestion de litiges et obligations légales potentielles.
  - Participants (emails collectés via formulaires) : **24 mois** après le dernier contact actif (par exemple, dernière participation à un sondage associé à cet organisateur).

- **Données techniques (deviceId / fingerprint / logs sécurité)**
  - Logs d’accès et de sécurité : **12 mois** maximum.
  - Quotas invités / fingerprints : **24 mois** maximum pour limiter les abus récurrents, puis suppression ou rotation.

- **Données IA (contenu chat Gemini)**
  - Historique de conversation côté DooDates : **12 mois** maximum, avec possibilité de purge anticipée par l’utilisateur.
  - Côté fournisseur IA : durée à aligner avec la configuration du compte (idéalement logs désactivés ou fortement limités) et à expliciter dans les futures policies.

- **Données analytics**
  - Fenêtre d’analyse standard : **25 mois** (conventionnelle pour les outils orientés RGPD friendly), en conservant uniquement des données agrégées/pseudonymisées.

- **Support client**
  - Tickets et échanges : **24 mois** après clôture du ticket.

### 6.2 Principes de mise en œuvre

- Mettre en place des **tâches planifiées** (scripts, Edge Functions, jobs Supabase) qui appliquent ces durées :
  - suppression / anonymisation des réponses expirées,
  - purge des logs et quotas obsolètes,
  - rotation éventuelle des identifiants techniques.
- Prévoir des **exceptions documentées** si une conservation plus longue est exigée (ex. obligations légales, litiges), en dehors du flux normal produit.

---
## 7. Processus d’export / suppression / anonymisation (droits des personnes)

Ce processus décrit le socle interne commun. Chaque produit/site devra exposer une version simplifiée de ces étapes dans sa propre Politique de confidentialité.

### 7.1 Identification de la personne concernée

- Point d’entrée recommandé : une adresse de contact dédiée (ex. `privacy@doodates.com`) ou un formulaire de contact.
- Données minimales à demander :
  - email utilisé dans l’application,
  - éventuellement liens de sondages concernés,
  - contexte (créateur vs répondant, produits utilisés).

### 7.2 Export de données

- Étapes internes :
  - rechercher toutes les données associées à l’email / identifiant (créateur + répondant),
  - agréger les informations par produit (Dates, Forms, Quizz, Chat IA),
  - générer un export structuré (JSON/CSV lisible) regroupant :
    - sondages/formulaires créés,
    - participations (réponses),
    - éventuelles conversations IA associées,
    - logs support pertinents.
- Renvoyer à la personne un export clair et compréhensible, sans exposer de données d’autres participants.

### 7.3 Suppression et anonymisation

- **Suppression** :
  - suppression des comptes et profils (si demandé),
  - suppression des participations identifiées,
  - purge des logs associés lorsque cela n’entre pas en conflit avec des obligations de sécurité ou légales.

- **Anonymisation** (quand la suppression complète casserait des statistiques utiles) :
  - suppression des identifiants directs (nom, email) dans les réponses,
  - conservation uniquement de données agrégées ou pseudonymisées,
  - alignement avec les mécanismes déjà existants (ex. anonymisation des réponses Form Polls côté stockage + bouton créateur dans l’UI).

### 7.4 Traçabilité

- Conserver une trace interne minimale des demandes traitées :
  - date de la demande,
  - type de demande (export, suppression, anonymisation),
  - produits impactés,
  - date de traitement.
- Aucun détail inutile sur le contenu des données supprimées/anonymisées ne doit être conservé.
