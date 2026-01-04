# Architecture - GeminiChatInterface

**Date** : 29 octobre 2025  
**Statut** : 🔴 CRITIQUE - Nécessite refactoring  
**Complexité** : 1,510 lignes | 25+ hooks | 11 responsabilités

---

## 🎯 Vue d'ensemble

`GeminiChatInterface.tsx` est le composant central de l'UX IA-First. Il gère l'intégralité de l'interaction utilisateur avec l'IA pour créer et modifier des sondages.

### Problème actuel

**God Component** : Trop de responsabilités mélangées → régressions fréquentes

---

## 📊 Métriques de complexité

| Métrique             | Valeur | Seuil recommandé | Statut      |
| -------------------- | ------ | ---------------- | ----------- |
| Lignes de code       | 1,510  | < 300            | 🔴 CRITIQUE |
| Nombre de hooks      | 25+    | < 10             | 🔴 CRITIQUE |
| Responsabilités      | 11     | 1-2              | 🔴 CRITIQUE |
| États locaux         | 7      | < 5              | 🟠 ÉLEVÉ    |
| Dépendances contexte | 7      | < 3              | 🟠 ÉLEVÉ    |

---

## 🏗️ Responsabilités actuelles

### 1. **Gestion de la conversation**

- Messages (historique, ajout, suppression)
- ID de conversation
- Sauvegarde/restauration localStorage

### 2. **Interface utilisateur**

- Input utilisateur (textarea)
- États de chargement (loading, generating)
- Scroll automatique
- Animations et feedback visuel

### 3. **Intégration Gemini**

- Appels API Gemini
- Parsing des réponses
- Gestion des erreurs API
- Streaming (si activé)

### 4. **Gestion des quotas**

- Vérification quota avant envoi
- Affichage modal auth
- Gestion incentives (freemium)

### 5. **Détection d'intention**

- 3 services différents :
  - `IntentDetectionService` (Date Polls)
  - `FormPollIntentService` (Form Polls)
  - `GeminiIntentService` (Fallback)
- Parsing des commandes utilisateur
- Dispatch vers reducers

### 6. **Gestion Form Polls**

- Conversion `FormPollSuggestion` → `FormPollDraft`
- Dispatch actions vers `formPollReducer`
- Gestion highlights et animations

### 7. **Gestion Date Polls**

- Création de sondages de dates
- Ouverture de `PollCreator`
- Gestion des suggestions IA

### 8. **Auto-save & Resume**

- Hook `useAutoSave` (sauvegarde automatique)
- Hook `useConversationResume` (reprise après refresh)
- Synchronisation avec URL params

### 9. **Performance monitoring**

- Hook `useInfiniteLoopProtection`
- Service `performanceMonitor`
- Logs et métriques

### 10. **Feedback IA**

- Composant `AIProposalFeedback`
- Tracking des propositions IA
- Envoi de feedback utilisateur

### 11. **Gestion des erreurs**

- Error handling centralisé
- Logging avec `logger`
- Toasts utilisateur

---

## 🔗 Dépendances

### Contextes utilisés

```typescript
const {
  messages, // ConversationProvider
  setMessages, // ConversationProvider
  currentPoll, // ConversationProvider
  dispatchPollAction, // ConversationProvider
  openEditor, // ConversationProvider
  setModifiedQuestion, // ConversationProvider
} = useConversation();
```

### Hooks métier

```typescript
const autoSave = useAutoSave({ debug: true });
const conversationResume = useConversationResume();
const quota = useQuota();
const loopProtection = useInfiniteLoopProtection("gemini-chat-interface");
const { toast } = useToast();
```

### Services externes

```typescript
import { geminiService } from "../lib/gemini";
import { ConversationService } from "../services/ConversationService";
import { QuotaService } from "../services/QuotaService";
import { IntentDetectionService } from "../services/IntentDetectionService";
import { FormPollIntentService } from "../services/FormPollIntentService";
import { GeminiIntentService } from "../services/GeminiIntentService";
```

---

## 🔄 Flux de données

### Envoi d'un message

```
Utilisateur tape message
    ↓
submitMessage()
    ↓
Vérification quota (QuotaService)
    ↓
Ajout message user (setMessages)
    ↓
Appel Gemini API (geminiService)
    ↓
Parsing réponse IA
    ↓
Détection intention (3 services)
    ↓
┌─────────────────┬──────────────────┬─────────────────┐
│ Date Poll       │ Form Poll        │ Autre           │
│ IntentDetection │ FormPollIntent   │ GeminiIntent    │
└─────────────────┴──────────────────┴─────────────────┘
    ↓                   ↓                    ↓
openPollCreator()   dispatchPollAction()   Afficher texte
    ↓                   ↓
PollCreator         formPollReducer
                        ↓
                    currentPoll mis à jour
                        ↓
                    Re-render GeminiChatInterface
                        ↓
                    Affichage dans éditeur
```

### Problème : Boucle de dépendances

```
GeminiChatInterface
  ↓ dispatch action
formPollReducer
  ↓ met à jour
currentPoll (ConversationProvider)
  ↓ déclenche re-render
GeminiChatInterface
  ↓ appelle
IntentDetectionService
  ↓ dispatch vers
formPollReducer
  ↓ BOUCLE INFINIE (si pas de protection)
```

