/**
 * Script SQL pour visualiser les quotas des utilisateurs
 * 
 * ⭐ MÉTHODE RECOMMANDÉE (la plus simple)
 * 
 * Usage:
 *   1. Ouvrir Supabase Dashboard → SQL Editor
 *   2. Copier-coller ce script (ou une des requêtes ci-dessous)
 *   3. Cliquer sur "Run" (ou Ctrl+Enter)
 *   4. Voir les résultats directement dans le Dashboard
 * 
 * Alternative via CLI:
 *   supabase db execute --file sql-scripts/view-user-quotas.sql
 * 
 * Alternative via PowerShell:
 *   npm run quota:view
 *   (nécessite SUPABASE_SERVICE_ROLE_KEY)
 */

-- Vue d'ensemble des quotas utilisateurs
SELECT 
  qt.user_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as display_name,
  qt.conversations_created,
  qt.polls_created,
  qt.date_polls_created,
  qt.form_polls_created,
  qt.quizz_created,
  qt.availability_polls_created,
  qt.ai_messages,
  qt.analytics_queries,
  qt.simulations,
  qt.total_credits_consumed,
  qt.subscription_start_date,
  qt.last_reset_date,
  qt.period_start,
  qt.period_end,
  qt.created_at,
  qt.updated_at
FROM quota_tracking qt
LEFT JOIN auth.users u ON qt.user_id = u.id
ORDER BY qt.total_credits_consumed DESC;

-- Statistiques globales
SELECT 
  COUNT(*) as total_users,
  SUM(total_credits_consumed) as total_credits_consumed_all_users,
  AVG(total_credits_consumed) as avg_credits_per_user,
  MAX(total_credits_consumed) as max_credits_consumed,
  SUM(conversations_created) as total_conversations,
  SUM(polls_created) as total_polls,
  SUM(ai_messages) as total_ai_messages,
  SUM(analytics_queries) as total_analytics_queries,
  SUM(simulations) as total_simulations
FROM quota_tracking;

-- Top 10 utilisateurs par consommation
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as display_name,
  qt.total_credits_consumed,
  qt.conversations_created,
  qt.polls_created,
  qt.date_polls_created,
  qt.form_polls_created,
  qt.quizz_created,
  qt.availability_polls_created,
  qt.ai_messages,
  qt.analytics_queries,
  qt.simulations,
  qt.updated_at as last_activity
FROM quota_tracking qt
LEFT JOIN auth.users u ON qt.user_id = u.id
ORDER BY qt.total_credits_consumed DESC
LIMIT 10;

-- Utilisateurs proches de la limite (supposons limite = 100)
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as display_name,
  qt.total_credits_consumed,
  (100 - qt.total_credits_consumed) as credits_remaining,
  ROUND((qt.total_credits_consumed::numeric / 100 * 100), 2) as percentage_used,
  qt.updated_at as last_activity
FROM quota_tracking qt
LEFT JOIN auth.users u ON qt.user_id = u.id
WHERE qt.total_credits_consumed >= 80  -- 80% ou plus
ORDER BY qt.total_credits_consumed DESC;

-- Répartition par type d'action
SELECT 
  'Conversations' as action_type,
  SUM(conversations_created) as total,
  AVG(conversations_created) as avg_per_user,
  MAX(conversations_created) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Polls (Total)' as action_type,
  SUM(polls_created) as total,
  AVG(polls_created) as avg_per_user,
  MAX(polls_created) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Date Polls' as action_type,
  SUM(date_polls_created) as total,
  AVG(date_polls_created) as avg_per_user,
  MAX(date_polls_created) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Form Polls' as action_type,
  SUM(form_polls_created) as total,
  AVG(form_polls_created) as avg_per_user,
  MAX(form_polls_created) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Quizz' as action_type,
  SUM(quizz_created) as total,
  AVG(quizz_created) as avg_per_user,
  MAX(quizz_created) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Availability Polls' as action_type,
  SUM(availability_polls_created) as total,
  AVG(availability_polls_created) as avg_per_user,
  MAX(availability_polls_created) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'AI Messages' as action_type,
  SUM(ai_messages) as total,
  AVG(ai_messages) as avg_per_user,
  MAX(ai_messages) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Analytics Queries' as action_type,
  SUM(analytics_queries) as total,
  AVG(analytics_queries) as avg_per_user,
  MAX(analytics_queries) as max_per_user
FROM quota_tracking
UNION ALL
SELECT 
  'Simulations' as action_type,
  SUM(simulations) as total,
  AVG(simulations) as avg_per_user,
  MAX(simulations) as max_per_user
FROM quota_tracking;

-- Activité récente (dernières 24h)
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as display_name,
  qt.total_credits_consumed,
  qt.updated_at as last_activity,
  EXTRACT(EPOCH FROM (NOW() - qt.updated_at)) / 3600 as hours_since_last_activity
FROM quota_tracking qt
LEFT JOIN auth.users u ON qt.user_id = u.id
WHERE qt.updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY qt.updated_at DESC;

-- Utilisateurs avec activité dans le journal (dernières 48h)
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as display_name,
  COUNT(qtj.id) as journal_entries_count,
  SUM(qtj.credits) as credits_from_journal,
  MAX(qtj.created_at) as last_journal_entry
FROM quota_tracking qt
LEFT JOIN auth.users u ON qt.user_id = u.id
LEFT JOIN quota_tracking_journal qtj ON qt.id = qtj.quota_tracking_id
WHERE qtj.created_at >= NOW() - INTERVAL '48 hours'
GROUP BY qt.user_id, u.email, u.raw_user_meta_data->>'full_name'
ORDER BY journal_entries_count DESC;

