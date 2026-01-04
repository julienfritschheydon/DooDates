#!/usr/bin/env node

/**
 * Lighthouse CI Regression Detection Script
 * Parses Lighthouse results and compares with baseline to detect regressions > 10%
 */

const fs = require("fs");
const path = require("path");

const BASELINE_FILE = path.join(__dirname, "..", "performance-baseline.json");
const LHCI_REPORT_DIR = path.join(__dirname, "..", "lhci-report");

// Regression thresholds
const REGRESSION_THRESHOLD_LHCI = 0.1; // 10% for Lighthouse CI

function loadBaseline() {
  try {
    const data = fs.readFileSync(BASELINE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error loading baseline:", error.message);
    return null;
  }
}

function loadLighthouseResults() {
  try {
    // Look for manifest.json in lhci-report directory
    const manifestPath = path.join(LHCI_REPORT_DIR, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      console.error("❌ Lighthouse manifest not found at:", manifestPath);
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    if (!manifest.length) {
      console.error("❌ No Lighthouse reports found in manifest");
      return null;
    }

    // Get the most recent report
    const latestReport = manifest[manifest.length - 1];
    const reportPath = path.join(LHCI_REPORT_DIR, latestReport.jsonPath);

    if (!fs.existsSync(reportPath)) {
      console.error("❌ Lighthouse report file not found:", reportPath);
      return null;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    return report;
  } catch (error) {
    console.error("❌ Error loading Lighthouse results:", error.message);
    return null;
  }
}

function extractLighthouseMetrics(report) {
  const metrics = {};

  if (!report || !report.audits) {
    return metrics;
  }

  // Extract core web vitals and performance metrics
  const audits = report.audits;

  // Performance score
  if (report.categories && report.categories.performance) {
    metrics.performance_score = Math.round(report.categories.performance.score * 100);
  }

  // Core Web Vitals
  if (audits["largest-contentful-paint"]) {
    metrics.largest_contentful_paint = audits["largest-contentful-paint"].numericValue;
  }

  if (audits["cumulative-layout-shift"]) {
    metrics.cumulative_layout_shift = audits["cumulative-layout-shift"].numericValue;
  }

  if (audits["total-blocking-time"]) {
    metrics.total_blocking_time = audits["total-blocking-time"].numericValue;
  }

  if (audits["max-potential-fid"]) {
    metrics.first_input_delay = audits["max-potential-fid"].numericValue;
  }

  return metrics;
}

function detectRegression(currentMetrics, baselineMetrics, threshold) {
  const regressions = [];

  for (const [metric, currentValue] of Object.entries(currentMetrics)) {
    const baselineValue = baselineMetrics[metric];

    if (baselineValue && typeof currentValue === "number" && typeof baselineValue === "number") {
      let change;

      // For scores (performance_score), lower is worse
      // For timing metrics, higher is worse
      if (metric === "performance_score") {
        change = (baselineValue - currentValue) / baselineValue;
      } else {
        change = (currentValue - baselineValue) / baselineValue;
      }

      const changePercent = Math.abs(change) * 100;

      if (change > threshold) {
        regressions.push({
          metric,
          baselineValue,
          currentValue,
          changePercent: changePercent.toFixed(1),
          regression: true,
          direction: metric === "performance_score" ? "decrease" : "increase",
        });
      }
    }
  }

  return regressions;
}

function updateBaselineIfImproved(newMetrics) {
  try {
    const baseline = loadBaseline();
    if (!baseline || !baseline.lighthouse_ci) {
      console.log("ℹ️ Aucune baseline Lighthouse existante, création avec les nouvelles métriques");
      return updateBaseline(newMetrics);
    }

    const baselineMetrics = baseline.lighthouse_ci.metrics;
    let hasImprovement = false;

    // Vérifier s'il y a au moins une amélioration
    for (const [metric, newValue] of Object.entries(newMetrics)) {
      const baselineValue = baselineMetrics[metric];
      if (baselineValue && typeof newValue === "number" && typeof baselineValue === "number") {
        if (metric === "performance_score") {
          // Score de performance: amélioration = valeur plus grande
          if (newValue > baselineValue) {
            hasImprovement = true;
            console.log(`✅ Amélioration détectée: ${metric} ${baselineValue} → ${newValue}`);
            break;
          }
        } else {
          // Temps (LCP, TBT, CLS, FID): amélioration = valeur plus petite
          if (newValue < baselineValue) {
            hasImprovement = true;
            console.log(`✅ Amélioration détectée: ${metric} ${baselineValue}ms → ${newValue}ms`);
            break;
          }
        }
      }
    }

    if (hasImprovement) {
      console.log("🚀 Mise à jour baseline Lighthouse avec les métriques améliorées");
      return updateBaseline(newMetrics);
    } else {
      console.log("ℹ️ Aucune amélioration Lighthouse détectée, baseline conservée");
      return false;
    }
  } catch (error) {
    console.error("❌ Error updating Lighthouse baseline:", error.message);
    return false;
  }
}

function generateRegressionReport(regressions, currentMetrics, baselineMetrics) {
  if (regressions.length === 0) {
    return null;
  }

  let report = "# 🚨 Lighthouse CI Performance Regression Detected\n\n";
  report += `**Threshold:** > ${Math.round(REGRESSION_THRESHOLD_LHCI * 100)}%\n\n`;
  report += "## Regressions Found:\n\n";
  report += "| Metric | Baseline | Current | Change |\n";
  report += "|--------|----------|---------|--------|\n";

  for (const regression of regressions) {
    const unit =
      regression.metric === "performance_score"
        ? ""
        : regression.metric.includes("paint") ||
            regression.metric.includes("time") ||
            regression.metric.includes("delay")
          ? "ms"
          : "";
    const baselineDisplay =
      regression.metric === "performance_score"
        ? regression.baselineValue
        : `${regression.baselineValue}${unit}`;
    const currentDisplay =
      regression.metric === "performance_score"
        ? regression.currentValue
        : `${regression.currentValue}${unit}`;

    report += `| ${regression.metric} | ${baselineDisplay} | ${currentDisplay} | ${regression.direction === "decrease" ? "-" : "+"}${regression.changePercent}% |\n`;
  }

  report += "\n## Current Lighthouse Metrics:\n\n";
  for (const [key, value] of Object.entries(currentMetrics)) {
    const baseline = baselineMetrics[key];
    let change = "N/A";
    if (baseline) {
      if (key === "performance_score") {
        change = (((baseline - value) / baseline) * 100).toFixed(1);
      } else {
        change = (((value - baseline) / baseline) * 100).toFixed(1);
      }
    }
    const unit =
      key === "performance_score"
        ? ""
        : key.includes("paint") || key.includes("time") || key.includes("delay")
          ? "ms"
          : "";
    report += `- **${key}:** ${value}${unit} ${baseline ? `(vs ${baseline}${unit}, ${change > 0 ? (key === "performance_score" ? "-" : "+") : ""}${change}%)` : "(new metric)"}\n`;
  }

  report += "\n---\n\n";
  report += `*Workflow Run:* ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;

  return report;
}

function main() {
  console.log("🔍 Checking for Lighthouse CI performance regressions...\n");

  const baseline = loadBaseline();
  if (!baseline || !baseline.lighthouse_ci) {
    console.error("❌ No baseline found for Lighthouse CI");
    process.exit(1);
  }

  const lighthouseReport = loadLighthouseResults();
  if (!lighthouseReport) {
    console.error("❌ No Lighthouse results found");
    process.exit(1);
  }

  const currentMetrics = extractLighthouseMetrics(lighthouseReport);
  console.log(
    "📊 Current Lighthouse metrics extracted:",
    Object.keys(currentMetrics).length,
    "metrics found",
  );

  if (Object.keys(currentMetrics).length === 0) {
    console.warn("⚠️ No Lighthouse metrics found in report");
    process.exit(1);
  }

  const baselineMetrics = baseline.lighthouse_ci.metrics;
  const regressions = detectRegression(currentMetrics, baselineMetrics, REGRESSION_THRESHOLD_LHCI);

  if (regressions.length > 0) {
    console.log(
      `🚨 Found ${regressions.length} Lighthouse performance regression(s) > ${Math.round(REGRESSION_THRESHOLD_LHCI * 100)}%`,
    );

    const report = generateRegressionReport(regressions, currentMetrics, baselineMetrics);

    // Write report to file for GitHub issue creation
    fs.writeFileSync("lighthouse-regression-report.md", report);

    console.log("📝 Regression report saved to lighthouse-regression-report.md");
    console.log(report);

    process.exit(1); // Exit with error to trigger issue creation
  } else {
    console.log("✅ No Lighthouse performance regressions detected");

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
  extractLighthouseMetrics,
  loadBaseline,
  loadLighthouseResults,
};
