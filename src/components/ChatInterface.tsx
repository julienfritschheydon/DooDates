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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Je suis votre assistant IA pour la planification collaborative. Comment puis-je vous aider à organiser votre prochain rendez-vous ?",
      isAI: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showPollCreator, setShowPollCreator] = useState(false);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        isAI: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Parfait ! Je vais vous aider à planifier cela. Pouvez-vous me dire combien de personnes seront impliquées et quelle est la durée approximative souhaitée ?",
          isAI: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
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

      {/* Input */}
      <div className="bg-white border-t p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Décrivez votre besoin de planification..."
            className="doo-input text-sm sm:text-base"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-3 bg-doo-gradient text-white rounded-xl hover:shadow-lg transition-all duration-200 flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">v2.4.3</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
