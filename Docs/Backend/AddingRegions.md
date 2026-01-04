# Adding New Regions

This guide explains how to add a new region (e.g., USA) to the Regional Pricing system.

## 1. Add the Region

Insert the new region into the `regions` table.

```sql
INSERT INTO regions (id, name, currency_code, currency_symbol)
VALUES ('US', 'United States', 'USD', '$');
```

## 2. Map Countries

Map the relevant country codes to this new region.

```sql
INSERT INTO country_region_map (country_code, region_id)
VALUES ('US', 'US');
```

## 3. Add Prices

Define the prices for your products in this new region.

```sql
INSERT INTO price_lists (region_id, product_id, amount)
VALUES
    ('US', 'premium_monthly', 12.00), -- Example price
    ('US', 'premium_yearly', 120.00);
```

## 4. Verification

You can verify the configuration by running:

```sql
SELECT
    r.name as region,
    r.currency_code,
    p.product_id,
    p.amount
FROM regions r
JOIN price_lists p ON r.id = p.region_id
WHERE r.id = 'US';
```
