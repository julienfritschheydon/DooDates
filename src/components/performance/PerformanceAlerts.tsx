import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import {
  getActiveAlerts,
  resolveAlert,
  PerformanceAlert,
} from "../../services/performance-collector";

export function PerformanceAlerts() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    const activeAlerts = await getActiveAlerts();
    setAlerts(activeAlerts);
    setLoading(false);
  };

  const handleResolve = async (alertId: string) => {
    const success = await resolveAlert(alertId);
    if (success) {
      setAlerts(alerts.filter((a) => a.id !== alertId));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Aucune alerte active</h3>
            <p className="text-sm text-gray-600">
              Toutes les métriques sont dans les seuils acceptables
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Alertes de Performance ({alerts.length})
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${
              alert.severity === "critical"
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {alert.severity === "critical" ? "CRITIQUE" : "AVERTISSEMENT"}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatMetricName(alert.metric_name)}
                  </span>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    Régression détectée : <strong>{alert.regression_percent.toFixed(1)}%</strong>
                  </p>
                  <p>
                    Valeur actuelle :{" "}
                    <strong>{formatValue(alert.metric_name, alert.current_value)}</strong>
                    {" → "}
                    Baseline :{" "}
                    <strong>{formatValue(alert.metric_name, alert.baseline_value)}</strong>
                  </p>
                  {alert.commit_sha && (
                    <p className="text-xs text-gray-500">
                      Commit: {alert.commit_sha.substring(0, 7)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => alert.id && handleResolve(alert.id)}
                className="ml-4 p-1 hover:bg-white rounded-full transition-colors"
                title="Résoudre l'alerte"
                data-testid="performancealerts-button"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMetricName(name: string): string {
  const names: Record<string, string> = {
    performance_score: "Performance Score",
    largest_contentful_paint: "LCP",
    cumulative_layout_shift: "CLS",
    total_blocking_time: "TBT",
    first_input_delay: "FID",
    dashboard_load_50: "Dashboard 50 conv.",
    dashboard_load_200: "Dashboard 200 conv.",
    tags_menu_open: "Menu Tags",
    folders_menu_open: "Menu Dossiers",
  };
  return names[name] || name;
}

function formatValue(metricName: string, value: number): string {
  if (metricName === "performance_score") {
    return value.toFixed(0);
  }
  if (metricName === "cumulative_layout_shift") {
    return value.toFixed(3);
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return `${value.toFixed(0)}ms`;
}
