import React from "react";

interface KPI {
  label: string;
  value: React.ReactNode;
}

interface ResultsLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  kpis?: KPI[];
  children: React.ReactNode;
}

export default function ResultsLayout({
  title,
  subtitle,
  actions,
  kpis,
  children,
}: ResultsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle ? (
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {actions}
          </div>
        ) : null}

        {/* KPI cards */}
        {Array.isArray(kpis) && kpis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpis.map((kpi, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpi.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
