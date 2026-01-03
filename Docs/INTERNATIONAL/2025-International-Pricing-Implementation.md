# Guide d'Implémentation - Tarification Internationale

**Date :** 10 Novembre 2025  
**Statut :** Guide d'implémentation Phase 0  
**Documents liés :**

- [INTERNATIONAL-LAUNCH-STRATEGY.md](./INTERNATIONAL-LAUNCH-STRATEGY.md) - Stratégie globale
- [INTERNATIONAL-PRICING-ARCHITECTURE.md](./INTERNATIONAL-PRICING-ARCHITECTURE.md) - Spécifications techniques

---

## 📋 Vue d'Ensemble

Ce document est un **guide pratique** pour implémenter la tarification géographique et la localisation. Il organise les tâches par semaine selon la roadmap Phase 0 (3 semaines).

---

## 🎯 Objectifs Phase 0

- ✅ Base de données prix géographiques
- ✅ Détection Géo-IP
- ✅ Intégration Lemon Squeezy
- ✅ Conformité Règlement UE 2018/302
- ✅ Tests multi-pays

**Timeline :** 3 semaines  
**Effort estimé :** 60-80 heures

---

## 📅 Semaine 1 : Base de Données & Infrastructure

### Jour 1-2 : Migration Base de Données

#### Tâche 1.1 : Exécuter Migration SQL

**Fichier :** `sql-scripts/international-pricing-schema.sql`

```bash
# Option 1: Via Supabase Dashboard
# 1. Aller sur https://app.supabase.com/project/YOUR_PROJECT/sql
# 2. Copier-coller le contenu de international-pricing-schema.sql
# 3. Exécuter

# Option 2: Via psql CLI
psql $DATABASE_URL -f sql-scripts/international-pricing-schema.sql
```

**Vérifications :**

```sql
-- Vérifier tables créées
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('regions', 'price_lists', 'products', 'product_prices');

-- Vérifier colonnes users
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('detected_country', 'price_list_id', 'preferences');

-- Vérifier functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_price_list_for_country', 'get_user_pricing');
```

**Durée estimée :** 1-2 heures

#### Tâche 1.2 : Insérer Données Initiales

**Fichier :** `sql-scripts/international-pricing-data.sql`

```bash
# Exécuter après la migration schéma
psql $DATABASE_URL -f sql-scripts/international-pricing-data.sql
```

**Vérifications :**

```sql
-- Vérifier données insérées
SELECT COUNT(*) FROM regions;        -- Expected: 6
SELECT COUNT(*) FROM price_lists;    -- Expected: 6
SELECT COUNT(*) FROM products;       -- Expected: 4
SELECT COUNT(*) FROM product_prices; -- Expected: 24

-- Afficher prix par région
SELECT
  r.name as region,
  pl.currency,
  p.code as product,
  pp.amount
FROM product_prices pp
JOIN products p ON p.id = pp.product_id
JOIN price_lists pl ON pl.id = pp.price_list_id
JOIN regions r ON r.id = pl.region_id
ORDER BY r.name, p.sort_order;
```

**Durée estimée :** 30 minutes

#### Tâche 1.3 : Créer Types TypeScript

**Fichier à créer :** `src/types/pricing.ts`

```typescript
// src/types/pricing.ts
export interface Region {
  id: string;
  code: string;
  name: string;
  countries: string[];
  default_currency: string;
  tax_included: boolean;
}

export interface PriceList {
  id: string;
  region_id: string;
  code: string;
  name: string;
  currency: string;
  active: boolean;
  valid_from: string;
  valid_until?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "free" | "one_time" | "subscription" | "credits";
  billing_period?: "monthly" | "annual" | "lifetime";
  features: Record<string, any>;
  active: boolean;
  sort_order: number;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  price_list_id: string;
  amount: number;
  compare_at_amount?: number;
  tax_rate: number;
  lemonsqueezy_variant_id?: string;
  lemonsqueezy_product_id?: string;

  // Joined data
  product?: Product;
  price_list?: PriceList;
}

export interface PricingDisplay {
  productCode: string;
  productName: string;
  productDescription?: string;
  amount: number;
  currency: string;
  displayAmount: string;
  taxRate: number;
  taxIncluded: boolean;
  features: Record<string, any>;
  lemonsqueezyVariantId?: string;
}

export interface UserGeography {
  detectedCountry: string;
  selectedCountry?: string;
  priceListCode: string;
  currency: string;
  isLoading: boolean;
}
```

