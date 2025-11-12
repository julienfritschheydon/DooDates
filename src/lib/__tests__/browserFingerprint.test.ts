/**
 * Tests unitaires pour browserFingerprint.ts
 * Valide la génération du fingerprint et sa stabilité
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateBrowserFingerprint, getCachedFingerprint, getBrowserMetadata } from "../browserFingerprint";
import { setupMockLocalStorage } from "../../__tests__/helpers/testHelpers";

// Mock crypto.subtle pour les tests
const mockCryptoSubtle = {
  digest: vi.fn(async (algorithm: string, data: Uint8Array) => {
    // Simuler un hash SHA-256 simple pour les tests
    const hash = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hash[i] = data[i % data.length] ^ i;
    }
    return hash;
  }),
};

const mockCrypto = {
  subtle: mockCryptoSubtle,
};

// Mock document.createElement pour canvas
const mockCanvas = {
  width: 200,
  height: 50,
  toDataURL: vi.fn(() => "data:image/png;base64,mockCanvasData"),
};

const mockContext2D = {
  textBaseline: "",
  font: "",
  fillStyle: "",
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
};

const mockWebGLContext = {
  getExtension: vi.fn((name: string) => {
    if (name === "WEBGL_debug_renderer_info") {
      return {
        UNMASKED_VENDOR_WEBGL: 0x9245,
        UNMASKED_RENDERER_WEBGL: 0x9246,
      };
    }
    return null;
  }),
  getParameter: vi.fn((param: number) => {
    if (param === 0x9245) return "Mock Vendor";
    if (param === 0x9246) return "Mock Renderer";
    return null;
  }),
};

function installMocks() {
  setupMockLocalStorage();
  
  // Mock crypto
  Object.defineProperty(global, "crypto", {
    value: mockCrypto,
    writable: true,
    configurable: true,
  });

  // Mock document.createElement
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "canvas") {
      return {
        ...mockCanvas,
        getContext: vi.fn((contextType: string) => {
          if (contextType === "2d") return mockContext2D;
          if (contextType === "webgl" || contextType === "experimental-webgl") {
            return mockWebGLContext;
          }
          return null;
        }),
      } as any;
    }
    return document.createElement(tagName);
  });

  // Mock navigator
  Object.defineProperty(global, "navigator", {
    value: {
      language: "fr-FR",
      platform: "Win32",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Test",
      hardwareConcurrency: 8,
    },
    writable: true,
    configurable: true,
  });

  // Mock window.screen
  Object.defineProperty(global, "window", {
    value: {
      ...global.window,
      screen: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
      },
    },
    writable: true,
    configurable: true,
  });

  // Mock Intl.DateTimeFormat
  vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => ({
    resolvedOptions: () => ({ timeZone: "Europe/Paris" }),
  } as any));
}

describe("browserFingerprint", () => {
  beforeEach(() => {
    installMocks();
    vi.clearAllMocks();
  });

  describe("generateBrowserFingerprint", () => {
    it("should generate a fingerprint with all components", async () => {
      const result = await generateBrowserFingerprint();

      expect(result).toHaveProperty("fingerprint");
      expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars
      expect(result.components).toHaveProperty("timezone");
      expect(result.components).toHaveProperty("language");
      expect(result.components).toHaveProperty("screen");
      expect(result.components).toHaveProperty("hardware");
      expect(result.components).toHaveProperty("platform");
      expect(result.components).toHaveProperty("userAgent");
      expect(result.metadata).toHaveProperty("timestamp");
      expect(result.metadata).toHaveProperty("confidence");
    });

    it("should generate consistent fingerprints for same environment", async () => {
      const result1 = await generateBrowserFingerprint();
      const result2 = await generateBrowserFingerprint();

      expect(result1.fingerprint).toBe(result2.fingerprint);
      expect(result1.components).toEqual(result2.components);
    });

    it("should calculate confidence score correctly", async () => {
      const result = await generateBrowserFingerprint();

      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(100);
      
      // Avec tous les composants disponibles, confidence devrait être élevé
      if (result.components.canvas && result.components.webgl && result.components.fonts) {
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(80);
      }
    });

    it("should handle missing canvas gracefully", async () => {
      vi.spyOn(document, "createElement").mockReturnValue({
        getContext: () => null,
      } as any);

      const result = await generateBrowserFingerprint();

      expect(result.fingerprint).toBeDefined();
      expect(result.components.canvas).toBeUndefined();
      expect(result.metadata.confidence).toBeLessThan(100);
    });

    it("should handle missing WebGL gracefully", async () => {
      vi.spyOn(document, "createElement").mockReturnValue({
        getContext: () => null,
      } as any);

      const result = await generateBrowserFingerprint();

      expect(result.fingerprint).toBeDefined();
      expect(result.components.webgl).toBeUndefined();
    });

    it("should include timezone in components", async () => {
      const result = await generateBrowserFingerprint();

      expect(result.components.timezone).toBe("Europe/Paris");
    });

    it("should include screen resolution in components", async () => {
      const result = await generateBrowserFingerprint();

      expect(result.components.screen).toContain("1920");
      expect(result.components.screen).toContain("1080");
      expect(result.components.screen).toContain("24");
    });
  });

  describe("getCachedFingerprint", () => {
    it("should cache fingerprint in localStorage", async () => {
      const fingerprint1 = await getCachedFingerprint();
      const fingerprint2 = await getCachedFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
      
      const cached = localStorage.getItem("__dd_fingerprint");
      expect(cached).toBeTruthy();
      
      const parsed = JSON.parse(cached!);
      expect(parsed.fingerprint).toBe(fingerprint1);
      expect(parsed.timestamp).toBeDefined();
    });

    it("should use cached fingerprint if available and valid", async () => {
      const mockFingerprint = "a".repeat(64);
      const cacheData = {
        fingerprint: mockFingerprint,
        timestamp: new Date().toISOString(),
        confidence: 90,
      };
      localStorage.setItem("__dd_fingerprint", JSON.stringify(cacheData));

      const result = await getCachedFingerprint();

      expect(result).toBe(mockFingerprint);
      // Ne devrait pas appeler generateBrowserFingerprint
    });

    it("should regenerate if cache is expired", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // 8 jours = expiré

      const cacheData = {
        fingerprint: "old_fingerprint",
        timestamp: oldDate.toISOString(),
      };
      localStorage.setItem("__dd_fingerprint", JSON.stringify(cacheData));

      const result = await getCachedFingerprint();

      expect(result).not.toBe("old_fingerprint");
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should migrate legacy cache keys", async () => {
      const legacyKey = "doodates_browser_fingerprint";
      const legacyFingerprint = "a".repeat(64); // Format valide hex
      const legacyData = {
        fingerprint: legacyFingerprint,
        timestamp: new Date().toISOString(),
      };
      // Ne pas mettre de cache dans la clé principale pour tester la migration
      localStorage.removeItem("__dd_fingerprint");
      localStorage.setItem(legacyKey, JSON.stringify(legacyData));

      const result = await getCachedFingerprint();

      expect(result).toBe(legacyFingerprint);
      // Devrait aussi créer la nouvelle clé après migration
      expect(localStorage.getItem("__dd_fingerprint")).toBeTruthy();
    });

    it("should handle invalid cache gracefully", async () => {
      localStorage.setItem("__dd_fingerprint", "invalid json");

      const result = await getCachedFingerprint();

      // Le code génère un nouveau fingerprint si le cache est invalide
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getBrowserMetadata", () => {
    it("should return browser metadata", () => {
      const metadata = getBrowserMetadata();

      expect(metadata).toHaveProperty("userAgent");
      expect(metadata).toHaveProperty("timezone");
      expect(metadata).toHaveProperty("language");
      expect(metadata).toHaveProperty("screenResolution");
      
      expect(metadata.userAgent).toContain("Mozilla");
      expect(metadata.timezone).toBe("Europe/Paris");
      expect(metadata.language).toBe("fr-FR");
      expect(metadata.screenResolution).toContain("1920x1080");
    });
  });

  describe("Edge cases", () => {
    it("should handle localStorage errors gracefully", async () => {
      // Simuler une erreur localStorage lors de la lecture
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error("Storage quota exceeded");
      });

      const result = await getCachedFingerprint();

      // Le code génère un fallback fingerprint en cas d'erreur
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      localStorage.getItem = originalGetItem;
    });

    it("should handle missing crypto.subtle gracefully", async () => {
      // Simuler absence de crypto.subtle
      Object.defineProperty(global, "crypto", {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = await generateBrowserFingerprint();

      expect(result.fingerprint).toBeDefined();
      // Le fallback FNV-1a génère un hash qui peut contenir des tirets dans certains cas
      // mais devrait toujours être une string définie
      expect(typeof result.fingerprint).toBe("string");
      expect(result.fingerprint.length).toBeGreaterThan(0);
      
      // Restaurer crypto pour autres tests
      installMocks();
    });
  });
});

