/**
 * AI Night Tester - Fleet Runner
 *
 * Launch multiple parallel test agents to maximize coverage and speed.
 *
 * Usage:
 *   npx tsx scripts/ai-night-tester/fleet-runner.ts --workers 3 --duration 15m
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  let workerCount = 4; // Default to 4 workers for optimal parallelization
  let duration = "30m";
  let mode = "feature-discovery"; // Default to feature discovery for better coverage
  let turbo = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--workers" && args[i + 1]) {
      workerCount = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--duration" && args[i + 1]) {
      duration = args[i + 1];
      i++;
    } else if (args[i] === "--mode" && args[i + 1]) {
      mode = args[i + 1];
      i++;
    } else if (args[i] === "--turbo") {
      turbo = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: npx tsx scripts/ai-night-tester/fleet-runner.ts [options]

Options:
  --workers <N>        Number of parallel workers (default: 4)
  --duration <time>    Test duration per worker (e.g., 30m, 1h)
  --mode <mode>        Testing mode: feature-discovery (default) or bug-hunting
  --turbo              Enable turbo mode (faster actions, headless)
  --help, -h           Show this help message

Examples:
  npx tsx scripts/ai-night-tester/fleet-runner.ts --workers 4 --duration 30m
  npx tsx scripts/ai-night-tester/fleet-runner.ts --mode feature-discovery --turbo
  npx tsx scripts/ai-night-tester/fleet-runner.ts --workers 8 --duration 1h --turbo
`);
      process.exit(0);
    }
  }

  console.log(`
🚀 ═══════════════════════════════════════════════════════════════╗
║   AI NIGHT TESTER - FLEET MODE                                ║
║   Launching ${workerCount} Workers in Parallel                          ║
║   Duration: ${duration} | Mode: ${mode}                        ║
║   Turbo: ${turbo ? "ON" : "OFF"}                                        ║
╚═══════════════════════════════════════════════════════════════╝
    `);

  const scriptPath = path.join(__dirname, "run-night-test.ts");
  const workers: any[] = [];

  for (let i = 1; i <= workerCount; i++) {
    const workerId = `W${i}`;
    console.log(`📡 Starting Worker ${workerId}...`);

    const workerArgs = [
      "tsx",
      `"${scriptPath}"`,
      "--duration",
      duration,
      "--mode",
      mode,
      "--worker-id",
      workerId,
      "--headless",
      "true", // Parallel workers always headless for performance
    ];

    if (turbo) {
      workerArgs.push("--turbo");
    }

    const child = spawn("npx", workerArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (line.trim()) {
          console.log(`[${workerId}] ${line.trim()}`);
        }
      }
    });

    child.stderr.on("data", (data) => {
      console.error(`[${workerId}] ERROR: ${data.toString().trim()}`);
    });

    workers.push(
      new Promise((resolve) => {
        child.on("exit", (code) => {
          console.log(`⏹️ Worker ${workerId} exited with code ${code}`);
          resolve(code);
        });
      }),
    );

    // Stagger starts to avoid Ollama congestion
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  await Promise.all(workers);
  console.log("\n✅ All workers finished. Check reports directory for combined results.");
}

main().catch(console.error);