**Durée estimée :** 1 heure

### Jour 3-4 : API Pricing

#### Tâche 1.4 : Service Pricing

**Fichier à créer :** `src/lib/pricing/pricing-service.ts`

```typescript
// src/lib/pricing/pricing-service.ts
import { supabase } from "@/lib/supabase";
import { PricingDisplay } from "@/types/pricing";

/**
 * Récupère les prix pour un pays donné
 */
export async function getPricingForCountry(country: string): Promise<PricingDisplay[]> {
  // 1. Déterminer price list
  const priceListCode = getPriceListForCountry(country);

  // 2. Récupérer prix depuis Supabase
  const { data, error } = await supabase
    .from("product_prices")
    .select(
      `
      amount,
      tax_rate,
      lemonsqueezy_variant_id,
      product:products!inner(code, name, description, features),
      price_list:price_lists!inner(
        currency,
        region:regions!inner(tax_included)
      )
    `,
    )
    .eq("price_list.code", priceListCode)
    .eq("product.active", true)
    .eq("price_list.active", true)
    .order("product.sort_order");

  if (error) {
    console.error("Error fetching pricing:", error);
    throw error;
  }

  // 3. Formater pour l'UI
  return data.map((item) => ({
    productCode: item.product.code,
    productName: item.product.name,
    productDescription: item.product.description,
    amount: item.amount,
    currency: item.price_list.currency,
    displayAmount: formatCurrency(item.amount, item.price_list.currency, country),
    taxRate: item.tax_rate,
    taxIncluded: item.price_list.region.tax_included,
    features: item.product.features,
    lemonsqueezyVariantId: item.lemonsqueezy_variant_id,
  }));
}

/**
 * Récupère les prix pour un utilisateur
 */
export async function getPricingForUser(userId: string): Promise<PricingDisplay[]> {
  // Utiliser la fonction SQL get_user_pricing
  const { data, error } = await supabase.rpc("get_user_pricing", {
    p_user_id: userId,
  });

  if (error) throw error;

  // Formater les résultats
  return data.map((item) => ({
    productCode: item.product_code,
    productName: item.product_name,
    productDescription: item.product_description,
    amount: item.amount,
    currency: item.currency,
    displayAmount: formatCurrency(item.amount, item.currency, "US"),
    taxRate: item.tax_rate,
    taxIncluded: item.tax_included,
    features: item.features,
    lemonsqueezyVariantId: item.lemonsqueezy_variant_id,
  }));
}

/**
 * Mapping pays → price list
 */
function getPriceListForCountry(country: string): string {
  const mapping: Record<string, string> = {
    // Europe (EUR)
    FR: "EU_EUR_2025",
    DE: "EU_EUR_2025",
    IT: "EU_EUR_2025",
    ES: "EU_EUR_2025",
    BE: "EU_EUR_2025",
    NL: "EU_EUR_2025",
    PT: "EU_EUR_2025",
    AT: "EU_EUR_2025",
    IE: "EU_EUR_2025",
    FI: "EU_EUR_2025",
    GR: "EU_EUR_2025",
    PL: "EU_EUR_2025",

    // Europe (autres devises)
    CH: "CH_CHF_2025",
    GB: "GB_GBP_2025",
    NO: "NO_NOK_2025",

    // Amérique du Nord
    US: "US_USD_2025",
    CA: "CA_CAD_2025",
  };

  return mapping[country] || "EU_EUR_2025";
}

/**
 * Formate un montant en devise
 */
function formatCurrency(amount: number, currency: string, country: string): string {
  const locale = getLocaleForCountry(country);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getLocaleForCountry(country: string): string {
  const locales: Record<string, string> = {
    FR: "fr-FR",
    DE: "de-DE",
    IT: "it-IT",
    ES: "es-ES",
    CH: "fr-CH",
    GB: "en-GB",
    NO: "no-NO",
    US: "en-US",
    CA: "en-CA",
  };
  return locales[country] || "en-US";
}
```

