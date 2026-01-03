# Liste Complète des Actions Consommant des Crédits

**Dernière mise à jour** : 2 novembre 2025

## 📊 Vue d'Ensemble

Tous les crédits consommés sont **irréversibles** (sauf reset mensuel pour utilisateurs authentifiés). Même si l'utilisateur supprime ses conversations/polls, les crédits restent consommés.

---

## ✅ Actions Consommant des Crédits

### 1. **Création de Conversation**

- **Coût** : 1 crédit
- **Appels Gemini** : 0 (pas d'appel API)
- **Tokens** : 0 (action locale uniquement)
- **Où** : Lors de la création d'une nouvelle conversation
- **Fichiers** :
  - `src/hooks/useConversations.ts` (lignes 421, 442)
  - `src/hooks/useAutoSave.ts` (lignes 129, 146, 159)
- **Fonction** : `incrementConversationCreated()`
- **Note** :
  - ❌ **Pas d'appel Gemini** : La création de conversation est purement locale (localStorage/Supabase)
  - ❌ **Génération de titre locale** : Le titre est généré localement via regex/patterns, pas avec Gemini
  - ⚠️ **Crédit consommé pour tracking** : Le crédit est comptabilisé mais aucun appel API n'est fait
  - ✅ **L'appel Gemini se fait plus tard** : Quand l'utilisateur envoie son premier message via `useMessageSender.sendMessage()`

### 2. **Création de Poll/Sondage**

- **Coût** : 1 crédit
- **Appels Gemini** : 0 (pas d'appel API)
- **Tokens** : 0 (action locale uniquement)
- **Où** : Lors de la création d'un nouveau poll
- **Fichiers** :
  - `src/lib/pollStorage.ts` (ligne 393)
- **Fonction** : `incrementPollCreated(userId, pollId, pollType)`
- **Note** :
  - Uniquement pour les **nouveaux** polls, pas les mises à jour
  - Crédit consommé pour tracking, mais pas d'appel API Gemini
  - **Séparation par type** : Chaque type de poll (date, form, quizz, availability) a son propre compteur et sa propre limite
  - **pollType obligatoire** : Le type de poll doit être fourni et validé
  - Voir `Docs/ARCHITECTURE/2025-12-04-QUOTA-SEPARATION-BY-PRODUCT.md` pour plus de détails

### 3. **Message IA (Chat Gemini)**

- **Coût** : 1 crédit
- **Appels Gemini** : 1 appel API (`model.generateContent`)
- **Tokens** : ~650 tokens en moyenne (500 input + 150 output)
- **Où** : Chaque fois qu'un message est envoyé à l'IA Gemini
- **Fichiers** :
  - `src/hooks/useMessageSender.ts` (ligne 236) → `useGeminiAPI.ts` → `gemini.ts` (ligne 372)
- **Fonction** : `consumeAiMessageCredits()`
- **Note** :
  - ✅ **Reconnaissance vocale** : La reconnaissance vocale elle-même **NE consomme PAS** de crédits (elle utilise l'API Web Speech du navigateur, gratuite)
  - ⚠️ **Les crédits sont consommés** quand le texte transcrit est envoyé à Gemini via `secureGeminiService.generateContent()`
  - Donc : Parler → Transcription (gratuit) → Envoi à Gemini (1 crédit, 1 appel API, ~650 tokens)

### 4. **Query Analytics IA**

- **Coût** : 1 crédit
- **Appels Gemini** : 1 appel API (`model.generateContent`)
- **Tokens** : ~650 tokens en moyenne (500 input + 150 output)
- **Où** : Chaque fois qu'une question analytique est posée à l'IA sur les résultats d'un poll
- **Fichiers** :
  - `src/services/PollAnalyticsService.ts` (ligne 265 : `this.model.generateContent(prompt)`)
- **Fonction** : `consumeAnalyticsCredits()`
- **Exemple** : "Quel est le taux de réponse ?", "Quelles sont les tendances ?"
- **Note** :
  - Les queries sont mises en cache. Si la même question est posée deux fois, seul le premier appel consomme des crédits.
  - Le prompt inclut le contexte complet du poll (questions + réponses)

### 5. **Insights Auto-générés**

- **Coût** : 1 crédit
- **Appels Gemini** : 1 appel API (`model.generateContent`)
- **Tokens** : ~650 tokens en moyenne (500 input + 150 output)
- **Où** : Lors de la génération automatique d'insights pour un poll
- **Fichiers** :
  - `src/services/PollAnalyticsService.ts` (ligne 381 : `this.model.generateContent(prompt)`)
- **Fonction** : `consumeAnalyticsCredits()`
- **Note** :
  - Génère 3-5 insights automatiques (tendances, anomalies, recommandations) en un seul appel
  - Le prompt inclut le contexte complet du poll (questions + réponses)

### 6. **Simulation Complète**

- **Coût** : 5 crédits
- **Appels Gemini** : Variable (seulement si `useGemini=true` et questions type="text")
  - Si 10 questions texte × 10 personas = jusqu'à 100 appels potentiels
  - En pratique : beaucoup moins car seules les questions texte utilisent Gemini
- **Tokens** : ~3250 tokens en moyenne (5 crédits × 650 tokens)
- **Où** : Lors du lancement d'une simulation complète de réponses
- **Fichiers** :
  - `src/hooks/useSimulation.ts` (ligne 102)
  - `src/lib/simulation/SimulationService.ts` (ligne 274 : `generateTextResponseWithGemini`)
- **Fonction** : `consumeSimulationCredits()`
- **Note** :
  - Une simulation complète génère plusieurs réponses simulées pour un poll
  - Seules les questions de type "text" utilisent Gemini (les autres sont générées localement)
  - Le coût de 5 crédits est une estimation moyenne pour une simulation typique

---

## ❌ Actions NE Consommant PAS de Crédits

### Reconnaissance Vocale (Web Speech API)

- **Gratuit** : Utilise l'API native du navigateur
- **Où** : `src/hooks/useVoiceRecognition.ts`
- **Note** : Seulement la transcription est gratuite. Les crédits sont consommés quand le texte est envoyé à Gemini (voir "Message IA" ci-dessus)

### Actions Locales

- Lecture/affichage des conversations existantes
- Modification de polls existants (sans création)
- Navigation dans l'interface
- Sauvegarde locale (localStorage)
- Export de données

### Actions Sans IA

- Création de réponses manuelles aux polls
- Visualisation des résultats
- Partage de liens
- Gestion des paramètres utilisateur

---

## 📈 Coûts par Type d'Action (selon la documentation)

| Action                | Coût      | Appels Gemini | Tokens | Fichier de tracking |
| --------------------- | --------- | ------------- | ------ | ------------------- |
| 1 conversation créée  | 1 crédit  | 0             | 0      | `quotaTracking.ts`  |
| 1 poll créé           | 1 crédit  | 0             | 0      | `quotaTracking.ts`  |
| 1 message chat IA     | 1 crédit  | 1             | ~650   | `quotaTracking.ts`  |
| 1 query analytics IA  | 1 crédit  | 1             | ~650   | `quotaTracking.ts`  |
| 1 insight auto-généré | 1 crédit  | 1             | ~650   | `quotaTracking.ts`  |
| 1 simulation complète | 5 crédits | Variable\*    | ~3250  | `quotaTracking.ts`  |

\* Variable selon nombre de questions texte et personas (seules les questions texte utilisent Gemini)

**Source** : `Docs/9-Pricing.md` (lignes 54-59)

---

## 🔍 Détails Techniques

### Système de Tracking

- **Fichier principal** : `src/lib/quotaTracking.ts`
- **Journalisation** : Toutes les consommations sont enregistrées dans un journal
- **Fonction de journal** : `getConsumptionJournal()` pour récupérer l'historique

### Types d'Actions Trackées

```typescript
type CreditActionType =
  | "conversation_created" // 1 crédit
  | "poll_created" // 1 crédit
  | "ai_message" // 1 crédit
  | "analytics_query" // 1 crédit
  | "simulation" // 5 crédits
  | "other"; // Personnalisé
```

### Reset Mensuel

- **Utilisateurs authentifiés** : Reset automatique basé sur la date d'abonnement
- **Utilisateurs invités** : Pas de reset (lifetime)
- **Calcul** : Basé sur `subscription_expires_at` ou `created_at` du profil

---

## 🎯 Points d'Attention

### Reconnaissance Vocale

⚠️ **Important** : La reconnaissance vocale facilite l'envoi de messages, ce qui peut augmenter la consommation de crédits indirectement, mais elle ne consomme pas de crédits elle-même.

### Simulations

⚠️ **Coût élevé** : Les simulations coûtent 5 crédits car elles génèrent de nombreuses réponses simulées en utilisant l'IA.

### Analytics

⚠️ **Cache** : Les queries analytics sont mises en cache. Si la même question est posée deux fois, seul le premier appel consomme des crédits.

---

## ⚠️ Appels Gemini Non Utilisés Actuellement

Les fonctions suivantes appellent Gemini mais ne sont **pas utilisées** dans le code actuel :

### `chatAboutPoll` (gemini.ts ligne 476)

- **Statut** : ❌ Non utilisé (fonction définie mais jamais appelée)
- **Usage prévu** : Chat contextuel sur un poll existant
- **Appels Gemini** : 1 appel API (si utilisé)
- **Tokens** : ~650 tokens estimés

### `generateEnhancedPoll` (enhanced-gemini.ts ligne 177)

- **Statut** : ❌ Non utilisé (fonction définie mais jamais appelée)
- **Usage prévu** : Génération améliorée avec analyse temporelle
- **Appels Gemini** : 1 appel API (si utilisé)
- **Tokens** : ~650 tokens estimés

**Note** : Si ces fonctions sont activées à l'avenir, il faudra ajouter le tracking des crédits.

---

## 📝 Notes de Développement

### Ajouter une Nouvelle Action Consommant des Crédits

1. Importer la fonction appropriée depuis `quotaTracking.ts` :

   ```typescript
   import { consumeCustomCredits } from "../lib/quotaTracking";
   ```

2. Appeler la fonction après l'action :

   ```typescript
   consumeCustomCredits(userId, credits, "action_type", { metadata });
   ```

3. Ou utiliser une fonction spécifique si elle existe :
   - `consumeAiMessageCredits()` pour messages IA
   - `consumeAnalyticsCredits()` pour analytics
   - `consumeSimulationCredits()` pour simulations

### Vérifier le Journal de Consommation

```typescript
import { getConsumptionJournal } from "../lib/quotaTracking";

const journal = getConsumptionJournal(userId, 100); // 100 dernières entrées
```

---

**Fichiers de référence** :

- `src/lib/quotaTracking.ts` - Système de tracking principal
- `Docs/9-Pricing.md` - Documentation des coûts
- `Docs/2025-10-28-Freemium-Quotas-Strategy.md` - Stratégie quotas
