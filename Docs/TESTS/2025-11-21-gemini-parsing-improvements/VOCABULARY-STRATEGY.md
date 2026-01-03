# Stratégie d'Enrichissement du Vocabulaire de Traduction

## 🎯 Objectif

Créer une liste exhaustive de vocabulaire français utilisé dans les sondages/événements pour améliorer la traduction manuelle et éviter les échecs de parsing.

## 📊 État Actuel

### Analyse des 57 Prompts de Test

**Statistiques extraites** :
- ✅ **14 verbes uniques** identifiés
- ✅ **61 noms uniques** identifiés  
- ✅ **30 expressions temporelles** identifiées
- ✅ **105 mots uniques** au total

### Problèmes Identifiés

1. **Verbes non traduits** : Certains verbes passent à travers la traduction
2. **Noms d'événements** : Variantes et synonymes non couverts
3. **Expressions courantes** : Phrases complètes non traduites ("faire le point", "passer en revue")
4. **Adjectifs temporels** : "mensuel", "hebdomadaire", "annuel" non traduits

## 🚀 Plan d'Action

### Phase 1 : Extraction ✅
- [x] Script `generate-vocabulary-list.js` créé
- [x] Analyse des 57 prompts effectuée
- [x] Extraction des mots français catégorisés

### Phase 2 : Génération avec Gemini ✅
- [x] Exécuter `ask-gemini-vocabulary.js` pour générer une liste exhaustive
- [x] Inclure synonymes, variantes, expressions courantes
- [x] Fichier `gemini-vocabulary.json` généré (86 verbes, 121 noms, 106 expressions temporelles)

### Phase 3 : Fusion et Intégration ✅
- [x] Exécuter `merge-vocabulary-into-translator.js`
- [x] Rapport `vocabulary-merge-report.json` généré
- [x] Intégrer les nouvelles traductions dans `temporalTranslator.ts`
  - ✅ Mois enrichis : 12 → 30 variantes (abréviations, "rentrée", etc.)
  - ✅ Jours enrichis : 7 → 28 variantes (pluriels, "chaque X", "tous les X" → "every X")
  - ✅ Expressions temporelles : 12 → 30+ variantes (weekend, trimestres, deadlines)
  - ✅ Périodes de la journée : 9 → 15 variantes (matinée, aprem, a.m./p.m., etc.)
- [ ] Tester avec les prompts existants (à faire : `npm run test:gemini`)

### Phase 4 : Maintenance Continue
- [ ] Système de détection des mots non traduits
- [ ] Logging des échecs de traduction
- [ ] Enrichissement automatique basé sur les logs

## 📝 Structure des Données

### Format JSON Généré par Gemini

```json
{
  "verbs": [
    {
      "fr": "organiser",
      "en": "organize",
      "variants": ["organise", "organiser", "organisé", "organisation"]
    }
  ],
  "nouns": [
    {
      "fr": "réunion",
      "en": "meeting",
      "variants": ["réunions"]
    }
  ],
  "temporal": [
    {
      "fr": "semaine prochaine",
      "en": "next week",
      "variants": ["semaine suivante"]
    }
  ],
  "adjectives": [
    {
      "fr": "mensuel",
      "en": "monthly",
      "variants": ["mensuelle", "mensuels", "mensuelles"]
    }
  ],
  "expressions": [
    {
      "fr": "faire le point",
      "en": "check in",
      "variants": ["faire un point", "point"]
    }
  ]
}
```

## 🔧 Scripts Disponibles

1. **`generate-vocabulary-list.js`** ✅
   - Extrait les mots français des prompts de test
   - Catégorise automatiquement (verbes, noms, expressions)
   - Génère un fichier JSON avec les statistiques

2. **`ask-gemini-vocabulary.js`** ✅
   - Demande à Gemini de générer une liste exhaustive
   - Inclut synonymes, variantes, expressions courantes
   - Génère `gemini-vocabulary.json` (452 lignes, 313 entrées)

