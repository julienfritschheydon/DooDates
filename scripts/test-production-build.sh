#!/bin/bash
# Script pour tester le build de production localement AVANT de déployer
#
# Ce script:
# 1. Construit l'application en mode production avec les vraies variables d'env
# 2. Lance un serveur preview local
# 3. Exécute les tests de smoke contre le build de production
# 4. Nettoie les processus
#
# OBJECTIF: Détecter les problèmes AVANT qu'ils n'arrivent en production
#
# Usage:
#   ./scripts/test-production-build.sh
#   ./scripts/test-production-build.sh --skip-build
#   ./scripts/test-production-build.sh --verbose

set -e  # Exit on error

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions d'affichage
print_success() { echo -e "${GREEN}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }
print_info() { echo -e "${CYAN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }

# Variables
SKIP_BUILD=false
VERBOSE=false
PORT=4173
PREVIEW_PID=""

# Parser les arguments
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --port=*)
            PORT="${arg#*=}"
            shift
            ;;
        *)
            ;;
    esac
done

# Fonction de nettoyage
cleanup() {
    print_info "\n🧹 Nettoyage..."
    if [ -n "$PREVIEW_PID" ]; then
        kill $PREVIEW_PID 2>/dev/null || true
        print_success "✅ Serveur arrêté"
    fi
}

# S'assurer que le nettoyage se fait en cas d'erreur ou d'interruption
trap cleanup EXIT INT TERM

print_info "═══════════════════════════════════════════════════════════"
print_info "🔥 TEST DU BUILD DE PRODUCTION EN LOCAL"
print_info "═══════════════════════════════════════════════════════════"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "❌ Erreur: package.json non trouvé"
    print_error "   Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Vérifier que les variables d'environnement sont définies
print_info "🔍 Vérification des variables d'environnement..."
if [ ! -f ".env.local" ]; then
    print_warning "⚠️  Fichier .env.local non trouvé"
    print_warning "   Les variables d'environnement de production ne seront pas chargées"
    print_warning "   Créez un fichier .env.local avec:"
    print_warning "   - VITE_SUPABASE_URL"
    print_warning "   - VITE_SUPABASE_ANON_KEY"
    print_warning "   - VITE_GEMINI_API_KEY"
    echo ""
    read -p "Continuer quand même? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        print_info "Abandon."
        exit 0
    fi
else
    print_success "✅ Fichier .env.local trouvé"
fi

# Étape 1: Build de production
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    print_info "📦 ÉTAPE 1/4: Build de production..."
    print_info "   Commande: npm run build"
    echo ""
    
    BUILD_START=$(date +%s)
    npm run build
    BUILD_END=$(date +%s)
    BUILD_DURATION=$((BUILD_END - BUILD_START))
    
    print_success "✅ Build réussi en ${BUILD_DURATION}s"
else
    print_warning "⏭️  Build ignoré (--skip-build)"
fi

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
    print_error "❌ Dossier dist/ non trouvé après le build"
    exit 1
fi

print_success "✅ Dossier dist/ présent"

# Étape 2: Lancer le serveur preview
echo ""
print_info "🚀 ÉTAPE 2/4: Lancement du serveur preview..."
print_info "   URL: http://localhost:$PORT"
echo ""

# Lancer le serveur en arrière-plan
npm run preview -- --port $PORT --strictPort > /dev/null 2>&1 &
PREVIEW_PID=$!

# Attendre que le serveur soit prêt
print_info "⏳ Attente que le serveur soit prêt..."
MAX_ATTEMPTS=30
ATTEMPT=0
SERVER_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$SERVER_READY" = false ]; do
    sleep 1
    ATTEMPT=$((ATTEMPT + 1))
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null | grep -q "200"; then
        SERVER_READY=true
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo -n "."
    fi
done

if [ "$VERBOSE" = true ]; then
    echo ""
fi

if [ "$SERVER_READY" = false ]; then
    print_error "❌ Le serveur n'a pas démarré dans le délai imparti"
    exit 1
fi

print_success "✅ Serveur prêt sur http://localhost:$PORT"

# Étape 3: Exécuter les tests de smoke
echo ""
print_info "🔥 ÉTAPE 3/4: Exécution des tests de smoke..."
print_info "   Fichier: tests/e2e/production-smoke.spec.ts"
echo ""

# Définir la variable d'environnement BASE_URL pour Playwright
export BASE_URL="http://localhost:$PORT"

# Exécuter les tests
TEST_ARGS="playwright test tests/e2e/production-smoke.spec.ts --project=chromium --reporter=list,html"

if [ "$VERBOSE" = true ]; then
    TEST_ARGS="$TEST_ARGS --verbose"
fi

TEST_START=$(date +%s)
set +e  # Ne pas quitter en cas d'échec des tests
npx $TEST_ARGS
TEST_EXIT_CODE=$?
set -e
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))

echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "✅ Tous les tests de smoke ont réussi!"
    print_success "   Durée: ${TEST_DURATION}s"
else
    print_error "❌ Certains tests de smoke ont échoué"
    print_error "   Durée: ${TEST_DURATION}s"
    print_warning "   Consultez le rapport HTML: playwright-report/index.html"
fi

# Résumé final
echo ""
print_info "═══════════════════════════════════════════════════════════"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "✅ TEST DU BUILD DE PRODUCTION: RÉUSSI"
    print_success ""
    print_success "Votre build de production est prêt à être déployé!"
    print_success ""
    print_success "Prochaines étapes:"
    print_success "  1. Commit et push vers main"
    print_success "  2. Le déploiement GitHub Pages se lancera automatiquement"
    print_success "  3. Les tests de smoke en production s'exécuteront après le déploiement"
else
    print_error "❌ TEST DU BUILD DE PRODUCTION: ÉCHEC"
    print_error ""
    print_error "Votre build de production a des problèmes!"
    print_error ""
    print_error "Actions recommandées:"
    print_error "  1. Consultez le rapport: playwright-report/index.html"
    print_error "  2. Corrigez les problèmes identifiés"
    print_error "  3. Relancez ce script pour vérifier"
    print_error "  4. NE PAS déployer tant que les tests ne passent pas"
fi
print_info "═══════════════════════════════════════════════════════════"
echo ""

exit $TEST_EXIT_CODE

