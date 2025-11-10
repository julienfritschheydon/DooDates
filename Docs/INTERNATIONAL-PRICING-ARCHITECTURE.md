# Architecture de Tarification Géographique et Localisation

**Date de création :** 10 Novembre 2025  
**Objectif :** Spécifications techniques pour la tarification variable par pays et la localisation culturelle  
**Statut :** Spécification technique  
**Document parent :** [INTERNATIONAL-LAUNCH-STRATEGY.md](./INTERNATIONAL-LAUNCH-STRATEGY.md)

---

## 📋 Table des Matières

1. [Principes Fondamentaux](#1-principes-fondamentaux)
2. [Détection et Conformité Légale](#2-détection-et-conformité-légale)
3. [Architecture Technique](#3-architecture-technique)
4. [Gestion des Risques](#4-gestion-des-risques)
5. [Localisation Culturelle IA](#5-localisation-culturelle-ia)
6. [Implémentation par Phase](#6-implémentation-par-phase)
7. [Exemples de Code](#7-exemples-de-code)
8. [Checklist de Conformité](#8-checklist-de-conformité)

---

## 1. Principes Fondamentaux

### 1.1. Le Découplage Critique

⚠️ **RÈGLE ABSOLUE :** Séparer trois concepts distincts qui ne doivent JAMAIS être confondus.

#### A. Géographie (Logique Commerciale)

**Signal :** Géo-IP de l'utilisateur (détecté côté serveur)

**Contrôle :**
- Prix applicable
- Devise par défaut
- Disponibilité des produits
- Taxes (TVA/GST/Sales Tax)

**Exigence :** Ce signal détermine **ce que l'utilisateur peut acheter et à quel prix**.

**Exemple :**
```typescript
interface UserGeography {
  country: string;        // "FR", "CH", "US", "IN"
  region?: string;        // "EU", "NA", "APAC"
  detectedBy: "geoip";    // Source: Géo-IP serveur
  priceList: string;      // "EU_EUR", "CH_CHF", "US_USD", "IN_INR"
  taxRate: number;        // TVA: 20% (FR), 7.7% (CH), 0% (US certains états)
}
```

#### B. Langue (Internationalisation - i18n)

**Signal :** En-tête `Accept-Language` du navigateur (uniquement comme **suggestion par défaut**)

**Contrôle :**
- Langue de l'interface (UI)
- Langue des e-mails
- Langue du support client
- Langue des réponses IA

**Exigence :** **NE JAMAIS** utiliser la langue pour déduire le prix.

**Exemple :**
```typescript
interface UserLanguage {
  current: string;        // "fr", "en", "hi"
  browser: string;        // Détecté via Accept-Language
  userChoice: string;     // Sélectionné manuellement par l'utilisateur
  detectedBy: "browser" | "user_preference";
}
```

**❌ Anti-pattern :**
```typescript
// FAUX - Ne JAMAIS faire cela
if (language === "fr") {
  price = 6.95; // EUR
  currency = "EUR";
}
```

**✅ Pattern correct :**
```typescript
// CORRECT - Découplé
const geography = detectGeography(ipAddress); // "CH"
const language = getUserLanguage(); // "fr"
const priceList = getPriceList(geography.country); // "CH_CHF"
const price = priceList.premium; // 7.50 CHF

// Interface en français, mais prix en CHF
return {
  displayPrice: formatPrice(price, "fr-CH"), // "7,50 CHF"
  language: "fr",
  country: "CH"
};
```

**Cas d'usage réel :**
- Francophone en Suisse → UI française + Prix CHF (non EUR)
- Anglophone en France → UI anglaise + Prix EUR (non GBP)
- Francophone au Canada → UI française + Prix CAD (non EUR)

#### C. Locale (Localisation - l10n)

**Signal :** Paramètre utilisateur (souvent lié à la langue, mais **indépendant**)

**Contrôle :**
- Format des dates : `JJ/MM/AAAA` vs `MM/JJ/AAAA` vs `AAAA-MM-JJ`
- Séparateurs de nombres : `1.000,50` vs `1,000.50`
- Position du symbole de devise : `10€` vs `€10` vs `10 €`
- Premier jour de la semaine : Lundi vs Dimanche

**Exigence :** Doit être **configurable indépendamment** de la langue.

**Exemple :**
```typescript
interface UserLocale {
  code: string;              // "fr-FR", "fr-CH", "en-US", "en-GB", "hi-IN"
  dateFormat: string;        // "dd/MM/yyyy", "MM/dd/yyyy"
  numberFormat: {
    decimal: string;         // "," ou "."
    thousands: string;       // "." ou ","
  };
  currencyPosition: "before" | "after";
  weekStart: 0 | 1;          // 0=Dimanche, 1=Lundi
}
```

**Exemples pratiques :**
```typescript
// France (fr-FR)
formatDate(new Date(2025, 10, 10), "fr-FR")  // "10/11/2025"
formatNumber(1234.56, "fr-FR")                // "1 234,56"
formatCurrency(10, "EUR", "fr-FR")            // "10,00 €"

// Suisse francophone (fr-CH)
formatDate(new Date(2025, 10, 10), "fr-CH")  // "10.11.2025"
formatNumber(1234.56, "fr-CH")                // "1'234.56"
formatCurrency(10, "CHF", "fr-CH")            // "10,00 CHF"

// États-Unis (en-US)
formatDate(new Date(2025, 10, 10), "en-US")  // "11/10/2025"
formatNumber(1234.56, "en-US")                // "1,234.56"
formatCurrency(10, "USD", "en-US")            // "$10.00"

// Inde (hi-IN)
formatDate(new Date(2025, 10, 10), "hi-IN")  // "10/11/2025"
formatNumber(1234.56, "hi-IN")                // "1,234.56"
formatCurrency(10, "INR", "hi-IN")            // "₹10.00"
```

### 1.2. Décisions Architecturales Clés

| Décision | Choix | Justification |
|----------|-------|---------------|
| **Merchant of Record** | ✅ Lemon Squeezy | Élimine 100% responsabilité fiscale mondiale, gère TVA/GST/Sales Tax automatiquement |
| **Géo-IP Provider** | ✅ Cloudflare (gratuit via headers) | Déjà disponible si hébergé sur Netlify/Cloudflare, sinon IPinfo (gratuit 50k req/mois) |
| **i18n Library** | ✅ react-i18next | Standard industrie, 10M téléchargements/semaine, support pluralization |
| **Pricing Model** | ✅ Price Lists (table séparée) | Flexibilité régionale, pas de colonne `price` dans Products |
| **VPN Detection** | ✅ BIN Card Matching (Stripe Radar) | Évite blocage VPN légitime, détecte vraie fraude |
| **Analytics** | ✅ Plausible Analytics | GDPR-friendly, pas de cookie, hébergement EU |

---

## 2. Détection et Conformité Légale

### 2.1. Détection Géo-IP

#### A. Architecture de Détection

**Exigence :** La détection **DOIT** être effectuée **côté serveur** pour des raisons de fiabilité et de sécurité.

**❌ Pourquoi pas côté client ?**
- Facile à contourner (modification JavaScript)
- Dépend de la véracité du navigateur
- Vulnérable aux abus VPN non détectés

#### B. Choix Technique : Cloudflare (Recommandé)

**Si hébergé sur Netlify/Cloudflare :**

```typescript
// Supabase Edge Function ou Netlify Function
export async function handler(event) {
  // Headers Cloudflare automatiques
  const country = event.headers['cf-ipcountry'] || 'US'; // ISO 3166-1 alpha-2
  const continent = event.headers['cf-ipcontinent'] || 'NA';
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      country,
      continent,
      priceList: getPriceListForCountry(country)
    })
  };
}
```

**Avantages :**
- ✅ Gratuit (déjà inclus)
- ✅ Aucune API externe
- ✅ Latence minimale
- ✅ Fiabilité élevée

#### C. Alternative : IPinfo (Fallback)

**Si Cloudflare headers indisponibles :**

```typescript
import { IPinfoWrapper } from "node-ipinfo";

const ipinfo = new IPinfoWrapper(process.env.IPINFO_TOKEN);

async function detectCountry(ip: string) {
  const response = await ipinfo.lookupIp(ip);
  return {
    country: response.country,        // "FR"
    region: response.region,          // "Île-de-France"
    city: response.city,              // "Paris"
    timezone: response.timezone,      // "Europe/Paris"
    eu: response.isEU,                // true
  };
}
```

**Pricing IPinfo :**
- ✅ **Gratuit :** 50,000 req/mois
- ⚠️ **Basic :** $249/mois → 250,000 req/mois
- Pour **1000 users/mois × 10 pages** = 10k requests → Plan gratuit suffisant

#### D. Stockage de la Détection

```sql
-- Table users extension
ALTER TABLE users ADD COLUMN IF NOT EXISTS detected_country VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS detected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id);

-- Log des détections (RGPD: justification légitime)
CREATE TABLE geo_detection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  ip_hash VARCHAR(64), -- SHA-256 de l'IP (pas l'IP brute)
  country VARCHAR(2),
  detected_by VARCHAR(20), -- "cloudflare" | "ipinfo"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_geo_logs_user ON geo_detection_logs(user_id);
CREATE INDEX idx_geo_logs_country ON geo_detection_logs(country);
```

**⚠️ RGPD :** Ne **JAMAIS** stocker l'IP brute. Utiliser SHA-256 hash pour traçabilité sans identification.

### 2.2. Conformité Règlement Géoblocage UE 2018/302

**Contexte :** Le Règlement (UE) 2018/302 interdit la discrimination géographique injustifiée au sein de l'UE.

#### Exigence 1 : Interdiction de la Redirection Forcée

**❌ INTERDIT :**
```typescript
// Ne JAMAIS faire cela
if (country === "FR" && currentDomain !== "doodates.fr") {
  window.location.href = "https://doodates.fr";
}
```

**✅ AUTORISÉ :**
```typescript
// Proposition avec consentement
if (country === "FR" && currentDomain !== "doodates.fr" && !hasSeenBanner) {
  showBanner({
    message: "Il semble que vous soyez en France. Voir les prix en EUR ?",
    actions: [
      { label: "Oui, aller sur doodates.fr", href: "https://doodates.fr" },
      { label: "Non, rester ici", dismiss: true }
    ]
  });
}
```

#### Exigence 2 : Consentement Actif

**Implémentation Bannière :**
```tsx
// components/GeoBanner.tsx
interface GeoBannerProps {
  detectedCountry: string;
  currentSite: string;
  suggestedSite: string;
}

export function GeoBanner({ detectedCountry, currentSite, suggestedSite }: GeoBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed || currentSite === suggestedSite) return null;
  
  return (
    <Banner variant="info" position="top">
      <Text>
        Il semble que vous soyez en {getCountryName(detectedCountry)}. 
        Voulez-vous voir les prix en {getCurrency(detectedCountry)} ?
      </Text>
      <ButtonGroup>
        <Button onClick={() => window.location.href = suggestedSite}>
          Oui, changer
        </Button>
        <Button variant="ghost" onClick={() => {
          setDismissed(true);
          localStorage.setItem('geo_banner_dismissed', 'true');
        }}>
          Non merci
        </Button>
      </ButtonGroup>
    </Banner>
  );
}
```

#### Exigence 3 : "Shop-like-a-local"

**Principe :** Un utilisateur Italien visitant manuellement le site Allemand doit pouvoir acheter aux **mêmes conditions** qu'un Allemand.

**Implémentation :**
```typescript
// Permettre override manuel de la région
interface PricingContext {
  detectedCountry: string;    // Détecté via Géo-IP
  selectedCountry: string;    // Choix utilisateur (peut différer)
  priceList: string;          // Basé sur selectedCountry
}

function getPricing(user: User): PricingContext {
  const detected = user.detectedCountry;
  const selected = user.preferences?.selectedCountry || detected;
  
  return {
    detectedCountry: detected,
    selectedCountry: selected,
    priceList: getPriceListForCountry(selected) // User choice wins
  };
}
```

#### Exigence 4 : Sélecteur Global de Région/Devise

**UI Component :**
```tsx
// components/CountrySelector.tsx
export function CountrySelector() {
  const { detectedCountry, selectedCountry, setSelectedCountry } = useGeography();
  
  return (
    <Select
      value={selectedCountry}
      onChange={(e) => setSelectedCountry(e.target.value)}
      label="Région & Devise"
    >
      <optgroup label="Europe">
        <option value="FR">🇫🇷 France (EUR)</option>
        <option value="DE">🇩🇪 Allemagne (EUR)</option>
        <option value="CH">🇨🇭 Suisse (CHF)</option>
        <option value="GB">🇬🇧 Royaume-Uni (GBP)</option>
      </optgroup>
      <optgroup label="Amérique du Nord">
        <option value="US">🇺🇸 États-Unis (USD)</option>
        <option value="CA">🇨🇦 Canada (CAD)</option>
      </optgroup>
      <optgroup label="Asie">
        <option value="IN">🇮🇳 Inde (INR)</option>
      </optgroup>
    </Select>
  );
}
```

**Position dans UI :**
- Footer (toujours visible)
- Navigation (menu hamburger mobile)
- Page de tarification (avant CTA d'achat)

---

## 3. Architecture Technique

### 3.1. Schéma Base de Données : Price Lists

**❌ Anti-pattern : Prix dans table Products**
```sql
-- NE PAS FAIRE
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2), -- ❌ Prix unique, pas de régionalisation
  currency VARCHAR(3)
);
```

**✅ Pattern recommandé : Price Lists**

```sql
-- 1. Définition des régions commerciales
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,     -- "EU", "NA", "APAC"
  name VARCHAR(100) NOT NULL,            -- "European Union", "North America"
  countries TEXT[] NOT NULL,             -- ['FR', 'DE', 'IT', 'ES', ...]
  default_currency VARCHAR(3) NOT NULL,  -- "EUR", "USD"
  tax_included BOOLEAN DEFAULT false,    -- Prix TTC ou HT
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Listes de prix par région
CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES regions(id),
  code VARCHAR(50) UNIQUE NOT NULL,      -- "EU_EUR_2025", "US_USD_2025"
  name VARCHAR(100) NOT NULL,             -- "Plan Premium - Europe 2025"
  currency VARCHAR(3) NOT NULL,           -- "EUR", "USD", "INR", "CHF"
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Produits (sans prix)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- "PREMIUM_MONTHLY", "PRO_ANNUAL"
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20),                       -- "subscription", "one_time", "credits"
  billing_period VARCHAR(20),             -- "monthly", "annual", "lifetime"
  features JSONB,                         -- Liste des fonctionnalités
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prix = Intersection Produit × Price List
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  price_list_id UUID REFERENCES price_lists(id),
  amount DECIMAL(10,2) NOT NULL,          -- 6.95, 499.00
  compare_at_amount DECIMAL(10,2),        -- Prix barré (promos)
  tax_rate DECIMAL(5,2),                  -- 20.00 (TVA FR), 7.70 (TVA CH)
  
  -- Métadonnées Lemon Squeezy
  lemonsqueezy_variant_id VARCHAR(50),
  lemonsqueezy_product_id VARCHAR(50),
  
  UNIQUE(product_id, price_list_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_prices_price_list ON product_prices(price_list_id);
CREATE INDEX idx_price_lists_region ON price_lists(region_id);
CREATE INDEX idx_price_lists_active ON price_lists(active);
```

### 3.2. Données Initiales : Prix par Région (Phase 1)

```sql
-- Régions
INSERT INTO regions (code, name, countries, default_currency, tax_included) VALUES
  ('EU', 'European Union', ARRAY['FR','DE','IT','ES','BE','NL','PT','AT','IE','FI','GR','PL','SE','DK','RO','CZ','HU'], 'EUR', true),
  ('EU_CH', 'Switzerland', ARRAY['CH'], 'CHF', true),
  ('EU_GB', 'United Kingdom', ARRAY['GB'], 'GBP', true),
  ('NA_US', 'United States', ARRAY['US'], 'USD', false),
  ('NA_CA', 'Canada', ARRAY['CA'], 'CAD', false);

-- Price Lists Phase 1
INSERT INTO price_lists (region_id, code, name, currency, active) VALUES
  ((SELECT id FROM regions WHERE code = 'EU'), 'EU_EUR_2025', 'Europe 2025', 'EUR', true),
  ((SELECT id FROM regions WHERE code = 'EU_CH'), 'CH_CHF_2025', 'Suisse 2025', 'CHF', true),
  ((SELECT id FROM regions WHERE code = 'EU_GB'), 'GB_GBP_2025', 'UK 2025', 'GBP', true),
  ((SELECT id FROM regions WHERE code = 'NA_US'), 'US_USD_2025', 'USA 2025', 'USD', true),
  ((SELECT id FROM regions WHERE code = 'NA_CA'), 'CA_CAD_2025', 'Canada 2025', 'CAD', true);

-- Produits
INSERT INTO products (code, name, type, billing_period, features) VALUES
  ('FREE', 'Plan Gratuit', 'free', 'lifetime', '{"credits": 20, "surveys": "unlimited", "responses": "unlimited", "export": true}'),
  ('STARTER', 'Plan Starter', 'one_time', 'lifetime', '{"credits": 200, "surveys": "unlimited", "responses": "unlimited", "export": true}'),
  ('PREMIUM', 'Plan Premium', 'subscription', 'monthly', '{"credits": 100, "surveys": "unlimited", "responses": "unlimited", "export": true, "analytics": true}'),
  ('PRO', 'Plan Pro', 'subscription', 'monthly', '{"credits": 1000, "surveys": "unlimited", "responses": "unlimited", "export": true, "analytics": true, "priority_support": true}');

-- Prix Europe (EUR)
INSERT INTO product_prices (product_id, price_list_id, amount, tax_rate) VALUES
  ((SELECT id FROM products WHERE code = 'FREE'), (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 0.00, 20.00),
  ((SELECT id FROM products WHERE code = 'STARTER'), (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 9.99, 20.00),
  ((SELECT id FROM products WHERE code = 'PREMIUM'), (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 6.95, 20.00),
  ((SELECT id FROM products WHERE code = 'PRO'), (SELECT id FROM price_lists WHERE code = 'EU_EUR_2025'), 29.00, 20.00);

-- Prix Suisse (CHF) - Parité de pouvoir d'achat ajustée
INSERT INTO product_prices (product_id, price_list_id, amount, tax_rate) VALUES
  ((SELECT id FROM products WHERE code = 'FREE'), (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 0.00, 7.70),
  ((SELECT id FROM products WHERE code = 'STARTER'), (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 10.90, 7.70),
  ((SELECT id FROM products WHERE code = 'PREMIUM'), (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 7.50, 7.70),
  ((SELECT id FROM products WHERE code = 'PRO'), (SELECT id FROM price_lists WHERE code = 'CH_CHF_2025'), 32.00, 7.70);

-- Prix UK (GBP)
INSERT INTO product_prices (product_id, price_list_id, amount, tax_rate) VALUES
  ((SELECT id FROM products WHERE code = 'FREE'), (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 0.00, 20.00),
  ((SELECT id FROM products WHERE code = 'STARTER'), (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 8.49, 20.00),
  ((SELECT id FROM products WHERE code = 'PREMIUM'), (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 5.95, 20.00),
  ((SELECT id FROM products WHERE code = 'PRO'), (SELECT id FROM price_lists WHERE code = 'GB_GBP_2025'), 24.90, 20.00);

-- Prix USA (USD)
INSERT INTO product_prices (product_id, price_list_id, amount, tax_rate) VALUES
  ((SELECT id FROM products WHERE code = 'FREE'), (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 0.00, 0.00),
  ((SELECT id FROM products WHERE code = 'STARTER'), (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 9.99, 0.00),
  ((SELECT id FROM products WHERE code = 'PREMIUM'), (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 6.95, 0.00),
  ((SELECT id FROM products WHERE code = 'PRO'), (SELECT id FROM price_lists WHERE code = 'US_USD_2025'), 29.00, 0.00);

-- Prix Canada (CAD)
INSERT INTO product_prices (product_id, price_list_id, amount, tax_rate) VALUES
  ((SELECT id FROM products WHERE code = 'FREE'), (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 0.00, 13.00),
  ((SELECT id FROM products WHERE code = 'STARTER'), (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 12.99, 13.00),
  ((SELECT id FROM products WHERE code = 'PREMIUM'), (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 8.95, 13.00),
  ((SELECT id FROM products WHERE code = 'PRO'), (SELECT id FROM price_lists WHERE code = 'CA_CAD_2025'), 37.50, 13.00);
```

### 3.3. API de Récupération des Prix

```typescript
// lib/pricing/get-prices.ts
interface PricingQuery {
  country?: string;           // ISO 3166-1 alpha-2
  priceListCode?: string;     // Override manuel
  userId?: string;            // Pour tracking
}

interface ProductPrice {
  productCode: string;
  productName: string;
  amount: number;
  currency: string;
  displayAmount: string;      // Formaté avec locale
  taxRate: number;
  taxIncluded: boolean;
  lemonsqueezyVariantId?: string;
}

export async function getPricing(query: PricingQuery): Promise<ProductPrice[]> {
  // 1. Déterminer la price list
  let priceListCode: string;
  
  if (query.priceListCode) {
    // Override manuel (compliance EU 2018/302)
    priceListCode = query.priceListCode;
  } else if (query.country) {
    // Mapping pays → price list
    priceListCode = getPriceListForCountry(query.country);
  } else {
    // Default fallback
    priceListCode = 'EU_EUR_2025';
  }
  
  // 2. Récupérer les prix
  const { data, error } = await supabase
    .from('product_prices')
    .select(`
      amount,
      tax_rate,
      lemonsqueezy_variant_id,
      product:products(code, name),
      price_list:price_lists(currency, region:regions(tax_included))
    `)
    .eq('price_list.code', priceListCode)
    .eq('product.active', true);
  
  if (error) throw error;
  
  // 3. Formater pour l'UI
  return data.map(item => ({
    productCode: item.product.code,
    productName: item.product.name,
    amount: item.amount,
    currency: item.price_list.currency,
    displayAmount: formatCurrency(
      item.amount,
      item.price_list.currency,
      query.country || 'FR'
    ),
    taxRate: item.tax_rate,
    taxIncluded: item.price_list.region.tax_included,
    lemonsqueezyVariantId: item.lemonsqueezy_variant_id
  }));
}

function getPriceListForCountry(country: string): string {
  const mapping: Record<string, string> = {
    // Europe (EUR)
    'FR': 'EU_EUR_2025', 'DE': 'EU_EUR_2025', 'IT': 'EU_EUR_2025',
    'ES': 'EU_EUR_2025', 'BE': 'EU_EUR_2025', 'NL': 'EU_EUR_2025',
    'PT': 'EU_EUR_2025', 'AT': 'EU_EUR_2025', 'IE': 'EU_EUR_2025',
    
    // Europe (autres devises)
    'CH': 'CH_CHF_2025',
    'GB': 'GB_GBP_2025',
    
    // Amérique du Nord
    'US': 'US_USD_2025',
    'CA': 'CA_CAD_2025',
    
    // Phase 2 (à ajouter)
    // 'IN': 'IN_INR_2025',
  };
  
  return mapping[country] || 'EU_EUR_2025'; // Default: Europe
}

function formatCurrency(amount: number, currency: string, country: string): string {
  const locale = getLocaleForCountry(country);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getLocaleForCountry(country: string): string {
  const locales: Record<string, string> = {
    'FR': 'fr-FR', 'CH': 'fr-CH', 'GB': 'en-GB',
    'US': 'en-US', 'CA': 'en-CA', 'IN': 'hi-IN',
  };
  return locales[country] || 'en-US';
}
```

### 3.4. Infrastructure Paiement : Lemon Squeezy

**Décision :** ✅ Lemon Squeezy (Merchant of Record)

#### Avantages Lemon Squeezy
- ✅ **MoR = Zero responsabilité fiscale** : Ils vendent en leur nom
- ✅ **TVA UE automatique** : 27 pays gérés
- ✅ **Sales Tax US automatique** : 50 états gérés
- ✅ **GST Inde** (Phase 2) : Conformité locale
- ✅ **Paiements locaux** : UPI (Inde), iDEAL (EU), etc.
- ✅ **Fees transparents** : 5% + Stripe fees (~3%) = ~8% total
- ✅ **Setup rapide** : SDK officiel, webhooks simples

#### Installation

```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

#### Configuration

```typescript
// lib/payments/lemonsqueezy.ts
import { lemonSqueezySetup, createCheckout, Variant } from '@lemonsqueezy/lemonsqueezy.js';

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('Lemon Squeezy Error:', error),
});

export async function createPaymentCheckout(
  variantId: string,
  userId: string,
  email: string
): Promise<string> {
  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutData: {
        email: email,
        custom: {
          user_id: userId,
        },
      },
      productOptions: {
        enabledVariants: [variantId],
        redirectUrl: `${process.env.APP_URL}/dashboard?success=true`,
      },
    }
  );

  return checkout.data?.attributes.url || '';
}
```

#### Webhook Handler (Supabase Edge Function)

```typescript
// supabase/functions/lemonsqueezy-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface LemonSqueezyWebhook {
  meta: {
    event_name: string;
    custom_data: {
      user_id: string;
    };
  };
  data: {
    attributes: {
      product_id: string;
      variant_id: string;
      order_number: string;
      total: number;
      currency: string;
      status: string;
    };
  };
}

serve(async (req) => {
  const signature = req.headers.get('x-signature');
  
  // 1. Vérifier signature (HMAC SHA-256)
  // const isValid = verifySignature(await req.text(), signature, process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  // if (!isValid) return new Response('Unauthorized', { status: 401 });
  
  const payload: LemonSqueezyWebhook = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // 2. Traiter l'événement
  switch (payload.meta.event_name) {
    case 'order_created':
      await handleOrderCreated(supabase, payload);
      break;
    case 'subscription_created':
      await handleSubscriptionCreated(supabase, payload);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(supabase, payload);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(supabase, payload);
      break;
  }
  
  return new Response('OK', { status: 200 });
});

async function handleOrderCreated(supabase: any, payload: LemonSqueezyWebhook) {
  const userId = payload.meta.custom_data.user_id;
  const productCode = getProductCodeFromVariant(payload.data.attributes.variant_id);
  
  // Activer le plan
  await supabase
    .from('users')
    .update({
      plan: productCode,
      credits: getCreditsForProduct(productCode),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  // Logger la transaction
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      order_number: payload.data.attributes.order_number,
      amount: payload.data.attributes.total,
      currency: payload.data.attributes.currency,
      status: payload.data.attributes.status,
      provider: 'lemonsqueezy',
      created_at: new Date().toISOString()
    });
}

function getProductCodeFromVariant(variantId: string): string {
  // Mapping variant_id Lemon Squeezy → product_code
  const mapping: Record<string, string> = {
    '123456': 'STARTER',
    '123457': 'PREMIUM',
    '123458': 'PRO',
  };
  return mapping[variantId] || 'FREE';
}

function getCreditsForProduct(productCode: string): number {
  const credits: Record<string, number> = {
    'FREE': 20,
    'STARTER': 200,
    'PREMIUM': 100,
    'PRO': 1000,
  };
  return credits[productCode] || 20;
}
```

---

## 4. Gestion des Risques

### 4.1. Prévention Abus VPN

#### A. Problème

**Scénario :** Un utilisateur aux États-Unis (prix élevé $29) utilise un VPN pour s'inscrire depuis l'Inde (prix bas ₹299 = ~$3.50).

**Impact :**
- Perte de revenu : ~$25.50 par utilisateur
- Déséquilibre financier si abus massif

#### B. Mauvaise Solution (à éviter)

```typescript
// ❌ Ne PAS faire cela
const vpnProviders = ['NordVPN', 'ExpressVPN', ...];
const ipRanges = ['1.2.3.0/24', ...];

if (isVPN(ipAddress)) {
  throw new Error('VPN detected - Access denied');
}
```

**Pourquoi c'est mauvais :**
- Bloque les utilisateurs légitimes (entreprises, voyageurs)
- Faux positifs élevés
- Facilement contournable
- Mauvaise expérience utilisateur

#### C. Solution Recommandée : BIN Card Matching

**Principe :** Vérifier la cohérence entre **Pays de l'IP** et **Pays d'émission de la Carte**.

```typescript
// lib/fraud-detection/bin-matching.ts
interface PaymentVerification {
  ipCountry: string;          // Détecté via Géo-IP
  cardCountry: string;        // Obtenu via BIN (Bank Identification Number)
  riskLevel: 'low' | 'medium' | 'high';
  action: 'approve' | 'review' | 'block';
}

export async function verifyPayment(
  ipAddress: string,
  cardBIN: string
): Promise<PaymentVerification> {
  const ipCountry = await detectCountry(ipAddress);
  const cardCountry = await getBINCountry(cardBIN);
  
  // Règle 1: Concordance parfaite
  if (ipCountry === cardCountry) {
    return {
      ipCountry,
      cardCountry,
      riskLevel: 'low',
      action: 'approve'
    };
  }
  
  // Règle 2: Même région économique (UE)
  if (isEUCountry(ipCountry) && isEUCountry(cardCountry)) {
    return {
      ipCountry,
      cardCountry,
      riskLevel: 'low',
      action: 'approve'
    };
  }
  
  // Règle 3: Écart de prix modéré (<20%)
  const priceGap = calculatePriceGap(ipCountry, cardCountry);
  if (priceGap < 0.20) {
    return {
      ipCountry,
      cardCountry,
      riskLevel: 'medium',
      action: 'review'
    };
  }
  
  // Règle 4: Écart important (>20%) = Fraude potentielle
  return {
    ipCountry,
    cardCountry,
    riskLevel: 'high',
    action: 'block'
  };
}

async function getBINCountry(bin: string): Promise<string> {
  // Via Stripe Radar (automatique)
  // Ou API BIN: https://binlist.net/
  const response = await fetch(`https://lookup.binlist.net/${bin.substring(0, 6)}`);
  const data = await response.json();
  return data.country?.alpha2 || 'US';
}

function calculatePriceGap(country1: string, country2: string): number {
  const price1 = getPriceForCountry(country1, 'PREMIUM');
  const price2 = getPriceForCountry(country2, 'PREMIUM');
  
  return Math.abs(price1 - price2) / Math.max(price1, price2);
}
```

#### D. Intégration Stripe Radar (si utilisation future)

```typescript
// Règles Stripe Radar à configurer
const radarRules = [
  {
    name: 'Country Mismatch High Risk',
    condition: 'ip_country != card_country AND price_gap > 0.20',
    action: 'block',
  },
  {
    name: 'Country Mismatch Medium Risk',
    condition: 'ip_country != card_country AND price_gap > 0.10',
    action: 'review',
  },
];
```

**Note :** Lemon Squeezy gère une partie de cette logique automatiquement.

### 4.2. Perception Client : Éviter le "Backlash"

#### A. Problème

**Scénario :** Un utilisateur américain découvre qu'il paie $29 pour exactement le même produit qu'un utilisateur indien qui paie ₹299 (~$3.50).

**Réaction :**
- ❌ "Je me sens floué !"
- ❌ Boycott / Bad reviews
- ❌ Viral négatif sur Twitter/Reddit

#### B. Solution Marketing : Différenciation de Valeur

**Principe :** Ne pas seulement changer le prix, mais créer des **variations de produit** qui justifient la différence.

**Exemple : Plans Régionaux**

```typescript
// Plans US
const US_PLANS = {
  PREMIUM_US: {
    price: 6.95,
    currency: 'USD',
    credits: 100,
    features: [
      'US Priority Support (24/7)',
      'Integrations: Salesforce, HubSpot',
      'Advanced Analytics (US Data Centers)',
      'Compliance: SOC 2, HIPAA Ready',
    ]
  },
  PRO_US: {
    price: 29.00,
    currency: 'USD',
    credits: 1000,
    features: [
      'US Dedicated Account Manager',
      'White-label branding',
      'US-hosted data (California)',
      'SLA 99.9% uptime',
    ]
  }
};

// Plans Inde
const IN_PLANS = {
  PREMIUM_IN: {
    price: 299,
    currency: 'INR',
    credits: 50,  // Moins de crédits IA
    features: [
      'India Support (9am-6pm IST)',
      'Integrations: Zoho, Freshworks',
      'Standard Analytics',
      'Hindi Language Support',
    ]
  },
  PRO_IN: {
    price: 1299,
    currency: 'INR',
    credits: 500,  // Moins que US
    features: [
      'India Priority Support',
      'Standard branding options',
      'India-hosted data (Mumbai)',
      'SLA 99.5% uptime',
    ]
  }
};
```

**Différences subtiles mais réelles :**
- ✅ Support régional (horaires locaux)
- ✅ Intégrations locales (Zoho vs Salesforce)
- ✅ Hébergement local (conformité DPDP)
- ✅ Quantité de crédits IA variable
- ✅ SLA ajusté

#### C. Communication Transparente

**Page FAQ :**

> **Q: Pourquoi les prix varient-ils selon les pays ?**
> 
> **R:** Nous proposons des plans régionaux adaptés au marché local :
> - Les prix reflètent le **pouvoir d'achat local** (coût de la vie, salaire moyen)
> - Les fonctionnalités sont **optimisées pour chaque région** (support local, intégrations locales, hébergement local)
> - Les plans sont conformes aux **réglementations locales** (RGPD en UE, DPDP en Inde, HIPAA aux US)
> 
> Cette approche nous permet d'offrir un produit **accessible à tous**, peu importe votre localisation.

**Principe :** Être **transparent** plutôt que de cacher.

---

## 5. Localisation Culturelle IA

### 5.1. Problème : Biais Culturel des LLM

**Contexte :** Les grands modèles de langage (Gemini, GPT, Claude) ont un **biais occidental** (majoritairement américain).

**Exemples de problèmes :**

```typescript
// Prompt utilisateur (France)
"Crée un sondage pour savoir ce que les gens pensent de mon restaurant"

// ❌ Réponse non localisée (biais US)
{
  questions: [
    "Rate our service on a scale of 1-10",
    "How often do you dine out per week?",
    "What's your favorite appetizer? (Wings, Nachos, Mozzarella Sticks)"
  ]
}

// ✅ Réponse localisée (France)
{
  questions: [
    "Comment évaluez-vous notre service ? (Très satisfait → Très insatisfait)",
    "À quelle fréquence déjeunez-vous au restaurant ?",
    "Quelle est votre entrée préférée ? (Salade, Terrine, Soupe à l'oignon)"
  ]
}
```

**Problèmes identifiés :**
1. **Langue :** Tutoiement vs vouvoiement
2. **Références culturelles :** Wings vs Terrine
3. **Format :** Échelle 1-10 vs Likert descriptif
4. **Contexte :** "Dine out" vs "Déjeuner au restaurant"

### 5.2. Solution : Prompting Culturel (System Prompts)

#### A. Architecture

```typescript
// lib/ai/cultural-prompting.ts
interface CulturalContext {
  country: string;          // "FR", "US", "IN"
  language: string;         // "fr", "en", "hi"
  formality: 'formal' | 'informal';
  currency: string;
  locale: string;
}

export function buildCulturalSystemPrompt(context: CulturalContext): string {
  const basePrompt = `Tu es un assistant expert en création de sondages.`;
  
  // Ajouter contexte culturel
  const culturalPrompt = getCulturalPrompt(context.country);
  
  // Ajouter règles linguistiques
  const languagePrompt = getLanguagePrompt(context.language, context.formality);
  
  return `${basePrompt}\n\n${culturalPrompt}\n\n${languagePrompt}`;
}

function getCulturalPrompt(country: string): string {
  const prompts: Record<string, string> = {
    'FR': `
CONTEXTE CULTUREL : France
- Utilise des références culturelles françaises (pas américaines)
- Exemples de restaurants : bistrot, brasserie, restaurant gastronomique
- Exemples de plats : entrée (terrine, salade), plat (bœuf bourguignon, blanquette), dessert (tarte tatin, profiteroles)
- Unités : Système métrique (km, kg, °C)
- Dates : Format JJ/MM/AAAA
- Horaires : Format 24h (ex: 14h00, pas 2pm)
- Références sportives : Football, rugby, cyclisme (pas baseball, NFL)
`,
    'US': `
CULTURAL CONTEXT: United States
- Use American cultural references
- Restaurant examples: Diner, steakhouse, fast-casual
- Food examples: Appetizers (wings, nachos), entrees (burger, steak), desserts (cheesecake, brownies)
- Units: Imperial system (miles, lbs, °F)
- Dates: MM/DD/YYYY format
- Time: 12-hour format with AM/PM
- Sports: Baseball, NFL, NBA
`,
    'IN': `
सांस्कृतिक संदर्भ : भारत (CULTURAL CONTEXT: India)
- Use Indian cultural references and context
- Restaurant examples: Dhaba, pure veg, multi-cuisine
- Food examples: Starters (paneer tikka, samosa), mains (dal makhani, biryani), desserts (gulab jamun, kulfi)
- Units: Metric system (km, kg, °C)
- Dates: DD/MM/YYYY format
- Time: Both 12-hour and 24-hour acceptable
- Sports: Cricket, kabaddi, badminton
- Languages: Support Hindi, Tamil, Bengali alongside English
`,
  };
  
  return prompts[country] || prompts['US'];
}

function getLanguagePrompt(language: string, formality: 'formal' | 'informal'): string {
  const prompts: Record<string, Record<string, string>> = {
    'fr': {
      'formal': `
RÈGLES LINGUISTIQUES : Français (formel)
- Utilise TOUJOURS le vouvoiement ("vous", jamais "tu")
- Ton professionnel et poli
- Formules de politesse : "Pourriez-vous", "Veuillez", "Merci de"
- Évite l'anglicisme sauf termes techniques acceptés
- Exemples : "Comment évaluez-vous..." (pas "Comment tu trouves...")
`,
      'informal': `
RÈGLES LINGUISTIQUES : Français (informel)
- Tutoiement acceptable ("tu") si contexte casual
- Ton amical mais respectueux
- Formules détendues : "Peux-tu", "Merci", "N'hésite pas"
- Exemples : "Comment tu trouves..." acceptable
`,
    },
    'en': {
      'formal': `
LANGUAGE RULES: English (formal)
- Use professional, polite tone
- Formal phrasing: "Could you please", "We would appreciate"
- Avoid contractions (use "do not" instead of "don't")
- Examples: "How would you rate..." (not "How'd you rate...")
`,
      'informal': `
LANGUAGE RULES: English (casual)
- Friendly, conversational tone
- Contractions are fine ("don't", "we're")
- Simple language: "How do you like..." acceptable
`,
    },
    'hi': {
      'formal': `
भाषा नियम : हिंदी (औपचारिक) (LANGUAGE RULES: Hindi - Formal)
- Use आप (aap) form - formal "you"
- Professional and respectful tone
- Formal phrases: "कृपया", "आपसे निवेदन है"
- Mix Hindi with English technical terms is acceptable
`,
      'informal': `
भाषा नियम : हिंदी (अनौपचारिक) (LANGUAGE RULES: Hindi - Casual)
- तुम (tum) form acceptable - informal "you"
- Friendly, approachable tone
- Casual phrases acceptable
- Hinglish mixing is natural
`,
    },
  };
  
  return prompts[language]?.[formality] || prompts['en']['formal'];
}
```

#### B. Intégration dans Gemini Service

```typescript
// lib/ai/gemini-service.ts
import { buildCulturalSystemPrompt } from './cultural-prompting';

export async function generateSurvey(
  userPrompt: string,
  context: CulturalContext
): Promise<Survey> {
  // 1. Construire le system prompt avec contexte culturel
  const systemPrompt = buildCulturalSystemPrompt(context);
  
  // 2. Appeler Gemini avec prompt culturel
  const response = await geminiClient.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },  // Meta-prompt culturel
          { text: userPrompt },    // Prompt utilisateur
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    },
  });
  
  return parseSurveyResponse(response);
}
```

#### C. Détection Automatique du Contexte

```typescript
// Détection depuis les données utilisateur
export function detectCulturalContext(user: User): CulturalContext {
  return {
    country: user.detectedCountry || user.preferences?.selectedCountry || 'US',
    language: user.preferences?.language || detectBrowserLanguage(),
    formality: getDefaultFormality(user.detectedCountry),
    currency: getCurrencyForCountry(user.detectedCountry),
    locale: getLocaleForCountry(user.detectedCountry),
  };
}

