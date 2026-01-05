# 🚀 Déploiement GitHub Pages

## Configuration initiale (à faire une seule fois)

### 1. Activer GitHub Pages

1. Aller sur https://github.com/julienfritschheydon/DooDates/settings/pages
2. Dans **Source**, sélectionner : `GitHub Actions`
3. Sauvegarder

### 2. Ajouter les secrets

1. Aller sur https://github.com/julienfritschheydon/DooDates/settings/secrets/actions
2. Ajouter les secrets suivants :
   - `VITE_SUPABASE_URL` : URL Supabase (ou laisser vide si mode local)
   - `VITE_SUPABASE_ANON_KEY` : Clé Supabase (ou laisser vide si mode local)
   - `[DEPRECATED_KEY]` : Clé API Gemini

**Note** : Si tu veux tester en mode 100% local (localStorage), tu peux laisser les secrets vides.

## Déploiement automatique

### Push sur la branche

```bash
# Depuis la branche feature/ai-first-ux-prototype
git add .
git commit -m "feat: responsive mobile layout"
git push origin feature/ai-first-ux-prototype
```

Le workflow se déclenche automatiquement et déploie sur :
**https://julienfritschheydon.github.io/DooDates/**

### Déploiement manuel

1. Aller sur https://github.com/julienfritschheydon/DooDates/actions
2. Sélectionner "Deploy to GitHub Pages"
3. Cliquer sur "Run workflow"
4. Choisir la branche `feature/ai-first-ux-prototype`
5. Cliquer sur "Run workflow"

## Tester sur mobile

### Option 1 : Scanner le QR Code

1. Aller sur https://julienfritschheydon.github.io/DooDates/
2. Utiliser un générateur de QR code : https://www.qr-code-generator.com/
3. Scanner avec ton téléphone

### Option 2 : Lien direct

Envoyer le lien par SMS/WhatsApp :

```
https://julienfritschheydon.github.io/DooDates/
```

### Option 3 : Raccourci

Créer un raccourci sur l'écran d'accueil :

1. Ouvrir le lien sur mobile
2. Menu navigateur → "Ajouter à l'écran d'accueil"
3. L'app s'ouvre comme une app native !

## Vérifier le déploiement

### Statut du workflow

https://github.com/julienfritschheydon/DooDates/actions

- ✅ Vert = Déployé avec succès
- ❌ Rouge = Erreur (voir les logs)
- 🟡 Jaune = En cours

### Logs en cas d'erreur

1. Cliquer sur le workflow en erreur
2. Cliquer sur "build" ou "deploy"
3. Lire les logs pour identifier le problème

## Désactiver le déploiement

Si tu veux arrêter les déploiements automatiques :

1. Renommer le fichier :

   ```bash
   mv .github/workflows/deploy-github-pages.yml .github/workflows/deploy-github-pages.yml.disabled
   ```

2. Ou supprimer le fichier :
   ```bash
   rm .github/workflows/deploy-github-pages.yml
   ```

## Troubleshooting

### Le site ne charge pas

- Vérifier que GitHub Pages est activé dans les settings
- Attendre 2-3 minutes après le premier déploiement
- Vider le cache du navigateur (Ctrl+Shift+R)

### Erreur 404 sur les routes

- Vérifier que `base: '/DooDates/'` est bien dans `vite.config.ts`
- Le routing React fonctionne uniquement sur la page d'accueil
- Utiliser HashRouter si problème persiste

### Les secrets ne fonctionnent pas

- Vérifier que les secrets sont bien ajoutés dans GitHub
- Les noms doivent correspondre exactement (sensible à la casse)
- Redéployer après ajout des secrets

## Mode développement local

Pour tester en local avec le même base path :

```bash
NODE_ENV=production npm run dev
```

Ou modifier temporairement `vite.config.ts` :

```typescript
base: '/DooDates/',  // Au lieu de la condition
```

## URLs importantes

- **App déployée** : https://julienfritschheydon.github.io/DooDates/
- **Repository** : https://github.com/julienfritschheydon/DooDates
- **Actions** : https://github.com/julienfritschheydon/DooDates/actions
- **Settings Pages** : https://github.com/julienfritschheydon/DooDates/settings/pages
- **Secrets** : https://github.com/julienfritschheydon/DooDates/settings/secrets/actions
