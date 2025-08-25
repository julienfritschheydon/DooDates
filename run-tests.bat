@echo off
echo 🚀 Lancement des tests E2E ultra-simple...
echo.

npx playwright test tests/e2e/ultra-simple.spec.ts --project=chromium --reporter=line

if %errorlevel% equ 0 (
    echo.
    echo ✅ Tous les tests sont passés !
    echo 📝 Le workflow E2E fonctionne complètement
) else (
    echo.
    echo ❌ Certains tests ont échoué
    echo 📝 Vérifiez les erreurs ci-dessus
)

pause
