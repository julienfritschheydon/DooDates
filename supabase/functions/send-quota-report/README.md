# Edge Function: Envoi automatique du rapport de quotas

## Description

Cette Edge Function génère et envoie automatiquement un rapport de monitoring des quotas guests.

## Configuration

### 1. Variables d'environnement

Dans Supabase Dashboard > Edge Functions > Settings, ajouter :

- `QUOTA_REPORT_WEBHOOK_URL` (optionnel) : URL du webhook (Slack, Discord, etc.)

### 2. Créer la table de logs (optionnel)

```sql
CREATE TABLE IF NOT EXISTS quota_report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quota_report_logs_created_at ON quota_report_logs(created_at DESC);
```

### 3. Configurer le cron job

Dans Supabase Dashboard > Database > Cron Jobs, créer :

**Quotidien (9h du matin)**
```sql
SELECT cron.schedule(
  'daily-quota-report',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-quota-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Hebdomadaire (Lundi 9h)**
```sql
SELECT cron.schedule(
  'weekly-quota-report',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-quota-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Utilisation

### Appel manuel

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-quota-report' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Via Supabase CLI

```bash
supabase functions invoke send-quota-report
```

## Format du rapport

Le rapport inclut :
- Statistiques globales
- Alertes (critiques, suspects)
- Top 10 consommateurs
- Activité par type
- Évolution temporelle (7 jours)
- Répartition par fuseau horaire

## Intégrations possibles

### Slack
1. Créer un webhook Slack
2. Configurer `QUOTA_REPORT_WEBHOOK_URL` avec l'URL du webhook
3. Le rapport sera envoyé automatiquement

### Discord
1. Créer un webhook Discord
2. Configurer `QUOTA_REPORT_WEBHOOK_URL` avec l'URL du webhook
3. Adapter le format si nécessaire

### Email
Modifier la fonction pour ajouter l'envoi par email (nécessite configuration SMTP).

