import React, { useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { VoterInfo, FormErrors, SwipeOption, VoteType } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { triggerHaptic } from "./utils/voteUtils";
import VoteSummary from "./VoteSummary"; // Importer le composant VoteSummary
import { logger } from "@/lib/logger";

interface VoterFormProps {
  options: SwipeOption[];
  votes: Record<string, VoteType>;
  userHasVoted: Record<string, boolean>;
  onBack: () => void;
  onCancel?: () => void;
  onSubmit: (voterInfo: VoterInfo) => Promise<void>;
  isSubmitting: boolean;
  getVoteText: (vote: VoteType) => string;
  setVoterInfo?: (info: VoterInfo) => void;
  voterInfo?: VoterInfo;
  formErrors?: Record<string, string>;
}

export const VoterForm: React.FC<VoterFormProps> = ({
  options,
  votes,
  userHasVoted,
  onBack,
  onCancel,
  onSubmit,
  isSubmitting,
  getVoteText,
  setVoterInfo,
  voterInfo,
  formErrors,
}) => {
  // État local pour les informations de l'utilisateur
  const [localVoterInfo, setLocalVoterInfo] = useState<VoterInfo>(
    voterInfo || { name: "", email: "" },
  );
  const [localFormErrors, setLocalFormErrors] = useState<FormErrors>({});

  // Refs pour la gestion du focus sur la première erreur
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // État pour la case à cocher "Recevoir par email"
  const [wantToReceiveEmail, setWantToReceiveEmail] = useState<boolean>(false);

  // Validation du formulaire
  const validateForm = () => {
    const errors: { name?: string; email?: string } = {};

    // Validation du nom
    if (!localVoterInfo.name.trim()) {
      errors.name = "Le nom est obligatoire";
    } else if (localVoterInfo.name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
    }

    // Validation de l'email seulement si l'utilisateur veut recevoir par email
    if (wantToReceiveEmail) {
      if (!localVoterInfo.email.trim()) {
        errors.email = "L'email est obligatoire pour recevoir votre vote";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(localVoterInfo.email.trim())) {
          errors.email = "Veuillez saisir un email valide";
        }
      }
    }

    setLocalFormErrors(errors);
    // Déplacer le focus vers le premier champ en erreur pour l'accessibilité
    if (errors.name) {
      nameInputRef.current?.focus();
    } else if (errors.email) {
      emailInputRef.current?.focus();
    }
    return Object.keys(errors).length === 0;
  };

  // Nettoyer les erreurs quand l'utilisateur tape
  const handleNameChange = (value: string) => {
    const updatedInfo = { ...localVoterInfo, name: value };
    setLocalVoterInfo(updatedInfo);
    // Mettre à jour les informations dans le service parent
    if (setVoterInfo) {
      setVoterInfo(updatedInfo);
    }
    if (localFormErrors.name && value.trim().length >= 2) {
      setLocalFormErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleEmailChange = (value: string) => {
    const updatedInfo = { ...localVoterInfo, email: value };
    setLocalVoterInfo(updatedInfo);
    // Mettre à jour les informations dans le service parent
    if (setVoterInfo) {
      setVoterInfo(updatedInfo);
    }
    if (localFormErrors.email && value.includes("@") && value.includes(".")) {
      setLocalFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async () => {
    // Validation avant soumission
    if (!validateForm()) {
      triggerHaptic("heavy");
      return;
    }

    setLocalFormErrors({});

    // Mettre à jour les informations dans le service parent une dernière fois
    if (setVoterInfo) {
      setVoterInfo(localVoterInfo);
    }

    try {
      logger.debug("VoterForm - Soumission", "vote", {
        voterName: localVoterInfo.name,
      });
      await onSubmit(localVoterInfo);
    } catch (error) {
      logger.error("Erreur lors de la soumission", "vote", error);
      setLocalFormErrors({
        general: "Une erreur est survenue. Veuillez réessayer.",
      });
      triggerHaptic("heavy");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl"
        >
          {/* Zone live pour annoncer les erreurs aux technologies d'assistance */}
          <div
            className="sr-only"
            aria-live="polite"
            id="voter-form-live-region"
          >
            {localFormErrors.general ||
              localFormErrors.name ||
              localFormErrors.email ||
              ""}
          </div>
          {/* Header avec bouton retour */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              Finaliser mon vote
            </h2>
            <div className="w-10 h-10"></div> {/* Spacer pour centrage */}
          </div>

          {/* Résumé des votes */}
          <VoteSummary
            options={options}
            votes={votes}
            userHasVoted={userHasVoted}
            getVoteText={getVoteText}
          />

          {/* Formulaire */}
          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Votre nom *
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ex: Marie Dupont"
                value={localVoterInfo.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full p-4 border rounded-2xl text-lg transition-all ${
                  localFormErrors.name
                    ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
                autoComplete="name"
                disabled={isSubmitting}
                data-testid="voter-name"
                aria-invalid={localFormErrors.name ? true : undefined}
                aria-describedby={
                  localFormErrors.name ? "name-error" : undefined
                }
                ref={nameInputRef}
              />
              {localFormErrors.name && (
                <p className="text-red-500 text-sm mt-1" id="name-error">
                  {localFormErrors.name}
                </p>
              )}
            </div>

            <div className="flex items-center mb-4">
              <input
                id="receive-email"
                type="checkbox"
                checked={wantToReceiveEmail}
                onChange={(e) => setWantToReceiveEmail(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label
                htmlFor="receive-email"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Je souhaite recevoir mon vote par email
              </label>
            </div>

            {wantToReceiveEmail && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Votre email *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="marie@exemple.com"
                  value={localVoterInfo.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full p-4 border rounded-2xl text-lg transition-all ${
                    localFormErrors.email
                      ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={localFormErrors.email ? true : undefined}
                  aria-describedby={
                    localFormErrors.email ? "email-error" : undefined
                  }
                  ref={emailInputRef}
                />
                {localFormErrors.email && (
                  <p className="text-red-500 text-sm mt-1" id="email-error">
                    {localFormErrors.email}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Validation et soumission */}
          <div className="space-y-3">
            {localFormErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm text-center">
                  {localFormErrors.general}
                </p>
              </div>
            )}

            {formErrors?.submit && formErrors.submit.includes("409") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <p className="text-amber-700 text-sm text-center">
                  Vous avez déjà voté pour ce sondage avec cet email.
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              } text-white`}
              data-testid="submit-votes"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer mes votes"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoterForm;
