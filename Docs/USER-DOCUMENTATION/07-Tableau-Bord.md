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
│  🔍 [Rechercher...] [Filtres ▼] [Vue: ⊞ Grille | ☰ Liste]  │ ← Recherche
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

**4. Terminés**
```
🔒 Terminés
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

#### Vue Tableau (Desktop uniquement)
```
☰ Réunion Sprint Planning | 8/10 | Actif | 2j | [Actions]
☰ Satisfaction Client Q4 | 47/100 | Actif | 5j | [Actions]
☰ Sondage Déjeuner      | 5/8 | Terminé | 10j | [Actions]
```
**Avantage :** Compact, plus d'infos visibles, tri facile

**Disponibilité :**
- ✅ **Desktop** (> 1024px) : Vue complète avec toutes les colonnes
- ✅ **Tablette** (768-1024px) : Vue optimisée (colonnes principales uniquement)
- ❌ **Mobile** (< 768px) : Vue grille uniquement (tableau masqué)

**Colonnes visibles :**
- **Desktop** : Sélection | Titre (2 lignes max) | Statut | Statistiques | Date | Actions
- **Tablette** : Sélection | Titre (2 lignes max) | Statut | Actions

---

## 📋 Liste des Sondages

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
| 📝 **Brouillon** | Non publié (avec sondage uniquement) | Gris |
| 🔒 **Terminé** | Terminé | Rouge |
| 🗂️ **Archivé** | Masqué du dashboard | Gris clair |
| ⏰ **Deadline proche** | Fermeture < 24h | Orange |

**Note :** Le filtre "Brouillons" affiche uniquement les conversations avec un sondage en brouillon. Les conversations sans sondage ne sont pas incluses.

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

### Barre de Recherche

**Recherche intelligente :**
```
🔍 [Rechercher par titre, description, tags...] [X]

• Bouton [X] pour effacer rapidement la recherche
• Apparaît automatiquement quand la recherche contient du texte
• Cliquer pour réinitialiser et afficher tous les sondages

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

### Menu Actions

**Actions principales visibles** (boutons directs) :
- **Sondages** : 📊 Résultats | 🗳️ Voter
- **Conversations** : 💬 Reprendre

**Menu "..." (Plus d'actions)** :
```
┌─────────────────────────────┐
│  ⚙️ Gérer les tags/dossier  │
│  ─────────────────────────   │
│  🔗 Copier le lien           │
│  📥 Exporter (sous-menu)     │
│    ├─ 📊 CSV                │
│    ├─ 📄 PDF                │
│    ├─ 🔧 JSON               │
│    └─ 📝 Markdown           │
│  ✏️ Modifier                 │
│  📋 Dupliquer                │
│  🔒 Terminer                 │
│  🗂️ Archiver                 │
│  ─────────────────────────   │
│  🗑️ Supprimer               │
└─────────────────────────────┘
```

**Pour les conversations sans sondage :**
```
┌─────────────────────────────┐
│  ⚙️ Gérer les tags/dossier  │
│  ─────────────────────────   │
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

#### 🔒 Terminer
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

### Tags et Libellés

**Ajouter des tags :**
```
Sondage → Menu ••• → "Gérer les tags"

Tags disponibles :
☐ Prioritaire
☐ Client
☐ Interne
☐ Marketing
☐ Produit

[+ Créer un nouveau tag]
```

**Filtrer par tags :**
```
Filtres → Tags → ☑ Prioritaire
→ Affiche uniquement sondages "Prioritaire"
→ Les tags sélectionnés apparaissent comme badges sous les filtres
→ Cliquer sur [X] d'un badge pour retirer le filtre
```

**Note :** Les clics dans les menus de tags et dossiers ne déclenchent plus l'ouverture de la conversation (propagation corrigée).

---

### Dossiers (Feature Pro)

**Organiser en dossiers :**
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

**Créer un dossier :**
```
Dashboard → [+ Nouveau dossier]
Nom : "Satisfaction Client"
Couleur : Bleu
Icône : 😊
```

---

### Sauvegardes Automatiques

**Feature automatique :**
```
✅ Sauvegarde automatique toutes les 30 secondes
✅ Historique des versions (10 dernières)
✅ Restauration possible en 1 clic
```

**Accéder à l'historique :**
```
Sondage → Menu ••• → "Historique des versions"

┌─────────────────────────────────────────┐
│  Version 12 (actuelle)                  │
│  Aujourd'hui 15:42 - Modifié par vous  │
│                                         │
│  Version 11                             │
│  Aujourd'hui 10:23 - Modifié par vous  │
│  [Restaurer]  [Comparer]               │
│                                         │
│  Version 10                             │
│  Hier 16:15 - Modifié par vous         │
│  [Restaurer]  [Comparer]               │
└─────────────────────────────────────────┘
```

---

## ⌨️ Raccourcis Clavier

### Dashboard

| Raccourci | Action |
|-----------|--------|
| `Ctrl/Cmd + D` | Ouvrir Dashboard |
| `Ctrl/Cmd + N` | Nouveau sondage |
| `Ctrl/Cmd + F` | Focus recherche |
| `Ctrl/Cmd + K` | Ouvrir Assistant IA |
| `↑` `↓` | Naviguer entre sondages |
| `Entrée` | Ouvrir sondage sélectionné |
| `E` | Éditer le sondage |
| `R` | Voir résultats |
| `S` | Partager |
| `Del` | Supprimer (avec confirmation) |

---

## 💡 Conseils et Astuces

### 1. Utilisez les Filtres Intelligents

**Créez des vues personnalisées :**
```
"Sondages à relancer"
→ Filtre : Actifs + Réponses < 30% + Créés > 3 jours

"À terminer cette semaine"
→ Filtre : Actifs + Deadline < 7 jours

"Brouillons à terminer"
→ Filtre : Brouillons + Créés > 7 jours
```

---

### 2. Archivez Régulièrement

**Nettoyez votre dashboard :**
```
Tous les mois :
• Archivez les sondages terminés il y a > 30 jours
• Supprimez les brouillons abandonnés
• Exportez les données importantes

→ Dashboard clair et performant
```

---

### 3. Dupliquez pour Gagner du Temps

**Sondages récurrents :**
```
Enquête mensuelle → Dupliquer → Changer les dates → Partager
(Gain : 5 minutes par création)
```

---

## ❓ Questions Fréquentes

### Combien de sondages puis-je avoir ?

**Illimité !** Quel que soit votre plan (Gratuit, Pro, Premium).

---

### Les brouillons comptent-ils dans la limite ?

**Non**, seuls les sondages **actifs** comptent.

---

### Puis-je partager l'accès au dashboard ?

**Pas encore** (Feature en développement).

Actuellement : 1 dashboard = 1 compte

**Plan pour Q1 2026 :**
- Équipes avec dashboards partagés
- Permissions granulaires (Éditeur, Viewer, Admin)

---

## 🔗 Guides Connexes

- [Créer un Sondage](./03-Sondages-Dates.md)
- [Créer un Formulaire](./04-Formulaires-Questionnaires.md)
- [Gestion des Résultats](./06-Gestion-Resultats.md)

---

**[← Résultats](./06-Gestion-Resultats.md) | [FAQ →](./08-FAQ.md)**

---

**© 2025 DooDates - Dashboard v1.0**

