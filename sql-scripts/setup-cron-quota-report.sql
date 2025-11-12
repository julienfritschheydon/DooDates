-- ============================================================================
-- CONFIGURATION CRON JOB POUR RAPPORT AUTOMATIQUE
-- À exécuter dans Supabase Dashboard > Database > SQL Editor
-- ============================================================================

-- IMPORTANT: Remplacer YOUR_PROJECT et YOUR_SERVICE_ROLE_KEY par vos valeurs réelles

-- 1. Vérifier que l'extension pg_cron est activée
-- (Normalement déjà activée dans Supabase)

-- 2. Créer le cron job quotidien (9h du matin)
SELECT cron.schedule(
  'daily-quota-report',
  '0 9 * * *', -- 9h du matin tous les jours (UTC)
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

-- 3. Créer le cron job hebdomadaire (Lundi 9h)
SELECT cron.schedule(
  'weekly-quota-report',
  '0 9 * * 1', -- 9h du matin tous les lundis (UTC)
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

-- 4. Vérifier les cron jobs configurés
SELECT * FROM cron.job;

-- 5. Voir l'historique d'exécution
SELECT * FROM cron.job_run_details 
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname IN ('daily-quota-report', 'weekly-quota-report')
)
ORDER BY start_time DESC
LIMIT 20;

-- Pour supprimer un cron job (si nécessaire)
-- SELECT cron.unschedule('daily-quota-report');
-- SELECT cron.unschedule('weekly-quota-report');

