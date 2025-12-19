-- Create performance_metrics table for storing metrics from workflows
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

-- Create performance_alerts table for regression detection
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

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_source ON performance_metrics(source);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_workflow ON performance_metrics(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_timestamp ON performance_alerts(timestamp);

-- RLS (Row Level Security)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read metrics
CREATE POLICY "Users can read performance metrics" ON performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow anonymous inserts from workflows (using service role key)
CREATE POLICY "Allow workflow metrics inserts" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Policy: Only authenticated users can read alerts
CREATE POLICY "Users can read performance alerts" ON performance_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow anonymous inserts for alerts
CREATE POLICY "Allow workflow alerts inserts" ON performance_alerts
  FOR INSERT WITH CHECK (true);

-- Policy: Only authenticated users can update alerts (resolve)
CREATE POLICY "Users can update alerts" ON performance_alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

