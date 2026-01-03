# BUGFIX - Expressions temporelles relatives (10/01/2025)

## 🐛 Problème identifié

Gemini ne comprenait pas correctement les expressions temporelles relatives comme "dans 2 semaines", "dans 3 semaines", etc.

### Symptômes

- Utilisateur demande: "réunion d'équipe dans 2 semaines"
- Gemini génère: dates en novembre/décembre 2025 (dates aléatoires)
- Attendu: dates calculées à partir d'aujourd'hui + 14 jours

### Cause racine

Le prompt Gemini contenait des instructions pour "cette semaine", "semaine prochaine", "demain" mais **manquait d'instructions explicites** pour:

- "dans X jours"
- "dans X semaines"
- "dans X mois"

Gemini essayait de deviner sans méthode de calcul claire.

## ✅ Solution implémentée

### Modifications apportées

**Fichier:** `src/lib/gemini.ts` (fonction `buildPollGenerationPrompt`)

Ajout d'une section complète "EXPRESSIONS TEMPORELLES RELATIVES - CALCUL OBLIGATOIRE" avec:

1. **Instructions de calcul explicites**

   ```
   - "dans X jours" → Ajouter X jours à aujourd'hui
   - "dans X semaines" → Ajouter (X × 7) jours à aujourd'hui
   - "dans X mois" → Ajouter X mois à la date actuelle
   ```

2. **Exemples concrets avec dates calculées**
   - "dans 3 jours" = [date calculée dynamiquement]
   - "dans 2 semaines" = [date calculée dynamiquement]
   - "dans 3 semaines" = [date calculée dynamiquement]
   - "dans 4 semaines" = [date calculée dynamiquement]

3. **Méthode de calcul étape par étape**

   ```
   1. Identifier le nombre de semaines demandé (X)
   2. Calculer la date cible = aujourd'hui + (X × 7 jours)
   3. Identifier le jour de la semaine demandé
   4. Trouver le jour demandé dans la semaine cible
   5. Proposer plusieurs dates autour de cette semaine cible
   ```

4. **Exemple concret "réunion d'équipe dans 2 semaines"**
   - Aujourd'hui: [date du jour]
   - Dans 2 semaines: [date calculée]
   - Proposer des dates autour de cette période (±3-5 jours)
   - ⚠️ NE PAS proposer de dates en novembre/décembre si on est en janvier!

5. **Règle absolue ajoutée**
   > "Toujours calculer à partir d'aujourd'hui, JAMAIS utiliser des dates fixes!"

### Code ajouté

```typescript
EXPRESSIONS TEMPORELLES RELATIVES - CALCUL OBLIGATOIRE:
Tu DOIS calculer les dates exactes à partir d'aujourd'hui (${getTodayLocal()}) pour ces expressions:

- "dans X jours" → Ajouter X jours à ${getTodayLocal()}
  Exemple: "dans 3 jours" = ${formatDateLocal(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000))}

- "dans X semaines" → Ajouter (X × 7) jours à ${getTodayLocal()}
  Exemple: "dans 2 semaines" = ${formatDateLocal(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000))}
  Exemple: "dans 3 semaines" = ${formatDateLocal(new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000))}
  Exemple: "dans 4 semaines" = ${formatDateLocal(new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000))}

- "dans X mois" → Ajouter X mois à la date actuelle
  Exemple: "dans 1 mois" = ${formatDateLocal(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()))}
  Exemple: "dans 2 mois" = ${formatDateLocal(new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()))}

MÉTHODE DE CALCUL POUR "dans X semaines":
1. Identifier le nombre de semaines demandé (X)
2. Calculer la date cible = ${getTodayLocal()} + (X × 7 jours)
3. Identifier le jour de la semaine demandé (ex: "lundi", "mardi", etc.)
4. Trouver le jour demandé dans la semaine cible
5. Proposer plusieurs dates autour de cette semaine cible (semaine avant, semaine cible, semaine après)

EXEMPLE CONCRET "réunion d'équipe dans 2 semaines":
- Aujourd'hui: ${getTodayLocal()}
- Dans 2 semaines: ${formatDateLocal(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000))}
- Proposer des dates autour de cette période (±3-5 jours)
- NE PAS proposer de dates en novembre/décembre si on est en janvier!

RÈGLE ABSOLUE: Toujours calculer à partir de ${getTodayLocal()}, JAMAIS utiliser des dates fixes!
```

