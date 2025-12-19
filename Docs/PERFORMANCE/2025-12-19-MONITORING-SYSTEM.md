# Système de Monitoring des Performances

## Vue d'ensemble

Le système de monitoring des performances de DooDates collecte, analyse et alerte sur les métriques de performance provenant de trois sources :

1. **Lighthouse CI** - Métriques de performance web (scores, Core Web Vitals)
2. **Tests E2E** - Temps de chargement des dashboards et interactions
3. **Web Vitals** - Métriques réelles des utilisateurs en production

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                  │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ Lighthouse CI│              │  E2E Tests   │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                             │                     │
│         └─────────────┬───────────────┘                     │
│                       │                                     │
│              send-performance-metrics.js                    │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ performance_metrics  │  │ performance_alerts   │        │
│  │  - timestamp         │  │  - metric_name       │        │
│  │  - source            │  │  - regression_%      │        │
│  │  - metrics (JSONB)   │  │  - severity          │        │
│  │  - workflow_run_id   │  │  - resolved          │        │
│  └──────────────────────┘  └──────────────────────┘        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend Performance Dashboard                  │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ PerformanceDashboard │  │  PerformanceAlerts   │        │
│  │  - Métriques actuelles│  │  - Alertes actives   │        │
│  │  - Historique 7 jours │  │  - Résolution        │        │
│  │  - Comparaison baseline│  │  - Notifications    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Composants

### 1. Migrations SQL

**Fichiers:**
- `supabase/migrations/20251219_create_web_vitals.sql` - Table pour Web Vitals
- `supabase/migrations/20251219_create_performance_tables.sql` - Tables pour métriques et alertes

**Tables créées:**
- `web_vitals` - Métriques Web Vitals des utilisateurs
- `performance_metrics` - Métriques des workflows CI/CD
- `performance_alerts` - Alertes de régression

### 2. Collecte des Métriques

**Web Vitals Tracker** (`src/lib/web-vitals-tracker.ts`)
- Collecte automatique des Core Web Vitals en production
- Envoi à Supabase avec session ID
- Support: CLS, FID, FCP, LCP, TTFB, INP

**Performance Collector** (`src/services/performance-collector.ts`)
- Collecte des métriques depuis les workflows
- Détection automatique des régressions
- Génération d'alertes (warning/critical)

**Script GitHub Actions** (`scripts/send-performance-metrics.js`)
- Envoi des métriques Lighthouse et E2E à Supabase
- Transformation des données au format standard
- Logging détaillé pour debugging

### 3. Dashboard de Performance

**PerformanceDashboard** (`src/components/performance/PerformanceDashboard.tsx`)
- Affichage des métriques actuelles
- Comparaison avec la baseline
- Indicateurs visuels (✓ / ⚠️)
- Historique sur 7 jours

**PerformanceAlerts** (`src/components/performance/PerformanceAlerts.tsx`)
- Affichage des alertes actives
- Résolution manuelle des alertes
- Sévérité (warning/critical)
- Détails de régression

### 4. Baseline de Performance

**Fichier:** `performance-baseline.json`

Contient les valeurs de référence pour :
- **Lighthouse CI:** Performance Score, LCP, CLS, TBT, FID
- **E2E:** Dashboard load times, menu interactions

## Seuils de Régression

### Avertissement (Warning)
- Régression ≥ 20% par rapport à la baseline
- Notification dans le dashboard
- Badge jaune

### Critique (Critical)
- Régression ≥ 50% par rapport à la baseline
- Notification prioritaire
- Badge rouge

## Utilisation

### 1. Appliquer les Migrations SQL

```bash
# Connectez-vous à Supabase
supabase login

# Appliquez les migrations
supabase db push
```

Ou manuellement via le dashboard Supabase :
1. Aller dans SQL Editor
2. Copier le contenu des fichiers de migration
3. Exécuter les requêtes

### 2. Configurer les Workflows GitHub

Ajoutez à vos workflows existants :

```yaml
# .github/workflows/lighthouse-ci.yml
- name: Send Lighthouse metrics to Supabase
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
  run: |
    node scripts/send-performance-metrics.js \
      --source lighthouse \
      --file lighthouse-report.json

# .github/workflows/e2e-tests.yml
- name: Send E2E metrics to Supabase
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
  run: |
    node scripts/send-performance-metrics.js \
      --source e2e \
      --file e2e-metrics.json
```

### 3. Accéder au Dashboard

Naviguez vers `/performance` dans l'application pour voir :
- Métriques actuelles
- Alertes actives
- Historique des performances

## Métriques Trackées

### Lighthouse CI
- **Performance Score** (0-100) - Score global de performance
- **LCP** (Largest Contentful Paint) - Temps de chargement du contenu principal
- **CLS** (Cumulative Layout Shift) - Stabilité visuelle
- **TBT** (Total Blocking Time) - Temps de blocage du thread principal
- **FID** (First Input Delay) - Réactivité à la première interaction
- **FCP** (First Contentful Paint) - Premier rendu de contenu

### Tests E2E
- **Dashboard 50 conv.** - Temps de chargement avec 50 conversations
- **Dashboard 200 conv.** - Temps de chargement avec 200 conversations
- **Menu Tags** - Temps d'ouverture du menu tags
- **Menu Dossiers** - Temps d'ouverture du menu dossiers
- **Dashboards produits** - Temps de chargement par type de sondage

### Web Vitals (Production)
- Métriques réelles des utilisateurs
- Agrégation par page et session
- Détection des problèmes en production

## Maintenance

### Mettre à Jour la Baseline

Lorsque les performances s'améliorent de façon stable :

```bash
# Mettre à jour performance-baseline.json avec les nouvelles valeurs
# Copier dans public/
cp performance-baseline.json public/
```

### Résoudre les Alertes

1. Aller sur `/performance`
2. Cliquer sur l'icône ✕ sur l'alerte
3. L'alerte est marquée comme résolue

### Nettoyer les Anciennes Données

```sql
-- Supprimer les métriques de plus de 90 jours
DELETE FROM performance_metrics 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Supprimer les alertes résolues de plus de 30 jours
DELETE FROM performance_alerts 
WHERE resolved = true 
AND resolved_at < NOW() - INTERVAL '30 days';
```

## Dépannage

### Les métriques ne s'affichent pas

1. Vérifier que les migrations SQL sont appliquées
2. Vérifier les logs des workflows GitHub
3. Vérifier que `performance-baseline.json` est dans `public/`

### Les alertes ne se créent pas

1. Vérifier que `SUPABASE_SERVICE_KEY` est configuré
2. Vérifier les RLS policies sur `performance_alerts`
3. Vérifier les logs du script `send-performance-metrics.js`

### Web Vitals ne sont pas trackés

1. Vérifier que `web-vitals` est installé: `npm list web-vitals`
2. Vérifier les logs de la console en production
3. Vérifier que la table `web_vitals` existe dans Supabase

## Améliorations Futures

- [ ] Notifications par email/Slack pour les alertes critiques
- [ ] Graphiques historiques avec bibliothèque de visualisation
- [ ] Export des métriques en CSV/JSON
- [ ] Comparaison entre branches (PR vs main)
- [ ] Métriques par région géographique
- [ ] Alertes automatiques sur Slack/Discord
- [ ] Intégration avec Sentry pour les erreurs
- [ ] Dashboard temps réel avec WebSocket

## Références

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright Performance Testing](https://playwright.dev/docs/test-advanced#measuring-performance)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

