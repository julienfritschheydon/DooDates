-- =====================================================
-- DooDates - International Pricing Schema
-- =====================================================
-- Description: Tables pour tarification géographique variable
-- Author: DooDates Team
-- Date: 2025-11-10
-- Reference: Docs/INTERNATIONAL-PRICING-ARCHITECTURE.md
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. REGIONS TABLE
-- =====================================================
-- Définit les régions commerciales et leurs pays membres

CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,           -- "EU", "NA_US", "APAC_IN"
  name VARCHAR(100) NOT NULL,                  -- "European Union", "United States"
  countries TEXT[] NOT NULL,                   -- ['FR', 'DE', 'IT', ...]
  default_currency VARCHAR(3) NOT NULL,        -- "EUR", "USD", "INR"
  tax_included BOOLEAN DEFAULT false,          -- Prix TTC ou HT
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par pays
CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_countries ON regions USING GIN(countries);

COMMENT ON TABLE regions IS 'Régions commerciales pour tarification géographique';
COMMENT ON COLUMN regions.countries IS 'Array de codes pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN regions.tax_included IS 'true = TTC (EU), false = HT (US)';

-- =====================================================
-- 2. PRICE LISTS TABLE
-- =====================================================
-- Listes de prix spécifiques par région et période

CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,            -- "EU_EUR_2025", "US_USD_2025"
  name VARCHAR(100) NOT NULL,                   -- "Europe 2025", "USA 2025"
  currency VARCHAR(3) NOT NULL,                 -- "EUR", "USD", "INR", "CHF"
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,                      -- NULL = pas de limite
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_price_lists_region ON price_lists(region_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_code ON price_lists(code);
CREATE INDEX IF NOT EXISTS idx_price_lists_active ON price_lists(active);
CREATE INDEX IF NOT EXISTS idx_price_lists_currency ON price_lists(currency);

COMMENT ON TABLE price_lists IS 'Listes de prix par région et devise';
COMMENT ON COLUMN price_lists.code IS 'Identifiant unique de la liste (ex: EU_EUR_2025)';
COMMENT ON COLUMN price_lists.valid_until IS 'Date de fin de validité (NULL = permanent)';

-- =====================================================
-- 3. PRODUCTS TABLE (Enhanced)
-- =====================================================
-- Produits/plans sans prix (prix défini dans product_prices)

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,             -- "FREE", "PREMIUM", "PRO"
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,                    -- "free", "one_time", "subscription"
  billing_period VARCHAR(20),                   -- "monthly", "annual", "lifetime", NULL
  features JSONB DEFAULT '{}'::jsonb,           -- Liste des fonctionnalités
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_product_type CHECK (type IN ('free', 'one_time', 'subscription', 'credits')),
  CONSTRAINT valid_billing_period CHECK (
    billing_period IS NULL OR 
    billing_period IN ('monthly', 'annual', 'lifetime')
  )
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);

COMMENT ON TABLE products IS 'Catalogue produits (sans prix, voir product_prices)';
COMMENT ON COLUMN products.code IS 'Code produit unique (ex: PREMIUM_MONTHLY)';
COMMENT ON COLUMN products.features IS 'JSON: {"credits": 100, "surveys": "unlimited", "export": true}';
COMMENT ON COLUMN products.sort_order IS 'Ordre d''affichage sur page pricing';

-- =====================================================
-- 4. PRODUCT PRICES TABLE
-- =====================================================
-- Prix = Intersection Produit × Price List

CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE,
  
  -- Prix et taxes
  amount DECIMAL(10,2) NOT NULL,                -- 6.95, 499.00
  compare_at_amount DECIMAL(10,2),              -- Prix barré (promos)
  tax_rate DECIMAL(5,2) DEFAULT 0.00,           -- 20.00 (TVA FR), 7.70 (TVA CH)
  
  -- Métadonnées Lemon Squeezy
  lemonsqueezy_variant_id VARCHAR(50),
  lemonsqueezy_product_id VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(product_id, price_list_id),
  CONSTRAINT positive_amount CHECK (amount >= 0),
  CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_price_list ON product_prices(price_list_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_lemon_variant ON product_prices(lemonsqueezy_variant_id);

COMMENT ON TABLE product_prices IS 'Prix par produit et région (intersection)';
COMMENT ON COLUMN product_prices.amount IS 'Prix en devise de la price_list';
COMMENT ON COLUMN product_prices.compare_at_amount IS 'Prix barré pour promos (NULL si pas de promo)';
COMMENT ON COLUMN product_prices.tax_rate IS 'Taux de taxe en pourcentage (ex: 20.00 = 20%)';

-- =====================================================
-- 5. GEO DETECTION LOGS TABLE
-- =====================================================
-- Logs de détection géographique (RGPD compliant)

CREATE TABLE IF NOT EXISTS geo_detection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64) NOT NULL,                 -- SHA-256 de l'IP (pas l'IP brute)
  country VARCHAR(2) NOT NULL,                  -- Code pays ISO 3166-1 alpha-2
  detected_by VARCHAR(20) NOT NULL,             -- "cloudflare", "ipinfo", "manual"
  price_list_code VARCHAR(50),                  -- Price list assignée
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_detected_by CHECK (detected_by IN ('cloudflare', 'ipinfo', 'maxmind', 'manual'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_geo_logs_user ON geo_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_geo_logs_country ON geo_detection_logs(country);
CREATE INDEX IF NOT EXISTS idx_geo_logs_created ON geo_detection_logs(created_at DESC);

COMMENT ON TABLE geo_detection_logs IS 'Logs de détection géographique (RGPD: IP hashée)';
COMMENT ON COLUMN geo_detection_logs.ip_hash IS 'SHA-256 de l''IP (pas l''IP brute, conformité RGPD)';
COMMENT ON COLUMN geo_detection_logs.detected_by IS 'Source de détection géographique';

-- =====================================================
-- 6. TRANSACTIONS TABLE (if not exists)
-- =====================================================
-- Logs des transactions de paiement

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informations paiement
  order_number VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL,                  -- "pending", "completed", "failed", "refunded"
  
  -- Provider
  provider VARCHAR(20) DEFAULT 'lemonsqueezy',  -- "lemonsqueezy", "stripe", "razorpay"
  provider_transaction_id VARCHAR(100),
  
  -- Produit acheté
  product_code VARCHAR(50),
  price_list_code VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

COMMENT ON TABLE transactions IS 'Logs des transactions de paiement';
COMMENT ON COLUMN transactions.provider IS 'Processeur de paiement (lemonsqueezy, stripe, etc.)';
COMMENT ON COLUMN transactions.status IS 'Statut de la transaction';

-- =====================================================
-- 7. EXTEND USERS TABLE
-- =====================================================
-- Ajouter colonnes géographiques à la table users

DO $$ 
BEGIN
  -- Ajouter colonne detected_country si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'detected_country'
  ) THEN
    ALTER TABLE users ADD COLUMN detected_country VARCHAR(2);
    CREATE INDEX idx_users_detected_country ON users(detected_country);
  END IF;
  
  -- Ajouter colonne detected_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'detected_at'
  ) THEN
    ALTER TABLE users ADD COLUMN detected_at TIMESTAMPTZ;
  END IF;
  
  -- Ajouter colonne price_list_id si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'price_list_id'
  ) THEN
    ALTER TABLE users ADD COLUMN price_list_id UUID REFERENCES price_lists(id);
    CREATE INDEX idx_users_price_list ON users(price_list_id);
  END IF;
  
  -- Ajouter colonne preferences (JSONB) si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN users.detected_country IS 'Pays détecté via Géo-IP (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN users.detected_at IS 'Date de dernière détection géographique';
