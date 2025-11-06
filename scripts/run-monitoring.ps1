# Script PowerShell pour exécuter le monitoring avec token GitHub
# Usage: .\scripts\run-monitoring.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$Token = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Repository = ""
)

Write-Host "🔍 Configuration du Monitoring GitHub Actions" -ForegroundColor Cyan
Write-Host ""

# Demander le token si non fourni
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "📝 Entrez votre Personal Access Token GitHub:" -ForegroundColor Yellow
    Write-Host "   (Créez-en un sur: https://github.com/settings/tokens)" -ForegroundColor Gray
    Write-Host "   Permissions nécessaires: repo, workflow" -ForegroundColor Gray
    Write-Host "   (repo inclut déjà les permissions pour les issues)" -ForegroundColor Gray
    Write-Host ""
    $Token = Read-Host -AsSecureString
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
    )
}

# Demander le repository si non fourni
if ([string]::IsNullOrEmpty($Repository)) {
    Write-Host ""
    Write-Host "📦 Entrez le nom du repository (format: owner/repo):" -ForegroundColor Yellow
    Write-Host "   Exemple: votre-org/DooDates" -ForegroundColor Gray
    Write-Host ""
    $Repository = Read-Host
}

# Vérifier que le token commence par ghp_
if (-not $Token.StartsWith("ghp_")) {
    Write-Host ""
    Write-Host "⚠️  Le token devrait commencer par 'ghp_'" -ForegroundColor Yellow
    Write-Host "   Vérifiez que vous avez copié le bon token." -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continuer quand même? (o/N)"
    if ($continue -ne "o" -and $continue -ne "O") {
        Write-Host "❌ Annulé" -ForegroundColor Red
        exit 1
    }
}

# Définir les variables d'environnement
$env:GITHUB_TOKEN = $Token
$env:GITHUB_REPOSITORY = $Repository

Write-Host ""
Write-Host "✅ Configuration terminée" -ForegroundColor Green
Write-Host "   Token: $($Token.Substring(0, [Math]::Min(10, $Token.Length)))..." -ForegroundColor Gray
Write-Host "   Repository: $Repository" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Exécution du monitoring..." -ForegroundColor Cyan
Write-Host ""

# Exécuter le script
node scripts/monitor-workflow-failures.js

Write-Host ""
Write-Host "📊 Vérification du statut..." -ForegroundColor Cyan
Write-Host ""

# Vérifier le statut
node scripts/check-workflow-status.js

Write-Host ""
Write-Host "✅ Terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Fichiers générés:" -ForegroundColor Cyan
Write-Host "   - Docs/monitoring/workflow-failures-report.md" -ForegroundColor Gray
Write-Host "   - Docs/monitoring/workflow-status.json" -ForegroundColor Gray
Write-Host ""

