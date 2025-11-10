#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Exécute les tests Playwright en mode CI (comme sur GitHub Actions)

.DESCRIPTION
    Ce script reproduit l'environnement CI pour tester localement les mêmes conditions
    que sur GitHub Actions, sans avoir à pusher à chaque fois.

.PARAMETER Project
    Le projet Playwright à tester (chromium, firefox, webkit, Mobile Safari, Mobile Chrome)
    Par défaut: tous les projets

.EXAMPLE
    .\run-tests-like-ci.ps1
    .\run-tests-like-ci.ps1 -Project "webkit"
    .\run-tests-like-ci.ps1 -Project "Mobile Safari"
#>

param(
    [string]$Project = ""
)

Write-Host "🤖 Exécution des tests en mode CI" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Variables d'environnement CI
$env:CI = "true"
$env:GITHUB_ACTIONS = "true"

Write-Host "✅ Variables CI configurées" -ForegroundColor Green
Write-Host "   - CI=true" -ForegroundColor Gray
Write-Host "   - GITHUB_ACTIONS=true" -ForegroundColor Gray

# Charger les credentials depuis .env.local si disponible (comme sur CI via secrets)
$envLocalPath = ".env.local"
if (Test-Path $envLocalPath) {
    Write-Host "   - Chargement des credentials depuis .env.local" -ForegroundColor Gray
    Get-Content $envLocalPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "Env:\$key" -Value $value
        }
    }
    Write-Host "   - ✅ Credentials Supabase chargées (comme sur CI)" -ForegroundColor Green
} else {
    Write-Host "   - ⚠️ .env.local non trouvé - tests d'intégration seront skippés" -ForegroundColor Yellow
}
Write-Host ""

# Construire la commande Playwright
$playwrightCmd = "npx playwright test"

if ($Project) {
    $playwrightCmd += " --project=`"$Project`""
    Write-Host "🎯 Projet ciblé: $Project" -ForegroundColor Yellow
} else {
    Write-Host "🎯 Tous les projets" -ForegroundColor Yellow
}

# Ajouter les reporters (comme sur CI)
$playwrightCmd += " --reporter=html --reporter=json"

Write-Host ""
Write-Host "🚀 Lancement des tests..." -ForegroundColor Cyan
Write-Host "   Commande: $playwrightCmd" -ForegroundColor Gray
Write-Host ""

# Exécuter les tests
Invoke-Expression $playwrightCmd
$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Tests réussis !" -ForegroundColor Green
} else {
    Write-Host "❌ Tests échoués (exit code: $exitCode)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 Consulter les résultats:" -ForegroundColor Yellow
    Write-Host "   - HTML: playwright-report/index.html" -ForegroundColor Gray
    Write-Host "   - JSON: test-results.json" -ForegroundColor Gray
}

exit $exitCode
