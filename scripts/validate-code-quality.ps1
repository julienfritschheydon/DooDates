# 🚀 Script de validation de la qualité du code DooDates (PowerShell)
# À exécuter avant chaque commit ou PR

Write-Host "🔍 Validation de la qualité du code DooDates..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Fonction pour vérifier une commande
function Test-Command {
    param(
        [string]$Name,
        [string]$Command
    )
    
    Write-Host "📋 $Name..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Name - OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Name - ÉCHEC" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ $Name - ÉCHEC" -ForegroundColor Red
        return $false
    }
}

# 1. Vérification TypeScript
$typeCheck = Test-Command "1/5 Vérification TypeScript" "npm run type-check"

# 2. Linting (objectif: 30 warnings max)
Write-Host "📋 2/5 Vérification Linting (max 30 warnings)..." -ForegroundColor Yellow
$lintOutput = npm run lint -- --max-warnings=30 2>&1
$lintResult = $LASTEXITCODE

# Extraire le nombre de warnings
if ($lintOutput -match "✖ (\d+) problems") {
    $warningsCount = [int]$matches[1]
} else {
    $warningsCount = 0
}

if ($lintResult -eq 0 -and $warningsCount -le 30) {
    Write-Host "✅ Linting - OK ($warningsCount warnings)" -ForegroundColor Green
    $lintSuccess = $true
} else {
    Write-Host "❌ Linting - ÉCHEC ($warningsCount warnings > 30)" -ForegroundColor Red
    Write-Host $lintOutput[-20..-1] -ForegroundColor Red
    $lintSuccess = $false
}

# 3. Tests unitaires
$unitTests = Test-Command "3/5 Tests unitaires" "npm run test:unit"

# 4. Build production
$build = Test-Command "4/5 Build production" "npm run build"

# 5. Vérification des imports non utilisés
$unusedImports = Test-Command "5/5 Vérification imports non utilisés" "npx ts-unused-exports tsconfig.json --ignoreUnusedExports 2>`$null"

# Résumé
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DE LA VALIDATION" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$totalErrors = 0

# Vérifier chaque étape
if (-not $typeCheck) { $totalErrors++ }
if (-not $lintSuccess) { $totalErrors++ }
if (-not $unitTests) { $totalErrors++ }
if (-not $build) { $totalErrors++ }
if (-not $unusedImports) { $totalErrors++ }

# Résultat final
if ($totalErrors -eq 0) {
    Write-Host ""
    Write-Host "🎉 VALIDATION RÉUSSIE !" -ForegroundColor Green
    Write-Host "✅ Le code est prêt pour le commit/PR" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Statistiques :" -ForegroundColor Cyan
    Write-Host "   - Warnings ESLint : $warningsCount/30" -ForegroundColor Cyan
    Write-Host "   - Tests unitaires : ✅" -ForegroundColor Cyan
    Write-Host "   - Build : ✅" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "🚨 VALIDATION ÉCHOUÉE !" -ForegroundColor Red
    Write-Host "❌ Corrigez les erreurs avant de committer" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Actions requises :" -ForegroundColor Yellow
    Write-Host "   1. Corriger les erreurs TypeScript" -ForegroundColor Yellow
    Write-Host "   2. Réduire les warnings ESLint sous 30" -ForegroundColor Yellow
    Write-Host "   3. Faire passer les tests unitaires" -ForegroundColor Yellow
    Write-Host "   4. Assurer que le build fonctionne" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📚 Référez-vous à : Docs/DEVELOPMENT-GUIDELINES.md" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
