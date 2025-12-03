import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/error-handling';

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
const DEFAULT_REGION_ID = 'EU';

export const pricingService = {
    /**
     * Get the region for a given country code.
     * Currently defaults to 'EU' for everything as we only support FR/EU explicitly.
     */
    async getRegionForCountry(countryCode: string): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('country_region_map')
                .select('region_id')
                .eq('country_code', countryCode)
                .single();

            if (error || !data) {
                // console.warn('Region not found for country:', countryCode, 'Using default:', DEFAULT_REGION_ID);
                return DEFAULT_REGION_ID;
            }

            return data.region_id;
        } catch (err) {
            logError(err, 'pricing', { countryCode });
            return DEFAULT_REGION_ID;
        }
    },

    /**
     * Get pricing for a specific region.
     */
    async getPricingForRegion(regionId: string): Promise<Price[]> {
        try {
            // 1. Get Region Details (Currency)
            const { data: region, error: regionError } = await supabase
                .from('regions')
                .select('currency_symbol')
                .eq('id', regionId)
                .single();

            if (regionError || !region) {
                logError(regionError, 'pricing', { regionId });
                return [];
            }

            // 2. Get Prices
            const { data: prices, error: pricesError } = await supabase
                .from('price_lists')
                .select('product_id, amount')
                .eq('region_id', regionId)
                .eq('active', true);

            if (pricesError) {
                logError(pricesError, 'pricing', { regionId });
                return [];
            }

            return prices.map(p => ({
                product_id: p.product_id,
                amount: p.amount,
                currency_symbol: region.currency_symbol,
            }));
        } catch (err) {
            logError(err, 'pricing', { regionId });
            return [];
        }
    }
};
