# Support Client 100% Email – Architecture + IA

## 1. Objectifs et contraintes

- **Canal unique** : support 100% par email (`support@doodates.com`).
- **Volume cible** : ~100 emails / semaine au lancement.
- **Pas d’outil externe** : pas de Help Scout / Zendesk etc.
- **Multi‑langue** : FR/EN/DE (extensible) dès le départ.
- **Intégration forte au produit** :
  - Stockage dans Supabase (tickets, messages, métadonnées IA).
  - IA pilotée via l’infra existante (SecureGeminiService + quotas).
  - Possibilité future d’analyse de bugs et de génération de PR.

---

## 2. Architecture globale du support par email

### 2.1. Flux général

1. L’utilisateur envoie un mail à `support@doodates.com`.
2. Le mail est reçu par la boîte (Gmail/Workspace ou équivalent).
3. Un **ingesteur d’emails** (Webhook ou tâche IMAP) appelle une **Edge Function `support-email-ingest`**.
4. L’Edge Function :
   - Normalise le contenu (texte, HTML, suppression de signatures/citations).
   - Enregistre le message dans `support_messages`.
   - Crée ou met à jour un `support_ticket`.
   - Appelle le **SupportAssistantService** (IA) pour classification + résumé.
   - Génère une **auto‑réponse** adaptée à la langue et au type de demande.
5. La réponse automatique est envoyée via SMTP (ou API mail) au client.
6. Plus tard, tu traites les tickets via une **UI interne** et/ou ton client email classique.

### 2.2. Ingestion des emails

Deux options (peuvent coexister, avec une préférence long terme pour le Webhook) :

- **Webhook (recommandé)**
  - Fournisseur email → HTTP POST vers `support-email-ingest` pour chaque message.
  - Payload standardisé : `from`, `to`, `subject`, `text`, `html`, `messageId`, `inReplyTo`, `references`, `date`, `attachments`.

- **Polling IMAP (MVP possible)**
  - Tâche planifiée (cron / Supabase Edge Scheduler / script Node) toutes les X minutes.
  - Lit la boîte IMAP, récupère les nouveaux mails non traités.
  - Appelle `support-email-ingest` avec le même payload.

---

## 3. Design base de données (Supabase)

### 3.1. Table `support_tickets`

But : représenter un thread de support (un ou plusieurs emails autour d’un même sujet).

Champs proposés :

- `id` (uuid, PK)
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, mise à jour à chaque nouveau message)
- `status` (enum: `open`, `pending`, `closed`)
- `language` (text: `fr`, `en`, `de`, `unknown`)
- `topic` (text/enum: `bug`, `billing`, `product-question`, `feedback`, `feature-request`, `other`)
- `severity` (text/enum: `low`, `normal`, `high`, `critical`)
- `user_id` (uuid, nullable) – lien éventuel avec un compte DooDates
- `external_email` (text) – email de l’expéditeur si pas de compte
- `first_message_preview` (text) – début du premier message (pour la liste)
- `last_message_preview` (text) – aperçu du dernier message
- `last_activity_at` (timestamp)
- `ai_summary` (text, résumé global du ticket)
- `ai_metadata` (jsonb, détails de classification IA, scores de confiance, etc.)

### 3.2. Table `support_messages`

But : stocker chaque message entrant ou sortant.

Champs proposés :

- `id` (uuid, PK)
- `created_at` (timestamp, default now())
- `ticket_id` (uuid, FK → `support_tickets.id`)
- `direction` (enum: `inbound`, `outbound`)
- `from_email` (text)
- `to_email` (text)
- `subject` (text)
- `body_text` (text)
- `body_html` (text, nullable)
- `raw_headers` (text/jsonb, optionnel)
- `language` (text)
- `message_id` (text, identifiant SMTP)
- `in_reply_to` (text, nullable)
- `ai_summary` (text, résumé du message par IA)
- `ai_metadata` (jsonb, intents détectés, scores, etc.)

### 3.3. Table optionnelle `support_auto_replies`

But : tracer précisément ce qui a été envoyé automatiquement par l’IA.

- `id` (uuid)
- `ticket_id` (uuid)
- `message_id` (uuid, FK → `support_messages.id`)
- `type` (enum: `ack`, `auto-answer`)
- `language` (text)
- `model` (text – modèle IA utilisé)
- `prompt` (text) – prompt complet ou hash
- `response_text` (text)
- `created_at` (timestamp)

---

## 4. Design Edge Function `support-email-ingest`

### 4.1. Endpoint et sécurité

