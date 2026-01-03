# Configuration GitHub - Protection des Branches

## 🔒 Configuration Branch Protection

### **1. Protéger la branche `main`**

**GitHub → Settings → Branches → Add rule**

```yaml
Branch name pattern: main

✅ Restrict pushes that create files
✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Require review from code owners
  ✅ Dismiss stale reviews
  ✅ Require review of the last pushable commit

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  Status checks required:
    - quick-tests (unit)
    - quick-tests (integration)
    - quick-tests (ux-regression)
    - ai-validation
    - build-validation
    - code-quality
    - e2e-smoke
    - e2e-matrix (chromium)
    - e2e-matrix (firefox)
    - e2e-matrix (webkit)
    - e2e-matrix (Mobile Chrome)
    - e2e-matrix (Mobile Safari)
    - validation-summary

✅ Require conversation resolution before merging
✅ Require signed commits
✅ Require linear history
✅ Include administrators
```

### **2. Protéger la branche `develop`**

```yaml
Branch name pattern: develop

✅ Require a pull request before merging
  ✅ Require approvals: 1

✅ Require status checks to pass before merging
  Status checks required:
    - tests-unitaires
    - tests-integration
    - tests-ux-regression
```

## 🚀 **Workflow Automatique Résultant**

### **Feature → Develop**

```bash
git push origin feature/ma-fonctionnalité
# ✅ Tests automatiques
# ✅ PR créée automatiquement
# ✅ Merge après validation
```

### **Develop → Main**

```bash
# PR automatique develop → main
# ✅ Quality Gates stricts
# ✅ Score IA > 95%
# ✅ Déploiement automatique
```

## 🎯 **Résultat**

**Vous développez tranquillement, GitHub s'occupe de tout !**

- ✅ Tests automatiques à chaque commit
- ✅ Protection production garantie
- ✅ Déploiement automatique sécurisé
- ✅ Rollback automatique si problème
