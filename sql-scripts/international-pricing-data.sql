-- =====================================================
-- DooDates - International Pricing Initial Data
-- =====================================================
-- Description: Données initiales pour tarification Phase 1 (US/EU)
-- Author: DooDates Team
-- Date: 2025-11-10
-- Reference: Docs/INTERNATIONAL-PRICING-ARCHITECTURE.md
-- Prerequisite: Run international-pricing-schema.sql first
-- =====================================================

-- =====================================================
-- 1. REGIONS
-- =====================================================

INSERT INTO regions (code, name, countries, default_currency, tax_included) VALUES
  -- Europe (EUR zone)
  ('EU', 'European Union', 
   ARRAY['FR','DE','IT','ES','BE','NL','PT','AT','IE','FI','GR','PL','SE','DK','RO','CZ','HU','SK','BG','HR','SI','LT','LV','EE','CY','MT','LU'], 
   'EUR', true),
  
  -- Europe (autres devises)
  ('EU_CH', 'Switzerland', ARRAY['CH'], 'CHF', true),
  ('EU_GB', 'United Kingdom', ARRAY['GB'], 'GBP', true),
  ('EU_NO', 'Norway', ARRAY['NO'], 'NOK', true),
  
  -- Amérique du Nord
  ('NA_US', 'United States', ARRAY['US'], 'USD', false),
  ('NA_CA', 'Canada', ARRAY['CA'], 'CAD', false)
  
  -- Phase 2 (à activer plus tard)
  -- ('APAC_IN', 'India', ARRAY['IN'], 'INR', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. PRICE LISTS
-- =====================================================

INSERT INTO price_lists (region_id, code, name, currency, active) VALUES
  -- Europe
  ((SELECT id FROM regions WHERE code = 'EU'), 'EU_EUR_2025', 'Europe 2025', 'EUR', true),
  ((SELECT id FROM regions WHERE code = 'EU_CH'), 'CH_CHF_2025', 'Suisse 2025', 'CHF', true),
  ((SELECT id FROM regions WHERE code = 'EU_GB'), 'GB_GBP_2025', 'Royaume-Uni 2025', 'GBP', true),
  ((SELECT id FROM regions WHERE code = 'EU_NO'), 'NO_NOK_2025', 'Norvège 2025', 'NOK', true),
  
  -- Amérique du Nord
  ((SELECT id FROM regions WHERE code = 'NA_US'), 'US_USD_2025', 'United States 2025', 'USD', true),
  ((SELECT id FROM regions WHERE code = 'NA_CA'), 'CA_CAD_2025', 'Canada 2025', 'CAD', true)
  
  -- Phase 2 (à activer plus tard)
  -- ((SELECT id FROM regions WHERE code = 'APAC_IN'), 'IN_INR_2025', 'India 2025', 'INR', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 3. PRODUCTS
-- =====================================================

INSERT INTO products (code, name, description, type, billing_period, features, sort_order) VALUES
  ('FREE', 
   'Plan Gratuit', 
   'Plan gratuit avec fonctionnalités de base',
   'free', 
   'lifetime', 
   '{
     "credits": 20,
     "surveys": "unlimited",
     "responses": "unlimited",
     "export": true,
     "export_formats": ["CSV", "PDF", "JSON", "Markdown"],
     "ai_generation": true,
     "conditional_logic": true,
     "analytics": false,
     "priority_support": false,
     "white_label": false
   }'::jsonb,
   1),
   
  ('STARTER', 
   'Plan Starter', 
   'Achat unique avec crédits lifetime',
   'one_time', 
   'lifetime', 
   '{
     "credits": 200,
     "surveys": "unlimited",
     "responses": "unlimited",
     "export": true,
     "export_formats": ["CSV", "PDF", "JSON", "Markdown"],
     "ai_generation": true,
     "conditional_logic": true,
     "analytics": true,
     "priority_support": false,
     "white_label": false
   }'::jsonb,
   2),
   
  ('PREMIUM', 
   'Plan Premium', 
   'Abonnement mensuel avec crédits IA',
   'subscription', 
   'monthly', 
   '{
     "credits": 100,
     "surveys": "unlimited",
     "responses": "unlimited",
     "export": true,
     "export_formats": ["CSV", "PDF", "JSON", "Markdown"],
     "ai_generation": true,
     "ai_analysis": true,
     "conditional_logic": true,
     "analytics": true,
     "priority_support": false,
     "white_label": false
   }'::jsonb,
   3),
   
  ('PRO', 
   'Plan Pro', 
   'Abonnement mensuel pour professionnels',
   'subscription', 
   'monthly', 
   '{
     "credits": 1000,
     "surveys": "unlimited",
     "responses": "unlimited",
     "export": true,
     "export_formats": ["CSV", "PDF", "JSON", "Markdown"],
     "ai_generation": true,
     "ai_analysis": true,
     "conditional_logic": true,
     "analytics": true,
     "advanced_analytics": true,
     "priority_support": true,
     "white_label": true,
     "api_access": true,
     "team_collaboration": true
   }'::jsonb,
   4)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 4. PRODUCT PRICES - EUROPE (EUR)
