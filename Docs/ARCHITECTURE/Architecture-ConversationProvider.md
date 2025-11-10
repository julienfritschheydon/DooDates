# Architecture - ConversationProvider

**Date** : 29 octobre 2025  
**Statut** : 🟠 ÉLEVÉ - Nécessite découplage  
**Complexité** : 411 lignes | 15+ états | 8 responsabilités

---

## 🎯 Vue d'ensemble

`ConversationProvider.tsx` est le contexte central de l'UX IA-First. Il gère l'état partagé entre tous les composants de l'application.

### Problème actuel
**État monolithique** : Trop d'états mélangés → re-renders en cascade

---

## 📊 Métriques de complexité

| Métrique | Valeur | Seuil recommandé | Statut |
|----------|--------|------------------|--------|
| Lignes de code | 411 | < 300 | 🟠 ÉLEVÉ |
| Nombre d'états | 15+ | < 8 | 🟠 ÉLEVÉ |
| Responsabilités | 8 | 1-2 | 🟠 ÉLEVÉ |
| Composants dépendants | 7 | < 5 | 🟠 ÉLEVÉ |
| Reducers | 2 | 1 | ✅ OK |

---

## 🏗️ États gérés

### 1. **État conversation** (Business Logic)
```typescript
const [conversationId, setConversationId] = useState<string | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
```

**Responsabilité** : Historique de la conversation avec l'IA

### 2. **État éditeur** (Business Logic)
```typescript
const [isEditorOpen, setIsEditorOpen] = useState(false);
const [currentPoll, dispatchPoll] = useReducer(pollReducer, null);
```

**Responsabilité** : Sondage en cours d'édition

### 3. **État UI - Highlights** (UI State)
```typescript
const [highlightedId, setHighlightedId] = useState<string | null>(null);
const [highlightType, setHighlightType] = useState<"add" | "remove" | "modify" | null>(null);
```

**Responsabilité** : Animations visuelles

### 4. **État UI - Modifications** (UI State)
```typescript
const [modifiedQuestionId, setModifiedQuestionId] = useState<string | null>(null);
const [modifiedField, setModifiedField] = useState<"title" | "type" | "options" | "required" | null>(null);
```

**Responsabilité** : Feedback visuel des modifications

### 5. **État UI - Sidebar** (UI State)
```typescript
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const isMobile = useMediaQuery("(max-width: 767px)");
```

**Responsabilité** : Navigation mobile

---

## 🔗 Composants dépendants

### Consommateurs du contexte
```typescript
// 7 composants utilisent useConversation()
1. GeminiChatInterface.tsx       // Chat principal
2. FormPollCreator.tsx            // Éditeur Form Polls
3. QuestionCard.tsx               // Carte de question
4. ChatLandingPrototype.tsx       // Page d'accueil
5. PollPreview.tsx                // Preview du sondage
6. WorkspaceLayoutPrototype.tsx   // Layout principal
7. ConversationProvider.tsx       // Lui-même (export du hook)
```

**Problème** : Modifier 1 état → re-render de 7 composants

---

## 🔄 Flux de données

### Création d'un Form Poll

```
IA génère suggestion
    ↓
GeminiChatInterface dispatch action
    ↓
dispatchPollAction({ type: "CREATE_FORM_POLL", payload })
    ↓
formPollReducer traite l'action
    ↓
currentPoll mis à jour
    ↓
ConversationProvider notifie tous les consommateurs
    ↓
┌──────────────────┬─────────────────┬──────────────────┐
│ GeminiChat       │ FormPollCreator │ PollPreview      │
│ re-render        │ re-render       │ re-render        │
└──────────────────┴─────────────────┴──────────────────┘
```

**Problème** : Modifier le poll → re-render du chat (inutile)

### Modification d'une question

```
Utilisateur demande modification
    ↓
GeminiChatInterface détecte intention
    ↓
dispatchPollAction({ type: "MODIFY_QUESTION", payload })
    ↓
formPollReducer met à jour question
    ↓
currentPoll mis à jour avec _highlightedId
    ↓
setModifiedQuestion(questionId, field)
    ↓
Tous les composants re-render
    ↓
QuestionCard affiche animation
```

**Problème** : Animation UI → re-render de la conversation

---

## 🎯 Responsabilités actuelles

### 1. **Gestion de la conversation**
- Messages (ajout, suppression, restauration)
- ID de conversation
- Synchronisation localStorage

### 2. **Gestion de l'éditeur**
- État ouvert/fermé
- Sondage actuel (Date ou Form)
- Dispatch actions vers reducers

### 3. **Gestion des highlights**
- ID de l'élément surligné
- Type d'action (add, remove, modify)
- Timeout automatique (3s)

### 4. **Gestion des modifications**
- Question modifiée
- Champ modifié
- Feedback visuel temporaire

### 5. **Gestion de la sidebar**
- État ouvert/fermé
- Détection mobile
- Navigation

### 6. **Persistence**
- Sauvegarde messages dans localStorage
- Restauration au démarrage
- Synchronisation avec poll

### 7. **Initialisation**
- Chargement poll depuis localStorage
- Ouverture automatique éditeur
- Gestion des erreurs

### 8. **Navigation**
- Intégration avec React Router
- Gestion des paramètres URL
- Redirection

---

## 🐛 Points de fragilité

