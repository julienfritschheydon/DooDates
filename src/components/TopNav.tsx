import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Smartphone, Sparkles } from "lucide-react";

const TopNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          data-testid="home-button"
        >
          <div className="w-10 h-10 bg-doo-gradient rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          <div>
            <h1 className="font-geist font-bold text-lg text-gray-900">
              DooDates
            </h1>
            <p className="text-xs text-gray-500">AI Scheduling</p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-1 lg:gap-2 bg-gray-100 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm text-sm"
            title="Mes sondages"
            data-testid="dashboard-button"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Mes sondages</span>
          </button>

          <button
            onClick={() => navigate("/ai-chat")}
            className="flex items-center justify-center gap-1 lg:gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-sm text-sm"
            title="Chat IA"
            data-testid="ai-chat-button"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </button>

          <button
            onClick={() => {
              // Nettoyer le localStorage avant de naviguer vers un nouveau sondage
              localStorage.removeItem("doodates-draft");
              navigate("/create");
            }}
            className="flex items-center justify-center gap-1 lg:gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm text-sm"
            title="Créer un nouveau sondage"
            data-testid="create-poll-button"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Créer</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
