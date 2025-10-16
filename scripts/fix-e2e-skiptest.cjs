#!/usr/bin/env node
/**
 * Fix test.skiptest() typo in E2E tests
 * Replaces all occurrences with test.skip()
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const e2eDir = path.join(__dirname, '../tests/e2e');
const pattern = '**/*.spec.ts';

console.log('🔍 Searching for E2E test files in:', e2eDir);
const files = glob.sync(pattern, { cwd: e2eDir, absolute: true });
console.log(`✅ Found ${files.length} files\n`);

let totalReplacements = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace test.skiptest( with test.skip(
  const fixed = content.replace(/test\.skiptest\(/g, 'test.skip(');
  
  if (original !== fixed) {
    const count = (original.match(/test\.skiptest\(/g) || []).length;
    fs.writeFileSync(file, fixed, 'utf8');
    console.log(`✅ ${path.basename(file)}: ${count} replacement(s)`);
    totalReplacements += count;
  } else {
    console.log(`⏭️  ${path.basename(file)}: No changes needed`);
  }
});

console.log(`\n✨ Done! Total replacements: ${totalReplacements}`);
