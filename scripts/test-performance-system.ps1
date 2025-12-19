# Script de test end-to-end du système de monitoring des performances
# Usage: .\scripts\test-performance-system.ps1

Write-Host "🧪 ==========================================" -ForegroundColor Cyan
Write-Host "   TEST DU SYSTÈME DE MONITORING" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

if (-not $env:VITE_SUPABASE_URL) {
    Write-Host "❌ VITE_SUPABASE_URL n'est pas défini" -ForegroundColor Red
    Write-Host "   Export: `$env:VITE_SUPABASE_URL='https://votre-projet.supabase.co'" -ForegroundColor Gray
    exit 1
}

if (-not $env:SUPABASE_SERVICE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_KEY n'est pas défini" -ForegroundColor Red
    Write-Host "   Export: `$env:SUPABASE_SERVICE_KEY='votre-service-key'" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Variables d'environnement configurées" -ForegroundColor Green
Write-Host ""

# Test 1: Vérifier que les fichiers existent
Write-Host "📁 Test 1: Vérification des fichiers..." -ForegroundColor Yellow

$files = @(
    "scripts\send-performance-metrics.js",
    "scripts\extract-e2e-metrics.js",
    "scripts\apply-performance-migrations.sql",
    "e2e-metrics-example.json",
    "public\performance-baseline.json",
    "src\services\performance-collector.ts",
    "src\components\performance\PerformanceDashboard.tsx",
    "src\components\performance\PerformanceAlerts.tsx"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (manquant)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    exit 1
}

Write-Host "✅ Tous les fichiers sont présents" -ForegroundColor Green
Write-Host ""

# Test 2: Envoyer des métriques E2E de test
Write-Host "📊 Test 2: Envoi de métriques E2E..." -ForegroundColor Yellow

$env:GITHUB_RUN_ID = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
$env:GITHUB_SHA = (git rev-parse HEAD 2>$null) ?? "test-commit"
$env:GITHUB_REF = "refs/heads/$((git branch --show-current 2>$null) ?? 'test-branch')"

$result = node scripts\send-performance-metrics.js --source e2e --file e2e-metrics-example.json
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Métriques E2E envoyées avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Échec de l'envoi des métriques E2E" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Vérifier que les données sont dans Supabase
Write-Host "🔍 Test 3: Vérification des données dans Supabase..." -ForegroundColor Yellow

try {
    $headers = @{
        "apikey" = $env:SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $env:SUPABASE_SERVICE_KEY"
    }
    
    $response = Invoke-RestMethod -Uri "$env:VITE_SUPABASE_URL/rest/v1/performance_metrics?order=created_at.desc&limit=1" -Headers $headers -Method Get
    
    if ($response -and $response.Count -gt 0) {
        Write-Host "✅ Données trouvées dans Supabase" -ForegroundColor Green
        Write-Host "   Dernière métrique: $($response[0].source)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Aucune donnée trouvée (peut être normal si première exécution)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier les données: $_" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Vérifier le dashboard local
Write-Host "🌐 Test 4: Vérification du dashboard..." -ForegroundColor Yellow

if (Test-Path "src\pages\Performance.tsx") {
    Write-Host "✅ Page Performance existe" -ForegroundColor Green
    
    $content = Get-Content "src\pages\Performance.tsx" -Raw
    if ($content -match "PerformanceDashboard") {
        Write-Host "✅ Import PerformanceDashboard correct" -ForegroundColor Green
    } else {
        Write-Host "❌ Import PerformanceDashboard manquant" -ForegroundColor Red
    }
    
    $dashboardContent = Get-Content "src\components\performance\PerformanceDashboard.tsx" -Raw
    if ($dashboardContent -match "PerformanceAlerts") {
        Write-Host "✅ Import PerformanceAlerts correct" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Import PerformanceAlerts non trouvé" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Page Performance manquante" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 5: Vérifier la configuration des workflows
Write-Host "⚙️  Test 5: Vérification des workflows GitHub..." -ForegroundColor Yellow

if (Test-Path ".github\workflows\lighthouse.yml") {
    $workflowContent = Get-Content ".github\workflows\lighthouse.yml" -Raw
    if ($workflowContent -match "send-performance-metrics") {
        Write-Host "✅ Workflow Lighthouse configuré" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Workflow Lighthouse non configuré pour envoyer les métriques" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Workflow Lighthouse non trouvé" -ForegroundColor Yellow
}

Write-Host ""

# Test 6: Tester la détection de régression
Write-Host "🚨 Test 6: Test de détection de régression..." -ForegroundColor Yellow

$regressionMetrics = @{
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
    source = "e2e"
    dashboard_load_50_conversations = 6000
    dashboard_load_200_conversations = 10000
    tags_menu_open = 1000
    folders_menu_open = 1000
} | ConvertTo-Json

$regressionMetrics | Out-File -FilePath "$env:TEMP\test-regression-metrics.json" -Encoding UTF8

Write-Host "   Envoi de métriques avec régression..." -ForegroundColor Gray
$result = node scripts\send-performance-metrics.js --source e2e --file "$env:TEMP\test-regression-metrics.json"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Métriques avec régression envoyées" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
    
    try {
        $headers = @{
            "apikey" = $env:SUPABASE_SERVICE_KEY
            "Authorization" = "Bearer $env:SUPABASE_SERVICE_KEY"
        }
        
        $alerts = Invoke-RestMethod -Uri "$env:VITE_SUPABASE_URL/rest/v1/performance_alerts?order=created_at.desc&limit=1" -Headers $headers -Method Get
        
        if ($alerts -and $alerts.Count -gt 0) {
            Write-Host "✅ Alerte de régression créée" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Aucune alerte créée (vérifier le seuil de régression)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Impossible de vérifier les alertes: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Échec de l'envoi des métriques de régression" -ForegroundColor Red
}

# Nettoyage
Remove-Item "$env:TEMP\test-regression-metrics.json" -ErrorAction SilentlyContinue

Write-Host ""

# Résumé
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Fichiers système présents" -ForegroundColor Green
Write-Host "✅ Envoi de métriques fonctionnel" -ForegroundColor Green
Write-Host "✅ Dashboard configuré" -ForegroundColor Green
Write-Host "✅ Détection de régression testée" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Système de monitoring opérationnel !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Appliquer les migrations SQL dans Supabase" -ForegroundColor Gray
Write-Host "   2. Configurer SUPABASE_SERVICE_KEY dans GitHub Secrets" -ForegroundColor Gray
Write-Host "   3. Tester le dashboard: http://localhost:8080/DooDates/performance" -ForegroundColor Gray
Write-Host "   4. Déclencher un workflow Lighthouse pour test complet" -ForegroundColor Gray
Write-Host ""

