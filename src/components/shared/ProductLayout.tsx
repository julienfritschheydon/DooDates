import React from "react";
// import { ProductHeader } from './ProductHeader';
import { useAuth } from "@/contexts/AuthContext";

interface ProductLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  className?: string;
}

export const ProductLayout: React.FC<ProductLayoutProps> = ({
  children,
  title,
  subtitle,
  showHeader = true,
  className = "",
}) => {
  const { user } = useAuth();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {showHeader && (
        <header className="bg-white border-b border-gray-200 py-6">
          <div className="container mx-auto px-4">
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};
