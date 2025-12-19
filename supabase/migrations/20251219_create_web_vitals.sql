-- Create web_vitals table for performance monitoring
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

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON web_vitals(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_url ON web_vitals(url);

-- RLS (Row Level Security)
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read web vitals data
CREATE POLICY "Users can read web vitals data" ON web_vitals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow anonymous inserts (for web vitals tracking)
CREATE POLICY "Allow anonymous web vitals inserts" ON web_vitals
  FOR INSERT WITH CHECK (true);