**Tests :**

```typescript
// src/lib/pricing/pricing-service.test.ts
import { describe, it, expect } from "vitest";
import { getPricingForCountry } from "./pricing-service";

describe("Pricing Service", () => {
  it("should return EUR prices for France", async () => {
    const prices = await getPricingForCountry("FR");

    expect(prices).toHaveLength(4);
    expect(prices[0].currency).toBe("EUR");
    expect(prices.find((p) => p.productCode === "PREMIUM")?.amount).toBe(6.95);
  });

  it("should return USD prices for USA", async () => {
    const prices = await getPricingForCountry("US");

    expect(prices).toHaveLength(4);
    expect(prices[0].currency).toBe("USD");
  });

  it("should return CHF prices for Switzerland", async () => {
    const prices = await getPricingForCountry("CH");

    expect(prices[0].currency).toBe("CHF");
    expect(prices.find((p) => p.productCode === "PREMIUM")?.amount).toBe(7.5);
  });
});
```

**Durée estimée :** 4-6 heures

### Jour 5 : Tests BDD

#### Tâche 1.5 : Tests d'Intégration

```bash
# Lancer tests
npm run test:integration pricing-service.test.ts
```

**Checklist :**

- [ ] Tests passent pour FR, US, CH, GB, CA
- [ ] Montants corrects pour chaque région
- [ ] Devises correctes
- [ ] Formatage locale correct

**Durée estimée :** 2-3 heures

---

## 📅 Semaine 2 : Géo-Détection & API

### Jour 1-2 : Détection Géo-IP

#### Tâche 2.1 : Supabase Edge Function

**Fichier à créer :** `supabase/functions/detect-country/index.ts`

