# 📖 Concepts de Base

Comprendre les concepts fondamentaux de DooDates pour tirer le meilleur parti de la plateforme.

---

## 📋 Table des Matières

1. [Types de Sondages](#types-de-sondages)
2. [Types de Questions](#types-de-questions)
3. [Modes de Vote](#modes-de-vote)
4. [Visibilité et Partage](#visibilité-et-partage)
5. [Cycle de Vie d'un Sondage](#cycle-de-vie-dun-sondage)

---

## 🎯 Types de Sondages

DooDates propose deux types principaux de sondages :

### 1. Sondages de Dates 📅

**Objectif :** Trouver la meilleure date/horaire pour un événement

**Caractéristiques :**
- Interface calendrier visuelle
- Sélection de dates et plages horaires
- Vote avec 3 niveaux (Disponible / Peut-être / Indisponible)
- Détection automatique de la meilleure option
- Gestion des fuseaux horaires

**Cas d'usage typiques :**
- Réunions d'équipe
- Rendez-vous entre amis
- Événements avec plusieurs participants
- Disponibilités de consultants

**Exemple de création avec l'IA :**
```
"Organise un dîner avec mes amis vendredi ou samedi soir"
→ IA crée un sondage avec vendredi 19h-23h et samedi 19h-23h
```

---

### 2. Formulaires / Questionnaires 📝

**Objectif :** Collecter des informations structurées ou des opinions

**Caractéristiques :**
- 7 types de questions différents
- Logique conditionnelle (questions dynamiques)
- Mode multi-étapes ou vue classique
- Analytics automatiques
- Export multi-formats

**Cas d'usage typiques :**
- Enquêtes de satisfaction
- Feedback produit
- Quiz et évaluations
- Inscription à événements
- Sondages d'opinion

**Exemple de création avec l'IA :**
```
"Crée une enquête de satisfaction client pour mon restaurant"
→ IA génère automatiquement 5-7 questions pertinentes
```

---

## ❓ Types de Questions

DooDates supporte **7 types de questions** pour vos formulaires :

### 1. Choix Unique (Radio) 🔘

**Description :** Le répondant sélectionne **une seule** option parmi plusieurs

**Exemple :**
```
Question : Quelle est votre boisson préférée ?
⚫ Café
○ Thé
○ Jus de fruits
○ Eau
```

**Quand l'utiliser :**
- Préférences exclusives
- Classification (âge, catégorie, etc.)
- Oui/Non/Peut-être

**Rendu des résultats :**
- Graphique en camembert (pie chart)
- Pourcentages par option
- Total de réponses

---

### 2. Choix Multiple (Checkbox) ☑️

**Description :** Le répondant peut sélectionner **plusieurs options**

**Exemple :**
```
Question : Quels langages de programmation maîtrisez-vous ?
☑ JavaScript
☑ Python
☐ Java
☑ TypeScript
☐ Go
```

**Quand l'utiliser :**
- Plusieurs réponses possibles
- Préférences multiples
- Compétences ou intérêts

**Rendu des résultats :**
- Graphique en barres horizontales
- Nombre et pourcentage par option
- Options les plus choisies en premier

---

### 3. Texte Court 📝

**Description :** Le répondant tape une réponse courte sur une seule ligne

**Exemple d'usage :**
- Nom, email, ville
- Informations courtes et précises
- Validation possible (email, téléphone, URL, nombre, date)

---

### 4. Texte Long 📄

**Description :** Le répondant tape une réponse détaillée sur plusieurs lignes

**Exemple d'usage :**
- Commentaires libres
- Suggestions détaillées
- Témoignages

**Exemple :**
```
Question : Que pourrions-nous améliorer dans notre service ?
┌────────────────────────────────────────┐
│ [Zone de saisie libre pour répondant]  │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

**Quand l'utiliser :**
- Informations personnalisées
- Commentaires ouverts
- Suggestions
- Feedback détaillé

**Rendu des résultats :**
- Liste de toutes les réponses
- Analytics IA : détection de thèmes récurrents
- Nuage de mots (si activé)

---

### 5. Matrice (Likert Scale) 📊

**Description :** Grille de questions avec options communes

**Exemple :**
```
Question : Évaluez notre service sur les critères suivants :

                    Très mauvais | Mauvais | Moyen | Bon | Excellent
Qualité produit          ○           ○        ○      ⚫       ○
Rapport qualité/prix     ○           ○        ⚫      ○       ○
Service client           ○           ○        ○      ○       ⚫
Livraison                ○           ⚫        ○      ○       ○
```

**Quand l'utiliser :**
- Évaluation multi-critères
- Questionnaires de satisfaction
- Comparaison de plusieurs items
- Échelles de Likert

**Rendu des résultats :**
- Graphique en barres empilées
- Moyennes par critère
- Heatmap (selon volume)

---

### 6. Notation (Rating) ⭐

**Description :** Évaluation sur une échelle de 1 à 5 étoiles

**Exemple :**
```
Question : Notez votre expérience globale
★★★★☆ (4/5)
```

**Quand l'utiliser :**
- Satisfaction globale
- Qualité d'un service/produit
- Expérience utilisateur

**Rendu des résultats :**
- Note moyenne (ex: 4.2/5)
- Distribution des notes (graphique)
- Pourcentage par étoile

---

### 7. NPS (Net Promoter Score) 📈

**Description :** Échelle de 0 à 10 mesurant la probabilité de recommandation

**Exemple :**
```
Question : Recommanderiez-vous notre produit à un ami ?
Pas du tout                                    Absolument
    0   1   2   3   4   5   6   7   8   9   10
    ○   ○   ○   ○   ○   ○   ○   ⚫   ○   ○   ○
```

**Quand l'utiliser :**
- Mesure de fidélité client
- Satisfaction stratégique
- Benchmark industrie

**Calcul NPS :**
```
NPS = % Promoteurs (9-10) - % Détracteurs (0-6)

Exemple : 50% promoteurs - 20% détracteurs = NPS de +30
```

**Rendu des résultats :**
- Score NPS global (-100 à +100)
- Distribution détaillée
- Segmentation automatique :
  - 🟢 **Promoteurs** (9-10) : Clients enthousiastes
  - 🟡 **Passifs** (7-8) : Clients satisfaits mais vulnérables
  - 🔴 **Détracteurs** (0-6) : Clients insatisfaits

---

## 🎨 Modes de Vote

### Mode Classique (Single Page)

**Toutes les questions sur une seule page**

**Avantages :**
- ✅ Vue d'ensemble complète
- ✅ Navigation libre entre questions
- ✅ Modification facile des réponses
- ✅ Idéal pour formulaires courts (< 10 questions)

**Inconvénients :**
- ⚠️ Peut paraître long si 15+ questions
- ⚠️ Risque d'abandon si trop de scroll

**Quand l'utiliser :**
- Formulaires courts (3-10 questions)
- Questions interdépendantes
- Publics familiers avec les formulaires

---

### Mode Multi-Étapes (Typeform-style)

**Une question par écran avec animation fluide**

**Avantages :**
- ✅ Expérience immersive
- ✅ Focus sur chaque question
- ✅ Progression visuelle (barre)
- ✅ Taux de complétion supérieur (+15% en moyenne)
- ✅ Parfait pour mobile

**Inconvénients :**
- ⚠️ Pas de vue d'ensemble
- ⚠️ Navigation séquentielle uniquement

**Quand l'utiliser :**
- Formulaires longs (10+ questions)
- Mobile-first
- Expérience conversationnelle souhaitée
- Optimisation du taux de complétion

**Interface :**
```
┌────────────────────────────────────────┐
│  ████░░░░░░░░░░░░░░░░░░░░░░ 25%       │ ← Progression
├────────────────────────────────────────┤
│                                        │
│  Question 1 sur 4                      │
│                                        │
│  Quel est votre niveau de satisfaction?│
│                                        │
│      ★ ★ ★ ★ ☆                         │
│                                        │
│              [Suivant →]               │
└────────────────────────────────────────┘
```

---

## 🔒 Visibilité et Partage

### Niveaux de Visibilité des Résultats

DooDates propose **3 niveaux de visibilité** pour les résultats :

#### 1. Créateur Uniquement 🔒
- **Qui peut voir :** Uniquement vous (le créateur)
- **Cas d'usage :** Enquêtes confidentielles, feedback interne
- **Exemple :** Évaluation RH, sondage stratégique

#### 2. Participants (Après Vote) 👥
- **Qui peut voir :** Toute personne ayant voté
- **Cas d'usage :** Sondages communautaires, décisions de groupe
- **Exemple :** Choix de restaurant entre amis, date de réunion

#### 3. Public (Tous) 🌍
- **Qui peut voir :** Tout le monde avec le lien
- **Cas d'usage :** Sondages d'opinion, résultats à partager
- **Exemple :** Sondage sur Twitter, étude de marché publique

### Paramètres de Visibilité

Configurable lors de la création :
```
┌────────────────────────────────────────┐
│  Qui peut voir les résultats ?         │
│                                        │
│  ⚫ Moi uniquement                      │
│  ○ Les participants (après leur vote) │
│  ○ Tout le monde (public)              │
└────────────────────────────────────────┘
```

---

### Types de Liens de Partage

#### 1. Lien de Vote Unique
```
https://doodates.com/vote/abc123
```
- **Utilisation :** Voter sur le sondage
- **Accès :** Public ou privé (selon paramètres)
- **Limite de votes :** 1 vote par appareil (mode invité) ou 1 par compte

#### 2. Lien de Résultats
```
https://doodates.com/results/abc123
```
- **Utilisation :** Voir uniquement les résultats
- **Accès :** Selon paramètres de visibilité
- **Actions :** Export, partage (lecture seule)

#### 3. Lien d'Édition (Privé)
```
https://doodates.com/edit/abc123?token=xyz789
```
- **Utilisation :** Modifier le sondage
- **Accès :** Token privé requis
- **Actions :** Édition complète, suppression

---

## ⏱️ Cycle de Vie d'un Sondage

### États d'un Sondage

```
[Brouillon] → [Actif] → [Clôturé] → [Archivé] → [Supprimé]
```

#### 1. Brouillon 📝
- Sondage en cours de création
- Non partagé, non accessible publiquement
- Modifications illimitées
- Sauvegarde automatique

**Actions possibles :**
- ✏️ Modifier librement
- 🗑️ Supprimer sans conséquence
- 🚀 Publier (passer en "Actif")

---

#### 2. Actif ✅
- Sondage publié et partageable
- Accessible via lien de vote
- Collecte de réponses en cours

**Actions possibles :**
- 📤 Partager le lien
- 📊 Voir les résultats en temps réel
- ⚠️ Modifier (limité selon votes reçus)
- 🔒 Clôturer le sondage
- 🗂️ Archiver
- 🗑️ Supprimer (avec confirmation)

**Limitations de modification :**
- Avec < 5 votes : Modification libre
- Avec 5-20 votes : Avertissement mais possible
- Avec 20+ votes : Ajout possible, suppression déconseillée

---

#### 3. Clôturé 🔒
- Sondage fermé aux nouveaux votes
- Résultats finaux figés
- Toujours accessible en lecture

**Actions possibles :**
- 📊 Voir et exporter les résultats
- 🔄 Réouvrir (si nécessaire)
- 📤 Partager les résultats
- 🗂️ Archiver
- 🗑️ Supprimer

**Utilité :**
- Figer les résultats à une date donnée
- Empêcher de nouveaux votes après deadline
- Marquer la fin d'une campagne

---

#### 4. Archivé 🗂️
- Sondage masqué du dashboard
- Toujours accessible via lien direct
- Résultats conservés

**Actions possibles :**
- 👁️ Restaurer (remettre dans dashboard)
- 📊 Voir les résultats
- 🗑️ Supprimer définitivement

**Utilité :**
- Nettoyer le dashboard des anciens sondages
- Conserver sans encombrer
- Historique long terme

---

#### 5. Supprimé 🗑️
- Suppression définitive (après confirmation)
- Données irrécupérables
- Liens de partage inactifs

**⚠️ Attention :** Suppression irréversible après 30 jours

---

## 🎓 Concepts Avancés

### Logique Conditionnelle

**Définition :** Afficher ou masquer des questions selon les réponses précédentes

**Exemple :**
```
Q1 : Êtes-vous satisfait de notre service ?
     → Oui / Non

Si "Non" :
  Q2 : Que pouvons-nous améliorer ? (Texte libre)
  
Si "Oui" :
  Q3 : Nous recommanderiez-vous ? (NPS 0-10)
```

**Avantages :**
- ✅ Formulaires plus courts et pertinents
- ✅ Meilleure expérience utilisateur
- ✅ Taux de complétion supérieur
- ✅ Données plus riches

**Configuration :**
Via l'éditeur de règles conditionnelles (voir [Formulaires Avancés](./04-Formulaires-Questionnaires.md#logique-conditionnelle))

---

### Simulation de Réponses

**Définition :** Générer des réponses fictives réalistes pour tester votre formulaire

**Utilité :**
- 🧪 Tester la logique conditionnelle
- 📊 Prévisualiser les graphiques de résultats
- 🐛 Identifier les problèmes avant publication
- 📈 Valider que le questionnaire atteint vos objectifs

**Comment ça marche :**
```
1. Cliquez sur "Simuler des réponses"
2. L'IA génère 20-50 réponses réalistes selon votre contexte
3. Consultez les résultats simulés
4. Ajustez votre formulaire si nécessaire
5. Publiez en confiance
```

Plus de détails : [Guide Simulation](./07-Simulation-Reponses.md)

---

### Analytics IA

**Définition :** Analyse automatique de vos résultats par intelligence artificielle

**Fonctionnalités :**
- 💡 **Insights automatiques** : Tendances, corrélations, anomalies
- ❓ **Quick Queries** : Questions prédéfinies pour analyse rapide
- 🗣️ **Questions libres** : Posez vos propres questions sur les données
- 📊 **Visualisations** : Graphiques générés automatiquement

**Exemple d'insights :**
```
🔍 Insight détecté :
"76% des détracteurs NPS mentionnent 'délai de livraison' 
 dans leurs commentaires. Corrélation forte identifiée."
```

Plus de détails : [Guide Analytics IA](./06-Analytics-IA.md)

---

## 🔑 Termes Clés

| Terme | Définition |
|-------|------------|
| **Poll** | Sondage (générique : dates ou formulaire) |
| **Date Poll** | Sondage de dates/horaires |
| **Form Poll** | Formulaire/questionnaire |
| **Respondent** | Répondant, personne qui vote |
| **Creator** | Créateur du sondage |
| **Slug** | Identifiant unique court (ex: `abc123`) |
| **NPS** | Net Promoter Score (échelle 0-10) |
| **Likert** | Échelle d'accord (ex: Pas du tout d'accord → Tout à fait d'accord) |
| **Conditional Logic** | Logique conditionnelle (questions dynamiques) |
| **Quick Query** | Question prédéfinie pour analyse rapide |
| **Insight** | Observation automatique générée par l'IA |
| **Simulation** | Génération de réponses fictives pour test |

---

## 🎯 Récapitulatif

**Vous avez appris :**
- ✅ Les 2 types de sondages (Dates vs Formulaires)
- ✅ Les 7 types de questions disponibles
- ✅ Les modes de vote (Classique vs Multi-étapes)
- ✅ La visibilité et le partage des résultats
- ✅ Le cycle de vie complet d'un sondage

**Prochaines étapes :**
1. [Créer un sondage de dates](./03-Sondages-Dates.md)
2. [Créer un formulaire](./04-Formulaires-Questionnaires.md)
3. [Maîtriser l'assistant IA](./05-Assistant-IA.md)

---

**[← Guide de Démarrage](./01-Guide-Demarrage-Rapide.md) | [Accueil](./README.md) | [Sondages de Dates →](./03-Sondages-Dates.md)**

---

**© 2025 DooDates - Concepts de Base v1.0**

