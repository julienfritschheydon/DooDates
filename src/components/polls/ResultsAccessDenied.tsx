import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResultsAccessDeniedProps {
  message: string;
  pollSlug?: string;
  showVoteButton?: boolean;
}

export function ResultsAccessDenied({ message, pollSlug, showVoteButton = false }: ResultsAccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[#1e1e1e] rounded-lg border border-gray-800 p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-2">
            Accès restreint
          </h2>

          {/* Message */}
          <p className="text-gray-400 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {showVoteButton && pollSlug && (
              <button
                onClick={() => navigate(`/poll/${pollSlug}`)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Voter maintenant
              </button>
            )}
            
            <button
              onClick={() => navigate(-1)}
              className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
