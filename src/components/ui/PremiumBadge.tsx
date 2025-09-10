/**
 * Premium badge component for locked features
 * DooDates - Freemium UI Components
 */

import React from 'react';
import { Crown, Lock, Sparkles } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'crown' | 'lock' | 'sparkles';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  onClick?: () => void;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  variant = 'crown',
  size = 'md',
  text = 'Premium',
  className = '',
  onClick,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'lock':
        return <Lock className="w-3 h-3" />;
      case 'sparkles':
        return <Sparkles className="w-3 h-3" />;
      default:
        return <Crown className="w-3 h-3" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-1.5 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-sm';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 
        text-white font-semibold rounded-full ${getSizeClasses()}
        ${onClick ? 'cursor-pointer hover:from-yellow-500 hover:to-orange-600 transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {getIcon()}
      {text}
    </span>
  );
};

export default PremiumBadge;
