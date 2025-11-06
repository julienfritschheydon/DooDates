# 📊 Gestion des Résultats

Guide complet pour visualiser, analyser et exploiter les résultats de vos sondages.

---

## 📋 Table des Matières

1. [Accéder aux Résultats](#accéder-aux-résultats)
2. [Types de Visualisations](#types-de-visualisations)
3. [Statistiques Détaillées](#statistiques-détaillées)
4. [Contrôle d'Accès](#contrôle-daccès)
5. [Actions sur les Résultats](#actions-sur-les-résultats)
6. [Temps Réel](#temps-réel)

---

## 🔓 Accéder aux Résultats

### Depuis le Dashboard

```
Dashboard → Votre sondage → [Voir les résultats]
```

**Ou via le lien direct :**
```
https://doodates.com/results/abc123
```

---

### Vérification des Permissions

**Accès autorisé si :**
- ✅ Vous êtes le **créateur** du sondage
- ✅ Vous avez **voté** (si visibilité = "Participants")
- ✅ Visibilité = "Public"

**Accès refusé si :**
- ❌ Visibilité = "Créateur uniquement" ET vous n'êtes pas le créateur
- ❌ Visibilité = "Participants" ET vous n'avez pas voté

---

## 📊 Types de Visualisations

### Sondages de Dates

#### Vue Tableau
```
┌─────────────────────────────────────────────────────┐
│  Mardi 12 nov, 9h-11h                               │
│  ████████████████░░░░░░ 75% (6/8)                   │
│  ✓ Alice, Bob, Claire, David, Emma, Frank           │
│  ? (aucun)                                          │
│  ✗ Grace, Henry                                     │
├─────────────────────────────────────────────────────┤
│  Mardi 12 nov, 14h-16h                              │
│  ████████████████████░░ 87% (7/8)  🏆 MEILLEUR     │
│  ✓ Alice, Bob, Claire, David, Emma, Frank, Grace    │
│  ? (aucun)                                          │
│  ✗ Henry                                            │
└─────────────────────────────────────────────────────┘
```

#### Vue Matrice
```
                  12/11  12/11  14/11
                  9h-11h 14h-16h 14h-16h
Alice Martin        ✓      ✓      ✓
Bob Chen            ✓      ✓      ✓
Claire Dubois       ✓      ✓      ✓
David Lee           ✓      ✓      ✓
Emma Wilson         ✓      ✓      ✓
Frank Garcia        ✓      ✓      ?
Grace Kim           ✗      ✓      ✗
Henry Taylor        ✗      ✗      ✗
```

#### Vue Calendrier
```
 Novembre 2025
┌──┬──┬──┬──┬──┬──┬──┐
│L │M │M │J │V │S │D │
├──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │  │
│  │12│  │14│  │  │  │ ← Dates du sondage
│  │🟢│  │🟡│  │  │  │ ← Code couleur
└──┴──┴──┴──┴──┴──┴──┘

Légende :
🟢 75%+ disponibles
🟡 50-75% disponibles
🔴 < 50% disponibles
```

---

### Formulaires

#### Questions à Choix (Pie Chart)
```
Q1 : Niveau de satisfaction

         16%
      ▄▄▄▄▄▄▄
    ▄▄       ▄▄
   ▄   48%     ▄
  ▄    •       ▄
  ▄            ▄
   ▄          ▄
    ▄▄       ▄▄
      ▄▄▄▄▄▄▄
         32%

🟢 Très satisfait : 48% (24)
🟡 Satisfait : 32% (16)
🟠 Neutre : 16% (8)
🔴 Insatisfait : 4% (2)
```

#### Questions à Choix Multiples (Bar Chart)
```
Q2 : Qu'appréciez-vous ?

Qualité       ████████████████████ 78% (39)
Service       ████████████████ 64% (32)
Prix          ██████████ 42% (21)
Ambiance      ████████ 36% (18)
```

#### Rating (Distribution)
```
Q3 : Note globale

Note moyenne : 4.2/5 ⭐⭐⭐⭐☆

5★ ████████████ 40% (20)
4★ ████████████████ 36% (18)
3★ ████████ 16% (8)
2★ ████ 6% (3)
1★ ██ 2% (1)
```

#### NPS (Score + Segments)
```
Q4 : Net Promoter Score

┌─────────────────────────────────────────┐
│         Score NPS : +42                 │
│         ─────────────                   │
│         Excellent 🎉                     │
└─────────────────────────────────────────┘

🟢 Promoteurs (9-10) : 58% (29)
   ████████████████████████████

🟡 Passifs (7-8) : 26% (13)
   █████████████

🔴 Détracteurs (0-6) : 16% (8)
   ████████

Détail par note :
10 ████████ 32%
9  ██████ 26%
8  ████ 18%
7  ██ 8%
6  █ 4%
0-5 ██ 12%
```

#### Matrix (Heatmap)
```
Q5 : Évaluez notre service

                   Très mauvais|Mauvais|Moyen|Bon|Excellent
Qualité produit         2%     |  4%   | 14% |28%|  52%  ← 🟢
Rapport qualité/prix    6%     | 12%   | 24% |38%|  20%  ← 🟡
Service client          0%     |  2%   |  8% |36%|  54%  ← 🟢
Livraison              14%     | 26%   | 32% |20%|   8%  ← 🔴

Légende :
🟢 Score élevé (> 4/5 moyen)
🟡 Score moyen (3-4/5)
🔴 Score faible (< 3/5)
```

#### Texte Libre (Nuage + Liste)
```
Q6 : Vos suggestions ?

Nuage de mots :
    qualité    service
       RAPIDITÉ
    ambiance  prix  livraison
       menu    parking
    
Mots-clés les plus fréquents :
1. Rapidité (12 mentions)
2. Qualité (8 mentions)
3. Service (7 mentions)

Liste des réponses :
• "Améliorer la rapidité du service en rush"
• "Très satisfait de la qualité, continuer !"
• "Plus de choix végétariens au menu"
... (47 autres réponses)
```

---

## 📈 Statistiques Détaillées

### Vue d'Ensemble

**En haut de la page de résultats :**
```
┌──────────────────────────────────────────────────┐
│  📊 Résultats : Satisfaction Client Q4           │
├──────────────────────────────────────────────────┤
│  ✅ Réponses : 50/100 (50%)                      │
│  ⏱️ Temps moyen : 3min 24s                       │
│  📅 Période : 01/11 - 15/11/2025                 │
│  🎯 Taux de complétion : 94% (47/50)            │
│  📊 NPS moyen : +42                              │
│  ⭐ Satisfaction : 4.2/5                         │
└──────────────────────────────────────────────────┘
```

---

### Par Question

**Statistiques détaillées pour chaque question :**

```
Q1 : Niveau de satisfaction (Rating 1-5)

📊 Statistiques :
• Moyenne : 4.2/5
• Médiane : 4/5
• Mode : 5 (réponse la plus fréquente)
• Écart-type : 0.87

Distribution :
5★ ████████████ 40% (20)
4★ ████████████████ 36% (18)
3★ ████████ 16% (8)
2★ ████ 6% (3)
1★ ██ 2% (1)

🎯 Insights :
• 76% des répondants sont satisfaits (4-5★)
• Seuls 8% insatisfaits (1-2★)
• Tendance positive
```

---

### Tendances Temporelles

**Graphique d'évolution :**
```
📈 Satisfaction dans le temps

5 │                           ●
  │                      ●●●  │
4 │              ●●●●●●●     │
  │         ●●●●             │
3 │    ●●●●                  │
  │ ●●●                      │
2 │                          │
  │                          │
1 │                          │
  └──────────────────────────
   1/11  5/11  10/11  15/11

💡 Insight : Satisfaction en hausse constante
   (+0.8 point depuis le début)
```

---

### Segmentation

**Résultats par groupe :**

```
📊 Satisfaction par tranche d'âge

18-24 ans : 4.6/5 ⭐⭐⭐⭐⭐ (12 réponses)
25-34 ans : 4.3/5 ⭐⭐⭐⭐☆ (18 réponses)
35-44 ans : 4.0/5 ⭐⭐⭐⭐  (15 réponses)
45+ ans   : 3.7/5 ⭐⭐⭐☆  (5 réponses)

💡 Insight : Les plus jeunes sont plus satisfaits
```

---

## 🔐 Contrôle d'Accès

### Configurer la Visibilité

**Paramètres du sondage (lors de la création) :**
```
Visibilité des résultats :
⚫ Moi uniquement (par défaut)
○ Personnes ayant voté (recommandé)
○ Public (tout le monde)
```

**Où trouver :**
- Dans l'éditeur de formulaire, section "Visibilité des résultats"
- Modifiable après publication via Dashboard → Modifier

---

### Visibilité : Moi Uniquement (Creator-Only)

**Qui peut voir :**
- ✅ Seulement le créateur du sondage

**Comportement :**
- Après avoir voté, le bouton "Voir les résultats" **n'apparaît pas**
- Accès direct à `/poll/{slug}/results` → Message "Accès restreint"
- Seul le créateur peut voir les résultats depuis son Dashboard

**Avantages :**
- ✅ Confidentialité maximale
- ✅ Contrôle total
- ✅ Pas de biais de réponses

**Cas d'usage :**
- Enquêtes RH sensibles
- Feedback confidentiel
- Études de marché compétitives
- Éviter les biais de réponses

---

### Visibilité : Personnes Ayant Voté (Voters)

**Qui peut voir :**
- ✅ Le créateur
- ✅ Toute personne ayant voté

**Comportement :**
- Après avoir voté, le bouton **"Voir les résultats"** apparaît
- Cliquer sur le bouton → Accès aux résultats
- Accès direct à `/poll/{slug}/results` → Résultats visibles (si vous avez voté)
- Si vous n'avez pas voté → Message "Accès restreint" + "💡 Votez pour voir les résultats !"

**Avantages :**
- ✅ Transparence après participation
- ✅ Engagement des participants
- ✅ Décisions collaboratives

**Cas d'usage :**
- Sondages de groupe (date de réunion)
- Décisions d'équipe
- Votes communautaires
- Transparence après participation

---

### Visibilité : Public

**Qui peut voir :**
- ✅ Tout le monde (même sans voter)

**Comportement :**
- Accès direct à `/poll/{slug}/results` → Résultats visibles immédiatement
- Pas besoin de voter pour voir les résultats
- Partage facile des résultats

**Avantages :**
- ✅ Maximum de transparence
- ✅ Partage facile
- ✅ Marketing viral

**Risques :**
- ⚠️ Biais de réponses ("effet mouton" - les gens voient les réponses avant de voter)
- ⚠️ Données sensibles exposées

**Cas d'usage :**
- Sondages d'opinion publics
- Études de marché transparentes
- Votes ouverts

---

### Vérification des Permissions

**Accès autorisé si :**
- ✅ Vous êtes le **créateur** du sondage
- ✅ Vous avez **voté** (si visibilité = "Personnes ayant voté")
- ✅ Visibilité = "Public"

**Accès refusé si :**
- ❌ Visibilité = "Moi uniquement" ET vous n'êtes pas le créateur
- ❌ Visibilité = "Personnes ayant voté" ET vous n'avez pas voté

**Message d'erreur :**
```
┌─────────────────────────────────────────┐
│  🔒 Accès restreint                     │
├─────────────────────────────────────────┤
│  Le créateur de ce sondage a choisi de  │
│  ne pas partager les résultats          │
│  publiquement.                          │
│                                         │
│  💡 Votez pour voir les résultats !     │
│  (si visibilité = "Personnes ayant voté")
└─────────────────────────────────────────┘
```

---

## ⚡ Actions sur les Résultats

### Barre d'Actions

```
[📥 Exporter ▼] [🔗 Partager] [📊 Analytics IA] [⚙️ •••]
```

---

### Exporter

**Formats disponibles :**
```
📥 Exporter ▼
├── CSV (Excel, Google Sheets)
├── PDF (Rapport imprimable)
├── JSON (Données brutes, API)
└── Markdown (Documentation)
```

**Voir :** Les exports sont disponibles directement depuis la page de résultats (bouton "Exporter").

---

### Partager les Résultats

**Copier le lien :**
```
1. Sur la page de résultats, cliquez sur "Partager"
2. Le lien est copié dans votre presse-papier
3. Collez-le dans votre email, message, etc.
```

**Format du lien :**
```
https://doodates.com/results/{poll-slug}
```

**Note :** Les fonctionnalités de partage direct (email automatique, QR Code, intégrations Slack/Teams) sont prévues pour une prochaine version.

---

### Analytics IA

**Bouton dédié :**
```
[📊 Analytics IA]
→ Ouvre le panneau d'analyse intelligente
→ Insights automatiques
→ Quick Queries
→ Questions libres
```

**Voir :** [Section Analytics IA](./04-Formulaires-Questionnaires.md#analyser-les-résultats-avec-analytics-ia) dans le guide Formulaires

---

### Menu Actions (•••)

```
⚙️ Menu Actions
├── 🔄 Rafraîchir les données
├── 📋 Comparer avec un autre sondage
├── 🎨 Changer le thème des graphiques
├── 🖨️ Mode impression
├── 📤 Envoyer rapport par email
└── ⚙️ Paramètres d'affichage
```

---

## 🔄 Temps Réel

### Mise à Jour Automatique

**Les résultats se mettent à jour en direct :**
```
⟳ Nouveau vote reçu !
  📊 Mise à jour automatique...
  ✅ Résultats actualisés
```

**Fréquence :**
- Instantané (< 1 seconde via WebSocket)
- Pas besoin de rafraîchir la page

---

### Notifications de Nouveau Vote

**Paramétrable dans Settings :**
```
☑ Me notifier des nouveaux votes
  Fréquence : ○ Chaque vote
              ⚫ Toutes les 10 votes
              ○ Quotidien (résumé)
```

**Notification :**
```
┌─────────────────────────────────────┐
│  🔔 Nouveau vote !                  │
│  Alice Martin a voté sur            │
│  "Réunion Sprint Planning"          │
│                                     │
│  8/10 réponses (80%)                │
│  [Voir les résultats]               │
└─────────────────────────────────────┘
```

---

### Suivi en Direct

**Page "Suivi en temps réel" :**
```
🔴 LIVE - Réponses en temps réel

Derniers votes :
⏱️ Il y a 12 secondes  Alice Martin    ✓
⏱️ Il y a 3 minutes    Bob Chen        ✓
⏱️ Il y a 8 minutes    Claire Dubois   ✓

Graphique en direct :
50 │               ●
   │             ●
40 │          ●
   │        ●
30 │      ●
   │    ●
20 │  ●
   │●
10 │
   └─────────────────
   9h  10h  11h  12h
```

---

## 📊 Comparaison de Sondages

### Comparer Deux Sondages

**Feature Premium :**
```
Résultats → Menu ••• → "Comparer avec..."
→ Sélectionnez un autre sondage

Affichage côte à côte :

┌───────────────────┬───────────────────┐
│  Satisfaction Q3  │  Satisfaction Q4  │
├───────────────────┼───────────────────┤
│  NPS : +38        │  NPS : +42 (+4)  ✅│
│  Rating : 4.1/5   │  Rating : 4.2/5  ✅│
│  Réponses : 45    │  Réponses : 50   ✅│
└───────────────────┴───────────────────┘

💡 Tendance : Amélioration globale de +4%
```

---

## 🎨 Personnalisation de l'Affichage

### Options d'Affichage

```
⚙️ Paramètres d'affichage
├── Graphiques
│   ├── Type : Barres / Camembert / Ligne
│   ├── Couleurs : Arc-en-ciel / Monochrome / Brand
│   └── Animation : Oui / Non
├── Statistiques
│   ├── Afficher moyennes : Oui
│   ├── Afficher médianes : Non
│   └── Afficher écarts-types : Non
├── Réponses texte
│   ├── Afficher toutes : Oui
│   ├── Masquer noms : Non
│   └── Nuage de mots : Oui
└── Langue
    └── Français
```

---

## 🎯 Récapitulatif

**Vous savez maintenant :**
- ✅ Accéder et naviguer dans les résultats
- ✅ Lire tous les types de graphiques
- ✅ Configurer la visibilité
- ✅ Exporter et partager
- ✅ Utiliser le temps réel
- ✅ Personnaliser l'affichage

---

## 🔗 Guides Connexes

- [Formulaires](./04-Formulaires-Questionnaires.md#analyser-les-résultats-avec-analytics-ia) - Analytics IA
- [Dashboard](./07-Tableau-Bord.md) - Gérer vos sondages

---

**[← Formulaires](./04-Formulaires-Questionnaires.md) | [Dashboard →](./07-Tableau-Bord.md)**

---

**© 2025 DooDates - Gestion des Résultats v1.0**

