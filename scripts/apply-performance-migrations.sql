-- ============================================
-- SCRIPT COMPLET DE MIGRATION PERFORMANCE
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. Table Web Vitals (métriques utilisateurs)
-- ============================================

CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT,
  session_id TEXT NOT NULL,

  -- Core Web Vitals
  cls DECIMAL(10,6), -- Cumulative Layout Shift
  fid DECIMAL(10,2), -- First Input Delay
  fcp DECIMAL(10,2), -- First Contentful Paint
  lcp DECIMAL(10,2), -- Largest Contentful Paint
  ttfb DECIMAL(10,2), -- Time to First Byte

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON web_vitals(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_url ON web_vitals(url);

-- RLS (Row Level Security)
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture authentifiée
DROP POLICY IF EXISTS "Users can read web vitals data" ON web_vitals;
CREATE POLICY "Users can read web vitals data" ON web_vitals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Insertion anonyme (pour tracking)
DROP POLICY IF EXISTS "Allow anonymous web vitals inserts" ON web_vitals;
CREATE POLICY "Allow anonymous web vitals inserts" ON web_vitals
  FOR INSERT WITH CHECK (true);

-- 2. Table Performance Metrics (métriques workflows)
-- ============================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('lighthouse', 'e2e', 'web-vitals')),
  metrics JSONB NOT NULL,
  workflow_run_id TEXT,
  commit_sha TEXT,
  branch TEXT,
  environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_source ON performance_metrics(source);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_workflow ON performance_metrics(workflow_run_id);

-- RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture authentifiée
DROP POLICY IF EXISTS "Users can read performance metrics" ON performance_metrics;
CREATE POLICY "Users can read performance metrics" ON performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Insertion depuis workflows
DROP POLICY IF EXISTS "Allow workflow metrics inserts" ON performance_metrics;
CREATE POLICY "Allow workflow metrics inserts" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- 3. Table Performance Alerts (alertes régressions)
-- ============================================

CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  metric_name TEXT NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  baseline_value DECIMAL(10,2) NOT NULL,
  threshold_percent DECIMAL(5,2) NOT NULL,
  regression_percent DECIMAL(5,2) NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  workflow_run_id TEXT,
  commit_sha TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_timestamp ON performance_alerts(timestamp);

-- RLS
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture authentifiée
DROP POLICY IF EXISTS "Users can read performance alerts" ON performance_alerts;
CREATE POLICY "Users can read performance alerts" ON performance_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Insertion depuis workflows
DROP POLICY IF EXISTS "Allow workflow alerts inserts" ON performance_alerts;
CREATE POLICY "Allow workflow alerts inserts" ON performance_alerts
  FOR INSERT WITH CHECK (true);

-- Policy: Mise à jour authentifiée (résolution)
DROP POLICY IF EXISTS "Users can update alerts" ON performance_alerts;
CREATE POLICY "Users can update alerts" ON performance_alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les tables créées
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('web_vitals', 'performance_metrics', 'performance_alerts')
ORDER BY table_name;

-- Afficher les index créés
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('web_vitals', 'performance_metrics', 'performance_alerts')
ORDER BY tablename, indexname;

-- Afficher les policies RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('web_vitals', 'performance_metrics', 'performance_alerts')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCÈS !
-- ============================================
-- Les tables sont maintenant créées et prêtes à recevoir des données.
-- Vous pouvez maintenant configurer les workflows GitHub Actions.

