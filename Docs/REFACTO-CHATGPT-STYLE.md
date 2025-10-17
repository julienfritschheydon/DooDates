# ✅ REFACTORISATION ARCHITECTURE CHATGPT-STYLE

**Date :** 2025-10-17  
**Status :** Refactorisation complète terminée  
**Objectif :** Architecture ChatGPT/Claude/Gemini (chat centré + historique collapsible)

---

## 🎯 CHANGEMENTS PRINCIPAUX

### **AVANT (première version prototype)**
```
┌──────────┬────────────────────────────┐
│ Sidebar  │  Content                   │
│ fixe     │  - Chat landing            │
│ toujours │  OU                        │
│ visible  │  - Workspace (3 colonnes)  │
└──────────┴────────────────────────────┘
```

**Problèmes identifiés :**
- ❌ Sidebar fixe = pas familier pour grand public
- ❌ Navigation "app" visible = pas comme ChatGPT
- ❌ Chat jamais centré = pas naturel

---

### **APRÈS (architecture ChatGPT-like)**

**État 1 : Landing (pas de sondage)**
```
┌─────────────────────────────────────┐
│ [☰ Historique]  DooDates  [⚙️👤]  │ ← TopBar minimal
├─────────────────────────────────────┤
│                                     │
│                                     │
│          💬 CHAT CENTRÉ             │
│          (plein écran)              │
│                                     │
│          Messages...                │
│          [Input.............]       │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**État 2 : Création sondage (poll actif)**
```
┌─────────────────────────────────────┐
│ [☰ Historique]  DooDates  [⚙️👤]  │
├──────────────────┬──────────────────┤
│ 💬 CHAT (40%)    │ 📋 PREVIEW (60%) │
│                  │                  │
│ Messages...      │ Sondage live...  │
│                  │                  │
│ [Input...]       │ [Calendrier...]  │
└──────────────────┴──────────────────┘
```

**État 3 : Historique ouvert**
```
┌────────┬──────────────────────────────┐
│ HISTO  │  [☰]  DooDates  [⚙️👤]       │
│ RIQUE  ├──────────────────────────────┤
│        │                              │
│ Auj.   │  Chat centré ou 2 colonnes   │
│ • Réu  │                              │
│        │                              │
│ Hier   │                              │
│ • Sat  │                              │
└────────┴──────────────────────────────┘
```

---

## 📦 FICHIERS MODIFIÉS

### **Nouveaux composants**
1. ✅ `TopBar.tsx` - TopBar minimal (remplace Sidebar fixe)
2. ✅ `HistoryPanel.tsx` - Panel historique collapsible

### **Composants refactorisés**
3. ✅ `WorkspaceLayoutPrototype.tsx` - 2 états (centré OU 2 colonnes)
4. ✅ `ChatLandingPrototype.tsx` - Props pour callback poll
5. ✅ `App.tsx` - Utilise TopBar au lieu de Sidebar

### **Composants conservés (inchangés)**
- `Sidebar.tsx` - Garde pour référence (non utilisé)
- `SidebarContent.tsx` - Garde pour référence
- `WorkspaceProvider.tsx` - Inchangé

### **Hooks (inchangés)**
- `useMediaQuery.ts`
- `useActiveRoute.ts`

### **Configuration (inchangée)**
- `lib/features.ts` - Feature flag `VITE_AI_FIRST_UX`
- `.env.example`

---

## 🔄 LOGIQUE CONDITIONNELLE

### **Chat centré VS 2 colonnes**

```typescript
// WorkspaceLayoutPrototype.tsx

if (!poll) {
  // Pas de sondage actif
  return <ChatCentré />;
}

