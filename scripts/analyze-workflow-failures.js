#!/usr/bin/env node
/**
 * Script pour analyser en détail les échecs de workflows
 * Extrait les vrais échecs de tests (pas les logs normaux)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis .env.local si disponible
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const GITHUB_API_BASE = process.env.GITHUB_API_URL || "https://api.github.com";
const REPO = process.env.GITHUB_REPOSITORY || "owner/repo";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN non défini dans .env.local");
  process.exit(1);
}

/**
 * Récupère les runs récents d'un workflow
 */
async function getWorkflowRuns(workflowId, limit = 5) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/actions/workflows/${workflowId}/runs?per_page=${limit}&status=completed`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.workflow_runs || [];
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return [];
  }
}

/**
 * Récupère les jobs d'un run
 */
async function getRunJobs(runId) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/actions/runs/${runId}/jobs?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return [];
  }
}

/**
 * Récupère les logs d'un job
 */
async function getJobLogs(jobId) {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO}/actions/jobs/${jobId}/logs`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return null;
  }
}

/**
 * Analyse les logs Vitest pour trouver les vrais échecs
 */
function analyzeVitestLogs(logs) {
  const failures = [];
  const lines = logs.split("\n");

  // Chercher le résumé final pour voir combien de tests ont échoué
  let testFilesFailed = 0;
  let testsFailed = 0;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const filesMatch = line.match(/Test Files\s+(\d+)\s+failed/i);
    if (filesMatch) {
      testFilesFailed = parseInt(filesMatch[1]);
    }
    const testsMatch = line.match(/Tests\s+(\d+)\s+failed/i);
    if (testsMatch) {
      testsFailed = parseInt(testsMatch[1]);
      break;
    }
  }

  if (testFilesFailed === 0 && testsFailed === 0) {
    // Chercher les patterns d'échec dans les logs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern Vitest standard
      const failMatch = line.match(/FAIL\s+(.+\.test\.(?:ts|tsx|js|jsx))\s+\((\d+)\s+test.*?\)/i);
      if (failMatch) {
        const file = failMatch[1].replace(/.*\/(src|tests)\//, "$1/");
        const testCount = parseInt(failMatch[2]);

        // Chercher les tests qui échouent dans ce fichier
        let testName = null;
        let errorContext = [];

        for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
          const nextLine = lines[j];

          // Nom du test
          const testMatch = nextLine.match(/×\s+(.+?)\s+\((\d+)\s+ms\)/);
          if (testMatch) {
            testName = testMatch[1].trim();
            errorContext.push(nextLine);
            continue;
          }

          // AssertionError
          if (/AssertionError|Expected.*but got|Expected.*received/i.test(nextLine)) {
            errorContext.push(nextLine);

            // Collecter les lignes suivantes (Expected/Received)
            for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
              const contextLine = lines[k];
              if (
                contextLine.trim().startsWith("Expected:") ||
                contextLine.trim().startsWith("Received:") ||
                contextLine.trim().startsWith("Diff:") ||
                /^\s+at\s+/.test(contextLine) ||
                /^\s+\^/.test(contextLine)
              ) {
                errorContext.push(contextLine);
              } else if (errorContext.length > 3) {
                break;
              }
            }

            failures.push({
              file,
              testName,
              context: errorContext.join("\n"),
            });

            errorContext = [];
            testName = null;
          }
        }
      }
    }
  }

  return failures;
}

/**
 * Analyse les logs Playwright pour trouver les vrais échecs
 */
