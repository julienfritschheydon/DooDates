import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Smartphone, Sparkles } from 'lucide-react';

const TopNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-doo-gradient rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          <div>
            <h1 className="font-geist font-bold text-lg text-gray-900">DooDates</h1>
            <p className="text-xs text-gray-500">AI Scheduling</p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              // Nettoyer le localStorage avant de naviguer vers un nouveau sondage
              localStorage.removeItem('doodates-draft');
              // Forcer le rechargement pour réinitialiser complètement l'état
              window.location.href = '/create';
            }}

            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm text-sm"
            title="Créer un nouveau sondage"
          >
            <Calendar className="w-4 h-4" />
            Créer
          </button>
          
          <button 
            onClick={() => {
              navigate('/demo/swipe');
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all duration-200 shadow-sm text-sm"
            title="Tester l'interface de vote swipe"
          >
            <Smartphone className="w-4 h-4" />
            Vote
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav; 