- Nom Edge Function : `support-email-ingest`.
- Méthode : `POST`.
- Authentification :
  - Secret partagé dans l’en‑tête (ex. `x-support-signature` HMAC).
  - Vérification du domaine expéditeur autorisé.

### 4.2. Payload attendu

Exemple JSON :

```json
{
  "from": "user@example.com",
  "to": "support@doodates.com",
  "subject": "Problème avec un sondage",
  "text": "Bonjour, j’ai un bug...",
  "html": "<p>Bonjour...</p>",
  "messageId": "<abc123@example.com>",
  "inReplyTo": "<prev123@example.com>",
  "references": ["<prev123@example.com>"],
  "date": "2025-12-08T13:00:00Z",
  "attachments": []
}
```

### 4.3. Logique principale

1. **Valider la signature / origine.**
2. **Nettoyer le texte** :
   - Supprimer signatures évidentes.
   - Supprimer citations longues (`"> ..."`).
3. **Détecter la langue** (lib simple ou IA légère).
4. **Trouver ou créer un ticket** :
   - Si `inReplyTo` ou `references` pointent vers un message déjà connu → rattacher au ticket existant.
   - Sinon → créer un nouveau `support_ticket`.
5. **Créer le `support_message` inbound`.**
6. **Appeler `SupportAssistantService.classifyMessage`** pour :
   - `topic`, `severity`, `language` (confirmée), éventuels `intents`.
7. **Mettre à jour le ticket** avec ces infos (topic, severity, ai_metadata, last_activity_at, previews).
8. **Appeler `SupportAssistantService.summarizeMessage`** pour stocker un résumé.
9. **Générer et envoyer une auto‑réponse** via `SupportAssistantService.generateAutoAck`.
10. **Créer le `support_message` outbound` lié à l’auto‑réponse.**

### 4.4. Gestion d’erreurs

- En cas d’erreur IA ou DB, log via système d’erreurs existant (ErrorFactory + logError si utilisé côté Edge).
- Toujours retourner un `200` au provider email si possible (pour éviter les renvois en boucle), mais marquer le ticket comme `status = open` + `ai_metadata.error = true`.

---

## 5. Design du service IA `SupportAssistantService`

### 5.1. Rôle général

Service backend (TypeScript) encapsulant les appels à l’IA via `SecureGeminiService` / Edge `quota-tracking` pour :

- Classification des messages.
- Résumés courts.
- Suggestion de réponses adaptées.
- (Plus tard) Analyse de bugs et proposition de correctifs.

### 5.2. Interface proposée (TypeScript – pseudo)

```ts
interface SupportMessageInput {
  subject: string;
  body: string;
  languageHint?: string;
  userContext?: {
    userId?: string;
    plan?: string;
    locale?: string;
  };
}

interface ClassificationResult {
  language: string;
  topic: "bug" | "billing" | "product-question" | "feedback" | "feature-request" | "other";
  severity: "low" | "normal" | "high" | "critical";
  intents: string[]; // ex: ["lost-link", "export-question"]
  confidence: number; // 0–1
}

interface SummaryResult {
  summary: string;
}

interface SuggestedReplyResult {
  replyText: string;
  language: string;
  references?: { title: string; url: string }[];
  confidence: number;
}

export const SupportAssistantService = {
  classifyMessage(input: SupportMessageInput): Promise<ClassificationResult>,
  summarizeMessage(input: SupportMessageInput): Promise<SummaryResult>,
  suggestReply(input: SupportMessageInput & { ticketContext?: any }): Promise<SuggestedReplyResult>,
  generateAutoAck(input: SupportMessageInput & { classification: ClassificationResult }): Promise<SuggestedReplyResult>
};
```

### 5.3. Prompts de base (FR/EN, multi‑langue)

Les prompts sont envoyés au modèle via `SecureGeminiService`, en incluant :

- Le texte de l’email.
- Le contexte produit (résumé de DooDates, liens doc internes).
- La langue cible.

#### 5.3.1. Prompt – Classification

**Instruction (système)** :

> Tu es un routeur de tickets de support pour une application web nommée DooDates. Tu dois analyser le sujet et le corps d’un email utilisateur et renvoyer une classification structurée en JSON. Ne réponds jamais avec du texte libre, uniquement du JSON valide.

**Variables fournies** : `subject`, `body`, contexte produit.

**Format de sortie attendu** :

```json
{
  "language": "fr",
  "topic": "bug",
  "severity": "high",
  "intents": ["calendar-selection", "link-does-not-work"],
  "confidence": 0.92
}
```

