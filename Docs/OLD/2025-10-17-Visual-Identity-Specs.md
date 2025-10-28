# DooDates - Spécifications Identités Visuelles

## 🎯 Stratégie Multi-Identités

**Concept :** 3 identités visuelles pour 3 types d'utilisateurs
- Chaque utilisateur peut choisir son thème au premier lancement
- Personnalisation complète de l'expérience
- Brand cohérent mais adaptable

---

## 1. IDENTITÉ "PRO/CORPORATE" 💼

### Public cible
- Entreprises, RH, managers
- Recrutement, réunions clients
- Besoins : Crédibilité, sérieux, efficacité

### Palette de couleurs
**Primaires :**
- Bleu marine profond : `#1E3A5F` (principal)
- Gris ardoise : `#2C3E50` (secondaire)
- Blanc cassé : `#F8F9FA` (background)

**Accents :**
- Bleu électrique : `#3B82F6` (CTAs, liens)
- Vert menthe : `#10B981` (succès, validation)
- Rouge discret : `#EF4444` (erreurs)

### Typographie
**Headlines :**
- Police : Inter ou Poppins
- Poids : 600-700 (Semi-bold/Bold)
- Casse : Sentence case
- Exemple : "Planifiez vos réunions en 2 minutes"

**Body :**
- Police : Inter ou System UI
- Poids : 400-500 (Regular/Medium)
- Taille : 14-16px
- Line-height : 1.6

**UI Elements :**
- Police : SF Pro ou Segoe UI (native)
- Poids : 500 (Medium)
- Taille : 13-14px

### Style visuel
**Formes :**
- Cartes : Coins arrondis 8-12px (subtils)
- Boutons : Rectangle coins arrondis 6px
- Inputs : Bordures fines 1px, coins 6px
- Pas de formes organiques

**Ombres :**
- Cartes : `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Boutons hover : `box-shadow: 0 4px 12px rgba(59,130,246,0.15)`
- Élevation subtile, jamais dramatique

**Icônes :**
- Style : Outline/Stroke (Lucide, Heroicons)
- Épaisseur : 1.5-2px
- Taille : 20-24px
- Jamais de couleurs vives dans icônes

**Espacement :**
- Grid : 8px base (multiples de 8)
- Padding cartes : 24-32px
- Gap entre éléments : 16-24px
- Marges généreuses, air respirable

### Composants UI
**Boutons primaires :**
- Background : Bleu électrique `#3B82F6`
- Texte : Blanc
- Hover : Bleu plus foncé `#2563EB`
- Padding : 12px 24px
- Font-weight : 500

**Boutons secondaires :**
- Background : Transparent
- Bordure : 1px solid `#E5E7EB`
- Texte : Gris foncé `#374151`
- Hover : Background `#F9FAFB`

**Inputs :**
- Background : Blanc
- Bordure : 1px solid `#D1D5DB`
- Focus : Bordure bleu `#3B82F6`, shadow subtile
- Placeholder : Gris moyen `#9CA3AF`

**Calendrier :**
- Grid propre et aéré
- Jours disponibles : Background bleu clair `#EFF6FF`
- Jour sélectionné : Background bleu `#3B82F6`, texte blanc
- Hover : Background gris clair `#F3F4F6`

### Animations
- Transitions : 150-200ms cubic-bezier(0.4, 0, 0.2, 1)
- Pas d'animations fantaisistes
- Hover effects subtils (scale 1.02 max)
- Focus states clairs (outline + shadow)

### Ton et voix
**Titres :** Directs, professionnels
- ✅ "Planifiez votre réunion"
- ❌ "C'est parti pour ton event !"

**Textes :** Clairs, concis, pas de jargon
- ✅ "Sélectionnez vos disponibilités"
- ❌ "Balance tes dispos !"

**Microcopy :** Informatif, jamais infantilisant
- ✅ "3 participants ont voté"
- ❌ "Waouh, 3 votes déjà ! 🎉"

