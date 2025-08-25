@echo off
echo Demarrage du serveur dev...
start /min cmd /c "npm run dev"

echo Attente du serveur...
timeout /t 10 /nobreak >nul

echo Test du serveur...
for /l %%i in (1,1,30) do (
    netstat -ano | findstr :8080 >nul
    if not errorlevel 1 (
        echo Serveur detecte, lancement du test...
        npx playwright test tests/e2e/simple-test.spec.ts --project=chromium --reporter=line
        goto :end
    )
    timeout /t 1 /nobreak >nul
)

echo Timeout: serveur non demarre
:end
pause
