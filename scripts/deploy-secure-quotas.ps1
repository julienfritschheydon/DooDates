# Script de déploiement de la sécurisation des quotas
# Usage: .\scripts\deploy-secure-quotas.ps1

Write-Host "🔒 Déploiement de la sécurisation des quotas" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI détecté" -ForegroundColor Green
Write-Host ""

# Étape 1: Déployer l'Edge Function
Write-Host "📦 Étape 1: Déploiement de l'Edge Function..." -ForegroundColor Cyan
Write-Host "Commande: supabase functions deploy hyper-task" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Assurez-vous d'avoir configuré:" -ForegroundColor Yellow
Write-Host "   - SUPABASE_URL (automatique)" -ForegroundColor Gray
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY (automatique)" -ForegroundColor Gray
Write-Host "   - GEMINI_API_KEY (à configurer manuellement)" -ForegroundColor Yellow
Write-Host ""
$deploy = Read-Host "Voulez-vous déployer maintenant? (o/N)"
if ($deploy -eq "o" -or $deploy -eq "O") {
    supabase functions deploy hyper-task
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Edge Function déployée" -ForegroundColor Green
} else {
    Write-Host "⏭️  Déploiement ignoré" -ForegroundColor Yellow
}
Write-Host ""

# Étape 2: Configurer les secrets
Write-Host "🔐 Étape 2: Configuration des secrets Supabase" -ForegroundColor Cyan
Write-Host "⚠️  À faire manuellement dans Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "   1. Allez dans Edge Functions → Secrets" -ForegroundColor Gray
Write-Host "   2. Ajoutez: GEMINI_API_KEY = votre_clé_api_gemini" -ForegroundColor Gray
Write-Host ""
$configureSecrets = Read-Host "Avez-vous configuré les secrets? (o/N)"
if ($configureSecrets -ne "o" -and $configureSecrets -ne "O") {
    Write-Host "⚠️  N'oubliez pas de configurer GEMINI_API_KEY!" -ForegroundColor Yellow
}
Write-Host ""

# Étape 3: Exécuter le script SQL
Write-Host "🗄️  Étape 3: Exécution du script SQL" -ForegroundColor Cyan
Write-Host "⚠️  À faire dans Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "   1. Ouvrez Supabase Dashboard → SQL Editor" -ForegroundColor Gray
Write-Host "   2. Copiez le contenu de: sql-scripts/create-consume-ai-credit-function.sql" -ForegroundColor Gray
Write-Host "   3. Exécutez le script" -ForegroundColor Gray
Write-Host ""
$sqlDone = Read-Host "Avez-vous exécuté le script SQL? (o/N)"
if ($sqlDone -ne "o" -and $sqlDone -ne "O") {
    Write-Host "⚠️  N'oubliez pas d'exécuter le script SQL!" -ForegroundColor Yellow
}
Write-Host ""

# Étape 4: Supprimer VITE_GEMINI_API_KEY
Write-Host "🧹 Étape 4: Nettoyage des variables d'environnement" -ForegroundColor Cyan
$envFile = ".env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $hasKey = $content | Select-String "VITE_GEMINI_API_KEY"
    if ($hasKey) {
        Write-Host "⚠️  VITE_GEMINI_API_KEY trouvée dans .env.local" -ForegroundColor Yellow
        $remove = Read-Host "Voulez-vous la supprimer? (o/N)"
        if ($remove -eq "o" -or $remove -eq "O") {
            $newContent = $content | Where-Object { $_ -notmatch "VITE_GEMINI_API_KEY" }
            $newContent | Set-Content $envFile
            Write-Host "✅ VITE_GEMINI_API_KEY supprimée" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ VITE_GEMINI_API_KEY non trouvée (déjà supprimée)" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  .env.local non trouvé (normal si vous n'utilisez pas de variables locales)" -ForegroundColor Gray
}
Write-Host ""

# Résumé
Write-Host "📋 Résumé:" -ForegroundColor Cyan
Write-Host "✅ Edge Function créée: supabase/functions/hyper-task/" -ForegroundColor Green
Write-Host "✅ Service frontend créé: src/services/SecureGeminiService.ts" -ForegroundColor Green
Write-Host "✅ Script SQL créé: sql-scripts/create-consume-ai-credit-function.sql" -ForegroundColor Green
Write-Host "✅ Documentation créée: Docs/SECURISATION-QUOTAS-IMPLEMENTATION.md" -ForegroundColor Green
Write-Host ""
Write-Host "🔴 Actions manuelles requises:" -ForegroundColor Red
Write-Host "   1. Déployer l'Edge Function (si pas fait)" -ForegroundColor Yellow
Write-Host "   2. Configurer GEMINI_API_KEY dans Supabase Secrets" -ForegroundColor Yellow
Write-Host "   3. Exécuter le script SQL dans Supabase SQL Editor" -ForegroundColor Yellow
Write-Host "   4. Supprimer VITE_GEMINI_API_KEY du .env.local" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Pour plus de détails, consultez: Docs/SECURISATION-QUOTAS-IMPLEMENTATION.md" -ForegroundColor Cyan

