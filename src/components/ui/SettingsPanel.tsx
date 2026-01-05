import React, { useState } from "react";
import { Settings, ChevronDown, ChevronUp, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface SettingsTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface SettingsPanelProps {
  tabs: SettingsTab[];
  defaultTab?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  className?: string;
}

export function SettingsPanel({
  tabs,
  defaultTab,
  isOpen,
  onOpenChange,
  title = "Paramètres de configuration",
  className = "",
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || "");

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className={`mb-6 ${className}`}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-[#1e1e1e] rounded-lg border border-gray-800 hover:bg-[#2a2a2a] transition-colors">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-300" />
          <span className="text-sm font-medium text-gray-300">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="bg-[#1e1e1e] rounded-lg border border-gray-800 overflow-hidden">
          {/* Onglets */}
          {tabs.length > 1 && (
            <div className="flex border-b border-gray-700 bg-[#0a0a0a]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#1e1e1e] text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#151515]"
                  }`}
                 data-testid="settingspanel-button">
                  <div className="flex items-center justify-center gap-2">
                    {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Contenu de l'onglet actif */}
          <div className="p-4">
            {tabs.find((tab) => tab.id === activeTab)?.content || tabs[0]?.content}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
