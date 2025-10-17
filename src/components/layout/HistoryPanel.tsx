import { X, Clock, Calendar, FileText } from 'lucide-react';

interface HistoryPanelProps {
  onClose: () => void;
}

/**
 * Panel historique collapsible (style ChatGPT)
 * 
 * S'ouvre depuis le burger, affiche l'historique des conversations
 */
export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  // Données mockées pour le prototype
  const history = [
    {
      id: '1',
      title: 'Réunion équipe Q4',
      type: 'date',
      date: "Aujourd'hui",
      icon: Calendar,
    },
    {
      id: '2',
      title: 'Questionnaire satisfaction',
      type: 'form',
      date: 'Hier',
      icon: FileText,
    },
    {
      id: '3',
      title: 'Sondage dates formation',
      type: 'date',
      date: 'Cette semaine',
      icon: Calendar,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel historique */}
      <aside className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Historique</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste conversations */}
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {/* Groupe par date */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Aujourd'hui
            </h3>
            {history
              .filter((item) => item.date === "Aujourd'hui")
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={onClose}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left mb-1"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.type === 'date' ? 'Sondage dates' : 'Questionnaire'}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Hier
            </h3>
            {history
              .filter((item) => item.date === 'Hier')
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={onClose}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left mb-1"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.type === 'date' ? 'Sondage dates' : 'Questionnaire'}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Cette semaine
            </h3>
            {history
              .filter((item) => item.date === 'Cette semaine')
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={onClose}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left mb-1"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.type === 'date' ? 'Sondage dates' : 'Questionnaire'}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </aside>
    </>
  );
}
