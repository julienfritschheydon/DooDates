# Guide Utilisateur - Questionnaires par IA

**Date de création :** 15/10/2025  
**Version :** MVP 1.0

## 🎯 Qu'est-ce qu'un Questionnaire (Form Poll) ?

Un **questionnaire** (ou Form Poll) vous permet de créer des sondages d'opinion avec différents types de questions :
- **Choix unique** : Une seule réponse possible (radio buttons)
- **Choix multiples** : Plusieurs réponses possibles (checkboxes)
- **Texte libre** : Réponse ouverte

---

## 🆚 Différence avec les Sondages de Dates

| Type | Usage | Exemple |
|------|-------|---------|
| **📅 Sondage de dates** | Trouver une date/heure commune | "Réunion d'équipe la semaine prochaine" |
| **📝 Questionnaire** | Recueillir des opinions/infos | "Questionnaire de satisfaction client" |

---

## 🚀 Comment Créer un Questionnaire

### 1. Ouvrez le Chat IA

Cliquez sur "💬 Nouveau chat" dans l'application DooDates.

### 2. Décrivez votre Questionnaire

L'IA détecte automatiquement si vous voulez un questionnaire grâce aux mots-clés :

**Mots-clés de détection :**
- `questionnaire`, `sondage d'opinion`, `enquête`
- `formulaire`, `feedback`, `satisfaction`
- `avis`, `préférences`, `évaluation`

### 3. Exemples de Demandes

#### ✅ Demandes Simples
```
"Crée un questionnaire de satisfaction client"
```
→ L'IA génère automatiquement 4-6 questions pertinentes

#### ✅ Demandes Spécifiques
```
"Sondage d'opinion sur notre nouveau produit : 
préférences, prix acceptable, probabilité d'achat"
```
→ L'IA génère les questions ciblées demandées

#### ✅ Demandes Détaillées
```
"Formulaire d'inscription événement avec nom, email, 
choix de l'atelier (3 max parmi 8 options), 
et restrictions alimentaires en texte libre"
```
→ L'IA génère exactement ce que vous demandez

---

## 🎨 Interface du Questionnaire

### Affichage dans le Chat

Après génération, vous verrez :
- **En-tête purple/indigo** pour le questionnaire
- **Nombre de questions** (ex: "5 questions")
- **Preview des questions** avec leur type :
  - 🔵 Choix unique (bleu)
  - 🟢 Choix multiples (vert)
  - ⚫ Texte libre (gris)
- **Badge "Obligatoire"** si la question est requise

### Bouton de Création

- **Bouton violet** : "Créer ce questionnaire" 💬
- Cliquez pour ouvrir l'éditeur de formulaire

---

## 📋 Types de Questions Générées

### 1. Choix Unique (Single)
**Usage :** Une seule option possible  
**Exemple :** "Quel est votre niveau d'expérience ?"
- Débutant
- Intermédiaire
- Avancé

### 2. Choix Multiples (Multiple)
**Usage :** Plusieurs options possibles  
**Exemple :** "Quels langages maîtrisez-vous ? (3 max)"
- JavaScript
- Python
- Java
- C++

**Note :** L'IA peut limiter le nombre de choix (maxChoices)

### 3. Texte Libre (Text)
**Usage :** Réponse ouverte  
**Exemple :** "Avez-vous des suggestions ?"
- Champ texte avec placeholder
- Limite de caractères optionnelle

---

## ✅ Bonnes Pratiques

### Pour de Meilleurs Résultats

1. **Soyez spécifique** sur le sujet
   - ❌ "Crée un questionnaire"
   - ✅ "Questionnaire de satisfaction employés"

2. **Précisez le contexte** si nécessaire
   - "Questionnaire post-formation sur React"
   - "Sondage préférences menu cantine"

3. **Indiquez le nombre de questions** si souhaité
   - "5 questions sur la satisfaction client"
   - "Questionnaire court (3 questions)"

4. **Mentionnez les thèmes** à couvrir
   - "Questionnaire sur : qualité service, prix, délai livraison"

### Ce que l'IA Fait Automatiquement

- ✅ Génère 3 à 10 questions pertinentes
- ✅ Choisit le type approprié (single/multiple/text)
- ✅ Équilibre questions obligatoires/optionnelles
- ✅ Ajoute au moins 1 question texte pour commentaires
- ✅ Crée des options claires et complètes

---

## 🔧 Après Génération

### Modifier le Questionnaire

Une fois généré, vous pouvez :
1. **Éditer les questions** dans l'interface de création
2. **Ajouter/supprimer** des questions
3. **Changer les options** et paramètres
4. **Réorganiser** l'ordre des questions

### Publier le Questionnaire

1. Cliquez sur "Créer ce questionnaire"
2. L'éditeur s'ouvre avec vos questions pré-remplies
3. Ajustez si nécessaire
4. Publiez et partagez le lien

---

## 🎯 Cas d'Usage Typiques

### 1. Satisfaction Client
```
"Questionnaire de satisfaction client avec 5 questions"
```
→ Génère : niveau satisfaction, points positifs, points d'amélioration, recommandation, commentaires

