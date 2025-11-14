import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface PollTypeCardProps {
  to: string;
  testId: string;
  title: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  hoverBorderClass: string;
  focusRingClass: string;
  ctaColorClass: string;
  badge?: "new" | "popular" | "ai";
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const PollTypeCard: React.FC<PollTypeCardProps> = ({
  to,
  testId,
  title,
  description,
  features,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  hoverBorderClass,
  focusRingClass,
  ctaColorClass,
  badge,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <Link
      to={to}
      data-testid={testId}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group block rounded-lg border border-gray-700 bg-[#1e1e1e] p-6 ${hoverBorderClass} focus:outline-none ${focusRingClass} transition-all duration-200 h-full flex flex-col relative`}
    >
      {/* Badge en coin haut droite */}
      {badge && (
        <div className="absolute top-3 right-3">
          {badge === "new" && (
            <span className="px-2 py-0.5 text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full">
              Nouveau
            </span>
          )}
          {badge === "popular" && (
            <span className="px-2 py-0.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
              Populaire
            </span>
          )}
          {badge === "ai" && (
            <span className="px-2 py-0.5 text-xs font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-full">
              IA
            </span>
          )}
        </div>
      )}

      {/* Icône centrée en haut */}
      <div className="flex justify-center mb-4">
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
          <Icon className={`w-8 h-8 ${iconColorClass}`} />
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-lg font-semibold text-white text-center mb-2">{title}</h2>
        <p className="text-sm text-gray-400 text-center mb-4 flex-shrink-0">{description}</p>
        <ul className="mt-auto text-sm text-gray-400 space-y-1.5 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0"></span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <span
          className={`inline-block text-center mt-auto ${ctaColorClass} group-hover:underline font-medium`}
        >
          Créer →
        </span>
      </div>
    </Link>
  );
};
