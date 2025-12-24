# 📅 Sondages de Dates

Guide complet pour créer et gérer des sondages de dates/horaires avec DooDates.

---

## 📋 Table des Matières

1. [Qu'est-ce qu'un Sondage de Dates](#quest-ce-quun-sondage-de-dates)
2. [Créer un Sondage](#créer-un-sondage)
3. [Sélection de Dates](#sélection-de-dates)
4. [Ajouter des Horaires](#ajouter-des-horaires)
5. [Voter sur un Sondage](#voter-sur-un-sondage)
6. [Analyser les Résultats](#analyser-les-résultats)
7. [Finaliser et Confirmer](#finaliser-et-confirmer)

---

## 🎯 Qu'est-ce qu'un Sondage de Dates

Un **sondage de dates** permet de trouver le meilleur créneau pour un événement en collectant les disponibilités de tous les participants.

### Cas d'Usage Typiques

- 🤝 **Réunions d'équipe** : Sprint planning, rétrospectives
- 🍽️ **Événements sociaux** : Dîners, sorties entre amis
- 📞 **Rendez-vous professionnels** : Entretiens, consultations
- 🎉 **Événements familiaux** : Anniversaires, célébrations
- 🏃 **Activités de groupe** : Sport, loisirs

---

## ✨ Créer un Sondage

### Méthode 1 : Avec l'Assistant IA (Recommandé)

**Exemple simple :**
```
Vous : "Organise une réunion d'équipe mardi ou jeudi après-midi"

IA : "✅ Sondage créé :
     • Mardi 12 nov, 14h-17h
     • Jeudi 14 nov, 14h-17h
     
     Titre : Réunion d'équipe
     Lien : doodates.com/vote/reunion-nov"
```

**Exemple détaillé :**
```
Vous : "Crée un sondage pour notre déjeuner d'équipe.
       On est 8 personnes.
       Propose vendredi ou samedi midi, 2h de durée"

IA : "Parfait ! Sondage créé :
     
     📋 Déjeuner d'équipe
     • Vendredi 15 nov, 12h-14h
     • Samedi 16 nov, 12h-14h
     
     Participants attendus : 8
     Lien de partage : doodates.com/vote/dejeuner-nov
     
     Je l'envoie par email ?"
```

---

### Méthode 2 : Création Manuelle

**Étapes :**

1. **Accéder au Dashboard**
   ```
   Dashboard → Bouton "Nouveau sondage"
   → Sélectionnez "Sondage de dates"
   ```

2. **Informations de base**
   ```
   Titre : "Réunion Sprint Planning"
   Description (optionnel) : "Planning du sprint 47"
   Lieu (optionnel) : "Salle de conf A / Zoom"
   ```

3. **Sélectionner les dates** (voir section suivante)

4. **Configurer les paramètres**
   ```
   ☑ Participants peuvent proposer d'autres dates
   ☑ Afficher le nombre de votes
   ☐ Votes anonymes
   Deadline : 10 novembre 2025, 18h
   ```

5. **Créer et partager**

---

## 📆 Sélection de Dates

### Interface Calendrier

```
┌─────────────────────────────────────────────┐
│  ◀ Novembre 2025 ▶                          │
├─────────────────────────────────────────────┤
│  L   M   M   J   V   S   D                  │
│                  1   2   3                   │
│  4   5   6  [7] [8]  9  10                  │ ← Cliquez pour sélectionner
│ 11 [12] 13 [14] 15  16  17                  │
│ 18  19  20  21  22  23  24                  │
│ 25  26  27  28  29  30                      │
└─────────────────────────────────────────────┘

Dates sélectionnées :
• Mardi 12 novembre
• Jeudi 14 novembre
```

### Sélection Rapide

**Clic simple :** Sélectionne la date entière (toute la journée)

**Clic + Glisser :** Sélectionne une plage de dates
```
Exemple : 12 → glisser → 15
Résultat : 12, 13, 14, 15 novembre sélectionnés
```

**Raccourcis clavier :**
- `←` `→` : Naviguer entre les mois
- `Espace` : Sélectionner/désélectionner la date active
- `Ctrl+Clic` : Sélection multiple non-continue

---

## ⏰ Ajouter des Horaires

### Horaires par Date

Après avoir sélectionné les dates :

```
Mardi 12 novembre
  [+] Ajouter un horaire
  
  → 09h00 - 11h00  [Supprimer]
  → 14h00 - 16h00  [Supprimer]
  [+] Ajouter un autre horaire

Jeudi 14 novembre
  [+] Ajouter un horaire
```

### Créneaux Prédéfinis

**Boutons rapides :**
- 🌅 **Matin** : 9h-12h
- ☀️ **Après-midi** : 14h-17h
- 🌙 **Soir** : 18h-21h
- 🌍 **Toute la journée** : 8h-18h

### Personnaliser les Horaires

**Durée flexible :**
```
Début : 14h00
Fin : 16h30
Durée : 2h30

Options :
☑ Participants peuvent proposer d'autres horaires
☐ Créneaux de 30 min (pour granularité fine)
```

---

### Copier les Horaires

**Fonctionnalité pratique :**
```
Mardi 12 nov : 9h-11h, 14h-16h
  ↓
[Copier vers d'autres dates]
  ☑ Mercredi 13 nov
  ☑ Jeudi 14 nov
  
Résultat :
• Mardi 12 : 9h-11h, 14h-16h
• Mercredi 13 : 9h-11h, 14h-16h
• Jeudi 14 : 9h-11h, 14h-16h
```

---

## 🗳️ Voter sur un Sondage

### Ouvrir le Sondage

**Lien reçu :**
```
https://doodates.com/vote/reunion-nov
```

**Interface de vote :**
```
┌─────────────────────────────────────────────┐
│  📋 Réunion Sprint Planning                 │
│  Organisé par Alice Martin                  │
├─────────────────────────────────────────────┤
│  Indiquez vos disponibilités :              │
│                                             │
│  Votre nom : [____________]                 │
│             (ou restez anonyme)             │
└─────────────────────────────────────────────┘
```

---

### Indiquer ses Disponibilités

**3 niveaux de disponibilité :**

#### 🟢 Disponible
```
Cliquez 1 fois : Vert
→ "Je suis disponible"
```

#### 🟡 Peut-être
```
Cliquez 2 fois : Orange
→ "Je peux me libérer si nécessaire"
```

#### 🔴 Indisponible
```
Cliquez 3 fois : Rouge
→ "Je ne suis pas disponible"
```

#### ⚪ Non répondu
```
Cliquez 4 fois : Blanc (retour à l'état initial)
→ Pas de vote pour ce créneau
```

---

### Interface Mobile

**Swipe gestures :**
```
←  Swipe gauche : Disponible (🟢)
↔  Tap : Peut-être (🟡)
→  Swipe droite : Indisponible (🔴)
```

**Vibration haptique :** Confirmation du vote (si supporté)

---

### Enregistrer son Vote

**Bouton en bas de page :**
```
[✓ Enregistrer mes disponibilités]
```

**Confirmation :**
```
✅ Vos disponibilités ont été enregistrées !

Actions :
• Modifier mon vote
• Voir les résultats (si autorisé)
• Copier le lien pour partager
```

---

## 📊 Analyser les Résultats

### Vue d'Ensemble

**Tableau récapitulatif :**
```
┌─────────────────────────────────────────────────────────┐
│  Mardi 12 nov, 9h-11h                                   │
│  ████████████████░░░░░░ 75% (6/8)                       │
│  ✓ Alice, Bob, Claire, David, Emma, Frank               │
│  ? (aucun)                                              │
│  ✗ Grace, Henry                                         │
├─────────────────────────────────────────────────────────┤
│  Mardi 12 nov, 14h-16h                                  │
│  ████████████████████░░ 87% (7/8)                       │
│  ✓ Alice, Bob, Claire, David, Emma, Frank, Grace        │
│  ? (aucun)                                              │
│  ✗ Henry                                                │
├─────────────────────────────────────────────────────────┤
│  Jeudi 14 nov, 14h-16h                                  │
│  ████████████░░░░░░░░░░ 62% (5/8)                       │
│  ✓ Alice, Bob, Claire, David, Emma                      │
│  ? Frank                                                │
│  ✗ Grace, Henry                                         │
└─────────────────────────────────────────────────────────┘

🏆 Meilleure option : Mardi 12 nov, 14h-16h (87%)
```

---

### Détail par Participant

**Vue matricielle :**
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

Légende : ✓ Disponible | ? Peut-être | ✗ Indisponible
```

---

### Statistiques Détaillées

**Taux de participation :**
```
📊 Participation : 8/8 (100%)
⏱️ Temps moyen de vote : 42 secondes
📅 Premier vote : 01/11/2025 09:23
📅 Dernier vote : 03/11/2025 15:47
```

**Disponibilité moyenne par personne :**
```
• Alice : 100% (3/3 créneaux)
• Bob : 100% (3/3)
• Claire : 100% (3/3)
...
• Henry : 0% (0/3) ← Aucune disponibilité
```

---

## ✅ Finaliser et Confirmer

### Choisir la Meilleure Option

**Recommandation automatique :**
```
🏆 Option recommandée : Mardi 12 nov, 14h-16h

Raisons :
• 87% de disponibilité (7/8 personnes)
• 0 "Peut-être" (consensus clair)
• Seul Henry indisponible

[Finaliser cette option]
```

---

### Confirmer aux Participants

**Notification automatique :**

**Email envoyé à tous :**
```
Objet : ✅ Réunion Sprint Planning confirmée

Bonjour,

La réunion a été fixée au :
📅 Mardi 12 novembre 2025
⏰ 14h00 - 16h00
📍 Salle de conf A

Participants confirmés :
✓ Alice, Bob, Claire, David, Emma, Frank, Grace

Ajoutez-le à votre calendrier :
• Google Calendar : [Lien]
• Outlook : [Lien]
• iCal : [Télécharger .ics]

À bientôt !
```

---

### Actions Post-Confirmation

**Options disponibles :**

1. **Clôturer le sondage**
   ```
   → Plus de votes possibles
   → Lien de vote devient inactif
   → Résultats figés
   ```

2. **Envoyer des rappels**
   ```
   → 24h avant : "N'oubliez pas la réunion demain !"
   → 1h avant : "La réunion commence dans 1h"
   ```

3. **Créer un événement récurrent**
   ```
   → "Réunion hebdomadaire tous les mardis 14h-16h"
   → Générer un nouveau sondage pour chaque occurrence
   ```

---

## 🔄 Modifier un Sondage

### Avant les Votes

**Modification libre :**
```
Dashboard → Sondage → Modifier
→ Ajoutez/supprimez des dates
→ Changez les horaires
→ Modifiez le titre/description
```

---

### Après les Votes

**Modifications limitées :**

✅ **Autorisé :**
- Ajouter de nouvelles dates/horaires
- Prolonger la deadline
- Changer la description

⚠️ **Déconseillé :**
- Supprimer des dates (perte de votes)
- Changer radicalement les horaires

---

**Notification automatique :**
```
Si modification importante :
→ Email envoyé aux participants
   "Le sondage a été mis à jour, merci de revérifier vos disponibilités"
```

---

## 🎯 Conseils et Astuces

### 1. Nombre de Créneaux Optimal

**Recommandation :**
- ✅ **3-5 créneaux** : Idéal
- ⚠️ **6-10 créneaux** : Acceptable
- ❌ **10+ créneaux** : Trop complexe, réduit le taux de participation

---

### 2. Espacer les Options

**Mauvais :**
```
• Lundi 9h-11h
• Lundi 11h-13h  ← Trop proche
• Lundi 13h-15h  ← Trop proche
```

**Bon :**
```
• Lundi 9h-11h
• Mercredi 14h-16h
• Vendredi 10h-12h
```

---

### 3. Durée Réaliste

**Respectez le temps nécessaire :**
```
❌ Réunion stratégique : 30 min (trop court)
✅ Réunion stratégique : 2h
✅ Café rapide : 30 min
```

---

### 4. Deadline Appropriée

**Formule :**
```
Deadline = Date événement - (3 à 7 jours)

Exemple :
Événement : 15 novembre
Deadline sondage : 8 novembre (7 jours avant)
```

**Permet :**
- Temps de réponse suffisant
- Marge pour replanifier si besoin

---

### 5. Proposer des Alternatives

**Option recommandée :**
```
☑ "Participants peuvent proposer d'autres dates"

→ Permet aux participants d'ajouter des créneaux
→ Augmente les chances de trouver un consensus
```

---

## ❓ Questions Fréquentes

### Puis-je créer un sondage récurrent ?

**Pas directement, mais :**
```
1. Créez le premier sondage
2. Après finalisation, cliquez "Dupliquer"
3. Modifiez les dates pour la prochaine occurrence
4. Partagez à nouveau
```

**Astuce :** Utilisez des templates avec l'IA :
```
"Crée un sondage comme le précédent mais pour la semaine prochaine"
```

---

### Comment gérer les fuseaux horaires ?

**Détection automatique :**
```
DooDates détecte le fuseau horaire du créateur
→ Affiche les horaires dans ce fuseau pour tous
→ Indication : "Horaires en heure de Paris (UTC+1)"
```

**Pour événements internationaux :**
```
1. Créez le sondage dans votre fuseau
2. Ajoutez dans la description :
   "⏰ Horaires en UTC+1 (Paris)"
3. Les participants convertiront eux-mêmes
```

---

### Puis-je limiter le nombre de participants ?

**Oui :**
```
Paramètres → "Nombre max de participants" → 10

Après 10 votes :
→ Lien de vote devient inactif
→ Message "Sondage complet"
```

---

## 🔗 Guides Connexes

- [Assistant IA](./05-Assistant-IA.md) - Créer avec l'IA
- [Export et Partage](./09-Export-Partage.md) - Partager efficacement
- [Cas d'Usage](./11-Cas-Usage.md) - Exemples pratiques

---

**[← Concepts](./02-Concepts-Base.md) | [Accueil](./README.md) | [Formulaires →](./04-Formulaires-Questionnaires.md)**

---

**© 2025 DooDates - Sondages de Dates v1.0**

