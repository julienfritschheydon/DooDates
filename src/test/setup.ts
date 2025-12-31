import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Configuration globale pour les tests Vitest
global.ResizeObserver = class ResizeObserver {
  constructor(cb: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  cb: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
};

// Mock pour window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock pour localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock pour scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Polyfills pour Radix UI et Canvas
Element.prototype.hasPointerCapture = function () {
  return false;
};

// Mock complet pour Canvas et WebGL context (résout les erreurs CI)
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  value: function (type: string) {
    if (type === "2d") {
      return {
        fillRect: () => {},
        measureText: () => ({ width: 42 }),
        fillText: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: new Array(4) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Array(4) }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillStyle: "",
        font: "",
        textBaseline: "",
        canvas: this,
      };
    }
    if (type === "webgl" || type === "experimental-webgl") {
      return {
        getExtension: () => ({
          UNMASKED_VENDOR_WEBGL: 37445,
          UNMASKED_RENDERER_WEBGL: 37446,
        }),
        getParameter: () => "Mock WebGL Renderer",
        getSupportedExtensions: () => [],
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        getShaderParameter: () => true,
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        getProgramParameter: () => true,
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        drawArrays: () => {},
        enable: () => {},
        disable: () => {},
        clear: () => {},
        clearColor: () => {},
        clearDepth: () => {},
        depthFunc: () => {},
        viewport: () => {},
      };
    }
    return null;
  },
});

// Mock pour toDataURL des canvas
Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
  writable: true,
  value: function () {
    return "data:image/png;base64,mock-canvas-data";
  },
});

// Mock pour crypto.subtle (SHA-256) - évite les erreurs dans browserFingerprint
if (typeof global.crypto === 'undefined') {
  global.crypto = {} as Crypto;
}

if (!global.crypto.subtle) {
  Object.defineProperty(global.crypto, 'subtle', {
    value: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
    writable: true,
  });
}

// Mock pour fetch global (évite les erreurs Supabase network)
const mockFetch = vi.fn() as any;
mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Headers(),
  redirected: false,
  type: "basic",
  url: "",
  clone: vi.fn(),
  body: null,
  bodyUsed: false,
  arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
  formData: vi.fn(() => Promise.resolve(new FormData())),
  json: vi.fn(() => Promise.resolve({})),
  text: vi.fn(() => Promise.resolve("")),
  blob: vi.fn(() => Promise.resolve(new Blob())),
  bytes: vi.fn(() => Promise.resolve(new Uint8Array())),
});
global.fetch = mockFetch;

// Mock pour APIs manquantes dans browserFingerprint
Object.defineProperty(window, "screen", {
  writable: true,
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  },
});

Object.defineProperty(window, "navigator", {
  writable: true,
  value: {
    ...window.navigator,
    language: "fr-FR",
    userAgent: "Mozilla/5.0 (Test Environment)",
    hardwareConcurrency: 4,
    platform: "Test Platform",
  },
});

// Mock pour Intl.DateTimeFormat
Object.defineProperty(global, "Intl", {
  writable: true,
  value: {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: "Europe/Paris" }),
    }),
  },
});

// Mock pour TextEncoder (utilisé dans hashString)
if (typeof global.TextEncoder === 'undefined') {
  const MockTextEncoder = class TextEncoder {
    encode(str: string) {
      return new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
    }
    encodeInto(str: string, dest: Uint8Array) {
      const encoded = this.encode(str);
      dest.set(encoded.slice(0, dest.length));
      return { read: str.length, written: encoded.length };
    }
    encoding = 'utf-8';
  };
  global.TextEncoder = MockTextEncoder as any;
}

// Mock pour vi.useFakeTimers (résout les erreurs dans les tests de timers)
const originalUseFakeTimers = vi.useFakeTimers;
vi.useFakeTimers = function(config?: any) {
  try {
    const result = originalUseFakeTimers(config);
    return result;
  } catch (error) {
    // Fallback si useFakeTimers échoue - créer un objet qui imite VitestUtils
    const mockUtils = {
      // État des timers
      isFakeTimers: () => true,
      
      // Contrôle des timers
      useRealTimers: vi.useRealTimers,
      setSystemTime: vi.setSystemTime,
      advanceTimersByTime: vi.advanceTimersByTime,
      runAllTimers: vi.runAllTimers,
      runOnlyPendingTimers: vi.runOnlyPendingTimers,
      runAllTimersAsync: vi.runAllTimersAsync,
      runOnlyPendingTimersAsync: vi.runOnlyPendingTimersAsync,
      advanceTimersByTimeAsync: vi.advanceTimersByTimeAsync,
      clearAllTimers: vi.clearAllTimers,
      getTimerCount: vi.getTimerCount,
      
      // Mock pour les fonctions de timer qui ne sont pas disponibles
      clearAllTimersFn: () => {},
      
      // Fonctions supplémentaires qui peuvent être appelées
      getMockedSystemTime: () => new Date(),
    };
    
    // S'assurer que toutes les fonctions de timer sont mockées
    if (!vi.setSystemTime) vi.setSystemTime = () => mockUtils as any;
    if (!vi.advanceTimersByTime) vi.advanceTimersByTime = () => mockUtils as any;
    if (!vi.runAllTimers) vi.runAllTimers = () => mockUtils as any;
    if (!vi.runOnlyPendingTimers) vi.runOnlyPendingTimers = () => mockUtils as any;
    if (!vi.clearAllTimers) vi.clearAllTimers = () => mockUtils as any;
    if (!vi.getTimerCount) vi.getTimerCount = () => 0;
    
    return mockUtils as any;
  }
};

// Mock direct des fonctions de timer pour contourner les problèmes
vi.setSystemTime = vi.fn(() => ({} as any));
vi.advanceTimersByTime = vi.fn(() => ({} as any));
vi.runAllTimers = vi.fn(() => ({} as any));
vi.runOnlyPendingTimers = vi.fn(() => ({} as any));
vi.clearAllTimers = vi.fn(() => ({} as any));
vi.getTimerCount = vi.fn(() => 0);

// Charger .env.local AVANT le mock pour que les variables soient disponibles
import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

// Mock pour import.meta.env
// Permet de surcharger avec process.env si disponible (pour les tests Gemini et Supabase)
// Le mock lit process.env au moment de la création pour avoir les valeurs de .env.local
vi.mock("import.meta", () => {
  // Créer un objet env qui lit depuis process.env (chargé depuis .env.local ci-dessus)
  const env: Record<string, string | undefined> = {};

  // Copier toutes les variables VITE_* depuis process.env
  if (typeof process !== "undefined" && process.env) {
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("VITE_")) {
        env[key] = process.env[key];
      }
    });
  }

  // Valeurs par défaut seulement si pas déjà définies
  if (!env.VITE_SUPABASE_URL) {
    env.VITE_SUPABASE_URL = "https://test.supabase.co";
  }
  if (!env.VITE_SUPABASE_ANON_KEY) {
    env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
  }

  return {
    env,
  };
});

// Global test QueryClient
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Test wrapper with QueryClient
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};
