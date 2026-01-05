# Script PowerShell pour lancer le test Gemini Flash
# Lit automatiquement la clé depuis .env

# $envFile = Get-Content .env
$apiKey = $null

if ($apiKey) {
    Write-Host "✅ Clé API trouvée (Legacy), lancement du test..." -ForegroundColor Green
    npx tsx src/lib/__prototypes__/test-gemini-flash-simple.ts $apiKey
}
else {
    Write-Host "⚠️ Test ignoré: Clé API directe retirée (Migration Edge Function)" -ForegroundColor Yellow
}
