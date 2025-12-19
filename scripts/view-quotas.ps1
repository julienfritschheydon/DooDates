# Script PowerShell pour visualiser les quotas utilisateurs depuis Supabase
# Usage: .\scripts\view-quotas.ps1

param(
    [string]$SupabaseUrl = "https://outmbbisrrdiumlweira.supabase.co",
    [string]$SupabaseAnonKey = $env:VITE_SUPABASE_ANON_KEY,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY,
    [switch]$Detailed = $false,
    [switch]$TopUsers = $false,
    [switch]$Stats = $false,
    [switch]$All = $false  # Afficher authentifiés + guests
)

# Couleurs pour l'affichage
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "📊 Visualisation des quotas utilisateurs - DooDates" -ForegroundColor Cyan
Write-Host ""

if ($All) {
    Write-Host "ℹ️  Mode COMPLET : Utilisateurs authentifiés + Guests" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  Mode par défaut : Utilisateurs authentifiés uniquement" -ForegroundColor Cyan
    Write-Host "   Utilisez -All pour voir aussi les guests" -ForegroundColor Gray
}
Write-Host "   📊 Les valeurs affichées sont les CRÉDITS CONSOMÉS" -ForegroundColor White
Write-Host ""

# Chercher la clé dans les fichiers .env si elle n'est pas dans les variables d'environnement
if (-not $SupabaseServiceKey) {
    # Chercher dans .env.local, .env, ou .env.production
    $envFiles = @(".env.local", ".env", ".env.production")
    foreach ($envFile in $envFiles) {
        if (Test-Path $envFile) {
            Write-Host "🔍 Recherche dans $envFile..." -ForegroundColor Gray
            $lines = Get-Content $envFile
            foreach ($line in $lines) {
                # Ignorer les commentaires et lignes vides
                if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
                # Chercher SUPABASE_SERVICE_ROLE_KEY=value (avec ou sans VITE_)
                if ($line -match '^\s*(VITE_)?SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)') {
                    $SupabaseServiceKey = $matches[2].Trim().Trim('"').Trim("'")
                    Write-Host "✅ Clé trouvée dans $envFile" -ForegroundColor Green
                    break
                }
            }
            if ($SupabaseServiceKey) { break }
        }
    }
}

