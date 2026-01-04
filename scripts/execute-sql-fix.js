#!/usr/bin/env node
/**
 * Execute SQL file against linked Supabase project
 * Uses Supabase Management API to execute SQL
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the SQL file
const sqlFile = join(__dirname, "..", "sql-scripts", "fix-linter-warnings.sql");
const sql = readFileSync(sqlFile, "utf-8");

console.log("📝 Executing SQL fixes for linter warnings...\n");

// Use Supabase CLI to execute SQL via psql
// First, we need to get the database connection string
try {
  // Execute SQL using supabase db execute (if available) or psql
  // Since supabase CLI doesn't have direct execute, we'll use psql with connection from config

  // Get project config to find connection details
  const configPath = join(__dirname, "..", ".supabase", "config.toml");

  console.log("⚠️  Direct SQL execution via CLI is not available.");
  console.log("\n📋 Please execute the SQL file manually using one of these methods:\n");
  console.log("Option 1: Supabase Dashboard SQL Editor");
  console.log("  1. Go to https://supabase.com/dashboard/project/outmbbisrrdiumlweira/sql");
  console.log("  2. Copy and paste the contents of: sql-scripts/fix-linter-warnings.sql");
  console.log('  3. Click "Run"\n');

  console.log("Option 2: Using psql (if you have the connection string)");
  console.log('  psql "your-connection-string" -f sql-scripts/fix-linter-warnings.sql\n');

  console.log("Option 3: Using Supabase CLI with db push (create migration)");
  console.log("  See: https://supabase.com/docs/guides/cli/managing-environments\n");

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
