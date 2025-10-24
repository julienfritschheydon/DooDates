# DooDates - Roadmap Expérience IA-First

## 🎯 VISION STRATÉGIQUE

### **Principe fondamental**
```
DooDates ≠ "Outil avec chatbot assistant"
DooDates = "IA conversationnelle qui génère des sondages"
```

**Inversion du paradigme :**
- Calendly : GUI principal + IA assistant
- **DooDates : IA principale + GUI preview/édition**

---

## 🏗️ ARCHITECTURE UX CIBLE

### **Flow utilisateur complet**

```
┌──────────────────────────────────────────────────────────────┐
│ 1. LANDING - Chat plein écran                                │
│                                                                │
│              ┌────────────────────────────────┐              │
│              │                                 │              │
│              │  💬 Assistant IA DooDates      │              │
│              │                                 │              │
│              │  "Que veux-tu créer            │              │
│              │   aujourd'hui ?"                │              │
│              │                                 │              │
│              │  [Input message...]            │              │
│              │                                 │              │
│              └────────────────────────────────┘              │
│                                                                │
│  Exemples suggestions :                                       │
│  • "Créer un sondage de dates pour réunion équipe"           │
│  • "Questionnaire satisfaction client"                        │
│  • "Voir mes sondages en cours"                              │
└──────────────────────────────────────────────────────────────┘

                    ↓ User commence à créer

┌──────────────────────────────────────────────────────────────┐
│ 2. WORKSPACE - Layout 3 colonnes                             │
│                                                                │
│ ┌────────────┬─────────────────────────┬───────────────────┐ │
│ │ SIDEBAR    │  CANVAS PRINCIPAL       │  AI ASSISTANT     │ │
│ │ (gauche)   │  (centre)               │  (droite)         │ │
│ │            │                         │                   │ │
│ │ 📊 Projets │  ┌───────────────────┐  │ 💬 Chat continu  │ │
│ │            │  │                   │  │                   │ │
│ │ 🗓️ Recent  │  │  [SONDAGE LIVE]   │  │ User: "Ajoute Q3"│ │
│ │            │  │                   │  │                   │ │
│ │ 📈 Stats   │  │  Preview temps    │  │ IA: "Ajouté !    │ │
│ │            │  │  réel             │  │  Veux-tu la      │ │
│ │ ⚙️ Settings│  │                   │  │  rendre          │ │
│ │            │  │  [Calendrier]     │  │  conditionnelle?"│ │
│ │            │  │  [Questions]      │  │                   │ │
│ │            │  │  [Options]        │  │ [Input...]       │ │
│ │            │  │                   │  │                   │ │
│ │            │  └───────────────────┘  │                   │ │
│ │            │                         │                   │ │
│ │            │  [Boutons actions]      │                   │ │
│ │            │  Finaliser | Partager   │                   │ │
│ └────────────┴─────────────────────────┴───────────────────┘ │
│                                                                │
│ Mobile : Sidebar collapse, tabs Canvas ↔ Chat                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 ROADMAP DÉTAILLÉE

# 🟢 PHASE 1 : MVP IA-First (10-13h | 2-3 semaines)

## **Objectif : Prouver le concept, workflow basique fonctionnel**

### **1.1 Chat plein écran landing (3-4h)**

**Fichiers à créer/modifier :**
```typescript
// app/page.tsx (nouvelle version)
export default function HomePage() {
  return (
    <LandingChat 
      fullScreen={true}
      welcomeMessage="Bonjour ! Que veux-tu créer aujourd'hui ?"
      onPollCreated={(poll) => router.push(`/workspace/${poll.id}`)}
    />
  )
}

// components/LandingChat.tsx (nouveau)
- Chat interface plein écran
- Message d'accueil personnalisé
- Suggestions quick actions
- Transition vers workspace
```

**Features :**
- ✅ Chat prend 100vh viewport
- ✅ Gemini API integration existante
- ✅ Message accueil contextuel
- ✅ Suggestions exemples cliquables
- ✅ Redirect après création

**Complexité :** 🟢 Faible (refactoring composants existants)

---

### **1.2 Sidebar navigation (4-5h)**

**Fichiers à créer/modifier :**
```typescript
// components/layout/Sidebar.tsx (nouveau)
- Navigation verticale
- Liste projets récents
- Quick stats
- Settings access

