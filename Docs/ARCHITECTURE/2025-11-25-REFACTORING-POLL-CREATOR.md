# Refactoring PollCreator.tsx - Documentation Architecture

**Date :** 25 novembre 2025  
**Fichier initial :** `src/components/PollCreator.tsx` (1779 lignes)  
**Fichier final :** `src/components/PollCreator.tsx` (240 lignes)  
**Réduction :** 1539 lignes (-87%)

---

## 📋 Résumé Exécutif

Le composant `PollCreator.tsx` était un composant monolithique de 1779 lignes, difficile à maintenir, tester et optimiser. Le refactoring a permis de :

- ✅ Réduire le composant principal à **240 lignes** (objectif < 300 lignes atteint)
- ✅ Extraire **5 composants modulaires** avec responsabilités uniques
- ✅ Créer **4 hooks personnalisés** pour la logique métier
- ✅ Créer **2 fichiers utilitaires** pour les fonctions pures
- ✅ Optimiser les performances avec `React.memo`
- ✅ Maintenir 100% de compatibilité fonctionnelle (tous les tests passent)

---

## 🎯 Objectifs du Refactoring

### Problèmes Identifiés

1. **Composant monolithique** : Trop de responsabilités dans un seul fichier
2. **Difficile à tester** : Logique métier mélangée avec UI
3. **Maintenance difficile** : Changements risquent d'affecter plusieurs fonctionnalités
4. **Performance** : Re-renders potentiels sur tout le composant

### Objectifs

- ✅ Réduire le composant principal à < 300 lignes
- ✅ Séparer les responsabilités (UI vs logique métier)
- ✅ Améliorer la testabilité (hooks et composants isolés)
- ✅ Optimiser les performances (React.memo, dépendances optimisées)
- ✅ Maintenir la compatibilité fonctionnelle (0 régression)

---

## 🏗️ Architecture Finale

### Structure des Fichiers

```
src/
├── components/
│   ├── PollCreator.tsx (240 lignes) ⭐ Composant principal orchestrateur
│   └── poll-creator/
│       ├── PollCreatorHeader.tsx (35 lignes)
│       ├── PollCreatorTimeSlots.tsx (280 lignes)
│       ├── PollCreatorSettingsPanel.tsx (150 lignes)
│       ├── PollCreatorCalendarSection.tsx (120 lignes)
│       └── PollCreatorActions.tsx (85 lignes)
├── hooks/
│   ├── usePollCreatorState.ts (200 lignes)
│   ├── useTimeSlots.ts (180 lignes)
│   ├── useCalendarConflicts.ts (150 lignes)
│   └── usePollFinalization.ts (200 lignes)
├── utils/
│   └── pollCreatorUtils.ts (50 lignes)
└── types/
    └── pollCreatorTypes.ts (30 lignes)
```

---

## 🔧 Composants Créés

### 1. PollCreatorHeader.tsx

**Responsabilité :** Affichage et édition du titre du sondage

**Props :**
```typescript
interface PollCreatorHeaderProps {
  pollTitle: string;
  onTitleChange: (title: string) => void;
}
```

**Fonctionnalités :**
- Input de titre avec validation
- Indicateur de champ requis
- Optimisé avec `React.memo`

---

### 2. PollCreatorTimeSlots.tsx

**Responsabilité :** Gestion complète des créneaux horaires (desktop + mobile)

**Props :**
```typescript
interface PollCreatorTimeSlotsProps {
  state: PollCreationState;
  timeSlotsByDate: Record<string, TimeSlot[]>;
  getVisibleTimeSlots: () => Array<{hour: number; minute: number; label: string}>;
  getTimeSlotBlocks: (dateStr: string) => Array<{start: TimeSlot; end: TimeSlot}>;
  handleTimeSlotToggle: (dateStr: string, hour: number, minute: number) => void;
  isDragging: boolean;
  handleDragStart: (slot: TimeSlotWithDate, e: React.PointerEvent) => void;
  handleDragMove: (slot: TimeSlotWithDate) => void;
  handleDragEnd: () => void;
  isDraggedOver: (slotKey: string) => boolean;
  formatSlotKey: (slot: TimeSlotWithDate) => string;
  setState: React.Dispatch<React.SetStateAction<PollCreationState>>;
}
```

**Fonctionnalités :**
- Grille desktop et mobile responsive
- Drag-to-extend pour sélection de créneaux
- Paramètres de granularité (15min, 30min, 1h, 2h, 4h)
- Affichage des blocs de créneaux consécutifs
- Bouton "Afficher plus d'horaires"

---

