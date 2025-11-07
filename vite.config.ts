import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL pour GitHub Pages
  // En CI (tests pre-merge), on utilise '/' pour tester localement
  // En production (deploy), on utilise '/DooDates/' pour GitHub Pages
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/DooDates/' : '/'),
  
  server: {
    port: 8080,
    host: true, // Expose sur le réseau local
    hmr: {
      overlay: false,
    },
    // Optionnel : Ouvrir automatiquement le navigateur
    // open: true,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env': 'import.meta.env',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Note: Vite charge automatiquement les variables VITE_* dans import.meta.env
    // Pas besoin de les redéfinir ici, cela peut causer des conflits
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'gemini-vendor': ['@google/generative-ai']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
    ],
  },
});
