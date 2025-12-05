import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Plus, Home, List, Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/modals/AuthModal";

export const DatePollsSidebar: React.FC = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 h-screen flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <Link to="/date-polls" className="flex items-center gap-2">
                    <div className="p-2 bg-blue-900/20 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="font-bold text-xl text-white">Sondages</span>
                </Link>
            </div>

            <div className="p-4">
                <Link
                    to="/create/date"
                    data-testid="create-date-poll"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau Sondage
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <Link
                    to="/date-polls/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/date-polls/dashboard")
                            ? "bg-blue-900/20 text-blue-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                >
                    <Home className="w-5 h-5" />
                    Tableau de bord
                </Link>
                <Link
                    to="/date-polls/list"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/date-polls/list")
                            ? "bg-blue-900/20 text-blue-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                >
                    <List className="w-5 h-5" />
                    Mes Sondages
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-1">
                <Link
                    to="/date-polls/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    Paramètres
                </Link>
            </div>

            {/* User Menu / Connexion */}
            <div className="p-3 border-t border-gray-800">
                {user ? (
                    <div className="px-3 py-3 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-700/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                    {(user.user_metadata?.full_name || user.email?.split("@")[0] || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                                </p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to="/date-polls/settings"
                                className="flex-1 px-2 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-blue-700/50 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-blue-700/30"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Paramètres</span>
                            </Link>
                            <button
                                onClick={async () => {
                                    await signOut();
                                }}
                                className="flex-1 px-2 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-red-500/30"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Déconnexion</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-3 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-400">Invité</p>
                                <p className="text-xs text-gray-500">Non connecté</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setAuthModalOpen(true);
                            }}
                            className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-500/20"
                        >
                            Se connecter
                        </button>
                    </div>
                )}
            </div>

            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        </div>
    );
};
