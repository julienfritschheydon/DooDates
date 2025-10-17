# UX IA-First - Document de Conception Technique

## 🎯 Objectif de la branche

**Nom branche :** `feature/ai-first-ux-prototype`

**Objectif :** Prototyper rapidement l'expérience UX IA-First pour validation visuelle et fonctionnelle avant implémentation complète.

**Timeline :** 3-4h de développement rapide

**Résultat attendu :**
- Voir le concept en action
- Valider l'UX avant gros investissement
- Identifier les problèmes avant qu'ils deviennent bloquants

---

## 📐 ARCHITECTURE ACTUELLE vs CIBLE

### **État actuel (main)**

```
Structure navigation :
┌─────────────────────────────────────────┐
│  TopNav (Header global)                 │
│  - Logo DooDates                        │
│  - Liens : Dashboard, Créer, etc.      │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Page Content (full width)              │
│  - Contenu principal                    │
│  - Pas de sidebar                       │
└─────────────────────────────────────────┘

Routes principales :
/ → Dashboard (liste sondages)
/create → Choix type (date/form)
/create/date → Créateur sondage dates
/create/form → Créateur formulaire
/poll/:id/vote → Page vote
/poll/:id/results → Page résultats
```

### **État cible (prototype UX IA-First)**

```
Structure navigation :
┌──────────┬──────────────────────────────┐
│ Sidebar  │  Page Content                │
│ (gauche) │                              │
│ 240px    │  - Chat landing              │
│          │  OU                          │
│ - Logo   │  - Workspace (chat + preview)│
│ - Nav    │                              │
│ - Profil │                              │
└──────────┴──────────────────────────────┘

Routes nouvelles :
/ → Chat landing (plein écran)
/workspace → Layout sidebar + content
/workspace/:pollId → Workspace avec preview
```

---

## 🔍 ANALYSE D'IMPACT PAR PAGE

### **1. Landing Page (`/`)**

#### **Avant (main)**
- Dashboard avec liste de sondages
- TopNav avec navigation
- Cards sondages récents
- Bouton "Créer nouveau sondage"

#### **Après (prototype)**
- Chat interface plein écran
- Message accueil IA
- Suggestions quick actions
- **TopNav supprimée** (remplacée par chat)

