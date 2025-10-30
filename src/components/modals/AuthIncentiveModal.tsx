/**
 * Authentication Incentive Modal for Freemium Users
 * DooDates - Freemium Quota Management
 */

import React from "react";
import { X, Crown, MessageCircle, Users, Calendar, Sparkles } from "lucide-react";
import { type AuthIncentiveType } from "../../services/QuotaService";

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
          title: "Limite de conversations atteinte",
          subtitle: "Créez un compte pour continuer à utiliser DooDates",
          icon: <MessageCircle className="w-12 h-12 text-purple-600" />,
          description: `Vous avez utilisé ${currentUsage?.conversations || 0}/${currentUsage?.maxConversations || 10} conversations gratuites.`,
          benefits: [
            "1000 conversations sauvegardées",
            "Historique permanent de vos échanges",
            "Synchronisation multi-appareils",
            "Sauvegarde automatique dans le cloud",
          ],
        };

      case "poll_limit":
        return {
          title: "Créez plus de sondages",
          subtitle: "Débloquez la création illimitée de sondages",
          icon: <Calendar className="w-12 h-12 text-blue-600" />,
          description: "Les utilisateurs invités sont limités dans la création de sondages.",
          benefits: [
            "Sondages illimités",
            "Historique de tous vos sondages",
            "Statistiques avancées",
            "Export des résultats",
          ],
        };

      case "feature_unlock":
        return {
          title: "Fonctionnalité Premium",
          subtitle: "Cette fonctionnalité nécessite un compte",
          icon: <Crown className="w-12 h-12 text-yellow-600" />,
          description: "Accédez à toutes les fonctionnalités avancées de DooDates.",
          benefits: [
            "Toutes les fonctionnalités premium",
            "Support prioritaire",
            "Nouvelles fonctionnalités en avant-première",
            "Personnalisation avancée",
          ],
        };

      case "storage_full":
        return {
          title: "Stockage local saturé",
          subtitle: "Sauvegardez vos données dans le cloud",
          icon: <Users className="w-12 h-12 text-green-600" />,
          description: "Votre navigateur approche de sa limite de stockage.",
          benefits: [
            "Stockage cloud illimité",
            "Sauvegarde automatique",
            "Accès depuis tous vos appareils",
            "Sécurité renforcée",
          ],
        };

      default:
        return {
          title: "Débloquez DooDates Premium",
          subtitle: "Profitez de toutes les fonctionnalités",
          icon: <Sparkles className="w-12 h-12 text-purple-600" />,
          description: "Créez un compte gratuit pour accéder à toutes les fonctionnalités.",
          benefits: [
            "Fonctionnalités complètes",
            "Sauvegarde cloud",
            "Support premium",
            "Mises à jour prioritaires",
          ],
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 text-center border-b">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex justify-center mb-4">{content.icon}</div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">{content.title}</h2>

          <p className="text-gray-600 text-sm">{content.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-center">{content.description}</p>

          {/* Benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Avec un compte gratuit :
            </h3>
            <ul className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Usage indicator if available */}
          {currentUsage && (
            <div className="mb-6 p-4 bg-[#0a0a0a] rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Utilisation actuelle</span>
                <span className="text-sm text-gray-600">
                  {currentUsage.conversations}/{currentUsage.maxConversations}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((currentUsage.conversations / currentUsage.maxConversations) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

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

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Gratuit pour toujours • Aucune carte de crédit requise
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthIncentiveModal;
