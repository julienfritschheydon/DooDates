import React from "react";
import { MessageSquare, FileText, Calendar, Clock } from "lucide-react";

interface MobileNavigationTabsProps {
  activeTab: "chat" | "editor";
  onTabChange: (tab: "chat" | "editor") => void;
  pollType: "date" | "form" | "availability";
  hasPoll: boolean;
  className?: string;
}

/**
 * Barre de navigation mobile avec onglets pour basculer entre chat et éditeur
 * Affiche un badge de notification quand un poll est créé
 */
export function MobileNavigationTabs({
  activeTab,
  onTabChange,
  pollType,
  hasPoll,
  className = "",
}: MobileNavigationTabsProps) {
  // Déterminer l'icône et le label selon le type de poll
  const getEditorInfo = () => {
    switch (pollType) {
      case "form":
        return {
          icon: FileText,
          label: "Formulaire",
          color: "purple",
        };
      case "availability":
        return {
          icon: Clock,
          label: "Disponibilités",
          color: "blue",
        };
      case "date":
      default:
        return {
          icon: Calendar,
          label: "Sondage",
          color: "green",
        };
    }
  };

  const editorInfo = getEditorInfo();
  const EditorIcon = editorInfo.icon;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-[#1e1e1e]/95 backdrop-blur-sm border-t border-gray-800 z-30 ${className}`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around h-12 px-2">
        {/* Onglet Chat */}
        <button
          onClick={() => onTabChange("chat")}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all relative ${
            activeTab === "chat"
              ? "bg-blue-500/20 text-blue-400"
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
          }`}
          aria-label="Afficher le chat"
          data-testid="mobilenavigationtabs-button"
        >
          <MessageSquare className="w-6 h-6" />
          {activeTab === "chat" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-t-full" />
          )}
        </button>

        {/* Onglet Éditeur (Sondage/Formulaire/Disponibilités) */}
        <button
          onClick={() => onTabChange("editor")}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all relative ${
            activeTab === "editor"
              ? pollType === "form"
                ? "bg-purple-500/20 text-purple-400"
                : pollType === "availability"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-green-500/20 text-green-400"
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
          }`}
          aria-label={`Afficher ${editorInfo.label.toLowerCase()}`}
          data-testid="mobilenavigationtabs-edit"
        >
          <div className="relative">
            <EditorIcon className="w-6 h-6" />
            {/* Badge de notification quand un poll est créé */}
            {hasPoll && activeTab === "chat" && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border border-[#1e1e1e]" />
            )}
          </div>
          {activeTab === "editor" && (
            <div
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-t-full ${
                pollType === "form"
                  ? "bg-purple-500"
                  : pollType === "availability"
                    ? "bg-blue-500"
                    : "bg-green-500"
              }`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
