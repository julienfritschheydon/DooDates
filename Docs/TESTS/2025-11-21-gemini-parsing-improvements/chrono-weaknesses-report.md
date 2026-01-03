# Rapport des faiblesses de chrono-node

**Date**: 2025-11-21T16:27:36.659Z
**Date de référence**: 2025-11-21

## Résumé

- **Total de tests**: 18
- **Succès**: 6
- **Échecs**: 12
- **Taux de réussite**: 33%

## Cas problématiques


### 1. "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026"

- **Attendu**: mars 2026
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 2. "Planifie un événement tous les samedis de mai 2026"

- **Attendu**: mai 2026
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 3. "Crée un sondage pour les dimanches de décembre 2025"

- **Attendu**: décembre 2025
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 4. "mars 2026"

- **Attendu**: mars 2026
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 5. "mars"

- **Attendu**: mars
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 6. "en mars"

- **Attendu**: mars
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 7. "début mars"

- **Attendu**: début mars
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 8. "fin mars"

- **Attendu**: fin mars
- **Détecté**: RIEN
- **Problème**: Aucune date détectée
- **Date extraite**: N/A


### 9. "vendredi soir ou samedi matin"

- **Attendu**: vendredi ou samedi
- **Détecté**: vendredi soir
- **Problème**: Texte détecté ne correspond pas
- **Date extraite**: 2025-11-21


### 10. "Propose trois soirées pour un escape game fin mars."

- **Attendu**: fin mars
- **Détecté**: soir
- **Problème**: Texte détecté ne correspond pas
- **Date extraite**: 2025-11-21


### 11. "Trouve un après-midi libre la semaine prochaine pour la visite au musée."

- **Attendu**: semaine prochaine
- **Détecté**: après-midi
- **Problème**: Texte détecté ne correspond pas
- **Date extraite**: 2025-11-22


### 12. "Bloque un créneau vendredi soir ou samedi matin pour un footing."

- **Attendu**: vendredi ou samedi
- **Détecté**: vendredi soir
- **Problème**: Texte détecté ne correspond pas
- **Date extraite**: 2025-11-21


## Patterns non reconnus

1. "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026"
2. "Planifie un événement tous les samedis de mai 2026"
3. "Crée un sondage pour les dimanches de décembre 2025"
4. "mars 2026"
5. "mars"
6. "en mars"
7. "début mars"
8. "fin mars"

## Recommandations

1. **Normalisation des mois français**: Avant d'appeler chrono-node, normaliser les noms de mois français
2. **Pré-processing**: Ajouter des indices contextuels pour aider chrono-node (ex: "mars 2026" → "en mars 2026")
3. **Fallback manuel**: Pour les cas non reconnus, utiliser un parsing manuel basé sur les patterns identifiés