### 1. **Re-renders en cascade**
```typescript
// Modifier currentPoll → re-render de TOUS les composants
const { currentPoll } = useConversation();

// Même si le composant n'utilise que messages
const { messages } = useConversation();
// → Re-render quand currentPoll change
```

**Impact** : Performance dégradée, animations saccadées

### 2. **Synchronisation localStorage complexe**
```typescript
useEffect(() => {
  // Sauvegarder messages à chaque changement
  localStorage.setItem("prototype_messages", JSON.stringify(messages));
}, [messages]);

useEffect(() => {
  // Sauvegarder poll à chaque changement
  if (currentPoll) {
    // ... logique de sauvegarde
  }
}, [currentPoll]);
```

**Risque** : Race conditions, données incohérentes

### 3. **Couplage fort avec reducers**
```typescript
const [currentPoll, dispatchPoll] = useReducer(pollReducer, null);

// Mais pollReducer gère aussi formPollReducer
// Logique conditionnelle selon le type de poll
```

**Risque** : Modifier un reducer → impact sur l'autre

### 4. **Gestion des highlights temporaire**
```typescript
const setModifiedQuestion = useCallback((questionId, field) => {
  setModifiedQuestionId(questionId);
  setModifiedField(field);
  
  // Clear après 3 secondes
  if (questionId) {
    setTimeout(() => {
      setModifiedQuestionId(null);
      setModifiedField(null);
    }, 3000);
  }
}, []);
```

**Risque** : Memory leaks si composant unmount avant timeout

---

## 🔧 Plan de découplage

### Phase 1 : Séparer en 3 contextes (1 jour)

```typescript
// 1. ConversationStateProvider (Business Logic)
interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

// 2. EditorStateProvider (Business Logic)
interface EditorState {
  isEditorOpen: boolean;
  currentPoll: Poll | null;
  dispatchPollAction: (action: PollAction) => void;
  openEditor: () => void;
  closeEditor: () => void;
}

// 3. UIStateProvider (UI State)
interface UIState {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  highlightedId: string | null;
  highlightType: "add" | "remove" | "modify" | null;
  setHighlight: (id: string, type: string) => void;
  modifiedQuestionId: string | null;
  modifiedField: string | null;
  setModifiedQuestion: (id: string, field: string) => void;
}
```

**Avantage** : Modifier UI → pas de re-render de la conversation

### Phase 2 : Optimiser les re-renders (1 jour)

```typescript
// Utiliser des sélecteurs pour éviter re-renders inutiles
const useConversationMessages = () => {
  const { messages } = useConversation();
  return messages;
};

const useCurrentPoll = () => {
  const { currentPoll } = useEditor();
  return currentPoll;
};

// Composant ne re-render que si messages change
const ChatDisplay = () => {
  const messages = useConversationMessages();
  // ...
};
```

### Phase 3 : Externaliser la persistence (1 jour)

```typescript
// Créer un hook dédié
const useConversationPersistence = () => {
  const { messages, conversationId } = useConversation();
  
  useEffect(() => {
    // Logique de sauvegarde isolée
    persistConversation(conversationId, messages);
  }, [messages, conversationId]);
};

// Utiliser dans le provider
const ConversationProvider = ({ children }) => {
  // ...
  useConversationPersistence();
  // ...
};
```

---

## 📋 Architecture cible

```typescript
// Structure recommandée
<ConversationStateProvider>
  <EditorStateProvider>
    <UIStateProvider>
      <App />
    </UIStateProvider>
  </EditorStateProvider>
</ConversationStateProvider>

// Hooks spécialisés
useConversationMessages()  // Seulement messages
useCurrentPoll()           // Seulement poll
useSidebarState()          // Seulement sidebar
useHighlightState()        // Seulement highlights
```

**Avantages** :
- ✅ Re-renders optimisés
- ✅ Responsabilités séparées
- ✅ Testable indépendamment
- ✅ Facile à maintenir

---

## 🚨 Règles strictes

### ❌ NE PAS FAIRE
1. Ajouter de nouveaux états sans justification
2. Mélanger UI state et business logic
3. Créer des timeouts sans cleanup
4. Modifier le contexte sans plan de migration
5. Ajouter des dépendances circulaires

### ✅ FAIRE
1. Séparer les responsabilités
2. Utiliser des sélecteurs pour optimiser
3. Documenter les changements d'état
4. Tester les re-renders
5. Nettoyer les timeouts dans useEffect

---

## 📊 Carte des états

```
ConversationProvider
├── Conversation State (Business)
│   ├── conversationId
│   └── messages[]
├── Editor State (Business)
│   ├── isEditorOpen
│   └── currentPoll
│       ├── pollReducer (Date Polls)
│       └── formPollReducer (Form Polls)
└── UI State (Interface)
    ├── Sidebar
    │   ├── isSidebarOpen
    │   └── isMobile
    ├── Highlights
    │   ├── highlightedId
    │   └── highlightType
    └── Modifications
        ├── modifiedQuestionId
        └── modifiedField
```

---

## 📚 Références

- **Fichier** : `src/components/prototype/ConversationProvider.tsx`
- **Tests** : `tests/e2e/form-poll-regression.spec.ts`
- **Reducers** : `src/reducers/formPollReducer.ts`, `pollReducer.ts`
- **Consommateurs** : 7 composants (voir section Dépendances)

---

**Dernière mise à jour** : 29 octobre 2025  
**Auteur** : Cascade AI  
**Statut** : 🟠 Document vivant - À mettre à jour après découplage
