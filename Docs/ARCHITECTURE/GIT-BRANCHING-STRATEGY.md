# 🌿 Git Branching Strategy

## 📁 Setup Multi-IDE

Chaque IDE travaille sur une branche dédiée avec un dossier séparé :

| Dossier | Branche | IDE |
|---------|---------|-----|
| `DooDates` | `main`, `develop` | Principal |
| `DooDates-bug` | `bug` | Corrections bugs |
| `DooDates-feature` | `feature/*` | Nouvelles fonctionnalités |

**Important :** Tous les dossiers pointent vers le même remote GitHub :
```
origin → https://github.com/julienfritschheydon/DooDates.git
```

## 🔄 Pipeline CI/CD

```
bug → testing → staging → preprod → main → deploy
 9      10       11-12      13       3-4     
```

### Workflows automatiques

| # | Workflow | Trigger | Action |
|---|----------|---------|--------|
| 9 | bug-to-testing | Push `bug` | Tests → Merge `testing` |
| 10 | testing-validation | Push `testing` | Tests complets |
| 11 | staging-to-preprod | Push `staging` | Tests → Merge `preprod` |
| 12 | staging-validation | Push `staging` | Tests E2E |
| 13 | preprod-to-main | Push `preprod` | Tests → Merge `main` |
| 3 | main-validation | Push `main` | Validation production |
| 4 | main-deploy-pages | Push `main` | Deploy GitHub Pages |

## 🚀 Workflow quotidien

### Depuis DooDates-bug (branche bug)
```bash
# Développer et commiter
git add -A && git commit -m "fix: description"

# Pousser → déclenche workflow 9 → merge auto vers testing
git push origin bug
```

### Promotion manuelle
```bash
# testing → staging
git checkout staging
git merge testing
git push origin staging

# staging → preprod
git checkout preprod
git merge staging
git push origin preprod
```

## ⚠️ Règles importantes

1. **Ne jamais push directement sur `main`** - Toujours via `preprod`
2. **Chaque dossier = 1 branche** - Ne pas changer de branche dans un dossier
3. **Tous les remotes → GitHub.com** - Pas de remote local entre dossiers

## 🔧 Configuration d'un nouveau dossier

```bash
# Cloner le repo
git clone https://github.com/julienfritschheydon/DooDates.git DooDates-BRANCHE

# Aller dans le dossier
cd DooDates-BRANCHE

# Checkout la branche
git checkout BRANCHE

# Vérifier le remote
git remote -v
# Doit afficher: origin https://github.com/julienfritschheydon/DooDates.git
```