if (-not $SupabaseServiceKey) {
    Write-ColorOutput Red "❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquant"
    Write-Host ""
    Write-Host "📝 Comment obtenir la clé :" -ForegroundColor Yellow
    Write-Host "   1. Aller dans Supabase Dashboard → https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "   2. Sélectionner votre projet" -ForegroundColor White
    Write-Host "   3. Settings → API" -ForegroundColor White
    Write-Host "   4. Copier la 'service_role' key (⚠️  SECRÈTE, ne jamais exposer publiquement)" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Options pour utiliser le script :" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Option 1: Variable d'environnement (recommandé pour une utilisation ponctuelle)" -ForegroundColor White
    Write-Host "      `$env:SUPABASE_SERVICE_ROLE_KEY = 'votre_clé'" -ForegroundColor Gray
    Write-Host "      npm run quota:view" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option 2: Paramètre direct" -ForegroundColor White
    Write-Host "      .\scripts\view-quotas.ps1 -SupabaseServiceKey 'votre_clé'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option 3: Ajouter dans .env.local (pour usage répété)" -ForegroundColor White
    Write-Host "      Ajouter cette ligne dans .env.local:" -ForegroundColor Gray
    Write-Host "      SUPABASE_SERVICE_ROLE_KEY=votre_clé" -ForegroundColor DarkGray
    Write-Host "      ⚠️  Attention: .env.local est dans .gitignore, mais vérifiez qu'il n'est pas commité" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Option 4: Utiliser le script SQL directement (⭐ PLUS SIMPLE, pas de clé nécessaire)" -ForegroundColor White
    Write-Host "      1. Ouvrir Supabase Dashboard → SQL Editor" -ForegroundColor Gray
    Write-Host "      2. Copier une requête de: sql-scripts/view-user-quotas.sql" -ForegroundColor Gray
    Write-Host "      3. Exécuter (Run)" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

$headers = @{
    "apikey" = $SupabaseServiceKey
    "Authorization" = "Bearer $SupabaseServiceKey"
    "Content-Type" = "application/json"
}

try {
    # Récupérer les quotas authentifiés
    $restUrlAuth = "$SupabaseUrl/rest/v1/quota_tracking?select=*&order=total_credits_consumed.desc"
    
    Write-Host "🔍 Récupération des quotas depuis Supabase..." -ForegroundColor Gray
    
    $quotas = @()
    $guestQuotas = @()
    
    try {
        $quotas = Invoke-RestMethod -Uri $restUrlAuth `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        
        Write-Host "✅ $($quotas.Count) utilisateur(s) authentifié(s) trouvé(s)" -ForegroundColor Green
        
        # Si mode -All, récupérer aussi les guests
        if ($All) {
            $restUrlGuests = "$SupabaseUrl/rest/v1/guest_quotas?select=*&order=total_credits_consumed.desc"
            try {
                $guestQuotas = Invoke-RestMethod -Uri $restUrlGuests `
                    -Method Get `
                    -Headers $headers `
                    -ErrorAction Stop
                
                Write-Host "✅ $($guestQuotas.Count) guest(s) trouvé(s)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Impossible de récupérer les quotas guests: $($_.Exception.Message)" -ForegroundColor Yellow
                Write-Host "   (La table guest_quotas peut ne pas exister ou être inaccessible)" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        
    } catch {
        $errorDetails = $_.ErrorDetails.Message
        Write-ColorOutput Red "❌ Erreur lors de la récupération des quotas:"
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        if ($errorDetails) {
            Write-Host "   Détails: $errorDetails" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "💡 Solution: Utilisez le script SQL directement dans Supabase Dashboard" -ForegroundColor Yellow
        Write-Host "   Fichier: sql-scripts/view-user-quotas.sql" -ForegroundColor Yellow
        Write-Host "   Le script SQL peut faire des JOIN avec auth.users pour voir les emails" -ForegroundColor Yellow
        exit 1
    }

    if ($Stats) {
        Write-Host "📈 Statistiques globales" -ForegroundColor Cyan
        Write-Host "=" * 60
        
        # Statistiques utilisateurs authentifiés
        $totalAuthUsers = $quotas.Count
        $totalAuthCredits = if ($quotas.Count -gt 0) { ($quotas | Measure-Object -Property total_credits_consumed -Sum).Sum } else { 0 }
        $avgAuthCredits = if ($quotas.Count -gt 0) { ($quotas | Measure-Object -Property total_credits_consumed -Average).Average } else { 0 }
        $maxAuthCredits = if ($quotas.Count -gt 0) { ($quotas | Measure-Object -Property total_credits_consumed -Maximum).Maximum } else { 0 }
        
        Write-Host "👤 UTILISATEURS AUTHENTIFIÉS:" -ForegroundColor Green
        Write-Host "   Total: $totalAuthUsers" -ForegroundColor White
        Write-Host "   Total crédits consommés: $totalAuthCredits" -ForegroundColor White
        Write-Host "   Moyenne: $([math]::Round($avgAuthCredits, 2)) crédits/utilisateur" -ForegroundColor White
        Write-Host "   Maximum: $maxAuthCredits crédits" -ForegroundColor White
        Write-Host ""
        
        # Statistiques guests (si mode -All)
        if ($All -and $guestQuotas.Count -gt 0) {
            $totalGuests = $guestQuotas.Count
            $totalGuestCredits = ($guestQuotas | Measure-Object -Property total_credits_consumed -Sum).Sum
            $avgGuestCredits = ($guestQuotas | Measure-Object -Property total_credits_consumed -Average).Average
            $maxGuestCredits = ($guestQuotas | Measure-Object -Property total_credits_consumed -Maximum).Maximum
            
            Write-Host "🌐 GUESTS:" -ForegroundColor Yellow
            Write-Host "   Total: $totalGuests" -ForegroundColor White
            Write-Host "   Total crédits consommés: $totalGuestCredits" -ForegroundColor White
            Write-Host "   Moyenne: $([math]::Round($avgGuestCredits, 2)) crédits/guest" -ForegroundColor White
            Write-Host "   Maximum: $maxGuestCredits crédits" -ForegroundColor White
            Write-Host ""
            
            # Totaux combinés
            $totalAllUsers = $totalAuthUsers + $totalGuests
            $totalAllCredits = $totalAuthCredits + $totalGuestCredits
            
            Write-Host "📊 TOTAL (Authentifiés + Guests):" -ForegroundColor Cyan
            Write-Host "   Total utilisateurs: $totalAllUsers" -ForegroundColor White
            Write-Host "   Total crédits consommés: $totalAllCredits" -ForegroundColor White
            Write-Host ""
        } elseif ($All) {
            Write-Host "🌐 GUESTS: Aucun guest trouvé" -ForegroundColor Gray
            Write-Host ""
        }
    }

    if ($TopUsers) {
        Write-Host "🏆 Top 10 utilisateurs" -ForegroundColor Cyan
        Write-Host "=" * 100
        
        # Combiner authentifiés et guests si mode -All
        $allQuotas = @()
        
        # Ajouter les authentifiés avec un marqueur
        foreach ($q in $quotas) {
            $allQuotas += [PSCustomObject]@{
                Type = "Authentifié"
                Identifier = $q.user_id
                Total = $q.total_credits_consumed
                Convs = $q.conversations_created
                Polls = ($q.date_polls_created + $q.form_polls_created + $q.quizz_created + $q.availability_polls_created)
                DatePolls = $q.date_polls_created
                FormPolls = $q.form_polls_created
                Quizz = $q.quizz_created
                AvailabilityPolls = $q.availability_polls_created
                AIMsg = $q.ai_messages
                Analytics = $q.analytics_queries
                Simulations = $q.simulations
            }
        }
        
        # Ajouter les guests avec un marqueur
        if ($All) {
            foreach ($gq in $guestQuotas) {
                $allQuotas += [PSCustomObject]@{
                    Type = "Guest"
                    Identifier = $gq.fingerprint.Substring(0, [Math]::Min(36, $gq.fingerprint.Length))
                    Total = $gq.total_credits_consumed
                    Convs = $gq.conversations_created
                    Polls = ($gq.date_polls_created + $gq.form_polls_created + $gq.quizz_created + $gq.availability_polls_created)
                    DatePolls = $gq.date_polls_created
                    FormPolls = $gq.form_polls_created
                    Quizz = $gq.quizz_created
                    AvailabilityPolls = $gq.availability_polls_created
                    AIMsg = $gq.ai_messages
                    Analytics = $gq.analytics_queries
                    Simulations = $gq.simulations
                }
            }
        }
        
        # Trier par total crédits consommés et prendre le top 10
        $topQuotas = $allQuotas | Sort-Object -Property Total -Descending | Select-Object -First 10
        
        Write-Host ("{0,-12} {1,-40} {2,10} {3,10} {4,10} {5,10} {6,10}" -f "Type", "ID/Fingerprint", "Total", "Convs", "Polls", "IA Msg", "Analytics") -ForegroundColor Yellow
        Write-Host ("-" * 100)
        
        foreach ($quota in $topQuotas) {
            $identifier = $quota.Identifier
            if ($identifier.Length -gt 36) {
                $identifier = $identifier.Substring(0, 33) + "..."
            }
            
            $typeColor = if ($quota.Type -eq "Authentifié") { "Green" } else { "Yellow" }
            
            Write-Host ("{0,-12} {1,-40} {2,10} {3,10} {4,10} {5,10} {6,10}" -f `
                $quota.Type, `
                $identifier, `
                $quota.Total, `
                $quota.Convs, `
                $quota.Polls, `
                $quota.AIMsg, `
                $quota.Analytics) -ForegroundColor $typeColor
        }
        Write-Host ""
        Write-Host "💡 Pour voir les emails des utilisateurs authentifiés, utilisez: sql-scripts/view-user-quotas.sql" -ForegroundColor Yellow
        Write-Host ""
    }

    if (-not $Stats -and -not $TopUsers) {
        # Vue détaillée par défaut
        Write-Host "📋 Liste complète des quotas" -ForegroundColor Cyan
        Write-Host "=" * 100
        
        if (-not $All) {
            Write-Host "⚠️  Note: Les emails ne sont pas disponibles via REST API" -ForegroundColor Yellow
            Write-Host "   Utilisez le script SQL pour voir les emails: sql-scripts/view-user-quotas.sql" -ForegroundColor Yellow
            Write-Host ""
        }
        
        # Limites pour utilisateurs authentifiés (d'après src/constants/quotas.ts)
        $LIMITS_AUTH = @{
            conversations = 1000
            aiMessages = 100
            polls = 5  # Par conversation
            analytics = 50  # Par jour
            total = 100  # Limite globale approximative
        }
        
        # Limites pour guests
        $LIMITS_GUEST = @{
            conversations = 20
            aiMessages = 20
            polls = 20
            analytics = 20
            total = 20
        }
        
        # Afficher les utilisateurs authentifiés
        if ($quotas.Count -gt 0) {
            Write-Host "👤 UTILISATEURS AUTHENTIFIÉS ($($quotas.Count))" -ForegroundColor Green
            Write-Host "-" * 100
            Write-Host ""
            
            foreach ($quota in $quotas) {
                Write-Host "   User ID: $($quota.user_id)" -ForegroundColor Green
                
                # Calculer les crédits disponibles
                $totalConsumed = $quota.total_credits_consumed
                $totalAvailable = $LIMITS_AUTH.total - $totalConsumed
                $percentageUsed = [math]::Round(($totalConsumed / $LIMITS_AUTH.total * 100), 1)
                
                Write-Host "   💳 Crédits: $totalConsumed / $($LIMITS_AUTH.total) consommés ($percentageUsed%)" -ForegroundColor White
                if ($totalAvailable -lt 0) {
                    Write-Host "      ⚠️  Limite dépassée de $([math]::Abs($totalAvailable)) crédits" -ForegroundColor Red
                } elseif ($totalAvailable -lt 20) {
                    Write-Host "      ⚠️  Plus que $totalAvailable crédits disponibles" -ForegroundColor Yellow
                } else {
                    Write-Host "      ✅ $totalAvailable crédits disponibles" -ForegroundColor Green
                }
                
                Write-Host "   📊 Détail par action:" -ForegroundColor Gray
                Write-Host "      ├─ Conversations: $($quota.conversations_created) / $($LIMITS_AUTH.conversations)" -ForegroundColor Gray
                $totalPolls = ($quota.date_polls_created + $quota.form_polls_created + $quota.quizz_created + $quota.availability_polls_created)
                Write-Host "      ├─ Polls (Total): $totalPolls" -ForegroundColor Gray
                Write-Host "      │  ├─ Date Polls: $($quota.date_polls_created)" -ForegroundColor DarkGray
                Write-Host "      │  ├─ Form Polls: $($quota.form_polls_created)" -ForegroundColor DarkGray
                Write-Host "      │  ├─ Quizz: $($quota.quizz_created)" -ForegroundColor DarkGray
                Write-Host "      │  └─ Availability: $($quota.availability_polls_created)" -ForegroundColor DarkGray
                Write-Host "      ├─ Messages IA: $($quota.ai_messages) / $($LIMITS_AUTH.aiMessages)" -ForegroundColor Gray
                Write-Host "      ├─ Analytics: $($quota.analytics_queries) / $($LIMITS_AUTH.analytics) (par jour)" -ForegroundColor Gray
                Write-Host "      └─ Simulations: $($quota.simulations)" -ForegroundColor Gray
                
                if ($Detailed) {
                    Write-Host "   📅 Informations:" -ForegroundColor DarkGray
                    Write-Host "      Dernière mise à jour: $($quota.updated_at)" -ForegroundColor DarkGray
                    if ($quota.subscription_start_date) {
                        Write-Host "      Début abonnement: $($quota.subscription_start_date)" -ForegroundColor DarkGray
                    }
                    if ($quota.last_reset_date) {
                        Write-Host "      Dernier reset: $($quota.last_reset_date)" -ForegroundColor DarkGray
                    }
                }
                Write-Host ""
            }
        }
        
        # Afficher les guests si mode -All
        if ($All -and $guestQuotas.Count -gt 0) {
            Write-Host "🌐 GUESTS ($($guestQuotas.Count))" -ForegroundColor Yellow
            Write-Host "-" * 100
            Write-Host ""
            
            foreach ($guest in $guestQuotas) {
                $fingerprintShort = $guest.fingerprint
                if ($fingerprintShort.Length -gt 50) {
                    $fingerprintShort = $fingerprintShort.Substring(0, 47) + "..."
                }
                
                Write-Host "   Fingerprint: $fingerprintShort" -ForegroundColor Yellow
                
                # Calculer les crédits disponibles
                $totalConsumed = $guest.total_credits_consumed
                $totalAvailable = $LIMITS_GUEST.total - $totalConsumed
                $percentageUsed = [math]::Round(($totalConsumed / $LIMITS_GUEST.total * 100), 1)
                
                Write-Host "   💳 Crédits: $totalConsumed / $($LIMITS_GUEST.total) consommés ($percentageUsed%)" -ForegroundColor White
                if ($totalAvailable -lt 0) {
                    Write-Host "      ⚠️  Limite dépassée de $([math]::Abs($totalAvailable)) crédits" -ForegroundColor Red
                } elseif ($totalAvailable -lt 5) {
                    Write-Host "      ⚠️  Plus que $totalAvailable crédits disponibles" -ForegroundColor Yellow
                } else {
                    Write-Host "      ✅ $totalAvailable crédits disponibles" -ForegroundColor Green
                }
                
                Write-Host "   📊 Détail par action:" -ForegroundColor Gray
                Write-Host "      ├─ Conversations: $($guest.conversations_created) / $($LIMITS_GUEST.conversations)" -ForegroundColor Gray
                $guestTotalPolls = ($guest.date_polls_created + $guest.form_polls_created + $guest.quizz_created + $guest.availability_polls_created)
                Write-Host "      ├─ Polls (Total): $guestTotalPolls / $($LIMITS_GUEST.polls)" -ForegroundColor Gray
                Write-Host "      │  ├─ Date Polls: $($guest.date_polls_created)" -ForegroundColor DarkGray
                Write-Host "      │  ├─ Form Polls: $($guest.form_polls_created)" -ForegroundColor DarkGray
                Write-Host "      │  ├─ Quizz: $($guest.quizz_created)" -ForegroundColor DarkGray
                Write-Host "      │  └─ Availability: $($guest.availability_polls_created)" -ForegroundColor DarkGray
                Write-Host "      ├─ Messages IA: $($guest.ai_messages) / $($LIMITS_GUEST.aiMessages)" -ForegroundColor Gray
                Write-Host "      ├─ Analytics: $($guest.analytics_queries) / $($LIMITS_GUEST.analytics)" -ForegroundColor Gray
                Write-Host "      └─ Simulations: $($guest.simulations)" -ForegroundColor Gray
                
                if ($Detailed) {
                    Write-Host "   📅 Informations:" -ForegroundColor DarkGray
                    Write-Host "      Dernière activité: $($guest.last_activity_at)" -ForegroundColor DarkGray
                    Write-Host "      Créé le: $($guest.created_at)" -ForegroundColor DarkGray
                    if ($guest.last_reset_at) {
                        Write-Host "      Dernier reset: $($guest.last_reset_at)" -ForegroundColor DarkGray
                    }
                }
                Write-Host ""
            }
        } elseif ($All) {
            Write-Host "🌐 GUESTS: Aucun guest trouvé" -ForegroundColor Gray
            Write-Host ""
        }
    }

    Write-Host "✅ Affichage terminé" -ForegroundColor Green

} catch {
    Write-ColorOutput Red "❌ Erreur lors de la récupération des quotas:"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Utilisez le script SQL directement dans Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   Fichier: sql-scripts/view-user-quotas.sql" -ForegroundColor Yellow
}

