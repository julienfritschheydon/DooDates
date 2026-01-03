# Stratégie d'Enrichissement du Vocabulaire de Traduction

## 🎯 Objectif

Créer une liste exhaustive de vocabulaire français utilisé dans les sondages/événements pour améliorer la traduction manuelle et éviter les échecs.

## 📋 Approche Multi-Sources

### 1. Analyse des Prompts Existants

- ✅ **57 prompts** dans `gemini-comprehensive.test.ts`
- ✅ Extraction automatique des mots français
- ✅ Catégorisation : verbes, noms, expressions temporelles

### 2. Génération avec Gemini

Utiliser Gemini pour générer une liste exhaustive basée sur :

- Les prompts existants
- Le contexte des sondages/événements
- Les synonymes et variantes courantes

### 3. Sources Externes

- Listes de verbes français les plus fréquents
- Vocabulaire professionnel (réunions, événements)
- Expressions temporelles françaises

## 🔍 Mots Identifiés dans les Prompts

### Verbes d'Action (à exclure des titres)

- planifie, planifier
- trouve, trouver
- organise, organiser
- bloque, bloquer
- propose, proposer
- cherche, chercher
- crée, créer, créé
- fais, faire
- prévois, prévoir
- génère, générer
- ajoute, ajouter
- calcule, calculer
- repère, repérer, repéré

### Noms d'Événements

- réunion, équipe, entretien, client
- visioconférence, partenaires
- suivi, projet, déjeuner, soirée
- amis, anniversaire, barbecue
- formation, sécurité, atelier
- créatif, brainstorming, webinaire
- technique, brunch, footing
- escape game, visite, musée
- apéro, voisins, ciné
- AG, association, tournoi
- pétanque, bureau, vide-grenier
- gala, stand-up, point
- budget, lancement, démo
- présentation, slides, revue
- partenariats, canadien
- questionnaire, sondage
- satisfaction, produit, service
- contact, feedback, évaluation
- qualité, prix, matrice
- enquête, préférences
- participants, nourriture
- horaire, allergies, alimentaires
- étoiles, commentaires, aspects
- réponses, mensuel

### Expressions Temporelles (déjà gérées)

- Jours : lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche
- Mois : janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre
- Périodes : matin, midi, après-midi, soir, soirée, nuit
- Relatives : demain, aujourd'hui, hier, semaine prochaine, cette semaine, etc.

## 🚀 Plan d'Action

### Phase 1 : Extraction Automatique ✅

- [x] Script d'extraction des mots des prompts
- [x] Catégorisation automatique

### Phase 2 : Génération avec Gemini

- [ ] Créer un prompt Gemini pour générer une liste exhaustive
- [ ] Inclure synonymes, variantes, expressions courantes
- [ ] Valider avec les prompts existants

### Phase 3 : Enrichissement Progressif

- [ ] Créer un système de mapping enrichi
- [ ] Intégrer dans `temporalTranslator.ts`
- [ ] Tester avec les prompts existants

### Phase 4 : Maintenance Continue

- [ ] Système de détection des mots non traduits
- [ ] Logging des échecs de traduction
- [ ] Enrichissement automatique basé sur les logs

## 📝 Format de Données

```json
{
  "verbs": {
    "organiser": "organize",
    "planifier": "plan",
    ...
  },
  "nouns": {
    "réunion": "meeting",
    "événement": "event",
    ...
  },
  "temporal": {
    "semaine prochaine": "next week",
    ...
  },
  "adjectives": {
    "mensuel": "monthly",
    ...
  },
  "expressions": {
    "faire le point": "check in",
    ...
  }
}
```

## 🔧 Scripts Utiles

1. **`generate-vocabulary-list.js`** : Extrait les mots des prompts
2. **`ask-gemini-vocabulary.js`** : Demande à Gemini de générer une liste exhaustive
3. **`merge-vocabulary.js`** : Fusionne les listes et génère le mapping final
