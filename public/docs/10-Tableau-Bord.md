# 📊 Tableau de Bord (Dashboard)

Guide complet du dashboard DooDates pour gérer tous vos sondages efficacement.

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Navigation](#navigation)
3. [Liste des Sondages](#liste-des-sondages)
4. [Filtres et Recherche](#filtres-et-recherche)
5. [Actions Rapides](#actions-rapides)
6. [Statistiques Globales](#statistiques-globales)
7. [Organisation](#organisation)

---

## 🎯 Vue d'Ensemble

Le **Dashboard** est votre centre de contrôle pour gérer tous vos sondages et formulaires.

### Accès au Dashboard

**Bouton principal :**
```
En-tête de l'application → [📊 Dashboard]
```

**Ou raccourci clavier :**
```
Ctrl + D (Windows/Linux)
Cmd + D (Mac)
```

---

### Interface Principale

```
┌──────────────────────────────────────────────────────────────┐
│  📊 Dashboard                    🤖 IA : 12/50  [👤 Compte]  │ ← En-tête
├──────────────────────────────────────────────────────────────┤
│  [+ Nouveau sondage] [+ Nouveau formulaire] [💬 Assistant]  │ ← Actions
├──────────────────────────────────────────────────────────────┤
│  📊 Statistiques Globales                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ 12       │ 248      │ 87%      │ 3        │             │
│  │ Sondages │ Réponses │ Actifs   │ Brouillons│             │
│  └──────────┴──────────┴──────────┴──────────┘             │
├──────────────────────────────────────────────────────────────┤
│  🔍 [Rechercher...] [⊞|☰] [Filtres: Tous ▼]                │ ← Recherche
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 Vos Sondages                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Réunion Sprint Planning             [•••]        │   │
│  │ 8/10 réponses • Actif • Créé il y a 2 jours        │   │
│  │ [Voir résultats] [Modifier] [Partager]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 Satisfaction Client Q4              [•••]        │   │
│  │ 47/100 réponses • Actif • Créé il y a 5 jours      │   │
│  │ [Voir résultats] [Analytics IA] [Exporter]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Charger plus...]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧭 Navigation

### Sections Principales

**1. Tous les Sondages (Défaut)**
```
📊 Tous les sondages
→ Vue complète de tous vos sondages
```

**2. Sondages Actifs**
```
✅ Actifs
→ Sondages en cours de collecte
→ Badge vert "Actif"
```

**3. Brouillons**
```
📝 Brouillons
→ Sondages non publiés
→ En cours de création
```

**4. Clôturés**
```
🔒 Clôturés
→ Sondages terminés
→ Plus de votes possibles
```

**5. Archivés**
```
🗂️ Archivés
→ Sondages masqués du dashboard principal
→ Toujours accessibles
```

---

### Vues Disponibles

#### Vue Grille (Défaut)
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Sondage │ │ Sondage │ │ Sondage │
│    1    │ │    2    │ │    3    │
└─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Sondage │ │ Sondage │ │ Sondage │
│    4    │ │    5    │ │    6    │
└─────────┘ └─────────┘ └─────────┘
```
**Avantage :** Visuel, aperçu rapide, adapté mobile

**Changer de vue :**
```
Barre de filtres → [⊞ Grille] [☰ Table]
```

#### Vue Table (Compacte)
```
┌─────────────────────────────────────────────────────────────┐
│ ☑ │ Titre              │ Statut │ Stats │ Date  │ Actions │
├─────────────────────────────────────────────────────────────┤
│ ☐ │ Réunion Sprint... │ Actif  │ 8/10  │ 2j    │ [•••]   │
│ ☐ │ Satisfaction Q4   │ Actif  │ 47/100│ 5j    │ [•••]   │
│ ☐ │ Sondage Déjeuner  │ Clôturé│ 5/8   │ 10j   │ [•••]   │
└─────────────────────────────────────────────────────────────┘
```
**Avantage :** Compact, plus d'items visibles simultanément, meilleure densité d'information

**Fonctionnalités :**
- ✅ Toutes les informations essentielles en un coup d'œil
- ✅ Plus d'items par page (calcul automatique selon votre écran)
- ✅ Lignes alternées pour faciliter la lecture
- ✅ Clic sur une ligne pour ouvrir le sondage
- ✅ Sélection multiple avec cases à cocher

**Changer de vue :**
```
Barre de filtres → [⊞ Grille] [☰ Table]
→ Votre préférence est sauvegardée automatiquement
```

---

## 📋 Liste des Sondages

### Pagination Automatique

**Fonctionnement :**
```
Quand vous avez beaucoup de sondages (centaines), le Dashboard les affiche
automatiquement par pages pour optimiser les performances.

Page 1 : [1] 2 3 ... 10
Page 2 : 1 [2] 3 4 ... 10
Page 3 : 1 2 [3] 4 5 ... 10
```

**Navigation :**
- **Boutons Précédent/Suivant** : Navigation entre pages
- **Clic sur un numéro** : Aller directement à une page
- **Info en bas** : "Page X sur Y (Z éléments)" pour voir où vous êtes

**Calcul automatique :**
Le nombre d'items par page s'adapte automatiquement à :
- 📱 **Votre taille d'écran** (mobile, tablette, desktop)
- 🎯 **Votre mode de vue** (grille = moins d'items, table = plus d'items)
- 📏 **Votre hauteur de fenêtre**

**Exemples :**
- 📱 Mobile + Grille : ~6-8 items/page
- 💻 Desktop + Grille : ~12-18 items/page
- 💻 Desktop + Table : ~18-24 items/page

**Astuce :** La pagination se réinitialise automatiquement à la page 1 quand vous changez de filtre ou de recherche.

---

### Carte de Sondage (Vue Grille)

**Informations affichées :**
```
┌─────────────────────────────────────────────────┐
│ 📅 [Icône Type]                        [•••]    │ ← Menu actions
│ Réunion Sprint Planning                         │ ← Titre
│                                                 │
│ 8/10 réponses                                   │ ← Progression
│ ████████░░░░░░░░░░ 80%                         │
│                                                 │
│ ✅ Actif • Créé il y a 2 jours                 │ ← Statut & Date
│ ⏰ Clôture : 10 novembre                        │ ← Deadline (si définie)
│                                                 │
│ [Voir résultats] [Modifier] [Partager]         │ ← Actions rapides
└─────────────────────────────────────────────────┘
```

---

### Icônes par Type

| Icône | Type | Couleur |
|-------|------|---------|
| 📅 | Sondage de dates | Bleu |
| 📝 | Formulaire | Vert |
| 📊 | Questionnaire | Violet |

---

### Badges de Statut

| Badge | Signification | Couleur |
|-------|---------------|---------|
| ✅ **Actif** | En cours de collecte | Vert |
| 📝 **Brouillon** | Non publié | Gris |
| 🔒 **Clôturé** | Terminé | Rouge |
| 🗂️ **Archivé** | Masqué du dashboard | Gris clair |
| ⏰ **Deadline proche** | Fermeture < 24h | Orange |

---

### Barre de Progression

**Visualisation :**
```
8/10 réponses
████████░░░░░░░░░░ 80%
```

**Codes couleurs :**
- 🟢 **Vert (> 70%)** : Bonne participation
- 🟡 **Orange (30-70%)** : Participation moyenne
- 🔴 **Rouge (< 30%)** : Participation faible

---

## 🔍 Filtres et Recherche

### Changement de Vue (Grid/Table)

**Bouton de vue :**
```
Barre de filtres → [⊞] [☰]
  ├─ ⊞ = Vue Grille (cartes)
  └─ ☰ = Vue Table (compacte)
```

**Utilisation :**
1. Cliquez sur l'icône **⊞** pour la vue grille (cartes visuelles)
2. Cliquez sur l'icône **☰** pour la vue table (liste compacte)

**Caractéristiques :**
- ✅ Votre préférence est **sauvegardée automatiquement**
- ✅ Vous retrouvez votre vue préférée à chaque visite
- ✅ Accessible à **tous les utilisateurs** (gratuit, pro, premium)
- ✅ Adaptation automatique du nombre d'items selon la vue

**Quand utiliser chaque vue :**

**Vue Grille (⊞) - Recommandée pour :**
- 👀 Aperçu visuel rapide
- 📱 Consultation sur mobile
- 🎨 Présentation à des clients
- 🆕 Découverte de nouveaux sondages

**Vue Table (☰) - Recommandée pour :**
- 📊 Beaucoup de sondages à gérer (centaines)
- ⚡ Navigation rapide entre items
- 📈 Comparaison de statistiques
- 💼 Utilisation professionnelle intensive

---

### Barre de Recherche

**Recherche intelligente :**
```
🔍 [Rechercher par titre, description, tags...]

Exemples :
• "satisfaction"  → Trouve "Satisfaction Client Q4"
• "réunion"       → Trouve tous les sondages de réunion
• "novembre"      → Trouve sondages créés en novembre
```

**Recherche avancée :**
```
• titre:réunion        → Cherche dans le titre uniquement
• créé:cette-semaine   → Sondages de cette semaine
• réponses:>50         → Plus de 50 réponses
• statut:actif         → Sondages actifs uniquement
```

---

### Filtres Rapides

**Bouton "Filtres" :**
```
┌─────────────────────────────────────┐
│  Filtres                            │
├─────────────────────────────────────┤
│  Type :                             │
│  ☑ Sondages de dates                │
│  ☑ Formulaires                      │
│                                     │
│  Statut :                           │
│  ☑ Actifs                           │
│  ☐ Brouillons                       │
│  ☐ Clôturés                         │
│  ☐ Archivés                         │
│                                     │
│  Date de création :                 │
│  ⚫ Toutes                           │
│  ○ Dernière semaine                 │
│  ○ Dernier mois                     │
│  ○ Personnalisé [__/__/__ - __/__]  │
│                                     │
│  Nombre de réponses :               │
│  ○ Toutes                           │
│  ○ 0-10                             │
│  ○ 10-50                            │
│  ○ 50+                              │
│                                     │
│  [Appliquer] [Réinitialiser]        │
└─────────────────────────────────────┘
```

---

### Tri

**Options de tri :**
```
Trier par : [Date de création ▼]

Options :
• Date de création (récent → ancien)
• Date de création (ancien → récent)
• Nombre de réponses (croissant)
• Nombre de réponses (décroissant)
• Titre (A → Z)
• Titre (Z → A)
• Dernière activité
```

---

## ⚡ Actions Rapides

### Menu Actions (•••)

**Clic sur •••** dans une carte :
```
┌─────────────────────────────┐
│  📊 Voir les résultats       │
│  ✏️ Modifier                 │
│  🔗 Copier le lien           │
│  📤 Partager                 │
│  📥 Exporter                 │
│  📋 Dupliquer                │
│  🔒 Clôturer                 │
│  🗂️ Archiver                 │
│  🗑️ Supprimer               │
└─────────────────────────────┘
```

---

### Actions Détaillées

#### 📊 Voir les Résultats
```
→ Ouvre la page de résultats
→ Graphiques, statistiques, Analytics IA
```

#### ✏️ Modifier
```
→ Éditer le sondage
→ Avertissement si déjà des réponses
```

#### 🔗 Copier le Lien
```
→ Copie le lien de vote dans le presse-papier
→ Notification : "✓ Lien copié !"
```

#### 📤 Partager
```
→ Ouvre le modal de partage
→ Email, WhatsApp, réseaux sociaux, QR Code
```

#### 📥 Exporter
```
→ Choix du format : CSV, PDF, JSON, Markdown
→ Téléchargement immédiat
```

#### 📋 Dupliquer
```
→ Crée une copie du sondage
→ Nom : "[Original] (Copie)"
→ Vides les réponses
```

#### 🔒 Clôturer
```
→ Ferme le sondage aux nouveaux votes
→ Confirmation requise
→ Peut être réouvert
```

#### 🗂️ Archiver
```
→ Masque du dashboard principal
→ Toujours accessible via "Archivés"
→ Peut être restauré
```

#### 🗑️ Supprimer
```
→ Suppression définitive après 30 jours
→ Confirmation + saisie du titre requise
→ Irréversible après 30 jours
```

---

## 📈 Statistiques Globales

### Widgets en Haut du Dashboard

```
┌──────────┬──────────┬──────────┬──────────┐
│    12    │   248    │   87%    │    3     │
│ Sondages │ Réponses │  Actifs  │ Brouillon│
│  Total   │  Total   │          │          │
└──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┬──────────┐
│  4.2/5   │   +42    │   12/50  │  15 min  │
│  Rating  │   NPS    │  Quota IA│ Temps moy│
│  Moyen   │  Moyen   │          │          │
└──────────┴──────────┴──────────┴──────────┘
```

---


## 🗂️ Organisation

> **Note :** Les fonctionnalités d'organisation (tags, dossiers) sont prévues pour une future version. Actuellement, vous pouvez utiliser la recherche et les filtres (statut, type) pour organiser vos sondages.

### Tags et Libellés (Prévu)

Les tags permettront de catégoriser vos sondages pour une meilleure organisation. Cette fonctionnalité sera disponible dans une prochaine mise à jour.

---

### Dossiers (Prévu)

Les dossiers permettront d'organiser vos sondages en groupes thématiques. Cette fonctionnalité sera disponible pour tous les utilisateurs dans une future version.

**Exemple d'organisation prévue :**
```
Dashboard
├── 📁 Satisfaction Client
│   ├── Satisfaction Q1 2025
│   ├── Satisfaction Q2 2025
│   └── Satisfaction Q3 2025
├── 📁 Événements
│   ├── Réunion Sprint
│   ├── Déjeuner équipe
│   └── Team Building
└── 📁 RH
    ├── Onboarding
    └── Exit Interview
```

---

### Sauvegardes Automatiques

**Fonctionnalité actuelle :**
```
✅ Sauvegarde automatique des brouillons
✅ Sauvegarde lors de la modification (debounce ~500-800ms)
✅ Persistance dans le navigateur (localStorage)
```

> **Note :** L'historique des versions et la restauration de versions précédentes sont prévues pour une future version. Actuellement, seul le dernier état sauvegardé est conservé.

## 🔗 Guides Connexes

- [Créer un Sondage](./03-Sondages-Dates.md)
- [Créer un Formulaire](./04-Formulaires-Questionnaires.md)
- [Gestion des Résultats](./08-Gestion-Resultats.md)

---

**[← Export](./09-Export-Partage.md) | [Accueil](./README.md) | [Cas d'Usage →](./11-Cas-Usage.md)**

---

**© 2025 DooDates - Dashboard v1.1** (Pagination & Vue Table)

---

## 📝 Notes de Version

### v1.1 (Novembre 2025)

**Nouvelles fonctionnalités :**
- ✅ **Pagination automatique** : Gestion optimale de grandes quantités de sondages
- ✅ **Vue Table compacte** : Affichage dense avec plus d'items visibles
- ✅ **Calcul dynamique** : Adaptation automatique selon votre écran
- ✅ **Sauvegarde de préférences** : Votre vue préférée est mémorisée

**Améliorations :**
- ⚡ Performance améliorée avec beaucoup de sondages
- 🎯 Navigation plus efficace
- 📱 Meilleure expérience sur tous les appareils

