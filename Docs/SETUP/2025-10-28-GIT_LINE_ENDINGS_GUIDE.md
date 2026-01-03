# Guide - Gestion des fins de ligne Git

## 🎯 Problème

Git convertit automatiquement les fins de ligne (LF ↔ CRLF) ce qui crée des changements non désirés lors des commits.

**Symptômes :**

```
warning: in the working copy of 'file.ts', LF will be replaced by CRLF
```

## ✅ Solutions mises en place

### 1. `.gitattributes` (PRINCIPAL)

Fichier créé à la racine du projet qui force LF pour tous les fichiers texte :

```gitattributes
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.json text eol=lf
*.md text eol=lf
```

**Effet :**

- ✅ Tous les fichiers texte utilisent LF (Unix) dans le repo
- ✅ Git convertit automatiquement en CRLF sur Windows si nécessaire
- ✅ Pas de changements intempestifs lors des commits

### 2. `.prettierrc.json`

Configuration Prettier pour respecter LF :

```json
{
  "endOfLine": "lf"
}
```

**Effet :**

- ✅ Prettier ne change pas les fins de ligne
- ✅ Cohérence avec `.gitattributes`

### 3. Pre-commit hook optionnel

Le formatage automatique peut être désactivé :

```bash
NO_FORMAT=1 git commit -m "message"
```

**Effet :**

- ✅ Pas de formatage automatique
- ✅ Pas de changements de fins de ligne
- ✅ Utile pour les commits rapides

## 🔧 Configuration Git locale (optionnel)

Si tu veux que Git ne touche JAMAIS aux fins de ligne :

```bash
# Désactiver la conversion automatique
git config core.autocrlf false

# Vérifier la config
git config --get core.autocrlf
```

⚠️ **Attention :** Avec `autocrlf=false`, tu dois gérer manuellement les fins de ligne.

## 📋 Workflow recommandé

### Commit normal (avec formatage)

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
```

### Commit sans formatage

```bash
git add .
NO_FORMAT=1 git commit -m "wip: travail en cours"
```

### Commit rapide (mode fast)

```bash
git add .
FAST_HOOKS=1 git commit -m "fix: correction rapide"
```

## 🔍 Vérifier les fins de ligne d'un fichier

### Windows (PowerShell)

```powershell
# Afficher les fins de ligne
Get-Content file.ts -Raw | Format-Hex | Select-String "0D 0A|0A"

# 0D 0A = CRLF (Windows)
# 0A = LF (Unix)
```

### Unix/Mac

```bash
file file.ts
# Affiche: "ASCII text" (LF) ou "ASCII text, with CRLF line terminators"
```

## 🛠️ Corriger les fins de ligne existantes

Si tu as déjà des fichiers avec de mauvaises fins de ligne :

```bash
# 1. Normaliser tous les fichiers
git add --renormalize .

# 2. Commit les changements
git commit -m "chore: normaliser fins de ligne"

# 3. Vérifier
git status
```

## 📊 Résumé des fichiers de config

| Fichier             | Rôle                  | Priorité |
| ------------------- | --------------------- | -------- |
| `.gitattributes`    | Force LF dans le repo | ⭐⭐⭐   |
| `.prettierrc.json`  | Prettier respecte LF  | ⭐⭐     |
| `.husky/pre-commit` | Formatage optionnel   | ⭐       |

## ❓ FAQ

### Pourquoi LF et pas CRLF ?

- ✅ Standard Unix/Linux (serveurs, CI/CD)
- ✅ Plus compact (1 byte vs 2)
- ✅ Meilleure compatibilité cross-platform
- ✅ Git gère la conversion automatiquement sur Windows

### Ça va casser mon éditeur Windows ?

Non ! Les éditeurs modernes (VS Code, WebStorm, etc.) gèrent LF sans problème.

### Et si je travaille avec quelqu'un sur Mac/Linux ?

C'est justement l'intérêt ! Avec `.gitattributes`, tout le monde a les mêmes fins de ligne dans le repo.

### Les warnings vont disparaître ?

Oui, après avoir normalisé les fichiers existants avec `git add --renormalize .`

## 🚀 Actions à faire maintenant

1. ✅ `.gitattributes` créé
2. ✅ `.prettierrc.json` créé
3. ✅ Pre-commit hook mis à jour
4. ⏳ **À faire :** Normaliser les fichiers existants

```bash
# Normaliser tous les fichiers
git add --renormalize .
git commit -m "chore: normaliser fins de ligne (LF)"
```

---

**Dernière mise à jour :** 29/10/2025
