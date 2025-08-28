# 🤖 Automatisation Tests E2E DooDates

## E2E conventions (Playwright)

- **Warmup**: utilisez le helper partagé `warmup(page)` pour amorcer Vite/les routes et réduire les erreurs transitoires d'import dynamique. Source: `tests/e2e/utils.ts` (lien: https://github.com/julienfritschheydon/DooDates/blob/main/tests/e2e/utils.ts)
- **Garde console**: encapsulez chaque test avec la garde `attachConsoleGuard` et vérification en `finally`.

Exemple minimal:

```ts
import { test, expect } from '@playwright/test';
import { warmup, attachConsoleGuard } from './utils'; // chemin réel dans tests/e2e

test('Example with warmup + console guard', async ({ page }) => {
  const guard = attachConsoleGuard(page, {
    allowlist: [/Importing a module script failed\./i, /error loading dynamically imported module/i],
  });
  try {
    await warmup(page); // prime dev server + routes
    await page.goto('/');
    await expect(page).toHaveTitle(/DooDates/);
  } finally {
    await guard.assertClean();
    guard.stop();
  }
});
```

## **Option 1 : Tests Playwright (Recommandé)**

### Installation
```bash
npm install -D @playwright/test
npx playwright install
```

### Configuration `playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Example `tests/e2e/poll-creation.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('DooDates E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('Phase 1-3: Create simple poll', async ({ page }) => {
    await page.goto('/');
    
    // Phase 1: Creation
    await expect(page.locator('h1')).toContainText('DooDates');
    await page.click('[data-testid="create-poll-button"]'); // Besoin d'ajouter data-testid
    
    // Title required
    await page.fill('[data-testid="poll-title"]', 'Test Poll');
    
    // Select dates
    await page.click('[data-testid="date-selector"]');
    await page.click('[data-testid="date-tomorrow"]');
    await page.click('[data-testid="date-day-after"]');
    
    // Phase 3: Finalize
    await page.click('[data-testid="finalize-poll"]');
    
    // Verify redirect to dashboard
    await expect(page.url()).toContain('/dashboard');
    await expect(page.locator('[data-testid="poll-item"]')).toContainText('Test Poll');
  });

  test('Phase 5-6: Vote on poll', async ({ page }) => {
    // Create poll first (helper function)
    await createTestPoll(page, 'Vote Test Poll');
    
    // Navigate to vote
    await page.click('[data-testid="vote-button"]');
    
    // Vote on options
    await page.click('[data-testid="vote-yes-option-0"]');
    await page.click('[data-testid="vote-no-option-1"]');
    
    // Submit vote
    await page.click('[data-testid="submit-votes"]');
    await page.fill('[data-testid="voter-name"]', 'Test Voter');
    await page.click('[data-testid="confirm-vote"]');
    
    // Verify success
    await expect(page.locator('[data-testid="vote-success"]')).toBeVisible();
  });
});

async function createTestPoll(page, title: string) {
  await page.goto('/');
  await page.click('[data-testid="create-poll-button"]');
  await page.fill('[data-testid="poll-title"]', title);
  await page.click('[data-testid="date-tomorrow"]');
  await page.click('[data-testid="finalize-poll"]');
}
```

## **Option 2 : Tests Cypress**

### Installation
```bash
npm install -D cypress
npx cypress open
```

### Configuration `cypress.config.js`
```javascript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
```

### Test Example `cypress/e2e/doodates.cy.js`
```javascript
describe('DooDates E2E', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
  })

  it('should create and vote on poll', () => {
    // Create poll
    cy.get('[data-testid="create-poll-button"]').click()
    cy.get('[data-testid="poll-title"]').type('Cypress Test')
    cy.get('[data-testid="date-tomorrow"]').click()
    cy.get('[data-testid="finalize-poll"]').click()
    
    // Vote
    cy.get('[data-testid="vote-button"]').click()
    cy.get('[data-testid="vote-yes-option-0"]').click()
    cy.get('[data-testid="submit-votes"]').click()
    cy.get('[data-testid="voter-name"]').type('Cypress Voter')
    cy.get('[data-testid="confirm-vote"]').click()
    
    // Verify
    cy.get('[data-testid="vote-success"]').should('be.visible')
  })
})
```

## **Option 3 : Tests Manuels Assistés**

### Script de Test Manuel `tests/manual-test-runner.js`
```javascript
// Script pour guider les tests manuels
const testSteps = [
  {
    phase: "Phase 1: Création",
    steps: [
      "✅ Ouvrir http://localhost:8080",
      "✅ Cliquer sur le bouton +",
      "✅ Essayer de continuer sans titre (doit échouer)",
      "✅ Saisir un titre",
      "✅ Sélectionner 3 dates",
    ]
  },
  // ... autres phases
];

console.log("🧪 Guide de Test Manuel DooDates");
testSteps.forEach((phase, i) => {
  console.log(`\n${i+1}. ${phase.phase}`);
  phase.steps.forEach(step => console.log(`   ${step}`));
});
```

## **Étapes pour Implémenter**

### 1. Ajouter les data-testid
```bash
# Rechercher tous les éléments à tester
grep -r "onClick\|button\|input" src/components/ --include="*.tsx"
```

### 2. Modifier les composants
```typescript
// Exemple dans PollCreator.tsx
<button 
  data-testid="create-poll-button"
  onClick={handleCreate}
>
  Créer un sondage
</button>

<input 
  data-testid="poll-title"
  value={title}
  onChange={handleTitleChange}
/>
```

### 3. Lancer les tests
```bash
# Playwright
npm run test:e2e

# Cypress  
npm run cypress:open

# Manuel
node tests/manual-test-runner.js
```

## **Recommandation**

**Playwright** est le plus adapté pour DooDates car :
- ✅ Tests rapides et fiables
- ✅ Support PWA natif
- ✅ Screenshots automatiques
- ✅ Parallélisation
- ✅ CI/CD ready

Voulez-vous que j'implémente les data-testid dans les composants ?
