-- Table pour les logs d'envoi d'emails
-- Permet de suivre les alertes de suppression envoyées aux utilisateurs

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'deletion_warning', 'welcome', 'newsletter', etc.
    warning_type VARCHAR(20), -- 'chat', 'poll', 'account' (pour deletion_warning)
    days_until_deletion INTEGER, -- Nombre de jours avant suppression (pour deletion_warning)
    subject TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    error_message TEXT, -- En cas d'échec
    message_id VARCHAR(255), -- ID du message depuis le service d'email
    metadata JSONB, -- Données additionnelles
    
    -- Index pour les requêtes fréquentes
    CONSTRAINT email_logs_status_check CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Index pour optimiser les performances
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email ON email_logs(email);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_warning_type ON email_logs(warning_type) WHERE warning_type IS NOT NULL;

-- Table pour les logs des jobs automatisés
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    users_processed INTEGER DEFAULT 0,
    warnings_sent INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    
    CONSTRAINT job_logs_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

-- Index pour les logs de jobs
CREATE INDEX idx_job_logs_job_name ON job_logs(job_name);
CREATE INDEX idx_job_logs_status ON job_logs(status);
CREATE INDEX idx_job_logs_started_at ON job_logs(started_at DESC);

-- RLS (Row Level Security) pour email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir que ses propres logs d'emails
CREATE POLICY "Users can view their own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Les admins peuvent voir tous les logs (définir le rôle admin)
CREATE POLICY "Admins can view all email logs" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS pour job_logs (accessible uniquement par les admins/services)
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view job logs" ON job_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Fonction pour nettoyer les anciens logs (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM email_logs 
    WHERE sent_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'envoi d'emails
CREATE OR REPLACE FUNCTION get_email_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_emails BIGINT,
    successful_emails BIGINT,
    failed_emails BIGINT,
    deletion_warnings BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE status = 'sent') as successful_emails,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
        COUNT(*) FILTER (WHERE type = 'deletion_warning') as deletion_warnings,
        COUNT(DISTINCT user_id) as unique_users
    FROM email_logs 
    WHERE DATE(sent_at) BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE email_logs IS 'Logs des emails envoyés aux utilisateurs pour suivi et audit';
COMMENT ON TABLE job_logs IS 'Logs des jobs automatisés pour monitoring et debugging';
COMMENT ON COLUMN email_logs.warning_type IS 'Type de donnée concernée par l alerte de suppression';
COMMENT ON COLUMN email_logs.days_until_deletion IS 'Nombre de jours avant la suppression automatique';
COMMENT ON COLUMN job_logs.users_processed IS 'Nombre d utilisateurs traités par le job';
COMMENT ON COLUMN job_logs.warnings_sent IS 'Nombre d alertes envoyées par le job';
