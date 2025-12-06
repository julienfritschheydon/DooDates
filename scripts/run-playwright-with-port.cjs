#!/usr/bin/env node
/**
 * Script wrapper cross-platform pour exécuter Playwright avec un port dynamique
 * Compatible Windows, Linux, macOS
 */

const { execSync } = require('child_process');

// Obtenir un port libre
function getFreePort() {
  try {
    // Utiliser get-port-cli pour obtenir un port libre
    const port = execSync('npx -y get-port-cli', { encoding: 'utf-8' }).trim();
    return port;
  } catch (error) {
    // Fallback: utiliser un port par défaut
    console.warn('⚠️  Impossible d\'obtenir un port libre, utilisation du port 3000 par défaut');
    return '3000';
  }
}

// Récupérer les arguments passés au script
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node run-playwright-with-port.cjs <playwright-args>');
  process.exit(1);
}

// Obtenir un port libre
const port = getFreePort();

// Définir la variable d'environnement PORT
process.env.PORT = port;

console.log(`🔌 Port utilisé: ${port}`);

// Exécuter playwright avec les arguments passés
const playwrightCommand = `playwright ${args.join(' ')}`;

console.log(`🚀 Exécution: ${playwrightCommand}`);

try {
  // Utiliser execSync pour capturer correctement le code de sortie
  execSync(playwrightCommand, {
    env: { ...process.env, PORT: port },
    stdio: 'inherit',
  });
  // Si on arrive ici, c'est que la commande a réussi
  process.exit(0);
} catch (error) {
  // execSync lance une exception si le code de sortie n'est pas 0
  const exitCode = error.status || 1;
  process.exit(exitCode);
}
