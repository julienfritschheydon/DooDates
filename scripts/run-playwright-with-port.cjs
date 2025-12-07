#!/usr/bin/env node
/**
 * Script wrapper cross-platform pour exécuter Playwright avec un port FIXE
 * Compatible Windows, Linux, macOS
 *
 * Objectif : aligner le port utilisé par Playwright avec la config Vite/Playwright
 * qui utilise déjà 8080 (baseURL + webServer.url).
 */

const { execSync } = require('child_process');

// Pour les E2E, on utilise un port FIXE (8080) afin d'être aligné
// avec la configuration Vite et les configs Playwright en CI.
// On garde la structure du script pour rester cross-platform.
function getPort() {
  return process.env.PORT || '8080';
}

// Récupérer les arguments passés au script
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node run-playwright-with-port.cjs <playwright-args>');
  process.exit(1);
}

// Obtenir le port à utiliser (fixe: 8080 par défaut)
const port = getPort();

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