```typescript
// supabase/functions/detect-country/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DetectionResponse {
  country: string;
  detectedBy: "cloudflare" | "ipinfo" | "fallback";
  priceList: string;
  currency: string;
}

serve(async (req) => {
  try {
    // 1. Tenter Cloudflare headers (gratuit)
    const cfCountry = req.headers.get("cf-ipcountry");

    if (cfCountry && cfCountry !== "XX") {
      return new Response(
        JSON.stringify({
          country: cfCountry,
          detectedBy: "cloudflare",
          priceList: getPriceListForCountry(cfCountry),
          currency: getCurrencyForCountry(cfCountry),
        } as DetectionResponse),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Fallback: IPinfo (si API key disponible)
    const ipinfoKey = Deno.env.get("IPINFO_API_KEY");

    if (ipinfoKey) {
      const ip = req.headers.get("x-forwarded-for") || "unknown";
      const response = await fetch(`https://ipinfo.io/${ip}?token=${ipinfoKey}`);
      const data = await response.json();

      return new Response(
        JSON.stringify({
          country: data.country,
          detectedBy: "ipinfo",
          priceList: getPriceListForCountry(data.country),
          currency: getCurrencyForCountry(data.country),
        } as DetectionResponse),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Fallback ultime: US
    return new Response(
      JSON.stringify({
        country: "US",
        detectedBy: "fallback",
        priceList: "US_USD_2025",
        currency: "USD",
      } as DetectionResponse),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function getPriceListForCountry(country: string): string {
  // ... (même logique que pricing-service.ts)
}

function getCurrencyForCountry(country: string): string {
  const currencies: Record<string, string> = {
    FR: "EUR",
    DE: "EUR",
    IT: "EUR",
    CH: "CHF",
    GB: "GBP",
    NO: "NOK",
    US: "USD",
    CA: "CAD",
  };
  return currencies[country] || "USD";
}
```

**Déploiement :**

```bash
# Déployer la fonction
supabase functions deploy detect-country

# Tester
curl https://YOUR_PROJECT.supabase.co/functions/v1/detect-country
```

**Durée estimée :** 3-4 heures

#### Tâche 2.2 : Hook React useGeography

**Fichier à créer :** `src/hooks/useGeography.ts`

```typescript
// src/hooks/useGeography.ts
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Geography {
  country: string;
  currency: string;
  priceListCode: string;
  isLoading: boolean;
  setCountry: (country: string) => Promise<void>;
}

export function useGeography(): Geography {
  const { user } = useAuth();
  const [country, setCountryState] = useState<string>("US");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    detectGeography();
  }, [user]);

  async function detectGeography() {
    try {
      // 1. Check user preference
      if (user?.preferences?.selectedCountry) {
        setCountryState(user.preferences.selectedCountry);
        setIsLoading(false);
        return;
      }

      // 2. Check stored detection
      if (user?.detected_country) {
        setCountryState(user.detected_country);
        setIsLoading(false);
        return;
      }

      // 3. Call detection API
      const { data } = await supabase.functions.invoke("detect-country");

      if (data?.country) {
        setCountryState(data.country);

        // Store detection in user profile
        if (user) {
          await supabase
            .from("users")
            .update({
              detected_country: data.country,
              detected_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Geography detection failed:", error);
      setCountryState("US"); // Fallback
      setIsLoading(false);
    }
  }

  async function setCountry(newCountry: string) {
    setCountryState(newCountry);

    // Store user preference
    if (user) {
      await supabase
        .from("users")
        .update({
          preferences: {
            ...user.preferences,
            selectedCountry: newCountry,
          },
        })
        .eq("id", user.id);
    }
  }

  return {
    country,
    currency: getCurrencyForCountry(country),
    priceListCode: getPriceListForCountry(country),
    isLoading,
    setCountry,
  };
}
```

**Durée estimée :** 2-3 heures

---

## 📅 Semaine 3 : Lemon Squeezy & Conformité

### Jour 1-2 : Lemon Squeezy Setup

#### Tâche 3.1 : Créer Compte & Produits

**Étapes :**

1. Créer compte sur https://lemonsqueezy.com
2. Créer store "DooDates"
3. Créer 4 produits :
   - FREE (variant unique, €0)
   - STARTER (variants par devise: EUR, CHF, GBP, USD, CAD, NOK)
   - PREMIUM (variants par devise)
   - PRO (variants par devise)
4. Noter les `variant_id` de chaque produit

**Durée estimée :** 2-3 heures

#### Tâche 3.2 : Mapper Variants dans BDD

```sql
-- Mettre à jour product_prices avec lemonsqueezy_variant_id
UPDATE product_prices SET lemonsqueezy_variant_id = 'XXXXX'
WHERE product_id = (SELECT id FROM products WHERE code = 'PREMIUM')
  AND price_list_id = (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025');

-- Répéter pour tous les produits/régions
```

**Durée estimée :** 1 heure

### Jour 3-4 : Conformité UE

#### Tâche 3.3 : Bannière Géo-Suggestion

**Fichier à créer :** `src/components/GeoBanner.tsx`

```typescript
// src/components/GeoBanner.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface GeoBannerProps {
  detectedCountry: string;
  onAccept: () => void;
}

export function GeoBanner({ detectedCountry, onAccept }: GeoBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Vérifier si déjà dismissed
    const dismissed = localStorage.getItem('geo_banner_dismissed');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('geo_banner_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm text-blue-900">
          Il semble que vous soyez en <strong>{getCountryName(detectedCountry)}</strong>.
          Voulez-vous voir les prix en <strong>{getCurrency(detectedCountry)}</strong> ?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="btn btn-sm btn-primary"
          >
            Oui, changer
          </button>
          <button
            onClick={handleDismiss}
            className="btn btn-sm btn-ghost"
          >
            Non merci
          </button>
          <button onClick={handleDismiss} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Durée estimée :** 2 heures

### Jour 5 : Tests E2E

#### Tâche 3.4 : Tests Playwright Multi-Pays

**Fichier à créer :** `tests/e2e/international-pricing.spec.ts`

```typescript
// tests/e2e/international-pricing.spec.ts
import { test, expect } from "@playwright/test";

test.describe("International Pricing", () => {
  test("should show EUR prices for French users", async ({ page }) => {
    // Mock Cloudflare header
    await page.route("**/functions/v1/detect-country", (route) => {
      route.fulfill({
        json: { country: "FR", currency: "EUR", priceList: "EU_EUR_2025" },
      });
    });

    await page.goto("/pricing");

    // Vérifier devise
    await expect(page.locator('[data-testid="premium-price"]')).toContainText("6,95 €");
    await expect(page.locator('[data-testid="pro-price"]')).toContainText("29,00 €");
  });

  test("should show USD prices for US users", async ({ page }) => {
    await page.route("**/functions/v1/detect-country", (route) => {
      route.fulfill({
        json: { country: "US", currency: "USD", priceList: "US_USD_2025" },
      });
    });

    await page.goto("/pricing");

    await expect(page.locator('[data-testid="premium-price"]')).toContainText("$6.95");
    await expect(page.locator('[data-testid="pro-price"]')).toContainText("$29.00");
  });

  test("should allow manual country selection", async ({ page }) => {
    await page.goto("/pricing");

    // Ouvrir sélecteur pays
    await page.click('[data-testid="country-selector"]');

    // Sélectionner Suisse
    await page.click('option[value="CH"]');

    // Vérifier prix CHF
    await expect(page.locator('[data-testid="premium-price"]')).toContainText("CHF 7.50");
  });

  test("should show geo-suggestion banner", async ({ page }) => {
    await page.route("**/functions/v1/detect-country", (route) => {
      route.fulfill({
        json: { country: "FR", currency: "EUR" },
      });
    });

    await page.goto("/");

    // Banner visible
    await expect(page.locator('[data-testid="geo-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="geo-banner"]')).toContainText("France");

    // Dismiss banner
    await page.click('[data-testid="geo-banner-dismiss"]');
    await expect(page.locator('[data-testid="geo-banner"]')).not.toBeVisible();
  });
});
```

**Durée estimée :** 4-6 heures

---

## ✅ Checklist Finale Phase 0

### Base de Données

- [ ] Tables créées (regions, price_lists, products, product_prices)
- [ ] Données initiales insérées (6 régions, 24 prix)
- [ ] Functions SQL testées (get_price_list_for_country, get_user_pricing)
- [ ] RLS policies configurées

### API & Services

- [ ] Service `pricing-service.ts` fonctionnel
- [ ] Hook `useGeography` fonctionnel
- [ ] Edge function `detect-country` déployée
- [ ] Tests unitaires passent (>90% coverage)

### Lemon Squeezy

- [ ] Compte créé
- [ ] Produits/variants créés
- [ ] Variants mappés dans BDD
- [ ] Webhook handler testé (sandbox)

### Conformité UE 2018/302

- [ ] Bannière géo-suggestion implémentée
- [ ] Sélecteur pays accessible (footer)
- [ ] Pas de redirection forcée
- [ ] Tests E2E conformité passent

### Tests

- [ ] Tests unitaires pricing (100%)
- [ ] Tests intégration Supabase
- [ ] Tests E2E multi-pays (FR, US, CH, GB, CA)
- [ ] Tests webhook Lemon Squeezy

---

## 🚀 Déploiement

### Environnement de Staging

```bash
# 1. Variables d'environnement
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
IPINFO_API_KEY=... # Optionnel

# 2. Déployer Edge Functions
supabase functions deploy detect-country
supabase functions deploy lemonsqueezy-webhook

# 3. Build & Deploy
npm run build
netlify deploy --prod
```

### Vérifications Post-Déploiement

```bash
# Test détection pays
curl https://YOUR_PROJECT.supabase.co/functions/v1/detect-country

# Test pricing API
curl https://YOUR_SITE.com/api/pricing?country=FR

# Test webhook
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/lemonsqueezy-webhook \
  -H "Content-Type: application/json" \
  -d '{"meta": {"event_name": "order_created"}}'
```

---

## 📚 Ressources

### Documentation

- [Lemon Squeezy Docs](https://docs.lemonsqueezy.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [IPinfo API](https://ipinfo.io/developers)
- [Cloudflare IP Geolocation](https://developers.cloudflare.com/fundamentals/get-started/reference/cloudflare-headers/)

### Support

- Questions : Créer issue GitHub
- Bugs : Rapporter avec logs Sentry
- Améliorations : Discussion GitHub

---

**Document maintenu par :** Équipe DooDates  
**Dernière mise à jour :** 10 Novembre 2025  
**Prochaine revue :** Fin Semaine 3 (validation Phase 0)
