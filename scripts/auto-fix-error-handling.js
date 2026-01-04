import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ERROR_HANDLING_IMPORT = 'import { ErrorFactory } from "@/lib/error-handling";\n';
const SRC_DIR = path.join(process.cwd(), "src");

function findFilesWithErrorHandling() {
  try {
    const result = execSync(
      'git grep -l "ErrorFactory\\|useErrorHandling\\|logError" -- "*.ts" "*.tsx" "*.js" "*.jsx" || true',
      { cwd: process.cwd() },
    ).toString();
    return result.split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error finding files:", error.message);
    return [];
  }
}

function addErrorHandlingImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    if (content.includes("@/lib/error-handling") || content.includes("@/hooks/useErrorHandling")) {
      console.log(
        `✓ ${path.relative(process.cwd(), filePath)} - already has error handling import`,
      );
      return false;
    }

    const importRegex = /(^|\n)(import\s+.*?\s+from\s+['"].*?['"];)/g;
    const lastImportMatch = [...content.matchAll(importRegex)].pop();

    let newContent;
    if (lastImportMatch) {
      newContent =
        content.slice(0, lastImportMatch.index + lastImportMatch[0].length) +
        "\n" +
        ERROR_HANDLING_IMPORT +
        content.slice(lastImportMatch.index + lastImportMatch[0].length);
    } else {
      newContent = ERROR_HANDLING_IMPORT + "\n" + content;
    }

    fs.writeFileSync(filePath, newContent);
    console.log(`✓ ${path.relative(process.cwd(), filePath)} - added error handling import`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log("🔍 Finding files that need error handling imports...");
  const files = findFilesWithErrorHandling();

  if (files.length === 0) {
    console.log("🎉 No files need error handling imports!");
    return;
  }

  console.log(`📝 Found ${files.length} files that might need error handling imports`);

  let filesUpdated = 0;
  files.forEach((file) => {
    if (addErrorHandlingImport(path.resolve(process.cwd(), file))) {
      filesUpdated++;
    }
  });

  console.log(`\n✅ Successfully updated ${filesUpdated} files with error handling imports`);

  try {
    console.log("\n🔧 Running ESLint to fix formatting...");
    execSync("npx eslint --fix " + files.join(" "), { stdio: "inherit" });
    console.log("✨ ESLint formatting complete");
  } catch (error) {
    console.log("⚠️  ESLint found issues that need manual fixing");
  }
}

main();
