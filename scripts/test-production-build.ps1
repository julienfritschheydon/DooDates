#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script pour tester le build de production localement AVANT de déployer

.DESCRIPTION
    Ce script:
    1. Construit l'application en mode production avec les vraies variables d'env
    2. Lance un serveur preview local
    3. Exécute les tests de smoke contre le build de production
    4. Nettoie les processus

    OBJECTIF: Détecter les problèmes AVANT qu'ils n'arrivent en production

.EXAMPLE
    .\scripts\test-production-build.ps1
    
    # Tester avec verbose
    .\scripts\test-production-build.ps1 -Verbose
#>

param(
    [switch]$Verbose,
    [switch]$SkipBuild,
    [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

# Couleurs pour l'output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "🔥 TEST DU BUILD DE PRODUCTION EN LOCAL"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Error "❌ Erreur: package.json non trouvé"
    Write-Error "   Exécutez ce script depuis la racine du projet"
    exit 1
}

# Vérifier que les variables d'environnement sont définies
Write-Info "🔍 Vérification des variables d'environnement..."
if (-not (Test-Path ".env.local")) {
    Write-Warning "⚠️  Fichier .env.local non trouvé"
    Write-Warning "   Les variables d'environnement de production ne seront pas chargées"
    Write-Warning "   Créez un fichier .env.local avec:"
    Write-Warning "   - VITE_SUPABASE_URL"
    Write-Warning "   - VITE_SUPABASE_ANON_KEY"
    Write-Warning "   - VITE_GEMINI_API_KEY"
    Write-Host ""
    $continue = Read-Host "Continuer quand même? (o/N)"
    if ($continue -ne "o" -and $continue -ne "O") {
        Write-Info "Abandon."
        exit 0
    }
} else {
    Write-Success "✅ Fichier .env.local trouvé"
}

# Étape 1: Build de production
if (-not $SkipBuild) {
    Write-Host ""
    Write-Info "📦 ÉTAPE 1/4: Build de production..."
    Write-Info "   Commande: npm run build"
    Write-Host ""
    
    $buildStart = Get-Date
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Échec du build de production"
        exit 1
    }
    
    $buildDuration = (Get-Date) - $buildStart
    Write-Success "✅ Build réussi en $($buildDuration.TotalSeconds.ToString('F1'))s"
} else {
    Write-Warning "⏭️  Build ignoré (--SkipBuild)"
}

# Vérifier que le dossier dist existe
if (-not (Test-Path "dist")) {
    Write-Error "❌ Dossier dist/ non trouvé après le build"
    exit 1
}

Write-Success "✅ Dossier dist/ présent"

# Étape 2: Lancer le serveur preview
Write-Host ""
Write-Info "🚀 ÉTAPE 2/4: Lancement du serveur preview..."
Write-Info "   URL: http://localhost:$Port"
Write-Host ""

# Lancer le serveur en arrière-plan
$previewJob = Start-Job -ScriptBlock {
    param($port)
    Set-Location $using:PWD
    npm run preview -- --port $port --strictPort
} -ArgumentList $Port

# Attendre que le serveur soit prêt
Write-Info "⏳ Attente que le serveur soit prêt..."
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 1
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
        }
    } catch {
        # Le serveur n'est pas encore prêt
    }
    
    if ($Verbose) {
        Write-Host "." -NoNewline
    }
}

if ($Verbose) {
    Write-Host ""
}

if (-not $serverReady) {
    Write-Error "❌ Le serveur n'a pas démarré dans le délai imparti"
    Stop-Job -Job $previewJob -ErrorAction SilentlyContinue
    Remove-Job -Job $previewJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Success "✅ Serveur prêt sur http://localhost:$Port"

# Étape 3: Exécuter les tests de smoke
Write-Host ""
Write-Info "🔥 ÉTAPE 3/4: Exécution des tests de smoke..."
Write-Info "   Fichier: tests/e2e/production-smoke.spec.ts"
Write-Host ""

try {
    # Définir la variable d'environnement BASE_URL pour Playwright
    $env:BASE_URL = "http://localhost:$Port"
    
    # Exécuter les tests
    $testArgs = @(
        "playwright", "test",
        "tests/e2e/production-smoke.spec.ts",
        "--project=chromium",
        "--reporter=list,html"
    )
    
    if ($Verbose) {
        $testArgs += "--verbose"
    }
    
    $testStart = Get-Date
    & npx @testArgs
    $testExitCode = $LASTEXITCODE
    $testDuration = (Get-Date) - $testStart
    
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Success "✅ Tous les tests de smoke ont réussi!"
        Write-Success "   Durée: $($testDuration.TotalSeconds.ToString('F1'))s"
    } else {
        Write-Error "❌ Certains tests de smoke ont échoué"
        Write-Error "   Durée: $($testDuration.TotalSeconds.ToString('F1'))s"
        Write-Warning "   Consultez le rapport HTML: playwright-report/index.html"
    }
    
} finally {
    # Étape 4: Nettoyer
    Write-Host ""
    Write-Info "🧹 ÉTAPE 4/4: Nettoyage..."
    
    # Arrêter le serveur preview
    Stop-Job -Job $previewJob -ErrorAction SilentlyContinue
    Remove-Job -Job $previewJob -Force -ErrorAction SilentlyContinue
    Write-Success "✅ Serveur arrêté"
}

# Résumé final
Write-Host ""
Write-Info "═══════════════════════════════════════════════════════════"
if ($testExitCode -eq 0) {
    Write-Success "✅ TEST DU BUILD DE PRODUCTION: RÉUSSI"
    Write-Success ""
    Write-Success "Votre build de production est prêt à être déployé!"
    Write-Success ""
    Write-Success "Prochaines étapes:"
    Write-Success "  1. Commit et push vers main"
    Write-Success "  2. Le déploiement GitHub Pages se lancera automatiquement"
    Write-Success "  3. Les tests de smoke en production s'exécuteront après le déploiement"
} else {
    Write-Error "❌ TEST DU BUILD DE PRODUCTION: ÉCHEC"
    Write-Error ""
    Write-Error "Votre build de production a des problèmes!"
    Write-Error ""
    Write-Error "Actions recommandées:"
    Write-Error "  1. Consultez le rapport: playwright-report/index.html"
    Write-Error "  2. Corrigez les problèmes identifiés"
    Write-Error "  3. Relancez ce script pour vérifier"
    Write-Error "  4. NE PAS déployer tant que les tests ne passent pas"
}
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

exit $testExitCode