### 3. PollCreatorSettingsPanel.tsx

**Responsabilité :** Panneau de configuration avec onglets (Paramètres + Partage)

**Props :**
```typescript
interface PollCreatorSettingsPanelProps {
  state: PollCreationState;
  timeSlotsByDate: Record<string, TimeSlot[]>;
  setState: React.Dispatch<React.SetStateAction<PollCreationState>>;
  handleEmailInput: (emailString: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Fonctionnalités :**
- Onglet "Paramètres" : Expiration du sondage, connexion Google Calendar
- Onglet "Partage" : Emails des participants, UserMenu
- Utilise le composant `SettingsPanel` existant

---

### 4. PollCreatorCalendarSection.tsx

**Responsabilité :** Section de connexion calendrier et bouton "Horaires"

**Props :**
```typescript
interface PollCreatorCalendarSectionProps {
  state: PollCreationState;
  timeSlotsByDate: Record<string, TimeSlot[]>;
  initialData?: { dateGroups?: Array<{type?: string; dates: string[]}> };
  isAnalyzingCalendar: boolean;
  onToggleTimeSlots: () => void;
  onAnalyzeCalendar: () => void;
  onSetState: React.Dispatch<React.SetStateAction<PollCreationState>>;
}
```

**Fonctionnalités :**
- Affichage conditionnel du bouton "Connecter votre calendrier"
- Indicateur de calendrier connecté
- Bouton "Horaires" (masqué si dates groupées)
- Bouton "Analyser disponibilités" (Google Calendar)

---

### 5. PollCreatorActions.tsx

**Responsabilité :** Boutons d'action (Enregistrer brouillon, Publier)

**Props :**
```typescript
interface PollCreatorActionsProps {
  pollTitle: string;
  selectedDatesCount: number;
  pollLoading: boolean;
  canFinalize: boolean;
  onSaveDraft: () => void;
  onFinalize: () => void;
}
```

**Fonctionnalités :**
- Bouton "Enregistrer le brouillon" avec tooltip
- Bouton "Publier le sondage" avec tooltip
- États désactivés selon validation
- Optimisé avec `React.memo`

---

## 🪝 Hooks Créés

### 1. usePollCreatorState.ts

**Responsabilité :** Gestion de l'état principal du poll creator

**Fonctionnalités :**
- Initialisation depuis `initialData` ou draft localStorage
- Gestion de `pollTitle`, `selectedDates`, `visibleMonths`
- Gestion de `participantEmails`, `timeGranularity`, `expirationDays`
- Synchronisation avec `currentPoll` (édition)
- Gestion des `dateGroups`

**API :**
```typescript
const {
  state,
  setState,
  visibleMonths,
  setVisibleMonths,
  toggleDate,
  handleEmailInput,
  resetPollState,
} = usePollCreatorState({ initialData, editPollId, toast, currentPoll });
```

---

### 2. useTimeSlots.ts

**Responsabilité :** Gestion complète des créneaux horaires

**Fonctionnalités :**
- Initialisation depuis `initialData.timeSlots` ou draft
- Gestion de `timeSlotsByDate` (Record<string, TimeSlot[]>)
- Toggle de créneaux individuels
- Drag-to-extend pour sélection de plages
- Génération des créneaux visibles selon granularité
- Calcul des blocs de créneaux consécutifs
- Intégration avec `useDragToSelect` hook

**API :**
```typescript
const {
  timeSlotsByDate,
  handleTimeSlotToggle,
  getVisibleTimeSlots,
  getTimeSlotBlocks,
  isDragging,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  isDraggedOver,
  formatSlotKey,
} = useTimeSlots({ state, initialData });
```

---

### 3. useCalendarConflicts.ts

**Responsabilité :** Détection et gestion des conflits Google Calendar

**Fonctionnalités :**
- Initialisation de `GoogleCalendarService`
- Détection automatique des conflits (debounce 1.5s)
- Analyse manuelle des conflits (avec toast)
- Utilisation de `CalendarConflictDetector`
- Gestion des conflits par date ou par créneau horaire

**API :**
```typescript
const {
  calendarConflicts,
  setCalendarConflicts,
  isAnalyzingCalendar,
  handleAnalyzeCalendar,
  handleRemoveConflictSlot,
  handleReplaceConflictSlot,
  googleCalendarRef,
} = useCalendarConflicts({ state, timeSlotsByDate, toggleDate, handleTimeSlotToggle });
```

---

### 4. usePollFinalization.ts

**Responsabilité :** Finalisation du poll (création/mise à jour)

**Fonctionnalités :**
- Validation avec `canFinalize()`
- Sauvegarde de brouillon dans localStorage
- Création de nouveau poll via `usePolls().createPoll`
- Mise à jour de poll existant via `pollStorage.addPoll`
- Lien bidirectionnel avec conversations
- Navigation après création

**API :**
```typescript
const {
  canFinalize,
  handleSaveDraft,
  handleFinalize,
  pollLoading,
  pollError,
  createdPoll,
  createdPollSlug,
} = usePollFinalization({ state, timeSlotsByDate, currentPoll, onBack, navigate, toast });
```

---

## 🛠️ Utilitaires Créés

### pollCreatorUtils.ts

**Fonctions utilitaires pures :**
- `formatSlotKey()` : Formate un slot en clé unique
- `createGetSlotsInRange()` : Génère les slots entre deux points

### pollCreatorTypes.ts

**Types et interfaces :**
- `TimeSlot` : Interface pour un créneau horaire
- `PollCreationState` : État complet du poll creator
- Types pour les props des composants

---

## ⚡ Optimisations

### React.memo

Les composants suivants sont optimisés avec `React.memo` :
- ✅ `PollCreator` (composant principal)
- ✅ `PollCreatorHeader`
- ✅ `PollCreatorActions`

### Dépendances Optimisées

- ✅ `useCallback` pour les handlers stables
- ✅ `useMemo` pour les calculs coûteux
- ✅ Dépendances minimales dans les `useEffect`

### Nettoyage

- ✅ Suppression des imports inutilisés
- ✅ Suppression des refs inutilisées
- ✅ Suppression des fonctions mortes

---

## 🧪 Tests

### Tests E2E

**Fichiers testés :**
- ✅ `tests/e2e/ultra-simple-form.spec.ts`
- ✅ `tests/e2e/ultra-simple-poll.spec.ts`

**Résultat :** Tous les tests passent ✅

### Tests Unitaires

**Fichiers testés :**
- ✅ Tous les tests unitaires existants

**Résultat :** Aucune régression détectée ✅

---

## 📊 Métriques

### Avant Refactoring

- **Lignes de code :** 1779
- **Composants :** 1 monolithique
- **Hooks :** 0 (logique dans le composant)
- **Testabilité :** Faible (logique mélangée avec UI)
- **Maintenabilité :** Faible (changements risqués)

### Après Refactoring

- **Lignes de code :** 240 (-87%)
- **Composants :** 6 modulaires (1 principal + 5 sous-composants)
- **Hooks :** 4 hooks personnalisés
- **Testabilité :** Excellente (hooks et composants isolés)
- **Maintenabilité :** Excellente (responsabilités séparées)

---

## 🔄 Migration & Compatibilité

### API Publique

L'API publique du composant `PollCreator` reste **100% compatible** :

```typescript
interface PollCreatorProps {
  onBack?: (createdPoll?: Poll) => void;
  onOpenMenu?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    dates?: string[];
    participants?: string[];
    timeSlots?: Array<{start: string; end: string; dates?: string[]}>;
    dateGroups?: DateGroup[];
  };
  withBackground?: boolean;
}
```

**Aucun breaking change** - Tous les usages existants continuent de fonctionner.

---

## 📝 Bonnes Pratiques Appliquées

1. **Single Responsibility Principle** : Chaque composant/hook a une responsabilité unique
2. **Separation of Concerns** : UI séparée de la logique métier
3. **DRY (Don't Repeat Yourself)** : Code réutilisable via hooks et composants
4. **Testabilité** : Hooks et composants isolés, facilement testables
5. **Performance** : React.memo et dépendances optimisées
6. **Maintenabilité** : Code organisé et documenté

---

## 🚀 Prochaines Étapes (Optionnel)

### Améliorations Possibles

1. **Tests unitaires pour les hooks** : Créer des tests pour chaque hook
2. **Tests de composants** : Tests unitaires pour les sous-composants
3. **Storybook** : Documentation visuelle des composants
4. **Performance monitoring** : Mesurer les gains de performance réels

---

## 📚 Références

- **Plan de refactoring :** `Docs/2. Planning.md` (section PollCreator.tsx)
- **Fichier principal :** `src/components/PollCreator.tsx`
- **Composants :** `src/components/poll-creator/`
- **Hooks :** `src/hooks/usePollCreator*.ts`
- **Utilitaires :** `src/utils/pollCreatorUtils.ts`, `src/types/pollCreatorTypes.ts`

---

**Navigation :** [← Retour Index](./-INDEX.md) | [← Retour Docs](../README.md)

