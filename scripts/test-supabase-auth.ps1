# Script de test de l'authentification Supabase
# Utilise les variables d'environnement pour tester la connexion

Write-Host "🔍 Test de connexion Supabase..." -ForegroundColor Cyan

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

# Récupérer les variables
$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_ANON_KEY
$testPassword = $env:INTEGRATION_TEST_PASSWORD

# Vérifier que les variables existent
if (-not $supabaseUrl) {
    Write-Host "❌ VITE_SUPABASE_URL non trouvée" -ForegroundColor Red
    exit 1
}

if (-not $supabaseKey) {
    Write-Host "❌ VITE_SUPABASE_ANON_KEY non trouvée" -ForegroundColor Red
    exit 1
}

if (-not $testPassword) {
    Write-Host "❌ INTEGRATION_TEST_PASSWORD non trouvée" -ForegroundColor Red
    Write-Host "💡 Créez cette variable dans .env.local avec le mot de passe du compte test" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Variables d'environnement chargées" -ForegroundColor Green
Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray
Write-Host "   Key: $($supabaseKey.Substring(0, 20))..." -ForegroundColor Gray

# Construire l'URL d'authentification
$authUrl = "$supabaseUrl/auth/v1/token?grant_type=password"

# Préparer les headers
$headers = @{
    "apikey" = $supabaseKey
    "Content-Type" = "application/json"
}

# Préparer le body
$body = @{
    email = "test-integration@doodates.com"
    password = $testPassword
} | ConvertTo-Json

Write-Host ""
Write-Host "🚀 Tentative de connexion avec test-integration@doodates.com..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $authUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ CONNEXION RÉUSSIE !" -ForegroundColor Green
    Write-Host "   User ID: $($response.user.id)" -ForegroundColor Gray
    Write-Host "   Email: $($response.user.email)" -ForegroundColor Gray
    Write-Host "   Token: $($response.access_token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Le compte de test existe et fonctionne correctement" -ForegroundColor Green
    
    exit 0
}
catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "❌ ÉCHEC DE CONNEXION" -ForegroundColor Red
    Write-Host "   Message: $($errorResponse.message)" -ForegroundColor Yellow
    
    if ($errorResponse.message -match "Invalid login credentials") {
        Write-Host ""
        Write-Host "🔧 SOLUTION:" -ForegroundColor Cyan
        Write-Host "   Le compte test-integration@doodates.com n'existe pas dans Supabase" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Étapes pour créer le compte:" -ForegroundColor White
        Write-Host "   1. Aller sur https://supabase.com/dashboard" -ForegroundColor Gray
        Write-Host "   2. Sélectionner votre projet DooDates" -ForegroundColor Gray
        Write-Host "   3. Authentication → Users → Add user" -ForegroundColor Gray
        Write-Host "   4. Email: test-integration@doodates.com" -ForegroundColor Gray
        Write-Host "   5. Password: (celui dans INTEGRATION_TEST_PASSWORD)" -ForegroundColor Gray
    }
    elseif ($errorResponse.message -match "Invalid API key") {
        Write-Host ""
        Write-Host "🔧 SOLUTION:" -ForegroundColor Cyan
        Write-Host "   Vérifier VITE_SUPABASE_ANON_KEY dans .env.local" -ForegroundColor Yellow
    }
    
    exit 1
}
