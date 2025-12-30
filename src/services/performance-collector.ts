/**
 * Service pour collecter et stocker les métriques de performance
 * depuis les workflows GitHub Actions (Lighthouse CI et E2E)
 */

import { supabase } from "../lib/supabase";
import { logError, ErrorFactory } from "../lib/error-handling";

export interface PerformanceMetrics {
  timestamp: string;
  source: "lighthouse" | "e2e" | "web-vitals";

  // Lighthouse CI metrics
  performance_score?: number;
  largest_contentful_paint?: number;
  cumulative_layout_shift?: number;
  total_blocking_time?: number;
  first_input_delay?: number;
  first_contentful_paint?: number;

  // E2E metrics
  dashboard_load_50?: number;
  dashboard_load_200?: number;
  tags_menu_open?: number;
  folders_menu_open?: number;
  date_dashboard_load?: number;
  form_dashboard_load?: number;
  availability_dashboard_load?: number;
  quizz_dashboard_load?: number;

  // Metadata
  workflow_run_id?: string;
  commit_sha?: string;
  branch?: string;
  environment?: "production" | "staging" | "development";
}

export interface PerformanceAlert {
  id?: string;
  timestamp: string;
  metric_name: string;
  current_value: number;
  baseline_value: number;
  threshold_percent: number;
  regression_percent: number;
  severity: "warning" | "critical";
  workflow_run_id?: string;
  commit_sha?: string;
  resolved: boolean;
}

/**
 * Collecte les métriques de performance depuis les workflows GitHub
 */
export async function collectWorkflowMetrics(
  metrics: PerformanceMetrics,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Stocker dans Supabase
    const { error } = await supabase.from("performance_metrics").insert([
      {
        timestamp: metrics.timestamp,
        source: metrics.source,
        metrics: metrics,
        workflow_run_id: metrics.workflow_run_id,
        commit_sha: metrics.commit_sha,
        branch: metrics.branch,
        environment: metrics.environment || "production",
      },
    ]);

    if (error) {
      logError(
        ErrorFactory.api(
          "Failed to store performance metrics",
          "Erreur lors du stockage des métriques",
        ),
        { component: "performance-collector", operation: "collectWorkflowMetrics", error },
      );
      return { success: false, error: error.message };
    }

    // Vérifier les régressions
    await checkForRegressions(metrics);

    return { success: true };
  } catch (error) {
    logError(
      ErrorFactory.api(
        "Error collecting workflow metrics",
        "Erreur lors de la collecte des métriques",
      ),
      { component: "performance-collector", operation: "collectWorkflowMetrics", error },
    );
    return { success: false, error: String(error) };
  }
}

/**
 * Récupère les métriques historiques
 */
export async function getHistoricalMetrics(
  days: number = 7,
  source?: "lighthouse" | "e2e" | "web-vitals",
): Promise<PerformanceMetrics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from("performance_metrics")
      .select("*")
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: true });

    if (source) {
      query = query.eq("source", source);
    }

    const { data, error } = await query;

    if (error) {
      logError(
        ErrorFactory.api(
          "Failed to fetch historical metrics",
          "Erreur lors de la récupération des métriques",
        ),
        { component: "performance-collector", operation: "getHistoricalMetrics", error },
      );
      return [];
    }

    return data?.map((row) => row.metrics) || [];
  } catch (error) {
    logError(
      ErrorFactory.api(
        "Error fetching historical metrics",
        "Erreur lors de la récupération des métriques",
      ),
      { component: "performance-collector", operation: "getHistoricalMetrics", error },
    );
    return [];
  }
}

/**
 * Vérifie les régressions de performance
 */