#### 5.3.2. Prompt – Résumé

**Instruction (système)** :

> Résume cet email utilisateur en 2–3 phrases maximum, dans la langue d’origine du message. Le résumé doit être factuel, sans interprétation ni solution.

**Sortie** :

```json
{ "summary": "..." }
```

#### 5.3.3. Prompt – Suggestion de réponse

**Instruction (système)** :

> Tu es l’assistant support de DooDates. Rédige une réponse email courte, claire et empathique, dans la même langue que l’email utilisateur. Propose des étapes concrètes, et références un ou deux liens de documentation si pertinent. Ne donne jamais d’informations techniques internes (stack, secrets). Ne promets jamais de délais irréalistes.

**Variables** :

- `email_original` (texte nettoyé)
- `classification` (JSON précédent)
- `doc_links` (liens vers FAQ/Guides adaptés au topic)

**Sortie attendue** :

```json
{
  "replyText": "...",
  "language": "fr",
  "references": [{ "title": "Créer un sondage de dates", "url": "https://doodates.com/docs/..." }],
  "confidence": 0.88
}
```

#### 5.3.4. Prompt – Auto‑ack

Variante de `suggestReply` avec un cadre plus strict :

> Rédige uniquement un accusé de réception poli, rassurant et très court. Mentionne un délai de réponse générique (moins de 24h ouvrées) et un lien vers la base de connaissances. Ne propose pas de solution détaillée.

---

## 6. Templates d’emails (FR / EN)

### 6.1. Auto‑ack – Français

**Sujet** : "[DooDates] Nous avons bien reçu votre message"

Corps (variable `{{firstNameOrFallback}}`, `{{helpCenterUrl}}`):

> Bonjour {{firstNameOrFallback}},
>
> Merci pour votre message, nous l’avons bien reçu.
>
> Nous revenons vers vous dans un délai maximum de 24h ouvrées. En attendant, vous pouvez consulter notre centre d’aide ici :
>
> {{helpCenterUrl}}
>
> Si votre demande concerne un sondage ou un formulaire spécifique, vous pouvez répondre à cet email en ajoutant le lien complet du sondage.
>
> — Julien, créateur de DooDates

### 6.2. Auto‑ack – Anglais

**Subject**: "[DooDates] We’ve received your message"

Body:

> Hi {{firstNameOrFallback}},
>
> Thanks for reaching out – we’ve received your message.
>
> We’ll get back to you within 24 business hours. In the meantime, you can check our Help Center here:
>
> {{helpCenterUrl}}
>
> If your question is about a specific poll or form, you can reply to this email and include the full link.
>
> — Julien, creator of DooDates

### 6.3. Réponse type – Bug simple (FR)

**Sujet** : "[DooDates] Bug sur votre sondage – nous investiguons"

Corps :

> Bonjour {{firstNameOrFallback}},
>
> Merci pour votre message et les détails fournis.
>
> Nous avons bien identifié un comportement anormal sur {{shortFeatureName}} et nous sommes en train de l’analyser. Dans l’intervalle, vous pouvez essayer la solution suivante :
>
> 1. {{step1}}
> 2. {{step2}}
>
> Si le problème persiste, n’hésitez pas à répondre à cet email en nous indiquant :
>
> - le lien du sondage concerné
> - le navigateur utilisé
> - si possible, une capture d’écran.
>
> Merci encore d’avoir pris le temps de nous remonter ce bug,
>
> — Julien

### 6.4. Réponse type – Question produit (EN)

**Subject**: "[DooDates] About your question on {{feature}}"

Body:

> Hi {{firstNameOrFallback}},
>
> Thanks for your question about {{feature}}.
>
> Here’s how it works in DooDates:
>
> 1. {{step1}}
> 2. {{step2}}
>
> You can also find more details in our guide here:
>
> {{docUrl}}
>
> If anything is unclear or if you have a specific use case in mind, feel free to reply to this email with an example and I’ll be happy to help.
>
> — Julien

---

## 7. Étude – IA pour analyse de bugs et génération automatique de PR

### 7.1. Objectif

Évaluer dans quelle mesure l’IA peut :

1. Analyser automatiquement un ticket de support marqué comme "bug".
2. Aller lire le code correspondant dans le repo DooDates.
3. Proposer une analyse de cause racine.
4. Suggérer un patch (diff) et éventuellement ouvrir une Pull Request.

### 7.2. Chaîne technique envisagée

