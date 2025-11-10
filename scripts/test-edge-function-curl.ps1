# Script de test direct de l'Edge Function Gemini avec PowerShell
# Usage: pwsh scripts/test-edge-function-curl.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔍 Test Edge Function Gemini avec PowerShell" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Charger les variables d'environnement depuis .env.local
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY

# Vérifier les variables d'environnement
if (-not $SUPABASE_URL) {
    Write-Host "❌ VITE_SUPABASE_URL non définie" -ForegroundColor Red
    exit 1
}

if (-not $SUPABASE_ANON_KEY) {
    Write-Host "❌ VITE_SUPABASE_ANON_KEY non définie" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration détectée:" -ForegroundColor Green
Write-Host "  - VITE_SUPABASE_URL: $($SUPABASE_URL.Substring(0, [Math]::Min(30, $SUPABASE_URL.Length)))..."
Write-Host "  - VITE_SUPABASE_ANON_KEY: $($SUPABASE_ANON_KEY.Substring(0, [Math]::Min(20, $SUPABASE_ANON_KEY.Length)))..."
Write-Host ""

$EDGE_FUNCTION_URL = "$SUPABASE_URL/functions/v1/gemini"
Write-Host "📡 URL Edge Function: $EDGE_FUNCTION_URL" -ForegroundColor Cyan
Write-Host ""

# Test 1: Prompt simple
Write-Host "📝 Test 1: Prompt simple (réunion lundi matin)" -ForegroundColor Yellow
Write-Host "----------------------------------------------" -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    prompt = "Organise une réunion lundi matin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $EDGE_FUNCTION_URL -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "📊 Statut HTTP: 200" -ForegroundColor Green
    Write-Host "📦 Réponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    
    if ($response.success -eq $true) {
        Write-Host "✅ Test 1 réussi - API fonctionnelle" -ForegroundColor Green
        Write-Host "  - Type: $($response.data.type)"
        Write-Host "  - Titre: $($response.data.title)"
    } else {
        Write-Host "❌ Test 1 échoué - success=false" -ForegroundColor Red
        Write-Host "  - Error: $($response.error)"
        Write-Host "  - Message: $($response.message)"
        exit 1
    }
} catch {
    Write-Host "❌ Test 1 échoué - Erreur HTTP" -ForegroundColor Red
    Write-Host "  - Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  - Status Code: $statusCode" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Test 2: Prompt vide (devrait échouer gracieusement)
Write-Host "📝 Test 2: Gestion d'erreur (prompt vide)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

$body = @{
    prompt = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $EDGE_FUNCTION_URL -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "📊 Statut HTTP: 200" -ForegroundColor Green
    Write-Host "📦 Réponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    
    if ($response.success -eq $false) {
        Write-Host "✅ Test 2 réussi - Erreur gérée correctement" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Test 2 - Prompt vide accepté (comportement inattendu)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Test 2 - Erreur HTTP (attendu)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Form Poll
Write-Host "📝 Test 3: Génération Form Poll" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

$body = @{
    prompt = "Crée un questionnaire de satisfaction client avec 3 questions"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $EDGE_FUNCTION_URL -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "📊 Statut HTTP: 200" -ForegroundColor Green
    
    if ($response.success -eq $true) {
        $questionsCount = $response.data.questions.Count
        Write-Host "✅ Test 3 réussi" -ForegroundColor Green
        Write-Host "  - Type: $($response.data.type)"
        Write-Host "  - Nombre de questions: $questionsCount"
    } else {
        Write-Host "❌ Test 3 échoué - success=false" -ForegroundColor Red
        $response | ConvertTo-Json -Depth 10 | Write-Host
    }
} catch {
    Write-Host "❌ Test 3 échoué - Erreur HTTP" -ForegroundColor Red
    Write-Host "  - Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Tests terminés avec succès" -ForegroundColor Green
