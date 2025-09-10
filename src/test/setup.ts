import "@testing-library/jest-dom/vitest";
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Configuration globale pour les tests Vitest
global.ResizeObserver = class ResizeObserver {
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  cb: any;
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

// Mock pour import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

// Global test QueryClient
export const createTestQueryClient = () => new QueryClient({
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