### Prompt génération visuelle
```
Interface web application moderne et professionnelle pour outil de planification, 
design corporate minimaliste, palette bleu marine (#1E3A5F) et bleu électrique (#3B82F6),
typographie Inter clean, cartes avec ombres subtiles, grille calendrier épurée,
espacement généreux, style SaaS premium comme Linear ou Notion,
fond blanc cassé (#F8F9FA), boutons arrondis subtils (6-8px),
icônes outline style Lucide, interface desktop moderne,
esthétique professionnelle sans être austère, crédible pour entreprises
```

---

## 2. IDENTITÉ "TIKTOK/GEN Z" 🎨

### Public cible
- 16-28 ans, digital natives
- Événements sociaux, soirées, activités entre amis
- Besoins : Fun, rapide, viral

### Palette de couleurs
**Primaires :**
- Violet néon : `#A855F7` (principal)
- Rose vif : `#EC4899` (secondaire)
- Cyan électrique : `#06B6D4` (tertiaire)
- Noir profond : `#0F0F0F` (background)

**Accents :**
- Jaune fluo : `#FBBF24` (highlights)
- Vert lime : `#84CC16` (succès)
- Orange : `#F97316` (CTAs secondaires)

**Dégradés :**
- Principal : Violet → Rose `linear-gradient(135deg, #A855F7 0%, #EC4899 100%)`
- Secondaire : Cyan → Violet `linear-gradient(135deg, #06B6D4 0%, #A855F7 100%)`
- Tertiaire : Rose → Orange `linear-gradient(135deg, #EC4899 0%, #F97316 100%)`

### Typographie
**Headlines :**
- Police : Montserrat Black ou Archivo Black
- Poids : 800-900 (Extra-bold/Black)
- Casse : ALL CAPS pour titres principaux
- Exemple : "CRÉE TON EVENT EN 30 SEC"

**Body :**
- Police : DM Sans ou Plus Jakarta Sans
- Poids : 400-600 (Regular/Semi-bold)
- Taille : 15-17px (légèrement plus gros)
- Line-height : 1.5

**UI Elements :**
- Police : DM Sans Bold
- Poids : 700 (Bold)
- Mots clés en couleur/gradient

### Style visuel
**Formes :**
- Cartes : Coins très arrondis 20-24px
- Boutons : Pilules complètes (border-radius: 9999px)
- Inputs : Coins arrondis 16px
- Formes organiques/blobs en background

**Ombres :**
- Ombres colorées et prononcées
- Cartes : `box-shadow: 0 8px 32px rgba(168,85,247,0.25)`
- Boutons : Glow effect `box-shadow: 0 0 24px rgba(236,72,153,0.6)`
- Ombres qui "respirent" (pulse animation)

**Icônes :**
- Style : Filled/Solid avec gradients
- Taille : 24-32px (plus gros)
- Couleurs vives, souvent en gradient
- Style playful (pas corporate)

**Espacement :**
- Plus compact, plus dense
- Padding cartes : 16-24px
- Gap : 12-16px
- Moins d'air, plus de contenu visible

### Composants UI
**Boutons primaires :**
- Background : Gradient violet-rose
- Texte : Blanc bold
- Hover : Scale 1.05 + glow effet
- Padding : 14px 28px
- Animation : Pulse au hover

**Boutons secondaires :**
- Background : Noir avec bordure gradient
- Texte : Gradient
- Hover : Background gradient subtil
- Border : 2px gradient

**Inputs :**
- Background : Noir `#1A1A1A` avec glow
- Bordure : 2px gradient (focus)
- Placeholder : Gradient text
- Focus : Glow coloré intense

**Calendrier :**
- Grid avec gradients
- Jours disponibles : Background gradient subtil
- Jour sélectionné : Gradient full + glow
- Hover : Scale 1.1 + color shift
- Animations entre états (morph)

### Animations
- Transitions rapides : 100-150ms
- Micro-interactions partout
- Hover : Scale, rotate, glow
- Success : Confetti explosion, particles
- Loading : Animated gradients, pulse
- Scroll : Parallax subtil

### Effets spéciaux
**Glassmorphism :**
```css
background: rgba(15, 15, 15, 0.6);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

**Glow buttons :**
```css
box-shadow: 
  0 0 20px rgba(168, 85, 247, 0.5),
  0 0 40px rgba(236, 72, 153, 0.3),
  inset 0 0 20px rgba(255, 255, 255, 0.1);
