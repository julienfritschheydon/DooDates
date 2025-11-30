# 🚀 Optimisations CI/CD - Temps de Commit & Push

## 📊 Analyse actuelle

**Workflow `2-develop-automerge.yml` :**
- 6 jobs qui installent chacun `npm ci` séparément
- Répétition d'installation Playwright dans chaque job
- Temps estimé : 8-12 minutes pour un push simple

**Workflow `1-pr-validation.yml` :**
- 9 jobs avec installations répétées
- Temps estimé : 15-25 minutes pour une PR

## 🎯 Optimisations proposées

### 1. **Job de préparation partagé** (Gain: 30-40%)

**Problème :** Chaque job réinstalle `npm ci` et Playwright
**Solution :** Un job `prepare-deps` qui prépare tout et partage via artifacts

```yaml
prepare-deps:
  needs: changes
  if: needs.changes.outputs.code == 'true'
  runs-on: ubuntu-latest
  steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
    
    - name: 📦 Setup Node.js & Cache
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: 🔧 Install dependencies
      run: npm ci
    
    - name: 🧭 Install Playwright
      run: npx playwright install --with-deps chromium
    
    - name: 📤 Upload dependencies as artifact
      uses: actions/upload-artifact@v4
      with:
        name: node-modules-${{ github.run_id }}
        path: |
          node_modules
          ~/.npm
          ~/.cache/ms-playwright
        retention-days: 1
```

**Jobs modifiés :**
```yaml
tests-unit:
  needs: [changes, prepare-deps]
  steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
    
    - name: 📦 Download dependencies
      uses: actions/download-artifact@v4
      with:
        name: node-modules-${{ github.run_id }}
        path: |
          node_modules
          ~/.npm
          ~/.cache/ms-playwright
```

### 2. **Tests conditionnels plus intelligents** (Gain: 20-30%)

**Actuel :** Tests E2E si code source modifié
**Optimisé :** Skip E2E pour modifications "sûres"

```yaml
e2e-required:
  - 'src/**/!(*.test.ts|*.test.tsx|__tests__)'
  - 'src/**/*.tsx'
  - 'src/**/*.jsx'
  - 'src/**/!(*.test).ts'
  - 'package.json'
  - 'package-lock.json'
  - 'vite.config.ts'
  - 'playwright.config.ts'
  - 'tests/e2e/**'

# Ajout de patterns "safe" (skip E2E)
e2e-safe:
  - 'src/**/__tests__/**'
  - 'src/**/*.test.ts'
  - 'src/**/*.test.tsx'
  - 'vitest.config.ts'
  - 'docs/**'
  - '*.md'
```

### 3. **Parallélisation améliorée** (Gain: 15-20%)

**Actuel :** Jobs séquentiels partiels
**Optimisé :** Maximum de parallélisation

```yaml
# Jobs qui peuvent tourner en parallèle
- tests-unit
- tests-e2e (si requis)
- build-validation
- production-smoke-pre-merge

# Dépendances minimales
production-smoke-pre-merge:
  needs: [changes, tests-unit, build-validation]  # Pas besoin de E2E
```

### 4. **Cache multi-niveaux** (Gain: 10-15%)

```yaml
# Cache Node.js
- name: 🔧 Cache Node.js
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-v20-${{ hashFiles('package-lock.json') }}

# Cache Playwright
- name: 🎭 Cache Playwright
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-chromium-${{ hashFiles('package-lock.json') }}

# Cache Build
- name: 🏗️ Cache Build
  uses: actions/cache@v4
  with:
    path: |
      dist
      node_modules/.vite
    key: ${{ runner.os }}-vite-build-${{ hashFiles('src/**', 'vite.config.ts') }}
```

### 5. **Tests rapides optionnels** (Gain: 25-35%)

**Pour les pushes fréquents sur develop :**

```yaml
# Mode rapide (si commit message contient [fast])
fast-mode:
  if: contains(github.event.head_commit.message, '[fast]')
  steps:
    - name: ⚡ Tests rapides uniquement
      run: |
        npm run test:unit:fast
        npm run build
        # Skip E2E, skip tests UX régression
```

## 📈 Gains estimés

| Optimisation | Temps actuel | Temps optimisé | Gain |
|--------------|--------------|----------------|------|
| Dépendances partagées | 8-12 min | 5-8 min | 30-40% |
| Tests conditionnels | 8-12 min | 6-9 min | 20-30% |
| Parallélisation | 8-12 min | 6-10 min | 15-20% |
| Cache multi-niveaux | 8-12 min | 7-11 min | 10-15% |
| Mode rapide [fast] | 8-12 min | 3-4 min | 60-70% |

**Total combiné :** 8-12 min → 3-6 min (50-70% de gain)

## 🔧 Implémentation

### Phase 1 : Dépendances partagées (15 min)
1. Créer job `prepare-deps`
2. Modifier tous les jobs pour utiliser l'artifact
3. Tester sur develop

### Phase 2 : Tests conditionnels (10 min)
1. Affiner les filtres de changements
2. Ajouter patterns "safe"
3. Valider avec différents types de commits

### Phase 3 : Mode rapide (5 min)
1. Ajouter détection `[fast]` dans commit message
2. Créer workflow fast-mode
3. Documenter l'usage

## 📋 Commandes utiles

```bash
# Push normal (tous les tests)
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop

# Push rapide (tests minimum)
git commit -m "feat: petite correction [fast]"
git push origin develop

# Forcer mode rapide
git commit -m "fix: typo [fast][skip-e2e]"
git push origin develop
```

## ⚠️ Risques et mitigations

### Risque : Artifact trop volumineux
**Mitigation :** Compression et cleanup automatique
```yaml
- name: 🗑️ Cleanup avant upload
  run: |
    npm cache clean --force
    rm -rf node_modules/.cache
```

### Risque : Dépendances corrompues
**Mitigation :** Validation de l'artifact
```yaml
- name: ✅ Validation dépendances
  run: |
    npm ls --depth=0
    npx playwright --version
```

### Risque : Jobs trop dépendants
**Mitigation :** Fallback vers installation normale
```yaml
- name: 📦 Download dependencies
  uses: actions/download-artifact@v4
  continue-on-error: true
  
- name: 🔧 Fallback installation
  if: failure()
  run: npm ci
```

## 🎯 Résultats attendus

- **Push develop** : 8-12 min → 3-6 min
- **PR complète** : 15-25 min → 8-15 min  
- **Feedback développeur** : 2x plus rapide
- **CI/CD** : Plus fiable et prévisible

## 📊 Monitoring

Ajouter des métriques de temps :
```yaml
- name: ⏱️ Record job duration
  run: |
    echo "JOB_DURATION=$(date +%s)" >> $GITHUB_ENV
    # Envoyer vers métriques externes si besoin
```

---

**Prochaines étapes :**
1. Implémenter Phase 1 (dépendances partagées)
2. Mesurer les gains réels
3. Implémenter phases 2 et 3 si gains confirmés
