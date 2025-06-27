import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface VoteCompletionScreenProps {
  voterName?: string;
  onBack: () => void;
}

const VoteCompletionScreen: React.FC<VoteCompletionScreenProps> = ({
  voterName = "Participant",
  onBack,
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
          <h2 className="text-2xl font-bold mb-2">Vote enregistré !</h2>
          <p className="opacity-90 mb-6">
            Merci {voterName} pour votre participation. Votre vote a bien été
            pris en compte.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="bg-white text-green-600 font-medium py-3 px-6 rounded-full shadow-lg"
          >
            Terminer
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default VoteCompletionScreen;
