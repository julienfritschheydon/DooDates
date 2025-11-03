# 🎨 Personnalisation

Guide complet pour personnaliser l'apparence et le comportement de vos sondages.

---

## 📋 Table des Matières

1. [Thèmes Visuels](#thèmes-visuels)
2. [Branding (Premium)](#branding-premium)
3. [Paramètres de Formulaire](#paramètres-de-formulaire)
4. [Mode Sombre](#mode-sombre)
5. [Paramètres Utilisateur](#paramètres-utilisateur)

---

## 🎨 Thèmes Visuels

DooDates propose **3 thèmes** pour personnaliser vos sondages.

### 1. Thème Par Défaut (Gratuit)

**Couleurs :**
- Primaire : Bleu `#3B82F6`
- Secondaire : Gris `#6B7280`
- Accent : Bleu clair `#60A5FA`

**Cas d'usage :**
- Formulaires professionnels B2B
- Enquêtes corporate
- Usage générique

**Aperçu :**
```
┌─────────────────────────────────┐
│  DooDates 📊              [✕]   │ ← Bleu
├─────────────────────────────────┤
│  Q1. Votre satisfaction ?       │
│                                 │
│  ○ Très satisfait               │ ← Gris
│  ○ Satisfait                    │
│  ○ Neutre                       │
│                                 │
│  [Suivant →]                    │ ← Bleu
└─────────────────────────────────┘
```

---

### 2. Thème Nature (Gratuit)

**Couleurs :**
- Primaire : Vert `#10B981`
- Secondaire : Brun `#78350F`
- Accent : Vert clair `#34D399`

**Cas d'usage :**
- Événements écologiques
- Associations environnementales
- Activités outdoor
- Formulaires chaleureux

**Aperçu :**
```
┌─────────────────────────────────┐
│  🌿 Enquête Événement            │ ← Vert
├─────────────────────────────────┤
│  Q1. Votre moyen de transport ? │
│                                 │
│  ○ Vélo 🚲                      │
│  ○ Transports en commun 🚌      │
│  ○ Covoiturage 🚗               │
│                                 │
│  [Suivant →]                    │ ← Vert
└─────────────────────────────────┘
```

---

### 3. Thème Minimaliste (Premium)

**Deux variantes :**

#### A. Minimaliste Light
```
Fond : Blanc pur
Texte : Noir `#000000`
Accent : Coral `#FF6B6B`
```

#### B. Minimaliste Dark
```
Fond : Noir pur
Texte : Blanc `#FFFFFF`
Accent : Mint `#00FFA3`
```

**Cas d'usage :**
- Startups tech
- Design moderne
- Applications SaaS
- Audiences jeunes (18-35 ans)

**Aperçu Light :**
```
┌─────────────────────────────────┐
│  Form                       [×] │ ← Noir/Blanc pur
├─────────────────────────────────┤
│  Question 1                     │
│                                 │
│  ⬤ Option A                     │
│  ○ Option B                     │ ← Minimaliste
│  ○ Option C                     │
│                                 │
│  [Next →]                       │ ← Accent Coral
└─────────────────────────────────┘
```

---

### Changer de Thème

**Lors de la création :**
```
Formulaire → Paramètres → Apparence
  Thème : ⚫ Par défaut
          ○ Nature
          ○ Minimaliste Light (Premium)
          ○ Minimaliste Dark (Premium)
```

**Après création :**
```
Dashboard → Sondage → Menu ••• → "Changer le thème"
```

**Aperçu en temps réel :**
```
[Prévisualiser] pour voir le rendu avant d'appliquer
```

---

## 🎨 Branding (Premium)

### Logo Personnalisé

**Remplacez le logo DooDates par le vôtre :**

```
Paramètres → Branding → Logo
  [Télécharger votre logo]
  
  Formats acceptés : PNG, SVG, JPG
  Taille recommandée : 200x50px
  Poids max : 500 KB
  Fond transparent : Recommandé (PNG/SVG)
```

**Positionnement :**
```
⚫ En-tête (défaut)
○ Pied de page
○ En-tête + Pied de page
```

**Aperçu :**
```
┌─────────────────────────────────┐
│  [Votre Logo]              [×]  │ ← Votre logo
├─────────────────────────────────┤
│  Enquête Satisfaction           │
│  ...                            │
└─────────────────────────────────┘
```

---

### Couleurs Personnalisées

**Définissez votre charte graphique :**

```
Paramètres → Branding → Couleurs

Couleur primaire : [#FF6B6B] 🎨
  Utilisée pour : Boutons, liens, titres

Couleur secondaire : [#4ECDC4] 🎨
  Utilisée pour : Éléments secondaires, badges

Couleur d'accent : [#F7FFF7] 🎨
  Utilisée pour : Hover, focus, highlights
```

**Prévisualisation en direct :**
```
Changement immédiat dans l'aperçu
```

---

### Polices Personnalisées

**Choisissez votre typographie :**

```
Paramètres → Branding → Polices

Police titres : [Inter ▼]
  Options : Inter, Roboto, Open Sans, Lato, Poppins

Police corps : [Inter ▼]
  Options : Inter, Roboto, Open Sans, Lato, Poppins

Police boutons : [Inter ▼]
  Options : Inter, Roboto, Open Sans, Lato, Poppins

☑ Utiliser ma police personnalisée (Custom Font)
  [Télécharger .woff2]
```

---

### Suppression du Branding DooDates

**Masquez "Créé avec DooDates" :**

```
Paramètres → Branding
☑ Masquer le logo DooDates
☑ Masquer "Créé avec DooDates" en pied de page
☑ Supprimer les liens externes DooDates

⚠️ Feature Premium uniquement
```

**Avant :**
```
└─────────────────────────────────┘
  Créé avec DooDates 💙
```

**Après :**
```
└─────────────────────────────────┘
  [Rien ou votre texte personnalisé]
```

---

### Custom Domain (Enterprise)

**Utilisez votre propre domaine :**

```
Au lieu de : doodates.com/vote/abc123
Utilisez : surveys.votreentreprise.com/abc123

Configuration :
1. Ajoutez un CNAME dans votre DNS
2. Validez dans DooDates → Settings → Custom Domain
3. Certificat SSL automatique (Let's Encrypt)
```

---

## ⚙️ Paramètres de Formulaire

### Message de Bienvenue

**Personnalisez l'intro :**

```
Paramètres → Messages → Message de bienvenue

┌─────────────────────────────────────────┐
│  🎯 Votre avis compte !                 │
│                                         │
│  Aidez-nous à améliorer notre service  │
│  en répondant à ce court questionnaire. │
│                                         │
│  ⏱️ Durée : 3 minutes                   │
│  🎁 Incentive : 10% de réduction        │
│                                         │
│  Vos réponses sont anonymes et          │
│  confidentielles.                       │
└─────────────────────────────────────────┘

[Modifier le texte]
```

---

### Message de Fin

**Personnalisez la confirmation :**

```
Paramètres → Messages → Message de fin

Texte par défaut :
"✅ Merci pour vos réponses !
Nous prenons votre feedback très au sérieux."

Personnalisé :
"🎉 Merci beaucoup !
Votre code promo : MERCI10
Valable jusqu'au 31/12/2025"
```

---

### Barre de Progression

**Style de la barre :**

```
Paramètres → Progression

Style : ⚫ Barre classique
        ○ Étapes numérotées
        ○ Cercle de progression
        ○ Masqué

Texte : ⚫ "Question X sur Y"
        ○ "X% complété"
        ○ "X questions restantes"
        ○ Aucun texte
```

**Exemples :**

**Barre classique :**
```
████████░░░░░░░░░░░░░░ 40%
Question 4 sur 10
```

**Étapes numérotées :**
```
[1]──[2]──[3]──●──[5]──[6]──[7]
            4
```

**Cercle :**
```
      40%
    ╱─────╲
   │   4   │
   │  /10  │
    ╲─────╱
```

---

### Boutons de Navigation

**Texte personnalisé :**

```
Paramètres → Boutons

Bouton "Suivant" : [Suivant →]
  Alternatives : "Continuer", "Next", "Valider"

Bouton "Précédent" : [← Retour]
  Alternatives : "Back", "Précédent", "Revenir"

Bouton "Soumettre" : [Envoyer mes réponses]
  Alternatives : "Terminer", "Submit", "Valider"
```

---

## 🌓 Mode Sombre

### Activer le Mode Sombre

**Trois options :**

#### 1. Automatique (Système)
```
Settings → Apparence → Mode sombre
⚫ Automatique (suit le système)
○ Clair
○ Sombre
```
**Suit les préférences de l'OS (Windows/Mac/iOS/Android)**

#### 2. Manuel Clair
```
⚫ Toujours en mode clair
```

#### 3. Manuel Sombre
```
⚫ Toujours en mode sombre
```

---

### Thèmes en Mode Sombre

**Adaptation automatique :**

**Thème Par Défaut :**
```
Mode Clair : Fond blanc, texte noir
Mode Sombre : Fond #1F2937 (gris foncé), texte blanc
```

**Thème Nature :**
```
Mode Clair : Fond beige, texte brun
Mode Sombre : Fond #1C2321 (vert foncé), texte vert clair
```

**Thème Minimaliste :**
```
Mode Clair : Blanc pur + Coral
Mode Sombre : Noir pur + Mint
```

---

### Aperçu Côte à Côte

**Bouton de prévisualisation :**
```
[👁️ Aperçu Clair/Sombre]
→ Affiche les deux versions simultanément
```

---

## 👤 Paramètres Utilisateur

### Langue de l'Interface

**Langues disponibles :**
```
Settings → Langue
⚫ Français
○ English
○ Español (bientôt)
○ Deutsch (bientôt)
```

---

### Notifications

**Configurer les alertes :**

```
Settings → Notifications

Email :
☑ Nouveau vote reçu (résumé quotidien)
☑ Sondage atteint 50% de réponses
☑ Deadline proche (24h avant)
☑ Newsletter DooDates (1x/mois)

Push (si PWA installée) :
☑ Nouveau vote (temps réel)
☐ Rappel sondages à clôturer
```

---

### Raccourcis Clavier

**Personnaliser les raccourcis :**

```
Settings → Raccourcis

Ctrl+D : Dashboard (par défaut)
  Modifier : [___]

Ctrl+N : Nouveau sondage
  Modifier : [___]

Ctrl+K : Assistant IA
  Modifier : [___]

[Réinitialiser aux valeurs par défaut]
```

---

### Préférences de Création

**Valeurs par défaut :**

```
Settings → Création

Type de sondage préféré :
⚫ Formulaire
○ Sondage de dates
○ Demander à chaque fois

Mode formulaire par défaut :
⚫ Multi-étapes
○ Classique
○ Demander à chaque fois

Thème par défaut :
⚫ Par défaut
○ Nature
○ Minimaliste (si Premium)
```

---

## 🎯 Templates Personnalisés

### Créer un Template

**Réutilisez vos formulaires favoris :**

```
Dashboard → Sondage → Menu ••• → "Sauvegarder comme template"

Nom du template : "Satisfaction Restaurant"
Description : "6 questions pour évaluer satisfaction client"
Catégorie : Satisfaction Client

☑ Inclure les questions
☑ Inclure la logique conditionnelle
☑ Inclure le thème
☐ Inclure les réponses simulées
```

---

### Utiliser un Template

**Créer depuis un template :**

```
Dashboard → "Nouveau depuis template"

Vos templates :
• Satisfaction Restaurant
• Feedback Produit SaaS
• Sondage Réunion Hebdo

Templates publics :
• NPS Standard
• Satisfaction Client (Generic)
• Event RSVP
```

---

### Partager un Template (Premium)

**Publiez votre template :**

```
Template → Menu ••• → "Publier dans la bibliothèque"

Visibilité :
○ Privé (moi uniquement)
○ Organisation (mon équipe)
⚫ Public (bibliothèque DooDates)

Si accepté :
→ Votre template sera disponible pour tous
→ Badge "Créateur de template" sur votre profil
```

---

## 💡 Conseils de Personnalisation

### 1. Cohérence avec Votre Marque

**Checklist :**
- [ ] Logo téléchargé
- [ ] Couleurs de la charte graphique appliquées
- [ ] Police d'entreprise configurée
- [ ] Branding DooDates masqué (si Premium)

---

### 2. Testez en Mobile

**Avant de publier :**
```
1. Prévisualisez sur mobile (icône 📱)
2. Vérifiez lisibilité du logo
3. Testez les boutons (taille touch)
4. Validez les couleurs (contraste)
```

---

### 3. Mode Sombre Friendly

**Si vous personnalisez les couleurs :**
```
⚠️ Vérifiez que vos couleurs sont lisibles en mode sombre

Outil de test :
Paramètres → Branding → [Test Contraste]
→ Simule automatiquement le mode sombre
```

---

## ❓ Questions Fréquentes

### Le branding personnalisé est-il disponible en version gratuite ?

**Non**, le branding avancé nécessite un abonnement payant.

- **Version gratuite** : Thèmes prédéfinis (Défaut, Nature)
- **Versions payantes** : Couleurs personnalisées, logo, white-label, domaine personnalisé

Consultez notre **[page Tarifs](/pricing)** pour plus de détails.

---

### Puis-je utiliser plusieurs templates ?

**Oui, illimité !** Créez autant de templates que vous voulez.

---

### Les modifications s'appliquent-elles aux sondages existants ?

**Non**, uniquement aux nouveaux sondages.

Pour appliquer à un existant :
```
Dashboard → Sondage → "Changer le thème"
```

---

## 🔗 Guides Connexes

- [Formulaires](./04-Formulaires-Questionnaires.md) - Créer des formulaires
- [Dashboard](./10-Tableau-Bord.md) - Gérer vos sondages
- [Bonnes Pratiques](./12-Bonnes-Pratiques.md) - Optimiser vos sondages

---

**[← Bonnes Pratiques](./12-Bonnes-Pratiques.md) | [Accueil](./README.md) | [FAQ →](./14-FAQ.md)**

---

**© 2025 DooDates - Personnalisation v1.0**