-- =====================================================
-- Référence: Pricing aligné sur Doodle (6.95€/mois Premium)

INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 
   0.00, NULL, 20.00),
   
  -- STARTER (one-time)
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 
   9.99, NULL, 20.00),
   
  -- PREMIUM (monthly)
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 
   6.95, NULL, 20.00),
   
  -- PRO (monthly)
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 
   29.00, NULL, 20.00)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- =====================================================
-- 5. PRODUCT PRICES - SWITZERLAND (CHF)
-- =====================================================
-- Ajustement parité pouvoir d'achat (~+8-10%)

INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 
   0.00, NULL, 7.70),
   
  -- STARTER
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 
   10.90, NULL, 7.70),
   
  -- PREMIUM
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 
   7.50, NULL, 7.70),
   
  -- PRO
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 
   32.00, NULL, 7.70)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- =====================================================
-- 6. PRODUCT PRICES - UNITED KINGDOM (GBP)
-- =====================================================
-- Conversion EUR → GBP (~0.85)

INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 
   0.00, NULL, 20.00),
   
  -- STARTER
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 
   8.49, NULL, 20.00),
   
  -- PREMIUM
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 
   5.95, NULL, 20.00),
   
  -- PRO
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 
   24.90, NULL, 20.00)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- =====================================================
-- 7. PRODUCT PRICES - NORWAY (NOK)
-- =====================================================
-- Conversion EUR → NOK (~11.5)

INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'NO_NOK_2025'), 
   0.00, NULL, 25.00),
   
  -- STARTER
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'NO_NOK_2025'), 
   115.00, NULL, 25.00),
   
  -- PREMIUM
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'NO_NOK_2025'), 
   79.00, NULL, 25.00),
   
  -- PRO
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'NO_NOK_2025'), 
   335.00, NULL, 25.00)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- =====================================================
-- 8. PRODUCT PRICES - UNITED STATES (USD)
-- =====================================================
-- Prix aligné EUR (1 EUR ≈ 1.05 USD)

INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 
   0.00, NULL, 0.00),
   
  -- STARTER
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 
   9.99, NULL, 0.00),
   
  -- PREMIUM
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 
   6.95, NULL, 0.00),
   
  -- PRO
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 
   29.00, NULL, 0.00)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- Note: tax_rate = 0 car Sales Tax US géré par Lemon Squeezy selon état

-- =====================================================
-- 9. PRODUCT PRICES - CANADA (CAD)
-- =====================================================
-- Conversion USD → CAD (~1.35)

INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 
   0.00, NULL, 13.00),
   
  -- STARTER
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 
   12.99, NULL, 13.00),
   
  -- PREMIUM
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 
   8.95, NULL, 13.00),
   
  -- PRO
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 
   37.50, NULL, 13.00)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- Note: tax_rate = 13% (HST moyen, varie selon province)

-- =====================================================
-- 10. PHASE 2 DATA (INDIA) - COMMENTED OUT
-- =====================================================
-- À activer lors de la Phase 2 (Mois 4-9)

