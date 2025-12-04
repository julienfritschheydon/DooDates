import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Plus, Home, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormPollsSidebarProps {
    onClose?: () => void;
    className?: string;
}

export const FormPollsSidebar: React.FC<FormPollsSidebarProps> = ({ onClose, className }) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <div className={cn("w-64 bg-[#1a1a1a] border-r border-gray-800 h-screen flex flex-col", className)}>
            <div className="p-6 border-b border-gray-800">
                <Link to="/form-polls" className="flex items-center gap-2" onClick={handleLinkClick}>
                    <div className="p-2 bg-violet-900/20 rounded-lg">
                        <FileText className="w-6 h-6 text-violet-400" />
                    </div>
                    <span className="font-bold text-xl text-white">Formulaires</span>
                </Link>
            </div>

            <div className="p-4">
                <Link
                    to="/create/form"
                    data-testid="create-form-poll"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau Formulaire
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <Link
                    to="/form-polls/dashboard"
                    onClick={handleLinkClick}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/form-polls/dashboard")
                            ? "bg-violet-900/20 text-violet-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                >
                    <Home className="w-5 h-5" />
                    Tableau de bord
                </Link>
                <Link
                    to="/form-polls/list"
                    onClick={handleLinkClick}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/form-polls/list")
                            ? "bg-violet-900/20 text-violet-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                >
                    <List className="w-5 h-5" />
                    Mes Formulaires
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-1">
                <Link
                    to="/form-polls/settings"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    Paramètres
                </Link>
            </div>
        </div>
    );
};