1. **Déclenchement**
   - Ticket `topic = bug` + `severity >= high`.
   - Ou déclenchement manuel depuis une interface interne : bouton "Analyser avec l’IA".

2. **Collecte de contexte**
   - Ticket + tous les `support_messages` associés.
   - Logs éventuels (Playwright, Supabase, logs internes).
   - Version de l’app (commit hash déployé, si suivi disponible).

3. **Étape 1 – Analyse de bug par IA**
   - Service dédié `BugAnalysisService` (peut réutiliser SecureGeminiService).
   - Prompt orienté :

> Voici un rapport utilisateur (email) et des extraits de logs. Tu dois :
>
> 1. Résumer le bug observé.
> 2. Formuler des hypothèses de cause technique.
> 3. Lister les fichiers du projet qui sont probablement concernés.

- Sortie :

```json
{
  "summary": "...",
  "possible_causes": ["..."],
  "suspected_files": ["src/components/...", "src/hooks/..."]
}
```

4. **Étape 2 – Lecture ciblée du code**
   - Un agent (script) lit les fichiers `suspected_files` dans le repo (lecture seule).
   - On renvoie ces extraits de code au modèle avec un prompt :

> Voici le code actuel et la description du bug. Propose un diagnostic plus précis et une stratégie de correction.

5. **Étape 3 – Proposition de patch**
   - Deux options :
     - a) **Diff textuel** (patch git) que tu appliques manuellement après revue.
     - b) **Branch + PR** générée par un outil externe (GitHub CLI avec IA, plus tard).

   - Sortie souhaitée :

```json
{
  "diagnosis": "...",
  "proposed_changes": [
    {
      "file": "src/components/TopNav.tsx",
      "diff": "@@ ..."
    }
  ],
  "risk_level": "medium",
  "tests_to_run": ["npm run test:unit", "npx playwright test --grep '@smoke'"]
}
```

6. **Étape 4 – Validation humaine obligatoire**
   - Aucun commit ou PR auto sans validation.
   - Intégration dans ton flux habituel (VS Code / Cursor) : l’IA propose un patch, tu l’appliques ou non.

### 7.3. Faisabilité et limites

- **Faisable aujourd’hui** :
  - Résumer les bugs à partir des emails.
  - Pointer vers des fichiers probables (surtout si les tests/logs donnent des indices).
  - Proposer des patches "raisonnables" pour une partie des bugs (surtout les erreurs évidentes).

- **Limites** :
  - Contexte de code limité par la taille du prompt (même avec contextes compressés).
  - Risque de corrections partielles ou naïves qui cassent des invariants métier.
  - Bugs complexes impliquant l’architecture globale, la perf, l’UI fine, difficiles à corriger sans compréhension profonde.

- **Positionnement recommandé** :
  - Utiliser l’IA comme **assistant de diagnostic et de patch**, pas comme auteur autonome de PR.
  - Garde-fous :
    - Obligation de tests verts avant merge.
    - Revue manuelle systématique.

### 7.4. Plan d’expérimentation progressif

1. **Phase 1 – Diagnostic uniquement**
   - L’IA produit : résumé du bug, hypothèses, fichiers probables, liste de tests à lancer.
   - Tu restes responsable du patch.

2. **Phase 2 – Patches suggérés (sans PR)**
   - L’IA génère des diffs sur quelques fichiers ciblés.
   - Tu appliques manuellement les patchs dans l’IDE après revue.

3. **Phase 3 – Intégration CI/CD (PR assistées)**
   - Scripts qui prennent les diffs approuvés et ouvrent une PR automatiquement (via GitHub CLI).
   - Toujours avec validation manuelle avant merge.

---

## 8. Résumé et prochaines étapes

- **Support email** : design complet côté DB, Edge Function, IA, templates multi‑langues.
- **Service IA** : `SupportAssistantService` centralise classification, résumés, auto‑acks, suggestions de réponses.
- **Étude bugfix IA** : faisable de manière assistée, avec étapes progressives et validation humaine.

### Prochaines actions possibles dans le code DooDates

1. Créer les tables `support_tickets` et `support_messages` dans Supabase (SQL + migrations).
2. Créer l’Edge Function `support-email-ingest` avec payload typé et validation.
3. Implémenter le squelette de `SupportAssistantService` en réutilisant `SecureGeminiService`.
4. Ajouter une page interne `/admin/support` (même très simple) pour lister les tickets.
5. Expérimenter un petit POC "Analyse de bug" sur un ticket réel pour valider la chaîne IA → diagnostic.
