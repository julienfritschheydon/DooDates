import { describe, it, expect, vi, beforeEach } from "vitest";
import { pricingService } from "../pricing-service";
import * as supabaseApi from "@/lib/supabaseApi";

// Mock supabaseApi
vi.mock("@/lib/supabaseApi", () => ({
  supabaseSelectMaybeSingle: vi.fn(),
  supabaseSelectSingle: vi.fn(),
  supabaseSelect: vi.fn(),
}));

describe("Pricing Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRegionForCountry", () => {
    it("should return mapped region", async () => {
      vi.mocked(supabaseApi.supabaseSelectMaybeSingle).mockResolvedValue({ region_id: "EU" });

      const region = await pricingService.getRegionForCountry("FR");
      expect(region).toBe("EU");
      expect(supabaseApi.supabaseSelectMaybeSingle).toHaveBeenCalledWith(
        "country_region_map",
        expect.objectContaining({ country_code: "eq.FR" }),
      );
    });

    it("should return default region (EU) if not found", async () => {
      vi.mocked(supabaseApi.supabaseSelectMaybeSingle).mockResolvedValue(null);

      const region = await pricingService.getRegionForCountry("XX");
      expect(region).toBe("EU");
    });
  });

  describe("getPricingForRegion", () => {
    it("should return prices with currency symbol", async () => {
      // Mock Region Query
      vi.mocked(supabaseApi.supabaseSelectSingle).mockResolvedValue({ currency_symbol: "€" });

      // Mock Prices Query
      vi.mocked(supabaseApi.supabaseSelect).mockResolvedValue([{ product_id: "p1", amount: 10 }]);

      const prices = await pricingService.getPricingForRegion("EU");

      expect(prices).toHaveLength(1);
      expect(prices[0]).toEqual({
        product_id: "p1",
        amount: 10,
        currency_symbol: "€",
      });

      expect(supabaseApi.supabaseSelectSingle).toHaveBeenCalledWith(
        "regions",
        expect.objectContaining({ id: "eq.EU" }),
      );
      expect(supabaseApi.supabaseSelect).toHaveBeenCalledWith(
        "price_lists",
        expect.objectContaining({ region_id: "eq.EU" }),
      );
    });

    it("should return empty array if region fetch fails", async () => {
      vi.mocked(supabaseApi.supabaseSelectSingle).mockRejectedValue(new Error("Network error"));

      const prices = await pricingService.getPricingForRegion("EU");
      expect(prices).toEqual([]);
    });

    it("should return empty array if prices fetch fails", async () => {
      vi.mocked(supabaseApi.supabaseSelectSingle).mockResolvedValue({ currency_symbol: "€" });
      vi.mocked(supabaseApi.supabaseSelect).mockRejectedValue(new Error("Network error"));

      const prices = await pricingService.getPricingForRegion("EU");
      expect(prices).toEqual([]);
    });
  });
});
