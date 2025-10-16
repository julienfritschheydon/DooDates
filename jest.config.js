/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/src/lib/__tests__/',  // Vitest tests
    '<rootDir>/src/hooks/__tests__/', // Vitest tests
    '<rootDir>/src/components/__tests__/', // Vitest tests
    '<rootDir>/src/lib/storage/__tests__/', // Vitest tests
    '<rootDir>/src/lib/services/__tests__/', // Vitest tests
    '<rootDir>/src/utils/__tests__/', // Vitest tests
    'vitest', // Exclude any file importing vitest
  ],
  transform: {
    '^.+\\.(ts|tsx)$': '<rootDir>/tests/import-meta-transformer.cjs'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globals: {
    'import.meta': {
      env: {
        DEV: false,
        PROD: true,
        VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      }
    }
  },
  testTimeout: 30000, // 30s pour les tests Gemini
  collectCoverage: false,
  collectCoverageFrom: [
    'src/lib/gemini.ts',
    'src/lib/enhanced-gemini.ts',
    'src/lib/temporal-parser.ts'
  ],
  verbose: true,
  maxWorkers: 1 // Un seul worker pour éviter les limits de rate Gemini
};