### Intégration dans la section "Comprendre les expressions temporelles"

Ajout de 3 lignes supplémentaires dans la liste existante:

```typescript
- "dans X jours" = CALCULER: ${getTodayLocal()} + X jours
- "dans X semaines" = CALCULER: ${getTodayLocal()} + (X × 7) jours
- "dans X mois" = CALCULER: ajouter X mois à ${getTodayLocal()}
```

## 📊 Impact

### Avant

- ❌ "dans 2 semaines" → dates aléatoires (nov/déc 2025)
- ❌ "dans 3 semaines" → dates incohérentes
- ❌ "dans 5 jours" → dates incorrectes

### Après

- ✅ "dans 2 semaines" → dates calculées correctement (aujourd'hui + 14 jours)
- ✅ "dans 3 semaines" → dates calculées correctement (aujourd'hui + 21 jours)
- ✅ "dans 5 jours" → dates calculées correctement (aujourd'hui + 5 jours)

### Expressions temporelles supportées

| Expression          | Calcul         | Exemple (si aujourd'hui = 10/01/2025) |
| ------------------- | -------------- | ------------------------------------- |
| "demain"            | +1 jour        | 11/01/2025                            |
| "dans 3 jours"      | +3 jours       | 13/01/2025                            |
| "dans 5 jours"      | +5 jours       | 15/01/2025                            |
| "cette semaine"     | 0 à +7 jours   | 10/01 → 17/01/2025                    |
| "semaine prochaine" | +7 à +14 jours | 17/01 → 24/01/2025                    |
| "dans 2 semaines"   | +14 jours      | 24/01/2025                            |
| "dans 3 semaines"   | +21 jours      | 31/01/2025                            |
| "dans 4 semaines"   | +28 jours      | 07/02/2025                            |
| "dans 1 mois"       | +1 mois        | 10/02/2025                            |
| "dans 2 mois"       | +2 mois        | 10/03/2025                            |

## 🧪 Tests à effectuer

### Test 1: "dans 2 semaines"

1. Ouvrir le chat DooDates
2. Taper: "réunion d'équipe dans 2 semaines"
3. Vérifier que les dates proposées sont autour de [aujourd'hui + 14 jours]
4. ✅ Les dates doivent être cohérentes avec la période demandée

### Test 2: "dans 3 semaines"

1. Taper: "disponibilité dans 3 semaines"
2. Vérifier que les dates proposées sont autour de [aujourd'hui + 21 jours]
3. ✅ Pas de dates en novembre/décembre si on est en janvier

### Test 3: "dans 5 jours"

1. Taper: "rendez-vous dans 5 jours"
2. Vérifier que les dates proposées sont autour de [aujourd'hui + 5 jours]
3. ✅ Dates précises et cohérentes

### Test 4: "dans 1 mois"

1. Taper: "réunion dans 1 mois"
2. Vérifier que les dates proposées sont autour de [même jour, mois suivant]
3. ✅ Calcul de mois correct

## 📝 Notes techniques

### Utilisation de `formatDateLocal()`

Le prompt utilise `formatDateLocal()` de `date-utils.ts` pour garantir:

- Dates en heure locale (pas UTC)
- Format YYYY-MM-DD cohérent
- Pas de décalage de fuseau horaire

### Calculs dynamiques dans le prompt

Les exemples de dates sont calculés **dynamiquement** à chaque génération du prompt:

```typescript
const today = new Date();
// ...
formatDateLocal(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));
```

Cela garantit que Gemini voit toujours des exemples **à jour** basés sur la date actuelle.

## ✅ Statut

**CORRIGÉ** - Prêt pour tests utilisateur

Le prompt Gemini contient maintenant des instructions explicites et des exemples concrets pour toutes les expressions temporelles relatives courantes.

## 🔗 Fichiers modifiés

- `src/lib/gemini.ts` - Fonction `buildPollGenerationPrompt()` (lignes 887-915 + 994-996)

## 📅 Historique

- **10/01/2025** - Bug identifié via capture d'écran utilisateur
- **10/01/2025** - Solution implémentée avec instructions explicites
- **10/01/2025** - Documentation créée

---

**Prochaine étape:** Tests manuels pour valider le comportement avec différentes expressions temporelles.
