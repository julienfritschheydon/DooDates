// Setup des tests Jest
import * as dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: '.env.local' });

// Configuration des timeouts pour les tests Gemini
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';

// Vérifier que l'API key est chargée
if (process.env.VITE_GEMINI_API_KEY) {
  console.log('✅ API key Gemini chargée pour les tests');
} else {
  console.warn('⚠️ API key Gemini non trouvée dans .env.local');
}

// Mock des console.log pour les tests sauf erreurs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Configuration pour les tests asynchrones
if (typeof global !== 'undefined') {
  global.setTimeout = setTimeout;
} 