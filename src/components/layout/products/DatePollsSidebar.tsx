import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Plus, Home, List, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const DatePollsSidebar: React.FC = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <Link to="/date-polls" className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-xl text-gray-900">Sondages</span>
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
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <List className="w-5 h-5" />
                    Mes Sondages
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-1">
                <Link
                    to="/dashboard/journal"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <FileText className="w-5 h-5" />
                    Journal de consommation
                </Link>
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    Paramètres
                </Link>
            </div>
        </div>
    );
};