function getDefaultFormality(country: string): 'formal' | 'informal' {
  // Pays avec culture formelle par défaut
  const formalCountries = ['FR', 'DE', 'JP', 'IN'];
  return formalCountries.includes(country) ? 'formal' : 'informal';
}
```

### 5.3. Exemples Pratiques

#### Exemple 1 : Sondage Restaurant (France vs US)

**Prompt utilisateur (identique) :**
> "Crée un sondage de satisfaction pour mon restaurant"

**France (fr-FR, formal) :**
```json
{
  "title": "Questionnaire de Satisfaction - [Nom du Restaurant]",
  "questions": [
    {
      "text": "Comment évaluez-vous la qualité de notre accueil ?",
      "type": "rating",
      "scale": ["Très insatisfait", "Insatisfait", "Neutre", "Satisfait", "Très satisfait"]
    },
    {
      "text": "Quelle est votre entrée préférée ?",
      "type": "multiple_choice",
      "options": ["Salade de chèvre chaud", "Terrine maison", "Soupe à l'oignon", "Autre"]
    },
    {
      "text": "Recommanderiez-vous notre établissement à vos proches ?",
      "type": "yes_no"
    }
  ]
}
```

**USA (en-US, informal) :**
```json
{
  "title": "Customer Satisfaction Survey - [Restaurant Name]",
  "questions": [
    {
      "text": "How would you rate our service?",
      "type": "rating",
      "scale": [1, 2, 3, 4, 5]
    },
    {
      "text": "What's your favorite appetizer?",
      "type": "multiple_choice",
      "options": ["Buffalo Wings", "Mozzarella Sticks", "Nachos", "Other"]
    },
    {
      "text": "Would you recommend us to friends and family?",
      "type": "yes_no"
    }
  ]
}
```

#### Exemple 2 : Sondage Event (Inde)

**Prompt utilisateur (Hindi) :**
> "मेरे शादी समारोह के लिए एक सर्वेक्षण बनाएं" (Crée un sondage pour ma cérémonie de mariage)

**Inde (hi-IN, formal) :**
```json
{
  "title": "विवाह समारोह सर्वेक्षण (Wedding Ceremony Survey)",
  "questions": [
    {
      "text": "आप कब उपलब्ध हैं? (When are you available?)",
      "type": "date_poll",
      "options": ["15 दिसंबर 2025", "22 दिसंबर 2025", "29 दिसंबर 2025"]
    },
    {
      "text": "आप किस प्रकार का भोजन पसंद करेंगे? (What type of food would you prefer?)",
      "type": "multiple_choice",
      "options": ["शुद्ध शाकाहारी (Pure Veg)", "जैन भोजन (Jain)", "मांसाहारी (Non-Veg)"]
    },
    {
      "text": "क्या आपको आवास की आवश्यकता है? (Do you need accommodation?)",
      "type": "yes_no"
    }
  ]
}
```

---

## 6. Implémentation par Phase

### Phase 0 : Préparation (Semaines 1-3)

**Référence :** [INTERNATIONAL-LAUNCH-STRATEGY.md - Section 6](./INTERNATIONAL-LAUNCH-STRATEGY.md#6-roadmap-dimplémentation)

#### Semaine 1 : Base de Données
- [ ] Créer tables `regions`, `price_lists`, `products`, `product_prices`
- [ ] Insérer données Phase 1 (EU, US, CA, CH, GB)
- [ ] Créer API `getPricing()`
- [ ] Tests unitaires pricing logic

#### Semaine 2 : Géo-Détection
- [ ] Implémenter Cloudflare headers detection
- [ ] Fallback IPinfo
- [ ] Stocker `detected_country` dans users
- [ ] Tests détection (mock IPs)

#### Semaine 3 : Lemon Squeezy
- [ ] Créer compte + store
- [ ] Créer produits et variants
- [ ] Mapper variants → product_prices
- [ ] Implémenter webhook handler
- [ ] Tests sandbox (paiement test)

### Phase 1 : Lancement US/EU (Mois 0-3)

**Pays cibles :** FR, DE, IT, ES, GB, CH, US, CA

#### Mois 1 : i18n + UI
- [ ] Installation react-i18next
- [ ] Traductions EN/FR à 100%
- [ ] Composant `CountrySelector`
- [ ] Bannière géo-suggestion (compliance 2018/302)
- [ ] Page pricing avec prix dynamiques

#### Mois 2 : Paiements + Tests
- [ ] Intégration Lemon Squeezy frontend
- [ ] Flow complet signup → payment → activation
- [ ] Tests E2E multi-pays (FR, US, CH)
- [ ] Tests VPN/fraude (BIN matching)

#### Mois 3 : Conformité + Launch
- [ ] Cookie consent banner
- [ ] Privacy Policy + Terms (iubenda)
- [ ] Audit RGPD (checklist)
- [ ] Product Hunt launch
- [ ] Monitoring (Plausible Analytics)

### Phase 2 : Expansion Inde (Mois 4-9)

**Pays cibles :** IN

#### Mois 4-5 : Localisation Hindi
- [ ] Traductions Hindi (hi-IN)
- [ ] Support devises INR
- [ ] Prix spécifiques Inde
- [ ] Cultural prompting Hindi

#### Mois 6 : Paiements UPI
- [ ] Configuration Lemon Squeezy UPI
- [ ] Tests paiements locaux
- [ ] Support RazorPay (backup)

#### Mois 7-9 : Conformité DPDP
- [ ] Nomination DPO
- [ ] Logs de consentement
- [ ] Data localization (Mumbai region Supabase)
- [ ] Audit DPDP Act 2023

---

## 7. Exemples de Code

### 7.1. Pricing Page Component

```tsx
// pages/Pricing.tsx
import { useEffect, useState } from 'react';
import { useGeography } from '@/hooks/useGeography';
import { getPricing } from '@/lib/pricing/get-prices';
import { createPaymentCheckout } from '@/lib/payments/lemonsqueezy';

