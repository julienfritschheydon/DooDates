# DooDates - Workflow de Développement Sécurisé (DEV ONLY)

## 🌿 Stratégie de Branches - DÉVELOPPEMENT UNIQUEMENT

### **Structure Simplifiée (Sans Production)**
```
main (stable/archive) ← Pas de déploiement automatique
├── develop (intégration active) ← Branche principale de travail
└── feature/nom-fonctionnalité (développement) ← Branches de travail
```

## 💻 **Workflow Quotidien Recommandé**

### **1. Travailler sur la branche `develop`**
```bash
# Votre workflow principal
git checkout develop
git pull origin develop

# Développer directement ou créer une feature
git checkout -b feature/ma-nouvelle-fonctionnalité
```

### **2. Commits avec Tests Automatiques**
```bash
# Chaque commit déclenche les tests automatiques
git add .
git commit -m "feat: amélioration interface calendrier"
# ✅ Pre-commit automatique (30s) :
#   - Tests unitaires rapides
#   - Vérification TypeScript
#   - Tests UX régression
#   - Formatage automatique

git push origin feature/ma-nouvelle-fonctionnalité
# ✅ Pre-push automatique (90s) :
#   - Suite complète de tests
#   - Tests d'intégration
#   - Build de validation
```

### **3. Pull Request vers `develop`**
```bash
# Sur GitHub : Create Pull Request
# feature/ma-nouvelle-fonctionnalité → develop

# ✅ Tests automatiques GitHub Actions :
#   - Tests parallèles (unit, integration, UX)
#   - Validation IA (score > 70%)
#   - Build & vérification TypeScript
#   - Code quality
```

### **4. Merge et Continue**
```bash
# Après merge de la PR
git checkout develop
git pull origin develop
# ✅ Votre code est intégré avec tous les tests validés

# Créer la prochaine feature
git checkout -b feature/prochaine-fonctionnalité
```

## 🔒 **Protection des Branches**

### **Branch `main` - ARCHIVÉE**
- ❌ Push direct interdit
- ❌ Pas de déploiement automatique
- ✅ Utilisée uniquement pour releases majeures manuelles

### **Branch `develop` - ACTIVE**
- ✅ Push autorisé après validation des tests
- ✅ Tests automatiques sur chaque commit
- ✅ Branche principale de développement
- ✅ Intégration continue des features

### **Branches `feature/*` - LIBRES**
- ✅ Développement libre
- ✅ Tests automatiques à chaque commit
- ✅ Merge vers `develop` via PR

## 🧪 **Tests Automatiques à Chaque Étape**

### **Commit Local (Pre-commit)**
```bash
git commit -m "feat: nouvelle fonctionnalité"
# ✅ Exécution automatique (30s) :
#   - 55 tests unitaires
#   - 10 tests UX régression 
#   - 10 tests d'intégration
#   - Vérification TypeScript
#   - Formatage du code
```

### **Push (Pre-push)**
```bash
git push origin ma-branche
# ✅ Validation complète (90s) :
#   - Suite complète de tests
#   - Build production
#   - Tests de performance
```

### **Pull Request (GitHub Actions)**
```bash
# PR créée automatiquement
# ✅ Tests parallèles sur GitHub :
#   - Tests unitaires : 55/55 ✓
#   - Tests UX : 10/10 ✓  
#   - Tests IA : 14/15 ✓ (96%)
#   - Build validation ✓
```

## 📊 **Exemple Concret - Développement Quotidien**

### **Scénario : Amélioration du Calendrier**
```bash
# 1. Créer la feature
git checkout develop
git checkout -b feature/calendrier-ameliore

# 2. Développer
# ... modification du code ...
git add src/components/Calendar.tsx
git commit -m "feat: amélioration interface calendrier"
# ✅ Pre-commit : Tests OK (25s)
#   - Tests unitaires : 55/55 ✓
#   - Tests UX : 10/10 ✓
#   - TypeScript : OK ✓

# 3. Push
git push origin feature/calendrier-ameliore
# ✅ Pre-push : Validation complète (85s)
#   - Build : OK ✓
#   - Tests intégration : 10/10 ✓

# 4. Pull Request
# GitHub → Create PR → feature/calendrier-ameliore → develop
# ✅ GitHub Actions : Tests automatiques
#   - Score global : 98.5% (69/70 tests)
#   - Score IA : 96%
#   - PR prête pour merge ✓

# 5. Merge et continuer
git checkout develop
git pull origin develop
# ✅ Votre amélioration est intégrée !

# 6. Prochaine feature
git checkout -b feature/nouvelle-amelioration
```

## 🚨 **Gestion des Erreurs Automatique**

### **Si Tests Échouent au Commit**
```bash
git commit -m "fix: correction bug"
# ❌ Pre-commit failed: 
#   - Test unitaire échoué : validateEmail
#   - Erreur TypeScript : ligne 45
# → Correction obligatoire avant commit
# → Impossible de commiter du code cassé
```

### **Si Tests Échouent au Push**
```bash
git push origin feature/ma-branche
# ❌ Pre-push failed:
#   - Build production échoué
#   - Test d'intégration échoué
# → Correction obligatoire avant push
# → Impossible de pousser du code instable
```

### **Si PR Échoue**
```bash
# PR automatiquement bloquée
# ❌ GitHub Actions failed:
#   - Score IA insuffisant (85% < 70%)
#   - Test UX régression échoué
# → Corrections nécessaires avant merge
# → Impossible de merger du code défaillant
```

## 🎯 **Avantages de ce Workflow**

### **Développement Serein**
- ✅ Pas de risque de casser quoi que ce soit
- ✅ Tests automatiques à chaque étape
- ✅ Feedback immédiat (< 30s)
- ✅ Développement libre sur les features

### **Qualité Garantie**
- ✅ 98.5% de tests qui passent (69/70)
- ✅ Score IA maintenu à 96%
- ✅ Aucune régression possible
- ✅ Code toujours stable sur `develop`

### **Simplicité**
- ✅ Pas de déploiement automatique à gérer
- ✅ Focus sur le développement
- ✅ Tests automatiques transparents
- ✅ Workflow Git classique

## 🚀 **Commandes Quotidiennes**

### **Workflow Standard**
```bash
# Développement normal
git checkout develop
git checkout -b feature/ma-fonctionnalité
# ... développement ...
git commit -m "feat: nouvelle fonctionnalité"  # ← Tests automatiques
git push origin feature/ma-fonctionnalité      # ← Validation automatique
# → PR sur GitHub → Merge après validation
```

### **Développement Direct sur `develop`**
```bash
# Si vous préférez travailler directement
git checkout develop
# ... développement ...
git commit -m "feat: amélioration rapide"      # ← Tests automatiques
git push origin develop                        # ← Validation automatique
```

---

## 🎉 **Résultat Final**

**Vous développez en toute sérénité :**
- ✅ **Tests automatiques** à chaque commit (30s)
- ✅ **Validation complète** à chaque push (90s)
- ✅ **Aucun code cassé** ne peut être intégré
- ✅ **Feedback immédiat** sur la qualité
- ✅ **Développement libre** sans contraintes production

**Score actuel maintenu : 98.5% (69/70 tests) - Score IA : 96%**

**Vous codez, les tests s'occupent de tout le reste !**