#### **Impacts**
- ✅ Route `/` complètement remplacée
- ⚠️ **Ancien dashboard devient `/dashboard` ?**
- ⚠️ **TopNav disparaît → Comment accéder aux autres pages ?**
- ⚠️ **Bookmarks users cassés** (s'ils ont `/` en favori)

#### **Solutions**
```typescript
// Option A : Redirection temporaire
// app/page.tsx (prototype)
export default function HomePage() {
  const [showPrototype] = useState(true); // Toggle pour tests
  
  if (!showPrototype) {
    return <DashboardClassic />; // Ancien comportement
  }
  
  return <ChatLandingPrototype />;
}

// Option B : Feature flag
// lib/features.ts
export const FEATURES = {
  AI_FIRST_UX: true, // Toggle global
};
```

---

### **2. Navigation globale (TopNav)**

#### **Problèmes identifiés précédemment**
D'après tes retours : "On a eu beaucoup de problèmes avec la top nav"

**Problèmes probables :**
- Z-index conflicts (modals, dropdowns)
- Responsive mobile (hamburger menu)
- Active states navigation
- Sticky positioning
- Hydration errors (SSR/CSR mismatch)

#### **Dans le prototype**
- TopNav **complètement supprimée**
- Remplacée par **Sidebar gauche**

#### **Risques**
1. **Composants existants cassés**
   - Composants qui importent `<TopNav />`
   - Layouts qui dépendent de `<Header />`
   - Spacing/padding basés sur hauteur TopNav

2. **Navigation cassée**
   - Liens entre pages
   - Breadcrumbs
   - Retour arrière

3. **State global perdu**
   - User session dans TopNav
   - Notifications
   - Thème switcher

#### **Solutions préventives**

```typescript
// components/layout/LayoutPrototype.tsx
export function LayoutPrototype({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar remplace TopNav */}
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// Garder TopNav pour compatibilité
// components/layout/LayoutClassic.tsx
export function LayoutClassic({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav /> {/* Ancien comportement */}
      <main>{children}</main>
    </>
  );
}

// app/layout.tsx (root)
export default function RootLayout({ children }: { children: ReactNode }) {
  const usePrototype = true; // Feature flag
  
  const Layout = usePrototype ? LayoutPrototype : LayoutClassic;
  
  return (
    <html>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
```

---

### **3. Sidebar (nouveau composant)**

#### **Éléments requis**
```typescript
<Sidebar>
  {/* Brand */}
  <Logo />
  
  {/* Navigation principale */}
  <NavItems>
    - Mes sondages
    - Récents
    - Résultats
    - Paramètres
  </NavItems>
  
  {/* Footer */}
  <UserProfile />
  <ThemeSwitcher />
</Sidebar>
```

#### **Risques identifiés**

**1. Z-index conflicts**
- Sidebar doit rester sous les modals
- Au-dessus du contenu principal
- Gestion overlays mobiles

```css
/* z-index hierarchy */
.sidebar { z-index: 10; }
.main-content { z-index: 1; }
.modal-backdrop { z-index: 40; }
.modal { z-index: 50; }
.dropdown { z-index: 30; }
.tooltip { z-index: 60; }
```

**2. Responsive mobile**
- Desktop : Sidebar fixe 240px
- Tablet : Sidebar collapsible (icône burger)
- Mobile : Sidebar full-screen overlay

```typescript
// components/layout/Sidebar.tsx
export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return (
      <>
        {/* Burger button */}
        <button onClick={() => setIsOpen(true)}>☰</button>
        
        {/* Overlay sidebar */}
        {isOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50">
              <SidebarContent />
            </aside>
          </>
        )}
      </>
    );
  }
  
  // Desktop : sidebar fixe
  return (
    <aside className="w-60 border-r">
      <SidebarContent />
    </aside>
  );
}
```

**3. Active state navigation**
```typescript
// hooks/useActiveRoute.ts
export function useActiveRoute() {
  const pathname = usePathname();
  
  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/');
  };
  
  return { isActive };
}

// Dans Sidebar
const { isActive } = useActiveRoute();

<NavLink 
  href="/workspace"
  className={isActive('/workspace') ? 'active' : ''}
>
  Mes sondages
</NavLink>
```

**4. Hydration errors (SSR)**
```typescript
// Éviter les hydration mismatches
export function Sidebar() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Render minimal version server-side
  if (!mounted) {
    return <SidebarSkeleton />;
  }
  
  return <SidebarContent />;
}
```

---

### **4. Chat Landing (`/`)**

#### **Composants nécessaires**
```typescript
// components/prototype/ChatLandingPrototype.tsx
<ChatLandingPrototype>
  <Logo />
  <ChatInterface>
    <WelcomeMessage />
    <MessageHistory />
    <InputArea />
  </ChatInterface>
  <QuickSuggestions />
</ChatLandingPrototype>
```

#### **Risques**

**1. Input focus automatique**
```typescript
// Auto-focus sur input au chargement
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  // Attendre le montage complet
  setTimeout(() => {
    inputRef.current?.focus();
  }, 100);
}, []);

<input ref={inputRef} placeholder="Message..." />
```

**2. Gestion du scroll**
```typescript
// Auto-scroll vers dernier message
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

<div className="messages overflow-auto">
  {messages.map(...)}
  <div ref={messagesEndRef} />
</div>
```

**3. Placeholder/Loading states**
```typescript
// Éviter layout shift pendant chargement
<div className="min-h-screen flex items-center justify-center">
  <div className="w-full max-w-3xl">
    {/* Skeleton pour éviter CLS */}
    {loading ? (
      <ChatSkeleton />
    ) : (
      <ChatInterface />
    )}
  </div>
</div>
```

---

### **5. Workspace (`/workspace/:pollId`)**

#### **Layout cible**
```
┌────────────┬──────────────────┬────────────────┐
│  Sidebar   │  Canvas          │  AI Chat       │
│  240px     │  (flex-1)        │  320px         │
│            │                  │                │
│  - Logo    │  [SONDAGE LIVE]  │  💬 Messages   │
│  - Nav     │  - Calendrier    │                │
│            │  - Questions     │  Input         │
│            │  - Preview       │                │
└────────────┴──────────────────┴────────────────┘
```

#### **Risques**

**1. Layout shifts**
```typescript
// Fixer hauteurs pour éviter shifts
<div className="flex h-screen">
  <Sidebar className="w-60 flex-shrink-0" />
  <Canvas className="flex-1 overflow-auto" />
  <AIChat className="w-80 flex-shrink-0 overflow-auto" />
</div>
```

**2. Sync state Chat ↔ Preview**
```typescript
// State management centralisé
const [poll, setPoll] = useState<Poll>();

// Chat modifie le poll
const handleAIUpdate = (updatedPoll: Poll) => {
  setPoll(updatedPoll);
};

// Preview réagit aux changements
<Preview poll={poll} />
<AIChat onUpdate={handleAIUpdate} currentPoll={poll} />
```

**3. Overflow conflicts**
```typescript
// Chaque colonne scroll indépendamment
<div className="flex h-screen overflow-hidden">
  <Sidebar className="overflow-y-auto" />
  <Canvas className="overflow-y-auto" />
  <AIChat className="overflow-y-auto" />
</div>
```

---

### **6. Pages existantes à ne PAS casser**

#### **Pages à préserver**
```
/poll/:id/vote   → Vote public (ne touche PAS)
/poll/:id/results → Résultats (ne touche PAS)
/create/date     → Ancien créateur dates (ne touche PAS)
/create/form     → Ancien créateur form (ne touche PAS)
```

#### **Stratégie isolation**
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Routes qui gardent l'ancien layout
  const useClassicLayout = pathname.startsWith('/poll/') || 
                          pathname.startsWith('/create/');
  
  if (useClassicLayout) {
    return (
      <html>
        <body>
          <TopNav /> {/* Ancien comportement */}
          <main>{children}</main>
        </body>
      </html>
    );
  }
  
  // Nouvelles routes avec sidebar
  return (
    <html>
      <body>
        <LayoutPrototype>{children}</LayoutPrototype>
      </body>
    </html>
  );
}
```

---

## 🎨 ÉLÉMENTS GRAPHIQUES À GÉRER

### **1. Breakpoints responsive**
```css
/* Tailwind breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */

/* Notre stratégie */
Mobile (<768px):
  - Sidebar hidden (burger menu)
  - Chat/Preview stacked vertical
  - Single column

Tablet (768-1023px):
  - Sidebar collapsible
  - Chat/Preview side-by-side (50/50)

Desktop (1024px+):
  - Sidebar fixe 240px
  - Chat/Preview 3-column layout
  - Sidebar + Canvas + AI Chat
```

### **2. Transitions & Animations**
```css
/* Sidebar slide-in/out */
.sidebar {
  transition: transform 300ms ease-in-out;
}

.sidebar.closed {
  transform: translateX(-100%);
}

/* Éviter les animations au premier render (hydration) */
.sidebar {
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
```

### **3. Loading states**
```typescript
// Skeleton pour sidebar
<SidebarSkeleton>
  <div className="h-8 w-32 bg-gray-200 animate-pulse" /> {/* Logo */}
  <div className="space-y-2 mt-4">
    <div className="h-10 bg-gray-200 animate-pulse" /> {/* Nav item */}
    <div className="h-10 bg-gray-200 animate-pulse" />
    <div className="h-10 bg-gray-200 animate-pulse" />
  </div>
</SidebarSkeleton>

// Skeleton pour chat
<ChatSkeleton>
  <div className="space-y-4">
    <div className="h-16 bg-gray-200 animate-pulse rounded" /> {/* Message */}
    <div className="h-16 bg-gray-200 animate-pulse rounded" />
  </div>
</ChatSkeleton>
```

### **4. Focus management**
```typescript
// Piège focus dans modal/sidebar mobile
import { FocusTrap } from '@headlessui/react';

<FocusTrap active={isMobileSidebarOpen}>
  <aside>
    <button onClick={close}>Close</button>
    <nav>...</nav>
  </aside>
</FocusTrap>

// Restaurer focus après fermeture
const lastFocusedElement = useRef<HTMLElement>();

const openSidebar = () => {
  lastFocusedElement.current = document.activeElement as HTMLElement;
  setIsOpen(true);
};

const closeSidebar = () => {
  setIsOpen(false);
  lastFocusedElement.current?.focus();
};
```

---

## ⚠️ RISQUES MAJEURS & MITIGATIONS

### **Risque 1 : CSS Conflicts**

**Problème :**
- Ancien CSS TopNav conflict avec nouveau Sidebar
- Sélecteurs globaux qui cassent

**Mitigation :**
```typescript
// Scoper les styles avec modules CSS
// components/layout/Sidebar.module.css
.sidebar {
  /* Styles isolés */
}

// OU utiliser des classes préfixées
<aside className="prototype-sidebar">
  <nav className="prototype-nav">
```

**Checklist :**
- [ ] Pas de styles globaux qui affectent `.sidebar`
- [ ] Pas de `position: fixed` sans z-index
- [ ] Pas de `width: 100%` sur enfants flex
- [ ] Pas de `overflow: hidden` sur parents scroll

---

### **Risque 2 : State Management Chaos**

**Problème :**
- State partagé entre Chat, Preview, Sidebar
- Re-renders en cascade
- Perte de données

**Mitigation :**
```typescript
// Context pour state global
export const WorkspaceContext = createContext<{
  poll: Poll | null;
  setPoll: (poll: Poll) => void;
  isLoading: boolean;
}>({
  poll: null,
  setPoll: () => {},
  isLoading: false,
});

// Provider au niveau workspace
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <WorkspaceContext.Provider value={{ poll, setPoll, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// Utilisation
const { poll, setPoll } = useContext(WorkspaceContext);
```

**Checklist :**
- [ ] Un seul source of truth pour le poll
- [ ] Pas de duplication state Chat/Preview
- [ ] Memoization pour éviter re-renders inutiles
- [ ] Loading states cohérents partout

---

### **Risque 3 : Navigation Breaks**

**Problème :**
- Liens cassés vers anciennes routes
- Redirections manquantes
- Bookmarks users cassés

**Mitigation :**
```typescript
// Middleware redirections
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rediriger ancien dashboard vers nouveau
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/workspace', request.url));
  }
  
  // Rediriger ancien /create vers chat
  if (pathname === '/create') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/create'],
};
```

**Checklist :**
- [ ] Toutes les anciennes routes ont une redirection OU fonctionnent encore
- [ ] Tester tous les liens dans Sidebar
- [ ] Tester breadcrumbs
- [ ] Tester back button navigateur

---

### **Risque 4 : Mobile Broken**

**Problème :**
- Sidebar overlap contenu
- Chat non scrollable
- Inputs cachés sous keyboard mobile

**Mitigation :**
```typescript
// Détection mobile
const isMobile = useMediaQuery('(max-width: 768px)');

// Layout adaptatif
{isMobile ? (
  <MobileLayout>
    <BurgerMenu />
    <Content />
  </MobileLayout>
) : (
  <DesktopLayout>
    <Sidebar />
    <Content />
  </DesktopLayout>
)}

// Viewport height fix mobile
// globals.css
html, body {
  height: 100%;
  overflow: hidden;
}

#__next {
  height: 100%;
}