COMMENT ON COLUMN users.price_list_id IS 'Price list assignée (peut différer du pays détecté)';
COMMENT ON COLUMN users.preferences IS 'JSON: {"selectedCountry": "FR", "language": "fr", "locale": "fr-FR"}';

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function: get_price_list_for_country
-- Returns the price_list code for a given country code
CREATE OR REPLACE FUNCTION get_price_list_for_country(p_country VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE
    -- Europe (EUR)
    WHEN p_country = ANY(ARRAY['FR','DE','IT','ES','BE','NL','PT','AT','IE','FI','GR','PL','SE','DK','RO','CZ','HU']) THEN 'EU_EUR_2025'
    
    -- Europe (autres devises)
    WHEN p_country = 'CH' THEN 'CH_CHF_2025'
    WHEN p_country = 'GB' THEN 'GB_GBP_2025'
    WHEN p_country = 'NO' THEN 'NO_NOK_2025'
    
    -- Amérique du Nord
    WHEN p_country = 'US' THEN 'US_USD_2025'
    WHEN p_country = 'CA' THEN 'CA_CAD_2025'
    
    -- Asie (Phase 2)
    WHEN p_country = 'IN' THEN 'IN_INR_2025'
    
    -- Default: Europe
    ELSE 'EU_EUR_2025'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_price_list_for_country IS 'Retourne le code price_list pour un pays donné';

-- Function: get_user_pricing
-- Returns pricing for a specific user based on their detected/selected country
CREATE OR REPLACE FUNCTION get_user_pricing(p_user_id UUID)
RETURNS TABLE (
  product_code VARCHAR,
  product_name VARCHAR,
  product_description TEXT,
  amount DECIMAL,
  currency VARCHAR,
  tax_rate DECIMAL,
  tax_included BOOLEAN,
  lemonsqueezy_variant_id VARCHAR,
  features JSONB
) AS $$
DECLARE
  v_country VARCHAR(2);
  v_price_list_code VARCHAR(50);
BEGIN
  -- Get user's country (preference > detected > default)
  SELECT 
    COALESCE(
      (preferences->>'selectedCountry')::VARCHAR,
      detected_country,
      'US'
    )
  INTO v_country
  FROM users
  WHERE id = p_user_id;
  
  -- Get price list for country
  v_price_list_code := get_price_list_for_country(v_country);
  
  -- Return pricing
  RETURN QUERY
  SELECT
    p.code,
    p.name,
    p.description,
    pp.amount,
    pl.currency,
    pp.tax_rate,
    r.tax_included,
    pp.lemonsqueezy_variant_id,
    p.features
  FROM products p
  JOIN product_prices pp ON pp.product_id = p.id
  JOIN price_lists pl ON pl.id = pp.price_list_id
  JOIN regions r ON r.id = pl.region_id
  WHERE pl.code = v_price_list_code
    AND p.active = true
    AND pl.active = true
  ORDER BY p.sort_order ASC, pp.amount ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_pricing IS 'Retourne les prix pour un utilisateur selon sa géolocalisation';

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Activer RLS sur les tables sensibles

-- Enable RLS
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_detection_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read product prices (public)
CREATE POLICY "Public read access to product_prices"
  ON product_prices FOR SELECT
  USING (true);

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only see their own geo logs
CREATE POLICY "Users can view own geo logs"
  ON geo_detection_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do anything (webhooks)
CREATE POLICY "Service role has full access to transactions"
  ON transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to geo_logs"
  ON geo_detection_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at
  BEFORE UPDATE ON price_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_prices_updated_at
  BEFORE UPDATE ON product_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCHEMA MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run: psql -d your_database < international-pricing-schema.sql
-- 2. Insert initial data: international-pricing-data.sql
-- 3. Test queries: SELECT * FROM get_user_pricing('user-uuid');
-- =====================================================

