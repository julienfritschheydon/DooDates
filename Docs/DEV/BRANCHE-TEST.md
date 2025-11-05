# Branche "test" - Tests Rapides en Conditions CI

## 🎯 Objectif

La branche `test` permet de tester rapidement des corrections en **conditions CI réelles** sans bloquer `develop` ou `main`.

## 🚀 Utilisation

### 1. Créer la branche depuis develop

```bash
git checkout develop
git pull origin develop
git checkout -b test
git push origin test
```

### 2. Faire vos modifications

Apportez vos corrections (fix de tests, améliorations, etc.) et commit :

```bash
git add .
git commit -m "fix: description de vos corrections"
git push origin test
```

### 3. Le workflow CI se déclenche automatiquement

Le workflow `.github/workflows/0-test-branch-ci.yml` s'exécute automatiquement sur chaque push vers `test` et :

- ✅ Lance les tests E2E fonctionnels (même configuration que CI principale)
- ✅ Lance les tests E2E smoke (tests critiques)
- ✅ Utilise les mêmes shards, workers, retries que la CI principale
- ✅ Génère des rapports HTML et JSON dans les artefacts

### 4. Vérifier les résultats

1. Allez sur **Actions** dans GitHub
2. Sélectionnez le workflow **"🧪 Test Branch - CI Conditions"**
3. Consultez les rapports dans les artefacts téléchargeables

### 5. Si les tests passent

Une fois validés, mergez vos corrections vers `develop` :

```bash
git checkout develop
git merge test
git push origin develop
```

## 📋 Configuration

Le workflow utilise **exactement la même configuration** que la CI principale :

- ✅ `playwright.config.optimized.ts`
- ✅ `--project=chromium`
- ✅ `--grep "@functional"` (exclut `@wip`, `@flaky`, etc.)
- ✅ `--shard=1/2` et `--shard=2/2` (2 shards)
- ✅ `CI=true` (mode CI)
- ✅ Workers: 3 (comme en CI)
- ✅ Retries: 2 (comme en CI)

## ⚡ Avantages

- **Rapide** : Tests uniquement sur Chromium (plus rapide que multi-navigateurs)
- **Réaliste** : Conditions identiques à la CI principale
- **Non-bloquant** : N'impacte pas `develop` ou `main`
- **Itératif** : Peut push plusieurs fois rapidement pour tester des corrections

## 🔄 Workflow Recommandé

1. Identifier un problème de test en CI
2. Créer une branche `test` depuis `develop`
3. Faire les corrections
4. Push et attendre les résultats CI
5. Si ça passe → merge vers `develop`
6. Si ça échoue → corriger et push à nouveau (itération rapide)

## 📝 Notes

- La branche `test` peut être réutilisée (pas besoin de la recréer à chaque fois)
- Les artefacts sont conservés 3 jours (vs 7 jours pour develop/main)
- Le workflow peut aussi être déclenché manuellement depuis GitHub Actions UI

