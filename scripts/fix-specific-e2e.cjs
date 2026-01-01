#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with specific errors from the CI logs
const filesToFix = [
  'tests/e2e/advanced-settings.spec.ts',
  'tests/e2e/analytics-ai-optimized.spec.ts',
  'tests/e2e/auth.feature.spec.ts',
  'tests/e2e/authenticated-workflow.spec.ts',
  'tests/e2e/availability-poll-workflow.spec.ts',
  'tests/e2e/availability-polls.feature.spec.ts',
  'tests/e2e/console-errors.spec.ts',
  'tests/e2e/dashboard-complete.spec.ts',
  'tests/e2e/dashboard-edge-cases.spec.ts',
  'tests/e2e/docs-production.spec.ts',
  'tests/e2e/docs.spec.ts',
  'tests/e2e/form-poll-results-access.spec.ts',
  'tests/e2e/formpolls.feature.spec.ts',
  'tests/e2e/GoogleSignIn.spec.ts',
  'tests/e2e/guest-quota.spec.ts',
  'tests/e2e/hyper-task.feature.spec.ts',
  'tests/e2e/LanguageSelector.spec.ts',
  'tests/e2e/main-landing.spec.ts',
  'tests/e2e/mobile-drag-drop.spec.ts',
  'tests/e2e/mobile-voting.spec.ts',
  'tests/e2e/poll-enforcement.spec.ts',
  'tests/e2e/quota-tracking-complete.spec.ts',
  'tests/e2e/quota-tracking.feature.spec.ts',
  'tests/e2e/quizz-sidebar-check.spec.ts',
  'tests/e2e/quizz.feature.spec.ts',
  'tests/e2e/results-access-control.spec.ts',
  'tests/e2e/rgpd/anonymization.spec.ts',
  'tests/e2e/security-isolation.spec.ts',
  'tests/e2e/security-rate-limiting-rgpd.spec.ts',
  'tests/e2e/tags-folders.spec.ts',
  'tests/e2e/ultra-simple-dispo.spec.ts',
  'tests/e2e/ultra-simple-form.spec.ts',
  'tests/e2e/ultra-simple-poll.spec.ts',
  'tests/e2e/ultra-simple-quizz.spec.ts',
  'tests/e2e/verify_navigation.spec.ts',
  'tests/e2e/voice-recognition.spec.ts'
];

console.log(`Fixing ${filesToFix.length} specific E2E files...`);

let fixedFiles = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Fix specific patterns identified in CI logs
  let fixed = content
    // Fix data-testid attributes with nested quotes
    .replace(/\[data-testid="([^"]+)"\]/g, '[data-testid=\'$1\']')
    // Fix placeholder attributes with nested quotes
    .replace(/placeholder\*="([^"]+)"/g, 'placeholder*=\'$1\'')
    // Fix type attributes with nested quotes
    .replace(/type="([^"]+)"/g, 'type=\'$1\'')
    // Fix name attributes with nested quotes
    .replace(/name="([^"]+)"/g, 'name=\'$1\'')
    // Fix aria-label attributes with nested quotes
    .replace(/aria-label\*="([^"]+)"/g, 'aria-label*=\'$1\'')
    // Fix class attributes with nested quotes
    .replace(/\[class\*="([^"]+)"\]/g, '[class*=\'$1\']')
    // Fix button[name] attributes
    .replace(/button\[name="([^"]+)"\]/g, 'button[name=\'$1\']')
    // Fix waitUntil with nested quotes
    .replace(/waitUntil: "([^"]+)"/g, 'waitUntil: \'$1\'')
    // Fix hasText with nested quotes
    .replace(/hasText: "([^"]+)"/g, 'hasText: \'$1\'')
    // Fix regex patterns in toHaveURL (remove invalid flags)
    .replace(/toHaveURL\([^)]+\/([^)]+)\)/g, (match, pattern) => {
      // Fix patterns like /DooDates/\/date-polls/ -> /DooDates\\/date-polls/
      return match.replace(/\/([^\/]+)\//g, '/$1\\\\/');
    });

  if (fixed !== originalContent) {
    fs.writeFileSync(fullPath, fixed);
    console.log(`✅ Fixed: ${filePath}`);
    fixedFiles++;
  } else {
    console.log(`✓ OK: ${filePath}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${filesToFix.length} total.`);
