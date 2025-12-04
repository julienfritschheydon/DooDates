import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, Plus, Home, List, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";

interface AvailabilityPollsSidebarProps {
    onClose?: () => void;
    className?: string;
}

export const AvailabilityPollsSidebar: React.FC<AvailabilityPollsSidebarProps> = ({ onClose, className }) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <div className={cn("w-64 bg-[#1a1a1a] border-r border-gray-800 h-screen flex flex-col", className)}>
            <div className="p-6 border-b border-gray-800">
                <Link to="/availability-polls" className="flex items-center gap-2" onClick={handleLinkClick}>
                    <div className="p-2 bg-emerald-900/20 rounded-lg">
                        <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="font-bold text-xl text-white">Disponibilités</span>
                </Link>
            </div>

            <div className="p-4">
                <Link
                    to="/create/availability"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nouvelle Dispo
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <Link
                    to="/availability-polls/dashboard"
                    onClick={handleLinkClick}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/availability-polls/dashboard")
                            ? "bg-emerald-900/20 text-emerald-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                >
                    <Home className="w-5 h-5" />
                    Tableau de bord
                </Link>
                <Link
                    to="/availability-polls/list"
                    onClick={handleLinkClick}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive("/availability-polls/list")
                            ? "bg-emerald-900/20 text-emerald-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                >
                    <List className="w-5 h-5" />
                    Mes Disponibilités
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-1">
                <Link
                    to="/availability-polls/settings"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    Paramètres
                </Link>
            </div>

            <div className="p-4 border-t border-gray-800">
                <UserMenu />
            </div>
        </div>
    );
};
