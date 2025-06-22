
import React from 'react';
import { 
  MessageCircle, 
  Calendar, 
  History, 
  Settings, 
  User, 
  Plus,
  Sparkles 
} from 'lucide-react';

const Sidebar = () => {
  const navigationItems = [
    { icon: MessageCircle, label: 'Chat Assistant', active: true },
    { icon: Calendar, label: 'Mes Événements', badge: '3' },
    { icon: History, label: 'Historique', badge: null },
    { icon: Settings, label: 'Paramètres', badge: null },
  ];

  const recentChats = [
    { title: 'Réunion équipe marketing', time: '2h' },
    { title: 'Déjeuner client Dupont', time: '1j' },
    { title: 'Formation nouveaux employés', time: '3j' },
  ];

  return (
    <div className="doo-sidebar w-64 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-doo-gradient rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-geist font-bold text-lg text-gray-900">DooDates</h2>
            <p className="text-xs text-gray-500">AI Scheduling</p>
          </div>
        </div>
        
        <button className="doo-button-primary w-full flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Chat
        </button>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200">
        <nav className="space-y-1">
          {navigationItems.map((item, index) => (
            <div
              key={index}
              className={`doo-nav-item ${item.active ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-doo-blue-100 text-doo-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Conversations récentes</h3>
        <div className="space-y-2">
          {recentChats.map((chat, index) => (
            <div
              key={index}
              className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-700 group-hover:text-gray-900 leading-tight">
                  {chat.title}
                </p>
                <span className="text-xs text-gray-400 ml-2">{chat.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200">
          <div className="w-8 h-8 bg-doo-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-doo-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Utilisateur Demo</p>
            <p className="text-xs text-gray-500">Version gratuite</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
