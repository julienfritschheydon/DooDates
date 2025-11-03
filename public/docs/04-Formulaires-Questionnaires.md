# 📝 Formulaires et Questionnaires

Guide complet pour créer des formulaires professionnels avec DooDates.

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Types de Questions](#types-de-questions)
3. [Créer un Formulaire](#créer-un-formulaire)
4. [Logique Conditionnelle](#logique-conditionnelle)
5. [Mode Multi-Étapes](#mode-multi-étapes)
6. [Thèmes et Personnalisation](#thèmes-et-personnalisation)
7. [Tester Votre Formulaire](#tester-votre-formulaire)

---

## 🎯 Introduction

Les **formulaires DooDates** vous permettent de créer des enquêtes, questionnaires et sondages d'opinion professionnels en quelques minutes.

### Avantages

- ✅ **7 types de questions** (choix unique, choix multiples, texte court, texte long, rating, NPS, matrix)
- ✅ **Logique conditionnelle** (questions dynamiques)
- ✅ **Mode multi-étapes** (UX optimale mobile)
- ✅ **Analytics IA automatiques**
- ✅ **Export 4 formats** (CSV, PDF, JSON, Markdown)

---

## ❓ Types de Questions

### 1. Choix Unique (Radio Buttons)

**Usage :** Sélectionner **une seule** option

**Exemple :**
```
Question : Quelle est votre boisson préférée ?
⚫ Café
○ Thé
○ Jus de fruits
○ Eau
```

**Configuration :**
```
Type : Choix unique
Options : Café, Thé, Jus de fruits, Eau
☑ Ajouter "Autre" avec champ texte
☐ Ordre aléatoire des options
```

**Quand l'utiliser :**
- Préférences exclusives
- Classification (âge, catégorie)
- Oui/Non/Peut-être
- Fréquence (Jamais, Rarement, Souvent, Toujours)

---

### 2. Choix Multiple (Checkboxes)

**Usage :** Sélectionner **plusieurs options**

**Exemple :**
```
Question : Quels langages de programmation maîtrisez-vous ?
☑ JavaScript
☑ Python
☐ Java
☑ TypeScript
☐ Go
☐ Rust
```

**Configuration :**
```
Type : Choix multiples
Options : JavaScript, Python, Java, TypeScript, Go, Rust
Minimum sélections : 1
Maximum sélections : Illimité (ou 3 max)
☑ Ajouter "Autre"
```

**Quand l'utiliser :**
- Compétences multiples
- Intérêts variés
- Sélection de features souhaitées
- "Tout ce qui s'applique"

---

### 3. Texte Court (1 ligne)

**Usage :** Réponse courte sur une seule ligne

**Exemple :**
```
Question : Quelle est votre ville ?
[_____________________]
```

**Configuration :**
```
Type : Texte court
Longueur max : 300 caractères (par défaut)
Validation : Aucune / Email / Téléphone / URL / Nombre / Date
```

**Quand l'utiliser :**
- Nom, prénom
- Email, téléphone
- Ville, code postal
- URL de site web
- Informations courtes et précises

---

### 4. Texte Long (Multilignes)

**Usage :** Réponse ouverte détaillée sur plusieurs lignes

**Exemple :**
```
Question : Que pourrions-nous améliorer ?
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

**Configuration :**
```
Type : Texte long
Lignes affichées : 6
Longueur max : 2000 caractères (par défaut)
Redimensionnable : Oui (verticalement)
Validation : Optionnelle (Email / URL / etc.)
```

**Quand l'utiliser :**
- Commentaires libres
- Suggestions détaillées
- Descriptions
- Feedback qualitatif
- Témoignages
- Réponses élaborées

---

### 5. Matrix (Likert Scale)

**Usage :** Évaluer plusieurs items selon les mêmes critères

**Exemple :**
```
Question : Évaluez notre service :

                    Très mauvais | Mauvais | Moyen | Bon | Excellent
Qualité produit          ○           ○        ○      ⚫       ○
Rapport qualité/prix     ○           ○        ⚫      ○       ○
Service client           ○           ○        ○      ○       ⚫
Livraison                ○           ⚫        ○      ○       ○
```

**Configuration :**
```
Type : Matrix
Lignes (items à évaluer) :
  - Qualité produit
  - Rapport qualité/prix
  - Service client
  - Livraison

Colonnes (échelle) :
  - Très mauvais
  - Mauvais
  - Moyen
  - Bon
  - Excellent
```

**Quand l'utiliser :**
- Satisfaction multi-critères
- Évaluation de performance
- Échelles de Likert classiques
- Questionnaires académiques

---

### 6. Rating (Étoiles)

**Usage :** Évaluation sur une échelle de 1 à 5

**Exemple :**
```
Question : Notez votre expérience globale
★★★★☆ (4/5)
```

**Rendu visuel :**
```
☆☆☆☆☆ → Cliquez sur la 4ème étoile → ★★★★☆
```

**Configuration :**
```
Type : Rating
Échelle : 1-5 étoiles (fixe)
Texte aide :
  1 étoile = "Très mauvais"
  5 étoiles = "Excellent"
```

**Quand l'utiliser :**
- Satisfaction globale
- Qualité d'un service/produit
- Note d'une expérience
- Recommandation simple

---

### 7. NPS (Net Promoter Score)

**Usage :** Mesurer la fidélité client (échelle 0-10)

**Exemple :**
```
Question : Recommanderiez-vous DooDates à un ami ?

Pas du tout                                    Absolument
    0   1   2   3   4   5   6   7   8   9   10
    ○   ○   ○   ○   ○   ○   ○   ⚫   ○   ○   ○
```

**Calcul NPS :**
```
Promoteurs (9-10) : 50%
Passifs (7-8) : 30%
Détracteurs (0-6) : 20%

NPS = 50% - 20% = +30
```

**Configuration :**
```
Type : NPS
Échelle : 0-10 (fixe)
Labels :
  0 = "Pas du tout"
  10 = "Absolument"
```

**Quand l'utiliser :**
- Mesure de fidélité stratégique
- Benchmark industrie
- Suivi dans le temps (trimestriel)
- Segmentation clients (promoteurs vs détracteurs)

---

## 🛠️ Créer un Formulaire

### Méthode 1 : Avec l'Assistant IA

**Exemple :**
```
Vous : "Crée une enquête de satisfaction pour mon restaurant"

IA : "📋 Enquête Satisfaction Restaurant (6 questions)

1. [Rating 1-5] Note globale de votre expérience
2. [NPS 0-10] Recommanderiez-vous notre restaurant ?
3. [Choix multiples] Qu'avez-vous apprécié ?
   □ Qualité des plats
   □ Service rapide et attentionné
   □ Ambiance et décoration
   □ Rapport qualité-prix
   □ Autre
4. [Rating 1-5] Qualité des plats
5. [Rating 1-5] Qualité du service
6. [Texte libre] Vos suggestions pour nous améliorer ?

✅ Formulaire prêt ! Voulez-vous :
   • Le tester avec simulation IA ?
   • Ajouter une question conditionnelle ?
   • Le partager directement ?"
```

---

### Méthode 2 : Création Manuelle

**Étapes :**

1. **Dashboard → Nouveau formulaire**
   ```
   Titre : "Enquête Satisfaction Client"
   Description : "Aidez-nous à améliorer nos services"
   ```

2. **Ajouter des questions**
   ```
   [+ Ajouter une question]
   
   → Sélectionnez le type
   → Rédigez la question
   → Configurez les options
   → Enregistrez
   ```

3. **Réorganiser (Drag & Drop)**
   ```
   Q1. Note globale         ☰ [Glisser pour réordonner]
   Q2. NPS                  ☰
   Q3. Commentaires         ☰
   ```

4. **Paramètres globaux**
   ```
   Mode : ○ Classique  ⚫ Multi-étapes
   Thème : Nature / Minimaliste / Par défaut
   ☑ Afficher la progression
   ☑ Sauvegarder automatiquement
   ```

5. **Prévisualiser et publier**

---

## 🔀 Logique Conditionnelle

La **logique conditionnelle** permet d'afficher ou masquer des questions selon les réponses précédentes.

### Cas d'Usage

**Exemple : Satisfaction Client**
```
Q1. Êtes-vous satisfait de notre service ?
    ○ Oui
    ⚫ Non
    ○ Neutre

Si "Non" → Afficher Q2
Si "Oui" → Afficher Q3

Q2. [Visible si Q1 = Non]
    Que pouvons-nous améliorer ?
    [_________________]

Q3. [Visible si Q1 = Oui]
    Nous recommanderiez-vous ? (NPS 0-10)
```

---

### Créer une Règle Conditionnelle

**Interface de configuration :**
```
┌─────────────────────────────────────────────┐
│  Règle conditionnelle pour Q2               │
├─────────────────────────────────────────────┤
│  Afficher cette question si :               │
│                                             │
│  [Q1: Satisfaction] [=] [Non]  [+ ET/OU]   │
│                                             │
│  Actions :                                  │
│  ⚫ Afficher la question                     │
│  ○ Masquer la question                      │
│  ○ Passer à une autre question              │
│                                             │
│  [Enregistrer la règle]                     │
└─────────────────────────────────────────────┘
```

---

### Règles Multiples (ET / OU)

**Exemple complexe :**
```
Afficher Q5 si :
  (Q1 = "Non" ET Q2 contient "Prix")
  OU
  (Q3 < 3)

→ Q5 visible si client insatisfait du prix OU note < 3/5
```

---

### Bonnes Pratiques

✅ **À Faire :**
- Testez toutes les branches avec la simulation
- Maximum 3 niveaux de profondeur
- Questions conditionnelles = optionnelles (pas obligatoires)

❌ **À Éviter :**
- Boucles infinies (Q2 dépend de Q1, Q1 dépend de Q2)
- Plus de 5 règles par question (trop complexe)
- Conditions sur questions texte (imprécis)

---

## 📱 Mode Multi-Étapes

Le **mode multi-étapes** affiche une question par écran pour une meilleure UX mobile.

### Différences Visuelles

**Mode Classique :**
```
┌─────────────────────────────────┐
│ Q1. Question 1                  │
│ [Réponse]                       │
│                                 │
│ Q2. Question 2                  │
│ [Réponse]                       │
│                                 │
│ Q3. Question 3                  │
│ [Réponse]                       │
│                                 │
│ [Soumettre]                     │
└─────────────────────────────────┘
```

**Mode Multi-Étapes :**
```
┌─────────────────────────────────┐
│  ████░░░░░░░░░░ 25%             │ ← Progression
├─────────────────────────────────┤
│                                 │
│  Question 1 sur 4               │
│                                 │
│  Quel est votre niveau de       │
│  satisfaction ?                 │
│                                 │
│      ★ ★ ★ ★ ☆                  │
│                                 │
│              [Suivant →]        │
└─────────────────────────────────┘
```

---

### Avantages du Multi-Étapes

**Statistiques DooDates :**
- 📊 **Taux de complétion** : +15% vs mode classique
- ⏱️ **Temps par question** : -20% (meilleur focus)
- 📱 **UX mobile** : 90% préfèrent vs 60% classique

**Quand l'utiliser :**
- ✅ Formulaires longs (10+ questions)
- ✅ Public mobile-first
- ✅ Questions nécessitant de la réflexion
- ✅ Expérience conversationnelle souhaitée

**Quand éviter :**
- ❌ Formulaires courts (< 5 questions)
- ❌ Besoin de vue d'ensemble
- ❌ Questions interdépendantes à comparer

---

### Navigation Multi-Étapes

**Boutons :**
```
[← Précédent]  [Suivant →]  [Passer]
```

**Raccourcis clavier :**
- `Entrée` : Question suivante
- `Tab` : Entre les options
- `Espace` : Sélectionner une option

**Barre de progression :**
```
████████░░░░░░░░░░░░░░ 40%
Question 4 sur 10
```

---

## 🎨 Thèmes et Personnalisation

### Thèmes Disponibles

#### 1. Par Défaut
```
Couleurs : Bleu & Gris
Usage : Formulaires professionnels, B2B
```

#### 2. Nature (Gratuit)
```
Couleurs : Vert & Brun
Usage : Événements, associations, écologie
```

#### 3. Minimaliste Light/Dark (Premium)
```
Couleurs : Noir/Blanc avec accent Coral/Mint
Usage : Design moderne, tech, startups
```

---

### Personnalisation Avancée (Premium)

**Options :**
```
Logo : [Télécharger votre logo]
Couleur primaire : [#FF6B6B]
Couleur secondaire : [#4ECDC4]
Police : Inter / Roboto / Open Sans / Custom

Suppression branding :
☑ Masquer "Créé avec DooDates"
```

---

## 🧪 Tester Votre Formulaire

### Prévisualisation

**Bouton "Aperçu" dans l'éditeur :**
```
→ Ouvre le formulaire en mode lecture
→ Testez toutes les questions
→ Vérifiez la logique conditionnelle
→ Pas de sauvegarde des réponses
```

---

### Simulation de Réponses IA

**Fonctionnalité puissante :**
```
1. Cliquez sur "Simuler des réponses"
2. Choisissez le nombre : 20, 50, ou 100
3. L'IA génère des réponses réalistes
4. Consultez les résultats simulés
5. Vérifiez que tout fonctionne
6. Publiez en confiance !
```

**Avantages :**
- ✅ Teste la logique conditionnelle
- ✅ Prévisualise les graphiques
- ✅ Identifie les questions ambiguës
- ✅ Valide que le formulaire atteint votre objectif

**Voir :** [Guide Simulation](./07-Simulation-Reponses.md)

---

## 📊 Paramètres du Formulaire

### Paramètres de Base

```
Titre : "Enquête Satisfaction Client"
Description : "5 minutes pour nous aider à nous améliorer"

☑ Afficher le logo DooDates
☑ Afficher le temps estimé (5 min)
☑ Afficher le nombre de questions (6)
```

---

### Paramètres Avancés

**Réponses :**
```
☑ Autoriser les réponses anonymes
☐ Connexion requise (compte Google)
☑ Une seule réponse par personne (cookie)
☐ Autoriser la modification après soumission
```

**Collecte :**
```
Deadline : [15/11/2025 23:59]
Limite réponses : [Illimité] ou [100 max]
```

**Email confirmation :**
```
☑ Proposer copie par email au répondant
Texte checkbox : "Recevoir une copie de mes réponses"
```

---

### Visibilité des Résultats

```
Qui peut voir les résultats ?
⚫ Moi uniquement (créateur)
○ Les participants (après leur vote)
○ Tout le monde (public)
```

---

## 🎯 Checklist Avant Publication

**Avant de partager votre formulaire :**

### Contenu
- [ ] Titre clair et engageant
- [ ] Description avec durée estimée
- [ ] Toutes les questions ont un libellé clair
- [ ] Options de réponse cohérentes
- [ ] Pas de fautes d'orthographe

### Structure
- [ ] Ordre logique (facile → difficile)
- [ ] Maximum 15 questions
- [ ] Logique conditionnelle testée
- [ ] Questions obligatoires ≤ 30%

### Technique
- [ ] Simulation effectuée (30+ réponses)
- [ ] Prévisualisation mobile testée
- [ ] Tous les types de questions fonctionnent
- [ ] Temps de complétion < 5 minutes

### Diffusion
- [ ] Lien de partage testé
- [ ] Message d'accompagnement rédigé
- [ ] Deadline configurée
- [ ] Visibilité résultats définie

---

## 📚 Ressources Complémentaires

**Guides connexes :**
- [Assistant IA](./05-Assistant-IA.md) - Créer avec l'IA
- [Simulation](./07-Simulation-Reponses.md) - Tester avant publication
- [Analytics](./06-Analytics-IA.md) - Analyser les résultats
- [Bonnes Pratiques](./12-Bonnes-Pratiques.md) - Optimiser vos formulaires

---

**[← Sondages de Dates](./03-Sondages-Dates.md) | [Accueil](./README.md) | [Assistant IA →](./05-Assistant-IA.md)**

---

**© 2025 DooDates - Formulaires v1.0**

