# 🔄 Intégrer le fallback Gemini pour la traduction des expressions temporelles complexes

## 📋 Contexte

Actuellement, le système de traduction des expressions temporelles françaises vers l'anglais utilise une approche **manuelle** avec des patterns regex. Cette approche est rapide et fiable pour les cas courants, mais présente des **limites** pour les expressions complexes ou non prévues.

### Problème identifié

Lors des tests, certains cas échouent car la traduction manuelle ne couvre pas tous les patterns possibles :

- ❌ `"dans deux semaines"` → reste `"in deux semaines"` (non traduit)
- ❌ `"quinze jours"` → reste `"quinze jours"` (non traduit)  
- ❌ `"d'après-midi"` → reste `"d'après-midi"` (non traduit)
- ❌ Expressions contextuelles complexes non prévues

### Impact

- **Parsing chrono-node dégradé** : Si le français n'est pas traduit, chrono-node (qui est beaucoup plus performant en anglais) ne peut pas parser correctement
- **Taux de réussite des tests** : Les tests Gemini échouent pour ces cas, impactant le score global
- **Expérience utilisateur** : Certaines expressions temporelles ne sont pas correctement interprétées

## 🎯 Objectif

Implémenter un **fallback Gemini** qui s'active automatiquement lorsque :
1. La traduction manuelle détecte des expressions complexes
2. La traduction manuelle laisse du français non traduit dans le résultat

## 🔒 Sécurité Production

**IMPORTANT** : Le fallback Gemini est **désactivé par défaut en production** pour éviter :
- ⚠️ Coûts API élevés
- ⚠️ Latences supplémentaires
- ⚠️ Consommation de quota

### Activation contrôlée avec rollout progressif

Le fallback s'active si :
- Mode développement (`isDev() === true`) - **toujours activé**
- Mode test (`NODE_ENV=test` ou `VITEST=true`) - **toujours activé**
- Production avec feature flag :
  - `VITE_ENABLE_GEMINI_TRANSLATION_FALLBACK=true` (activation)
  - `VITE_GEMINI_TRANSLATION_FALLBACK_PERCENT=X` (pourcentage de trafic, 0-100)
    - `0` = désactivé (défaut)
    - `10` = 10% du trafic seulement (recommandé pour débuter)
    - `100` = 100% du trafic

### 🎯 Stratégie de rollout recommandée

1. **Phase 1 - Test** : 0% (désactivé par défaut)
2. **Phase 2 - Canary** : 5-10% du trafic avec monitoring
3. **Phase 3 - Rollout** : 25% → 50% → 100% selon les métriques
4. **Phase 4 - Optimisation** : Analyser les données pour enrichir la traduction manuelle

### Code actuel

```typescript
// src/lib/temporalParser.ts
const fallbackEnabled = getEnv("VITE_ENABLE_GEMINI_TRANSLATION_FALLBACK") === "true";
const fallbackPercent = parseInt(getEnv("VITE_GEMINI_TRANSLATION_FALLBACK_PERCENT") || "0", 10);
const isTestOrDev = isDev() || getEnv("NODE_ENV") === "test" || getEnv("VITEST") === "true";

// Activer si :
// 1. Mode dev/test (toujours)
// 2. Flag explicite activé ET (100% du trafic OU échantillonnage aléatoire)
const enableGeminiFallback = 
  isTestOrDev ||
  (fallbackEnabled && (fallbackPercent >= 100 || Math.random() * 100 < fallbackPercent));

translatedInput = await translateTemporalToEnglish(userInput, enableGeminiFallback);
```

### Bénéfices en production

✅ **Amélioration continue** : Collecte de données réelles sur les cas complexes  
✅ **Enrichissement manuel** : Identification des patterns à ajouter à la traduction manuelle  
✅ **Meilleure UX** : Résolution des cas complexes pour les utilisateurs  
✅ **Rollout progressif** : Activation contrôlée avec pourcentage de trafic  
✅ **Monitoring intégré** : Logging automatique pour analytics et coûts

## 🔧 Solution proposée

### Architecture actuelle

