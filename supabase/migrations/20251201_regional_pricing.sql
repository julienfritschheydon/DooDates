-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY, -- 'EU', 'US', etc.
    name TEXT NOT NULL,
    currency_code TEXT NOT NULL, -- 'EUR', 'USD'
    currency_symbol TEXT NOT NULL, -- '€', '$'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create price_lists table
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id TEXT REFERENCES regions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- 'premium_monthly', 'premium_yearly'
    amount DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(region_id, product_id)
);

-- Create country_region_map table
CREATE TABLE IF NOT EXISTS country_region_map (
    country_code TEXT PRIMARY KEY, -- ISO 2 chars: 'FR', 'DE'
    region_id TEXT REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_region_map ENABLE ROW LEVEL SECURITY;

-- Create policies (Public Read Access)
CREATE POLICY "Allow public read access on regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on price_lists" ON price_lists FOR SELECT USING (true);
CREATE POLICY "Allow public read access on country_region_map" ON country_region_map FOR SELECT USING (true);

-- Insert Initial Data (France/EU only)
INSERT INTO regions (id, name, currency_code, currency_symbol)
VALUES ('EU', 'Europe', 'EUR', '€')
ON CONFLICT (id) DO NOTHING;

-- Map France to EU
INSERT INTO country_region_map (country_code, region_id)
VALUES ('FR', 'EU')
ON CONFLICT (country_code) DO NOTHING;

-- Insert Prices for EU (Example prices, adjust as needed)
INSERT INTO price_lists (region_id, product_id, amount)
VALUES 
    ('EU', 'premium_monthly', 9.99),
    ('EU', 'premium_yearly', 99.99)
ON CONFLICT (region_id, product_id) DO UPDATE SET amount = EXCLUDED.amount;
