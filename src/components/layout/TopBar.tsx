import { useState } from "react";
import { Menu, User, Settings } from "lucide-react";
import HistoryPanel from "./HistoryPanel";

/**
 * TopBar minimal style ChatGPT
 *
 * - Burger pour historique (gauche)
 * - Logo centre (optionnel)
 * - User actions (droite)
 */
interface TopBarProps {
  onConversationSelect?: (conversationId: string) => void;
}

export function TopBar({ onConversationSelect }: TopBarProps = {}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#1e1e1e]/95 backdrop-blur-md border-b border-gray-700/50 z-30 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
          {/* Burger historique (gauche) - Plus visible */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2.5 hover:bg-[#2a2a2a] rounded-xl transition-all duration-200 hover:scale-105 border border-transparent hover:border-gray-700"
            aria-label="Historique des conversations"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          {/* Logo centre - Style moderne */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-xl font-bold text-white">DooDates</h1>
          </div>

          {/* User actions (droite) - Plus stylées */}
          <div className="flex items-center gap-1">
            <button
              className="p-2.5 hover:bg-[#2a2a2a] rounded-xl transition-all duration-200 hover:scale-105 border border-transparent hover:border-gray-700"
              aria-label="Paramètres"
            >
              <Settings className="w-5 h-5 text-gray-300" />
            </button>
            <div className="relative">
              <button
                className="p-2.5 hover:bg-[#2a2a2a] rounded-xl transition-all duration-200 hover:scale-105 border border-transparent hover:border-gray-700"
                aria-label="Profile"
                title="Compte (en développement)"
              >
                <User className="w-5 h-5 text-gray-300" />
              </button>
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                DEV
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Panel historique collapsible */}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onConversationSelect={onConversationSelect}
        />
      )}
    </>
  );
}
