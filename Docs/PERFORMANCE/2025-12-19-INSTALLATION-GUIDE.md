# Guide d'Installation - Système de Monitoring des Performances

Ce guide vous accompagne pas à pas pour activer le système de monitoring des performances de DooDates.

## 📋 Prérequis

- Accès au dashboard Supabase du projet
- Accès aux secrets GitHub du repository
- Node.js 20+ installé localement (pour les tests)

## 🚀 Installation en 4 Étapes

### Étape 1: Appliquer les Migrations SQL à Supabase

#### Option A: Via le Dashboard Supabase (Recommandé)

1. **Connectez-vous à Supabase**
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet DooDates

2. **Ouvrez le SQL Editor**
   - Dans le menu latéral, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Copiez et exécutez le script de migration**
   - Ouvrez le fichier `scripts/apply-performance-migrations.sql`
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL
   - Cliquez sur "Run" (ou Ctrl+Enter)

4. **Vérifiez la création des tables**
   - Vous devriez voir un message de succès
   - Les requêtes de vérification afficheront les tables créées:
     - `web_vitals` (métriques utilisateurs)
     - `performance_metrics` (métriques workflows)
     - `performance_alerts` (alertes de régression)

#### Option B: Via Supabase CLI

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref <votre-project-ref>

# Appliquer les migrations
supabase db push
```

### Étape 2: Configurer les Secrets GitHub

1. **Allez dans les Settings du repository**
   - `https://github.com/<votre-org>/DooDates-testing/settings/secrets/actions`

2. **Ajoutez le secret `SUPABASE_SERVICE_KEY`**
   - Cliquez sur "New repository secret"
   - Name: `SUPABASE_SERVICE_KEY`
   - Value: Votre clé de service Supabase
   
   **Comment obtenir la clé de service:**
   - Dashboard Supabase → Settings → API
   - Section "Project API keys"
   - Copiez la clé "service_role" (⚠️ Ne JAMAIS exposer publiquement)

