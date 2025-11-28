# Script pour lancer un test et lire automatiquement les résultats
param(
    [string]$TestFile = "",
    [string]$OutputFile = "test_output_latest.txt"
)

# Supprimer l'ancien fichier s'il existe
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile
}

Write-Host "=== Lancement des tests ===" -ForegroundColor Cyan
Write-Host "Fichier: $TestFile" -ForegroundColor Yellow
Write-Host "Sortie: $OutputFile" -ForegroundColor Yellow
Write-Host ""

# Lancer les tests et rediriger toute la sortie
if ($TestFile -ne "") {
    npm test -- $TestFile --run 2>&1 | Out-File -FilePath $OutputFile -Encoding utf8
} else {
    npm test -- --run 2>&1 | Out-File -FilePath $OutputFile -Encoding utf8
}

Write-Host "=== Tests terminés ===" -ForegroundColor Green
Write-Host "Fichier de résultats: $OutputFile" -ForegroundColor Green
Write-Host "Taille: $((Get-Item $OutputFile).Length) bytes" -ForegroundColor Green
Write-Host ""

# Afficher un résumé
$content = Get-Content $OutputFile -Raw
$failCount = ([regex]::Matches($content, "FAIL\s+")).Count
$passCount = ([regex]::Matches($content, "✓|PASS")).Count

Write-Host "=== Résumé ===" -ForegroundColor Cyan
Write-Host "Tests échoués: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "Tests réussis: $passCount" -ForegroundColor Green
Write-Host ""

# Retourner le chemin du fichier
return $OutputFile

