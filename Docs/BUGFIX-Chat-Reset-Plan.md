# Plan Détaillé - Reset du Chat et des Formulaires

## 🎯 Objectif

Garantir que le chat et les formulaires soient **vides** lors de la création d'un nouveau sondage, tout en **préservant l'état** lors d'un refresh de page.

## 🔍 Analyse du Problème Actuel

### Problème Identifié
Le chat ne se vide pas lors de la navigation entre différentes créations de sondages. 
L'utilisateur retrouve les messages précédents au lieu d'avoir une page vierge.

### Architecture Actuelle
- **GeminiChatInterface** : Gère l'affichage des messages
- **useAutoSave** : Gère la persistance des conversations
- **ConversationProvider** : Gère l'état global de la conversation
- **AICreationWorkspace** : Page principale de création avec IA

## 📋 Tous les Cas d'Usage Identifiés

### 1. **Navigation Initiale** (Arrivée sur le site)
- URL : `/` (landing page)
- URL : `/workspace/date` (création sondage dates)
- URL : `/workspace/form` (création formulaire)
- **Comportement attendu** : Chat vide, pas de conversation active, et sondage ou formulaire vierge

### 2. **Création Nouveau Sondage** 
- Action : Clic sur "Créer un sondage" depuis dashboard
- Action : Clic sur "Nouveau sondage" depuis menu
- Action : Navigation directe vers `/workspace/date` (par défaut)
- **Comportement attendu** : Chat vide, conversation nouvelle

### 3. **Changement de Type de Sondage**
- Action : De `/workspace/date` vers `/workspace/form`
- Action : De `/workspace/form` vers `/workspace/date`
- **Comportement attendu** : Chat reset avec contexte du nouveau type

### 4. **Navigation Externe puis Retour**
- Action : Navigation vers `/dashboard` puis retour création
- Action : Navigation vers `/settings` puis retour création
- **Comportement attendu** : État préservé (conversation en cours)

### 5. **Refresh de Page** (F5/Cmd+R)
- Action : Refresh sur `/workspace/form`
- Action : Refresh sur `/workspace/date`
- **Comportement attendu** : État restauré exactement comme avant

### 6. **Navigation Vote/Création**
- Action : De `/vote/{slug}` vers `/workspace/date` (par défaut)
- Action : De `/results/{slug}` vers `/workspace/date` (par défaut)
- **Comportement attendu** : Chat vide (nouvelle création)

### 7. **Édition de Sondage Existant**
- URL : `/workspace/date?edit={pollId}` ou `/workspace/form?edit={pollId}`
- **Comportement attendu** : Chat pré-rempli avec contexte d'édition

### 8. **Navigation Mobile**
- Action : Swipe navigation entre pages
- Action : Menu burger navigation
- **Comportement attendu** : Identique desktop

## 🔄 États à Préserver vs Vider

### ✅ États à PRÉSERVER (Refresh/Navigation temporaire)
1. **Conversation active** avec messages
2. **Sondage en cours d'édition** (brouillon)
3. **Type de sondage sélectionné** (date/form)
4. **Contexte IA** (suggestions, état)
5. **Position scroll** dans le chat
6. **Focus dans les inputs**

### 🧹 États à VIDER (Nouvelle création)
1. **Messages précédents** du chat
2. **Conversation ID** (nouvelle conversation)
3. **Sondage en cours** (sauf si édition)
4. **Brouillons non sauvegardés**
5. **État UI** temporaire

## 🏗️ Architecture de Solution

### 1. **Service de Reset Intelligent**
```typescript
interface ResetStrategy {
  shouldReset: boolean;
  preserveConversation?: boolean;
  resetType?: 'full' | 'chat-only' | 'context-only';
  reason: string;
}

class ChatResetService {
  static determineResetStrategy(
    fromLocation: Location,
    toLocation: Location,
    action: 'PUSH' | 'POP' | 'REPLACE'
  ): ResetStrategy
}
```

### 2. **Hook de Navigation Intelligente**
```typescript
const useSmartNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const smartNavigate = (to: string, options?: NavigationOptions) => {
    // Déterminer si reset nécessaire
    const strategy = ChatResetService.determineResetStrategy(
      location,
      new URL(to, window.location.origin),
      options?.action || 'PUSH'
    );
    
    // Appliquer reset avant navigation
    if (strategy.shouldReset) {
      applyResetStrategy(strategy);
    }
    
    navigate(to, options);
  };
};
```

### 3. **Stratégies de Reset Détaillées**

#### Strategy 1: Full Reset (Nouvelle création)
- **Déclencheurs** : `/workspace/date` ou `/workspace/form` sans params, clic "Nouveau"
- **Actions** : 
  - `clearConversation()` dans ConversationProvider
  - `clearCurrentPoll()` dans EditorStateProvider  
  - `startNewConversation()` dans useAutoSave
  - Reset UI state

