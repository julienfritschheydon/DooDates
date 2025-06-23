import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Mail, Loader2 } from 'lucide-react';

interface VoteActionsProps {
  voterInfo: { name: string; email: string };
  onVoterInfoChange: (info: { name: string; email: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasVotes: boolean;
}

export const VoteActions: React.FC<VoteActionsProps> = ({
  voterInfo,
  onVoterInfoChange,
  onSubmit,
  isSubmitting,
  hasVotes
}) => {
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {};
    
    if (!voterInfo.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (!voterInfo.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterInfo.email)) {
      newErrors.email = 'Email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!hasVotes) {
      setShowForm(true);
      return;
    }
    
    if (!showForm) {
      setShowForm(true);
      return;
    }
    
    if (validateForm()) {
      onSubmit();
    }
  };

  const isFormValid = voterInfo.name.trim() && voterInfo.email.trim() && hasVotes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Formulaire votant */}
      <motion.div
        initial={false}
        animate={{ 
          height: showForm ? 'auto' : 0,
          opacity: showForm ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Vos informations</h3>
          </div>

          <div className="space-y-3">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={voterInfo.name}
                  onChange={(e) => onVoterInfoChange({ ...voterInfo, name: e.target.value })}
                  placeholder="Votre nom"
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-colors text-sm
                    ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}
                  `}
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={voterInfo.email}
                  onChange={(e) => onVoterInfoChange({ ...voterInfo, email: e.target.value })}
                  placeholder="votre@email.com"
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-colors text-sm
                    ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}
                  `}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p>
              🔒 Vos informations sont utilisées uniquement pour identifier votre vote 
              et vous permettre de le modifier ultérieurement.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bouton de soumission */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isSubmitting || (showForm && !isFormValid)}
        className={`
          w-full py-4 px-6 rounded-2xl font-semibold text-white
          flex items-center justify-center gap-3 transition-all duration-200
          ${isFormValid && showForm
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg'
            : hasVotes
            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
          }
          ${isSubmitting ? 'opacity-80' : ''}
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Enregistrement...</span>
          </>
        ) : showForm && isFormValid ? (
          <>
            <Send className="h-5 w-5" />
            <span>Enregistrer mon vote</span>
          </>
        ) : hasVotes ? (
          <>
            <Send className="h-5 w-5" />
            <span>Continuer</span>
          </>
        ) : (
          <>
            <span>Sélectionnez au moins une option</span>
          </>
        )}
      </motion.button>

      {/* Indicateur de progression */}
      {hasVotes && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Réponses sélectionnées</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 