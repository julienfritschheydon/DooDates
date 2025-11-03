/**
 * Authentication Incentive Modal for Freemium Users
 * DooDates - Freemium Quota Management
 */

import React from "react";
import { X, Crown, MessageCircle, Users, Calendar, Sparkles, ExternalLink } from "lucide-react";
import { type AuthIncentiveType } from "../../services/QuotaService";
import { Link } from "react-router-dom";

interface AuthIncentiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
  trigger: AuthIncentiveType;
  currentUsage?: {
    conversations: number;
    maxConversations: number;
    polls?: number;
    maxPolls?: number;
  };
}

const AuthIncentiveModal: React.FC<AuthIncentiveModalProps> = ({
  isOpen,
  onClose,
  onSignUp,
  onSignIn,
  trigger,
  currentUsage,
}) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (trigger) {
      case "conversation_limit":
        return {
          title: "Crédits IA épuisés",
          subtitle: "Créez un compte pour continuer avec la version gratuite",
          icon: <MessageCircle className="w-12 h-12 text-purple-600" />,
          description: `Vous avez utilisé tous vos crédits IA en mode invité. Avec un compte gratuit, vous bénéficiez de crédits supplémentaires chaque mois.`,
          benefits: [],
        };

      case "poll_limit":
        return {
          title: "Crédits IA épuisés",
          subtitle: "Créez un compte pour continuer avec la version gratuite",
          icon: <Calendar className="w-12 h-12 text-blue-600" />,
          description:
            "Vous avez utilisé tous vos crédits IA en mode invité. Avec un compte gratuit, vous bénéficiez de crédits supplémentaires chaque mois.",
          benefits: [],
        };

      case "feature_unlock":
        return {
          title: "Crédits IA épuisés",
          subtitle: "Créez un compte pour continuer avec la version gratuite",
          icon: <Crown className="w-12 h-12 text-yellow-600" />,
          description:
            "Vous avez utilisé tous vos crédits IA en mode invité. Avec un compte gratuit, vous bénéficiez de crédits supplémentaires chaque mois.",
          benefits: [],
        };

      case "storage_full":
        return {
          title: "Crédits IA épuisés",
          subtitle: "Créez un compte pour continuer avec la version gratuite",
          icon: <Users className="w-12 h-12 text-green-600" />,
          description:
            "Vous avez utilisé tous vos crédits IA en mode invité. Avec un compte gratuit, vous bénéficiez de crédits supplémentaires chaque mois.",
          benefits: [],
        };

      default:
        return {
          title: "Crédits IA épuisés",
          subtitle: "Créez un compte pour continuer avec la version gratuite",
          icon: <Sparkles className="w-12 h-12 text-purple-600" />,
          description:
            "Vous avez utilisé tous vos crédits IA en mode invité. Avec un compte gratuit, vous bénéficiez de crédits supplémentaires chaque mois.",
          benefits: [],
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 text-center border-b border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex justify-center mb-4">{content.icon}</div>

          <h2 className="text-xl font-bold text-gray-100 mb-2">{content.title}</h2>

          <p className="text-gray-300 text-sm">{content.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-200 mb-6 text-center">{content.description}</p>

          {/* Pricing link */}
          <div className="mb-6 p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
            <Link
              to="/pricing"
              className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={onClose}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">Voir les plans et tarifs</span>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onSignUp}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Créer un compte gratuit
            </button>

            <button
              onClick={onSignIn}
              className="w-full bg-[#0a0a0a] hover:bg-[#2a2a2a] text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthIncentiveModal;