#### Strategy 2: Context Reset (Changement type)
- **Déclencheurs** : Navigation de `/workspace/date` vers `/workspace/form`
- **Actions** :
  - Garder conversation ID
  - Vider messages de contexte spécifique
  - Mettre à jour contexte IA

#### Strategy 3: No Reset (Navigation temporaire)
- **Déclencheurs** : Navigation vers dashboard/settings puis retour
- **Actions** : Aucune, tout préserver

#### Strategy 4: Edit Mode (Édition)
- **Déclencheurs** : URL avec `edit={pollId}`
- **Actions** :
  - Charger conversation existante
  - Pré-remplir chat avec contexte édition

## 📍 Points d'Insertion dans le Code

### 1. **AICreationWorkspace.tsx** (Point principal)
```typescript
// Dans useEffect de navigation
useEffect(() => {
  const strategy = ChatResetService.determineResetStrategy(
    previousLocation,
    location,
    navigationAction
  );
  
  if (strategy.shouldReset) {
    handleReset(strategy);
  }
}, [location, navigationAction]);
```

### 2. **ConversationProvider.tsx** (Gestion état)
```typescript
// Ajouter méthode de reset intelligent
const intelligentReset = useCallback((strategy: ResetStrategy) => {
  switch (strategy.resetType) {
    case 'full':
      clearConversation();
      clearCurrentPoll();
      break;
    case 'chat-only':
      setMessages([]);
      break;
    case 'context-only':
      // Garder messages, vider contexte IA
      break;
  }
}, []);
```

### 3. **GeminiChatInterface.tsx** (Reset UI)
```typescript
// Écouter les événements de reset
useEffect(() => {
  const handleResetEvent = (event: CustomEvent<ResetStrategy>) => {
    applyUIReset(event.detail);
  };
  
  window.addEventListener('chat-reset', handleResetEvent);
  return () => window.removeEventListener('chat-reset', handleResetEvent);
}, []);
```

## 🧪 Tests à Implémenter

### Tests E2E
1. **Nouvelle création vide** : `/` → `/workspace/date` → chat vide
2. **Refresh préserve** : `/workspace/form` → refresh → état restauré
3. **Changement type** : `/workspace/date` → `/workspace/form`
4. **Navigation retour** : `/workspace/form` → `/dashboard` → back → état préservé
5. **Édition chargée** : `/workspace/date?edit={id}` → contexte pré-rempli

### Tests Unitaires
1. `ChatResetService.determineResetStrategy()` 
2. `useSmartNavigation.smartNavigate()`
3. `ConversationProvider.intelligentReset()`

## 🚀 Plan d'Implémentation (3 phases)

### Phase 1: Service Core (2h)
- [ ] Créer `ChatResetService.ts`
- [ ] Implémenter logique de détermination de stratégie
- [ ] Tests unitaires du service

### Phase 2: Hook Navigation (1h)
- [ ] Créer `useSmartNavigation.ts`
- [ ] Intégrer dans `AICreationWorkspace`
- [ ] Tests navigation

### Phase 3: Integration UI (1h)
- [ ] Modifier `ConversationProvider`
- [ ] Modifier `GeminiChatInterface`
- [ ] Tests E2E complets

## 📊 Métriques de Succès

### UX Metrics
- **0** messages résiduels lors nouvelle création
- **100%** état préservé lors refresh
- **<500ms** temps de reset
- **0** confusion utilisateur

### Technical Metrics  
- **0** memory leaks
- **100%** couverture tests
- **0** régressions existantes

## 🔧 Fichiers à Modifier

### Nouveaux
- `src/services/ChatResetService.ts`
- `src/hooks/useSmartNavigation.ts`
- `src/types/navigation.ts`

### Modifiés
- `src/components/prototype/AICreationWorkspace.tsx`
- `src/components/prototype/ConversationProvider.tsx`
- `src/components/GeminiChatInterface.tsx`
- `src/hooks/useAutoSave.ts`

### Tests
- `src/services/__tests__/ChatResetService.test.ts`
- `src/hooks/__tests__/useSmartNavigation.test.ts`
- `tests/e2e/chat-reset.spec.ts`

## ⚠️ Risques et Mitigations

### Risque 1: Perte de données involontaire
- **Mitigation** : Confirmation utilisateur avant reset complet
- **Safeguard** : Backup localStorage avant reset

### Risque 2: Performance impact
- **Mitigation** : Reset asynchrone, non bloquant
- **Safeguard** : Monitoring performance reset

### Risque 3: Complexité accrue
- **Mitigation** : Documentation exhaustive, tests complets
- **Safeguard** : Code review obligatoire

---

**Status** : Plan détaillé complété, prêt pour implémentation
**Estimation** : 4h total (2h service + 1h hook + 1h intégration)
**Priority** : High - Impact UX critique
