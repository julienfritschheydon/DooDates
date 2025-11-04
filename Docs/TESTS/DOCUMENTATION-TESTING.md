# 📚 Guide de Test de la Documentation

Guide pour vérifier que la documentation fonctionne correctement en local, en CI et en production.

---

## 🎯 Vue d'Ensemble

La documentation est servie depuis `/docs` et doit fonctionner correctement avec le base path `/DooDates/` en production (GitHub Pages).

### Problèmes corrigés

1. ✅ **Fetch des fichiers Markdown** : Utilise maintenant `import.meta.env.BASE_URL` pour respecter le base path
2. ✅ **Tests E2E** : Tests créés pour vérifier le chargement de la documentation
3. ✅ **Scripts de test production** : Scripts pour tester localement avec le base path de production

---

## ✅ Tests en Local (Mode Dev)

### Test rapide

```bash
# Lancer les tests E2E de documentation
npm run test:docs
```

Cela va :
- Démarrer le serveur de dev (`npm run dev:e2e`)
- Exécuter les tests E2E de documentation
- Vérifier que la page se charge sans erreurs
- Vérifier qu'un document spécifique se charge
- Vérifier la gestion des erreurs 404

### Test manuel

1. Démarrer le serveur de dev :
   ```bash
   npm run dev
   ```

2. Ouvrir dans le navigateur :
   - http://localhost:8080/docs
   - http://localhost:8080/docs/01-Guide-Demarrage-Rapide

3. Ouvrir la console (F12) et vérifier qu'il n'y a **pas d'erreurs 404** pour :
   - Les fichiers JS (ex: `Docs-*.js`, `react-vendor-*.js`)
   - Les fichiers CSS
   - Les fichiers Markdown (`/docs/*.md`)

---

## 🏭 Tests en Mode Production (Simulation GitHub Pages)

### Script automatique (recommandé)

**Windows (PowerShell)** :
```powershell
.\scripts\test-docs-production.ps1
```

**Linux/Mac (Bash)** :
```bash
bash scripts/test-docs-production.sh
```

Le script va :
1. Build de production avec `NODE_ENV=production`
2. Démarrer un serveur local sur `http://localhost:4173/DooDates/`
3. Vous permettre de tester manuellement dans le navigateur
4. Arrêter le serveur automatiquement

### Test manuel étape par étape

1. **Build de production** :
   ```bash
   NODE_ENV=production npm run build
   ```

2. **Installer serve** (si nécessaire) :
   ```bash
   npm install -g serve
   ```

3. **Démarrer le serveur avec base path** :
   ```bash
   serve dist -s -p 4173 --listen
   ```

4. **Tester dans le navigateur** :
   - Ouvrir : http://localhost:4173/DooDates/docs
   - Ouvrir : http://localhost:4173/DooDates/docs/01-Guide-Demarrage-Rapide

5. **Vérifier la console (F12)** :
   - ✅ Pas d'erreurs 404 pour les fichiers JS/CSS
   - ✅ Les fichiers Markdown se chargent correctement
   - ✅ Pas d'erreurs "Failed to fetch dynamically imported module"

### Vérifications spécifiques

#### ✅ Vérifier les assets JS

Dans la console du navigateur, vérifier que les URLs des fichiers JS contiennent `/DooDates/` :

```
✅ CORRECT : https://julienfritschheydon.github.io/DooDates/assets/Docs-DZ9d-Fu6.js
✅ CORRECT : https://julienfritschheydon.github.io/DooDates/assets/react-vendor-CFNZWASi.js

❌ INCORRECT : https://julienfritschheydon.github.io/assets/Docs-DZ9d-Fu6.js
```

#### ✅ Vérifier les fetch Markdown

Dans l'onglet Network, vérifier que les requêtes vers les fichiers Markdown utilisent le bon path :

```
✅ CORRECT : GET /DooDates/docs/01-Guide-Demarrage-Rapide.md
❌ INCORRECT : GET /docs/01-Guide-Demarrage-Rapide.md
```

---

## 🚀 Tests en CI

Les tests E2E de documentation sont automatiquement exécutés dans les workflows GitHub Actions :

### Workflows qui testent la documentation

1. **PR Validation** (`1-pr-validation.yml`) :
   - Tests smoke incluant `docs.spec.ts` avec tag `@smoke`

