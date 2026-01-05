# 🚀 Fixes pour le déploiement GitHub Pages

## Problèmes identifiés et résolus (03 Nov 2025)

### ❌ **Problème 1 : Page 404 sur toutes les routes**

**Cause :** React Router `BrowserRouter` n'avait pas le `basename` configuré pour GitHub Pages.

**Solution :**

```tsx
// src/App.tsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

`import.meta.env.BASE_URL` = `/DooDates/` en production (défini dans `vite.config.ts`)

---

### ❌ **Problème 2 : Service Worker cache errors**

**Cause :** Les chemins dans `public/sw.js` pointaient vers `/` au lieu de `/DooDates/`.

**Solution :**

```javascript
// public/sw.js
const BASE_PATH = self.location.pathname.includes("/DooDates") ? "/DooDates" : "";
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  // ...
];
```

---

### ✅ **Vérifications effectuées**

- [x] `vite.config.ts` : `base: '/DooDates/'` en production
- [x] `.github/workflows/deploy-github-pages.yml` : Crée `404.html` pour SPA routing
- [x] `BrowserRouter` : Utilise `import.meta.env.BASE_URL` comme basename
- [x] `sw.js` : Chemins dynamiques selon l'environnement

---

## 🔍 Checklist de déploiement

### Avant le premier déploiement

- [ ] **GitHub Pages activé** : https://github.com/julienfritschheydon/DooDates/settings/pages
  - Source : `GitHub Actions`
- [ ] **Secrets configurés** : https://github.com/julienfritschheydon/DooDates/settings/secrets/actions
  - `[DEPRECATED_KEY]` : Clé API Gemini (requis)
  - `VITE_SUPABASE_URL` : URL Supabase (optionnel, localStorage si absent)
  - `VITE_SUPABASE_ANON_KEY` : Clé Supabase (optionnel)

- [ ] **Branche `main` protégée** : Merge uniquement après validation CI

---

### Après déploiement

1. **Vérifier le déploiement** : https://github.com/julienfritschheydon/DooDates/actions
   - Workflow `Deploy to GitHub Pages` doit être ✅ vert

2. **Tester l'URL** : https://julienfritschheydon.github.io/DooDates/
   - Page d'accueil charge correctement
   - Navigation fonctionne (pas de 404)
   - Console Chrome : Pas d'erreurs critiques

3. **Tester les fonctionnalités** :
   - [ ] Créer un sondage (calendrier, texte, formulaire)
   - [ ] Voter sur un sondage
   - [ ] Voir les résultats
   - [ ] Mode localStorage (si pas de Supabase)

4. **Vérifier le PWA** :
   - [ ] Service Worker enregistré (DevTools > Application > Service Workers)
   - [ ] Cache fonctionne (DevTools > Application > Cache Storage)
   - [ ] Installable (bouton "Installer" dans la barre d'adresse)

---

## 🐛 Troubleshooting

### Page 404 sur les routes

**Symptômes :**

- Page d'accueil charge
- Autres routes (e.g. `/poll/abc`) donnent 404

**Solutions :**

1. Vérifier que `404.html` est présent dans `dist/` après build
2. Vérifier que `basename` est configuré dans `BrowserRouter`
3. Hard refresh : `Ctrl+Shift+R` (vider le cache)

### Service Worker errors dans la console

**Symptômes :**

```
Uncaught (in promise) TypeError: Failed to execute 'addAll' on 'cache'
```

**Solutions :**

1. Vider le cache du Service Worker :
   - DevTools > Application > Storage > Clear site data
2. Désinstaller le Service Worker :
   - DevTools > Application > Service Workers > Unregister
3. Hard refresh

### API Gemini ne fonctionne pas

**Symptômes :**

- Impossible de générer des sondages avec l'IA
- Erreur 401 ou 403

**Solutions :**

1. Vérifier que `[DEPRECATED_KEY]` est dans les secrets GitHub
2. Re-déployer après avoir ajouté le secret
3. Vérifier la console : `import.meta.env.[DEPRECATED_KEY]` ne doit pas être `undefined`

### Mode localStorage vs Supabase

**Par défaut :** L'app fonctionne en mode localStorage (pas besoin de Supabase).

**Pour activer Supabase :**

1. Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les secrets
2. Re-déployer
3. Vérifier `src/lib/supabase.ts` : `supabaseUrl` ne doit pas être vide

---

## 📝 Commandes utiles

### Build local pour tester GitHub Pages

```bash
# Build avec le même base path que production
NODE_ENV=production npm run build

# Tester avec un serveur local
npx serve dist -s -p 8080

# Ouvrir : http://localhost:8080/DooDates/
```

### Déploiement manuel

```bash
# Via GitHub Actions (recommandé)
# → Aller sur Actions > Deploy to GitHub Pages > Run workflow

# Ou via commit sur main (automatique)
git checkout main
git merge develop
git push origin main
```

---

## 🎯 URLs importantes

- **App live** : https://julienfritschheydon.github.io/DooDates/
- **Repository** : https://github.com/julienfritschheydon/DooDates
- **Actions** : https://github.com/julienfritschheydon/DooDates/actions
- **Settings Pages** : https://github.com/julienfritschheydon/DooDates/settings/pages
- **Secrets** : https://github.com/julienfritschheydon/DooDates/settings/secrets/actions

---

## ✅ Statut des fixes (03 Nov 2025)

- ✅ `BrowserRouter basename` configuré
- ✅ Service Worker paths corrigés
- ✅ Workflow deploy crée `404.html`
- ✅ Vite config avec `base: '/DooDates/'`
- ⏳ En attente : Test sur https://julienfritschheydon.github.io/DooDates/

**Prochaine étape :** Commit, push, et vérifier le déploiement ! 🚀
