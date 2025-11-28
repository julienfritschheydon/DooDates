# Guide Git - Séparation des Fichiers dans les Commits

## 🎯 Objectif
Séparer proprement les fichiers dans les commits quand on travaille sur une branche pour le déploiement en production.

## 📋 Méthodes Principales

### 1. **Git Interactive Staging** (Recommandé pour le quotidien)
Utilise `git add -i` ou `git add -p` pour séparer les changements par fichier ou même par partie de fichier.

```bash
# Mode interactif complet
git add -i

# Mode patch (plus rapide)
git add -p
```

**Avantages :**
- Permet de sélectionner précisément quelles modifications inclure
- Fonctionne même dans un même fichier (hunks séparés)
- Idéal pour commits logiques et reviewables

**Workflow typique :**
```bash
# 1. Voir les changements
git status

# 2. Mode interactif
git add -i

# 3. Choisir les fichiers/hunks à stager
# Options: 1=status, 2=update, 3=revert, 4=add untracked, 5=patch, 6=diff, 7=quit

# 4. Commiter
git commit -m "feat: add CSV export functionality"

# 5. Répéter pour le prochain commit logique
```

### 2. **Feature Branch + Cherry-Pick** (Recommandé pour production)
Crée une branche de fonctionnalité, puis utilise `git cherry-pick` pour déployer uniquement les commits nécessaires.

```bash
# Sur ta branche de fonctionnalité
git checkout feature/exports-formulaire
# Fais tes commits logiques

# Pour déployer en production
git checkout main
git cherry-pick <hash-du-commit-production>
git push origin main
```

**Avantages :**
- Contrôle exact des commits déployés
- Évite de déployer du code non-testé
- Historique propre en production

**Workflow production :**
```bash
# 1. Identifier les commits à déployer
git log --oneline -10 feature/exports-formulaire

# 2. Cherry-pick sélectif
git checkout main
git cherry-pick abc123  # Export CSV
git cherry-pick def456  # Fix bug critique

# 3. Push production
git push origin main
```

### 3. **Branches séparées par environnement** (Alternative)
Maintiens des branches `staging` et `production` séparées.

```bash
# Déploie d'abord en staging
git checkout staging
git merge feature/nouvelle-fonction
git push origin staging

# Test, puis déploie en production
git checkout production  
git cherry-pick <hash-specific>
git push origin production
```

## 🔄 Workflow Recommandé pour DooDates

### Phase développement :
1. **Branche de fonctionnalité** : `git checkout -b feature/exports-formulaire`
2. **Commits atomiques** avec `git add -p` :
   - Un commit = une fonctionnalité logique
   - Messages clairs : "feat: add CSV export for forms"
3. **Push régulier** : `git push origin feature/exports-formulaire`

### Phase déploiement production :
1. **Sélection des commits** : Identifie les hashes à déployer
2. **Cherry-pick sélectif** :
   ```bash
   git checkout main
   git cherry-pick abc123  # Export CSV
   git cherry-pick def456  # Fix bug critique
   ```
3. **Push production** : `git push origin main`

## 🛠️ Commandes Utiles

```bash
# Voir les commits récents avec hashes
git log --oneline -10

# Voir les changements d'un commit
git show <hash>

# Annuler un cherry-pick
git reset --hard HEAD~1

# Mode interactif rapide
git add -p  # Sélectionne hunk par hunk

# Voir les changements non stagés
git diff

# Voir les changements stagés
git diff --cached
```

## ⚠️ À Éviter

- ❌ Un gros commit avec tout mélangé
- ❌ Déployer toute une branche sans vérification
- ❌ `git merge` direct en production (trop risqué)

## 📝 Exemples Concrets

### Scénario 1: Développement d'une nouvelle fonctionnalité
```bash
# Créer la branche
git checkout -b feature/conditional-questions

# Travailler sur plusieurs fichiers
# - src/components/ConditionalRuleEditor.tsx
# - src/lib/conditionalValidator.ts
# - src/lib/conditionalEvaluator.ts

# Séparer les commits logiquement
git add -p
# Sélectionner uniquement les fichiers de validation
git commit -m "feat: add conditional rules validation"

git add -p
# Sélectionner uniquement les fichiers d'évaluation
git commit -m "feat: add conditional rules evaluator"

git add -p
# Sélectionner uniquement l'interface
git commit -m "feat: add conditional rules UI"

# Push
git push origin feature/conditional-questions
```

### Scénario 2: Déploiement sélectif en production
```bash
# Sur la branche feature
git log --oneline -5
# abc123 feat: add conditional rules validation
# def456 feat: add conditional rules evaluator
# ghi789 feat: add conditional rules UI
# jkl012 fix: resolve timezone bug
# mno345 refactor: cleanup dead code

# Déployer uniquement le fix critique en production
git checkout main
git cherry-pick jkl012
git push origin main

# Plus tard, déployer la fonctionnalité complète
git checkout main
git cherry-pick abc123 def456 ghi789
git push origin main
```

## 🎯 Bonnes Pratiques

1. **Commits atomiques** : Un commit = une idée logique
2. **Messages clairs** : Utiliser les conventions (feat:, fix:, docs:, etc.)
3. **Tests unitaires** : Commiter les tests avec le code correspondant
4. **Revue avant merge** : Vérifier chaque commit avant de merger
5. **Backup** : Toujours pousser les branches distantes avant les manipulations

## 🔄 Alternatives

### Git Stash (pour changements temporaires)
```bash
# Stasher les changements en cours
git stash push -m "work in progress"

# Changer de branche, faire autre chose
git checkout main
git cherry-pick <hash>

# Revenir et restaurer
git checkout feature/branch
git stash pop
```

### Git Reset (pour réorganiser les commits)
```bash
# Réorganiser les 3 derniers commits
git rebase -i HEAD~3

# Options: pick, reword, edit, squash, fixup, drop
```

---

**Note :** Ce guide est spécifiquement adapté pour le workflow de DooDates où la séparation entre développement et déploiement production est cruciale.

*Créé le 28/11/2025*
