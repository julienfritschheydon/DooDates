# 🎨 Design System - Style Gemini

Guide de design pour l'interface DooDates inspirée de Google Gemini.

---

## 📊 MISE À JOUR - 9 Décembre 2025

### ✅ Phase 1 : Harmonisation Critique - TERMINÉE

**Nouveaux standards implémentés :**

#### 1. Composants Button Uniformisés

```tsx
// ❌ AVANT - Buttons HTML natifs
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600">Action</button>;

// ✅ APRÈS - Composants Shadcn/ui
import { Button } from "@/components/ui/button";

<Button
  variant="default" // primary, ghost, outline, destructive
  size="sm" // sm, default, lg
  className="bg-blue-500 hover:bg-blue-600"
>
  Action
</Button>;
```

#### 2. Thème Availability Standardisé

```tsx
// ❌ AVANT - Couleurs emerald personnalisées
<Card className="bg-[#1a1a1a] border-gray-800">
  <div className="bg-emerald-500/10 border-emerald-600/30">
    <Check className="w-5 h-5 text-emerald-400" />
  </div>
</Card>

// ✅ APRÈS - Thème sombre uniforme
<Card className="bg-gray-800 border-gray-700">
  <div className="bg-green-500/10 border-green-600/30">
    <Check className="w-5 h-5 text-green-400" />
  </div>
</Card>
```

#### 3. Layout Simplifié - AICreationWorkspace

```tsx
// ❌ AVANT - Layout complexe avec sidebar interne
<div className="flex">
  <div className="w-1/2">Chat</div>
  <div className="w-1/2">Editor + sidebar interne</div>
</div>

// ✅ APRÈS - Plein écran, navigation simplifiée
<div className="w-full">
  {isEditorOpen ? <Editor /> : <Chat />}
</div>
```

---

## 🎯 Palette de Couleurs

### Fonds

- **Sidebar** : `#1e1e1e` (gris sombre)
- **Zone de chat** : `#0a0a0a` (noir profond)
- **Messages utilisateur** : `#3c4043` (gris moyen)
- **Messages IA** : Transparent, texte blanc
- **Input** : `#0a0a0a` (noir profond)

### Accents

- **Icône IA** : `#3b82f6` (blue-500)
- **Boutons principaux** : `#3b82f6` (blue-500)
- **Texte principal** : `#ffffff` (blanc)
- **Texte secondaire** : `#d1d5db` (gray-300)

### Couleurs Thématiques par Produit (post-Phase 1)

```tsx
// Form Polls - Blue
<Button className="bg-blue-600 hover:bg-blue-700 text-white">

// Date Polls - Violet
<Button className="bg-violet-600 hover:bg-violet-700 text-white">

// Availability - Green (standardisé)
<Button className="bg-green-600 hover:bg-green-700 text-white">

// Quizz - Amber
<Button className="bg-amber-600 hover:bg-amber-700 text-white">
```

### Standards de Cartes (post-Phase 1)

```tsx
// Fond sombre uniforme
<Card className="bg-gray-800 border-gray-700 shadow-sm">

// Input standardisé
<Input className="bg-gray-700 border-gray-600 text-white">

// Textarea standardisée
<Textarea className="bg-gray-700 border-gray-600 text-white">
```

## 📐 Layout

### Structure Générale

```
┌─────────────┬──────────────────────┐
│   Sidebar   │    Zone de Chat      │
│  (#1e1e1e)  │     (#0a0a0a)        │
│             │                      │
│  - Burger   │  Header DooDates     │
│  - Nouveau  │  ⚙️ 👤               │
│    chat     │                      │
│             │  Messages            │
│  IA conn.   │                      │
│  Conv 0/10  │  Input (sticky)      │
└─────────────┴──────────────────────┘
```

### Sidebar

- **Largeur** : `w-64` (256px)
- **Fond** : `#1e1e1e`
- **Pas de bordure** à droite
- **Burger icon** en haut
- **"Nouveau chat"** avec icône +
- **Statut en bas** : "IA connectée" + compteur

### Zone de Chat

- **Fond** : `#0a0a0a` (noir)
- **Header** : DooDates à gauche, icônes settings & account à droite
- **Pas de bordures** entre les sections

## 💬 Messages

### Messages Utilisateur

- **Position** : Droite
- **Fond** : `#3c4043`
- **Forme** : `rounded-[20px]`
- **Padding** : `px-5 py-3`
- **Texte** : Blanc
- **Max width** : `80%`

