import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Charger .env.local avant la config
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false });

export default defineConfig({
    plugins: [react()],
    define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://test.supabase.co'),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key'),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || ''),
        'import.meta.env.VITE_USE_DIRECT_GEMINI': '"true"',
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        testTimeout: 120000, // 2 minutes par test (appels Gemini lents)
        hookTimeout: 30000,
        include: [
            'src/test/gemini-tests/*.manual.ts',
            'src/test/gemini-comprehensive.manual.ts',
            'src/test/gemini-professional.manual.ts',
            'src/test/prompts-generation.manual.ts',
            'src/test/temporal-prompts-validation.manual.ts',
            'src/test/gemini-tests/*.test.ts',
            'src/test/gemini-comprehensive.test.ts',
            'src/test/gemini-professional.test.ts',
            'src/test/prompts-generation.test.ts',
            'src/test/temporal-prompts-validation.test.ts',
        ],
        exclude: [
            'node_modules/**',
            'tests/**',
        ],
        // Exécuter les tests séquentiellement pour éviter le rate limiting
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        // Reporter verbose pour voir les détails
        reporters: ['default'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
