import React, { useState } from 'react';
import { Send, Sparkles, Plus } from 'lucide-react';
import PollCreator from './PollCreator';

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showPollCreator, setShowPollCreator] = useState(false);

  const handleSendMessage = () => {
    // Fonctionnalité temporairement désactivée
    console.log('Chat IA - Bientôt disponible');
  };

  if (showPollCreator) {
    return <PollCreator onBack={() => setShowPollCreator(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-doo-gradient-subtle">
      {/* Single Plus Button */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-center">
          <button
            onClick={() => setShowPollCreator(true)}
            className="w-12 h-12 bg-doo-gradient rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-200 doo-hover-lift"
            title="Créer un nouveau sondage"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Messages Area - Empty State */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex items-center justify-center">
        {messages.length === 0 && (
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-doo-gradient rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Chat IA bientôt disponible</h3>
            <p className="text-sm text-gray-400 mb-4">
              L'assistant conversationnel sera disponible dans une prochaine version.
            </p>
            <p className="text-sm text-gray-500">
              En attendant, utilisez le bouton <strong>+</strong> pour créer vos sondages.
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] sm:max-w-[80%] ${
              message.isAI 
                ? 'doo-chat-bubble ai' 
                : 'doo-chat-bubble user'
            }`}>
              {message.isAI && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-doo-blue-600 drop-shadow-sm" />
                  <span className="text-sm font-medium text-doo-blue-700">DooDates</span>
                </div>
              )}
              <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
              <div className="mt-2 text-xs text-gray-400">
                {message.timestamp.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input - Disabled */}
      <div className="bg-white border-t p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Chat IA - Bientôt disponible..."
            className="doo-input text-sm sm:text-base opacity-50 cursor-not-allowed"
            disabled
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-3 bg-doo-gradient text-white rounded-xl hover:shadow-lg transition-all duration-200 flex-shrink-0 opacity-50 cursor-not-allowed"
            disabled
            title="Chat IA - Bientôt disponible"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">v2.4.8</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