// app/workspace/layout.tsx (nouveau)
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    {children}
  </main>
</div>
```

**Structure sidebar :**
```
┌─────────────────────┐
│ 🏠 DooDates        │
├─────────────────────┤
│ 📊 Mes sondages    │
│ 🗓️ Récents         │
│ 📈 Résultats       │
│ ⚙️ Paramètres      │
├─────────────────────┤
│ 👤 Profile         │
│ 🎨 Thème           │
└─────────────────────┘
```

**Responsive :**
- Desktop : Sidebar fixe 240px
- Tablet : Sidebar collapsible
- Mobile : Bottom navigation

**Complexité :** 🟢 Moyenne (refonte layout global)

---

### **1.3 Preview live basique (3-4h)**

**Fichiers à modifier :**
```typescript
// app/workspace/[id]/page.tsx
export default function WorkspacePage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll>()
  
  return (
    <div className="flex h-full">
      {/* Chat IA */}
      <GeminiChatInterface
        currentPoll={poll}
        onUpdate={(updatedPoll) => setPoll(updatedPoll)}
        className="w-1/3 border-r"
      />
      
      {/* Preview */}
      <PollPreview 
        poll={poll}
        className="flex-1"
      />
    </div>
  )
}

// components/PollPreview.tsx (améliorer existant)
- Update en temps réel
- Highlight derniers changements
- Mode édition inline optionnel
```

**Features preview :**
- ✅ Synchronisation temps réel avec chat
- ✅ Affichage calendrier/questions selon type
- ✅ Highlight changements récents (fade animation)
- ✅ Scroll auto vers nouveaux éléments

**Complexité :** 🟡 Moyenne (sync state React)

---

### **🎯 Résultat Phase 1**

**Après 10-13h, tu as :**
```
✅ Landing chat plein écran (expérience IA-first)
✅ Sidebar navigation moderne
✅ Workspace avec preview live
✅ Flow création complet IA → Preview
```

**Ce qu'on peut faire :**
- User arrive → Chat
- User crée via conversation → Preview s'affiche
- User finalise → Partage

**Ce qu'on NE peut PAS encore :**
- Modifications conversationnelles avancées
- Allers-retours complexes
- Analytics conversationnels

---

# 🟡 PHASE 2 : Modifications conversationnelles (13-14h | 3-4 semaines)

## **Objectif : Allers-retours IA ↔ Sondage fluides**

### **2.1 Context management (2h)**

**Fichiers à créer :**
```typescript
// lib/ai/ContextManager.ts (nouveau)
export class ConversationContext {
  private history: Message[] = []
  private currentPoll: Poll | null = null
  
  addMessage(message: Message) {
    this.history.push(message)
  }
  
  setPoll(poll: Poll) {
    this.currentPoll = poll
  }
  
