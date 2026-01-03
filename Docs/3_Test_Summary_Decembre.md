# Test Summary – Décembre 2025

## 1️⃣ Tests exécutés

| ID  | Prompt (extrait)                                                                      | Objectif                                             |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | **Brunch** – "Calcule un brunch samedi 23 ou dimanche 24."                            | Au moins **2 créneaux** (un par date) – score ≥ 0.85 |
| 2   | **Cousins** – "Organise un dîner avec les cousins courant avril, plutôt le week‑end." | Au moins **1 créneau** – score ≥ 0.85                |
| 3   | **Footing** – "Footing vendredi soir ou samedi matin."                                | Au moins **2 créneaux** – score ≥ 0.85               |
| 4   | **Partenariats** – "Propose‑moi trois créneaux mardi ou mercredi prochain …"          | Au moins **3 créneaux** – score ≥ 0.85               |
| …   | (autres cas _PARTIEL/NOK_)                                                            | Vérifient le nombre et le type de créneaux générés   |

> 18 tests au total : 2 échouent, 16 sont sautés (non pertinents pour le problème actuel).

## 2️⃣ Tests qui échouent

| Test        | Résultat                    | Pourquoi l’échec                                                                                                                                                                                                                   |
| ----------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brunch**  | Score 0.80 / 1.0 → **FAIL** | Gemini renvoie 2 dates, mais le post‑processueur ne crée qu’**un seul créneau** partagé. `hasExplicitDifferentTimes` est false → pas de séparation, `shouldGenerateSlotsForMissingDates` est false → aucun créneau supplémentaire. |
| **Cousins** | Score 0.50 / 1.0 → **FAIL** | Gemini renvoie 8 dates, mais **aucun créneau** n’est généré (fallback ne produit rien). Le code qui devait créer des créneaux manquants est désactivé.                                                                             |

## 3️⃣ Analyse du problème

- `hasExplicitDifferentTimes` détecte les horaires différents. Pour les prompts _brunch_ et _cousins_ il renvoie **false**.
- `shouldSeparateSharedSlots` = `sharedSlots.length > 0 && hasExplicitDifferentTimes` → **false** → les créneaux partagés ne sont jamais séparés.
- `shouldGenerateSlotsForMissingDates` = `sharedSlots.length === 0 && …` → **false** dès qu’il existe un créneau partagé.
- Le bloc `else` (fallback) ne crée qu’un créneau générique, donc le nombre de créneaux reste inférieur au nombre de dates.
- [limitSlotsCount](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates-bug/src/services/GeminiSuggestionPostProcessor.ts#629-678) était commenté, puis ré‑activé, mais ne pose pas de problème tant que `maxSlots` ≥ nombre de dates.

## 4️⃣ Proposition de solution

1. **Modifier la condition de génération** :
   ```ts
   const shouldGenerateSlotsForMissingDates =
     (sharedSlots.length > 0 || singleDateSlots.length > 0) &&
     finalDates.length > processedSlots.length;
   ```
   Ainsi, dès qu’il y a plus de dates que de créneaux (même avec un créneau partagé), on crée les créneaux manquants.
2. **Ajouter un fallback** qui crée un créneau pour chaque date restante :

   ```ts
   if (processedSlots.length < finalDates.length) {
     const datesWithSlots = new Set<string>();
     processedSlots.forEach((s) => (s.dates || []).forEach((d) => datesWithSlots.add(d)));

     const datesWithout = finalDates.filter((d) => !datesWithSlots.has(d));
     datesWithout.forEach((date) => {
       const slot = /brunch/i.test(options.userInput)
         ? createSlot(date, 11, 30, 90) // brunch 11h30‑13h
         : createSlot(date, 10, 0, 60); // créneau générique 10h‑11h
       processedSlots.push(slot);
     });
   }
   ```

3. **Conserver [limitSlotsCount](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates-bug/src/services/GeminiSuggestionPostProcessor.ts#629-678)** (décommenté) : il limitera les créneaux uniquement si le contexte l’exige (nombre explicite demandé).
4. **Résultat attendu** :
   - _Brunch_ → deux créneaux (samedi 23 et dimanche 24 à 11h30‑13h) → score ≥ 0.85.
   - _Cousins_ → au moins un créneau par date (ou créneau générique) → score ≥ 0.85.
   - Les autres scénarios (footing, partenariats, etc.) restent inchangés.

## 5️⃣ Prochaines étapes

1. Appliquer les modifications ci‑dessus dans [GeminiSuggestionPostProcessor.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates-bug/src/services/GeminiSuggestionPostProcessor.ts).
2. Sauvegarder le fichier.
3. Relancer les tests ciblés :
   ```bash
   npx vitest run --config vitest.config.gemini.ts \
       src/test/temporal-prompts-validation.manual.ts -t "cousins|brunch|footing|partenariats"
   ```
4. Vérifier que les deux tests précédemment en échec passent.
5. Commiter les changements et mettre à jour le [implementation_plan.md](file:///c:/Users/Julien%20Fritsch/.gemini/antigravity/brain/74b37a15-3327-4bde-9e8a-a636b8553d29/implementation_plan.md) si nécessaire.

---

_Ce document résume les travaux, les points bloquants et la solution proposée afin de permettre aux développeurs de finaliser rapidement les correctifs._
