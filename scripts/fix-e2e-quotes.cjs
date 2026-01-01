#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, '../tests/e2e');

// Find all .spec.ts files
const files = fs.readdirSync(e2eDir)
  .filter(file => file.endsWith('.spec.ts'))
  .map(file => path.join(e2eDir, file));

console.log(`Found ${files.length} E2E test files to check...`);

let fixedFiles = 0;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix common patterns
  let fixed = content
    // Fix goto calls with single quotes
    .replace(/page\.goto\('([^']+)'/g, 'page.goto("/$1"')
    // Fix goto calls with mixed quotes
    .replace(/page\.goto\("([^"]+)",\s*waitUntil:\s*'([^']+)'\)/g, 'page.goto("/$1", { waitUntil: "$2" })')
    // Fix template literals in goto
    .replace(/page\.goto\(`([^`]+)`/g, 'page.goto("/$1"')
    // Fix expect with toHaveURL regex patterns
    .replace(/toHaveURL\('([^']+)\/([^']+)'/g, 'toHaveURL("/$1/$2"')
    // Fix other common patterns
    .replace(/getByText\('([^']+)'/g, 'getByText("$1"')
    .replace(/getByRole\('([^']+)'/g, 'getByRole("$1"')
    .replace(/locator\('([^']+)'/g, 'locator("$1"')
    // Fix regex patterns in toHaveURL  
    .replace(/\/([^\/]+)\/([^\/]*)\//g, '/$1/$2/');

  if (fixed !== originalContent) {
    fs.writeFileSync(filePath, fixed);
    console.log(`✅ Fixed: ${path.basename(filePath)}`);
    fixedFiles++;
  } else {
    console.log(`✓ OK: ${path.basename(filePath)}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${files.length} total.`);
