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
