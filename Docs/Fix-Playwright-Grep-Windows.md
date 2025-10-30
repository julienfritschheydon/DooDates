# Fix: Playwright --grep ne trouve pas les tests sur Windows

## Problème

Les tests E2E Playwright avec tags (`@smoke`, `@critical`, etc.) n'étaient pas détectés lors de l'exécution via `npm run test:e2e:smoke` sur Windows/PowerShell.

**Symptôme :**
```bash
npm run test:e2e:smoke
# Error: No tests found
```

**Cause :**
Les guillemets simples dans les scripts npm ne sont pas correctement interprétés par PowerShell sur Windows. Le pattern `--grep='@smoke'` était traité littéralement avec les guillemets, ce qui ne matchait aucun test.

## Solution

Supprimer les guillemets autour des patterns grep dans `package.json`.

### Avant (❌ Ne fonctionne pas sur Windows)
```json
{
  "scripts": {
    "test:e2e:smoke": "playwright test --project=chromium --grep='@smoke'",
    "test:e2e:critical": "playwright test --grep='@critical'"
  }
}
```

### Après (✅ Fonctionne cross-platform)
```json
{
  "scripts": {
    "test:e2e:smoke": "playwright test --project=chromium --grep @smoke",
    "test:e2e:critical": "playwright test --grep @critical"
  }
}
```

## Vérification

```bash
# Lister les tests détectés
npx playwright test --list --grep @smoke

# Exécuter les tests smoke
npm run test:e2e:smoke

# Exécuter les tests critical
npm run test:e2e:critical
```

## Tests concernés

- `@smoke` - Tests critiques de non-régression (4 tests)
- `@critical` - Tests critiques (20 tests)
- `@functional` - Tests fonctionnels complets

## Impact

Cette correction permet au hook `pre-push` de fonctionner correctement sur Windows, Linux et Mac, garantissant que les tests E2E smoke passent avant chaque push vers `main`.

## Fichiers modifiés

- `package.json` - Scripts `test:e2e:smoke`, `test:e2e:critical`, `test:e2e:functional`

## Date de résolution

30 octobre 2025
