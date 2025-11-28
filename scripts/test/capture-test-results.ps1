# Script pour capturer les résultats des tests dans un fichier
param(
    [string]$TestFile = "",
    [string]$OutputFile = "test_results_capture.txt"
)

Write-Host "Lancement des tests..."
Write-Host "Fichier de sortie: $OutputFile"

if ($TestFile -ne "") {
    Write-Host "Test spécifique: $TestFile"
    npm test -- $TestFile --run *> $OutputFile 2>&1
} else {
    Write-Host "Tous les tests"
    npm test -- --run *> $OutputFile 2>&1
}

Write-Host "Tests terminés. Résultats dans $OutputFile"
Write-Host "Taille du fichier: $((Get-Item $OutputFile).Length) bytes"

