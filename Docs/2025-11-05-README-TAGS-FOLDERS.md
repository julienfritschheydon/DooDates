# 🧪 Tests - Tags et Dossiers

**Fonctionnalité** : Gestion des tags et dossiers pour les conversations  
**Date** : 2025-01-XX  
**Statut** : ✅ Implémenté - ⏳ À tester

---

## 📋 Résumé

Cette fonctionnalité permet aux utilisateurs d'organiser leurs conversations avec des **tags** (libellés colorés) et des **dossiers** (groupes thématiques).

---

## 🤖 Tests Automatisés (E2E)

### Fichier : `tests/e2e/tags-folders.spec.ts`

**6 tests E2E** couvrant :
- ✅ Ouverture du dialogue de gestion
- ✅ Assignation de tags
- ✅ Assignation de dossiers
- ✅ Retrait de tags et dossiers
- ✅ Affichage sur les cartes
- ✅ Gestion des cas limites

### Exécution

```bash
# Lancer les tests E2E pour tags/dossiers
npx playwright test tags-folders.spec.ts --project=chromium

# Lancer tous les tests E2E
npx playwright test
```

### Tags de test

Les tests utilisent les tags Playwright suivants :
- `@smoke` : Tests de base critiques
- `@critical` : Tests critiques pour la fonctionnalité
- `@functional` : Tests fonctionnels complets
- `@edge` : Tests de cas limites

---

## ✋ Tests Manuels

### Fichier : `Docs/TESTS/TESTS-MANUELS-TAGS-FOLDERS.md`

**26 tests manuels** organisés en catégories :

1. **Tests Fonctionnels de Base** (6 tests)
   - Ouverture du dialogue
   - Assignation/retrait de tags
   - Assignation/retrait de dossiers
   - Combinaisons multiples

2. **Tests d'Affichage** (3 tests)
   - Affichage des tags sur les cartes
   - Affichage des dossiers sur les cartes
   - Affichage combiné

3. **Tests de Filtrage** (3 tests)
   - Filtrage par tag
   - Filtrage par dossier
   - Filtrage combiné

4. **Tests de Cas Limites** (4 tests)
   - Conversation sans tags/dossiers
   - Beaucoup de tags
   - Noms longs
   - Dossiers sans icône

5. **Tests d'Erreurs** (3 tests)
   - Annulation des modifications
   - Fermeture sans sauvegarder
   - Conversation introuvable

6. **Tests de Performance** (2 tests)
   - Performance avec beaucoup de tags
   - Performance avec beaucoup de dossiers

7. **Tests Multi-Navigateurs** (3 tests)
   - Chrome, Firefox, Safari

8. **Tests Responsive** (2 tests)
   - Mobile, Tablette

---

## 📚 Documentation Utilisateur

### Fichier : `public/docs/10-Tableau-Bord.md`

Section **"Organisation"** mise à jour avec :
- ✅ Guide complet pour assigner des tags
- ✅ Guide complet pour assigner des dossiers
- ✅ Exemples d'organisation
- ✅ Instructions de filtrage
- ✅ Bonnes pratiques

---

## ✅ Checklist de Validation

Avant de considérer la fonctionnalité comme prête :

### Tests Automatisés
- [ ] Tous les tests E2E passent (6/6)
- [ ] Tests exécutés sur Chrome
- [ ] Tests exécutés sur Firefox (optionnel)
- [ ] Aucune erreur console

### Tests Manuels Critiques
- [ ] Test 1 : Ouvrir le dialogue ✅
- [ ] Test 2 : Assigner des tags ✅
- [ ] Test 4 : Assigner un dossier ✅
- [ ] Test 7 : Affichage des tags ✅
- [ ] Test 8 : Affichage du dossier ✅
- [ ] Test 10 : Filtrer par tag ✅
- [ ] Test 11 : Filtrer par dossier ✅

### Documentation
- [ ] Documentation utilisateur complète
- [ ] Exemples clairs et complets
- [ ] Instructions étape par étape

### Performance
- [ ] Dialogue s'ouvre rapidement (< 1s)
- [ ] Pas de lag avec 20+ tags/dossiers
- [ ] Affichage fluide sur mobile

---

## 🐛 Problèmes Connus

Aucun problème connu actuellement.

---

## 📝 Notes

- Les tests E2E utilisent `localStorage` pour créer des données de test
- Les tests manuels incluent des données de test recommandées
- La documentation utilisateur est accessible depuis `/docs/10-Tableau-Bord.md`

---

**Dernière mise à jour** : 2025-01-XX
