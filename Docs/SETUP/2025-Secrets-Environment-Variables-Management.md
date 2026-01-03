# Configuration des Secrets GitHub - DooDates

## 🔐 Secrets Requis pour les Workflows

### Production Deployment (Vercel)

Pour que le workflow de déploiement production fonctionne, ajoutez ces secrets dans GitHub :

**Settings → Secrets and variables → Actions → New repository secret**

```bash
# Secrets Vercel requis
VERCEL_TOKEN=your_vercel_token_here
ORG_ID=your_vercel_org_id_here
PROJECT_ID=your_vercel_project_id_here
TEAM_ID=your_vercel_team_id_here
```

### Comment obtenir ces valeurs :

1. **VERCEL_TOKEN** :
   - Aller sur Vercel Dashboard → Settings → Tokens
   - Créer un nouveau token avec scope "Full Access"

2. **ORG_ID & PROJECT_ID** :

   ```bash
   npx vercel link
   cat .vercel/project.json
   ```

3. **TEAM_ID** :
   - Disponible dans l'URL Vercel de votre équipe
   - Ou via `vercel teams list`

## ✅ Validation

Une fois les secrets configurés, les workflows GitHub Actions fonctionneront automatiquement :

- **PR Validation** : Tests automatiques sur chaque Pull Request
- **Production Deploy** : Déploiement automatique sur push vers `main`
- **Quality Gates** : Score IA > 95% requis pour production

## 🚨 Sécurité

- ❌ Ne jamais commiter ces valeurs dans le code
- ✅ Utiliser uniquement GitHub Secrets
- ✅ Accès limité aux collaborateurs autorisés
