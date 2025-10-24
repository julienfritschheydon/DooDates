# 🎨 Design System - Style Gemini

Guide de design pour l'interface DooDates inspirée de Google Gemini.

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
