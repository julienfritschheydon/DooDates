import { useState } from 'react';
import { Menu, User, Settings } from 'lucide-react';
import HistoryPanel from './HistoryPanel';

/**
 * TopBar minimal style ChatGPT
 * 
 * - Burger pour historique (gauche)
 * - Logo centre (optionnel)
 * - User actions (droite)
 */
export function TopBar() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-full px-4">
          {/* Burger historique (gauche) */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Historique des conversations"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo centre (optionnel) */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-lg font-semibold text-gray-900">DooDates</h1>
          </div>

          {/* User actions (droite) */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Panel historique collapsible */}
      {showHistory && (
        <HistoryPanel onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}
