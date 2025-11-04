# Script PowerShell pour tester la documentation en mode production (simulant GitHub Pages)
# Usage: .\scripts\test-docs-production.ps1

Write-Host "🚀 Test de la documentation en mode production" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Étape 1: Build production
Write-Host ""
Write-Host "📦 Étape 1: Build de production..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build

# Vérifier que le build a réussi
if (-not (Test-Path "dist")) {
    Write-Host "❌ Erreur: Le répertoire dist/ n'existe pas après le build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build terminé" -ForegroundColor Green

# Étape 2: Installer serve si nécessaire
Write-Host ""
Write-Host "📦 Étape 2: Vérification de serve..." -ForegroundColor Yellow
try {
    $null = Get-Command serve -ErrorAction Stop
    Write-Host "   serve est déjà installé" -ForegroundColor Gray
} catch {
    Write-Host "   Installation de serve..." -ForegroundColor Gray
    npm install -g serve
}

# Étape 3: Démarrer le serveur avec base path
Write-Host ""
Write-Host "🌐 Étape 3: Démarrage du serveur de production sur http://localhost:4173/DooDates/" -ForegroundColor Yellow
Write-Host "   (Le serveur sera arrêté automatiquement après les tests)" -ForegroundColor Gray
Write-Host ""

# Démarrer serve en arrière-plan
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    serve dist -s -p 4173 --listen
}

# Attendre que le serveur démarre
Write-Host "   Attente du démarrage du serveur..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Vérifier que le serveur répond
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4173/DooDates/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Serveur démarré" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Le serveur ne répond pas sur http://localhost:4173/DooDates/" -ForegroundColor Red
    Stop-Job $job
    Remove-Job $job
    exit 1
}

# Étape 4: Tests manuels
Write-Host ""
Write-Host "🧪 Étape 4: Tests manuels" -ForegroundColor Yellow
Write-Host "   Ouvrez votre navigateur et testez:" -ForegroundColor White
Write-Host "   - http://localhost:4173/DooDates/docs" -ForegroundColor Cyan
Write-Host "   - http://localhost:4173/DooDates/docs/01-Guide-Demarrage-Rapide" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Vérifiez dans la console du navigateur (F12) qu'il n'y a pas d'erreurs 404" -ForegroundColor White
Write-Host "   pour les fichiers JS/CSS (comme Docs-*.js, react-vendor-*.js, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "   Appuyez sur Entrée pour arrêter le serveur et terminer les tests..." -ForegroundColor Yellow

# Attendre que l'utilisateur appuie sur Entrée
Read-Host

# Nettoyage
Write-Host ""
Write-Host "🧹 Arrêt du serveur..." -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job

Write-Host ""
Write-Host "✅ Tests terminés" -ForegroundColor Green

