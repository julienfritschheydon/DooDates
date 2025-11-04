#!/bin/bash
# Script pour tester la documentation en mode production (simulant GitHub Pages)
# Usage: bash scripts/test-docs-production.sh

set -e

echo "🚀 Test de la documentation en mode production"
echo "================================================"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
  exit 1
fi

# Étape 1: Build production
echo ""
echo "📦 Étape 1: Build de production..."
NODE_ENV=production npm run build

# Vérifier que le build a réussi
if [ ! -d "dist" ]; then
  echo "❌ Erreur: Le répertoire dist/ n'existe pas après le build"
  exit 1
fi

echo "✅ Build terminé"

# Étape 2: Installer serve si nécessaire
echo ""
echo "📦 Étape 2: Vérification de serve..."
if ! command -v serve &> /dev/null; then
  echo "   Installation de serve..."
  npm install -g serve
fi

# Étape 3: Démarrer le serveur avec base path
echo ""
echo "🌐 Étape 3: Démarrage du serveur de production sur http://localhost:4173/DooDates/"
echo "   (Le serveur sera arrêté automatiquement après les tests)"
echo ""

# Démarrer serve en arrière-plan
serve dist -s -p 4173 --listen &
SERVER_PID=$!

# Fonction de nettoyage
cleanup() {
  echo ""
  echo "🧹 Arrêt du serveur..."
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
}

# S'assurer que le serveur est arrêté à la fin
trap cleanup EXIT

# Attendre que le serveur démarre
echo "   Attente du démarrage du serveur..."
sleep 3

# Vérifier que le serveur répond
if ! curl -s http://localhost:4173/DooDates/ > /dev/null; then
  echo "❌ Erreur: Le serveur ne répond pas sur http://localhost:4173/DooDates/"
  exit 1
fi

echo "✅ Serveur démarré"

# Étape 4: Tests manuels
echo ""
echo "🧪 Étape 4: Tests manuels"
echo "   Ouvrez votre navigateur et testez:"
echo "   - http://localhost:4173/DooDates/docs"
echo "   - http://localhost:4173/DooDates/docs/01-Guide-Demarrage-Rapide"
echo ""
echo "   Vérifiez dans la console du navigateur (F12) qu'il n'y a pas d'erreurs 404"
echo "   pour les fichiers JS/CSS (comme Docs-*.js, react-vendor-*.js, etc.)"
echo ""
echo "   Appuyez sur Entrée pour arrêter le serveur et terminer les tests..."

# Attendre que l'utilisateur appuie sur Entrée
read

echo ""
echo "✅ Tests terminés"

