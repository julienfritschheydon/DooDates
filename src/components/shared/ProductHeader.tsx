import React from "react";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ProductHeaderProps {
  title?: string;
  subtitle?: string;
  user?: any;
  showBackButton?: boolean;
  showSettings?: boolean;
  backTo?: string;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  title,
  subtitle,
  user,
  showBackButton = false,
  showSettings = false,
  backTo = "/workspace",
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={() => navigate(backTo)} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {showSettings && (
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {user && <UserMenu />}
          </div>
        </div>
      </div>
    </header>
  );
};
