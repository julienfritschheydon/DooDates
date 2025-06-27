@echo off
color 0B
cls
echo ===============================================
echo    DOODATES - DEMARRAGE DEVELOPPEMENT
echo ===============================================
echo.
echo Cette commande va :
echo  1. Arreter toutes les instances precedentes
echo  2. Nettoyer le cache Vite
echo  3. Demarrer le serveur email sur le port 3001
echo  4. Demarrer Vite sur le port 8080 avec acces reseau
echo  5. Permettre l'acces depuis mobile
echo.
echo ===============================================
echo.

REM Tuer tous les processus Node.js
echo 🔄 Nettoyage des processus Node.js...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Processus Node.js arretes
) else (
    echo ✅ Aucun processus Node.js en cours
)

REM Supprimer le cache Vite
echo 🧹 Nettoyage du cache...
if exist "node_modules/.vite" (
    rmdir /s /q "node_modules/.vite" >nul 2>&1
    echo ✅ Cache Vite supprime
)

echo.
echo 📧 Demarrage du serveur email...
REM Load environment variables from .env file if it exists
if exist ".env" (
    echo 🔑 Chargement des variables d'environnement depuis .env...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%b"=="" (
            set "%%a=%%b"
        )
    )
    echo ✅ Variables d'environnement chargees
) else (
    echo ⚠️  Fichier .env non trouve - utilisation des valeurs par defaut
    echo    Creez un fichier .env avec votre cle API Resend
)
start /B cmd /c "node simple-email-server.cjs"
timeout /t 2 >nul
echo ✅ Serveur email demarre sur http://localhost:3001

echo.
echo 🚀 Demarrage de DooDates...
echo    💻 Local: http://localhost:8080
echo    📱 Mobile: http://192.168.1.15:8080
echo    📧 Email: http://localhost:3001
echo.
echo ⚡ Attendez que l'application soit prete
echo.

REM Démarrer Vite avec host
npm run dev -- --host

pause