```typescript
// src/lib/temporalTranslator.ts
export async function translateTemporalToEnglish(
  input: string,
  useGeminiFallback: boolean = false
): Promise<string> {
  const manualTranslation = translateManual(input);
  const needsGemini = hasComplexTemporalExpressions(input, manualTranslation);
  
  if (!needsGemini || !useGeminiFallback) {
    return manualTranslation;
  }
  
  // TODO: Implémenter translateWithGemini
  return manualTranslation;
}
```

### À implémenter

1. **Méthode `translateWithGemini`** dans `temporalTranslator.ts` :
   - Créer un prompt simple et ciblé pour Gemini
   - Demander uniquement la traduction des expressions temporelles
   - Parser la réponse de Gemini
   - Gérer les erreurs (fallback sur traduction manuelle)
   - **Ajouter un timeout court** (ex: 2s) pour ne pas bloquer
   - **Logger les appels** pour monitoring

2. **Intégration dans `parseTemporalInput`** :
   - ✅ Déjà activé avec garde-fous production
   - Le fallback s'active automatiquement si besoin (et si autorisé)

3. **Optimisations** :
   - Cache des traductions Gemini (éviter appels répétés)
   - Timeout court (ex: 2s) pour ne pas bloquer le parsing
   - Logging pour monitorer l'utilisation du fallback
   - **Rate limiting** pour éviter les appels excessifs

## 📝 Détails techniques

### Prompt Gemini suggéré

```
Traduis UNIQUEMENT les expressions temporelles françaises en anglais dans ce texte.
Garde le reste du texte identique.
Retourne uniquement le texte traduit, sans explication.

Texte: "{input}"
```

### Exemple d'utilisation

```typescript
// Input: "Planifie un point budget dans deux semaines autour de 9h30"
// Traduction manuelle: "Planifie un point budget in deux semaines autour de 9h30" ❌
// Fallback Gemini: "Planifie un point budget in two weeks around 9:30" ✅
```

### Gestion des erreurs

- Si Gemini timeout → retourner traduction manuelle
- Si Gemini erreur → retourner traduction manuelle
- Si réponse invalide → retourner traduction manuelle
- Toujours garantir une traduction (même si incomplète)

## 🧪 Tests à prévoir

1. **Tests unitaires** pour `translateWithGemini` :
   - Cas simples (ne devrait pas être appelé)
   - Cas complexes (devrait être appelé)
   - Gestion erreurs/timeout
   - **Vérifier que le fallback est désactivé en production**

2. **Tests d'intégration** :
   - Vérifier que le fallback s'active correctement en dev/test
   - Vérifier que le fallback est désactivé en production
   - Vérifier que le parsing chrono-node fonctionne après traduction Gemini

3. **Tests de performance** :
   - Mesurer latence ajoutée par Gemini
   - Vérifier que le cache fonctionne
   - Vérifier le rate limiting

## 📊 Métriques de succès

- ✅ Taux de réussite des tests Gemini > 85% (actuellement ~47%)
- ✅ Expressions complexes correctement traduites
- ✅ Latence ajoutée < 500ms en moyenne (avec cache)
- ✅ Pas de régression sur les cas simples (traduction manuelle toujours utilisée)
- ✅ **Aucun appel Gemini en production par défaut**
- ✅ **Coûts API maîtrisés**

## 🔗 Fichiers concernés

- `src/lib/temporalTranslator.ts` - Implémentation du fallback Gemini
- `src/lib/temporalParser.ts` - Intégration avec garde-fous production (✅ fait)
- `src/lib/gemini.ts` - Utilisation de GeminiService (déjà disponible)

## 📅 Priorité

**Moyenne** - Améliore significativement la qualité du parsing, mais la traduction manuelle couvre déjà la majorité des cas. **Le fallback doit rester optionnel et contrôlé.**

## 👤 Demandeur

*Anonymisé* - Utilisateur ayant identifié les limites de la traduction manuelle lors des tests.

---

**Note** : Le code est déjà préparé pour recevoir cette implémentation avec des garde-fous production. Il suffit d'implémenter `translateWithGemini` dans `temporalTranslator.ts`.

**⚠️ IMPORTANT** : Ne jamais activer le fallback Gemini en production sans monitoring et limites de coûts.
