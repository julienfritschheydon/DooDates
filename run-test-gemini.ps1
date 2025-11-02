# Script PowerShell pour lancer le test Gemini Flash
# Lit automatiquement la clé depuis .env

$envFile = Get-Content .env
$apiKey = ($envFile | Select-String "VITE_GEMINI_API_KEY=").ToString().Split("=")[1].Trim()

if ($apiKey) {
    Write-Host "✅ Clé API trouvée, lancement du test..." -ForegroundColor Green
    npx tsx src/lib/__prototypes__/test-gemini-flash-simple.ts $apiKey
} else {
    Write-Host "❌ Clé API non trouvée dans .env" -ForegroundColor Red
}
