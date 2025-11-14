# Test direct de l'Edge Function quota-tracking
# Usage: .\test-quota-direct.ps1

$supabaseUrl = "https://outmbbisrrdiumlweira.supabase.co"
$anonKey = "sb_publishable_q17OiSDadRwo8L9Jsc_-Yg_2D6IGDEH"
$token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjZZQVhsVCtQN3N6VUljTmsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL291dG1iYmlzcnJkaXVtbHdlaXJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwZTQyNTU5MS0yOWE3LTQ4OGUtYjQyMC01NmE3Mjk1ZTE3NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTE5NTQyLCJpYXQiOjE3NjMxMTU5NDIsImVtYWlsIjoianVsaWVuLmZyaXRzY2hAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLWjdDaGN4cWtuNnFWVjhLb3paNEtMS01JSnJyZktLN2JWWjlkUXcyQlo1cGVvTlQ5UT1zOTYtYyIsImVtYWlsIjoianVsaWVuLmZyaXRzY2hAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikp1bGllbiBGUklUU0NIIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ikp1bGllbiBGUklUU0NIIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1o3Q2hjeHFrbjZxVlY4S296WjRLTEtNSUpycmZLSzdiVlo5ZFF3MkJaNXBlb05UOVE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExODM5ODg4NTEzMTU3NTMzMTU0NSIsInJvbGUiOiJhZG1pbiIsInN1YiI6IjExODM5ODg4NTEzMTU3NTMzMTU0NSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzYzMDUxNTk4fV0sInNlc3Npb25faWQiOiJjMWE4YzhmOS1kODkwLTRhNjYtYTRiZS0yMjEzNzc1ZDRlZGUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.uSPWnCNFOrXDZKbekNDDs9Uuka_3LKAiUhnLKN5OZTY"

Write-Host "🧪 Test 1: Consommer 1 crédit pour ai_message" -ForegroundColor Yellow
Write-Host "URL: ${supabaseUrl}/functions/v1/quota-tracking" -ForegroundColor Cyan
Write-Host "Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    endpoint = "consumeCredits"
    action = "ai_message"
    credits = 1
    metadata = @{
        conversationId = "test-123"
        test = $true
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "${supabaseUrl}/functions/v1/quota-tracking" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "apikey" = $anonKey
        } `
        -Body $body
    
    Write-Host "✅ Succès!" -ForegroundColor Green
    Write-Host "Réponse:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Réponse du serveur:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "🧪 Test 2: Vérifier le quota" -ForegroundColor Yellow

$body2 = @{
    endpoint = "checkQuota"
    action = "ai_message"
    credits = 1
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "${supabaseUrl}/functions/v1/quota-tracking" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "apikey" = $anonKey
        } `
        -Body $body2
    
    Write-Host "✅ Succès!" -ForegroundColor Green
    Write-Host "Réponse:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Réponse du serveur:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

