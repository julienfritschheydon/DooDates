#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with remaining errors
const filesToFix = [
  'tests/e2e/security-rate-limiting-rgpd.spec.ts',
  'tests/e2e/tags-folders.spec.ts',
  'tests/e2e/ultra-simple-dispo.spec.ts',
  'tests/e2e/ultra-simple-form.spec.ts',
  'tests/e2e/helpers/poll-date-helpers.ts',
  'tests/e2e/ultra-simple-quizz.spec.ts',
  'tests/e2e/verify_navigation.spec.ts',
  'tests/e2e/voice-recognition.spec.ts'
];

console.log(`Fixing remaining ${filesToFix.length} E2E files...`);

let fixedFiles = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Fix remaining specific patterns
  let fixed = content
    // Fix button:has-text with nested quotes
    .replace(/button:has-text\("([^"]+)"\)/g, 'button:has-text(\'$1\')')
    // Fix data-testid in waitForElementReady calls
    .replace(/waitForElementReady\(page, '\[data-testid='([^']+)'\',/g, 'waitForElementReady(page, \'[data-testid="$1"]\',')
    // Fix placeholder selectors with mixed quotes
    .replace(/placeholder\*='([^']+)'/g, 'placeholder*=\'$1\'')
    // Fix regex patterns with double backslashes
    .replace(/toHaveURL\([^)]+\\\\\/([^)]+)\)/g, (match, pattern) => {
      return match.replace(/\\\\\//g, '/');
    })
    // Fix template literals in goto
    .replace(/goto\("([^"]+)"\s*\$\{([^}]+)\}([^"]+)",/g, 'goto(`$1${$2}$3`,')
    // Fix waitUntil with single quotes that should be double
    .replace(/waitUntil: '([^']+)'/g, 'waitUntil: "$1"');

  if (fixed !== originalContent) {
    fs.writeFileSync(fullPath, fixed);
    console.log(`✅ Fixed: ${filePath}`);
    fixedFiles++;
  } else {
    console.log(`✓ OK: ${filePath}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${filesToFix.length} total.`);
