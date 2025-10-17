import { Send } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from './WorkspaceProvider';

/**
 * Workspace Layout Prototype - Style ChatGPT
 * 
 * 2 états:
 * - Pas de sondage: Chat centré plein écran
 * - Sondage actif: Chat 40% gauche + Preview 60% droite
 */
export function WorkspaceLayoutPrototype() {
  const { poll } = useWorkspace();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je vais vous aider à créer votre sondage.',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);

    // Simuler réponse IA
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Compris ! (Prototype - à implémenter)',
        },
      ]);
    }, 500);

    setInput('');
  };

  // Si pas de sondage: Chat centré plein écran
  if (!poll) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-full max-w-3xl mx-auto px-4">
          {/* Chat centré */}
          <div className="space-y-4 mb-6">
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
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Décrivez le sondage que vous voulez créer..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Si sondage actif: Layout 2 colonnes (Chat 40% gauche + Preview 60% droite)
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat (gauche 40%) */}
      <div className="w-2/5 border-r border-gray-200 bg-white flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Preview (droite 60%) */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Aperçu du sondage</h2>

          {/* Afficher le poll */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">{poll.title}</h3>
            <p className="text-gray-600">Type: {poll.type}</p>
            <p className="text-sm text-gray-500 mt-4">
              💡 Preview live - mise à jour automatique via l'IA
            </p>
          </div>

          {/* Mockup calendrier */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="font-semibold mb-4">Sélectionnez vos dates</h4>
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => (
                <button
                  key={day}
                  className="aspect-square flex items-center justify-center border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Calendrier interactif - S'adapte aux choix de l'IA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
