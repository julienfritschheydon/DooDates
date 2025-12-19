# Script de déploiement des Edge Functions manquantes
# Usage: .\scripts\deploy-missing-edge-functions.ps1

Write-Host "🚀 Déploiement des Edge Functions manquantes" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est disponible
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
$npxAvailable = Get-Command npx -ErrorAction SilentlyContinue

if (-not $supabaseInstalled -and -not $npxAvailable) {
    Write-Host "❌ Supabase CLI n'est pas installé et npx n'est pas disponible" -ForegroundColor Red
    Write-Host "Installez Node.js et npm d'abord" -ForegroundColor Yellow
    exit 1
}

if (-not $supabaseInstalled) {
    Write-Host "⚠️  Supabase CLI n'est pas installé globalement" -ForegroundColor Yellow
    Write-Host "   Utilisation de 'npx supabase' (recommandé)" -ForegroundColor Cyan
    Write-Host "   Note: npx téléchargera automatiquement Supabase CLI si nécessaire" -ForegroundColor Gray
    Write-Host ""
    $global:useNpx = $true
} else {
    Write-Host "✅ Supabase CLI détecté" -ForegroundColor Green
    $global:useNpx = $false
}
Write-Host ""

# Fonction pour exécuter supabase (avec npx si nécessaire)
function Invoke-Supabase {
    param([string]$Command)
    if ($global:useNpx) {
        npx supabase $Command
    } else {
        supabase $Command
    }
}

# Vérifier que le projet est lié
Write-Host "🔗 Vérification de la connexion au projet..." -ForegroundColor Cyan
$linked = Invoke-Supabase "projects list" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Vous devez vous connecter et lier le projet:" -ForegroundColor Yellow
    if ($global:useNpx) {
        Write-Host "   1. npx supabase login" -ForegroundColor Gray
        Write-Host "   2. npx supabase link --project-ref outmbbisrrdiumlweira" -ForegroundColor Gray
    } else {
        Write-Host "   1. supabase login" -ForegroundColor Gray
        Write-Host "   2. supabase link --project-ref outmbbisrrdiumlweira" -ForegroundColor Gray
    }
    Write-Host ""
    $continue = Read-Host "Voulez-vous continuer quand même? (o/N)"
    if ($continue -ne "o" -and $continue -ne "O") {
        exit 1
    }
}

Write-Host ""

# Fonctions à déployer
$functions = @(
    @{
        Name = "data-retention-warnings"
        Description = "Avertissements de rétention de données"
        Secrets = @("RESEND_API_KEY")
    },
    @{
        Name = "send-poll-confirmation-email"
        Description = "Emails de confirmation après vote"
        Secrets = @("RESEND_API_KEY")
    }
)

Write-Host "📦 Fonctions à déployer:" -ForegroundColor Cyan
foreach ($func in $functions) {
    Write-Host "   - $($func.Name): $($func.Description)" -ForegroundColor Gray
}
Write-Host ""

$deploy = Read-Host "Voulez-vous déployer ces fonctions maintenant? (o/N)"
if ($deploy -ne "o" -and $deploy -ne "O") {
    Write-Host "⏭️  Déploiement annulé" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Déployer chaque fonction
foreach ($func in $functions) {
    Write-Host "📦 Déploiement de $($func.Name)..." -ForegroundColor Cyan
    Write-Host "   Description: $($func.Description)" -ForegroundColor Gray
    
    Invoke-Supabase "functions deploy $($func.Name)"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $($func.Name) déployée avec succès" -ForegroundColor Green
        
        # Afficher les secrets requis
        if ($func.Secrets.Count -gt 0) {
            Write-Host "   ⚠️  Secrets requis:" -ForegroundColor Yellow
            foreach ($secret in $func.Secrets) {
                Write-Host "      - $secret" -ForegroundColor Gray
            }
            Write-Host "   📝 Configurez-les dans: Supabase Dashboard > Edge Functions > $($func.Name) > Settings > Secrets" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Erreur lors du déploiement de $($func.Name)" -ForegroundColor Red
        Write-Host "   Vérifiez les logs ci-dessus" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Configurer les secrets RESEND_API_KEY pour chaque fonction" -ForegroundColor Gray
Write-Host "   2. Tester les fonctions avec curl ou depuis l'application" -ForegroundColor Gray
Write-Host "   3. Vérifier les logs dans Supabase Dashboard > Edge Functions > Logs" -ForegroundColor Gray
Write-Host ""

