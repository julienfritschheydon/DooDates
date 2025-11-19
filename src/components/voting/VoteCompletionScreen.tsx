import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface VoteCompletionScreenProps {
  voterName?: string;
  onBack: () => void;
  onViewResults?: () => void;
  title?: string;
  subtitle?: string;
}

const VoteCompletionScreen: React.FC<VoteCompletionScreenProps> = ({
  voterName = "Participant",
  onBack,
  onViewResults,
  title = "Vote enregistré !",
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="opacity-90 mb-6">
            {subtitle ||
              `Merci ${voterName} pour votre participation. Votre vote a bien été pris en compte.`}
          </p>

          {/* Message d'information pour la bêta */}
          <div className="mb-6 p-4 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/90">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Information bêta</span>
            </div>
            <p className="text-sm text-white/80 mt-1">
              Pour finaliser et partager votre sondage, après la bêta, vous devrez vous connecter ou
              créer un compte.
            </p>
          </div>

          <div className="flex flex-col gap-3 items-center">
            {onViewResults && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onViewResults}
                className="bg-white text-green-600 font-medium py-3 px-6 rounded-full shadow-lg w-full max-w-xs hover:bg-green-50 transition-colors"
              >
                Voir les résultats
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className={`${onViewResults
                ? "bg-green-700/30 text-white hover:bg-green-700/40"
                : "bg-white text-green-600 hover:bg-green-50"
                } font-medium py-3 px-6 rounded-full shadow-lg w-full max-w-xs transition-colors`}
            >
              Retour à l'accueil
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoteCompletionScreen;
