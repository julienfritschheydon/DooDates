# Rapport de comparaison des approches de traduction

**Date**: 2025-11-21T16:46:20.006Z
**Total de tests**: 20

## Résultats par approche

### Baseline (chrono.fr)

- **Taux de réussite**: 8/20 (40%)
- **Temps moyen**: 1ms
- **Score total**: 76.0%

### Traduction manuelle

- **Taux de réussite**: 19/20 (95%)
- **Temps moyen**: 3ms
- **Score total**: 98.0%

### Traduction Gemini

- **Taux de réussite**: 19/20 (95%)
- **Temps moyen**: 219ms
- **Score total**: 83.0%

### Approche hybride

- **Taux de réussite**: 19/20 (95%)
- **Temps moyen**: 0ms
- **Fallbacks Gemini**: 0/20
- **Score total**: 91.5%

## Recommandation

🏆 **Meilleure approche**: manual

### Détails du score

#### baseline

- Précision: 40.0% (poids: 40%)
- Performance: 100.0% (poids: 20%)
- Fiabilité: 100.0% (poids: 30%)
- Coût: 100.0% (poids: 10%)
- **Total**: 76.0%

#### manual

- Précision: 95.0% (poids: 40%)
- Performance: 99.9% (poids: 20%)
- Fiabilité: 100.0% (poids: 30%)
- Coût: 100.0% (poids: 10%)
- **Total**: 98.0%

#### gemini

- Précision: 95.0% (poids: 40%)
- Performance: 95.0% (poids: 20%)
- Fiabilité: 70.0% (poids: 30%)
- Coût: 50.0% (poids: 10%)
- **Total**: 83.0%

#### hybrid

- Précision: 95.0% (poids: 40%)
- Performance: 100.0% (poids: 20%)
- Fiabilité: 85.0% (poids: 30%)
- Coût: 80.0% (poids: 10%)
- **Total**: 91.5%

## Détails par cas de test

### 1. Mois simples: "mars 2026"

- **Baseline**: ❌ Non détecté (8ms)
- **Manuelle**: ✅ "march 2026" (47ms)
- **Gemini**: ✅ "march 2026" (430ms)
- **Hybride**: ✅ "march 2026" (0ms)

### 2. Mois simples: "janvier 2025"

- **Baseline**: ❌ Non détecté (6ms)
- **Manuelle**: ✅ "january 2025" (2ms)
- **Gemini**: ✅ "january 2025" (202ms)
- **Hybride**: ✅ "january 2025" (0ms)

### 3. Mois simples: "décembre 2025"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "december 2025" (1ms)
- **Gemini**: ✅ "december 2025" (204ms)
- **Hybride**: ✅ "december 2025" (1ms)

### 4. Périodes: "début mars"

- **Baseline**: ❌ Non détecté (1ms)
- **Manuelle**: ✅ "march" (1ms)
- **Gemini**: ✅ "march" (202ms)
- **Hybride**: ✅ "march" (0ms)

### 5. Périodes: "fin mars"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "march" (0ms)
- **Gemini**: ✅ "march" (206ms)
- **Hybride**: ✅ "march" (1ms)

### 6. Périodes: "en mars"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "march" (0ms)
- **Gemini**: ✅ "march" (210ms)
- **Hybride**: ✅ "march" (1ms)

### 7. Jours + mois: "tous les samedis de mars 2026"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "march 2026" (1ms)
- **Gemini**: ✅ "march 2026" (200ms)
- **Hybride**: ✅ "march 2026" (1ms)

### 8. Jours + mois: "lundi ou mardi"

- **Baseline**: ✅ "lundi" (1ms)
- **Manuelle**: ✅ "monday" (1ms)
- **Gemini**: ✅ "monday" (204ms)
- **Hybride**: ✅ "monday" (1ms)

### 9. Jours + mois: "vendredi soir ou samedi matin"

- **Baseline**: ✅ "vendredi soir" (2ms)
- **Manuelle**: ✅ "friday" (0ms)
- **Gemini**: ✅ "friday" (210ms)
- **Hybride**: ✅ "friday" (0ms)

### 10. Expressions: "semaine prochaine"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "next week" (1ms)
- **Gemini**: ✅ "next week" (209ms)
- **Hybride**: ✅ "next week" (0ms)

### 11. Expressions: "cette semaine"

- **Baseline**: ❌ Non détecté (1ms)
- **Manuelle**: ✅ "this week" (0ms)
- **Gemini**: ✅ "this week" (213ms)
- **Hybride**: ✅ "this week" (0ms)

### 12. Expressions: "dans 2 semaines"

- **Baseline**: ✅ "dans 2 semaines" (3ms)
- **Manuelle**: ❌ Non détecté (2ms)
- **Gemini**: ❌ Non détecté (208ms)
- **Hybride**: ❌ Non détecté (1ms)

### 13. Cas mixtes: "Organise une réunion le 7 mars 2026"

- **Baseline**: ✅ "7 mars 2026" (1ms)
- **Manuelle**: ✅ "7 march 2026" (1ms)
- **Gemini**: ✅ "7 march 2026" (211ms)
- **Hybride**: ✅ "7 march 2026" (1ms)

### 14. Cas mixtes: "Planifie un événement tous les samedis de mai 2026"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "may 2026" (1ms)
- **Gemini**: ✅ "may 2026" (212ms)
- **Hybride**: ✅ "may 2026" (0ms)

### 15. Cas mixtes: "Crée un sondage pour les dimanches de décembre 2025"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "december 2025" (0ms)
- **Gemini**: ✅ "december 2025" (212ms)
- **Hybride**: ✅ "december 2025" (0ms)

### 16. Cas difficiles: "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026"

- **Baseline**: ❌ Non détecté (0ms)
- **Manuelle**: ✅ "march 2026" (1ms)
- **Gemini**: ✅ "march 2026" (213ms)
- **Hybride**: ✅ "march 2026" (0ms)

### 17. Cas difficiles: "Propose trois soirées pour un escape game fin mars."

- **Baseline**: ✅ "soir" (0ms)
- **Manuelle**: ✅ "march" (1ms)
- **Gemini**: ✅ "march" (210ms)
- **Hybride**: ✅ "march" (0ms)

### 18. Cas difficiles: "Trouve un après-midi libre la semaine prochaine pour la visite au musée."

- **Baseline**: ✅ "après-midi" (1ms)
- **Manuelle**: ✅ "next week" (1ms)
- **Gemini**: ✅ "next week" (210ms)
- **Hybride**: ✅ "next week" (1ms)

### 19. Cas difficiles: "Bloque un créneau vendredi soir ou samedi matin pour un footing."

- **Baseline**: ✅ "vendredi soir" (1ms)
- **Manuelle**: ✅ "friday" (1ms)
- **Gemini**: ✅ "friday" (211ms)
- **Hybride**: ✅ "friday" (0ms)

### 20. Cas difficiles: "Calcule un brunch samedi 23 ou dimanche 24."

- **Baseline**: ✅ "samedi 23" (1ms)
- **Manuelle**: ✅ "saturday 23" (1ms)
- **Gemini**: ✅ "saturday 23" (210ms)
- **Hybride**: ✅ "saturday 23" (0ms)