function analyzePlaywrightLogs(logs) {
  const failures = [];
  const lines = logs.split("\n");

  // Chercher les patterns Playwright
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern 1: Test qui échoue avec numéro
    const testMatch1 = line.match(/^\s+(\d+)\)\s+(.+\.spec\.ts):(\d+):(\d+)\s+(.+)/);
    if (testMatch1) {
      const file = testMatch1[2];
      const testName = testMatch1[5];
      const lineNum = testMatch1[3];

      // Chercher l'erreur dans les lignes suivantes
      let errorContext = [];
      for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
        const nextLine = lines[j];

        if (
          /Error:|Timeout|element\(s\) not found|expect\(.*\)\.(toContainText|toBeVisible)/i.test(
            nextLine,
          )
        ) {
          errorContext.push(nextLine);

          // Collecter le contexte (Locator, Expected, etc.)
          for (let k = j + 1; k < Math.min(j + 15, lines.length); k++) {
            const contextLine = lines[k];
            if (
              contextLine.includes("Locator:") ||
              contextLine.includes("Expected") ||
              contextLine.includes("Timeout:") ||
              contextLine.includes("Call log:") ||
              /^\s+at\s+/.test(contextLine)
            ) {
              errorContext.push(contextLine);
            } else if (errorContext.length > 5) {
              break;
            }
          }

          failures.push({
            file: file.replace(/.*\/(tests|src)\//, "$1/"),
            testName,
            line: lineNum,
            context: errorContext.join("\n"),
          });
          break;
        }
      }
      continue;
    }

    // Pattern 2: Erreur Playwright directe
    if (/Error:\s+.*expect\(.*\)\.(toContainText|toBeVisible|toBeEnabled|toHaveText)/i.test(line)) {
      let errorContext = [line];
      let locator = null;
      let expected = null;

      // Chercher le locator et l'expected dans les lignes suivantes
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine.includes("Locator:")) {
          const match = nextLine.match(/Locator:\s+(.+)/);
          if (match) locator = match[1];
          errorContext.push(nextLine);
        } else if (nextLine.includes("Expected")) {
          const match = nextLine.match(/Expected.*:\s*(.+)/);
          if (match) expected = match[1];
          errorContext.push(nextLine);
        } else if (nextLine.includes("Timeout:") || /^\s+at\s+/.test(nextLine)) {
          errorContext.push(nextLine);
        } else if (errorContext.length > 5) {
          break;
        }
      }

      failures.push({
        file: "unknown",
        testName: null,
        context: errorContext.join("\n"),
        locator,
        expected,
      });
    }
  }

  return failures;
}

/**
 * Analyse le dernier run du workflow "2️⃣ Develop → Main"
 */