// Sondage actif
return (
  <Layout2Colonnes>
    <Chat gauche={40%} />
    <Preview droite={60%} />
  </Layout2Colonnes>
);
```

### **Quand passer en 2 colonnes ?**

**Déclencheurs (à implémenter) :**
- User dit "crée un sondage"
- IA commence à poser des questions
- Variable `poll` devient non-null dans le context

**Pour l'instant (prototype) :**
- Manuellement via `WorkspaceProvider`
- `setPoll({ id, title, type })` déclenche le layout 2 colonnes

---

## 🎨 COMPOSANTS DÉTAILLÉS

### **1. TopBar** (`components/layout/TopBar.tsx`)

**Rôle :** TopBar minimal style ChatGPT

**Éléments :**
```tsx
<header>
  <BurgerButton onClick={openHistory} />  // Gauche
  <Logo center />                          // Centre
  <UserActions>                            // Droite
    <SettingsButton />
    <ProfileButton />
  </UserActions>
</header>

{showHistory && <HistoryPanel />}
```

**Props :** Aucune (state interne)

---

### **2. HistoryPanel** (`components/layout/HistoryPanel.tsx`)

**Rôle :** Panel historique collapsible (slide-in depuis gauche)

**Éléments :**
```tsx
<>
  <Backdrop onClick={close} />
  <Aside width="320px">
    <Header>
      <Title>Historique</Title>
      <CloseButton />
    </Header>
    <ConversationList grouped by date>
      <Today />
      <Yesterday />
      <ThisWeek />
    </ConversationList>
  </Aside>
</>
```

**Props :**
- `onClose: () => void` - Callback fermeture

**Données (mockées pour prototype) :**
```typescript
history = [
  {
    id: '1',
    title: 'Réunion équipe Q4',
    type: 'date',
    date: "Aujourd'hui",
  },
  // ...
]
```

---

### **3. WorkspaceLayoutPrototype** (`components/prototype/WorkspaceLayoutPrototype.tsx`)

**Rôle :** Layout conditionnel selon état sondage

**2 rendus possibles :**

#### **A. Chat centré (pas de poll)**
```tsx
<Container centered>
  <ChatMessages max-width="3xl" />
  <ChatInput placeholder="Décrivez le sondage..." />
</Container>
```

#### **B. Layout 2 colonnes (poll actif)**
```tsx
<Container split>
  <Chat width="40%">
    <Messages />
    <Input placeholder="Message..." />
  </Chat>
  <Preview width="60%">
    <PollTitle />
    <CalendarMockup />
  </Preview>
</Container>
```

**Props :**
- Utilise `useWorkspace()` pour accéder à `poll`

**Logique :**
```typescript
const { poll } = useWorkspace();

if (!poll) {
  return <ChatCentré />;
}

return <Layout2Colonnes />;
```

---

### **4. ChatLandingPrototype** (`components/prototype/ChatLandingPrototype.tsx`)

**Changements :**
- ✅ Ajout prop `onPollCreated?: (poll: any) => void`
- ✅ Callback quand user crée un sondage (pour déclencher layout 2 colonnes)

**Utilisation :**
```tsx
<ChatLandingPrototype
  onPollCreated={(poll) => {
    // Stocker poll dans context
    // → Déclenche passage en layout 2 colonnes
  }}
/>
```

---

### **5. App.tsx** (modifié)

**Changements :**
```typescript
// AVANT
import { Sidebar } from "./components/layout/Sidebar";

const LayoutPrototype = () => (
  <div className="flex">
    <Sidebar />
    <main>{children}</main>
  </div>
);

// APRÈS
import { TopBar } from "./components/layout/TopBar";

const LayoutPrototype = () => (
  <>
    <TopBar />
    <main className="pt-14">{children}</main>
  </>
);
```

**Padding top-14 :** Compenser hauteur TopBar fixe (56px = 14*4px)

---

## 🧪 TESTER LA REFACTORISATION

### **1. Lancer le serveur**
```bash
# Vérifier que VITE_AI_FIRST_UX=true dans .env.local
npm run dev
```

### **2. Naviguer sur `/`**

**Attendu :**
- ✅ TopBar visible en haut
- ✅ Chat centré plein écran
- ✅ Pas de sidebar fixe

**Actions :**
- Click burger (☰) → Panel historique s'ouvre
- Click backdrop → Panel se ferme

### **3. Naviguer sur `/workspace`**

**Attendu (poll=null au départ) :**
- ✅ TopBar visible
- ✅ Chat centré

**Simuler création sondage (pour tester) :**
```typescript
// Dans WorkspaceProvider, ajouter bouton debug
<button onClick={() => setPoll({ id: '1', title: 'Test', type: 'date' })}>
  Simuler poll actif
