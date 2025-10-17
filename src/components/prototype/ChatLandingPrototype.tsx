import { useState, useRef, useEffect } from 'react';
import { Send, Calendar, FileText, BarChart3 } from 'lucide-react';

/**
 * Chat Landing Prototype
 * 
 * Interface chat plein écran (style ChatGPT) pour création de sondages
 * Remplace le dashboard quand feature flag AI_FIRST_UX est activé
 */
interface ChatLandingPrototypeProps {
  onPollCreated?: (poll: any) => void;
}

export function ChatLandingPrototype({ onPollCreated }: ChatLandingPrototypeProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input au chargement
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Auto-scroll vers dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Ajouter message user
    setMessages((prev) => [...prev, { role: 'user', content: input }]);

    // Simuler réponse IA (prototype)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Super ! Je vais vous aider à créer ce sondage. (Prototype - fonctionnalité à implémenter)',
        },
      ]);
    }, 500);

    setInput('');
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const suggestions = [
    {
      icon: Calendar,
      text: 'Créer un sondage de dates pour une réunion',
      description: 'Trouver le meilleur créneau',
    },
    {
      icon: FileText,
      text: 'Créer un questionnaire de satisfaction',
      description: 'Recueillir des feedbacks',
    },
    {
      icon: BarChart3,
      text: 'Voir mes sondages récents',
      description: 'Consulter les résultats',
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Messages area - prend tout l'espace disponible */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Logo/Brand (seulement si pas de messages) */}
          {messages.length === 0 && (
            <div className="text-center mb-12 mt-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">DooDates</h1>
              <p className="text-gray-600 text-lg">Votre assistant pour créer des sondages</p>
            </div>
          )}

          {/* Chat messages */}
          <div className="space-y-4">
            {messages.length === 0 ? (
              /* Welcome message avec suggestions */
              <div className="text-center py-8">
                <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Bonjour !</h2>
                <p className="text-gray-600 mb-8">
                  Que voulez-vous créer aujourd'hui ?
                </p>

                {/* Suggestions */}
                <div className="grid gap-3 max-w-md mx-auto">
                  {suggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestion(suggestion.text)}
                        className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-white rounded-lg">
                          <Icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{suggestion.text}</div>
                          <div className="text-sm text-gray-500">{suggestion.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Messages history */
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input area - fixé en bas */}
      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </div>
          </form>
          
          {/* Footer hint */}
          <p className="text-center text-xs text-gray-400 mt-2">
            💡 Prototype - L'IA sera intégrée dans les prochaines étapes
          </p>
        </div>
      </div>
    </div>
  );
}