### Messages IA

- **Position** : Gauche
- **Icône** : ⭐ bleue (`#3b82f6`) à gauche
- **Pas de bulle** : Texte directement sur fond noir
- **Texte** : Blanc (`text-gray-100`)

## 🎯 Propositions de Sondage

### Container

- **Fond** : Transparent (noir)
- **Pas de bordure**
- **Espacement** : `space-y-3`

### Cartes de Dates

- **Fond** : `#3c4043` (comme messages utilisateur)
- **Forme** : `rounded-lg`
- **Padding** : `p-3 md:p-4`
- **Texte date** : Blanc
- **Horaires** : Gris clair (`text-gray-300`)
- **Pas de points** bleus
- **Pas d'icônes** horloge
- **Tous les créneaux** affichés horizontalement

### Bouton "Créer ce sondage"

- **Couleur** : `bg-blue-500` (même bleu que l'icône IA)
- **Hover** : `bg-blue-600`
- **Forme** : `rounded-lg`
- **Padding** : `px-4 py-3`
- **Texte** : Blanc, centré
- **Pas d'icône**

## ⌨️ Input

---

## 📝 FICHIERS MODIFIÉS - Phase 1

### Composants Button harmonisés

- `src/pages/AvailabilityPollResults.tsx`
- `src/pages/AvailabilityPollVote.tsx`
- `src/pages/Vote.tsx`
- `src/pages/AuthCallback.tsx`
- `src/pages/PollCreator.tsx`
- `src/components/polls/QuizzVote.tsx`
- `src/components/polls/QuizzResults.tsx`
- `src/components/prototype/AICreationWorkspace.tsx`

### Thème Availability standardisé

- `src/pages/AvailabilityPollCreatorContent.tsx`
  - Background : `bg-[#0a0a0a]` → `bg-gray-900`
  - Cards : `bg-[#1a1a1a]` → `bg-gray-800`
  - Borders : `border-gray-800` → `border-gray-700`
  - Colors : `emerald-*` → `green-*`

### Layout simplifié

- `src/components/prototype/AICreationWorkspace.tsx`
  - Suppression sidebar interne
  - Layout plein écran
  - Header simplifié

---

## 🔄 PROCHAINES ÉTAPES - Phase 2

### À implémenter

1. **Hover states uniformisés** - Même logique de luminosité pour tous les produits
2. **Spacing standardisé** - `pt-8/pt-12` et `max-w-4xl/max-w-6xl` cohérents
3. **Quizz Dashboard** - Harmoniser cartes ou simplifier

### Deadline

- **Phase 2** : 4h restantes
- **Phase 3** : Polish final (bordures, ombres, icônes)

---

## ⌨️ Input (Standards originaux)

### Container

- **Fond** : `#0a0a0a` (noir)
- **Forme** : `rounded-full`
- **Bordure** : `border-gray-700` (liseré clair)
- **Shadow** : `shadow-[0_0_15px_rgba(255,255,255,0.1)]` (glow blanc)
- **Padding** : `p-2`

### Textarea

- **Fond** : `bg-transparent`
- **Texte** : Blanc
- **Placeholder** : `text-gray-400`
- **Padding** : `px-4 py-3`
- **Pas de bordure**

### Bouton Envoyer

- **Fond** : Transparent
- **Icône** : Gris clair
- **Hover** : `bg-gray-700`
- **Forme** : `rounded-full`

## 🎨 Principes de Design

### Minimalisme

- Pas de bordures inutiles
- Pas d'icônes décoratives
- Espaces généreux
- Couleurs sobres

### Cohérence

- Même bleu partout (`#3b82f6`)
- Même gris pour les bulles utilisateur (`#3c4043`)
- Fond noir uniforme pour la zone de chat

### Accessibilité

- Contraste élevé (blanc sur noir)
- Texte lisible (minimum 14px)
- Zones cliquables suffisamment grandes

## 📱 Responsive

### Mobile

- Sidebar cachée par défaut
- Input reste sticky en bas
- Messages prennent 90% de largeur

### Desktop

- Sidebar visible (256px)
- Messages max 80% de largeur
- Input centré (max-w-2xl)

## ✨ Animations

### Transitions

- Hover : `transition-colors`
- Durée : 200ms
- Pas d'animations complexes

### States

- Hover sur boutons : Changement de couleur
- Focus sur input : Pas de ring visible
- Loading : Spinner simple

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-01-27  
**Inspiré de** : Google Gemini
