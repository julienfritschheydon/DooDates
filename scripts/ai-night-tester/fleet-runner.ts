/**
 * AI Night Tester - Fleet Runner
 * 
 * Launch multiple parallel test agents to maximize coverage and speed.
 * 
 * Usage:
 *   npx tsx scripts/ai-night-tester/fleet-runner.ts --workers 3 --duration 15m
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const args = process.argv.slice(2);
    let workerCount = 3;
    let duration = '15m';
    let mode = 'bug-hunting';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--workers' && args[i + 1]) {
            workerCount = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === '--duration' && args[i + 1]) {
            duration = args[i + 1];
            i++;
        } else if (args[i] === '--mode' && args[i + 1]) {
            mode = args[i + 1];
            i++;
        }
    }

    console.log(`
🚀 ═══════════════════════════════════════════════════════════════╗
║   AI NIGHT TESTER - FLEET MODE                                ║
║   Launching ${workerCount} Workers in Parallel                          ║
║   Duration: ${duration} | Mode: ${mode}                        ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    const scriptPath = path.join(__dirname, 'run-night-test.ts');
    const workers: any[] = [];

    for (let i = 1; i <= workerCount; i++) {
        const workerId = `W${i}`;
        console.log(`📡 Starting Worker ${workerId}...`);

        const child = spawn('npx', [
            'tsx',
            `"${scriptPath}"`,
            '--duration', duration,
            '--mode', mode,
            '--worker-id', workerId,
            '--headless' // Parallel workers always headless for performance
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    console.log(`[${workerId}] ${line.trim()}`);
                }
            }
        });

        child.stderr.on('data', (data) => {
            console.error(`[${workerId}] ERROR: ${data.toString().trim()}`);
        });

        workers.push(new Promise((resolve) => {
            child.on('exit', (code) => {
                console.log(`⏹️ Worker ${workerId} exited with code ${code}`);
                resolve(code);
            });
        }));

        // Stagger starts to avoid Ollama congestion
        await new Promise(r => setTimeout(r, 5000));
    }

    await Promise.all(workers);
    console.log('\n✅ All workers finished. Check reports directory for combined results.');
}

main().catch(console.error);
