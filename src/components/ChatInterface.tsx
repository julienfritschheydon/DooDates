
import React, { useState } from 'react';
import { Send, Bot, Calendar, Clock, Users } from 'lucide-react';

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

  const quickActions = [
    { icon: Calendar, text: "Nouveau rendez-vous", color: "doo-blue" },
    { icon: Clock, text: "Créneaux disponibles", color: "doo-green" },
    { icon: Users, text: "Réunion d'équipe", color: "doo-purple" }
  ];

  return (
    <div className="flex flex-col h-full bg-doo-gradient-subtle">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-doo-gradient rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-geist font-semibold text-gray-900">Assistant DooDates</h1>
            <p className="text-sm text-gray-500">Modern AI scheduling, no subscriptions</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-b bg-white">
        <p className="text-sm text-gray-600 mb-4 font-medium">Actions rapides :</p>
        <div className="flex gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 transition-all duration-200 doo-hover-lift"
            >
              <action.icon className="w-4 h-4" />
              {action.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] doo-chat-bubble ${
                message.isAI ? 'ai' : 'user'
              }`}
            >
              {message.isAI && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-doo-blue-600" />
                  <span className="text-xs font-medium text-doo-blue-600">Assistant IA</span>
                </div>
              )}
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Décrivez votre besoin de planification..."
            className="doo-input flex-1"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="doo-button-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Appuyez sur Entrée pour envoyer • L'IA comprend le français naturel
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
