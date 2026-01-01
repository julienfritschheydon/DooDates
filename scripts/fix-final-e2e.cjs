#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with remaining specific errors
const fixes = [
  {
    file: 'tests/e2e/rgpd/anonymization.spec.ts',
    pattern: /page\.goto\('form-polls\/\$\{pollSlug\}\/results', \{ waitUntil: 'domcontentloaded' \}\);/,
    replacement: 'page.goto(`form-polls/${pollSlug}/results`, { waitUntil: \'domcontentloaded\' });'
  },
  {
    file: 'tests/e2e/tags-folders.spec.ts',
    pattern: /waitForElementReady\(page, '\[data-testid='poll-item'\', \{/,
    replacement: 'waitForElementReady(page, \'[data-testid="poll-item"]\', {'
  },
  {
    file: 'tests/e2e/ultra-simple-dispo.spec.ts',
    pattern: /const titleSelector = 'input\[placeholder\*='Planification'\], input\[placeholder\*='titre' i\], \[data-testid='poll-title'\';/,
    replacement: 'const titleSelector = \'input[placeholder*="Planification"], input[placeholder*="titre" i], [data-testid="poll-title"]\';'
  },
  {
    file: 'tests/e2e/ultra-simple-form.spec.ts',
    pattern: /waitForElementReady\(page, '\[data-testid='poll-item'\', \{/,
    replacement: 'waitForElementReady(page, \'[data-testid="poll-item"]\', {'
  },
  {
    file: 'tests/e2e/helpers/poll-date-helpers.ts',
    pattern: /waitForElementReady\(page, 'button:has-text\('Publier le sondage'\), \{/,
    replacement: 'waitForElementReady(page, \'button:has-text("Publier le sondage")\', {'
  },
  {
    file: 'tests/e2e/ultra-simple-quizz.spec.ts',
    pattern: /input\[placeholder\*='titre' i\], input\[name\*="title"\], \[data-testid='quizz-title'\]/,
    replacement: 'input[placeholder*="titre" i], input[name*="title"], [data-testid="quizz-title"]'
  },
  {
    file: 'tests/e2e/verify_navigation.spec.ts',
    pattern: /toHaveURL\([^)]+DooDates\/.*\/date-polls\/dashboard[^)]*\);/,
    replacement: 'toHaveURL(/DooDates\\/.*\\/date-polls\\/dashboard/);'
  },
  {
    file: 'tests/e2e/voice-recognition.spec.ts',
    pattern: /page\.goto\("\/quizz\/\$\{MOCK_QUIZZ\.slug\}\/vote", \{ waitUntil: "domcontentloaded" \}\);/,
    replacement: 'page.goto(`/quizz/${MOCK_QUIZZ.slug}/vote`, { waitUntil: "domcontentloaded" });'
  }
];

console.log(`Fixing ${fixes.length} specific patterns...`);

let fixedFiles = 0;

fixes.forEach(({ file, pattern, replacement }) => {
  const fullPath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  const fixed = content.replace(pattern, replacement);

  if (fixed !== originalContent) {
    fs.writeFileSync(fullPath, fixed);
    console.log(`✅ Fixed: ${file}`);
    fixedFiles++;
  } else {
    console.log(`✓ OK: ${file}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${fixes.length} total.`);
