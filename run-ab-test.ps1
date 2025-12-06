# Script de test A/B pour le post-processing Gemini
Set-Location "c:\Users\Julien Fritsch\Documents\GitHub\DooDates-bug"

Write-Host "Test A/B Post-Processing Gemini 2.0"

# Test 1: AVEC post-processing
Write-Host "[1/2] Tests AVEC post-processing..."
$env:VITE_DISABLE_POST_PROCESSING = "false"
npx vitest run --config vitest.config.gemini.ts src/test/temporal-prompts-validation.manual.ts --reporter=default --no-coverage

Write-Host "Attente 30 secondes..."
Start-Sleep -Seconds 30

# Test 2: SANS post-processing
Write-Host "[2/2] Tests SANS post-processing..."
$env:VITE_DISABLE_POST_PROCESSING = "true"
npx vitest run --config vitest.config.gemini.ts src/test/temporal-prompts-validation.manual.ts --reporter=default --no-coverage

Write-Host "Termine. Executez: npx tsx scripts/test-gemini-ab.ts"