3. **`merge-vocabulary-into-translator.js`** ✅
   - Fusionne le vocabulaire généré avec les traductions existantes
   - Génère un rapport d'intégration (`vocabulary-merge-report.json`)
   - Fournit des instructions pour l'intégration manuelle

## 📋 Mots Identifiés dans les Prompts

### Verbes d'Action (14)
planifie, planifier, trouve, trouver, organise, organiser, bloque, bloquer, propose, proposer, cherche, chercher, crée, créer, créé, fais, faire, prévois, prévoir, génère, générer, ajoute, ajouter, calcule, calculer, repère, repérer, repéré

### Noms d'Événements (61)
réunion, équipe, entretien, client, visioconférence, partenaires, suivi, projet, déjeuner, soirée, amis, anniversaire, barbecue, formation, sécurité, atelier, créatif, brainstorming, webinaire, technique, brunch, footing, escape game, visite, musée, apéro, voisins, ciné, AG, association, tournoi, pétanque, bureau, vide-grenier, gala, stand-up, point, budget, lancement, démo, présentation, slides, revue, partenariats, canadien, questionnaire, sondage, satisfaction, produit, service, contact, feedback, évaluation, qualité, prix, matrice, enquête, préférences, participants, nourriture, horaire, allergies, alimentaires, étoiles, commentaires, aspects, réponses, mensuel

### Expressions Temporelles (30)
début, fin, en, courant, semaine prochaine, cette semaine, semaine dernière, demain, aujourd'hui, hier, dans, deux semaines, trois semaines, quatre semaines, quinze jours, quatorze jours, matin, midi, après-midi, d'après-midi, soir, soirée, nuit, lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche, janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre

## ✅ État d'Avancement

### Phases Complétées

1. ✅ **Phase 1 - Extraction** : 105 mots uniques extraits des 57 prompts
2. ✅ **Phase 2 - Génération Gemini** : 313 entrées générées (86 verbes, 121 noms, 106 expressions)
3. ✅ **Phase 3 - Intégration** : Vocabulaire enrichi intégré dans `temporalTranslator.ts`
   - **Mois** : 12 → 30 variantes
   - **Jours** : 7 → 28 variantes (avec "every" pour "chaque"/"tous les")
   - **Expressions** : 12 → 30+ variantes
   - **Périodes** : 9 → 15 variantes

### Prochaines Étapes

1. **Tester** : `npm run test:gemini` pour valider les améliorations
2. **Phase 4 - Maintenance** : Mettre en place le système de détection et logging

## 📈 Résultats de l'Enrichissement

### Avant
- **Mois** : 12 traductions de base
- **Jours** : 7 traductions de base
- **Expressions** : 12 traductions de base
- **Périodes** : 9 traductions de base

### Après
- **Mois** : 30 variantes (abréviations, "rentrée", "fêtes de fin d'année")
- **Jours** : 28 variantes (pluriels, "chaque X" → "every X", "tous les X" → "every X")
- **Expressions** : 30+ variantes (weekend, trimestres, deadlines, variantes de "semaine")
- **Périodes** : 15 variantes (matinée, aprem, a.m./p.m., "début/fin de journée")

### Corrections Importantes
- ✅ "chaque lundi" / "tous les lundis" → "every monday" (pas juste "monday")
- ✅ "nuit" → "night" (pas "evening")
- ✅ Retrait des numéros "01"-"12" (ambigus avec les heures)
- ✅ Retrait de "maintenant"/"actuellement" (adverbes, pas dates)
- ✅ Ajout des trimestres, années, deadlines pour le contexte

## 💡 Notes

- La traduction manuelle doit être exhaustive pour éviter les échecs
- Les variantes (pluriel, conjugaisons) doivent être gérées
- Les expressions courantes nécessitent des regex spécifiques
- Un système de logging permettra d'identifier les mots manquants en production
- **Phase 4** (Maintenance Continue) reste à implémenter pour l'enrichissement automatique