async function analyzeLastFailure() {
  console.log('🔍 Analyse des échecs du workflow "2️⃣ Develop → Main (Auto-merge)"...\n');

  // Récupérer le workflow ID
  const workflowsResponse = await fetch(`${GITHUB_API_BASE}/repos/${REPO}/actions/workflows`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  const workflowsData = await workflowsResponse.json();
  const workflow = workflowsData.workflows?.find(
    (w) => w.name === "2️⃣ Develop → Main (Auto-merge)",
  );

  if (!workflow) {
    console.error("❌ Workflow non trouvé");
    return;
  }

  // Récupérer le dernier run
  const runs = await getWorkflowRuns(workflow.id, 1);
  if (runs.length === 0) {
    console.log("✅ Aucun run récent");
    return;
  }

  const lastRun = runs[0];
  console.log(`📋 Dernier run: #${lastRun.run_number} - ${lastRun.conclusion}`);
  console.log(`   Commit: ${lastRun.head_sha.substring(0, 7)}`);
  console.log(`   Lien: ${lastRun.html_url}\n`);

  if (lastRun.conclusion !== "failure") {
    console.log("✅ Le dernier run a réussi");
    return;
  }

  // Récupérer les jobs
  const jobs = await getRunJobs(lastRun.id);
  const failedJobs = jobs.filter((j) => j.conclusion === "failure");

  console.log(`❌ ${failedJobs.length} job(s) en échec:\n`);

  for (const job of failedJobs) {
    console.log(`\n📦 Job: ${job.name}`);
    console.log(`   ID: ${job.id}`);

    // Récupérer les logs
    const logs = await getJobLogs(job.id);
    if (!logs) {
      console.log("   ⚠️ Impossible de récupérer les logs");
      continue;
    }

    // Sauvegarder les logs pour analyse manuelle
    const logFile = path.join(process.cwd(), `logs-${job.name}-${job.id}.txt`);
    fs.writeFileSync(logFile, logs, "utf-8");
    console.log(`   💾 Logs sauvegardés: ${logFile}`);

    // Analyser selon le type de job
    if (job.name.includes("unit") || job.name.includes("test")) {
      console.log("   🔍 Analyse des logs Vitest...\n");

      // Chercher le résumé final
      const summaryMatch = logs.match(
        /Test Files\s+(\d+)\s+failed[^\n]*\n[^\n]*Tests\s+(\d+)\s+failed/i,
      );
      if (summaryMatch) {
        console.log(
          `   📊 Résumé: ${summaryMatch[1]} fichier(s) de test échoué(s), ${summaryMatch[2]} test(s) échoué(s)\n`,
        );
      }

      // Chercher les patterns FAIL
      const failMatches = [
        ...logs.matchAll(/FAIL\s+(.+\.test\.(?:ts|tsx|js|jsx))\s+\((\d+)\s+test.*?\)/gi),
      ];
      if (failMatches.length > 0) {
        console.log(`   ❌ ${failMatches.length} fichier(s) de test en échec:\n`);
        for (const match of failMatches) {
          const file = match[1].replace(/.*\/(src|tests)\//, "$1/");
          console.log(`   📄 ${file} (${match[3]} test(s))`);

          // Extraire la section de ce fichier dans les logs
          const fileStart = logs.indexOf(match[0]);
          const nextFileStart = logs.indexOf("FAIL ", fileStart + 1);
          const fileSection =
            nextFileStart > 0
              ? logs.substring(fileStart, nextFileStart)
              : logs.substring(fileStart, fileStart + 5000);

          // Chercher les tests qui échouent (×)
          const testFailures = [...fileSection.matchAll(/×\s+(.+?)\s+\((\d+)\s+ms\)/g)];
          if (testFailures.length > 0) {
            for (const testMatch of testFailures) {
              console.log(`      × ${testMatch[1]}`);

              // Chercher l'AssertionError après ce test
              const testPos = fileSection.indexOf(testMatch[0]);
              const errorSection = fileSection.substring(testPos, testPos + 2000);
              const assertionMatch = errorSection.match(
                /AssertionError[^\n]*\n([^\n]*Expected[^\n]*)\n([^\n]*Received[^\n]*)/,
              );
              if (assertionMatch) {
                console.log(`         Expected: ${assertionMatch[1].trim()}`);
                console.log(`         Received: ${assertionMatch[2].trim()}`);
              }
            }
          }
          console.log("");
        }
      } else {
        console.log("   ⚠️ Aucun pattern FAIL trouvé - analyse manuelle nécessaire");
        console.log("   📋 Extrait des logs (dernières 50 lignes):\n");
        const lastLines = logs.split("\n").slice(-50);
        console.log(lastLines.join("\n"));
      }
    } else if (job.name.includes("e2e") || job.name.includes("playwright")) {
      console.log("   🔍 Analyse des logs Playwright...\n");

      // Chercher les patterns Playwright
      const testFailures = [...logs.matchAll(/(\d+)\)\s+(.+\.spec\.ts):(\d+):(\d+)\s+(.+)/g)];
      if (testFailures.length > 0) {
        console.log(`   ❌ ${testFailures.length} test(s) E2E en échec:\n`);
        for (const match of testFailures) {
          const file = match[2].replace(/.*\/(tests|src)\//, "$1/");
          const testName = match[5];
          const lineNum = match[3];
          console.log(`   📄 ${file}:${lineNum}`);
          console.log(`      Test: ${testName}`);

          // Chercher l'erreur après ce test
          const testPos = logs.indexOf(match[0]);
          const errorSection = logs.substring(testPos, testPos + 3000);

          // Chercher Locator et Expected
          const locatorMatch = errorSection.match(/Locator:\s+(.+)/);
          const expectedMatch = errorSection.match(/Expected.*:\s*(.+)/);
          const timeoutMatch = errorSection.match(/Timeout:\s*(\d+)ms/);

          if (locatorMatch) console.log(`      Locator: ${locatorMatch[1]}`);
          if (expectedMatch) console.log(`      Expected: ${expectedMatch[1]}`);
          if (timeoutMatch) console.log(`      Timeout: ${timeoutMatch[1]}ms`);

          console.log("");
        }
      } else {
        // Chercher les erreurs Playwright dans le format JSON
        const errorMatches = [
          ...logs.matchAll(/Error:\s+.*expect\(.*\)\.(toContainText|toBeVisible)[^\n]*/gi),
        ];
        if (errorMatches.length > 0) {
          console.log(`   ❌ ${errorMatches.length} erreur(s) Playwright détectée(s):\n`);
          for (const match of errorMatches) {
            console.log(`      ${match[0].substring(0, 200)}`);
          }
        } else {
          console.log("   ⚠️ Aucun pattern d'erreur trouvé - analyse manuelle nécessaire");
          console.log('   📋 Extrait des logs (recherche "Error"):\n');
          const errorLines = logs
            .split("\n")
            .filter((l) => /Error|Timeout|expect|toContainText/i.test(l))
            .slice(0, 20);
          console.log(errorLines.join("\n"));
        }
      }
    }
  }
}

// Exécuter l'analyse
analyzeLastFailure().catch(console.error);
