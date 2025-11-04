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
8. [Analyser les Résultats avec Analytics IA](#analyser-les-résultats-avec-analytics-ia)

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

## 🎨 Thèmes Visuels

**Note :** Les thèmes visuels ne sont pas encore implémentés. Cette fonctionnalité est prévue pour une prochaine version.

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

La **simulation de réponses** utilise l'IA pour générer des réponses fictives mais réalistes à votre formulaire.

#### Pourquoi Simuler ?

**Avant de partager, vérifiez :**
- ✅ **Logique conditionnelle** : Les questions s'affichent correctement
- ✅ **Graphiques** : Les visualisations sont claires
- ✅ **Durée** : Temps de complétion réaliste
- ✅ **Objectif** : Le formulaire atteint votre but
- ✅ **Clarté** : Pas de questions ambiguës

**Bénéfices :**
- 🎯 **Confiance** : Publiez sans crainte
- 📊 **Aperçu** : Visualisez les résultats futurs
- 🐛 **Bugs** : Détectez les problèmes avant
- ⏱️ **Gain de temps** : Pas besoin de vrais testeurs

#### Lancer une Simulation

**Depuis l'éditeur :**
```
Formulaire Éditeur → [🧪 Simuler des réponses]
```

**Paramètres :**
- **Nombre de réponses** : 20 (rapide), 50 (recommandé), 100 (complet)
- **Profil des répondants** (optionnel) : "Clients restaurant, 30-60 ans"
- **Objectif du formulaire** (optionnel) : "Mesurer la satisfaction client"

**Processus :**
```
🔄 Analyse du formulaire... (5s)
🤖 Génération des réponses... (45s)
✅ Simulation terminée ! (50 réponses générées)
   [Voir les résultats]
```

#### Analyser les Résultats Simulés

Après simulation, vous accédez aux résultats avec :
- 📊 Graphiques standards (choix, NPS, Rating, Matrix)
- 📝 Commentaires texte libres réalistes
- ✅ Vérification de la logique conditionnelle

**Note :** Les données sont marquées comme "simulées" et ne comptent pas dans les statistiques réelles.

#### Validation d'Objectifs (Premium)

L'IA analyse si votre formulaire atteint votre objectif :

**Exemple :**
```
Objectif : "Mesurer la satisfaction client"

✅ Score d'adéquation : 85/100

💡 Recommandations :
1. Ajouter une question sur les priorités d'amélioration
2. Renforcer les questions ouvertes
```

#### Bonnes Pratiques

1. **Simulez toujours avant publication** (30+ réponses)
2. **Utilisez un profil réaliste** pour des réponses contextualisées
3. **Itérez plusieurs fois** : 1ère simulation = détection, 2ème = validation, 3ème = polish final

**Quota :** 1 simulation (50 réponses) = 1 crédit IA. Les réponses simulées sont visibles temporairement et supprimées automatiquement après 24h.

---

## 🤖 Analyser les Résultats avec Analytics IA

### Vue d'Ensemble

Analytics IA est un système d'analyse automatique qui :
- 🔍 **Détecte les tendances** dans vos réponses
- 💡 **Génère des insights** pertinents automatiquement
- ❓ **Répond à vos questions** sur les données
- 📊 **Crée des visualisations** intelligentes
- 🎯 **Identifie des corrélations** cachées

**Gain de temps :** 80% plus rapide que l'analyse manuelle

---

### Accéder aux Analytics IA

**Étapes :**
```
1. Ouvrez votre formulaire dans le Dashboard
2. Cliquez sur "Voir les résultats"
3. Le panneau "Analytics IA" s'affiche à droite
```

**Interface :**
```
┌─────────────────────────────────────────────┐
│  📊 Résultats : Satisfaction Client 2025    │
├─────────────────────────────────────────────┤
│                                             │
│  [Graphiques et stats]  │  🤖 Analytics IA  │
│                         │                   │
│                         │  💡 Insights (3)  │
│                         │  ❓ Quick Queries │
│                         │  💬 Poser une Q   │
└─────────────────────────────────────────────┘
```

---

### Insights Automatiques

Un **insight** est une observation pertinente détectée automatiquement par l'IA.

#### Types d'Insights

**1. Tendances Générales 📈**
```
💡 Tendance forte détectée
"78% des répondants sont satisfaits ou très satisfaits.
 Taux de satisfaction en hausse de +15% vs dernier trimestre."
```

**2. Corrélations 🔗**
```
💡 Corrélation identifiée
"Les personnes donnant une note NPS ≥ 9 mentionnent 
 systématiquement 'rapidité' dans leurs commentaires positifs.
 Corrélation : 0.87 (très forte)"
```

**3. Anomalies 🚨**
```
⚠️ Anomalie détectée
"Les réponses du 15 novembre montrent un taux de satisfaction 
 de 32%, significativement inférieur à la moyenne de 76%.
 18 réponses concernées."
```

**4. Segmentation 👥**
```
💡 Différence de segment
"Les utilisateurs de 25-34 ans sont 2x plus susceptibles 
 de recommander le produit (NPS moyen: 8.2) que les 55+ (NPS: 4.1)"
```

**5. Points d'Amélioration 🎯**
```
🎯 Axe d'amélioration prioritaire
"'Délai de livraison' mentionné dans 64% des commentaires négatifs.
 Impact estimé sur NPS : -12 points si résolu."
```

**Mise à jour :** Les insights se mettent à jour automatiquement toutes les 5 nouvelles réponses ou toutes les 24h.

---

### Quick Queries

Des **questions prédéfinies** pour analyse rapide sans rédiger de prompt.

#### Exemples de Quick Queries

**Métriques Générales :**
```
❓ Combien de personnes ont répondu ?
   → "127 réponses reçues entre le 1er et le 15 novembre"

❓ Quel est le taux de complétion ?
   → "89% des participants ont complété le formulaire (113/127)"

❓ Temps de réponse moyen ?
   → "3 minutes 42 secondes (médiane : 2min 15s)"
```

**Satisfaction & NPS :**
```
❓ Quel est le score NPS global ?
   → "NPS = +42 (Excellent)
       Promoteurs: 58% | Passifs: 26% | Détracteurs: 16%"

❓ Quelle est la satisfaction moyenne ?
   → "4.2/5 étoiles (84% de satisfaction)"
```

**Top Réponses :**
```
❓ Quels sont les 3 points forts ?
   → "1. Rapidité (mentionnée 45x)
       2. Qualité (38x)
       3. Prix compétitif (32x)"

❓ Quels sont les 3 axes d'amélioration ?
   → "1. SAV (23 mentions négatives)
       2. Livraison (18x)
       3. Disponibilité produits (15x)"
```

**Utilisation :** Cliquez directement sur la question dans la liste, ou recherchez-la avec la barre de recherche.

---

### Questions Libres

Vous pouvez poser **n'importe quelle question** sur vos données.

#### ✅ Bonnes Questions (Spécifiques)

```
"Quelle est la corrélation entre l'âge et la satisfaction ?"
→ Analyse statistique précise

"Les personnes ayant choisi 'Prix' comme point fort 
 ont-elles un NPS plus élevé ?"
→ Segmentation croisée

"Quels mots reviennent le plus dans les commentaires négatifs ?"
→ Analyse sémantique
```

#### ❌ Questions Trop Vagues

```
"Analyse les résultats"
→ Trop général, l'IA ne saura pas quoi prioriser

"C'est bien ?"
→ Pas de critère clair
```

**Format de réponse :** L'IA structure ses réponses en 3 parties : réponse directe, détails & chiffres, recommandations.

---

### Quotas et Limites

Une **"conversation IA"** consomme 1 crédit pour :
- 1 insight généré automatiquement
- 1 quick query exécutée
- 1 question libre posée

**Quotas par plan :**
- 🆓 **Mode Invité** : 5 conversations IA (création de sondages)
- 👤 **Compte Gratuit** : 1000 conversations IA
- 💼 **Pro** : Illimité
- 🚀 **Premium** : Illimité + fonctionnalités avancées

**Optimiser votre quota :**
1. Désactiver les insights automatiques (si non nécessaires)
2. Utiliser les graphiques natifs d'abord
3. Poser des questions groupées (au lieu de plusieurs séparées)
4. Exporter les insights importants

**Vérifier votre quota :** Indicateur visible dans l'en-tête du Dashboard

---

### Bonnes Pratiques Analytics IA

**1. Attendez un minimum de réponses**
- ⚠️ **< 10 réponses** : Insights peu fiables
- ✅ **10-30 réponses** : Tendances générales OK
- 🎯 **30-100 réponses** : Analyses fiables
- 🚀 **100+ réponses** : Insights très précis

**2. Contextualisez vos questions**
```
❌ "Les résultats sont bons ?"
✅ "Le NPS de +38 est-il bon pour une entreprise SaaS B2B 
    comparé aux benchmarks du secteur ?"
```

**3. Combinez Insights IA + Jugement Humain**
L'IA détecte les patterns statistiques, vous apportez le contexte métier et les décisions.

---

### Dépannage Analytics IA

#### "Quota IA épuisé"

**Solutions :**
1. Attendez le reset (1er du mois pour comptes gratuits)
2. Passez en Pro (conversations illimitées)
3. Optimisez votre usage (désactivez insights auto, utilisez graphiques natifs d'abord)

#### Insights IA peu pertinents

**Causes :**
1. Trop peu de réponses (< 10)
2. Questions mal formulées (ambiguës)
3. Données incohérentes (erreurs de saisie)

**Solutions :** Attendez 30+ réponses, reformulez les questions, validez les réponses aberrantes.

#### Quick Query ne répond pas

**Solutions :**
1. Rafraîchir la page (F5)
2. Vérifier le quota IA
3. Vérifier la connexion internet

---

### FAQ Analytics IA

**Les insights sont-ils toujours fiables ?**
La fiabilité dépend du nombre de réponses : 10-30 = tendances générales, 30-100 = bonne fiabilité, 100+ = très fiable.

**L'IA a-t-elle accès à toutes mes données ?**
L'IA n'analyse que les réponses au formulaire concerné et métadonnées anonymisées. Pas vos autres sondages ni données personnelles.

**Puis-je désactiver les insights automatiques ?**
Oui : `Paramètres` → `Analytics IA` → `Insights auto : OFF`. Économise 3 crédits par ouverture.

**Que fait l'IA de mes données après analyse ?**
Analyse en temps réel (non stockée), pas d'entraînement de modèle, conformité RGPD stricte, pas de partage avec tiers.

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

## ❌ Dépannage

### "Vous avez déjà voté"

**Cause :** Cookie de vote déjà présent

**Solutions :**

1. **Vote légitime à modifier**
   ```
   → Cliquez sur "Modifier mon vote"
   → Changez vos réponses
   → Enregistrez
   ```

2. **Voter depuis un autre appareil**
   ```
   → Normal : 1 vote par appareil en mode invité
   → Solution : Utilisez un autre appareil/navigateur
   ```

3. **Erreur de cookie**
   ```
   1. Supprimez les cookies de doodates.com
   2. Rafraîchissez la page
   3. Revotez
   ```

---

### Questions conditionnelles ne s'affichent pas

**Cause :** Logique conditionnelle mal configurée ou réponse inattendue

**Vérifications :**

1. **Réponse attendue**
   ```
   Exemple :
   Q1 : "Êtes-vous satisfait ?" → Réponse : "Non"
   Q2 (si Q1 = "Non") : "Pourquoi ?" → Devrait s'afficher
   
   Si Q2 ne s'affiche pas :
   → Vérifiez que la condition est bien "Q1 = Non"
   → Pas "Q1 ≠ Oui" (différent si option "Neutre" existe)
   ```

2. **Tester en mode aperçu**
   ```
   Créateur : Dashboard → Sondage → "Aperçu"
   → Testez toutes les branches conditionnelles
   ```

---

### Lien de vote invalide

**Message : "Sondage introuvable"**

**Causes possibles :**

1. **Sondage supprimé**
   ```
   → Le créateur a supprimé le sondage
   → Contactez-le pour vérification
   ```

2. **Sondage clôturé avec deadline**
   ```
   → Date de clôture dépassée
   → Demandez au créateur de le rouvrir
   ```

3. **Lien réinitialisé**
   ```
   → Le créateur a généré un nouveau lien
   → Demandez le nouveau lien
   ```



---

## 📚 Ressources Complémentaires

**Guides connexes :**
- [Assistant IA](./05-Assistant-IA.md) - Créer avec l'IA
- [Gestion des Résultats](./06-Gestion-Resultats.md) - Visualiser et exporter

---

**[← Sondages de Dates](./03-Sondages-Dates.md) | [Assistant IA →](./05-Assistant-IA.md)**

---

**© 2025 DooDates - Formulaires v1.0**