/* Fix viewport height mobile (keyboard) */
.mobile-viewport {
  height: 100vh;
  height: -webkit-fill-available;
}
```

**Checklist :**
- [ ] Sidebar ferme automatiquement après navigation (mobile)
- [ ] Chat scrollable sur mobile
- [ ] Input visible quand keyboard apparaît
- [ ] Touch targets >44px
- [ ] Swipe to close sidebar (nice to have)

---

### **Risque 5 : Performance**

**Problème :**
- Chat history qui grandit = lag
- Re-renders de tout le workspace à chaque message
- Preview qui re-render en boucle

**Mitigation :**
```typescript
// Virtualization pour chat history long
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={messages}
  itemContent={(index, message) => <Message {...message} />}
/>

// Memoization composants lourds
const Preview = memo(function Preview({ poll }: { poll: Poll }) {
  // ...
}, (prev, next) => {
  // Re-render seulement si poll.id change
  return prev.poll?.id === next.poll?.id;
});

// Debounce input chat
const [input, setInput] = useState('');
const debouncedInput = useDebouncedValue(input, 300);

// Lazy load composants
const AIChat = lazy(() => import('./AIChat'));

<Suspense fallback={<ChatSkeleton />}>
  <AIChat />
</Suspense>
```

**Checklist :**
- [ ] Messages chat limités à 100 derniers
- [ ] Preview memoized
- [ ] Sidebar memoized
- [ ] Pas de re-render global à chaque keystroke

---

## 📝 CHECKLIST IMPLÉMENTATION

### **Phase 1 : Setup (30min)**
- [ ] Créer branche `feature/ai-first-ux-prototype`
- [ ] Créer dossier `components/prototype/`
- [ ] Créer fichier feature flag `lib/features.ts`
- [ ] Documenter architecture dans ce fichier

### **Phase 2 : Sidebar (1h)**
- [ ] Créer `Sidebar.tsx` basique
- [ ] Navigation items hardcodés
- [ ] Responsive mobile (burger menu)
- [ ] Z-index correct
- [ ] Active states
- [ ] Tester sur toutes tailles écran

### **Phase 3 : Chat Landing (1h)**
- [ ] Créer `ChatLandingPrototype.tsx`
- [ ] Message accueil
- [ ] Input avec suggestions
- [ ] Focus automatique
- [ ] Skeleton loading
- [ ] Tester scroll, focus

### **Phase 4 : Workspace Layout (1h)**
- [ ] Créer `WorkspaceLayoutPrototype.tsx`
- [ ] Layout 3 colonnes (Sidebar + Canvas + Chat)
- [ ] Preview live mockup
- [ ] Chat interface côté droit
- [ ] State sync basique (fake data)
- [ ] Tester overflow, scroll

### **Phase 5 : Integration & Polish (30min)**
- [ ] Intégrer dans `app/layout.tsx` avec feature flag
- [ ] Redirections si nécessaire
- [ ] Tester navigation entre pages
- [ ] Vérifier anciennes pages OK
- [ ] Mobile responsive check
- [ ] Loading states partout

### **Phase 6 : Tests (30min)**
- [ ] Navigation complète (toutes routes)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Back button navigateur
- [ ] Refresh page (state persist?)
- [ ] Anciennes pages toujours fonctionnelles
- [ ] No console errors

---

## 🔗 DÉPENDANCES À VÉRIFIER

### **Packages potentiellement nécessaires**
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.0",  // Pour FocusTrap, Transitions
    "react-virtuoso": "^4.0.0",     // Si chat history long (optionnel)
    "clsx": "^2.0.0",                // Conditional classes
    "tailwind-merge": "^2.0.0"       // Merge Tailwind classes
  }
}
```