</button>
```

**Résultat après click :**
- ✅ Layout passe en 2 colonnes
- ✅ Chat 40% gauche
- ✅ Preview 60% droite

### **4. Tester mobile**

```
DevTools → Responsive (375px)
```

**Attendu :**
- ✅ TopBar adaptée
- ✅ Burger historique fonctionne
- ✅ Chat centré responsive
- ✅ Layout 2 colonnes devient vertical (stack)

---

## 🔧 PROCHAINES ÉTAPES

### **Phase 6A : Intégration IA réelle**
- [ ] Connecter ChatLanding à GeminiChatInterface
- [ ] Implémenter callback `onPollCreated`
- [ ] Trigger layout 2 colonnes automatiquement

### **Phase 6B : Historique fonctionnel**
- [ ] Implémenter sauvegarde conversations
- [ ] Load/save historique localStorage
- [ ] Click conversation → Restore chat

### **Phase 6C : Preview live réactive**
- [ ] Sync chat IA ↔ Preview
- [ ] Update preview en temps réel
- [ ] Gestion état sondage (draft)

### **Phase 6D : Mobile polish**
- [ ] Layout 2 colonnes → Stack vertical mobile
- [ ] Swipe gestures (historique, preview)
- [ ] Bottom toolbar mobile

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | Avant (Sidebar fixe) | Après (ChatGPT-style) |
|--------|----------------------|----------------------|
| **Layout initial** | Sidebar + Chat côte à côte | Chat centré plein écran |
| **Navigation** | Sidebar toujours visible | Burger collapsible |
| **Familiarité** | App classique | ChatGPT/Claude/Gemini |
| **Espace écran** | 240px sidebar permanente | 100% pour chat |
| **Transition édition** | Workspace 3 colonnes | Chat 40% + Preview 60% |
| **Historique** | Navigation menu | Panel collapsible |
| **Grand public** | ❌ Pas familier | ✅ Très familier |
| **Power users** | ✅ Navigation rapide | ⚠️ Un click de plus |

**Verdict :** ✅ Architecture ChatGPT-style beaucoup plus adaptée au grand public

---

## 🚨 POINTS D'ATTENTION

### **1. State synchronisation**
- Bien gérer `poll` dans `WorkspaceProvider`
- Éviter re-renders inutiles (memoization)

### **2. Transitions layout**
- Animer passage chat centré → 2 colonnes
- Smooth transition (pas de jump)

### **3. Responsive**
- Layout 2 colonnes mobile = stack vertical ?
- OU tabs (Chat / Preview) ?

### **4. Historique persistence**
- localStorage pour MVP
- Supabase pour sync multi-device (Phase 2)

---

## ✅ CHECKLIST VALIDATION

```
Fonctionnel:
- [ ] TopBar s'affiche correctement
- [ ] Burger ouvre HistoryPanel
- [ ] Chat centré par défaut
- [ ] Layout 2 colonnes si poll actif
- [ ] Historique affiche conversations

Visuel:
- [ ] TopBar alignée ChatGPT
- [ ] Chat centré bien positionné
- [ ] Layout 2 colonnes proportions OK (40/60)
- [ ] HistoryPanel slide-in smooth

Mobile:
- [ ] TopBar responsive
- [ ] Burger fonctionne
- [ ] Chat centré mobile OK
- [ ] Layout 2 colonnes adapté

Pages classiques:
- [ ] /poll/* garde TopNav (inchangé)
- [ ] /create/* garde TopNav
- [ ] Pas de régression
```

---

**Refactorisation terminée ! Prêt à tester** 🚀