  getRelevantContext(query: string): string {
    // Retourne contexte pertinent pour la query
    return `
      Current poll: ${this.currentPoll?.title}
      Questions: ${this.currentPoll?.questions.length}
      Last modification: ${this.history[this.history.length - 1]}
    `
  }
}
```

**Features :**
- ✅ Mémorisation conversation
- ✅ Référence au poll en cours
- ✅ Contexte pertinent pour Gemini
- ✅ Gestion historique modifications

---

### **2.2 Modification sondages via IA (4h)**

**Fichiers à créer/modifier :**
```typescript
// lib/ai/PollModifier.ts (nouveau)
export async function modifyPollViaAI(
  poll: Poll,
  userRequest: string,
  context: ConversationContext
): Promise<Poll> {
  const prompt = `
    Current poll structure:
    ${JSON.stringify(poll, null, 2)}
    
    User request: "${userRequest}"
    Conversation context: ${context.getRelevantContext(userRequest)}
    
    Modify the poll according to user request.
    Return complete updated poll JSON.
  `
  
  const response = await gemini.generateContent(prompt)
  const updatedPoll = parseGeminiPollResponse(response)
  
  return updatedPoll
}
```

**Commandes supportées :**
- "Ajoute une question sur le prix"
- "Retire la question 3"
- "Change Q2 en choix multiple"
- "Rends Q4 conditionnelle si Q2 = Oui"
- "Ajoute option 'Autre' à Q1"

---

### **2.3 Preview réactive avancée (5-6h)**

**Fichiers à modifier :**
```typescript
// components/PollPreview.tsx
export function PollPreview({ poll, lastChange }: Props) {
  return (
    <div className="relative">
      {/* Preview principal */}
      <PollDisplay poll={poll} />
      
      {/* Overlay highlights changements */}
      {lastChange && (
        <ChangeHighlight 
          elementId={lastChange.elementId}
          type={lastChange.type} // 'add' | 'edit' | 'delete'
          duration={3000}
        />
      )}
      
      {/* Diff visuel optionnel */}
      <DiffPanel 
        before={poll.previousVersion}
        after={poll}
        visible={showDiff}
      />
    </div>
  )
}

// components/ChangeHighlight.tsx (nouveau)
- Animation highlight élément modifié
- Pulse pour ajouts
- Fade out pour suppressions
- Border glow pour éditions
```

**Features :**
- ✅ Diff visuel avant/après
- ✅ Animations transitions fluides
- ✅ Scroll auto vers changement
- ✅ Undo/Redo visuel

---

### **2.4 Export/Actions via IA (2h)** 

**Commandes IA :**
```typescript
// lib/ai/ActionHandler.ts (nouveau)
export async function handleAIAction(
  action: string,
  poll: Poll
): Promise<ActionResult> {
  
  // Détection intention
  if (action.includes('export') || action.includes('exporte')) {
    const format = detectFormat(action) // CSV, PDF, JSON
    return await exportPoll(poll, format)
  }
  
  if (action.includes('partage') || action.includes('lien')) {
    return await generateShareLink(poll)
  }
  
  if (action.includes('analyse') || action.includes('résultats')) {
    return await analyzeResults(poll)
  }
}
```

**Exemples :**
- "Exporte en CSV" → Téléchargement auto
- "Génère le lien de partage" → Copie clipboard
- "Analyse les résultats" → Affiche insights

---

### **🎯 Résultat Phase 2**

**Après 13-14h supplémentaires (total 23-27h), tu as :**
```
✅ Modifications conversationnelles fluides
✅ Preview réactive avec highlights
✅ Actions (export, partage) via IA
✅ Contexte conversation persistant
```

**Expérience utilisateur :**
```
User: "Crée un sondage pour réunion équipe"
IA: [Crée sondage] "Voilà ! Veux-tu ajouter des questions ?"

User: "Ajoute une question sur le budget"
IA: [Ajoute Q] "Ajouté ! Choix unique ou multiple ?"

User: "Multiple. Et rends-la conditionnelle si Q1 = Oui"
IA: [Modifie] "Fait ! Veux-tu prévisualiser ?"

User: "Oui. Maintenant exporte en CSV"
IA: [Exporte] "Téléchargement lancé !"
```

**C'est déjà une expérience IA-first solide !** 🎉

---

# 🔴 PHASE 3 : Expérience IA complète (32-40h | 4-6 semaines)

## **Objectif : IA = outil principal production-ready**

### **3.1 Multi-turn conversation avancée (8-10h)**

**Features :**
```typescript
// lib/ai/ConversationManager.ts
export class ConversationManager {
  private sessions: Map<string, ConversationSession> = new Map()
  
  // Gestion sessions longues
  createSession(userId: string, pollId?: string): ConversationSession
  
  // Branches conversation
  createBranch(sessionId: string, fromMessageId: string): Branch
  
  // Retour arrière
  undoToMessage(sessionId: string, messageId: string): void
  
