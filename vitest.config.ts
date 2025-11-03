/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': '"https://test.supabase.co"',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '"test-anon-key"'
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Optimisations pour exécution parallèle
    maxWorkers: 4,
    minWorkers: 2,
    pool: 'threads',  // Threads plus rapides que forks
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    include: [
      'src/**/*.test.{ts,tsx}',
    ],
    // Ne pas collecter les tests Playwright E2E avec Vitest
    exclude: [
      'node_modules/**',
      'tests/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'text'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});