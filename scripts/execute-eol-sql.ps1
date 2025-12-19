# PowerShell script to execute EOL SQL script
# This script helps execute sql-scripts/eol-remove-polls-created.sql

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 EOL Script: Suppression de polls_created" -ForegroundColor Cyan
Write-Host ""

# Get SQL file path
$sqlFile = Join-Path $PSScriptRoot "..\sql-scripts\eol-remove-polls-created.sql"
$sqlFile = Resolve-Path $sqlFile

Write-Host "📄 SQL file: $sqlFile" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN - Contenu du script SQL:" -ForegroundColor Yellow
    Write-Host ""
    Get-Content $sqlFile
    Write-Host ""
    Write-Host "✅ Dry run terminé. Pour exécuter, relancez sans -DryRun" -ForegroundColor Green
    exit 0
}

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "⚠️  psql n'est pas installé ou pas dans PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Méthode recommandée: Supabase Dashboard SQL Editor" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Ouvrez: https://supabase.com/dashboard/project/outmbbisrrdiumlweira/sql" -ForegroundColor White
    Write-Host "2. Copiez le contenu de: sql-scripts/eol-remove-polls-created.sql" -ForegroundColor White
    Write-Host "3. Collez dans l'éditeur SQL" -ForegroundColor White
    Write-Host "4. Cliquez sur 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "📄 Contenu du script:" -ForegroundColor Cyan
    Write-Host ""
    Get-Content $sqlFile
    Write-Host ""
    exit 0
}

# Check for connection string in environment
$connectionString = $env:SUPABASE_DB_URL
if (-not $connectionString) {
    Write-Host "⚠️  Variable d'environnement SUPABASE_DB_URL non trouvée." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour utiliser psql, vous devez:" -ForegroundColor Cyan
    Write-Host "1. Définir SUPABASE_DB_URL avec votre connection string" -ForegroundColor White
    Write-Host "   Exemple: `$env:SUPABASE_DB_URL = 'postgresql://...'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Ou utiliser le Supabase Dashboard (recommandé):" -ForegroundColor Cyan
    Write-Host "   https://supabase.com/dashboard/project/outmbbisrrdiumlweira/sql" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "🚀 Exécution du script SQL..." -ForegroundColor Green
Write-Host ""

try {
    # Execute SQL using psql
    $sqlContent = Get-Content $sqlFile -Raw
    $sqlContent | psql $connectionString
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Script SQL exécuté avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
        Write-Host "1. Vérifier que les colonnes polls_created ont été supprimées" -ForegroundColor White
        Write-Host "2. Relancer les tests E2E pour confirmer" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'exécution du script SQL" -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

