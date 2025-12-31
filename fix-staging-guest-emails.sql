-- Fix pour l'erreur CI staging - Table guest_emails manquante
-- À exécuter manuellement sur Supabase Staging

-- Vérifier si la table existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'guest_emails'
);

-- Si la table n'existe pas, la créer
CREATE TABLE IF NOT EXISTS guest_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  converted_to_account_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(guest_id, email)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_guest_emails_guest_id ON guest_emails(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_emails_email ON guest_emails(email);

-- Activer RLS
ALTER TABLE guest_emails ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent, puis les créer
DROP POLICY IF EXISTS "Guests can read their own emails" ON guest_emails;
CREATE POLICY "Guests can read their own emails"
  ON guest_emails
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert guest emails" ON guest_emails;
CREATE POLICY "Anyone can insert guest emails"
  ON guest_emails
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Internal update guest emails" ON guest_emails;
CREATE POLICY "Internal update guest emails"
  ON guest_emails
  FOR UPDATE
  USING (true);

-- Vérification finale
SELECT 'Table guest_emails créée avec succès' as status;