### 2. Feedback Produit
```
"Sondage sur notre nouvelle app : fonctionnalités préférées, bugs rencontrés, suggestions"
```
→ Génère les 3 questions ciblées

### 3. Inscription Événement
```
"Formulaire inscription : nom, email, niveau expérience, centres d'intérêt"
```
→ Génère un mix de questions adaptées

### 4. Enquête Interne
```
"Enquête bien-être au travail pour les employés"
```
→ Génère questions sur ambiance, charge travail, équilibre vie pro/perso

---

## 🆘 Dépannage

### "L'IA génère un sondage de dates au lieu d'un questionnaire"

**Cause :** Pas assez de mots-clés "questionnaire"  
**Solution :** Utilisez explicitement :
- "questionnaire" ou "formulaire"
- "sondage d'opinion" (pas juste "sondage")
- "enquête" ou "feedback"

### "Les questions générées ne correspondent pas"

**Cause :** Demande trop vague  
**Solution :** Soyez plus spécifique :
- ❌ "Crée un questionnaire"
- ✅ "Questionnaire satisfaction client avec questions sur qualité service et prix"

### "Trop de questions générées"

**Solution :** Précisez le nombre :
- "Questionnaire court (3-4 questions)"
- "5 questions maximum sur..."

---

## 💡 Astuces Avancées

### 1. Contrôler le Nombre de Choix
```
"Question sur les langages de programmation avec choix de 3 maximum"
```
→ L'IA ajoutera `maxChoices: 3`

### 2. Spécifier les Types de Questions
```
"Formulaire avec choix unique sur le niveau, 
choix multiples sur les intérêts, 
et texte libre pour les commentaires"
```
→ L'IA respecte les types demandés

### 3. Questions Obligatoires/Optionnelles
```
"Questionnaire où seules les 2 premières questions sont obligatoires"
```
→ L'IA adapte le champ `required`

---

## 📊 Limites Actuelles (MVP)

### Ce qui Fonctionne
- ✅ 3-10 questions par questionnaire
- ✅ 3 types de questions (single, multiple, text)
- ✅ Validation stricte des questions
- ✅ Options avec 2-8 choix
- ✅ Détection automatique du type

### Ce qui N'est Pas Encore Disponible
- ⏸️ Questions conditionnelles (logique branchement)
- ⏸️ Templates prédéfinis
- ⏸️ Modification de questionnaire via IA (post-MVP)
- ⏸️ Scoring automatique des réponses

---

## 🎓 Exemples Complets

### Exemple 1 : Questionnaire Satisfaction Simple

**Demande :**
```
"Questionnaire de satisfaction client"
```

**Résultat typique :**
1. Niveau de satisfaction (single, obligatoire)
2. Points forts du service (multiple, optionnel)
3. Points d'amélioration (multiple, optionnel)
4. Recommanderiez-vous ? (single, obligatoire)
5. Commentaires additionnels (text, optionnel)

### Exemple 2 : Formulaire Inscription

**Demande :**
```
"Formulaire d'inscription événement tech : 
nom, email, niveau expérience, centres d'intérêt"
```

**Résultat typique :**
1. Votre nom complet (text, obligatoire)
2. Votre adresse email (text, obligatoire)
3. Niveau d'expérience (single, obligatoire)
4. Centres d'intérêt (2 max) (multiple, optionnel)
5. Motivations pour participer (text, optionnel)

### Exemple 3 : Enquête Produit

**Demande :**
```
"Sondage d'opinion sur notre nouveau produit : 
utilité perçue, prix acceptable, fonctionnalités manquantes"
```

**Résultat typique :**
1. Ce produit vous semble-t-il utile ? (single, obligatoire)
2. Quel prix seriez-vous prêt à payer ? (single, obligatoire)
3. Quelles fonctionnalités manquent ? (multiple, optionnel)
4. Suggestions d'amélioration (text, optionnel)

---

## ✅ Améliorations Récentes (15/10/2025)

### Bugs Corrigés

**1. Questions Pré-Remplies** ✅
- **Avant :** Le formulaire s'affichait vide après avoir cliqué sur "Créer ce questionnaire"
- **Maintenant :** Toutes les questions générées par l'IA apparaissent automatiquement pré-remplies
- **Bénéfice :** Vous pouvez immédiatement modifier ou finaliser le questionnaire

**2. Horaires des Sondages de Dates** ✅
- **Avant :** Les créneaux horaires suggérés n'étaient pas sélectionnés
- **Maintenant :** Les horaires proposés par l'IA sont automatiquement appliqués
- **Bénéfice :** Plus besoin de re-sélectionner manuellement les heures

**3. Menu Toujours Visible** ✅
- **Avant :** Le menu principal disparaissait lors du scroll
- **Maintenant :** Le menu reste fixe en haut de toutes les pages
- **Bénéfice :** Navigation plus fluide et intuitive

---

## 📞 Support

Pour toute question ou problème :
- Voir la [documentation technique](./Form-Poll-AI-Creation.md)
- Consulter le [planning du projet](./2.%20Planning.md)
- Lire le [guide de dépannage](./TROUBLESHOOTING.md)

---

**Bon sondage ! 🎉**