3. **Vérifiez les secrets existants**
   - `VITE_SUPABASE_URL` ✓ (devrait déjà exister)
   - `VITE_SUPABASE_ANON_KEY` ✓ (devrait déjà exister)
   - `SUPABASE_SERVICE_KEY` ✓ (nouveau, ajouté à l'étape 2)

### Étape 3: Tester Localement

#### 3.1 Tester l'envoi de métriques Lighthouse

```bash
# Créer un rapport Lighthouse de test
npm run build
npm run preview &
sleep 5

# Exécuter Lighthouse
npx @lhci/cli autorun --config=./lighthouserc.json

# Trouver le rapport généré
REPORT=$(find .lighthouseci -name "lhr-*.json" | head -1)

# Envoyer à Supabase (en local, utilisez vos vraies clés)
export VITE_SUPABASE_URL="https://votre-projet.supabase.co"
export SUPABASE_SERVICE_KEY="votre-service-key"
export GITHUB_RUN_ID="test-local-$(date +%s)"
export GITHUB_SHA="$(git rev-parse HEAD)"
export GITHUB_REF="refs/heads/$(git branch --show-current)"

node scripts/send-performance-metrics.js --source lighthouse --file "$REPORT"
```

#### 3.2 Tester l'envoi de métriques E2E

```bash
# Utiliser l'exemple de métriques E2E
node scripts/send-performance-metrics.js \
  --source e2e \
  --file e2e-metrics-example.json
```

#### 3.3 Vérifier dans Supabase

1. Allez dans Table Editor → `performance_metrics`
2. Vous devriez voir vos métriques de test
3. Vérifiez que les données sont correctes

### Étape 4: Activer dans les Workflows

Les workflows ont déjà été configurés ! Vérifiez que tout fonctionne :

#### 4.1 Workflow Lighthouse (Automatique)

Le workflow `.github/workflows/lighthouse.yml` :
- S'exécute tous les jours à 3h UTC
- Peut être déclenché manuellement
- Envoie automatiquement les métriques à Supabase

**Test manuel:**
```bash
# Via GitHub UI
Actions → Lighthouse CI (Scheduled) → Run workflow
```

#### 4.2 Workflow E2E (À configurer)

Pour les tests E2E, ajoutez à votre workflow de tests :

```yaml
# Dans .github/workflows/7-nightly-regression.yml (ou autre)
- name: 📊 Extract and send E2E metrics
  if: always()
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
  run: |
    # Extraire les métriques des résultats Playwright
    node scripts/extract-e2e-metrics.js \
      --input test-results/results.json \
      --output e2e-metrics.json
    
    # Envoyer à Supabase
    if [ -f e2e-metrics.json ]; then
      node scripts/send-performance-metrics.js \
        --source e2e \
        --file e2e-metrics.json
    fi
```

## ✅ Vérification de l'Installation

### 1. Vérifier les Tables Supabase

```sql
-- Dans SQL Editor Supabase
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('web_vitals', 'performance_metrics', 'performance_alerts')
ORDER BY table_name;
```

Résultat attendu:
```
table_name            | columns
----------------------|--------
performance_alerts    | 12
performance_metrics   | 9
web_vitals           | 9
```

### 2. Vérifier le Dashboard de Performance

1. Lancez l'application en local:
   ```bash
   npm run dev
   ```

2. Naviguez vers: `http://localhost:8080/DooDates/performance`

3. Vous devriez voir:
   - ✅ Section "Aucune alerte active" (si pas de régression)
   - ✅ "Dashboard Performance" avec métriques
   - ✅ "Tests E2E - Métriques Actuelles"
   - ✅ "Lighthouse CI - Métriques Actuelles"
   - ✅ "Évolution sur 7 jours"

### 3. Vérifier le Tracking Web Vitals

1. Ouvrez la console du navigateur
2. Vous devriez voir des logs: `Web Vitals: {cls: ..., lcp: ..., ...}`
3. En production, ces métriques seront envoyées à Supabase

### 4. Tester une Alerte de Régression

Pour tester le système d'alertes, créez une régression artificielle:

```bash
# Modifier temporairement la baseline
# Dans public/performance-baseline.json, réduisez les valeurs de 50%

# Envoyer des métriques normales
node scripts/send-performance-metrics.js \
  --source e2e \
  --file e2e-metrics-example.json

# Vérifier dans Supabase
# Table: performance_alerts
# Vous devriez voir des alertes créées
```

## 🔧 Dépannage

### Problème: "Failed to store performance metrics"

**Solution:**
1. Vérifiez que `SUPABASE_SERVICE_KEY` est correct
2. Vérifiez les RLS policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'performance_metrics';
   ```
3. Vérifiez que la policy "Allow workflow metrics inserts" existe

### Problème: "Cannot find module 'web-vitals'"

**Solution:**
```bash
npm install web-vitals@^5.1.0
```

### Problème: Dashboard affiche "Aucune donnée de performance disponible"

**Solution:**
1. Vérifiez que `public/performance-baseline.json` existe
2. Vérifiez le chemin dans `PerformanceDashboard.tsx`:
   ```typescript
   const baselineResponse = await fetch('/DooDates/performance-baseline.json');
   ```
3. Rechargez la page avec Ctrl+Shift+R (hard refresh)

### Problème: Lighthouse report not found

**Solution:**
```bash
# Vérifier que lighthouserc.json est configuré
cat lighthouserc.json

# Vérifier que le dossier .lighthouseci existe après l'exécution
ls -la .lighthouseci/
```

## 📊 Utilisation Quotidienne

### Consulter les Métriques

1. **Dashboard Web:** `/performance`
   - Vue d'ensemble des métriques actuelles
   - Alertes actives
   - Historique 7 jours

2. **Supabase Dashboard:**
   - Table Editor → `performance_metrics` (toutes les métriques)
   - Table Editor → `performance_alerts` (alertes)
   - Table Editor → `web_vitals` (métriques utilisateurs)

### Résoudre une Alerte

1. Allez sur `/performance`
2. Cliquez sur ✕ à côté de l'alerte
3. L'alerte est marquée comme résolue

### Exporter les Données

```sql
-- Exporter les métriques des 30 derniers jours
COPY (
  SELECT * FROM performance_metrics 
  WHERE timestamp > NOW() - INTERVAL '30 days'
  ORDER BY timestamp DESC
) TO '/tmp/performance-metrics.csv' WITH CSV HEADER;
```

## 🎯 Prochaines Étapes

Après l'installation, vous pouvez :

1. **Personnaliser les seuils** dans `performance-baseline.json`
2. **Ajouter des notifications** (email/Slack) pour les alertes critiques
3. **Créer des graphiques** avec une bibliothèque de visualisation
4. **Monitorer en temps réel** avec Supabase Realtime

## 📚 Ressources

- [Documentation complète](./MONITORING-SYSTEM.md)
- [Architecture du système](./README.md)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)

## 🆘 Support

En cas de problème:
1. Consultez la section Dépannage ci-dessus
2. Vérifiez les logs des workflows GitHub Actions
3. Consultez les logs de la console navigateur
4. Ouvrez une issue sur GitHub avec les détails

---

✅ **Installation terminée !** Le système de monitoring est maintenant actif.

