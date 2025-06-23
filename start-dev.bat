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
echo  3. Demarrer Vite sur le port 8080 avec acces reseau
echo  4. Permettre l'acces depuis mobile
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
echo 🚀 Demarrage de DooDates...
echo    💻 Local: http://localhost:8080
echo    📱 Mobile: http://192.168.1.15:8080
echo.
echo ⚡ Attendez que l'application soit prete
echo.

REM Démarrer Vite avec host
npm run dev -- --host

pause 