# Spécifications Layout Workspaces IA

## Objectif
Créer une expérience optimale pour les workspaces de création IA avec un layout responsive adapté à chaque taille d'écran.

## Pages concernées
- `/workspace/date` (DateWorkspace → WorkspaceLayout général)
- `/workspace/form` (FormWorkspace → WorkspaceLayout général)  
- `/workspace/availability` (AvailabilityWorkspace → WorkspaceLayout général)

**Note :** Les routes produits (`/date-polls/workspace/date`, etc.) redirigent maintenant vers les workspaces généraux pour éviter la duplication de code.

---

## 📱 Mobile (< 768px)

### Layout global
```
┌─────────────────────────────────────┐
│ [Menu]           [DooDates] [☰]     │ ← Header (64px)
├─────────────────────────────────────┤
│                                     │
│         CONTENU PRINCIPAL           │ ← Zone active selon onglet
│        (Chat OU Éditeur)           │   - Plein écran
│                                     │   - Pas de marges
│                                     │   - Navigation par onglets
│                                     │
├─────────────────────────────────────┤
│ [💬 Chat]     [📝 Éditeur]          │ ← Navigation mobile (64px)
└─────────────────────────────────────┘
```

### Spécifications techniques
- **Header** : Toujours visible avec logo DooDates et hamburger
- **Marges** : `ml-0 mr-0` (pas de marges)
- **Layout** : `flex-col` (vertical)
- **Contenu** : Un seul onglet visible à la fois
- **Navigation** : Onglets fixes en bas avec icônes
- **Couleur fond** : `bg-[#0a0a0a]` (noir)

### Comportement utilisateur
1. Ouvrir la page → Vue Chat par défaut
2. Cliquer sur "Éditeur" → Remplace le chat par l'éditeur
3. Cliquer sur "Chat" → Retour à la vue chat
4. Menu hamburger → Ouvre/ferme le sidebar

---

## 📱 Tablette (768px - 1024px)

### Layout global
```
┌─────────────────────────────────────┐
│ [Menu]    [MARGE] [DooDates] [MARGE] │ ← Header (64px)
├─────────┬───────────────────────────┤
│ MARGE   │                           │
│ 128px   │      CONTENU PRINCIPAL    │ ← Zone active selon onglet
│         │     (Chat OU Éditeur)    │   - Pleine largeur disponible
│         │                           │   - Marges latérales de 128px
├─────────┴───────────────────────────┤
└─────────────────────────────────────┘
```

### Spécifications techniques
- **Header** : Logo centré avec marges latérales
- **Marges** : `md:ml-32 md:mr-32` (128px ou moins chaque côté, réduire avec la largeur)
- **Layout** : `flex-col` (vertical, PAS de 50/50)
- **Contenu** : Chat et éditeur visibles simultanément
- **Couleur fond** : `bg-[#0a0a0a]` (noir)

### Comportement utilisateur
1. Même comportement que desktop avec moins de marges
2. Split 50/50 en tablette
3. Interaction simultanée possible
4. Pas besoin de navigation par onglets

---

## 💻 Desktop (> 1024px)

### Layout global
```
┌─────────────────────────────────────────────────────────┐
│ [Menu]    [MARGE] [DooDates] [MARGE]                    │ ← Header (64px)
├─────────┬─────────────────┬─────────────────────────────┤
│ MARGE   │                 │                             │
│ 288px   │   CHAT IA       │     SONDAGE/FORMULAIRE      │ ← Split 50/50
│         │   (50%)         │         (50%)              │   - Chat visible en permanence
│         │                 │                             │   - Éditeur visible en permanence
│         │                 │                             │   - Marges symétriques de 288px
├─────────┴─────────────────┴─────────────────────────────┤
│                                                         │ ← Pas de navigation mobile
└─────────────────────────────────────────────────────────┘
```

### Spécifications techniques
- **Header** : Logo centré avec marges latérales
- **Marges** : `lg:ml-72 lg:mr-72` (288px chaque côté)
- **Layout** : `lg:flex-row` (horizontal 50/50)
- **Contenu** : Chat et éditeur visibles simultanément
- **Navigation** : Pas d'onglets (vue simultanée)
- **Couleur fond** : `bg-[#0a0a0a]` (noir)