**Solution actuelle** : `useInfiniteLoopProtection` (workaround)  
**Solution recommandée** : Découpler les responsabilités

---

## 🎯 États locaux

```typescript
// 7 états locaux dans le composant
const [inputValue, setInputValue] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [showPollCreator, setShowPollCreator] = useState(false);
const [selectedPollData, setSelectedPollData] = useState<PollSuggestion | null>(null);
const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");
const [lastAIProposal, setLastAIProposal] = useState<{...} | null>(null);

// + 6 useRef pour éviter re-renders
const hasShownOfflineMessage = useRef(false);
const wasOffline = useRef(false);
const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);
const hasInitialized = useRef(false);
const hasResumedConversation = useRef(false);
```

**Problème** : Mélange UI state + Business logic

---

## 🐛 Points de fragilité

### 1. **Détection d'intention fragile**

```typescript
// 3 services avec regex complexes
const dateIntent = IntentDetectionService.detectIntent(userMessage);
const formIntent = FormPollIntentService.detectIntent(userMessage);
const geminiIntent = GeminiIntentService.parse(aiResponse);
```

**Risque** : Modifier une regex → casser les autres intentions

### 2. **Conversion Form Poll complexe**

```typescript
const convertFormSuggestionToDraft = (suggestion: FormPollSuggestion): FormPollDraft => {
  // 100+ lignes de transformation
  // Mapping types, options, conditions
  // Génération d'IDs
};
```

**Risque** : Ajouter un type de question → tout retester

### 3. **useEffect avec dépendances multiples**

```typescript
useEffect(() => {
  // Logique complexe
}, [currentPoll, setModifiedQuestion, messages, location.search]);
```

**Risque** : Modifier une dépendance → effets de bord imprévus

### 4. **Gestion du scroll**

```typescript
useEffect(() => {
  // Désactiver complètement le scroll automatique vers le bas sur mobile
  // pour éviter tout conflit avec la correction du focus Android
  const isMobile = window.innerWidth <= 768;
  // ... 50 lignes de logique scroll
}, [messages]);
```

**Risque** : Toucher au scroll → casser l'expérience mobile

---

## 🔧 Plan de refactoring

### Phase 1 : Extraire les hooks (1 jour)

```typescript
// Créer des hooks métier réutilisables
const useGeminiAPI = () => {
  // Appels API uniquement
  // 200 lignes extraites
};

const useIntentDetection = () => {
  // Unifier les 3 services
  // Pattern Strategy
};

const usePollCreation = () => {
  // Logique création Date/Form Polls
};

const useConversationPersistence = () => {
  // Auto-save + Resume
};
```

### Phase 2 : Séparer les contextes (1 jour)

```typescript
// Au lieu de 1 gros ConversationProvider
<ConversationStateProvider>      // Messages, ID
  <EditorStateProvider>           // Poll, isOpen
    <UIStateProvider>             // Sidebar, highlights
      <GeminiChatInterface />
    </UIStateProvider>
  </EditorStateProvider>
</ConversationStateProvider>
```

### Phase 3 : Simplifier le composant (2 jours)

**Objectif** : Réduire de 1,510 → 500 lignes

```typescript
const GeminiChatInterface = () => {
  // Utiliser les hooks extraits
  const api = useGeminiAPI();
  const intent = useIntentDetection();
  const polls = usePollCreation();
  const persistence = useConversationPersistence();

  // Logique UI uniquement
  return <ChatUI />;
};
```

---

## 📋 Checklist avant modification

Avant de modifier `GeminiChatInterface.tsx`, vérifier :

- [ ] Les tests de non-régression passent
- [ ] La modification est isolée (1 responsabilité)
- [ ] Les dépendances sont documentées
- [ ] Un test unitaire couvre le changement
- [ ] Le changement ne crée pas de boucle infinie
- [ ] Les autres intentions ne sont pas cassées
- [ ] Le scroll mobile fonctionne toujours
- [ ] La reprise de conversation fonctionne

---

## 🚨 Règles strictes

### ❌ NE PAS FAIRE

1. Ajouter de nouveaux états locaux
2. Modifier les regex sans tests
3. Toucher au scroll sans plan
4. Mélanger UI et business logic
5. Créer de nouvelles dépendances circulaires

### ✅ FAIRE

1. Extraire la logique dans des hooks
2. Tester avant de modifier
3. Documenter les changements
4. Commiter petit et souvent
5. Demander une review

---

## 📚 Références

- **Fichier** : `src/components/GeminiChatInterface.tsx`
- **Tests** : `tests/e2e/form-poll-regression.spec.ts`
- **Contexte** : `src/components/prototype/ConversationProvider.tsx`
- **Services** : `src/services/IntentDetectionService.ts`, `FormPollIntentService.ts`
- **Reducers** : `src/reducers/formPollReducer.ts`, `pollReducer.ts`

---

**Dernière mise à jour** : 29 octobre 2025  
**Auteur** : Cascade AI  
**Statut** : 🔴 Document vivant - À mettre à jour après chaque refactoring
