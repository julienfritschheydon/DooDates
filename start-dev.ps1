# Script pour démarrer DooDates avec accès réseau mobile
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   DOODATES - DEMARRAGE DEVELOPPEMENT" -ForegroundColor Cyan  
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Nettoyage des instances précédentes..." -ForegroundColor Yellow

# Tuer TOUS les processus Node.js
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object {
            Write-Host "🔴 Arrêt du processus Node.js (PID: $($_.Id))..." -ForegroundColor Gray
            $_ | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Tous les processus Node.js ont été arrêtés." -ForegroundColor Green
    } else {
        Write-Host "✅ Aucun processus Node.js en cours d'exécution." -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Erreur lors de l'arrêt des processus: $_" -ForegroundColor Yellow
}

# Libérer les ports spécifiques
$portsToFree = @(8080, 8081, 3000, 3001, 3002, 5173, 5174, 5175)
foreach ($port in $portsToFree) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            Write-Host "🔄 Libération du port $port..." -ForegroundColor Yellow
            foreach ($conn in $connections) {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process -and $process.Id -gt 4) {
                    try {
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                        Write-Host "🔴 Processus $($process.ProcessName) (PID: $($process.Id)) arrêté" -ForegroundColor Gray
                    } catch {
                        # Ignore les erreurs de processus déjà arrêtés
                    }
                }
            }
        }
    } catch {
        # Port pas utilisé, c'est normal
    }
}

Write-Host ""
Write-Host "🧹 Nettoyage du cache Vite..." -ForegroundColor Yellow

# Supprimer le cache Vite
try {
    Set-Location -Path $PSScriptRoot
    if (Test-Path "node_modules/.vite") {
        Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue
        Write-Host "✅ Cache Vite supprimé" -ForegroundColor Green
    }
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-Host "✅ Dossier dist supprimé" -ForegroundColor Green  
    }
} catch {
    Write-Host "⚠️ Erreur lors du nettoyage du cache: $_" -ForegroundColor Yellow
}

# Attendre un peu pour s'assurer que tous les ports sont libérés
Write-Host "⏳ Attente de la libération des ports..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "🔧 Vérification de l'environnement..." -ForegroundColor Cyan

# Vérifier l'adresse IP locale
try {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
    if (-not $ipAddress) {
        $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
    }
    if ($ipAddress) {
        Write-Host "✅ Adresse IP détectée: $ipAddress" -ForegroundColor Green
    } else {
        $ipAddress = "192.168.1.15"
        Write-Host "⚠️ IP par défaut utilisée: $ipAddress" -ForegroundColor Yellow
    }
} catch {
    $ipAddress = "192.168.1.15"
    Write-Host "⚠️ Erreur détection IP, utilisation par défaut: $ipAddress" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Démarrage de DooDates..." -ForegroundColor Cyan
Write-Host "   💻 Local: http://localhost:8080" -ForegroundColor Magenta
Write-Host "   📱 Mobile: http://$ipAddress:8080" -ForegroundColor Magenta
Write-Host ""
Write-Host "⚡ Attendez que Vite soit prêt avant d'ouvrir le navigateur" -ForegroundColor Yellow
Write-Host "📱 Testez sur votre smartphone avec l'adresse Mobile ci-dessus" -ForegroundColor Green
Write-Host ""

try {
    # Démarrer Vite avec host
    npm run dev -- --host --port 8080
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors du démarrage: $_" -ForegroundColor Red
    Write-Host "🔍 Conseils de dépannage:" -ForegroundColor Yellow
    Write-Host "   1. Vérifiez que le port 8080 est libre" -ForegroundColor Gray
    Write-Host "   2. Essayez de redémarrer en tant qu'administrateur" -ForegroundColor Gray  
    Write-Host "   3. Vérifiez votre pare-feu Windows" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Magenta
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 