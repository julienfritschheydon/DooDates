import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, Clock, Trophy, Share2 } from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description?: string;
  status: string;
  creator_id: string;
  created_at: string;
}

interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{
    hour: number;
    minute: number;
    duration?: number;
  }>;
  display_order: number;
}

interface Vote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, 'yes' | 'no' | 'maybe'>;
  created_at: string;
}

interface VoteResultsProps {
  poll: Poll;
  options: PollOption[];
  votes: Vote[];
  onBack: () => void;
}

const ResultBar: React.FC<{
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, count, total, color, icon }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 min-w-[100px]">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
      <div className="min-w-[60px] text-right">
        <span className="text-sm font-semibold text-gray-800">{count}</span>
        <span className="text-xs text-gray-500 ml-1">
          ({percentage.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
};

const OptionResult: React.FC<{
  option: PollOption;
  votes: Vote[];
  rank: number;
}> = ({ option, votes, rank }) => {
  // Calculer les statistiques pour cette option
  const voteCounts = { yes: 0, no: 0, maybe: 0 };
  const voterNames: string[] = [];

  votes.forEach(vote => {
    const selection = vote.selections[option.id];
    if (selection && voteCounts.hasOwnProperty(selection)) {
      voteCounts[selection]++;
      if (selection === 'yes') {
        voterNames.push(vote.voter_name);
      }
    }
  });

  const totalResponses = voteCounts.yes + voteCounts.no + voteCounts.maybe;
  const score = voteCounts.yes - (voteCounts.no * 0.5); // Score pondéré

  // Format de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Format des créneaux horaires
  const formatTimeSlots = (timeSlots: Array<{ hour: number; minute: number; duration?: number }>) => {
    if (!timeSlots || timeSlots.length === 0) return 'Toute la journée';
    
    return timeSlots.map(slot => {
      const start = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
      if (slot.duration) {
        const endHour = Math.floor((slot.hour * 60 + slot.minute + slot.duration) / 60);
        const endMinute = (slot.hour * 60 + slot.minute + slot.duration) % 60;
        const end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        return `${start}-${end}`;
      }
      return start;
    }).join(', ');
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-800';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
      case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-blue-100';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className="h-4 w-4" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-4">
        {/* En-tête avec rang */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankColor(rank)}`}>
              {getRankIcon(rank) || rank}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 capitalize">
                {formatDate(option.option_date)}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTimeSlots(option.time_slots)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">{voteCounts.yes}</div>
            <div className="text-xs text-gray-500">
              {totalResponses} réponse{totalResponses !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Barres de résultats */}
        <div className="space-y-2 mb-4">
          <ResultBar
            label="Oui"
            count={voteCounts.yes}
            total={totalResponses}
            color="bg-green-500"
            icon={<div className="w-3 h-3 bg-green-500 rounded-full" />}
          />
          <ResultBar
            label="Peut-être"
            count={voteCounts.maybe}
            total={totalResponses}
            color="bg-orange-500"
            icon={<div className="w-3 h-3 bg-orange-500 rounded-full" />}
          />
          <ResultBar
            label="Non"
            count={voteCounts.no}
            total={totalResponses}
            color="bg-red-500"
            icon={<div className="w-3 h-3 bg-red-500 rounded-full" />}
          />
        </div>

        {/* Liste des participants disponibles */}
        {voterNames.length > 0 && (
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-xs font-medium text-green-800 mb-1">
              Participants disponibles :
            </div>
            <div className="flex flex-wrap gap-1">
              {voterNames.map((name, index) => (
                <span
                  key={index}
                  className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const VoteResults: React.FC<VoteResultsProps> = ({
  poll,
  options,
  votes,
  onBack
}) => {
  // Calculer le classement des options
  const optionsWithStats = options.map(option => {
    const voteCounts = { yes: 0, no: 0, maybe: 0 };
    votes.forEach(vote => {
      const selection = vote.selections[option.id];
      if (selection && voteCounts.hasOwnProperty(selection)) {
        voteCounts[selection]++;
      }
    });

    const score = voteCounts.yes - (voteCounts.no * 0.5);
    return {
      ...option,
      voteCounts,
      score,
      totalResponses: voteCounts.yes + voteCounts.no + voteCounts.maybe
    };
  });

  // Trier par score décroissant
  const sortedOptions = [...optionsWithStats].sort((a, b) => b.score - a.score);

  const totalVotes = votes.length;
  const bestOption = sortedOptions[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Résultats: ${poll.title}`,
          text: `Découvrez les résultats du sondage "${poll.title}"`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier le lien
      navigator.clipboard.writeText(window.location.href);
      // Vous pourriez ajouter une notification toast ici
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 space-y-6"
    >
      {/* En-tête des résultats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          
          <h1 className="text-lg font-bold text-gray-800 text-center flex-1">
            Résultats
          </h1>

          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Share2 className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
            <div className="text-xs text-gray-500">
              Participant{totalVotes !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bestOption?.voteCounts.yes || 0}
            </div>
            <div className="text-xs text-gray-500">Meilleur score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{options.length}</div>
            <div className="text-xs text-gray-500">
              Option{options.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Meilleure option */}
        {bestOption && bestOption.voteCounts.yes > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Créneau gagnant</span>
            </div>
            <div className="text-sm opacity-90">
              {new Date(bestOption.option_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Liste des résultats */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Classement des options
        </h2>
        
        {sortedOptions.map((option, index) => (
          <OptionResult
            key={option.id}
            option={option}
            votes={votes}
            rank={index + 1}
          />
        ))}
      </div>

      {/* Message si aucun vote */}
      {totalVotes === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Aucun vote pour le moment
          </h3>
          <p className="text-gray-500">
            Partagez le lien du sondage pour collecter des réponses !
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}; 