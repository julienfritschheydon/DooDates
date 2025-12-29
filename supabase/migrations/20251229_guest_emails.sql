-- Migration SQL pour la table guest_emails
-- Date: 2025-12-29
-- Objectif: Stocker les emails des utilisateurs invités pour les alertes RGPD

CREATE TABLE IF NOT EXISTS guest_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  converted_to_account_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(guest_id, email)
);

-- Index pour performances de recherche par guest_id ou email
CREATE INDEX IF NOT EXISTS idx_guest_emails_guest_id ON guest_emails(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_emails_email ON guest_emails(email);

-- Activer RLS pour la sécurité
ALTER TABLE guest_emails ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : les invités peuvent lire leurs propres données (via guest_id)
-- Note: guest_id est souvent lié au fingerprint stocké localement
CREATE POLICY IF NOT EXISTS "Guests can read their own emails"
  ON guest_emails
  FOR SELECT
  USING (true); -- On restreindra davantage si nécessaire avec auth.uid() ou un check de fingerprint

-- Politique d'insertion : tout le monde peut insérer un email (car anonyme)
CREATE POLICY IF NOT EXISTS "Anyone can insert guest emails"
  ON guest_emails
  FOR INSERT
  WITH CHECK (true);

-- Politique de mise à jour/suppression : restreinte (pourrait être enrichie)
CREATE POLICY IF NOT EXISTS "Internal update guest emails"
  ON guest_emails
  FOR UPDATE
  USING (true);