export default function PricingPage() {
  const { country, currency, isLoading } = useGeography();
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  
  useEffect(() => {
    if (country) {
      getPricing({ country }).then(setPrices);
    }
  }, [country]);
  
  const handleSubscribe = async (productCode: string) => {
    const product = prices.find(p => p.productCode === productCode);
    if (!product?.lemonsqueezyVariantId) return;
    
    const checkoutUrl = await createPaymentCheckout(
      product.lemonsqueezyVariantId,
      user.id,
      user.email
    );
    
    window.location.href = checkoutUrl;
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="pricing-page">
      <CountrySelector />
      
      <div className="pricing-grid">
        {prices.map(product => (
          <PricingCard
            key={product.productCode}
            name={product.productName}
            price={product.displayAmount}
            currency={currency}
            features={getFeatures(product.productCode)}
            onSubscribe={() => handleSubscribe(product.productCode)}
          />
        ))}
      </div>
      
      <LegalNotice>
        {product.taxIncluded 
          ? `Prix TTC (TVA ${product.taxRate}% incluse)`
          : `Prix HT (taxes locales en sus)`
        }
      </LegalNotice>
    </div>
  );
}
```

### 7.2. Custom Hook: useGeography

```typescript
// hooks/useGeography.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Geography {
  country: string;
  currency: string;
  priceListCode: string;
  isLoading: boolean;
  setCountry: (country: string) => void;
}

