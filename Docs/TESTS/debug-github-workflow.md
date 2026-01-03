---
description: Comment analyser un échec de workflow GitHub
---

Ce document décrit les étapes pour identifier, récupérer et analyser les logs d'un workflow GitHub échoué.

1. **Lister les dernières exécutions**
   Affiche les 5 derniers runs pour repérer celui qui a échoué.

   ```bash
   gh run list --limit 5
   ```

2. **Identifier l'ID de l'exécution échouée**
   Repérez la ligne avec un `X` (STATUS failure) et notez l'ID (colonne ID).

3. **Récupérer les logs**
   Pour visualiser les logs directement dans le terminal :

   ```bash
   gh run view <RUN_ID> --log
   ```

   Pour sauvegarder les logs dans un fichier (recommandé pour l'analyse approfondie ou si les logs sont tronqués) :

   ```bash
   gh run view <RUN_ID> --log > workflow_log.txt
   ```

4. **Analyser les logs**
   Recherchez les erreurs courantes.

   _Chercher des erreurs explicites :_

   ```bash
   grep -i "Error" workflow_log.txt
   ```

   _Chercher des échecs de tests (Playwright/Vitest) :_

   ```bash
   grep -i "failed" workflow_log.txt
   grep -i "Timeout" workflow_log.txt
   ```

5. **Localiser le problème dans le code**
   Une fois l'erreur trouvée dans les logs (ex: `TimeoutError: locator.click: Timeout 5000ms exceeded`), repérez le fichier et la ligne indiqués dans la stack trace (ex: `tests/e2e/utils.ts:217`).
   Ouvrez le fichier correspondant pour comprendre le contexte et proposer un fix.
