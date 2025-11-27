# Script PowerShell pour lancer les tests et sauvegarder les résultats
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputFile = "test_results_$timestamp.txt"

Write-Host "Lancement des tests et sauvegarde dans $outputFile..."

# Lancer les tests et rediriger toute la sortie vers le fichier
npm test -- --run 2>&1 | Tee-Object -FilePath $outputFile

Write-Host "`nRésultats sauvegardés dans $outputFile"
Write-Host "Nombre de lignes: $((Get-Content $outputFile).Count)"

# Afficher un résumé
$summary = Select-String -Path $outputFile -Pattern "(Test Files|Tests |FAIL|PASS)" | Select-Object -Last 5
Write-Host "`nRésumé:"
$summary | ForEach-Object { Write-Host $_.Line }

# Retourner le nom du fichier pour référence
return $outputFile

