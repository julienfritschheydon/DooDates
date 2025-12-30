import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { PerformanceAlerts } from "./PerformanceAlerts";
import { logError, ErrorFactory } from "@/lib/error-handling";

// Types for performance data
interface PerformanceMetric {
  date: string;
  e2e: {
    dashboard_load_50: number;
    dashboard_load_200: number;
    tags_menu_open: number;
    folders_menu_open: number;
    date_dashboard_load: number;
    form_dashboard_load: number;
    availability_dashboard_load: number;
    quizz_dashboard_load: number;
  };
  lighthouse: {
    performance_score: number;
    largest_contentful_paint: number;
    cumulative_layout_shift: number;
    total_blocking_time: number;
    first_input_delay: number;
  };
}

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetric | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      // Load baseline data and recent runs
      const baselineResponse = await fetch("/DooDates/performance-baseline.json");
      const baseline = await baselineResponse.json();

      // Mock historical data - in real app, this would come from Supabase
      const mockHistoricalData: PerformanceMetric[] = [
        {
          date: "2025-12-15",
          e2e: {
            dashboard_load_50: 3200,
            dashboard_load_200: 5100,
            tags_menu_open: 520,
            folders_menu_open: 480,
            date_dashboard_load: 3100,
            form_dashboard_load: 3200,
            availability_dashboard_load: 2900,
            quizz_dashboard_load: 3100,
          },
          lighthouse: {
            performance_score: 85,
            largest_contentful_paint: 2600,
            cumulative_layout_shift: 0.12,
            total_blocking_time: 220,
            first_input_delay: 110,
          },
        },
        {
          date: "2025-12-16",
          e2e: {
            dashboard_load_50: 3100,
            dashboard_load_200: 4900,
            tags_menu_open: 510,
            folders_menu_open: 470,
            date_dashboard_load: 3000,
            form_dashboard_load: 3100,
            availability_dashboard_load: 2800,
            quizz_dashboard_load: 3000,
          },
          lighthouse: {
            performance_score: 87,
            largest_contentful_paint: 2500,
            cumulative_layout_shift: 0.1,
            total_blocking_time: 200,
            first_input_delay: 105,
          },
        },
        {
          date: "2025-12-17",
          e2e: {
            dashboard_load_50: baseline.e2e_performance.metrics.dashboard_load_50_conversations,
            dashboard_load_200: baseline.e2e_performance.metrics.dashboard_load_200_conversations,
            tags_menu_open: baseline.e2e_performance.metrics.tags_menu_open,
            folders_menu_open: baseline.e2e_performance.metrics.folders_menu_open,
            date_dashboard_load: baseline.e2e_performance.metrics.date_dashboard_load,
            form_dashboard_load: baseline.e2e_performance.metrics.form_dashboard_load,
            availability_dashboard_load:
              baseline.e2e_performance.metrics.availability_dashboard_load,
            quizz_dashboard_load: baseline.e2e_performance.metrics.quizz_dashboard_load,
          },
          lighthouse: {
            performance_score: baseline.lighthouse_ci.metrics.performance_score,
            largest_contentful_paint: baseline.lighthouse_ci.metrics.largest_contentful_paint,
            cumulative_layout_shift: baseline.lighthouse_ci.metrics.cumulative_layout_shift,
            total_blocking_time: baseline.lighthouse_ci.metrics.total_blocking_time,
            first_input_delay: baseline.lighthouse_ci.metrics.first_input_delay,
          },
        },
      ];

      setMetrics(mockHistoricalData);
      setCurrentMetrics(mockHistoricalData[mockHistoricalData.length - 1]);
    } catch (error) {
      logError(
        ErrorFactory.api(
          "Failed to load performance data",
          "Erreur lors du chargement des données de performance",
        ),
        { component: "PerformanceDashboard", operation: "loadPerformanceData", error },
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (value: number, threshold: number, isScore = false) => {
    const isGood = isScore ? value >= threshold : value <= threshold;
    const Icon = isGood ? CheckCircle : AlertTriangle;
    const color = isGood ? "text-green-600" : "text-red-600";
    return <Icon className={`w-4 h-4 ${color}`} />;
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!currentMetrics) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
        <p className="text-gray-500">Aucune donnée de performance disponible</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alertes de performance */}
      <PerformanceAlerts />

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Performance</h2>
        </div>
        <p className="text-gray-600">
          Surveillance des métriques de performance E2E et Lighthouse CI
        </p>
      </div>

      {/* E2E Performance Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tests E2E - Métriques Actuelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Dashboard 50 conv.</span>
              {getStatusIcon(currentMetrics.e2e.dashboard_load_50, 3000)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(currentMetrics.e2e.dashboard_load_50 / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 3.0s</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Dashboard 200 conv.</span>
              {getStatusIcon(currentMetrics.e2e.dashboard_load_200, 5000)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(currentMetrics.e2e.dashboard_load_200 / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 5.0s</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Menu Tags</span>
              {getStatusIcon(currentMetrics.e2e.tags_menu_open, 500)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.e2e.tags_menu_open}ms
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 500ms</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Menu Dossiers</span>
              {getStatusIcon(currentMetrics.e2e.folders_menu_open, 500)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.e2e.folders_menu_open}ms
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 500ms</div>
          </div>
        </div>
      </div>

      {/* Lighthouse CI Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Lighthouse CI - Métriques Actuelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Performance Score</span>
              {getStatusIcon(currentMetrics.lighthouse.performance_score, 90, true)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.lighthouse.performance_score}
            </div>
            <div className="text-xs text-gray-500">Seuil: ≥ 90</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">LCP</span>
              {getStatusIcon(currentMetrics.lighthouse.largest_contentful_paint, 2500)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(currentMetrics.lighthouse.largest_contentful_paint / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 2.5s</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">CLS</span>
              {getStatusIcon(currentMetrics.lighthouse.cumulative_layout_shift, 0.1)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.lighthouse.cumulative_layout_shift}
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 0.1</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">TBT</span>
              {getStatusIcon(currentMetrics.lighthouse.total_blocking_time, 200)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.lighthouse.total_blocking_time}ms
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 200ms</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">FID</span>
              {getStatusIcon(currentMetrics.lighthouse.first_input_delay, 100)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.lighthouse.first_input_delay}ms
            </div>
            <div className="text-xs text-gray-500">Seuil: &lt; 100ms</div>
          </div>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Évolution sur 7 jours
        </h3>
        <div className="text-sm text-gray-600">
          <p>📊 Données historiques simulées pour démonstration</p>
          <p>🔄 En production, les données proviendront des workflows CI/CD</p>
          <p>📈 Graphiques complets à implémenter avec une bibliothèque de visualisation</p>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.length}</div>
            <div className="text-sm text-gray-600">Jours trackés</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {metrics.filter((m) => m.lighthouse.performance_score >= 90).length}
            </div>
            <div className="text-sm text-gray-600">Jours au-dessus du seuil</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(
                metrics.reduce((acc, m) => acc + m.lighthouse.performance_score, 0) /
                  metrics.length,
              )}
            </div>
            <div className="text-sm text-gray-600">Score moyen Lighthouse</div>
          </div>
        </div>
      </div>
    </div>
  );
}
