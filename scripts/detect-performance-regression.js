#!/usr/bin/env node

/**
 * Performance Regression Detection Script
 * Parses E2E test results and compares with baseline to detect regressions > 20%
 */

const fs = require("fs");
const path = require("path");

const BASELINE_FILE = path.join(__dirname, "..", "performance-baseline.json");
const TEST_RESULTS_FILE = path.join(__dirname, "..", "test-results.json");

// Regression thresholds
const REGRESSION_THRESHOLD_E2E = 0.2; // 20% for E2E performance tests

function loadBaseline() {
  try {
    const data = fs.readFileSync(BASELINE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error loading baseline:", error.message);
    return null;
  }
}

function loadTestResults() {
  try {
    const data = fs.readFileSync(TEST_RESULTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error loading test results:", error.message);
    return null;
  }
}

function extractPerformanceMetrics(testResults) {
  const metrics = {};

  if (!testResults || !testResults.suites) {
    console.warn("⚠️ No test suites found in results");
    return metrics;
  }

  for (const suite of testResults.suites) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        if (test.results && test.results.length > 0) {
          const result = test.results[0];
          if (result.status === "passed" && result.attachments) {
            // Look for attachments with performance measurements
            for (const attachment of result.attachments) {
              if (attachment.name && attachment.name.includes("performance-measurement")) {
                try {
                  const perfData = JSON.parse(fs.readFileSync(attachment.path, "utf-8"));
                  // Extract metrics from performance measurement data
                  if (perfData.measurements) {
                    for (const [key, value] of Object.entries(perfData.measurements)) {
                      if (typeof value === "number" && value > 0) {
                        metrics[key] = value;
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parsing errors for individual attachments
                }
              }
            }
          }
        }
      }
    }
  }

  return metrics;
}

function detectRegression(currentMetrics, baselineMetrics, threshold) {
  const regressions = [];

  for (const [metric, currentValue] of Object.entries(currentMetrics)) {
    const baselineValue = baselineMetrics[metric];

    if (baselineValue && typeof currentValue === "number" && typeof baselineValue === "number") {
      const change = (currentValue - baselineValue) / baselineValue;
      const changePercent = Math.abs(change) * 100;

      if (change > threshold) {
        regressions.push({
          metric,
          baselineValue,
          currentValue,
          changePercent: changePercent.toFixed(1),
          regression: true,
        });
      }
    }
  }

  return regressions;
}

function updateBaselineIfImproved(newMetrics) {
  try {
    const baseline = loadBaseline();
    if (!baseline || !baseline.e2e_performance) {
      console.log("ℹ️ Aucune baseline existante, création avec les nouvelles métriques");
      return updateBaseline(newMetrics);
    }

    const baselineMetrics = baseline.e2e_performance.metrics;
    let hasImprovement = false;

    // Vérifier s'il y a au moins une amélioration
    for (const [metric, newValue] of Object.entries(newMetrics)) {
      const baselineValue = baselineMetrics[metric];
      if (baselineValue && typeof newValue === "number" && typeof baselineValue === "number") {
        // Pour les temps (ms), une amélioration = valeur plus petite
        if (metric.includes("load") || metric.includes("open") || metric.includes("Ms")) {
          if (newValue < baselineValue) {
            hasImprovement = true;
            console.log(`✅ Amélioration détectée: ${metric} ${baselineValue}ms → ${newValue}ms`);
            break;
          }
        }
      }
    }

    if (hasImprovement) {
      console.log("🚀 Mise à jour baseline avec les métriques améliorées");
      return updateBaseline(newMetrics);
    } else {
      console.log("ℹ️ Aucune amélioration détectée, baseline conservée");
      return false;
    }
  } catch (error) {
    console.error("❌ Error updating baseline:", error.message);
    return false;
  }
}

function generateRegressionReport(regressions, currentMetrics, baselineMetrics) {
  if (regressions.length === 0) {
    return null;
  }

  let report = "# 🚨 Performance Regression Detected\n\n";
  report += `**Threshold:** > ${Math.round(REGRESSION_THRESHOLD_E2E * 100)}%\n\n`;
  report += "## Regressions Found:\n\n";
  report += "| Metric | Baseline | Current | Change |\n";
  report += "|--------|----------|---------|--------|\n";

  for (const regression of regressions) {
    report += `| ${regression.metric} | ${regression.baselineValue}ms | ${regression.currentValue}ms | +${regression.changePercent}% |\n`;
  }

  report += "\n## Current Performance Metrics:\n\n";
  for (const [key, value] of Object.entries(currentMetrics)) {
    const baseline = baselineMetrics[key];
    const change = baseline ? (((value - baseline) / baseline) * 100).toFixed(1) : "N/A";
    report += `- **${key}:** ${value}ms ${baseline ? `(vs ${baseline}ms, ${change > 0 ? "+" : ""}${change}%)` : "(new metric)"}\n`;
  }

  report += "\n---\n\n";
  report += `*Workflow Run:* ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;

  return report;
}

function main() {
  console.log("🔍 Checking for E2E performance regressions...\n");

  const baseline = loadBaseline();
  if (!baseline || !baseline.e2e_performance) {
    console.error("❌ No baseline found for E2E performance");
    process.exit(1);
  }

  const testResults = loadTestResults();
  if (!testResults) {
    console.error("❌ No test results found");
    process.exit(1);
  }

  const currentMetrics = extractPerformanceMetrics(testResults);
  console.log("📊 Current metrics extracted:", Object.keys(currentMetrics).length, "metrics found");

  if (Object.keys(currentMetrics).length === 0) {
    console.warn("⚠️ No performance metrics found in test results");
    process.exit(1);
  }

  const baselineMetrics = baseline.e2e_performance.metrics;
  const regressions = detectRegression(currentMetrics, baselineMetrics, REGRESSION_THRESHOLD_E2E);

  if (regressions.length > 0) {
    console.log(
      `🚨 Found ${regressions.length} performance regression(s) > ${Math.round(REGRESSION_THRESHOLD_E2E * 100)}%`,
    );

    const report = generateRegressionReport(regressions, currentMetrics, baselineMetrics);

    // Write report to file for GitHub issue creation
    fs.writeFileSync("performance-regression-report.md", report);

    console.log("📝 Regression report saved to performance-regression-report.md");
    console.log(report);

    process.exit(1); // Exit with error to trigger issue creation
  } else {
    console.log("✅ No performance regressions detected");

    // Update baseline only if there are improvements
    updateBaselineIfImproved(currentMetrics);

    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  detectRegression,
  extractPerformanceMetrics,
  loadBaseline,
  loadTestResults,
};
