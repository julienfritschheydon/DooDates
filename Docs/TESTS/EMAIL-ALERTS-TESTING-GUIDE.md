# Guide de Test - Système d'Alertes Email

## 🎯 Objectif

Tester le système complet d'alertes email avant suppression automatique des données utilisateur.

## 🧪 Tests Disponibles

### 1. Test Automatisé Complet

```bash
npm run test:email-alerts
```

Ce script exécute 5 tests :

- ✅ Calcul des suppressions à venir
- ✅ Génération des emails
- ✅ Simulation du job quotidien
- ✅ Interface DataControl (localStorage)
- ✅ Report de suppression

### 2. Test Interface Utilisateur

```bash
npm run dev
```

Puis naviguer sur `http://localhost:5173/data-control`

**Tests manuels à effectuer :**

#### 📧 Paramètres Email

1. **Activer les notifications email**
   - Cocher "Alertes email avant suppression"
   - Vérifier le toast de confirmation
   - Vérifier localStorage `doodates_email_notifications = true`

2. **Désactiver les notifications**
   - Décocher l'option
   - Vérifier le toast "notifications désactivées"
   - Vérifier localStorage `doodates_email_notifications = false`

#### ⏰ Alertes de Suppression

1. **Vérifier l'affichage des alertes**
   - Les alertes doivent apparaître avec "📧 Alerte email prévue"
   - Vérifier le compte à rebours (jours restants)
   - Tester le bouton "Reporter de 30 jours"

2. **Test du report**
   - Cliquer sur "Reporter de 30 jours"
   - Vérifier le toast de confirmation
   - L'alerte devrait disparaître ou se mettre à jour

#### 📊 Paramètres de Conservation

1. **Conversations IA**
   - Changer de "30 jours" → "12 mois"
   - Vérifier le toast et localStorage
   - Les alertes devraient se recalculer

2. **Sondages**
   - Changer de "12 mois" → "6 ans"
   - Vérifier la mise à jour des alertes

### 3. Test Backend (Supabase)

#### 🗄️ Création des tables

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: sql-scripts/create-email-logs-table.sql
```

#### 📧 Test Supabase Function

```bash
# Déployer la fonction
supabase functions deploy data-retention-warnings

# Tester localement
supabase functions serve data-retention-warnings
```

**Test manuel :**

```bash
curl -X POST 'http://localhost:54321/functions/v1/data-retention-warnings' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "warnings": [
      {
        "type": "chat",
        "daysUntilDeletion": 15,
        "itemCount": 23,
        "deletionDate": "2025-12-25",
        "userEmail": "test@example.com",
        "userId": "test-user-123"
      }
    ]
  }'
```

### 4. Test Job Quotidien

#### 🔄 Exécution Manuel

```bash
# Avec variables d'environnement
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key

npm run job:data-retention-warnings
```

#### 📋 Vérification des Logs

```sql
-- Vérifier les logs d'emails
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;

-- Vérifier les logs du job
SELECT * FROM job_logs ORDER BY started_at DESC LIMIT 10;

-- Statistiques d'envoi
SELECT * FROM get_email_stats();
```

### 5. Test GitHub Actions

#### 🚀 Déclenchement Manuel

1. Aller dans GitHub → Actions → Data Retention Warnings
2. Cliquer sur "Run workflow"
3. Choisir la branche et lancer

#### 📊 Vérification

1. **Logs du workflow** : Vérifier l'exécution dans GitHub Actions
2. **Issues créées** : En cas d'échec, une issue devrait être créée
3. **Logs Supabase** : Vérifier les tables `email_logs` et `job_logs`

## 🔧 Configuration Requise

### Variables d'Environnement

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Pour les emails (dans Supabase)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Secrets GitHub Actions

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## 📋 Checklist de Test

### ✅ Interface Utilisateur

- [ ] Navigation vers `/data-control`
- [ ] Toggle notifications email fonctionne
- [ ] Alertes affichées correctement
- [ ] Bouton report fonctionne
- [ ] Paramètres sauvegardés dans localStorage
- [ ] Toasts de confirmation affichés

### ✅ Service Backend

- [ ] Calcul des suppressions fonctionne
- [ ] Génération d'email HTML correcte
- [ ] Supabase Function déployée
- [ ] Logs sauvegardés en base

### ✅ Job Automatisé

- [ ] Script s'exécute sans erreur
- [ ] Utilisateurs traités correctement
- [ ] Emails envoyés (simulation)
- [ ] Logs job créés

### ✅ Infrastructure

- [ ] Tables SQL créées
- [ ] RLS configuré
- [ ] GitHub Actions configuré
- [ ] Secrets en place

## 🐛 Dépannage

### Erreurs Communes

1. **"Module not found"**

   ```bash
   npm install
   npm run build
   ```

2. **"Supabase connection failed"**
   - Vérifier les variables d'environnement
   - Vérifier les clés API

3. **"Email not sent"**
   - Vérifier `RESEND_API_KEY`
   - Vérifier les logs dans `email_logs`

4. **"Job failed"**
   - Vérifier les logs GitHub Actions
   - Vérifier la table `job_logs`

### Logs Utiles

```bash
# Logs du job
npm run job:data-retention-warnings 2>&1 | tee job.log

# Logs de l'interface
npm run dev 2>&1 | tee dev.log

# Logs Supabase (local)
supabase logs
```

## 📈 Monitoring

### Métriques à Surveiller

1. **Taux de succès des emails** : `email_logs.status`
2. **Temps d'exécution du job** : `job_logs.completed_at - started_at`
3. **Nombre d'utilisateurs alertés** : `job_logs.users_processed`
4. **Fréquence des reports** : Compter les clics sur "Reporter"

### Dashboard (optionnel)

```sql
-- Vue pour le dashboard
CREATE VIEW email_alerts_dashboard AS
SELECT
  DATE(sent_at) as date,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE status = 'sent') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(DISTINCT user_id) as unique_users
FROM email_logs
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

## ✅ Validation Finale

Après tous les tests, vérifiez :

1. **Fonctionnalité complète** : Tous les composants travaillent ensemble
2. **Performance** : Le job s'exécute en moins de 5 minutes
3. **Fiabilité** : Les emails sont envoyés correctement
4. **Expérience utilisateur** : L'interface est intuitive et réactive
5. **Monitoring** : Les logs sont complets et exploitables

Le système est prêt pour la production ! 🚀
