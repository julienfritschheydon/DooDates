/**
 * Script pour envoyer les métriques de performance à Supabase
 * depuis les workflows GitHub Actions
 *
 * Usage:
 *   node scripts/send-performance-metrics.js --source lighthouse --file lighthouse-report.json
 *   node scripts/send-performance-metrics.js --source e2e --file e2e-metrics.json
 */

const fs = require("fs");
const https = require("https");

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID;
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REF = process.env.GITHUB_REF;

// Parse arguments
const args = process.argv.slice(2);
const sourceIndex = args.indexOf("--source");
const fileIndex = args.indexOf("--file");

if (sourceIndex === -1 || fileIndex === -1) {
  console.error("Usage: node send-performance-metrics.js --source <lighthouse|e2e> --file <path>");
  process.exit(1);
}

const source = args[sourceIndex + 1];
const filePath = args[fileIndex + 1];

if (!["lighthouse", "e2e"].includes(source)) {
  console.error('Source must be either "lighthouse" or "e2e"');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables");
  process.exit(1);
}

// Read metrics file
const metricsData = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Transform metrics based on source
let metrics = {
  timestamp: new Date().toISOString(),
  source: source,
  workflow_run_id: GITHUB_RUN_ID,
  commit_sha: GITHUB_SHA,
  branch: GITHUB_REF?.replace("refs/heads/", ""),
  environment: "production",
};

if (source === "lighthouse") {
  // Extract Lighthouse metrics
  const audits = metricsData.audits || {};
  metrics = {
    ...metrics,
    performance_score: metricsData.categories?.performance?.score * 100 || 0,
    largest_contentful_paint: audits["largest-contentful-paint"]?.numericValue || 0,
    cumulative_layout_shift: audits["cumulative-layout-shift"]?.numericValue || 0,
    total_blocking_time: audits["total-blocking-time"]?.numericValue || 0,
    first_input_delay: audits["max-potential-fid"]?.numericValue || 0,
    first_contentful_paint: audits["first-contentful-paint"]?.numericValue || 0,
  };
} else if (source === "e2e") {
  // Extract E2E metrics
  metrics = {
    ...metrics,
    dashboard_load_50: metricsData.dashboard_load_50_conversations || 0,
    dashboard_load_200: metricsData.dashboard_load_200_conversations || 0,
    tags_menu_open: metricsData.tags_menu_open || 0,
    folders_menu_open: metricsData.folders_menu_open || 0,
    date_dashboard_load: metricsData.date_dashboard_load || 0,
    form_dashboard_load: metricsData.form_dashboard_load || 0,
    availability_dashboard_load: metricsData.availability_dashboard_load || 0,
    quizz_dashboard_load: metricsData.quizz_dashboard_load || 0,
  };
}

// Prepare request
const url = new URL(`${SUPABASE_URL}/rest/v1/performance_metrics`);
const postData = JSON.stringify({
  timestamp: metrics.timestamp,
  source: metrics.source,
  metrics: metrics,
  workflow_run_id: metrics.workflow_run_id,
  commit_sha: metrics.commit_sha,
  branch: metrics.branch,
  environment: metrics.environment,
});

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    Prefer: "return=minimal",
  },
};

// Send to Supabase
console.log(`📊 Sending ${source} metrics to Supabase...`);
console.log(`   Workflow Run ID: ${GITHUB_RUN_ID}`);
console.log(`   Commit SHA: ${GITHUB_SHA}`);
console.log(`   Branch: ${metrics.branch}`);

const req = https.request(url, options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("✅ Metrics sent successfully!");

      // Log key metrics
      if (source === "lighthouse") {
        console.log(`   Performance Score: ${metrics.performance_score}`);
        console.log(`   LCP: ${metrics.largest_contentful_paint}ms`);
        console.log(`   CLS: ${metrics.cumulative_layout_shift}`);
      } else if (source === "e2e") {
        console.log(`   Dashboard 50: ${metrics.dashboard_load_50}ms`);
        console.log(`   Dashboard 200: ${metrics.dashboard_load_200}ms`);
      }
    } else {
      console.error(`❌ Failed to send metrics: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Error sending metrics:", error);
  process.exit(1);
});

req.write(postData);
req.end();
