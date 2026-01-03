# Plan d'Action - Amélioration des Tests Gemini

**Date:** 21 novembre 2025  
**Dernière mise à jour:** 21 novembre 2025 (Séparation des tests Date/Form)  
**Score actuel:** ~47% (estimé)  
**Objectif:** 70% minimum  
**Gap:** -23 points

## 📁 Structure des Tests

**Tests séparés** (21 novembre 2025) :
- `src/test/gemini-date-polls.test.ts` : 48 tests de sondages de dates
- `src/test/gemini-form-polls.test.ts` : 10 tests de formulaires
- `src/test/gemini-comprehensive.test.ts` : Fichier original (maintenu pour compatibilité)

**Nouveau prompt ajouté** :
- `bug1-6` : "Crée un sondage pour un week-end jeux. L'évènement aura lieu le samedi et le dimanche. Sélectionner les dates correspondantes de mars et avril 2026"

## 🎯 Priorités d'Action

### 🔴 PRIORITÉ 1 - Corrections Critiques (Impact: +15-20 points)

#### 1.1 Améliorer la traduction temporelle (temporalTranslator.ts)

**Problèmes identifiés:**
- Regex "du" trop agressive : "du bureau" → "from bureau" ❌
- "la semaine" non traduit : "la semaine prochaine" → "la next semaine" ❌
- "et" non traduit dans plages horaires : "entre 11h et 13h" → "between 11:00 et 13:00" ❌
- Articles français non traduits : "pour", "avec", "de", "la", "le", "les" ❌

**Actions:**
1. ✅ **Corriger le regex "du"** :
   - Distinguer "du" (article contracté) vs "du" (préposition temporelle)
   - Pattern: `/\bdu\s+(\d+|[a-z]+)\b/gi` → seulement si suivi d'un nombre ou d'un mois/jour
   - Exclure les noms communs (bureau, client, etc.)

2. ✅ **Traduire "la semaine"** :
   - "la semaine prochaine" → "next week"
   - "cette semaine" → "this week"
   - Pattern: `/\bla\s+semaine\s+(prochaine|suivante|dernière|courante)\b/gi`

3. ✅ **Traduire "et" dans plages horaires** :
   - "entre X et Y" → "between X and Y"
   - Pattern: `/\bet\s+(\d{1,2}[:h])/gi` → "and $1"

4. ✅ **Traduire les articles/prépositions restants** :
   - "pour" → "for" (dans contexte temporel)
   - "avec" → "with" (optionnel, moins critique)
   - "de" → "of" (dans "fin de semaine" → "end of week")

**Impact estimé:** +10-15 points

#### 1.2 Corriger les tests avec dates passées

**Problèmes:**
- 2 tests échouent car Gemini génère des dates dans le passé
- Tests: "Trouve un après-midi libre la semaine prochaine", "Planifie la réunion de lancement la semaine prochaine"

**Actions:**
1. Vérifier les dates dans les tests (peut-être que "semaine prochaine" est déjà passée)
2. Améliorer le prompt Gemini pour forcer les dates futures
3. Ajouter une validation plus stricte dans `parseGeminiResponse`

**Impact estimé:** +2-3 points

### 🟡 PRIORITÉ 2 - Améliorations Moyennes (Impact: +5-10 points)

#### 2.1 Enrichir le vocabulaire de traduction

**Actions:**
1. Ajouter les expressions manquantes identifiées dans les logs
2. Utiliser le vocabulaire généré par Gemini (gemini-vocabulary.json)
3. Tester chaque nouvelle traduction avec chrono-node

**Impact estimé:** +3-5 points

#### 2.2 Améliorer la détection des mots-clés

**Problèmes:**
- Certains mots-clés ne sont pas détectés dans les titres
- "Planifie", "Trouve", "Organise" sont ajoutés au titre mais ne devraient pas

**Actions:**
1. Améliorer `extractImportantKeywords` pour exclure les verbes d'action
2. Améliorer la logique d'ajout des mots-clés manquants

**Impact estimé:** +2-3 points

### 🟢 PRIORITÉ 3 - Optimisations (Impact: +2-5 points)

#### 3.1 Améliorer les prompts Gemini

**Actions:**
1. Analyser les prompts qui échouent
2. Ajuster les hints envoyés à Gemini
3. Tester différentes formulations

**Impact estimé:** +2-5 points

## 📋 Checklist d'Implémentation

### Phase 1 - Corrections Critiques (1-2 jours)
- [ ] Corriger regex "du" dans temporalTranslator.ts
- [ ] Traduire "la semaine" et variantes
- [ ] Traduire "et" dans plages horaires
- [ ] Traduire articles/prépositions restants
- [ ] Tester chaque correction avec chrono-node
- [ ] Relancer les tests et vérifier l'amélioration

### Phase 2 - Tests avec dates passées (0.5 jour)
- [ ] Identifier les tests avec dates passées
- [ ] Mettre à jour les dates ou améliorer la validation
- [ ] Vérifier que les tests passent

### Phase 3 - Enrichissement vocabulaire (1 jour)
- [ ] Intégrer le vocabulaire de gemini-vocabulary.json
- [ ] Tester chaque nouvelle traduction
- [ ] Documenter les ajouts

### Phase 4 - Amélioration prompts (1 jour)
- [ ] Analyser les échecs restants
- [ ] Ajuster les prompts Gemini
- [ ] Tester les améliorations

## 🎯 Objectifs par Phase

| Phase | Score cible | Actions principales |
|-------|-------------|---------------------|
| Phase 1 | 60-65% | Corrections traduction |
| Phase 2 | 62-67% | Fix dates passées |
| Phase 3 | 65-70% | Enrichissement vocabulaire |
| Phase 4 | 70%+ | Optimisation prompts |

## 📊 Métriques de Succès

- **Score minimum:** 70% (160/228 points)
- **Tests réussis:** 40+/57
- **Erreurs critiques:** 0 (dates passées, parsing)
- **Traductions correctes:** 95%+

## 🔄 Processus Itératif

1. **Corriger** → 2. **Tester** → 3. **Analyser** → 4. **Itérer**

Après chaque correction:
- Relancer les tests de dates: `npm run test src/test/gemini-date-polls.test.ts 2>&1 | node scripts/generate-gemini-test-report.js`
- Relancer les tests de formulaires: `npm run test src/test/gemini-form-polls.test.ts 2>&1 | node scripts/generate-gemini-test-report.js`
- Ou tous les tests: `npm run test:gemini 2>&1 | node scripts/generate-gemini-test-report.js`
- Analyser les rapports générés (`tests/reports/gemini-date-polls-report.md` et `gemini-form-polls-report.md`)
- Identifier les prochains problèmes
- Corriger et réitérer

## 📝 Notes

- **Ne pas tout corriger d'un coup** : faire une correction à la fois et tester
- **Prioriser les corrections à fort impact** : regex "du", "la semaine", "et"
- **Documenter chaque changement** : pourquoi, comment, impact
- **Tester avec chrono-node** : vérifier que chaque traduction fonctionne