### **Vérifier compatibilité**
- [ ] Next.js version (app router requis)
- [ ] React 18+ (pour Suspense, useTransition)
- [ ] Tailwind CSS config (breakpoints customs?)
- [ ] TypeScript version

---

## 📊 MÉTRIQUES DE SUCCÈS PROTOTYPE

**Critères validation :**
1. ✅ Chat landing s'affiche sans erreurs
2. ✅ Sidebar navigation fonctionne
3. ✅ Layout 3 colonnes lisible
4. ✅ Responsive mobile OK
5. ✅ Anciennes pages non cassées
6. ✅ Pas de layout shifts
7. ✅ Pas d'erreurs console
8. ✅ Performance acceptable (<500ms load)

**Questions à répondre :**
- L'UX IA-first est-elle convaincante ?
- Le layout 3 colonnes est-il lisible ?
- La sidebar remplace-t-elle bien la TopNav ?
- Mobile est-il utilisable ?
- Y a-t-il des UX issues flagrantes ?

---

## 🚨 RED FLAGS À SURVEILLER

**Arrêter si :**
- ❌ 3+ heures passées sans résultat visible
- ❌ Pages existantes cassées de façon irréparable
- ❌ Bugs de navigation critiques
- ❌ Layout complètement cassé sur mobile
- ❌ Performance inacceptable (>2s load)

**Dans ce cas :**
- Abandonner la branche proprement
- Documenter les blockers
- Revenir au plan initial (améliorer existant)

---

## 📦 PLAN DE ROLLBACK

**Si le prototype ne convient pas :**

```bash
# 1. Sauvegarder les learnings
git add Docs/AI-First-UX-Tech-Design.md
git commit -m "docs: learnings from UX IA-first prototype"

# 2. Retour sur main
git checkout main

# 3. Supprimer la branche (optionnel)
git branch -D feature/ai-first-ux-prototype

# 4. Documenter pourquoi ça n'a pas marché
```

**Pas de perte de temps :**
- Documentation créée = valeur
- Risques identifiés = valeur
- Décision éclairée = valeur

---

## ✅ PROCHAINES ÉTAPES

**Maintenant :**
1. [ ] Review ce document
2. [ ] Valider l'approche
3. [ ] Créer la branche
4. [ ] Commencer Phase 1 (Setup)

**Après validation prototype :**
- Si ✅ : Continuer implémentation complète
- Si ❌ : Rollback et améliorer plan existant

---

**Questions ? Ajustements nécessaires ?** 🚀