/*
-- Region India
INSERT INTO regions (code, name, countries, default_currency, tax_included) VALUES
  ('APAC_IN', 'India', ARRAY['IN'], 'INR', true)
ON CONFLICT (code) DO NOTHING;

-- Price List India
INSERT INTO price_lists (region_id, code, name, currency, active) VALUES
  ((SELECT id FROM regions WHERE code = 'APAC_IN'), 'IN_INR_2025', 'India 2025', 'INR', true)
ON CONFLICT (code) DO NOTHING;

-- Product Prices India
-- Parité pouvoir d'achat: 6.95 EUR ≈ 599 INR
INSERT INTO product_prices (product_id, price_list_id, amount, compare_at_amount, tax_rate) VALUES
  -- FREE
  ((SELECT id FROM products WHERE code = 'FREE'), 
   (SELECT id FROM price_lists WHERE code = 'IN_INR_2025'), 
   0.00, NULL, 18.00),
   
  -- STARTER
  ((SELECT id FROM products WHERE code = 'STARTER'), 
   (SELECT id FROM price_lists WHERE code = 'IN_INR_2025'), 
   799.00, NULL, 18.00),
   
  -- PREMIUM (moins de crédits: 50 au lieu de 100)
  ((SELECT id FROM products WHERE code = 'PREMIUM'), 
   (SELECT id FROM price_lists WHERE code = 'IN_INR_2025'), 
   599.00, NULL, 18.00),
   
  -- PRO (moins de crédits: 500 au lieu de 1000)
  ((SELECT id FROM products WHERE code = 'PRO'), 
   (SELECT id FROM price_lists WHERE code = 'IN_INR_2025'), 
   2499.00, NULL, 18.00)
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- Note: GST = 18% en Inde
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query 1: Vérifier nombre de régions
SELECT COUNT(*) as region_count FROM regions;
-- Expected: 6 (Phase 1)

-- Query 2: Vérifier nombre de price lists
SELECT COUNT(*) as price_list_count FROM price_lists;
-- Expected: 6 (Phase 1)

-- Query 3: Vérifier nombre de produits
SELECT COUNT(*) as product_count FROM products;
-- Expected: 4 (FREE, STARTER, PREMIUM, PRO)

-- Query 4: Vérifier nombre de prix
SELECT COUNT(*) as price_count FROM product_prices;
-- Expected: 24 (4 products × 6 price lists)

-- Query 5: Afficher tous les prix par région
SELECT 
  r.name as region,
  pl.currency,
  p.code as product,
  pp.amount,
  pp.tax_rate
FROM product_prices pp
JOIN products p ON p.id = pp.product_id
JOIN price_lists pl ON pl.id = pp.price_list_id
JOIN regions r ON r.id = pl.region_id
ORDER BY r.name, p.sort_order;

-- Query 6: Tester la fonction get_price_list_for_country
SELECT 
  'FR' as country, 
  get_price_list_for_country('FR') as price_list
UNION ALL
SELECT 'US', get_price_list_for_country('US')
UNION ALL
SELECT 'CH', get_price_list_for_country('CH')
UNION ALL
SELECT 'IN', get_price_list_for_country('IN');

-- Query 7: Simuler pricing pour un pays
DO $$
DECLARE
  v_test_country VARCHAR(2) := 'FR';
  v_price_list VARCHAR(50);
BEGIN
  v_price_list := get_price_list_for_country(v_test_country);
  
  RAISE NOTICE 'Pricing for country: %', v_test_country;
  RAISE NOTICE 'Price list: %', v_price_list;
  
  PERFORM * FROM product_prices pp
  JOIN products p ON p.id = pp.product_id
  JOIN price_lists pl ON pl.id = pp.price_list_id
  WHERE pl.code = v_price_list;
END $$;

-- =====================================================
-- DATA MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Verify data: Run verification queries above
-- 2. Test API: curl /api/pricing?country=FR
-- 3. Update Lemon Squeezy: Map lemonsqueezy_variant_id
-- =====================================================

