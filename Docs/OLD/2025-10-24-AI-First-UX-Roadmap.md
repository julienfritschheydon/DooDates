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

# 🟢 PHASE 1 : MVP IA-First ✅ TERMINÉE (10-13h | 2-3 semaines)

**Status :** ✅ **COMPLÉTÉE** (27 Oct 2025)  
**Branche :** `feature/ai-first-ux-prototype`

## **Objectif : Prouver le concept, workflow basique fonctionnel**

### **1.1 Chat plein écran landing ✅ TERMINÉ (3-4h)**

### **1.2 Sidebar navigation ✅ TERMINÉ (4-5h)**

### **Responsive ✅ IMPLÉMENTÉ :**

- Desktop : Sidebar fixe 240px
- Tablet : Sidebar collapsible
- Mobile : Sidebar overlay avec backdrop (z-50)
- Mobile : Bouton hamburger + fermeture auto après navigation

### **1.3 Preview live basique ✅ TERMINÉ (3-4h)**

### **Features preview ✅ IMPLÉMENTÉES :**

- ✅ Synchronisation temps réel avec chat (key-based re-rendering)
- ✅ Affichage calendrier/questions selon type
- ✅ Highlight changements récents (animations CSS 3s)
- ✅ Scroll auto vers nouveaux éléments
- ✅ **Toggle automatique Chat ↔ Preview sur mobile** (comme Claude Artifacts)
- ✅ Desktop : Dual-pane permanent (chat + preview côte à côte)

### **🎯 Résultat Phase 1 ✅ ATTEINT**

**Après 10-13h, tu as :**

```
✅ Landing chat plein écran (expérience IA-first)
✅ Sidebar navigation moderne (responsive mobile/desktop)
✅ Workspace avec preview live
✅ Flow création complet IA → Preview
✅ Toggle automatique Chat ↔ Preview sur mobile
✅ Animations highlight sur modifications
✅ Feature flag pour activation progressive
```

**Ce qu'on peut faire ✅ :**

- User arrive → Chat plein écran
- User crée via conversation → Preview s'affiche
- User finalise → Partage
- **Mobile : Toggle fluide entre chat et preview**
- **Desktop : Vue dual-pane permanente**
- **Sidebar responsive avec overlay mobile**

# 🟡 PHASE 2 : Modifications conversationnelles ⚠️ EN COURS (13-14h | 3-4 semaines)

**Status :** 🟡 **PARTIELLEMENT COMPLÉTÉE** (27 Oct 2025)  
**Branche :** `feature/ai-first-ux-prototype`

## **Objectif : Allers-retours IA ↔ Sondage fluides**

### **2.1 Context management ✅ TERMINÉ (2h)**

**Features ✅ IMPLÉMENTÉES :**

- ✅ Mémorisation conversation (ConversationProvider)
- ✅ Référence au poll en cours (currentPoll dans contexte)
- ✅ Contexte pertinent pour Gemini
- ✅ Gestion historique modifications
- ✅ **Persistance automatique** (debounce 500ms dans localStorage)
- ✅ **Restauration après refresh**

### **2.2 Modification sondages via IA ⚠️ PARTIELLEMENT TERMINÉ (8h réalisées)**

**✅ Commandes supportées (Date Polls) :**

- ✅ "Ajoute le 27/10/2025" (6+ formats de dates)
- ✅ "Retire le 28"
- ✅ "Renomme en Apéro vendredi"
- ✅ "Ajoute 12h-14h le 28"
- ✅ Détection doublons automatique

**✅ Commandes partiellement supportées (Form Polls) :**

- ✅ "Ajoute une question sur le prix" (via Gemini complet)
- ✅ "Retire la question 3" (pas de détection intention)
- ✅ "Change Q2 en choix multiple" (pas de détection intention)
- ✅ "Rends Q4 conditionnelle si Q2 = Oui" (pas de détection intention)
- ✅ "Ajoute option 'Autre' à Q1" (pas de détection intention)

**Architecture implémentée :**

- ✅ **Reducer centralisé** (pollReducer + formPollReducer) - Pattern Redux-like
- ✅ **Service de détection d'intentions** (IntentDetectionService) - Regex rapides
- ✅ **60 tests automatisés** (100% passent)
- ✅ **5 actions Date Polls** : ADD_DATE, REMOVE_DATE, UPDATE_TITLE, ADD_TIMESLOT, REPLACE_POLL
- ⚠️ **Form Polls** : Passe par Gemini complet (pas de détection intentions spécifiques)

### **2.3 Preview réactive avancée ✅ TERMINÉ (5-6h)**

**Features ✅ IMPLÉMENTÉES :**

- ✅ **Animations highlight** (3 couleurs : vert=add, bleu=modify, rouge=remove)
- ✅ Animations transitions fluides (3 cycles de 1s)
- ✅ Scroll auto vers changement
- ✅ Key-based re-rendering pour sync temps réel
- ✅ Reducer retourne `_highlightedId` + `_highlightType`
- ✅ Timer 3s automatique pour retirer animation

### **🎯 Résultat Phase 2 ✅ ATTEINT**

**Après ~16h réalisées (total 26-29h), tu as :**

```
✅ Modifications conversationnelles fluides (Date Polls)
✅ Preview réactive avec highlights (animations 3 couleurs)
✅ Contexte conversation persistant (avec sauvegarde auto)
✅ Modifications Form Polls (via Gemini complet, pas granulaire)
```

**Expérience utilisateur actuelle :**

**✅ Date Polls (fonctionnel) :**

```
User: "Crée un sondage pour réunion équipe mardi ou mercredi"
IA: [Crée sondage avec dates 28 et 29 octobre]

User: "Ajoute 12h-14h le 28"
IA: ✅ Ajout du créneau 12:00-14:00 le 28/10/2025

User: "Retire le 28"
IA: ✅ Suppression de la date 28/10/2025

User: "Renomme en Apéro vendredi"
IA: ✅ Titre modifié en "Apéro vendredi"
```

**✅ Form Polls (partiellement fonctionnel) :**

```
User: "Crée un questionnaire satisfaction client"
IA: [Crée questionnaire complet via Gemini]

User: "Ajoute une question sur le prix"
IA: [Régénère tout le questionnaire via Gemini] ← Lent, pas granulaire

User: "Retire la question 3"
IA: [Régénère tout via Gemini] ← Pas de détection intention spécifique
```

**C'est déjà une expérience IA-first solide pour Date Polls !** 🎉

---

# 🔴 PHASE 3 : Expérience IA complète (32-40h | 4-6 semaines)
