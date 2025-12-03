import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, Plus, Home, List, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const AvailabilityPollsSidebar: React.FC = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <Link to="/availability-polls" className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="font-bold text-xl text-gray-900">Disponibilités</span>
                </Link>
            </div>

            <div className="p-4">
                <Link
                    to="/create/availability"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouvelle Dispo
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <Link
                    to="/availability-polls/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/availability-polls/dashboard")
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <Home className="w-5 h-5" />
                    Tableau de bord
                </Link>
                <Link
                    to="/availability-polls/list"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/availability-polls/list")
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <List className="w-5 h-5" />
                    Mes Disponibilités
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
