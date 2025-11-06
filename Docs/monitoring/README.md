# 📊 Monitoring des Workflows GitHub Actions

Ce dossier contient les rapports automatiques de monitoring des workflows CI/CD.

## 📋 Fichiers

- `workflow-failures-report.md` - Rapport automatique mis à jour régulièrement avec l'état de santé des workflows

## 🔄 Mise à jour

Le rapport est généré automatiquement :
- **Toutes les heures** (via schedule cron)
- **Après chaque workflow important** (via workflow_run trigger)
- **Manuellement** (via workflow_dispatch)

## 📖 Utilisation

Ce rapport peut être consulté par :
- **Les développeurs** pour comprendre l'état du CI/CD
- **L'IA** (via Cursor) pour analyser les échecs et proposer des solutions
- **Les outils de monitoring** pour suivre la santé du projet

## 🔍 Contenu du rapport

Le rapport inclut :
- ✅ Statut de chaque workflow
- ❌ Échecs récents (24h et 7 jours)
- 📊 Statistiques globales
- 🔍 Détails des jobs en échec
- ⚠️ Recommandations

## 🛠️ Workflow associé

Le workflow `8️⃣ Workflow Monitoring & Health Report` génère ce rapport automatiquement.

## 🚨 Alertes Automatiques

Quand des échecs sont détectés dans les 24h, le système crée automatiquement une **issue GitHub** avec le label `ci-health`. Cette issue :
- ✅ S'ouvre automatiquement quand il y a des échecs
- 🔄 Se met à jour avec les nouveaux échecs
- ✅ Se ferme automatiquement quand tout est résolu

## 📊 Consultation Rapide

Pour vérifier rapidement l'état des workflows :

```bash
node scripts/check-workflow-status.js
```

Ce script affiche :
- ✅ Statut global (OK ou échecs)
- 📊 Nombre d'échecs (24h et 7 jours)
- 📅 Dernière mise à jour
- 📋 Résumé des problèmes

## 🤖 Pour l'IA (Cursor)

L'IA consulte automatiquement ces fichiers quand :
- Vous mentionnez des problèmes de CI/CD
- Une issue avec le label `ci-health` est ouverte
- Vous travaillez sur des fichiers de workflow
- Vous demandez de l'aide pour résoudre des erreurs

Voir `Docs/monitoring/.cursor-context.md` pour plus de détails.