export function useGeography(): Geography {
  const { user } = useAuth();
  const [country, setCountryState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function detectGeography() {
      // 1. Check user preference
      if (user?.preferences?.selectedCountry) {
        setCountryState(user.preferences.selectedCountry);
        setIsLoading(false);
        return;
      }
      
      // 2. Check stored detection
      if (user?.detectedCountry) {
        setCountryState(user.detectedCountry);
        setIsLoading(false);
        return;
      }
      
      // 3. Call detection API
      const response = await fetch('/api/detect-country');
      const data = await response.json();
      setCountryState(data.country);
      setIsLoading(false);
      
      // 4. Store in user profile
      if (user) {
        await supabase
          .from('users')
          .update({ detected_country: data.country })
          .eq('id', user.id);
      }
    }
    
    detectGeography();
  }, [user]);
  
  const setCountry = async (newCountry: string) => {
    setCountryState(newCountry);
    
    // Store user preference
    if (user) {
      await supabase
        .from('users')
        .update({
          preferences: {
            ...user.preferences,
            selectedCountry: newCountry
          }
        })
        .eq('id', user.id);
    }
  };
  
  return {
    country,
    currency: getCurrencyForCountry(country),
    priceListCode: getPriceListForCountry(country),
    isLoading,
    setCountry,
  };
}
```

### 7.3. Supabase RPC: get_user_pricing

```sql
-- Function RPC pour récupérer pricing d'un user
CREATE OR REPLACE FUNCTION get_user_pricing(p_user_id UUID)
RETURNS TABLE (
  product_code VARCHAR,
  product_name VARCHAR,
  amount DECIMAL,
  currency VARCHAR,
  tax_rate DECIMAL,
  lemonsqueezy_variant_id VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.code,
    p.name,
    pp.amount,
    pl.currency,
    pp.tax_rate,
    pp.lemonsqueezy_variant_id
  FROM users u
  JOIN price_lists pl ON pl.code = get_price_list_for_country(u.detected_country)
  JOIN product_prices pp ON pp.price_list_id = pl.id
  JOIN products p ON p.id = pp.product_id
  WHERE u.id = p_user_id
    AND p.active = true
    AND pl.active = true
  ORDER BY pp.amount ASC;
END;
$$ LANGUAGE plpgsql;

-- Helper function
CREATE OR REPLACE FUNCTION get_price_list_for_country(p_country VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE
    WHEN p_country = ANY(ARRAY['FR','DE','IT','ES','BE','NL','PT','AT','IE']) THEN 'EU_EUR_2025'
    WHEN p_country = 'CH' THEN 'CH_CHF_2025'
    WHEN p_country = 'GB' THEN 'GB_GBP_2025'
    WHEN p_country = 'US' THEN 'US_USD_2025'
    WHEN p_country = 'CA' THEN 'CA_CAD_2025'
    WHEN p_country = 'IN' THEN 'IN_INR_2025'
    ELSE 'EU_EUR_2025' -- Default
  END;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Checklist de Conformité

### ✅ Conformité Règlement UE 2018/302

- [ ] Pas de redirection forcée basée sur Géo-IP
- [ ] Bannière de suggestion avec consentement actif
- [ ] Sélecteur de pays/devise accessible (footer + pricing page)
- [ ] Utilisateur peut acheter sur n'importe quelle version régionale
- [ ] Documentation claire des différences de prix/features

### ✅ Conformité RGPD (UE)

- [ ] Privacy Policy complète (via iubenda)
- [ ] Cookie consent banner (essentiels vs analytics/marketing)
- [ ] Logs de consentement horodatés
- [ ] IP hashée (SHA-256), jamais stockée en clair
- [ ] Export de données utilisateur (GET /api/user/export)
- [ ] Suppression de compte (DELETE /api/user/delete)
- [ ] Chiffrement at-rest (Supabase) + in-transit (HTTPS)
- [ ] DPO email visible (privacy@doodates.com)

### ✅ Conformité DPDP Act 2023 (Inde) - Phase 2

- [ ] Consentement vérifiable (logs + timestamp + IP hash)
- [ ] Langue claire et accessible (Hindi + English)
- [ ] Opt-in explicite (pas de pré-cochage)
- [ ] DPO email de contact
- [ ] Réponse < 7 jours aux demandes
- [ ] Data localization (Supabase Mumbai region si > seuil)
- [ ] Notification breach < 72h

### ✅ Conformité Fiscale

- [ ] MoR (Lemon Squeezy) = Responsabilité déléguée
- [ ] Factures avec TVA/GST correcte
- [ ] Mention légale "Vendu par Lemon Squeezy LLC"
- [ ] Informations fiscales utilisateur collectées (si B2B)

### ✅ Sécurité Paiements

- [ ] PCI-DSS compliance (via Lemon Squeezy)
- [ ] Webhooks signés (HMAC SHA-256)
- [ ] Vérification BIN card (fraude VPN)
- [ ] Rate limiting API paiement
- [ ] Logs transactions chiffrés

---

## 9. Références

### Documents Liés
- [INTERNATIONAL-LAUNCH-STRATEGY.md](./INTERNATIONAL-LAUNCH-STRATEGY.md) - Stratégie et roadmap
- [2. Planning.md](./2.%20Planning.md) - Planning général produit
- [REBRANDING-DOODATES-TO-BONVOT.md](./REBRANDING-DOODATES-TO-BONVOT.md) - Stratégie branding

### Ressources Externes
- [Règlement UE 2018/302 (Géoblocage)](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32018R0302)
- [RGPD - Texte officiel](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [DPDP Act 2023 (Inde)](https://www.meity.gov.in/writereaddata/files/Digital%20Personal%20Data%20Protection%20Act%202023.pdf)
- [Lemon Squeezy Documentation](https://docs.lemonsqueezy.com/)
- [react-i18next Documentation](https://react.i18next.com/)

### Outils Recommandés
- **Géo-IP :** Cloudflare headers (gratuit), IPinfo (gratuit 50k/mois)
- **MoR :** Lemon Squeezy (5% + Stripe fees)
- **i18n :** react-i18next
- **Conformité :** iubenda (Privacy Policy)
- **Analytics :** Plausible Analytics (GDPR-friendly)

---

**Document créé par :** Équipe DooDates  
**Dernière mise à jour :** 10 Novembre 2025  
**Version :** 1.0  
**Prochaine revue :** Après implémentation Phase 0

