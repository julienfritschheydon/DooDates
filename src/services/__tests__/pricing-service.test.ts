import { describe, it, expect, vi, beforeEach } from "vitest";
import { pricingService } from "../pricing-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          eq: vi.fn(),
        })),
      })),
    })),
  },
}));

describe("Pricing Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRegionForCountry", () => {
    it("should return mapped region", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { region_id: "EU" }, error: null }),
        }),
      });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const region = await pricingService.getRegionForCountry("FR");
      expect(region).toBe("EU");
    });

    it("should return default region (EU) if not found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: "Not found" }),
        }),
      });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const region = await pricingService.getRegionForCountry("XX");
      expect(region).toBe("EU");
    });
  });

  describe("getPricingForRegion", () => {
    it("should return prices with currency symbol", async () => {
      // Mock Region Query
      const mockRegionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { currency_symbol: "€" },
            error: null,
          }),
        }),
      });

      // Mock Prices Query
      const mockPricesSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ product_id: "p1", amount: 10 }],
            error: null,
          }),
        }),
      });

      (supabase.from as any)
        .mockReturnValueOnce({ select: mockRegionSelect }) // First call for region
        .mockReturnValueOnce({ select: mockPricesSelect }); // Second call for prices

      const prices = await pricingService.getPricingForRegion("EU");

      expect(prices).toHaveLength(1);
      expect(prices[0]).toEqual({
        product_id: "p1",
        amount: 10,
        currency_symbol: "€",
      });
    });
  });
});
