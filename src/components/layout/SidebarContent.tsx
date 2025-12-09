import { Link } from "react-router-dom";
import { LayoutDashboard, Clock, BarChart3, Settings, User, Palette } from "lucide-react";
import { useActiveRoute } from "@/hooks/useActiveRoute";

interface SidebarContentProps {
  onItemClick?: () => void;
}

/**
 * Contenu de la sidebar (navigation items)
 * Utilisé à la fois pour desktop et mobile
 */
export function SidebarContent({ onItemClick }: SidebarContentProps) {
  const { isActive } = useActiveRoute();

  const navItems = [
    {
      href: "/date-polls/workspace/date",
      label: "Mes sondages",
      icon: LayoutDashboard,
    },
    {
      href: "/recent",
      label: "Récents",
      icon: Clock,
    },
    {
      href: "/results",
      label: "Résultats",
      icon: BarChart3,
    },
    {
      href: "/settings",
      label: "Paramètres",
      icon: Settings,
    },
  ];

  const bottomItems = [
    {
      href: "/profile",
      label: "Profile",
      icon: User,
    },
    {
      href: "/theme",
      label: "Thème",
      icon: Palette,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-4 border-b">
        <Link to="/" className="text-xl font-bold">
          DooDates
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-colors
                ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Navigation secondaire (bottom) */}
      <div className="p-4 border-t space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-colors
                ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
