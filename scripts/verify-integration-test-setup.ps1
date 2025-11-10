# Script de Vérification - Configuration Tests d'Intégration Phase 2 (Windows)
# Ce script vérifie que tout est prêt pour exécuter les tests d'intégration réels

Write-Host "🔍 Vérification Configuration Tests d'Intégration Phase 2" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

function Check-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Check-Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
    $script:Errors++
}

function Check-Warning {
    param($message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
    $script:Warnings++
}

# 1. Vérifier que les fichiers existent
Write-Host "📁 Vérification des fichiers..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "tests\integration\real-supabase.test.ts") {
    Check-Success "Fichier de tests d'intégration existe"
} else {
    Check-Error "Fichier de tests d'intégration manquant"
}

if (Test-Path ".github\workflows\6-integration-tests.yml") {
    Check-Success "Workflow GitHub Actions existe"
} else {
    Check-Error "Workflow GitHub Actions manquant"
}

if (Test-Path "Docs\TESTS\PROTECTION-PRODUCTION-PHASE2.md") {
    Check-Success "Documentation Phase 2 existe"
} else {
    Check-Error "Documentation Phase 2 manquante"
}

Write-Host ""

# 2. Vérifier les variables d'environnement locales
Write-Host "🔐 Vérification des variables d'environnement locales..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".env.local") {
    Check-Success "Fichier .env.local existe"
    
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "VITE_SUPABASE_URL") {
        Check-Success "VITE_SUPABASE_URL configuré dans .env.local"
    } else {
        Check-Warning "VITE_SUPABASE_URL manquant dans .env.local"
    }
    
    if ($envContent -match "VITE_SUPABASE_ANON_KEY") {
        Check-Success "VITE_SUPABASE_ANON_KEY configuré dans .env.local"
    } else {
        Check-Warning "VITE_SUPABASE_ANON_KEY manquant dans .env.local"
    }
    
    if ($envContent -match "INTEGRATION_TEST_PASSWORD") {
        Check-Success "INTEGRATION_TEST_PASSWORD configuré dans .env.local"
    } else {
        Check-Warning "INTEGRATION_TEST_PASSWORD manquant dans .env.local"
    }
    
    if ($envContent -match "BASE_URL") {
        Check-Success "BASE_URL configuré dans .env.local"
    } else {
        Check-Warning "BASE_URL manquant dans .env.local (utilise valeur par défaut)"
    }
} else {
    Check-Warning "Fichier .env.local n'existe pas (tests locaux ne fonctionneront pas)"
    Write-Host "   Pour créer: voir Docs\TESTS\GUIDE-CONFIGURATION-COMPTE-TEST.md" -ForegroundColor Gray
}

Write-Host ""

# 3. Vérifier Playwright
Write-Host "🎭 Vérification de Playwright..." -ForegroundColor Cyan
Write-Host ""

try {
    $null = npx --version 2>&1
    Check-Success "npx est installé"
    
    try {
        $version = npx playwright --version 2>&1
        Check-Success "Playwright est installé ($version)"
    } catch {
        Check-Warning "Playwright n'est pas installé (exécuter: npx playwright install chromium)"
    }
} catch {
    Check-Warning "npx n'est pas installé"
}

Write-Host ""

# 4. Tester la connexion Supabase (si .env.local existe)
if (Test-Path ".env.local") {
    Write-Host "🔗 Test de connexion Supabase..." -ForegroundColor Cyan
    Write-Host ""
    
    $envContent = Get-Content ".env.local"
    $supabaseUrl = ($envContent | Select-String "VITE_SUPABASE_URL=(.+)").Matches.Groups[1].Value
    
    if ($supabaseUrl) {
        try {
            $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
            $statusCode = $response.StatusCode
            
            if ($statusCode -eq 200 -or $statusCode -eq 401 -or $statusCode -eq 403) {
                Check-Success "Supabase est accessible (HTTP $statusCode)"
            } else {
                Check-Warning "Supabase retourne un code inattendu (HTTP $statusCode)"
            }
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq 401 -or $statusCode -eq 403) {
                Check-Success "Supabase est accessible (HTTP $statusCode)"
            } else {
                Check-Warning "Impossible de se connecter à Supabase"
            }
        }
    } else {
        Check-Warning "VITE_SUPABASE_URL non défini, impossible de tester"
    }
    
    Write-Host ""
}