  // Suggestions proactives
  getSuggestions(session: ConversationSession): Suggestion[]
}
```

**Cas d'usage :**
- Session persiste entre visites
- "Reviens à la version d'il y a 5 messages"
- Branches alternatives ("Montre-moi sans Q3")
- Historique complet navigable

---

### **3.2 Smart suggestions proactives (6-8h)**

**IA propose automatiquement :**
```typescript
// lib/ai/SmartSuggestions.ts
export function analyzeAndSuggest(poll: Poll): Suggestion[] {
  const suggestions = []
  
  // Détection patterns
  if (hasMultipleChoiceWithoutOther(poll)) {
    suggestions.push({
      type: 'enhancement',
      message: "Veux-tu ajouter une option 'Autre' ?",
      action: () => addOtherOption(poll)
    })
  }
  
  if (hasSequentialQuestions(poll)) {
    suggestions.push({
      type: 'optimization',
      message: "Q3 pourrait être conditionnelle à Q2. Je configure ?",
      action: () => makeConditional(poll, 'Q3', 'Q2')
    })
  }
  
  return suggestions
}
```

**Exemples suggestions :**
- "Cette question pourrait être une matrice ?"
- "Trop d'options, veux-tu les grouper ?"
- "Ajouter une question de suivi automatique ?"
- "Activer la logique de saut ici ?"

---

### **3.3 Analytics conversationnels (8-10h)**

**Query résultats en langage naturel :**
```typescript
// lib/ai/ResultsAnalyzer.ts
export async function analyzeViaAI(
  poll: Poll,
  query: string
): Promise<AnalysisResult> {
  
  const prompt = `
    Poll results data:
    ${formatResultsForAI(poll.responses)}
    
    User question: "${query}"
    
    Provide insights, statistics, and visualizations suggestions.
  `
  
  const analysis = await gemini.generateContent(prompt)
  
  return {
    insights: parseInsights(analysis),
    charts: suggestCharts(analysis),
    summary: generateSummary(analysis)
  }
}
```

**Commandes :**
- "Combien de personnes ont voté ?"
- "Quelle est l'option la plus populaire ?"
- "Montre-moi les votes par semaine"
- "Compare les résultats Q1 et Q3"
- "Y a-t-il des patterns intéressants ?"

---

### **3.4 Polish UX final (10-12h)**

**Animations et micro-interactions :**
- Loading states élégants (skeleton, pulse)
- Transitions fluides chat ↔ preview
- Error recovery conversationnel
- Success celebrations subtiles

**Onboarding nouveau flow :**
- First-time user experience
- Tour guidé IA-first
- Exemples interactifs
- Tips contextuals

**Accessibilité :**
- Keyboard navigation complète
- Screen reader support
- Focus management
- ARIA labels

---

### **🎯 Résultat Phase 3**

**Après 32-40h supplémentaires (total 55-67h), tu as :**
```
✅ Expérience IA production-ready
✅ Conversations longues et complexes
✅ Suggestions intelligentes proactives
✅ Analytics conversationnels complets
✅ Polish UX professionnel
```

**L'IA est devenue l'outil principal, le GUI est secondaire** ✨

---

## 📊 RÉCAPITULATIF GLOBAL

┌───────────────────────────────────────────────────────────────┐
│ PHASE          DURÉE      FEATURES CLÉS          COMPLEXITÉ   │
├───────────────────────────────────────────────────────────────┤
│ Phase 1        10-13h     Chat landing            🟢 Faible   │
│ MVP            2-3 sem    Sidebar layout                      │
│                          Preview live basique                 │
├───────────────────────────────────────────────────────────────┤
│ Phase 2        13-14h     Modifications IA         🟡 Moyen   │
│ Modifications  3-4 sem    Preview réactive                    │
│                          Actions conversationnelles           │
├───────────────────────────────────────────────────────────────┤
│ Phase 3        32-40h     Multi-turn avancé       🔴 Complexe │
│ Expérience     4-6 sem    Smart suggestions                   │
│ complète                  Analytics IA                        │
│                          Polish final                         │
├───────────────────────────────────────────────────────────────┤
│ TOTAL          55-67h     Expérience IA-first     2-3 mois    │
│                9-13 sem   production-ready                    │
└───────────────────────────────────────────────────────────────┘


