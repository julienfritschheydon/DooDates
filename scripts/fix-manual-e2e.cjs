#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Files with remaining specific errors - manual fixes needed
const manualFixes = [
  {
    file: "tests/e2e/rgpd/anonymization.spec.ts",
    line: 82,
    find: "await page.goto('form-polls/${pollSlug}/results', { waitUntil: 'domcontentloaded' });",
    replace:
      "await page.goto(`form-polls/${pollSlug}/results`, { waitUntil: 'domcontentloaded' });",
  },
  {
    file: "tests/e2e/tags-folders.spec.ts",
    line: 86,
    find: "const conversationCard = await waitForElementReady(page, '[data-testid='poll-item']', {",
    replace:
      "const conversationCard = await waitForElementReady(page, '[data-testid=\"poll-item\"]', {",
  },
  {
    file: "tests/e2e/ultra-simple-dispo.spec.ts",
    line: 68,
    find: "const titleSelector = 'input[placeholder*='Planification'], input[placeholder*='titre' i], [data-testid='poll-title']';",
    replace:
      'const titleSelector = \'input[placeholder*="Planification"], input[placeholder*="titre" i], [data-testid="poll-title"]\';',
  },
  {
    file: "tests/e2e/ultra-simple-form.spec.ts",
    line: 190,
    find: "const pollItem = await waitForElementReady(page, '[data-testid='poll-item']', {",
    replace: "const pollItem = await waitForElementReady(page, '[data-testid=\"poll-item\"]', {",
  },
  {
    file: "tests/e2e/helpers/poll-date-helpers.ts",
    line: 155,
    find: "const finalizeBtn = await waitForElementReady(page, 'button:has-text('Publier le sondage')', {",
    replace:
      "const finalizeBtn = await waitForElementReady(page, 'button:has-text(\"Publier le sondage\")', {",
  },
  {
    file: "tests/e2e/ultra-simple-quizz.spec.ts",
    line: 61,
    find: "const formTitle = page.locator(\"input[placeholder*='titre' i], input[name*=\"title\"], [data-testid='quizz-title']\").first();",
    replace:
      'const formTitle = page.locator(\'input[placeholder*="titre" i], input[name*="title"], [data-testid="quizz-title"]\').first();',
  },
  {
    file: "tests/e2e/verify_navigation.spec.ts",
    line: 39,
    find: "await expect(page).toHaveURL(/DooDates/.*\\/date-polls\\/dashboard/);",
    replace: "await expect(page).toHaveURL(/DooDates\\/.*\\/date-polls\\/dashboard/);",
  },
  {
    file: "tests/e2e/voice-recognition.spec.ts",
    line: 120,
    find: 'await page.goto("/quizz/${MOCK_QUIZZ.slug}/vote", { waitUntil: "domcontentloaded" });',
    replace:
      'await page.goto(`/quizz/${MOCK_QUIZZ.slug}/vote`, { waitUntil: "domcontentloaded" });',
  },
];

console.log(`Applying ${manualFixes.length} manual fixes...`);

let fixedFiles = 0;

manualFixes.forEach(({ file, line, find, replace }) => {
  const fullPath = path.join(__dirname, "..", file);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const originalContent = content;

  if (content.includes(find)) {
    const fixed = content.replace(find, replace);
    fs.writeFileSync(fullPath, fixed);
    console.log(`✅ Fixed: ${file} line ${line}`);
    fixedFiles++;
  } else {
    console.log(`⚠️ Pattern not found in: ${file} line ${line}`);
    console.log(`   Looking for: ${find}`);
  }
});

console.log(`\n🎉 Fixed ${fixedFiles} files out of ${manualFixes.length} total.`);