```

**Animated gradient background :**
- Gradient qui bouge lentement
- Blobs animés en arrière-plan
- Particles flottantes (optionnel)

### Ton et voix
**Titres :** Énergiques, directs, caps
- ✅ "CRÉE TON EVENT"
- ✅ "BALANCE TES DISPOS"
- ❌ "Planifiez votre réunion"

**Textes :** Casual, fun, émojis
- ✅ "Choisis tes dates 📅✨"
- ✅ "Ton sondage est prêt ! 🚀"
- ❌ "Sélectionnez vos disponibilités"

**Microcopy :** Hype, encourageant
- ✅ "Yaaas ! 3 potes ont voté 🔥"
- ✅ "C'est parti ! 💜"
- ❌ "3 participants ont répondu"

### Prompt génération visuelle
```
Interface mobile-first ultra moderne style TikTok/Gen Z,
dark mode avec gradients vibrants violet (#A855F7) rose (#EC4899) cyan (#06B6D4),
typographie Montserrat Black en caps, boutons pilules avec glow effects,
glassmorphism et neumorphism, ombres colorées prononcées,
coins très arrondis (20-24px), icônes filled colorées,
background noir (#0F0F0F) avec blobs animés gradient,
effet néon et glow partout, style Spotify/Instagram/TikTok moderne,
énergique et vibrant, animations micro-interactions,
emojis intégrés, confetti particles, ultra saturé en couleurs
```

---

## 3. IDENTITÉ "NATURE/COZY" 🌿

### Public cible
- Créatifs, freelances, bien-être
- Événements communautaires, ateliers, rencontres informelles
- Besoins : Chaleur, authenticité, calme

### Palette de couleurs
**Primaires :**
- Vert sauge : `#87A878` (principal)
- Terre cuite : `#C07855` (secondaire)
- Beige chaud : `#F5F1E8` (background)
- Crème : `#FFFDF7` (surfaces)

**Accents :**
- Vert forêt : `#4A6741` (textes foncés)
- Ocre doré : `#D4A574` (highlights)
- Bois : `#8B6F47` (éléments secondaires)
- Blanc cassé : `#FEFCF9` (cards)

**Dégradés naturels :**
- Aube : Crème → Pêche doux `linear-gradient(135deg, #FFFDF7 0%, #F9E5D8 100%)`
- Forêt : Vert clair → Vert moyen `linear-gradient(135deg, #A8C5A0 0%, #87A878 100%)`

### Typographie
**Headlines :**
- Police : Merriweather, Lora (serif organique)
- OU : Outfit, Space Grotesk (sans-serif chaleureux)
- Poids : 500-600 (Medium/Semi-bold)
- Casse : Sentence case naturelle
- Exemple : "Plantons une date ensemble"

**Body :**
- Police : Inter ou Satoshi (lisible, chaleureux)
- Poids : 400-500 (Regular/Medium)
- Taille : 15-16px (confortable)
- Line-height : 1.7 (aéré, lecture agréable)

**UI Elements :**
- Police : Outfit ou DM Sans
- Poids : 500 (Medium)
- Letterspacing légèrement augmenté (+0.01em)

### Style visuel
**Formes :**
- Cartes : Coins arrondis organiques 16-20px
- Boutons : Formes légèrement irrégulières (border-radius variable)
- Inputs : Coins doux 12px
- Formes organiques inspirées nature (feuilles, galets)

**Textures :**
- Background : Texture papier recyclé subtile
- Cartes : Légère grain texture
- Boutons : Effet mat, pas glossy
- Noise subtil (5-10% opacity) pour profondeur

**Ombres :**
- Douces et diffuses (lumière naturelle)
- Cartes : `box-shadow: 0 4px 24px rgba(74,103,65,0.08)`
- Boutons : Ombre portée naturelle `0 2px 8px rgba(0,0,0,0.1)`
- Jamais d'ombres dures

**Icônes :**
- Style : Dessinés main (Phosphor Duotone style)
- OU : Outline adoucis (pas géométriques)
- Couleurs terre/nature
- Taille : 22-26px
- Stroke légèrement irrégulier

**Espacement :**
- Très généreux, respiration
- Padding cartes : 32-40px
- Gap : 24-32px
- White space = zen

### Composants UI
**Boutons primaires :**
- Background : Vert sauge `#87A878`
- Texte : Crème `#FFFDF7`
- Hover : Vert légèrement plus foncé + lift subtil
- Padding : 14px 28px
- Border-radius : 12px
- Texture mat

**Boutons secondaires :**
- Background : Transparent
- Bordure : 1.5px solid Ocre `#D4A574`
- Texte : Vert forêt `#4A6741`
- Hover : Background beige très léger

**Inputs :**
- Background : Blanc cassé `#FEFCF9`
- Bordure : 1.5px solid Ocre clair `#E8D4B8`
- Focus : Bordure vert sauge, glow doux vert
- Placeholder : Bois clair `#A89A82`
- Texture papier subtile

**Calendrier :**
- Grid organique (pas rigide)
- Jours disponibles : Background vert très clair `#F2F6F0`
- Jour sélectionné : Background vert sauge, texte crème
- Hover : Transition douce, scale 1.03
- Coins arrondis pour chaque jour

### Illustrations & Éléments déco
**Style :**
- Illustrations line-art dessinées main
- Plantes, feuilles en décoration
- Icônes de saison (soleil, lune, nuages)
- Pas de photos, illustrations uniquement

**Éléments :**
- Petite feuille en coin de carte
- Branche décorative en header
- Confetti végétaux au succès (feuilles qui tombent)
- Bordures organiques (pas droites)

### Animations
- Transitions lentes : 300-400ms ease-in-out
- Mouvements fluides, organiques
- Hover : Lift doux + léger scale
- Success : Feuilles qui tombent doucement
- Loading : Croissance végétale (progress bar = pousse)
- Pas de mouvements brusques

### Effets spéciaux
**Paper texture :**
```css
background-image: url('data:image/svg+xml,...'); /* noise grain */
opacity: 0.03;
```

**Soft glow (natural light) :**
```css
box-shadow: 
  0 0 40px rgba(135, 168, 120, 0.1),
  0 4px 20px rgba(74, 103, 65, 0.08);
```

**Organic shapes :**
- Blobs SVG avec border-radius irréguliers
- Formes inspirées feuilles, galets
- Asymétrie subtile

### Ton et voix
**Titres :** Chaleureux, invitants
- ✅ "Plantons une date ensemble"
- ✅ "Cultivons votre événement"
- ❌ "CRÉE TON EVENT"

**Textes :** Doux, bienveillants, métaphores nature
- ✅ "Laissez pousser vos disponibilités 🌱"
- ✅ "Votre sondage prend racine"
- ❌ "Sélectionnez vos créneaux"

**Microcopy :** Encourageant, organique
- ✅ "3 personnes ont fait germer des idées 🌿"
- ✅ "Votre réunion prend forme naturellement"
- ❌ "3 participants ont voté"

### Vocabulaire thématique
- "Planter" au lieu de "Créer"
- "Cultiver" au lieu de "Gérer"
- "Faire germer" au lieu de "Lancer"
- "Récolter" au lieu de "Consulter résultats"
- "Racines" pour historique/base
- "Branches" pour options multiples

### Prompt génération visuelle
```
Interface web design style cozy/nature/organic, palette terre naturelle
avec vert sauge (#87A878) terre cuite (#C07855) beige chaud (#F5F1E8),
typographie serif Merriweather ou sans-serif chaleureux Outfit,
texture papier recyclé subtile, ombres douces diffuses,
coins arrondis organiques (16-20px), illustrations line-art dessinées main,
éléments décoratifs végétaux (feuilles, branches), icônes style hand-drawn,
espacement très généreux et aéré, effet mat pas glossy,
inspiration hygge/slow living/mindfulness, chaleureux et apaisant,
style Notion meets Headspace meets Instagram aesthetic nature,
grain texture subtil, formes organiques asymétriques,
ambiance cozy café ou atelier d'artiste, lumière naturelle douce
```

---

## 3. IDENTITÉ "MINIMALISTE" (LIGHT + DARK) ⚪⚫

### Public cible
- Power users, professionnels, créatifs
- Sessions longues de travail
- Usage fréquent, multiples sondages
- Besoins : Focus, épuré, performant

### **🎯 STRATÉGIE FREEMIUM**
```
Thème Nature (gratuit)   → Acquisition grand public
Thème Minimaliste (payant) → Conversion power users
```

**Différenciation visuelle = Justification paiement tangible**

---

## 3A. MINIMALISTE LIGHT ☀️

### Palette de couleurs
**Primaires :**
- Blanc pur : `#FFFFFF` (background principal)
- Gris warm : `#F7F7F5` (surfaces élevées)
- Noir doux : `#1A1A1A` (textes principaux)
- Gris charcoal : `#2D2D2D` (textes secondaires)

**Accent DooDates (unique, PAS bleu générique) :**
- Coral moderne : `#FF6B6B` (CTAs, focus, sélection)
- OU Mint électrique : `#4ECDC4` (alternative)
- **Choix final : Coral** (chaleureux, mémorable, pas corporate)

**Secondaires :**
- Gris 50 : `#FAFAFA` (background alternate)
- Gris 200 : `#E8E8E6` (borders, dividers)
- Gris 400 : `#9E9E9C` (placeholders, disabled)
- Gris 500 : `#737373` (textes tertiaires)

**États :**
- Success : `#00D4AA` (mint, pas vert basique)
- Warning : `#FFA726` (orange doux)
- Error : `#FF5252` (rouge vif mais pas agressif)
- Info : `#42A5F5` (bleu ciel unique)

### Typographie
**Headlines :**
- Police : **Geist** ou **Satoshi** (moderne, pas Inter générique)
- Poids : 600-700 (Semi-bold/Bold)
- Casse : Sentence case
- Tracking : -0.02em (légèrement serré)
- Exemple : "Vos sondages récents"

**Body :**
- Police : Geist ou System UI
- Poids : 400-500 (Regular/Medium)
- Taille : 15-16px (confortable)
- Line-height : 1.6
- Color : `#1A1A1A`

**UI Elements :**
- Police : Geist Medium
- Poids : 500
- Taille : 13-14px
- Tracking : 0 (naturel)

**Monospace (codes, données) :**
- Police : **Geist Mono** ou JetBrains Mono
- Usage : Liens, codes, IDs

### Style visuel
**Principes design :**
- **Maximaliste sur white space** (respiration maximale)
- **Minimaliste sur éléments** (essentiels uniquement)
- **Pas de cards 3D** (dividers subtils only)
- **1 seul accent couleur** (coral partout)
- **Flat design moderne** (pas de skeuomorphisme)

**Formes :**
- Boutons : Rectangle coins arrondis 8px (subtils)
- Inputs : Coins arrondis 6px
- Pas de cartes avec ombres lourdes
- Dividers : 1px solid `#E8E8E6`
- Borders : Toujours subtiles (1px max)

**Ombres (minimalistes) :**
- Quasi inexistantes
- Si nécessaire : `box-shadow: 0 1px 3px rgba(0,0,0,0.04)`
- Hover : `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
- **Jamais de glow, jamais de colored shadows**

**Icônes :**
- Style : **Outline/Stroke** (Lucide ou Phosphor)
- Épaisseur : 1.5px (délicat)
- Taille : 20-24px
- Couleur : `#737373` (gris neutre)
- Hover : `#FF6B6B` (coral)
- Pas de filled icons sauf états actifs

**Espacement :**
- Grid : 4px base (multiples de 4)
- Padding conteneurs : 24-32px
- Gap entre sections : 48-64px
- Gap entre éléments : 16-24px
- Marges très généreuses (air respirable)

### Composants UI
**Boutons primaires :**
```css
background: #FF6B6B (coral)
color: #FFFFFF
padding: 12px 24px
border-radius: 8px
font-weight: 500
transition: all 150ms ease

hover:
  background: #FF5252
  transform: translateY(-1px)
```

**Boutons secondaires :**
```css
background: transparent
border: 1px solid #E8E8E6
color: #1A1A1A
padding: 12px 24px
border-radius: 8px

hover:
  border-color: #FF6B6B
  color: #FF6B6B
```

**Boutons ghost :**
```css
background: transparent
border: none
color: #737373
padding: 8px 16px

hover:
  color: #FF6B6B
  background: #FAFAFA
```

**Inputs :**
```css
background: #FFFFFF
border: 1px solid #E8E8E6
padding: 10px 16px
border-radius: 6px
font-size: 15px

focus:
  border-color: #FF6B6B
  outline: none
  box-shadow: 0 0 0 3px rgba(255,107,107,0.1)

placeholder:
  color: #9E9E9C
```

**Calendrier :**
- Grid épurée, pas de bordures lourdes
- Jours disponibles : Background `#FAFAFA`
- Jour hover : Background `#F7F7F5`
- Jour sélectionné : Background `#FF6B6B`, texte blanc
- Aujourd'hui : Border `#FF6B6B` 2px
- Transitions : 100ms ease

**Navigation / Sidebar :**
```css
background: #FFFFFF
border-right: 1px solid #E8E8E6
width: 240px

items:
  padding: 10px 16px
  border-radius: 6px
  color: #737373
  
  hover:
    background: #FAFAFA
    color: #1A1A1A
  
  active:
    background: rgba(255,107,107,0.1)
    color: #FF6B6B
```

### Animations
- Transitions : 150ms cubic-bezier(0.4, 0, 0.2, 1)
- Pas d'animations complexes
- Hover : translateY(-1px) max
- Focus : Scale 1.01 max
- Tout est subtil et rapide

### Ton et voix
**Titres :** Clairs, directs, chaleureux
- ✅ "Vos sondages"
- ✅ "Créer un sondage"
- ❌ "CRÉE TON EVENT"

**Textes :** Précis, concis, pas corporate froid
- ✅ "3 réponses reçues"
- ✅ "Partagez le lien"
- ❌ "Veuillez sélectionner vos disponibilités"

**Microcopy :** Utile, pas bavard
- ✅ "Copié !"
- ✅ "Sondage créé"
- ❌ "Félicitations ! Votre sondage a été créé avec succès !"

### Prompt génération visuelle
```
Interface web application ultra minimaliste moderne style 2025,
design system épuré maximaliste sur white space,
palette monochrome blanc pur (#FFFFFF) gris warm (#F7F7F5) noir doux (#1A1A1A),
accent unique coral moderne (#FF6B6B) utilisé avec parcimonie,
typographie Geist ou Satoshi clean (-0.02em tracking),
pas de cards 3D ni ombres lourdes, dividers subtils 1px,
boutons flat coins arrondis 8px, icônes outline 1.5px style Lucide,
espacement très généreux (48-64px entre sections),
grid calendrier épuré sans bordures lourdes,
sidebar 240px avec navigation minimaliste,
esthétique Apple/Linear/Arc Browser, élégant et zen,
fond blanc immaculé, 1 seul accent couleur coral,
interface desktop moderne, respiration maximale,
pas de décorations superflues, essence du minimalisme
```

---

## 3B. MINIMALISTE DARK 🌙

### Palette de couleurs
**Primaires :**
- Noir pur : `#000000` (background principal)
- Noir élevé : `#0A0A0A` (surfaces élevées)
- Gris foncé : `#1A1A1A` (cards, modals)
- Blanc pur : `#FFFFFF` (textes principaux)
- Gris clair : `#E5E5E5` (textes secondaires)

**Accent DooDates :**
- Mint néon : `#00FFA3` (électrique mais subtil, PAS violet)
- OU Coral clair : `#FF8A80` (version light du coral)
- **Choix final : Mint néon** (contraste maximal sur noir)

**Secondaires :**
- Gris 900 : `#0F0F0F` (background alternate)
- Gris 800 : `#1F1F1F` (borders, dividers)
- Gris 600 : `#525252` (borders hover)
- Gris 400 : `#A0A0A0` (placeholders, disabled)

**États :**
- Success : `#00FFA3` (mint, réutilise accent)
- Warning : `#FFB800` (jaune doré)
- Error : `#FF6B6B` (coral, cohérence Light)
- Info : `#60A5FA` (bleu clair)

### Typographie
**Identique à Light :**
- Police : Geist ou Satoshi
- Poids : 400-700 selon usage
- Mais couleurs inversées (blanc sur noir)

### Style visuel
**Principes (identiques Light) :**
- Maximaliste sur white space
- Minimaliste sur éléments
- Flat design, pas de glow lourd
- 1 seul accent couleur (mint)

**Différences clés vs TikTok dark :**
| TikTok Dark | Minimaliste Dark |
|-------------|------------------|
| Gradients partout | Flat monochrome |
| Multi-couleurs néon | 1 accent mint |
| Glow effects lourds | Glow subtil minimal |
| Playful chaos | Élégant zen |
| Saturé | Sobre |

**C'est du "Apple dark mode" pas du "TikTok dark mode"** ✨

**Formes :**
- Identiques à Light (coins 6-8px)
- Borders : `#1F1F1F` au lieu de `#E8E8E6`

**Ombres (quasi inexistantes) :**
- Préférer borders subtiles aux ombres
- Si nécessaire : `box-shadow: 0 0 0 1px rgba(255,255,255,0.05)`
- Glow accent minimal : `box-shadow: 0 0 20px rgba(0,255,163,0.15)` (parcimonieux)

**Icônes :**
- Style : Outline 1.5px
- Couleur : `#A0A0A0` (gris moyen)
- Hover : `#00FFA3` (mint)

### Composants UI
**Boutons primaires :**
```css
background: #00FFA3 (mint)
color: #000000 (noir, contraste max)
padding: 12px 24px
border-radius: 8px
font-weight: 600

hover:
  background: #00E694
  box-shadow: 0 0 20px rgba(0,255,163,0.3)
```

**Boutons secondaires :**
```css
background: transparent
border: 1px solid #1F1F1F
color: #FFFFFF
padding: 12px 24px
border-radius: 8px

hover:
  border-color: #00FFA3
  color: #00FFA3
```

**Inputs :**
```css
background: #0A0A0A
border: 1px solid #1F1F1F
color: #FFFFFF
padding: 10px 16px
border-radius: 6px

focus:
  border-color: #00FFA3
  box-shadow: 0 0 0 3px rgba(0,255,163,0.1)

placeholder:
  color: #525252
```

**Calendrier :**
- Background principal : `#000000`
- Jours disponibles : Background `#0F0F0F`
- Jour hover : Background `#1A1A1A`
- Jour sélectionné : Background `#00FFA3`, texte noir
- Aujourd'hui : Border `#00FFA3` 2px
- Grid lines : `#1F1F1F` 1px

**Navigation / Sidebar :**
```css
background: #000000
border-right: 1px solid #1F1F1F
width: 240px

items:
  color: #A0A0A0
  
  hover:
    background: #0F0F0F
    color: #FFFFFF
  
  active:
    background: rgba(0,255,163,0.1)
    color: #00FFA3
```

### Différenciation clé
**Ce qui rend Minimaliste Dark unique (vs autres dark modes) :**
1. **Mono-couleur accent** (mint uniquement, pas rainbow)
2. **Flat total** (pas de glassmorphism, pas de glow lourd)
3. **Espacement identique Light** (même grid, même respiration)
4. **Élégance Apple** (pas clubbing TikTok)
5. **Performance** (pas d'effets coûteux)

### Ton et voix
**Identique Light :** Clair, direct, chaleureux (mais en dark)

### Prompt génération visuelle
```
Interface web application dark mode ultra minimaliste moderne 2025,
design épuré maximaliste sur white space style Apple/Arc Browser,
palette monochrome noir pur (#000000) gris foncé (#1A1A1A) blanc (#FFFFFF),
accent unique mint néon (#00FFA3) utilisé avec parcimonie,
typographie Geist ou Satoshi blanche sur noir,
pas de gradients ni glow effects lourds, flat design pur,
dividers subtils 1px gris foncé (#1F1F1F),
boutons flat coins arrondis 8px, icônes outline blanches 1.5px,
espacement très généreux identique version light,
grid calendrier épuré fond noir, sidebar 240px minimaliste,
esthétique Apple dark mode meets Linear meets Arc Browser,
élégant et zen, pas de décorations, essence minimalisme,
contraste élevé mais confortable, pas de fatigue oculaire,
différent du dark mode TikTok (pas de multi-couleurs néon),
interface desktop moderne, mono-accent mint électrique
```

---

## 🎨 GUIDE D'UTILISATION POUR GÉNÉRATION

### Prompts combinés pour variations

**Pour un mockup complet d'interface :**
```
[PROMPT DE L'IDENTITÉ CHOISIE]
+ Vue: [page calendrier / dashboard / page création sondage / page résultats]
+ Format: Desktop [1920x1080] ou Mobile [375x812]
+ Éléments: [calendrier, formulaire, boutons CTA, cards résultats, navigation]
+ Style: Mockup haute fidélité, UI moderne 2025, design system cohérent
```

**Exemple prompt complet (Nature) :**
```
Interface web design style cozy/nature/organic, palette terre naturelle
avec vert sauge (#87A878) terre cuite (#C07855) beige chaud (#F5F1E8),
typographie serif Merriweather, texture papier recyclé subtile,
coins arrondis organiques (16-20px), illustrations line-art végétales,
page création de sondage avec formulaire questions, calendrier sélection dates,
boutons mat vert sauge, éléments décoratifs feuilles en coins,
desktop 1920x1080, UI moderne 2025, espacement généreux,
ambiance cozy et apaisante, lumière naturelle douce,
mockup haute fidélité prêt pour développement
```

---

## 🔄 COMPOSANTS COMMUNS (tous thèmes)

Ces éléments restent fonctionnellement identiques, seul le style change :

### Navigation
- Logo DooDates (stylisé selon thème)
- Menu : Créer / Mes sondages / Résultats
- Bouton compte utilisateur
- [Optionnel] Sélecteur de thème

### Page création sondage
- Titre du sondage (input)
- Type : Sondage dates / Questionnaire
- Calendrier sélection dates (si sondage dates)
- OU Formulaire questions (si questionnaire)
- Preview en temps réel
- Bouton "Finaliser" (CTA principal)

### Page vote
- Titre sondage
- Nom participant (input)
- Grille disponibilités (sondage dates)
- OU Questions formulaire (questionnaire)
- Bouton "Valider mon vote"

### Page résultats
- Titre + métadonnées (participants, date création)
- Graphique résultats (barres/calendrier)
- Liste participants et leurs votes
- Boutons export (CSV, PDF, etc.)

### Dashboard
- Liste sondages créés (cards)
- Filtres / Tri
- Stats rapides (participants, votes)
- Bouton "Nouveau sondage" (CTA)

---

## 📱 RESPONSIVE (tous thèmes)

### Mobile-first considerations
- Navigation bottom bar sur mobile
- Cards full-width
- Calendrier grille adaptée (max 7 colonnes)
- Boutons full-width sur mobile
- Spacing réduit mais proportionnel

### Breakpoints
- Mobile : 320-767px
- Tablet : 768-1023px
- Desktop : 1024px+

---

## ✅ CHECKLIST POUR LÉA

Pour chaque identité, générer :

1. **Landing page hero section** (Desktop)
   - Header + navigation
   - Hero title + CTA
   - Visual principal (calendrier ou illustration)

2. **Page création sondage** (Desktop)
   - Formulaire complet
   - Calendrier interactif
   - Sidebar preview

3. **Page résultats** (Desktop)
   - Graphique/tableau résultats
   - Liste participants
   - Actions (partage, export)

4. **Dashboard** (Desktop)
   - Liste cards sondages
   - Stats overview
   - Navigation

5. **Vue mobile** (1-2 screens essentiels)
   - Navigation mobile
   - Création sondage mobile
   - Vote mobile

6. **Composants UI isolés** (si besoin)
   - Boutons (tous états)
   - Inputs / Forms
   - Cards
   - Calendrier
   - Graphiques

---

## 🎯 PROCHAINES ÉTAPES

1. Léa génère les visuels pour les 3 identités
2. Tu choisis l'identité principale (ou on garde les 3 ?)
3. On crée le design system complet
4. Implémentation en code (Tailwind + composants)
5. Tests utilisateurs pour valider préférence

**Besoin de précisions sur un thème ? Demande-moi !** 🚀
