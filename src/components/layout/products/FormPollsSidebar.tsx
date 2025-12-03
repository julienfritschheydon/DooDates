import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Plus, Home, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const FormPollsSidebar: React.FC = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <Link to="/form-polls" className="flex items-center gap-2">
                    <div className="p-2 bg-violet-100 rounded-lg">
                        <FileText className="w-6 h-6 text-violet-600" />
                    </div>
                    <span className="font-bold text-xl text-gray-900">Formulaires</span>
                </Link>
            </div>

            <div className="p-4">
                <Link
                    to="/create/form"
                    data-testid="create-form-poll"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau Formulaire
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <Link
                    to="/form-polls/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/form-polls/dashboard")
                            ? "bg-violet-50 text-violet-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <Home className="w-5 h-5" />
                    Tableau de bord
                </Link>
                <Link
                    to="/form-polls/list"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/form-polls/list")
                            ? "bg-violet-50 text-violet-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                >
                    <List className="w-5 h-5" />
                    Mes Formulaires
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