### Comportement utilisateur
1. Chat IA visible à gauche (50% de l'espace)
2. Sondage/formulaire visible à droite (50% de l'espace)
3. Interaction simultanée possible
4. Pas besoin de navigation par onglets

---

## 🎯 Composants et Responsivité

### 1. Architecture simplifiée
```tsx
// Routes générales (uniquement)
/workspace/date → DateWorkspace.tsx → WorkspaceLayout.tsx → AICreator
/workspace/form → FormWorkspace.tsx → WorkspaceLayout.tsx → AICreator  
/workspace/availability → AvailabilityWorkspace.tsx → WorkspaceLayout.tsx → AICreator

// Routes produits (redirections)
/date-polls/workspace/date → /workspace/date
/form-polls/workspace/form → /workspace/form
/availability-polls/workspace/availability → /workspace/availability
```

### 2. WorkspaceLayout.tsx (layout unique)
```tsx
<div className="flex min-h-screen bg-[#0a0a0a]">
  <ProductSidebar productType={productType} />
  <div className="flex-1 ml-0 md:ml-32 lg:ml-72 mr-0 md:mr-32 lg:mr-72">
    <AICreator hideSidebar={false} />
  </div>
</div>
```

### 3. AICreationWorkspace (layout interne)
```tsx
{/* Layout flex selon taille */}
<div className={`flex flex-1 min-h-0 ${isMobile ? "flex-col" : "lg:flex-row"}`}>

{/* Chat : w-full mobile/tablette, lg:w-1/2 desktop */}
className={`${isMobile ? "w-full" : "lg:w-1/2 w-full"}`}

{/* Éditeur : w-full mobile/tablette, lg:w-1/2 desktop */}
className={`${isMobile ? "w-full absolute inset-0 z-20" : "lg:w-1/2 w-full"}`}
```

### 3. Navigation mobile
```tsx
{isMobile && (
  <MobileNavigationTabs
    activeTab={mobileActiveTab}
    onTabChange={setMobileActiveTab}
    pollType={pollTypeFromUrl}
    hasPoll={!!currentPoll}
  />
)}
```

---

## 📊 Tableau récapitulatif

| Taille | Marges | Layout | Navigation | Chat | Éditeur |
|--------|--------|---------|-------------|------|---------|
| Mobile (< 768px) | 0px | Vertical | Onglets bas | Plein écran | Plein écran |
| Tablette (768-1024px) | 128px | Vertical | Onglets bas | Plein écran | Plein écran |
| Desktop (> 1024px) | 288px | Horizontal 50/50 | Aucune | 50% gauche | 50% droite |

---

## 🔧调试指南

### Si les onglets mobiles n'apparaissent pas :
1. Vérifier `hideSidebar={false}` dans les workspaces
2. Vérifier `isMobile` detection dans `useUIState()`
3. Vérifier `MobileNavigationTabs` import et rendu

### Si le layout 50/50 ne fonctionne pas en desktop :
1. Vérifier `lg:flex-row` dans AICreationWorkspace
2. Vérifier `lg:w-1/2` sur chat et éditeur
3. Vérifier les marges `lg:ml-72 lg:mr-72`

### Si les marges sont incorrectes :
1. Mobile : doit être `ml-0 mr-0`
2. Tablette : doit être `md:ml-32 md:mr-32`
3. Desktop : doit être `lg:ml-72 lg:mr-72`

---

## 📝 Notes d'implémentation

1. **Couleurs** : Tous les fonds utilisent `bg-[#0a0a0a]` pour l'uniformité
2. **Transitions** : Utiliser `transition-all duration-300` pour les changements
3. **Z-index** : Header `z-40`, Navigation mobile `z-50`
4. **Overflow** : Mobile `overflow-y-auto`, Desktop `overflow-hidden`
5. **Responsive** : Utiliser les breakpoints Tailwind (`md:`, `lg:`)

Ce document sert de référence pour s'assurer que l'expérience est cohérente sur toutes les tailles d'écran.
