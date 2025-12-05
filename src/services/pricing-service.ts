import {
  supabaseSelect,
  supabaseSelectSingle,
  supabaseSelectMaybeSingle,
} from "@/lib/supabaseApi";
import { logError } from "@/lib/error-handling";

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
}

export interface Price {
  product_id: string;
  amount: number;
  currency_symbol: string;
}

// Default to EU if anything fails
const DEFAULT_REGION_ID = "EU";

export const pricingService = {
  /**
   * Get the region for a given country code.
   * Currently defaults to 'EU' for everything as we only support FR/EU explicitly.
   */
  async getRegionForCountry(countryCode: string): Promise<string> {
    try {
      const data = await supabaseSelectMaybeSingle<{ region_id: string }>(
        "country_region_map",
        {
          country_code: `eq.${countryCode}`,
          select: "region_id",
        },
      );

      if (!data) {
        // console.warn('Region not found for country:', countryCode, 'Using default:', DEFAULT_REGION_ID);
        return DEFAULT_REGION_ID;
      }

      return data.region_id;
    } catch (err) {
      logError(err, {
        component: "pricing",
        operation: "getRegionForCountry",
        metadata: { countryCode },
      });
      return DEFAULT_REGION_ID;
    }
  },

  /**
   * Get pricing for a specific region.
   */
  async getPricingForRegion(regionId: string): Promise<Price[]> {
    try {
      // 1. Get Region Details (Currency)
      const region = await supabaseSelectSingle<{ currency_symbol: string }>(
        "regions",
        {
          id: `eq.${regionId}`,
          select: "currency_symbol",
        },
      ).catch((err) => {
        logError(err, {
          component: "pricing",
          operation: "getPricingForRegion",
          metadata: { regionId },
        });
        return null; // Retourner null en cas d'erreur
      });

      if (!region) {
        return [];
      }

      // 2. Get Prices
      const prices = await supabaseSelect<{ product_id: string; amount: number }>(
        "price_lists",
        {
          region_id: `eq.${regionId}`,
          active: "eq.true",
          select: "product_id, amount",
        },
      ).catch((err) => {
        logError(err, {
          component: "pricing",
          operation: "getPricingForRegion",
          metadata: { regionId },
        });
        return [] as { product_id: string; amount: number }[];
      });

      return prices.map((p) => ({
        product_id: p.product_id,
        amount: p.amount,
        currency_symbol: region.currency_symbol,
      }));
    } catch (err) {
      logError(err, {
        component: "pricing",
        operation: "getPricingForRegion",
        metadata: { regionId },
      });
      return [];
    }
  },
};