async function checkForRegressions(currentMetrics: PerformanceMetrics): Promise<void> {
  try {
    // Charger la baseline
    const baselineResponse = await fetch("/DooDates/performance-baseline.json");
    const baseline = await baselineResponse.json();

    const alerts: PerformanceAlert[] = [];

    // Vérifier les métriques Lighthouse
    if (currentMetrics.source === "lighthouse") {
      const lighthouseChecks = [
        {
          name: "performance_score",
          current: currentMetrics.performance_score,
          baseline: baseline.lighthouse_ci.metrics.performance_score,
          isScore: true,
        },
        {
          name: "largest_contentful_paint",
          current: currentMetrics.largest_contentful_paint,
          baseline: baseline.lighthouse_ci.metrics.largest_contentful_paint,
        },
        {
          name: "cumulative_layout_shift",
          current: currentMetrics.cumulative_layout_shift,
          baseline: baseline.lighthouse_ci.metrics.cumulative_layout_shift,
        },
        {
          name: "total_blocking_time",
          current: currentMetrics.total_blocking_time,
          baseline: baseline.lighthouse_ci.metrics.total_blocking_time,
        },
        {
          name: "first_input_delay",
          current: currentMetrics.first_input_delay,
          baseline: baseline.lighthouse_ci.metrics.first_input_delay,
        },
      ];

      for (const check of lighthouseChecks) {
        if (check.current !== undefined && check.baseline !== undefined) {
          const alert = detectRegression(
            check.name,
            check.current,
            check.baseline,
            check.isScore,
            currentMetrics,
          );
          if (alert) alerts.push(alert);
        }
      }
    }

    // Vérifier les métriques E2E
    if (currentMetrics.source === "e2e") {
      const e2eChecks = [
        {
          name: "dashboard_load_50",
          current: currentMetrics.dashboard_load_50,
          baseline: baseline.e2e_performance.metrics.dashboard_load_50_conversations,
        },
        {
          name: "dashboard_load_200",
          current: currentMetrics.dashboard_load_200,
          baseline: baseline.e2e_performance.metrics.dashboard_load_200_conversations,
        },
        {
          name: "tags_menu_open",
          current: currentMetrics.tags_menu_open,
          baseline: baseline.e2e_performance.metrics.tags_menu_open,
        },
        {
          name: "folders_menu_open",
          current: currentMetrics.folders_menu_open,
          baseline: baseline.e2e_performance.metrics.folders_menu_open,
        },
      ];

      for (const check of e2eChecks) {
        if (check.current !== undefined && check.baseline !== undefined) {
          const alert = detectRegression(
            check.name,
            check.current,
            check.baseline,
            false,
            currentMetrics,
          );
          if (alert) alerts.push(alert);
        }
      }
    }

    // Stocker les alertes
    if (alerts.length > 0) {
      await storeAlerts(alerts);
    }
  } catch (error) {
    logError(
      ErrorFactory.api(
        "Error checking for regressions",
        "Erreur lors de la vérification des régressions",
      ),
      { component: "performance-collector", operation: "checkForRegressions", error },
    );
  }
}

/**
 * Détecte une régression de performance
 */
function detectRegression(
  metricName: string,
  currentValue: number,
  baselineValue: number,
  isScore: boolean = false,
  metrics: PerformanceMetrics,
): PerformanceAlert | null {
  const REGRESSION_THRESHOLD_WARNING = 20; // 20% de dégradation
  const REGRESSION_THRESHOLD_CRITICAL = 50; // 50% de dégradation

  let regressionPercent: number;

  if (isScore) {
    // Pour les scores, une baisse est une régression
    regressionPercent = ((baselineValue - currentValue) / baselineValue) * 100;
  } else {
    // Pour les temps, une augmentation est une régression
    regressionPercent = ((currentValue - baselineValue) / baselineValue) * 100;
  }

  if (regressionPercent >= REGRESSION_THRESHOLD_WARNING) {
    return {
      timestamp: metrics.timestamp,
      metric_name: metricName,
      current_value: currentValue,
      baseline_value: baselineValue,
      threshold_percent:
        regressionPercent >= REGRESSION_THRESHOLD_CRITICAL
          ? REGRESSION_THRESHOLD_CRITICAL
          : REGRESSION_THRESHOLD_WARNING,
      regression_percent: regressionPercent,
      severity: regressionPercent >= REGRESSION_THRESHOLD_CRITICAL ? "critical" : "warning",
      workflow_run_id: metrics.workflow_run_id,
      commit_sha: metrics.commit_sha,
      resolved: false,
    };
  }

  return null;
}

/**
 * Stocke les alertes dans Supabase
 */
async function storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
  try {
    const { error } = await supabase.from("performance_alerts").insert(alerts);

    if (error) {
      logError(
        ErrorFactory.api(
          "Failed to store performance alerts",
          "Erreur lors du stockage des alertes",
        ),
        { component: "performance-collector", operation: "storeAlerts", error },
      );
    }
  } catch (error) {
    logError(ErrorFactory.api("Error storing alerts", "Erreur lors du stockage des alertes"), {
      component: "performance-collector",
      operation: "storeAlerts",
      error,
    });
  }
}

/**
 * Récupère les alertes actives
 */
export async function getActiveAlerts(): Promise<PerformanceAlert[]> {
  try {
    const { data, error } = await supabase
      .from("performance_alerts")
      .select("*")
      .eq("resolved", false)
      .order("timestamp", { ascending: false });

    if (error) {
      logError(
        ErrorFactory.api(
          "Failed to fetch active alerts",
          "Erreur lors de la récupération des alertes",
        ),
        { component: "performance-collector", operation: "getActiveAlerts", error },
      );
      return [];
    }

    return data || [];
  } catch (error) {
    logError(
      ErrorFactory.api(
        "Error fetching active alerts",
        "Erreur lors de la récupération des alertes",
      ),
      { component: "performance-collector", operation: "getActiveAlerts", error },
    );
    return [];
  }
}

/**
 * Résout une alerte
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("performance_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", alertId);

    if (error) {
      logError(
        ErrorFactory.api("Failed to resolve alert", "Erreur lors de la résolution de l'alerte"),
        { component: "performance-collector", operation: "resolveAlert", error },
      );
      return false;
    }

    return true;
  } catch (error) {
    logError(
      ErrorFactory.api("Error resolving alert", "Erreur lors de la résolution de l'alerte"),
      { component: "performance-collector", operation: "resolveAlert", error },
    );
    return false;
  }
}
