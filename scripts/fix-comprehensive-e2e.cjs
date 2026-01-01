#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all E2E files
const e2eDir = path.join(__dirname, '../tests/e2e');
const files = fs.readdirSync(e2eDir)
  .filter(file => file.endsWith('.spec.ts'))
  .map(file => path.join(e2eDir, file));

console.log(`Final fix for ${files.length} E2E files...`);

let fixedFiles = 0;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Comprehensive fix patterns
  let fixed = content
    // Fix template literals in goto - simpler pattern
    .replace(/page\.goto\('form-polls\/\$\{([^}]+)\}\/results', \{ waitUntil: 'domcontentloaded' \}\);/g, 'page.goto(`form-polls/${$1}/results`, { waitUntil: \'domcontentloaded\' });')
    .replace(/page\.goto\("\/quizz\/\$\{MOCK_QUIZZ\.slug\}\/vote", \{ waitUntil: "domcontentloaded" \}\);/g, 'page.goto(`/quizz/${MOCK_QUIZZ.slug}/vote`, { waitUntil: "domcontentloaded" });')
    
    // Fix data-testid selectors
    .replace(/\[data-testid='([^']+)'\]/g, '[data-testid="$1"]')
    
    // Fix placeholder selectors
    .replace(/placeholder\*='([^']+)'/g, 'placeholder*="$1"')
    
    // Fix button:has-text
    .replace(/button:has-text\('([^']+)'\)/g, 'button:has-text("$1")')
    
    // Fix regex patterns in toHaveURL
    .replace(/toHaveURL\([^)]+DooDates\/[^)]+\)/g, (match) => {
      return match.replace(/\//g, '\\/');
    })
    
    // Fix input selectors with mixed quotes
    .replace(/input\[placeholder\*="([^"]+)" i\]/g, 'input[placeholder*="$1" i]')
    
    // Fix any remaining single quotes in selectors that should be double
    .replace(/locator\('([^']+)"([^"]*)'([^']*)'\)/g, 'locator(\'$1"$2"$3\')')
    
    // Fix form-polls template literals
    .replace(/'form-polls\/\$\{([^}]+)\}\/results'/g, '`form-polls/${$1}/results`');

  if (fixed !== originalContent) {
    fs.writeFileSync(filePath, fixed);
    console.log(`✅ Fixed: ${path.basename(filePath)}`);
    fixedFiles++;
  } else {
    console.log(`✓ OK: ${path.basename(filePath)}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${files.length} total.`);