# 5. Vérifier le compte de test
Write-Host "👤 Vérification du compte de test..." -ForegroundColor Cyan
Write-Host ""

Write-Host "   Email attendu: test-integration@doodates.com" -ForegroundColor Gray
Write-Host "   Vérification manuelle requise:" -ForegroundColor Gray
Write-Host "   1. Pouvez-vous vous connecter avec ce compte?" -ForegroundColor Gray
Write-Host "   2. Le compte a-t-il des données de test à nettoyer?" -ForegroundColor Gray
Write-Host ""

# 6. Instructions pour GitHub Secrets
Write-Host "🔐 Configuration des secrets GitHub..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   ⚠️  Les secrets GitHub doivent être configurés manuellement:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Aller sur: https://github.com/julienfritschheydon/DooDates/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   2. Vérifier/Créer les secrets suivants:" -ForegroundColor Gray
Write-Host "      - INTEGRATION_TEST_PASSWORD" -ForegroundColor Gray
Write-Host "      - VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "      - VITE_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "   Guide complet: Docs\TESTS\GUIDE-CONFIGURATION-COMPTE-TEST.md" -ForegroundColor Gray
Write-Host ""

# 7. Résumé
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host "✅ Tout est prêt ! Vous pouvez exécuter les tests d'intégration." -ForegroundColor Green
    Write-Host ""
    Write-Host "Commandes pour tester:" -ForegroundColor Cyan
    Write-Host "  npx playwright test tests/integration/real-supabase.test.ts --project=chromium" -ForegroundColor Gray
    Write-Host "  npx playwright test tests/integration/real-supabase.test.ts --project=chromium --ui" -ForegroundColor Gray
    Write-Host ""
} elseif ($Errors -eq 0) {
    Write-Host "⚠️  $Warnings avertissement(s) détecté(s)" -ForegroundColor Yellow
    Write-Host "   Les tests peuvent ne pas fonctionner localement." -ForegroundColor Gray
    Write-Host "   Consultez les avertissements ci-dessus." -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Guide: Docs\TESTS\GUIDE-CONFIGURATION-COMPTE-TEST.md" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ $Errors erreur(s) et $Warnings avertissement(s) détecté(s)" -ForegroundColor Red
    Write-Host "   Configuration incomplète. Veuillez corriger les erreurs ci-dessus." -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Guide: Docs\TESTS\GUIDE-CONFIGURATION-COMPTE-TEST.md" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# 8. Prochaines étapes
Write-Host "🚀 PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Créer le compte de test (si pas encore fait):" -ForegroundColor Gray
Write-Host "   - Email: test-integration@doodates.com" -ForegroundColor Gray
Write-Host "   - Voir: Docs\TESTS\GUIDE-CONFIGURATION-COMPTE-TEST.md" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configurer les secrets GitHub:" -ForegroundColor Gray
Write-Host "   - GitHub Settings > Secrets and variables > Actions" -ForegroundColor Gray
Write-Host "   - Ajouter INTEGRATION_TEST_PASSWORD" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Tester localement:" -ForegroundColor Gray
Write-Host "   - npx playwright test tests/integration/real-supabase.test.ts --project=chromium" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Pusher et vérifier CI:" -ForegroundColor Gray
Write-Host "   - git push" -ForegroundColor Gray
Write-Host "   - Vérifier Actions > Integration Tests" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation complète: Docs\TESTS\PROTECTION-PRODUCTION-PHASE2.md" -ForegroundColor Gray
Write-Host ""

exit 0

