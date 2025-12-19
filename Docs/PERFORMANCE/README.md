# 📊 Système de Monitoring des Performances DooDates

Bienvenue dans la documentation du système de monitoring des performances de DooDates !

## 🎯 Objectif

Ce système permet de :
- **Tracker** les performances en temps réel (Web Vitals)
- **Collecter** les métriques des workflows CI/CD (Lighthouse, E2E)
- **Détecter** automatiquement les régressions de performance
- **Alerter** l'équipe en cas de dégradation
- **Visualiser** l'évolution des performances dans le temps

## 📚 Documentation

### Pour Démarrer

- **[Guide d'Installation](./INSTALLATION-GUIDE.md)** - Installation complète en 4 étapes
- **[Architecture du Système](./MONITORING-SYSTEM.md)** - Comprendre comment tout fonctionne

### Documentation Existante

- **[Mesure des Performances](./2025-11-05-PERFORMANCE-MEASUREMENT.md)** - Méthodologie de mesure
- **[Analyse des Performances](./2025-11-05-PERFORMANCE-ANALYSIS.md)** - Analyse détaillée
- **[Options d'Optimisation](./2025-11-05-OPTIMIZATION-OPTIONS.md)** - Pistes d'amélioration

## 🚀 Démarrage Rapide

### 1. Installation (5 minutes)

```bash
# 1. Appliquer les migrations SQL
# Copiez scripts/apply-performance-migrations.sql dans Supabase SQL Editor

# 2. Configurer les secrets GitHub
# Ajoutez SUPABASE_SERVICE_KEY dans GitHub Secrets

# 3. Tester localement
export VITE_SUPABASE_URL="https://votre-projet.supabase.co"
export SUPABASE_SERVICE_KEY="votre-service-key"
./scripts/test-performance-system.sh
```

### 2. Accéder au Dashboard

```bash
npm run dev
# Ouvrir http://localhost:8080/DooDates/performance
```

### 3. Voir les Métriques

Le dashboard affiche :
- ✅ **Alertes actives** (régressions détectées)
- 📊 **Métriques E2E** (temps de chargement)
- 🚀 **Métriques Lighthouse** (Core Web Vitals)
- 📈 **Historique 7 jours** (tendances)

## 📊 Métriques Trackées

### 🎯 Core Web Vitals (Production)

| Métrique | Seuil | Description |
|----------|-------|-------------|
| **LCP** | < 2.5s | Largest Contentful Paint |
| **FID** | < 100ms | First Input Delay |
| **CLS** | < 0.1 | Cumulative Layout Shift |
| **FCP** | < 1.8s | First Contentful Paint |
| **TTFB** | < 600ms | Time to First Byte |

### 🧪 Tests E2E

| Métrique | Seuil | Description |
|----------|-------|-------------|
| **Dashboard 50** | < 3.0s | Chargement avec 50 conversations |
| **Dashboard 200** | < 5.0s | Chargement avec 200 conversations |
| **Menu Tags** | < 500ms | Ouverture du menu tags |
| **Menu Dossiers** | < 500ms | Ouverture du menu dossiers |

### 🚦 Lighthouse CI

| Métrique | Seuil | Description |
|----------|-------|-------------|
| **Performance Score** | ≥ 90 | Score global de performance |
| **LCP** | < 2.5s | Largest Contentful Paint |
| **TBT** | < 200ms | Total Blocking Time |
| **CLS** | < 0.1 | Cumulative Layout Shift |

## 🔔 Système d'Alertes

### Niveaux de Sévérité

- **⚠️ Warning** : Régression ≥ 20% par rapport à la baseline
- **🚨 Critical** : Régression ≥ 50% par rapport à la baseline

### Notifications

Les alertes apparaissent :
1. **Dashboard Web** : `/performance` (en haut de page)
2. **GitHub Issues** : Création automatique pour régressions Lighthouse
3. **Base de données** : Table `performance_alerts`

## 🛠️ Maintenance

### Mettre à Jour la Baseline

Quand les performances s'améliorent de façon stable :

```bash
# Éditer public/performance-baseline.json
# Mettre à jour les valeurs cibles
# Commit et push
git add public/performance-baseline.json
git commit -m "chore: update performance baseline"
git push
```

### Nettoyer les Anciennes Données

```sql
-- Supprimer les métriques > 90 jours
DELETE FROM performance_metrics 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Supprimer les alertes résolues > 30 jours
DELETE FROM performance_alerts 
WHERE resolved = true 
AND resolved_at < NOW() - INTERVAL '30 days';
```

## 📁 Structure des Fichiers

```
DooDates-testing/
├── src/
│   ├── services/
│   │   └── performance-collector.ts      # Service de collecte
│   ├── components/performance/
│   │   ├── PerformanceDashboard.tsx      # Dashboard principal
│   │   └── PerformanceAlerts.tsx         # Composant alertes
│   ├── lib/
│   │   └── web-vitals-tracker.ts         # Tracking Web Vitals
│   └── pages/
│       └── Performance.tsx               # Page /performance
├── scripts/
│   ├── send-performance-metrics.js       # Envoi métriques à Supabase
│   ├── extract-e2e-metrics.js            # Extraction métriques E2E
│   ├── apply-performance-migrations.sql  # Migration complète
│   └── test-performance-system.sh        # Tests end-to-end
├── supabase/migrations/
│   ├── 20251219_create_web_vitals.sql    # Table Web Vitals
│   └── 20251219_create_performance_tables.sql # Tables métriques/alertes
├── .github/workflows/
│   └── lighthouse.yml                    # Workflow Lighthouse (modifié)
├── public/
│   └── performance-baseline.json         # Baseline de référence
└── Docs/PERFORMANCE/
    ├── README.md                         # Ce fichier
    ├── INSTALLATION-GUIDE.md             # Guide d'installation
    └── MONITORING-SYSTEM.md              # Documentation technique
```

## 🧪 Tests

### Test Local Complet

```bash
# Configurer les variables d'environnement
export VITE_SUPABASE_URL="https://votre-projet.supabase.co"
export SUPABASE_SERVICE_KEY="votre-service-key"

# Exécuter les tests
chmod +x scripts/test-performance-system.sh
./scripts/test-performance-system.sh
```

### Test Manuel du Dashboard

```bash
npm run dev
# Ouvrir http://localhost:8080/DooDates/performance
# Vérifier que toutes les sections s'affichent
```

### Test d'Envoi de Métriques

```bash
# E2E
node scripts/send-performance-metrics.js \
  --source e2e \
  --file e2e-metrics-example.json

# Lighthouse (après avoir généré un rapport)
node scripts/send-performance-metrics.js \
  --source lighthouse \
  --file .lighthouseci/lhr-*.json
```

## 🐛 Dépannage

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| Dashboard vide | Vérifier `public/performance-baseline.json` |
| Métriques non envoyées | Vérifier `SUPABASE_SERVICE_KEY` |
| Alertes non créées | Vérifier les RLS policies Supabase |
| Web Vitals non trackés | Vérifier `npm list web-vitals` |

Voir le [Guide d'Installation](./INSTALLATION-GUIDE.md#-dépannage) pour plus de détails.

## 📈 Améliorations Futures

- [ ] Notifications Slack/Discord pour alertes critiques
- [ ] Graphiques interactifs (Chart.js/Recharts)
- [ ] Export CSV/JSON des métriques
- [ ] Comparaison entre branches (PR vs main)
- [ ] Métriques par région géographique
- [ ] Dashboard temps réel avec WebSocket
- [ ] Intégration Sentry pour erreurs
- [ ] Rapport hebdomadaire automatique

## 🤝 Contribution

Pour contribuer au système de monitoring :

1. Lire la documentation technique
2. Tester localement les modifications
3. Mettre à jour la documentation si nécessaire
4. Créer une PR avec description détaillée

## 📞 Support

- **Documentation** : Ce dossier `/Docs/PERFORMANCE/`
- **Issues GitHub** : Pour signaler des bugs
- **Logs** : Consulter les workflows GitHub Actions

## 📜 Licence

Ce système fait partie du projet DooDates.

---

**Dernière mise à jour** : 19 décembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ Production Ready
