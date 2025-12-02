import React from 'react';
// import { ProductHeader } from './ProductHeader';
import { useAuth } from '@/contexts/AuthContext';

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
  className = '',
}) => {
  const { user } = useAuth();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {showHeader && (
        {/* <ProductHeader 
          title={title}
          subtitle={subtitle}
          user={user}
 /> */}
      )}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
