#!/usr/bin/env npx ts-node
/**
 * AI Night Tester - Entry Point
 *
 * Run the autonomous AI testing agent
 *
 * Usage:
 *   npx tsx scripts/ai-night-tester/run-night-test.ts
 *   npx tsx scripts/ai-night-tester/run-night-test.ts --duration 30m
 *   npx tsx scripts/ai-night-tester/run-night-test.ts --mode feature-discovery --duration 30m
 *   npx tsx scripts/ai-night-tester/run-night-test.ts --duration 5m --debug
 */

import { Orchestrator } from "./orchestrator";
import { config } from "./ai-night-tester.config";
import type { TesterMode } from "./types";

function parseDuration(arg: string): number {
  const match = arg.match(/^(\d+)(m|h)?$/);
  if (!match) return config.duration.default;

  const value = parseInt(match[1], 10);
  const unit = match[2] || "m";

  switch (unit) {
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
    default:
      return value * 60 * 1000;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🌙  AI NIGHT TESTER                                         ║
║   Autonomous testing powered by Gemma (Ollama)                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Parse arguments
  const args = process.argv.slice(2);
  let duration = config.duration.default;
  let isDebug = false;
  let mode: TesterMode = "bug-hunting";
  let headless = false;
  let clearMemory = false;
  let isTurbo = false;
  let workerId = "main";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--duration" && args[i + 1]) {
      duration = parseDuration(args[i + 1]);
      i++;
    } else if (args[i] === "--mode" && args[i + 1]) {
      const modeArg = args[i + 1].toLowerCase();
      if (modeArg === "feature-discovery" || modeArg === "discovery") {
        mode = "feature-discovery";
      } else {
        mode = "bug-hunting";
      }
      i++;
    } else if (args[i] === "--worker-id" && args[i + 1]) {
      workerId = args[i + 1];
      i++;
    } else if (args[i] === "--debug") {
      isDebug = true;
      duration = config.duration.debug;
    } else if (args[i] === "--turbo") {
      isTurbo = true;
    } else if (args[i] === "--short") {
      duration = config.duration.short;
    } else if (args[i] === "--headless") {
      headless = args[i + 1]?.toLowerCase() === "true";
      i++;
    } else if (args[i] === "--clear-memory") {
      clearMemory = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: npx tsx scripts/ai-night-tester/run-night-test.ts [options]

Options:
  --duration <time>    Test duration (e.g., 30m, 2h). Default: 8h
  --mode <mode>        Testing mode:
                         bug-hunting (default) - Find bugs and issues
                         feature-discovery     - Catalog all UI features
  --turbo              🚀 Enable high-performance mode (fast actions, headless)
  --debug              Short debug run (5 minutes)
  --short              Short run (30 minutes)
  --headless <bool>    Run browser headless (true/false)
  --clear-memory       Clear navigation memory from previous sessions
  --help, -h           Show this help message

Examples:
  npx tsx scripts/ai-night-tester/run-night-test.ts --duration 1h --turbo
  npx tsx scripts/ai-night-tester/run-night-test.ts --mode feature-discovery --duration 30m
  npx tsx scripts/ai-night-tester/run-night-test.ts --mode discovery --duration 15m --clear-memory
`);
      process.exit(0);
    }
  }

  // Apply Turbo Mode optimizations
  if (isTurbo) {
    console.log("🚀 TURBO MODE ENABLED");
    console.log("   - Wait between actions: 100ms");
    console.log("   - Viewport randomization: OFF");
    console.log("   - Headless: ON");
    console.log("   - SlowMo: 0ms");

    config.behavior.waitBetweenActions = 100;
    config.behavior.randomizeViewport = false;
    headless = true;
  }

  const modeEmoji = mode === "feature-discovery" ? "🔍" : "🐛";
  const modeLabel = mode === "feature-discovery" ? "Feature Discovery" : "Bug Hunting";

  console.log(`📋 Configuration:`);
  console.log(`   - Mode: ${modeEmoji} ${modeLabel}`);
  console.log(`   - Duration: ${Math.round(duration / 60000)} minutes`);
  console.log(`   - App URL: ${config.app.baseUrl}`);
  console.log(`   - Model (Fast): ${config.ollama.fastModel}`);
  console.log(`   - Model (Deep): ${config.ollama.deepModel}`);
  console.log(`   - Debug mode: ${isDebug ? "ON" : "OFF"}`);
  console.log(`   - Clear memory: ${clearMemory ? "YES" : "NO"}`);
  console.log("");

  // Check prerequisites
  console.log("🔍 Checking prerequisites...");

  try {
    // Test Ollama connection
    const response = await fetch(`${config.ollama.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error("Ollama not responding");
    }

    console.log("   ✅ Ollama is running");
  } catch {
    console.error(`
❌ Ollama is not running!

To fix:
  1. Start Ollama:     ollama serve
  2. Pull Models:      ollama pull ${config.ollama.fastModel} && ollama pull ${config.ollama.deepModel}
  3. Run this script again
`);
    process.exit(1);
  }

  console.log("   ✅ All prerequisites met\n");

  // Create and run orchestrator with mode
  const orchestrator = new Orchestrator({
    mode,
    duration,
    clearMemory,
    workerId,
    browserOptions: {
      headless,
      slowMo: isDebug ? 500 : 0,
    },
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n⚠️ Interrupt received, stopping gracefully...");
    await orchestrator.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n\n⚠️ Termination received, stopping gracefully...");
    await orchestrator.stop();
    process.exit(0);
  });

  // Start testing
  await orchestrator.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
