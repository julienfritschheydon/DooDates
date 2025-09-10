/**
 * Visual quota indicator component for freemium users
 * DooDates - Freemium UI Components
 */

import React from 'react';
import { Crown, MessageCircle, Calendar, AlertTriangle } from 'lucide-react';

interface QuotaIndicatorProps {
  type: 'conversations' | 'polls' | 'storage';
  used: number;
  limit: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const QuotaIndicator: React.FC<QuotaIndicatorProps> = ({
  type,
  used,
  limit,
  className = '',
  showLabel = true,
  size = 'md',
  onClick,
}) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getIcon = () => {
    switch (type) {
      case 'conversations':
        return <MessageCircle className="w-4 h-4" />;
      case 'polls':
        return <Calendar className="w-4 h-4" />;
      case 'storage':
        return <Crown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'conversations':
        return 'Conversations';
      case 'polls':
        return 'Sondages';
      case 'storage':
        return 'Stockage';
      default:
        return '';
    }
  };

  const getColorClasses = () => {
    if (isAtLimit) {
      return {
        bg: 'bg-red-100',
        border: 'border-red-200',
        text: 'text-red-700',
        progress: 'bg-red-500',
        icon: 'text-red-600',
      };
    } else if (isNearLimit) {
      return {
        bg: 'bg-orange-100',
        border: 'border-orange-200',
        text: 'text-orange-700',
        progress: 'bg-orange-500',
        icon: 'text-orange-600',
      };
    } else {
      return {
        bg: 'bg-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-700',
        progress: 'bg-blue-500',
        icon: 'text-blue-600',
      };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1',
          text: 'text-xs',
          progress: 'h-1',
        };
      case 'lg':
        return {
          container: 'px-4 py-3',
          text: 'text-sm',
          progress: 'h-3',
        };
      default:
        return {
          container: 'px-3 py-2',
          text: 'text-sm',
          progress: 'h-2',
        };
    }
  };

  const colors = getColorClasses();
  const sizes = getSizeClasses();

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} border rounded-lg ${sizes.container}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={colors.icon}>
            {getIcon()}
          </div>
          {showLabel && (
            <span className={`font-medium ${colors.text} ${sizes.text}`}>
              {getLabel()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {(isNearLimit || isAtLimit) && (
            <AlertTriangle className={`w-3 h-3 ${colors.icon}`} />
          )}
          <span className={`font-bold ${colors.text} ${sizes.text}`}>
            {used}/{limit}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={`w-full bg-gray-200 rounded-full ${sizes.progress} mt-2`}>
        <div
          className={`${colors.progress} ${sizes.progress} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Warning message for near/at limit */}
      {isAtLimit && (
        <p className={`${sizes.text} ${colors.text} mt-1 font-medium`}>
          Limite atteinte
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className={`${sizes.text} ${colors.text} mt-1`}>
          Proche de la limite
        </p>
      )}
    </div>
  );
};

export default QuotaIndicator;
