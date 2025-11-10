# Simuler l'exécution des tests d'intégration comme en CI
# Ce script reproduit l'environnement GitHub Actions

Write-Host "🔄 Simulation de l'environnement CI pour tests d'intégration..." -ForegroundColor Cyan
Write-Host ""

# Charger les variables depuis .env.local
$envFile = Join-Path $PSScriptRoot "..\\.env.local"
if (Test-Path $envFile) {
    Write-Host "📄 Chargement de .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Afficher les variables qui seront utilisées
Write-Host ""
Write-Host "📊 Variables d'environnement disponibles:" -ForegroundColor Cyan
Write-Host "   VITE_SUPABASE_URL: $($env:VITE_SUPABASE_URL)" -ForegroundColor Gray
Write-Host "   VITE_SUPABASE_ANON_KEY: $($env:VITE_SUPABASE_ANON_KEY.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "   INTEGRATION_TEST_PASSWORD: $(if ($env:INTEGRATION_TEST_PASSWORD) { '✅ Défini' } else { '❌ Non défini' })" -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 Lancement des tests d'intégration..." -ForegroundColor Cyan
Write-Host ""

# Lancer les tests d'intégration exactement comme en CI
npm run test:integration
