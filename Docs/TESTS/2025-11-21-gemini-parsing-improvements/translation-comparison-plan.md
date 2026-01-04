# Plan de test : Comparaison des approches de traduction

## Objectif

Comparer objectivement différentes approches de traduction des expressions temporelles françaises vers l'anglais pour améliorer chrono-node, et choisir la meilleure solution.

## Options à comparer

1. **Baseline** : Pas de traduction (chrono.fr directement)
2. **Manuelle** : Traduction manuelle (actuelle dans `temporalTranslator.ts`)
3. **Gemini** : Utiliser Gemini pour traduire (déjà dans le projet)
4. **Hybride** : Manuelle + Gemini fallback pour cas complexes

## Critères d'évaluation

### 1. Performance

- **Latence** : Temps de traduction (ms)
- **Throughput** : Nombre de traductions/seconde
- **Impact sur le parsing** : Temps total (traduction + chrono)

### 2. Précision

- **Taux de détection** : % de cas où chrono détecte quelque chose
- **Exactitude** : % de cas où chrono détecte correctement
- **Cas complexes** : Performance sur expressions difficiles

### 3. Coût

- **Coût API** : Si utilisation de Gemini/API externe
- **Coût maintenance** : Complexité du code

### 4. Fiabilité

- **Stabilité** : Pas de dépendance externe instable
- **Fallback** : Que se passe-t-il en cas d'échec ?

## Plan de test

### Phase 1 : Test unitaire sur cas spécifiques

**Script** : `scripts/test-translation-comparison.js`

**Cas de test** (20 cas représentatifs) :

1. Mois simples : "mars 2026", "janvier 2025"
2. Périodes : "début mars", "fin mars", "en mars"
3. Jours + mois : "tous les samedis de mars 2026"
4. Expressions complexes : "semaine prochaine", "dans 2 semaines"
5. Cas mixtes : "Organise une réunion le 7 mars 2026"
6. Cas difficiles : "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026"

**Métriques à mesurer** :

- Temps de traduction (ms)
- Résultat chrono : détecté ? correct ?
- Score de précision (0-1)

### Phase 2 : Test sur sous-ensemble de tests Gemini

**Sélection** : 10 tests représentatifs de chaque catégorie en échec

- Bug #1 - Mois Explicite : 3 tests
- Realistic - Personnel : 3 tests
- Realistic - Associatif : 2 tests
- Temporal Edge Cases : 2 tests

**Métriques** :

- Taux de réussite par approche
- Temps d'exécution moyen
- Score moyen

### Phase 3 : Test complet (optionnel, si Phase 2 concluante)

**Tous les tests Gemini** : 57 tests complets

## Structure du script de test

```javascript
// scripts/test-translation-comparison.js

const approaches = {
  baseline: { name: "Baseline (chrono.fr)", fn: (input) => chrono.fr.parse(input) },
  manual: {
    name: "Traduction manuelle",
    fn: (input) => {
      const translated = translateManual(input);
      return chrono.en.parse(translated);
    },
  },
  gemini: {
    name: "Traduction Gemini",
    fn: async (input) => {
      const translated = await translateWithGemini(input);
      return chrono.en.parse(translated);
    },
  },
  hybrid: {
    name: "Hybride (manuelle + Gemini fallback)",
    fn: async (input) => {
      const manual = translateManual(input);
      const parsed = chrono.en.parse(manual);
      if (parsed.length === 0 && hasComplexExpressions(input)) {
        const gemini = await translateWithGemini(input);
        return chrono.en.parse(gemini);
      }
      return parsed;
    },
  },
};

// Pour chaque cas de test
// - Mesurer le temps
// - Vérifier la détection
// - Comparer les résultats
```

## Critères de décision

### Score par approche

**Formule** :

```
Score = (Précision × 0.4) + (Performance × 0.2) + (Fiabilité × 0.3) + (Coût × 0.1)

- Précision : % de détection correcte (0-1)
- Performance : 1 - (temps_moyen / temps_max) (0-1)
- Fiabilité : 1 si stable, 0.5 si dépendant API (0-1)
- Coût : 1 si gratuit, 0.5 si API payante, 0.3 si très cher (0-1)
```

### Seuils

- **Score > 0.8** : Approche recommandée
- **Score 0.6-0.8** : Approche acceptable avec améliorations
- **Score < 0.6** : Approche non recommandée

## Résultats attendus

### Hypothèses

1. **Baseline** : ~33% précision (chrono.fr faible)
2. **Manuelle** : ~85% précision, 0ms latence
3. **Gemini** : ~95% précision, ~200ms latence, coût API
4. **Hybride** : ~90% précision, ~50ms latence moyenne, coût API réduit

### Décision probable

Si les hypothèses sont correctes :

- **Pour production** : Manuelle (rapide, gratuite, fiable)
- **Pour cas complexes** : Hybride (meilleur compromis)
- **Pour recherche** : Gemini (meilleure précision)

## Prochaines étapes

1. Créer le script de test `test-translation-comparison.js`
2. Exécuter Phase 1 (20 cas unitaires)
3. Analyser les résultats
4. Décider de l'approche à utiliser
5. Optionnel : Phase 2 (sous-ensemble tests Gemini)
6. Optionnel : Phase 3 (tous les tests)

## Timeline estimée

- **Phase 1** : 30 min (script + exécution)
- **Phase 2** : 1h (sélection tests + exécution)
- **Phase 3** : 2h (tous les tests)

**Total** : ~3h30 pour une comparaison complète
