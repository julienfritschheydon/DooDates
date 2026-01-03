# 📊 Tableau de Bord (Dashboard)

Guide complet du dashboard DooDates pour gérer tous vos sondages efficacement.

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Navigation](#navigation)
3. [Recherche et Filtres](#recherche-et-filtres)
4. [Vues (Grille/Tableau)](#vues-grilletableau)
5. [Sélection Multiple](#sélection-multiple)
6. [Pagination](#pagination)
7. [Organisation (Tags et Dossiers)](#organisation)
8. [Actions sur les Cartes](#actions-sur-les-cartes)
9. [Indicateur de Quota](#indicateur-de-quota)

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

## 🔍 Recherche et Filtres

### Barre de Recherche

Le dashboard inclut une barre de recherche puissante pour trouver rapidement vos conversations.

**Utilisation :**

```
1. Cliquez dans la barre de recherche
2. Tapez le titre ou le contenu d'une conversation
3. Les résultats se filtrent automatiquement en temps réel
```

**Recherche automatique :**

- ✅ Recherche dans les titres de conversations
- ✅ Recherche dans le contenu des premiers messages
- ✅ Recherche insensible à la casse
- ✅ Debounce automatique (recherche après 300ms d'inactivité)

---

### Filtres par Statut

Filtrez vos conversations selon leur statut :

**Filtres disponibles :**

- **Tous** : Affiche toutes les conversations
- **Brouillons** : Conversations avec polls en brouillon
- **Actifs** : Conversations avec polls actifs
- **Clôturés** : Conversations avec polls clôturés
- **Archivés** : Conversations archivées

**Utilisation :**

```
1. Cliquez sur le filtre souhaité dans la barre de filtres
2. Le filtre est mis en surbrillance (bleu)
3. Les résultats sont filtrés automatiquement
```

---

### Filtres par Tags

Filtrez vos conversations en sélectionnant un ou plusieurs tags.

**Sélectionner des tags :**

```
1. Cliquez sur le bouton "Tags"
2. Cochez les tags souhaités dans le menu déroulant
3. Les conversations correspondantes sont affichées
```

**Créer un tag depuis les filtres :**

```
1. Cliquez sur "Tags"
2. Dans le champ "Nouveau tag...", tapez le nom
3. Cliquez sur "Créer" ou appuyez sur Entrée
4. Le tag est créé et automatiquement sélectionné
```

**Retirer un tag du filtre :**

- Cliquez sur le X d'un badge de tag sous les filtres
- Ou décochez le tag dans le menu

---

### Filtres par Dossiers

Filtrez vos conversations en sélectionnant un dossier.

**Sélectionner un dossier :**

```
1. Cliquez sur "Tous les dossiers"
2. Sélectionnez le dossier souhaité
3. Les conversations dans ce dossier sont affichées
```

**Créer un dossier depuis les filtres :**

```
1. Cliquez sur "Tous les dossiers"
2. Dans le champ "Nouveau dossier...", tapez le nom
3. Cliquez sur "Créer" ou appuyez sur Entrée
4. Le dossier est créé et automatiquement sélectionné
```

**Réinitialiser le filtre :**

- Cliquez sur "Tous les dossiers" pour afficher toutes les conversations

---

### Combinaison de Filtres

Vous pouvez combiner plusieurs filtres simultanément :

**Exemples :**

- Recherche + Statut : "Rechercher 'réunion' dans les sondages actifs"
- Statut + Tags : "Sondages actifs avec le tag 'Prioritaire'"
- Tags + Dossier : "Conversations avec tag 'Client' dans le dossier 'Projets'"
- Tous les filtres : Recherche + Statut + Tags + Dossier

**Comportement :**

- Tous les critères doivent être respectés (ET logique)
- Les filtres sont cumulatifs
- La pagination se réinitialise à la page 1 lors d'un changement de filtre

---

## 📊 Vues (Grille/Tableau)

Le dashboard propose deux modes d'affichage adaptés à différents besoins.

### Vue Grille (Défaut)

**Avantages :**

- ✅ Visuel et intuitif
- ✅ Aperçu rapide avec toutes les informations
- ✅ Adapté aux mobiles et tablettes
- ✅ Affichage des tags et dossiers bien visible

**Utilisation :**

```
Barre de filtres → Cliquez sur l'icône [⊞ Grille]
```

**Affichage :**

- 1 colonne sur mobile
- 2 colonnes sur tablette
- 3 colonnes sur desktop
- Cartes avec toutes les informations principales

---

### Vue Tableau

**Avantages :**

- ✅ Compact et dense
- ✅ Plus d'items visibles simultanément
- ✅ Meilleure densité d'information
- ✅ Colonnes triables (future version)

**Utilisation :**

```
Barre de filtres → Cliquez sur l'icône [☰ Table]
```

**Affichage :**

- Colonnes : Titre, Type, Statut, Participants, Votes, Date, Actions
- Lignes alternées pour faciliter la lecture
- Clic sur une ligne pour ouvrir la conversation
- Sélection multiple avec cases à cocher

**Calcul automatique :**

- Plus d'items par page qu'en vue grille
- Adaptation selon la taille d'écran

---

### Sauvegarde de Préférence

Votre préférence de vue est automatiquement sauvegardée :

```
✅ La dernière vue utilisée est restaurée lors de la prochaine visite
✅ Préférence stockée dans le navigateur (localStorage)
✅ Pas besoin de reconfigurer à chaque fois
```

---

## ☑️ Sélection Multiple

Le dashboard permet de sélectionner plusieurs conversations pour effectuer des actions en masse.

### Activer la Sélection

**Étape 1 : Activer le mode sélection**

```
Cliquez sur le bouton "Sélectionner" en haut à droite
```

**Résultat :**

- Des checkboxes apparaissent sur chaque carte
- Le bouton change en "X sélectionné(s)"

---

### Sélectionner des Conversations

**Méthodes :**

1. **Sélection individuelle** : Cochez les conversations une par une
2. **Sélectionner tout** : Cliquez sur "Sélectionner" (qui devient "X sélectionné(s)")
   - Sélectionne uniquement les conversations de la page courante

**Indicateurs :**

- Checkbox cochée = conversation sélectionnée
- Compteur en haut : "X sélectionné(s)"
- Barre d'actions flottante en bas (si sélection active)

---

### Barre d'Actions Flottante

Quand vous sélectionnez une ou plusieurs conversations, une barre d'actions apparaît en bas de l'écran :

```
┌─────────────────────────────────────────────┐
│ X élément(s) sélectionné(s)                 │
│ [🗑️ Supprimer] [Annuler]                    │
└─────────────────────────────────────────────┘
```

**Actions disponibles :**

- **Supprimer** : Supprime toutes les conversations sélectionnées
- **Annuler** : Désélectionne toutes les conversations

---

### Suppression en Masse

**Étapes :**

```
1. Sélectionnez plusieurs conversations
2. Cliquez sur "Supprimer" dans la barre flottante
3. Confirmez la suppression dans la boîte de dialogue
```

**Résultat :**

- Toast de confirmation avec le nombre d'éléments supprimés
- Les conversations et leurs polls associés sont supprimés
- Le dashboard se rafraîchit automatiquement

**Note importante :**

- ⚠️ La suppression est définitive
- ⚠️ Les polls liés sont également supprimés
- ⚠️ Cette action ne peut pas être annulée

---

### Désélectionner

**Méthodes :**

1. **Désélection individuelle** : Décochez une conversation
2. **Désélectionner tout** :
   - Cliquez sur "Annuler" dans la barre flottante
   - Ou cliquez sur "Désélectionner tout" en haut

**Résultat :**

- Toutes les sélections sont annulées
- Les checkboxes disparaissent
- Le bouton redevient "Sélectionner"

---

## 📄 Pagination

Quand vous avez beaucoup de conversations, le dashboard les affiche par pages pour optimiser les performances.

### Navigation entre Pages

**Boutons disponibles :**

- **Précédent** : Aller à la page précédente
- **Suivant** : Aller à la page suivante
- **Numéros de page** : Aller directement à une page spécifique

**Info de pagination :**

```
Page 1 sur 5 (48 éléments)
```

---

### Calcul Automatique

Le nombre d'items par page s'adapte automatiquement à :

**Facteurs :**

- 📱 **Taille d'écran** : Mobile, tablette, desktop
- 🎯 **Mode de vue** : Grille (moins d'items) ou Tableau (plus d'items)
- 📏 **Hauteur de fenêtre** : Ajustement dynamique

**Exemples :**

- 📱 Mobile + Grille : ~6-8 items/page
- 💻 Desktop + Grille : ~12-18 items/page
- 💻 Desktop + Table : ~18-24 items/page

---

### Comportement

**Réinitialisation automatique :**

- ✅ La pagination revient à la page 1 lors d'un changement de filtre
- ✅ La pagination revient à la page 1 lors d'une nouvelle recherche
- ✅ La pagination revient à la page 1 lors d'un changement de vue

**Ellipsis pour beaucoup de pages :**

```
Page 1 [2] 3 ... 10
Page 1 2 [3] 4 ... 10
Page 1 ... 7 [8] 9 10
```

- Les pages autour de la page courante sont toujours visibles
- La première et dernière page sont toujours visibles
- Les ellipsis (...) indiquent des pages masquées

---

### Scroll Automatique

Quand vous changez de page :

- ✅ Le scroll remonte automatiquement en haut de la page
- ✅ Animation fluide (smooth scroll)

---

## 🧭 Navigation et Interface

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

## 🎬 Actions sur les Cartes

Chaque carte de conversation propose plusieurs actions selon son type.

### Actions pour Conversation Seule

Si la conversation n'a pas de poll associé :

**Actions disponibles :**

- **Reprendre** : Ouvrir le workspace pour continuer la conversation
- **Menu (⋯)** :
  - Gérer les tags/dossier
  - Supprimer

---

### Actions pour Conversation avec Poll

Si la conversation a un poll associé :

**Actions disponibles :**

- **Résultats** : Voir les résultats du sondage
- **Voter** : Ouvrir la page de vote
- **Menu (⋯)** :
  - Gérer les tags/dossier
  - Actions du poll (Modifier, Partager, Exporter, etc.)

---

## 📊 Indicateur de Quota

Le dashboard affiche en haut un indicateur de votre quota de conversations.

### Affichage

```
┌─────────────────────────────────────────────────┐
│ ℹ️ 12/50 conversations utilisées                │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ [En savoir plus →]                              │
└─────────────────────────────────────────────────┘
```

**Informations affichées :**

- Nombre de conversations utilisées / Limite totale
- Barre de progression visuelle
- Couleur selon le niveau (bleu = normal, orange = proche de la limite)
- Bouton "En savoir plus" vers la page de tarification

---

### Compteur Utilisateurs Invités

Pour les utilisateurs non connectés :

```
12/50 conversations utilisées
• Créez un compte pour synchroniser vos données
```

---

### Limites

**Utilisateurs invités :**

- Limite : 50 conversations
- Données stockées localement (navigateur)

**Utilisateurs connectés :**

- Limite selon votre plan (voir [Tarification](/pricing))
- Données synchronisées dans le cloud

---

### Bouton Fermer (X)

En haut à droite du dashboard, un bouton permet de fermer et retourner à l'accueil :

```
[X] ← Cliquez pour fermer
```

**Action :**

- Retour à la page d'accueil (`/`)
- Nettoyage de l'état du poll en cours

---

## 📋 Liste des Conversations

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

| Icône | Type             | Couleur |
| ----- | ---------------- | ------- |
| 📅    | Sondage de dates | Bleu    |
| 📝    | Formulaire       | Vert    |
| 📊    | Questionnaire    | Violet  |

---

### Badges de Statut

| Badge                  | Signification        | Couleur    |
| ---------------------- | -------------------- | ---------- |
| ✅ **Actif**           | En cours de collecte | Vert       |
| 📝 **Brouillon**       | Non publié           | Gris       |
| 🔒 **Clôturé**         | Terminé              | Rouge      |
| 🗂️ **Archivé**         | Masqué du dashboard  | Gris clair |
| ⏰ **Deadline proche** | Fermeture < 24h      | Orange     |

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

DooDates vous permet d'organiser vos conversations et sondages avec des **tags** et des **dossiers** pour une meilleure gestion.

### Tags et Libellés

Les tags permettent de catégoriser vos conversations avec des libellés colorés pour une identification rapide.

#### Comment assigner des tags

1. **Ouvrir le menu de gestion** :

   ```
   Carte de conversation → [⋯ Menu] → "Gérer les tags/dossier"
   ```

2. **Sélectionner les tags** :
   - Dans la section "Tags", cochez les tags souhaités
   - Vous pouvez sélectionner plusieurs tags simultanément
   - Les tags sont affichés avec leurs couleurs personnalisées

3. **Sauvegarder** :
   - Cliquez sur "Enregistrer"
   - Les tags apparaissent immédiatement sur la carte

#### Affichage des tags

Les tags apparaissent sur chaque carte sous forme de badges colorés :

```
┌─────────────────────────────────────┐
│ 📅 Réunion Sprint Planning  [⋯]   │
│ 🏷️ Prioritaire  🏷️ Client         │ ← Tags colorés
│ 8/10 réponses • Actif              │
└─────────────────────────────────────┘
```

**Caractéristiques** :

- ✅ Couleurs personnalisables par tag
- ✅ Multiples tags par conversation
- ✅ Filtrage par tag dans le dashboard

---

### Dossiers

Les dossiers permettent d'organiser vos conversations en groupes thématiques avec des icônes et couleurs personnalisables.

#### Comment assigner un dossier

1. **Ouvrir le menu de gestion** :

   ```
   Carte de conversation → [⋯ Menu] → "Gérer les tags/dossier"
   ```

2. **Sélectionner un dossier** :
   - Dans la section "Dossier", cochez le dossier souhaité
   - Vous ne pouvez sélectionner qu'un seul dossier à la fois
   - Sélectionnez "Aucun dossier" pour retirer le dossier

3. **Sauvegarder** :
   - Cliquez sur "Enregistrer"
   - Le dossier apparaît immédiatement sur la carte

#### Affichage des dossiers

Les dossiers apparaissent sur chaque carte avec leur icône et nom :

```
┌─────────────────────────────────────┐
│ 📅 Réunion Sprint Planning  [⋯]   │
│ 📁 Satisfaction Client              │ ← Dossier
│ 🏷️ Prioritaire  🏷️ Client         │ ← Tags
│ 8/10 réponses • Actif              │
└─────────────────────────────────────┘
```

**Caractéristiques** :

- ✅ Icônes personnalisables (emoji ou texte)
- ✅ Couleurs personnalisables
- ✅ Un seul dossier par conversation
- ✅ Filtrage par dossier dans le dashboard

---

### Exemple d'Organisation

Voici un exemple d'organisation avec tags et dossiers :

```
Dashboard
├── 📁 Satisfaction Client (dossier)
│   ├── 📅 Satisfaction Q1 2025
│   │   🏷️ Client  🏷️ Prioritaire
│   ├── 📅 Satisfaction Q2 2025
│   │   🏷️ Client
│   └── 📅 Satisfaction Q3 2025
│       🏷️ Client  🏷️ Marketing
├── 📁 Événements (dossier)
│   ├── 📅 Réunion Sprint
│   │   🏷️ Interne  🏷️ Prioritaire
│   ├── 📅 Déjeuner équipe
│   │   🏷️ Interne
│   └── 📅 Team Building
│       🏷️ Interne  🏷️ Marketing
└── 📁 RH (dossier)
    ├── 📅 Onboarding
    │   🏷️ Interne
    └── 📅 Exit Interview
        🏷️ Interne  🏷️ Prioritaire
```

---

### Filtrage par Tags et Dossiers

Vous pouvez filtrer vos conversations par tags et/ou dossiers dans le dashboard :

**Filtrage par tag** :

1. Ouvrez les filtres du dashboard
2. Sélectionnez un ou plusieurs tags
3. Seules les conversations avec ces tags sont affichées

**Filtrage par dossier** :

1. Ouvrez les filtres du dashboard
2. Sélectionnez un dossier
3. Seules les conversations dans ce dossier sont affichées

**Filtrage combiné** :

- Vous pouvez combiner les filtres par tag ET dossier
- Les conversations doivent correspondre à tous les critères sélectionnés

---

### Bonnes Pratiques

**Organisation efficace** :

- ✅ Utilisez des tags pour les catégories transversales (Prioritaire, Client, Interne)
- ✅ Utilisez des dossiers pour les groupes thématiques (Projets, Clients, RH)
- ✅ Limitez le nombre de tags par conversation (3-5 maximum pour la lisibilité)
- ✅ Créez des dossiers cohérents avec votre structure organisationnelle

**Création de tags et dossiers** :

- Les tags et dossiers peuvent être créés depuis les filtres du dashboard
- Choisissez des couleurs contrastées pour faciliter l'identification
- Utilisez des noms courts et descriptifs

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

**© 2025 DooDates - Dashboard v1.2** (Tags, Dossiers, Sélection Multiple, Recherche Avancée)

---

## 📝 Notes de Version

### v1.2 (Janvier 2025)

**Nouvelles fonctionnalités :**

- ✅ **Tags et Dossiers** : Organisation complète avec tags colorés et dossiers
- ✅ **Sélection Multiple** : Sélection et suppression en masse
- ✅ **Recherche Avancée** : Recherche en temps réel dans les conversations
- ✅ **Filtres Combinés** : Combinaison de recherche, statut, tags et dossiers
- ✅ **Gestion Tags/Dossiers** : Menu dédié sur chaque carte pour assigner tags/dossiers
- ✅ **Création depuis Filtres** : Création rapide de tags et dossiers depuis les filtres

### v1.1 (Novembre 2025)

**Fonctionnalités :**

- ✅ **Pagination automatique** : Gestion optimale de grandes quantités de sondages
- ✅ **Vue Table compacte** : Affichage dense avec plus d'items visibles
- ✅ **Calcul dynamique** : Adaptation automatique selon votre écran
- ✅ **Sauvegarde de préférences** : Votre vue préférée est mémorisée

**Améliorations :**

- ⚡ Performance améliorée avec beaucoup de sondages
- 🎯 Navigation plus efficace
- 📱 Meilleure expérience sur tous les appareils
