# Script de test pour l'Edge Function quota-tracking
# Usage: .\test-quota-tracking-edge-function.ps1 -Token "VOTRE_JWT_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$BaseUrl = "https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "Test de l'Edge Function quota-tracking" -ForegroundColor Cyan
Write-Host "URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: checkQuota
Write-Host "Test 1: checkQuota" -ForegroundColor Yellow
$body1 = @{
    endpoint = "checkQuota"
    action = "other"
    credits = 0
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $BaseUrl `
        -Method Post `
        -Headers $headers `
        -Body $body1 `
        -ErrorAction Stop
    
    Write-Host "✅ Succès!" -ForegroundColor Green
    Write-Host "Réponse:" -ForegroundColor Gray
    $response1 | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: consumeCredits
Write-Host "Test 2: consumeCredits (1 credit)" -ForegroundColor Yellow
$body2 = @{
    endpoint = "consumeCredits"
    action = "other"
    credits = 1
    metadata = @{
        test = $true
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $BaseUrl `
        -Method Post `
        -Headers $headers `
        -Body $body2 `
        -ErrorAction Stop
    
    Write-Host "✅ Succès!" -ForegroundColor Green
    Write-Host "Réponse:" -ForegroundColor Gray
    $response2 | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: getJournal
Write-Host "Test 3: getJournal" -ForegroundColor Yellow
$body3 = @{
    endpoint = "getJournal"
    limit = 10
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $BaseUrl `
        -Method Post `
        -Headers $headers `
        -Body $body3 `
        -ErrorAction Stop
    
    Write-Host "✅ Succès!" -ForegroundColor Green
    Write-Host "Réponse:" -ForegroundColor Gray
    $response3 | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Tests termines!" -ForegroundColor Cyan