2. **Post-Merge E2E** (`3-main-post-merge.yml`) :
   - Tests smoke incluant `docs.spec.ts` avec tag `@smoke`

### Vérifier les résultats CI

1. Aller sur : https://github.com/julienfritschheydon/DooDates/actions
2. Ouvrir le workflow "3️⃣ Main Post-Merge E2E"
3. Vérifier le job "🔥 E2E Smoke Tests"
4. Vérifier que les tests `docs.spec.ts` passent

---

## 🌐 Vérification en Production (GitHub Pages)

### Après déploiement

1. **Attendre le déploiement** :
   - Le workflow `4-main-deploy-pages.yml` se déclenche après les tests E2E
   - Durée : ~5-10 minutes

2. **Tester sur GitHub Pages** :
   - Ouvrir : https://julienfritschheydon.github.io/DooDates/docs
   - Ouvrir : https://julienfritschheydon.github.io/DooDates/docs/01-Guide-Demarrage-Rapide

3. **Vérifier la console (F12)** :
   - ✅ Pas d'erreurs 404
   - ✅ Pas d'erreurs "Failed to fetch dynamically imported module"
   - ✅ Les fichiers Markdown se chargent correctement

### Dépannage si problème

#### Erreur : `Failed to load resource: 404 (Docs-*.js)`

**Cause** : Le base path n'est pas correctement configuré dans le build.

**Solution** :
1. Vérifier que `vite.config.ts` a `base: '/DooDates/'` en production
2. Vérifier que le workflow de déploiement utilise `NODE_ENV=production`
3. Rebuild et redéployer

#### Erreur : `Failed to fetch /docs/*.md`

**Cause** : Le `DocsViewer` n'utilise pas le base path dans les fetch.

**Solution** : Vérifier que `src/components/docs/DocsViewer.tsx` utilise :
```typescript
const baseUrl = import.meta.env.BASE_URL || '/';
const response = await fetch(`${baseUrl}docs/${docPath}`);
```

---

## 📋 Checklist de Vérification

### Avant de merger en main

- [ ] Tests E2E locaux passent : `npm run test:docs`
- [ ] Test production local fonctionne : `npm run test:docs:production`
- [ ] Pas d'erreurs 404 dans la console du navigateur
- [ ] Les fichiers Markdown se chargent correctement

### Après déploiement

- [ ] La documentation est accessible sur GitHub Pages
- [ ] Pas d'erreurs 404 dans la console (F12)
- [ ] Les documents se chargent correctement
- [ ] Les liens internes fonctionnent

---

## 🔍 Tests E2E Disponibles

### `docs.spec.ts` (Mode Dev)

Tests qui s'exécutent en mode développement :

1. **Documentation page loads without errors @smoke**
   - Vérifie que la page `/docs` se charge
   - Vérifie qu'il n'y a pas d'erreurs console

2. **Documentation page loads a specific document @functional**
   - Vérifie qu'un document spécifique se charge
   - Vérifie que le contenu Markdown est rendu

3. **Documentation page handles 404 gracefully @functional**
   - Vérifie la gestion d'erreur pour documents inexistants

4. **Documentation assets load correctly @smoke**
   - Vérifie qu'il n'y a pas d'erreurs 404 pour les assets

### `docs-production.spec.ts` (Mode Production)

Test pour simuler l'environnement GitHub Pages (skippé par défaut) :

- À exécuter manuellement avec : `npx playwright test docs-production.spec.ts --project=chromium`
- Nécessite un serveur de production avec base path `/DooDates/`

---

## 📝 Notes Techniques

### Base Path Configuration

- **Development** : Base path = `/` (pas de préfixe)
- **Production** : Base path = `/DooDates/` (pour GitHub Pages)

Le base path est injecté automatiquement par Vite via `import.meta.env.BASE_URL`.

### Correction Appliquée

**Avant** :
```typescript
const response = await fetch(`/docs/${docPath}`);
```

**Après** :
```typescript
const baseUrl = import.meta.env.BASE_URL || '/';
const response = await fetch(`${baseUrl}docs/${docPath}`);
```

Cela garantit que les fetch utilisent le bon chemin, même avec le base path `/DooDates/` en production.

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs de la console du navigateur (F12)
2. Vérifier les logs du workflow CI
3. Tester localement avec le script de production
4. Vérifier que `vite.config.ts` et `DocsViewer.tsx` sont correctement configurés

