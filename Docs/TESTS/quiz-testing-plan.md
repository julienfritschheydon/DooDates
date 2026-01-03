# Tests Quiz - Planning Janvier 2026

## 🎯 Objectif
Développer un jeu de tests complet pour valider le workflow de génération de Quiz par fichier sans titre/description.

## 📋 Tests à Implémenter

### 1. Tests E2E (Priorité HAUTE)
- ✅ `ultra-simple-quiz.spec.ts` - Workflow complet upload fichier → génération → publication
- `quiz-generation-text.spec.ts` - Génération depuis texte avec contexte
- `quiz-titre-auto.spec.ts` - Validation génération automatique du titre
- `quiz-contexte.spec.ts` - Test préservation titre manuel lors génération
- `quiz-erreur-fichier.spec.ts` - Gestion erreurs upload (fichier invalide, trop lourd)

### 2. Tests Unitaires (Priorité MOYENNE)
- `QuizzCreate.test.tsx` - Tests composant création quiz
- `QuizzVisionService.test.ts` - Tests service génération
- `quiz-draft.test.ts` - Tests brouillons automatiques

### 3. Tests Integration (Priorité MOYENNE)
- `quiz-storage.test.ts` - Tests persistance quiz
- `quiz-api.test.ts` - Tests appels API Gemini

## 🧪 Scénarios de Test

### Workflow Principal (Ultra Simple)
1. **Page création quiz** → Vérifier champs cachés initialement
2. **Upload fichier** → Simuler upload PDF/image
3. **Génération IA** → Vérifier questions générées automatiquement
4. **Titre auto** → Vérifier titre généré et champ titre qui apparaît
5. **Publication** → Vérifier écran succès et lien partage

### Workflow Contexte
1. **Saisir titre manuel** → "Quiz Mathématiques Avancé"
2. **Upload fichier** → Contenu math simple
3. **Génération** → Vérifier que titre manuel préservé
4. **Questions** → Basées sur fichier mais avec titre personnalisé

### Workflow Texte + Contexte
1. **Saisir titre** → "Quiz Histoire"
2. **Text prompt** → "ajoute des questions sur la Révolution française"
3. **Génération** → Combine titre + demande

### Cas d'Erreur
1. **Fichier trop lourd** → Message erreur 10Mo
2. **Fichier invalide** → Message format supporté
3. **Pas de questions détectées** → Message essayer autre fichier
4. **Erreur API Gemini** → Message configuration clé

## 📊 Métriques de Succès

### Couverture
- **E2E**: 5 scénarios principaux couverts
- **Unitaires**: 80%+ couverture composants quiz
- **Integration**: 100% flux API

### Performance
- **Upload**: < 3s pour fichiers < 5Mo
- **Génération**: < 10s pour 5-10 questions
- **Publication**: < 2s

### UX
- **Feedback**: Toasts pour chaque action
- **Loading**: Indicateurs visuels clairs
- **Erreurs**: Messages explicites et actions

## 🔧 Implémentation

### Semaine 1 (6-12 Janvier)
- [ ] Finaliser `ultra-simple-quiz.spec.ts`
- [ ] Créer `quiz-generation-text.spec.ts`
- [ ] Tests unitaires `QuizzCreate.test.tsx`

### Semaine 2 (13-19 Janvier)
- [ ] Tests integration `QuizzVisionService.test.ts`
- [ ] Tests erreurs `quiz-erreur-fichier.spec.ts`
- [ ] Tests contexte `quiz-contexte.spec.ts`

### Semaine 3 (20-26 Janvier)
- [ ] Tests performance et charge
- [ ] Documentation tests
- [ ] Integration CI/CD

## 🚀 CI/CD Integration

### Tests Automatisés
- **Smoke**: `ultra-simple-quiz.spec.ts` sur chaque PR
- **Regression**: Tous les tests E2E sur merge
- **Performance**: Tests charge hebdomadaire

### Monitoring
- **Success Rate**: > 95% génération réussie
- **Performance**: < 10s temps moyen génération
- **Erreurs**: < 1% erreurs inattendues

## 📝 Notes

### Priorités
1. **Workflow principal** - Ultra simple fichier → publication
2. **Préservation contexte** - Titre manuel non écrasé
3. **Gestion erreurs** - Messages clairs et actions

### Dépendances
- **Gemini API** - Clé configurée dans .env.local
- **File Upload** - Support images/PDF < 10Mo
- **Storage** - localStorage et Supabase ready

### Risques
- **API Gemini** - Rate limiting ou erreurs
- **File parsing** - Formats non supportés
- **Performance** - Gros fichiers traitement lent

---

**Statut**: ✅ Planifié - À implémenter en Janvier 2026
**Priorité**: HAUTE - Core feature Quiz
**Owner**: Julien Fritsch + AI Assistant
