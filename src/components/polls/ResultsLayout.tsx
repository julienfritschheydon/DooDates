import React from "react";
import CloseButton from "@/components/ui/CloseButton";

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
  onClose?: () => void;
}

export default function ResultsLayout({
  title,
  subtitle,
  actions,
  kpis,
  children,
  onClose,
}: ResultsLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {subtitle ? <div className="text-gray-400 mt-1">{subtitle}</div> : null}
          {onClose ? (
            <CloseButton absoluteTopRight ariaLabel="Fermer" iconSize={6} onClick={onClose} />
          ) : null}
        </div>

        {/* Actions */}
        {actions ? <div className="flex flex-wrap items-center gap-2 mb-8">{actions}</div> : null}

        {/* KPI cards */}
        {Array.isArray(kpis) && kpis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-[#1e1e1e] p-6 rounded-lg shadow border border-gray-700">
                <div className="text-2xl font-bold text-white">{kpi.value}</div>
                <div className="text-gray-400">{kpi.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
