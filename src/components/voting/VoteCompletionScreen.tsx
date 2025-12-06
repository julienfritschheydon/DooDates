import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface VoteCompletionScreenProps {
  voterName?: string;
  onBack: () => void;
  onViewResults?: () => void;
  title?: string;
  subtitle?: string;
  color?: "green" | "blue" | "violet" | "emerald";
}

const VoteCompletionScreen: React.FC<VoteCompletionScreenProps> = ({
  voterName = "Participant",
  onBack,
  onViewResults,
  title = "Vote enregistré !",
  subtitle,
  color = "green",
}) => {
  const colorMap = {
    green: {
      bg: "bg-green-100 dark:bg-green-900/20",
      text: "text-green-600 dark:text-green-500",
      button: "bg-green-600 hover:bg-green-700",
      alertBg: "bg-green-50 dark:bg-green-900/10",
      alertBorder: "border-green-200 dark:border-green-900/30",
      alertText: "text-green-700 dark:text-green-400",
      alertTextLight: "text-green-600 dark:text-green-300",
      outlineButton:
        "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700",
      alertBg: "bg-blue-50 dark:bg-blue-900/10",
      alertBorder: "border-blue-200 dark:border-blue-900/30",
      alertText: "text-blue-700 dark:text-blue-400",
      alertTextLight: "text-blue-600 dark:text-blue-300",
      outlineButton:
        "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    },
    violet: {
      bg: "bg-violet-100 dark:bg-violet-900/20",
      text: "text-violet-600 dark:text-violet-400",
      button: "bg-violet-600 hover:bg-violet-700",
      alertBg: "bg-violet-50 dark:bg-violet-900/10",
      alertBorder: "border-violet-200 dark:border-violet-900/30",
      alertText: "text-violet-700 dark:text-violet-400",
      alertTextLight: "text-violet-600 dark:text-violet-300",
      outlineButton:
        "text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20",
    },
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-900/20",
      text: "text-emerald-600 dark:text-emerald-500",
      button: "bg-emerald-600 hover:bg-emerald-700",
      alertBg: "bg-emerald-50 dark:bg-emerald-900/10",
      alertBorder: "border-emerald-200 dark:border-emerald-900/30",
      alertText: "text-emerald-700 dark:text-emerald-400",
      alertTextLight: "text-emerald-600 dark:text-emerald-300",
      outlineButton:
        "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    },
  };

  const theme = colorMap[color];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center w-full max-w-md"
        >
          <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`w-20 h-20 ${theme.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              <Check className={`w-10 h-10 ${theme.text}`} />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {subtitle ||
                `Merci ${voterName} pour votre participation. Votre vote a bien été pris en compte.`}
            </p>

            {/* Message d'information pour la bêta */}
            <div
              className={`mb-8 p-4 ${theme.alertBg} border ${theme.alertBorder} rounded-lg text-left`}
            >
              <div className={`flex items-center gap-2 ${theme.alertText}`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Information bêta</span>
              </div>
              <p className={`text-sm ${theme.alertTextLight} mt-1`}>
                Pour finaliser et partager votre sondage, après la bêta, vous devrez vous connecter
                ou créer un compte.
              </p>
            </div>

            <div className="flex flex-col gap-3 items-center">
              {onViewResults && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onViewResults}
                  className={`bg-white dark:bg-transparent font-medium py-3 px-6 rounded-xl w-full transition-colors border ${theme.outlineButton}`}
                >
                  Voir les résultats
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className={`${
                  onViewResults ? `${theme.button} text-white` : `${theme.button} text-white`
                } font-medium py-3 px-6 rounded-xl w-full transition-colors shadow-sm`}
              >
                Retour à l'accueil
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoteCompletionScreen;
