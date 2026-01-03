#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with specific syntax errors from CI logs
const criticalFixes = [
  {
    file: 'tests/e2e/advanced-settings.spec.ts',
    line: 10,
    pattern: /page\.fill\("input\[placeholder\*="\Réunion"\]/,
    replacement: 'page.fill(\'input[placeholder*="Réunion"]\')'
  },
  {
    file: 'tests/e2e/analytics-ai-optimized.spec.ts',
    line: 38,
    pattern: /page\.goto\("\/\/DooDates\/poll\/\$\{slug\}\/results\?e2e-test=true`, \{ waitUntil: 'domcontentloaded' \}\);/,
    replacement: 'page.goto(`/DooDates/poll/${slug}/results?e2e-test=true`, { waitUntil: \'domcontentloaded\' });'
  },
  {
    file: 'tests/e2e/auth.feature.spec.ts',
    line: 91,
    pattern: /page\.locator\("\[data-testid="\chat\-input"\]"\)/,
    replacement: 'page.locator(\'[data-testid="chat-input"]\')'
  },
  {
    file: 'tests/e2e/authenticated-workflow.spec.ts',
    line: 93,
    pattern: /page\.locator\("\[data-testid="\chat\-input"\]"\)/,
    replacement: 'page.locator(\'[data-testid="chat-input"]\')'
  },
  {
    file: 'tests/e2e/availability-poll-workflow.spec.ts',
    line: 52,
    pattern: /toHaveURL\(\/DooDates\\\\\/workspace\\\\\/availability\\\\\/\)/,
    replacement: 'toHaveURL(/DooDates\\/.*\\/workspace\\/availability\\//)'
  },
  {
    file: 'tests/e2e/availability-polls.feature.spec.ts',
    line: 177,
    pattern: /page\.locator\("\[data-testid="\chat\-input"\]"\)/,
    replacement: 'page.locator(\'[data-testid="chat-input"]\')'
  },
  {
    file: 'tests/e2e/console-errors.spec.ts',
    line: 362,
    pattern: /page\.locator\("\[data-testid="\create\-form\-button"\]"\)/,
    replacement: 'page.locator(\'[data-testid="create-form-button"]\')'
  },
  {
    file: 'tests/e2e/dashboard-complete.spec.ts',
    line: 88,
    pattern: /page\.locator\("\[data-testid="\dashboard\-loading"\]"\)/,
    replacement: 'page.locator(\'[data-testid="dashboard-loading"]\')'
  },
  {
    file: 'tests/e2e/dashboard-edge-cases.spec.ts',
    line: 101,
    pattern: /page\.locator\("\[data-testid="\poll\-item"\]"\)/,
    replacement: 'page.locator(\'[data-testid="poll-item"]\')'
  },
  {
    file: 'tests/e2e/docs-production.spec.ts',
    line: 77,
    pattern: /'\.docs-content, \.prose, \[class\*='\prose'\]'/,
    replacement: '\'.docs-content, .prose, [class*="prose"]\''
  },
  {
    file: 'tests/e2e/production-smoke.spec.ts',
    line: 523,
    pattern: /page\.locator\("\[role="\alert"\]"\)/,
    replacement: 'page.locator(\'[role="alert"]\')'
  },
  {
    file: 'tests/e2e/rgpd/anonymization.spec.ts',
    line: 82,
    pattern: /page\.goto\('form-polls\/\$\{pollSlug\}\/results`, \{ waitUntil: 'domcontentloaded' \}\);/,
    replacement: 'page.goto(`form-polls/${pollSlug}/results`, { waitUntil: \'domcontentloaded\' });'
  },
  {
    file: 'tests/e2e/security-isolation.spec.ts',
    line: 109,
    pattern: /page\.locator\("\[data-testid="\chat\-input"\]"\)/,
    replacement: 'page.locator(\'[data-testid="chat-input"]\')'
  },
  {
    file: 'tests/e2e/security-rate-limiting-rgpd.spec.ts',
    line: 194,
    pattern: /page\.locator\("\[data-testid="\consent\-banner"\], \.consent-banner, #cookie-consent"\)/,
    replacement: 'page.locator(\'[data-testid="consent-banner"], .consent-banner, #cookie-consent\')'
  },
  {
    file: 'tests/e2e/tags-folders.spec.ts',
    line: 160,
    pattern: /page\.locator\("div\[data-state="\open"\]", \{ hasText: 'Mise à jour réussie' \}\)/,
    replacement: 'page.locator(\'div[data-state="open"]\', { hasText: \'Mise à jour réussie\' })'
  },
  {
    file: 'tests/e2e/ultra-simple-dispo.spec.ts',
    line: 75,
    pattern: /page\.locator\("textarea\[placeholder\*="\Indiquez"\], textarea\[placeholder\*="\description" i\]"\)/,
    replacement: 'page.locator(\'textarea[placeholder*="Indiquez"], textarea[placeholder*="description" i]\')'
  },
  {
    file: 'tests/e2e/helpers/poll-date-helpers.ts',
    line: 288,
    pattern: /toHaveURL\(\/DooDates\/\\\/date-polls\/workspace\/date\/\)/,
    replacement: 'toHaveURL(/DooDates\\/.*\\/date-polls\\/workspace\\/date/)'
  },
  {
    file: 'tests/e2e/ultra-simple-quizz.spec.ts',
    line: 60,
    pattern: /page\.locator\("\[data-testid="\chat\-input"\]"\)/,
    replacement: 'page.locator(\'[data-testid="chat-input"]\')'
  },
  {
    file: 'tests/e2e/verify_navigation.spec.ts',
    line: 52,
    pattern: /toHaveURL\(\\\/DooDates\\\/.*\\\/form-polls\\\/dashboard\\\/\)/,
    replacement: 'toHaveURL(/DooDates\\/.*\\/form-polls\\/dashboard/)'
  },
  {
    file: 'tests/e2e/voice-recognition.spec.ts',
    line: 120,
    pattern: /page\.goto\("\/quizz\/\$\{MOCK_QUIZZ\.slug\}\/vote", \{ waitUntil: "domcontentloaded" \}\);/,
    replacement: 'page.goto(`/quizz/${MOCK_QUIZZ.slug}/vote`, { waitUntil: "domcontentloaded" });'
  }
];

console.log(`Applying ${criticalFixes.length} critical fixes from CI logs...`);

let fixedFiles = 0;

criticalFixes.forEach(({ file, line, pattern, replacement }) => {
  const fullPath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  if (content.match(pattern)) {
    const fixed = content.replace(pattern, replacement);
    fs.writeFileSync(fullPath, fixed);
    console.log(`✅ Fixed: ${file} line ${line}`);
    fixedFiles++;
  } else {
    console.log(`⚠️ Pattern not found in: ${file} line ${line}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${criticalFixes.length} critical fixes.`);
