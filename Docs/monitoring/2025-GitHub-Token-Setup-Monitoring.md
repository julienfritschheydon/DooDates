# 🔑 Configuration du Token GitHub pour le Monitoring

## Étape 1 : Créer un Personal Access Token (PAT)

1. Allez sur GitHub → **Settings** (votre profil)
2. Dans le menu de gauche : **Developer settings**
3. Cliquez sur **Personal access tokens** → **Tokens (classic)**
4. Cliquez sur **Generate new token** → **Generate new token (classic)**
5. Configurez le token :
   - **Note** : `Monitoring Workflows - DooDates`
   - **Expiration** : 90 jours (ou selon vos préférences)
   - **Scopes** : Cochez ces permissions :
     - ✅ `repo` (accès complet aux repositories - **inclut les issues automatiquement**)
     - ✅ `workflow` (lire et écrire les workflows)
     - ⚠️ Note : Le scope `repo` inclut déjà les permissions pour créer/modifier les issues, pas besoin d'un scope séparé
6. Cliquez sur **Generate token**
7. **⚠️ IMPORTANT** : Copiez le token immédiatement (il ne sera plus visible après)

## Étape 2 : Utiliser le Token Localement

### Windows PowerShell

```powershell
# Définir les variables d'environnement pour cette session
$env:GITHUB_TOKEN="ghp_votre_token_ici"
$env:GITHUB_REPOSITORY="votre_org/DooDates"

# Exécuter le script
node scripts/monitor-workflow-failures.js
```

### Windows CMD

```cmd
set GITHUB_TOKEN=ghp_votre_token_ici
set GITHUB_REPOSITORY=votre_org/DooDates
node scripts/monitor-workflow-failures.js
```

### Linux/Mac

```bash
export GITHUB_TOKEN="ghp_votre_token_ici"
export GITHUB_REPOSITORY="votre_org/DooDates"
node scripts/monitor-workflow-failures.js
```

## Étape 3 : Vérifier les Résultats

Après l'exécution, vérifiez :

1. **Le rapport** : `Docs/monitoring/workflow-failures-report.md`
   - Devrait contenir les vraies données des workflows
   - Devrait lister les échecs récents s'il y en a

2. **Le statut JSON** : `Docs/monitoring/workflow-status.json`
   - `hasFailures: true` si des échecs sont détectés
   - `totalFailures24h` devrait refléter les vrais échecs

3. **Issue GitHub** (si échecs détectés)
   - Une issue avec le label `ci-health` devrait être créée/mise à jour
   - Vérifiez dans GitHub → Issues

## 🔒 Sécurité

⚠️ **Ne commitez JAMAIS le token dans le code !**

- Le token est utilisé uniquement en variable d'environnement
- Pour GitHub Actions, utilisez les Secrets du repository
- Le workflow GitHub Actions utilise automatiquement `GITHUB_TOKEN` (pas besoin de configurer)

## Alternative : Utiliser GitHub Actions (Recommandé)

Si vous ne voulez pas créer de token local, vous pouvez simplement :

1. Aller sur GitHub → Actions
2. Sélectionner le workflow "8️⃣ Workflow Monitoring & Health Report"
3. Cliquer sur "Run workflow"

Le workflow a déjà accès au token automatiquement via `secrets.GITHUB_TOKEN`.
