// import React, { useState, useRef } from 'react';
// import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
// import { ChevronLeft, TrendingUp, Users, Check, X, HelpCircle, ArrowUp, Star, ArrowRight, ArrowLeft } from 'lucide-react';

// // Types pour la démo
// interface SwipeVote {
//   id: string;
//   poll_id: string;
//   voter_email: string;
//   voter_name: string;
//   selections: Record<string, 'yes' | 'no' | 'maybe'>;
//   created_at: string;
// }

// interface SwipeOption {
//   id: string;
//   poll_id: string;
//   option_date: string;
//   time_slots: Array<{
//     hour: number;
//     minute: number;
//     duration?: number;
//   }>;
//   display_order: number;
// }

// // Mock data avec poll info
// const mockPoll = {
//   id: 'demo-poll-1',
//   title: 'Réunion d\'équipe - Janvier 2025',
//   //   description: 'Swipez les options ! 👆',
//   description: '',
//   status: 'active',
//   creator_id: 'demo-user',
//   created_at: new Date().toISOString(),
//   expires_at: '2025-02-15T23:59:59Z' // Date limite
// };

// const swipeOptions: SwipeOption[] = [
//   {
//     id: 'opt-1',
//     poll_id: 'demo-poll-1',
//     option_date: '2025-01-30',
//     time_slots: [{ hour: 9, minute: 0, duration: 120 }],
//     display_order: 1
//   },
//   {
//     id: 'opt-2',
//     poll_id: 'demo-poll-1',
//     option_date: '2025-01-30',
//     time_slots: [{ hour: 14, minute: 0, duration: 120 }],
//     display_order: 2
//   },
//   {
//     id: 'opt-3',
//     poll_id: 'demo-poll-1',
//     option_date: '2025-01-31',
//     time_slots: [{ hour: 10, minute: 0, duration: 120 }],
//     display_order: 3
//   },
//   {
//     id: 'opt-4',
//     poll_id: 'demo-poll-1',
//     option_date: '2025-02-03',
//     time_slots: [{ hour: 9, minute: 0, duration: 120 }],
//     display_order: 4
//   }
// ];

// const swipeVotes: SwipeVote[] = [
//   {
//     id: 'vote-1',
//     poll_id: 'demo-poll-1',
//     voter_email: 'alice@company.com',
//     voter_name: 'Alice M.',
//     selections: { 'opt-1': 'yes', 'opt-2': 'maybe', 'opt-3': 'no', 'opt-4': 'yes' },
//     created_at: new Date().toISOString()
//   },
//   {
//     id: 'vote-2',
//     poll_id: 'demo-poll-1',
//     voter_email: 'bob@company.com',
//     voter_name: 'Bob D.',
//     selections: { 'opt-1': 'yes', 'opt-2': 'no', 'opt-3': 'maybe', 'opt-4': 'yes' },
//     created_at: new Date().toISOString()
//   },
//   {
//     id: 'vote-3',
//     poll_id: 'demo-poll-1',
//     voter_email: 'carol@company.com',
//     voter_name: 'Carol L.',
//     selections: { 'opt-1': 'maybe', 'opt-2': 'yes', 'opt-3': 'yes', 'opt-4': 'no' },
//     created_at: new Date().toISOString()
//   },
//   {
//     id: 'vote-4',
//     poll_id: 'demo-poll-1',
//     voter_email: 'david@company.com',
//     voter_name: 'David R.',
//     selections: { 'opt-1': 'yes', 'opt-2': 'yes', 'opt-3': 'maybe', 'opt-4': 'yes' },
//     created_at: new Date().toISOString()
//   },
//   {
//     id: 'vote-5',
//     poll_id: 'demo-poll-1',
//     voter_email: 'emma@company.com',
//     voter_name: 'Emma T.',
//     selections: { 'opt-1': 'yes', 'opt-2': 'no', 'opt-3': 'yes', 'opt-4': 'maybe' },
//     created_at: new Date().toISOString()
//   }
// ];

// interface VotingSwipeProps {
//   onBack?: () => void;
// }

// export const VotingSwipe: React.FC<VotingSwipeProps> = ({ onBack }) => {
//   console.log('🚀 VotingSwipe component loaded');

//   // État local pour les votes (tous initialisés à "maybe")
//   const [votes, setVotes] = useState<Record<string, 'yes' | 'no' | 'maybe'>>(() => {
//     const initialVotes: Record<string, 'yes' | 'no' | 'maybe'> = {};
//     swipeOptions.forEach(option => {
//       initialVotes[option.id] = 'maybe';
//     });
//     return initialVotes;
//   });

//   // État pour tracker les votes explicites
//   const [userHasVoted, setUserHasVoted] = useState<Record<string, boolean>>(() => {
//     const initialHasVoted: Record<string, boolean> = {};
//     swipeOptions.forEach(option => {
//       initialHasVoted[option.id] = false;
//     });
//     return initialHasVoted;
//   });

//   const [showForm, setShowForm] = useState(false);
//   const [voterInfo, setVoterInfo] = useState({ name: '', email: '' });
//   const [isComplete, setIsComplete] = useState(false);
//   const [currentSwipe, setCurrentSwipe] = useState<Record<string, 'yes' | 'no' | 'maybe' | null>>({});

//   // États pour le formulaire
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; general?: string }>({});

//   // Haptic feedback
//   const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
//     if (navigator.vibrate) {
//       const patterns = { light: [10], medium: [30], heavy: [50] };
//       navigator.vibrate(patterns[type]);
//     }
//   };

//   // Validation du formulaire
//   const validateForm = () => {
//     const errors: { name?: string; email?: string } = {};

//     // Validation du nom
//     if (!voterInfo.name.trim()) {
//       errors.name = 'Le nom est obligatoire';
//     } else if (voterInfo.name.trim().length < 2) {
//       errors.name = 'Le nom doit contenir au moins 2 caractères';
//     }

//     // Validation de l'email
//     if (!voterInfo.email.trim()) {
//       errors.email = 'L\'email est obligatoire';
//     } else {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(voterInfo.email.trim())) {
//         errors.email = 'Veuillez saisir un email valide';
//       }
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // Nettoyer les erreurs quand l'utilisateur tape
//   const handleNameChange = (value: string) => {
//     setVoterInfo(prev => ({ ...prev, name: value }));
//     if (formErrors.name && value.trim().length >= 2) {
//       setFormErrors(prev => ({ ...prev, name: undefined }));
//     }
//   };

//   const handleEmailChange = (value: string) => {
//     setVoterInfo(prev => ({ ...prev, email: value }));
//     if (formErrors.email && value.includes('@') && value.includes('.')) {
//       setFormErrors(prev => ({ ...prev, email: undefined }));
//     }
//   };

//   // Formater la date de façon ultra-simple (éviter les décalages timezone)
//   const formatDate = (dateString: string) => {
//     // Parser la date en mode local pour éviter les décalages timezone
//     const [year, month, day] = dateString.split('-').map(Number);
//     const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     // Comparer uniquement les dates sans les heures
//     const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
//     const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//     const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

//     if (dateOnly.getTime() === todayOnly.getTime()) return 'Aujourd\'hui';
//     if (dateOnly.getTime() === tomorrowOnly.getTime()) return 'Demain';

//     return date.toLocaleDateString('fr-FR', {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'short'
//     });
//   };

//   // Formater l'heure de façon simple
//   const formatTime = (timeSlots: Array<{ hour: number; minute: number; duration?: number }>) => {
//     if (!timeSlots?.length) return 'Toute la journée';
//     const slot = timeSlots[0];
//     const start = `${slot.hour}h${slot.minute ? slot.minute.toString().padStart(2, '0') : ''}`;
//     if (slot.duration) {
//       const endHour = Math.floor((slot.hour * 60 + (slot.minute || 0) + slot.duration) / 60);
//       const endMinute = (slot.hour * 60 + (slot.minute || 0) + slot.duration) % 60;
//       const end = `${endHour}h${endMinute ? endMinute.toString().padStart(2, '0') : ''}`;
//       return `${start} - ${end}`;
//     }
//     return start;
//   };

//   // Calculer les stats pour l'option actuelle (SANS le vote utilisateur pour les barres de fond)
//   const getExistingStats = (optionId: string) => {
//     const counts = { yes: 0, no: 0, maybe: 0 };
//     swipeVotes.forEach(vote => {
//       const selection = vote.selections[optionId];
//       if (selection) counts[selection]++;
//     });
//     return counts;
//   };

//   // Calculer les stats incluant le vote utilisateur (pour les barres de surbrillance)
//   const getStatsWithUser = (optionId: string) => {
//     const counts = getExistingStats(optionId);

//     // Ajouter le vote utilisateur s'il a explicitement voté
//     if (userHasVoted[optionId]) {
//       const userVote = votes[optionId];
//       if (userVote) {
//         counts[userVote]++;
//       }
//     }

//     return counts;
//   };

//   // Calculer le ranking des options (1er, 2ème, etc.)
//   const getRanking = () => {
//     const optionsWithScores = swipeOptions.map(option => {
//       const stats = getStatsWithUser(option.id);
//       // Score : Oui = 2 points, Peut-être = 1 point, Non = 0 point
//       const score = stats.yes * 2 + stats.maybe * 1;
//       return { ...option, score, stats };
//     });

//     // Trier par score décroissant
//     optionsWithScores.sort((a, b) => b.score - a.score);

//     // Assigner les rangs (gérer les égalités)
//     const ranking: Record<string, number> = {};
//     let currentRank = 1;

//     optionsWithScores.forEach((option, index) => {
//       if (index > 0 && option.score < optionsWithScores[index - 1].score) {
//         currentRank = index + 1;
//       }
//       ranking[option.id] = currentRank;
//     });

//     return ranking;
//   };

//   // Gérer le swipe sur les lignes
//     const handleOptionDragEnd = (event: any, info: PanInfo, optionId: string) => {
//     const threshold = 50;
//     const { offset } = info;

//     let decision: 'yes' | 'no' | null = null;

//     // Seul le swipe horizontal est autorisé - SWIPES INVERSÉS
//     if (Math.abs(offset.x) > threshold) {
//       decision = offset.x < 0 ? 'yes' : 'no';  // INVERSÉ: gauche = yes, droite = no
//       triggerHaptic('medium');
//       handleVote(decision, optionId);
//     }

//     // La ligne revient automatiquement grâce à dragElastic
//   };

//   // Enregistrer le vote (marquer comme explicite)
//   const handleVote = (decision: 'yes' | 'no' | 'maybe', optionId: string) => {
//     // Feedback tactile unique pour chaque vote
//     if (navigator.vibrate) {
//       const vibrations = { yes: 100, maybe: 50, no: 200 };
//       navigator.vibrate(vibrations[decision]);
//     }

//     setVotes(prev => ({
//       ...prev,
//       [optionId]: decision
//     }));

//     // Marquer comme vote explicite
//     setUserHasVoted(prev => {
//       const newState = {
//         ...prev,
//         [optionId]: true
//       };
//       console.log('Vote enregistré pour', optionId, '- userHasVoted:', newState);
//       return newState;
//     });
//   };

//   // Finaliser le vote
//   const handleSubmit = async () => {
//     // Validation avant soumission
//     if (!validateForm()) {
//       triggerHaptic('heavy');
//       return;
//     }

//     setIsSubmitting(true);
//     setFormErrors({});

//     try {
//       // Simulation d'appel API
//       await new Promise(resolve => setTimeout(resolve, 1500));

//       // Ici on ferait l'appel réel à Supabase
//       // const { error } = await supabase.from('votes').insert({...});

//       triggerHaptic('heavy');
//       setIsComplete(true);
//     } catch (error) {
//       console.error('Erreur lors de la soumission:', error);
//       setFormErrors({
//         general: 'Une erreur est survenue. Veuillez réessayer.'
//       });
//       triggerHaptic('heavy');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Calculer le ranking pour afficher les étoiles
//   const ranking = getRanking();

//   if (isComplete) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-4">
//         <motion.div
//           initial={{ scale: 0, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           className="text-center text-white"
//         >
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ delay: 0.2 }}
//             className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
//           >
//             <Check className="w-10 h-10 text-green-500" />
//           </motion.div>
//           <h2 className="text-2xl font-bold mb-2">Vote enregistré !</h2>
//           <p className="opacity-90 mb-6">Merci {voterInfo.name} pour votre participation</p>
//           <button
//             onClick={onBack}
//             className="bg-white text-green-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
//            data-testid="ex-votingswipe--voir-les-rsultats">
//             Voir les résultats
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   if (showForm) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <motion.div
//           initial={{ opacity: 0, y: 50 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl"
//         >
//           {/* Header avec bouton retour */}
//           <div className="flex items-center justify-between mb-6">
//             <button
//               onClick={() => setShowForm(false)}
//               className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
//              data-testid="ex-votingswipe-button">
//               <ChevronLeft className="w-5 h-5" />
//             </button>
//             <h2 className="text-xl font-bold text-gray-800">
//               Finaliser mon vote
//             </h2>
//             <div className="w-10 h-10"></div> {/* Spacer pour centrage */}
//           </div>

//           {/* Résumé des votes */}
//           <div className="bg-gray-50 rounded-2xl p-4 mb-6">
//             <h3 className="font-semibold text-gray-700 mb-3">Résumé de mes votes :</h3>
//             <div className="space-y-2 text-sm">
//               {swipeOptions.map(option => {
//                 const vote = votes[option.id];
//                 const hasVoted = userHasVoted[option.id];
//                 const voteLabel = vote === 'yes' ? '✅ Oui' : vote === 'no' ? '❌ Non' : '🤔 Peut-être';
//                 const voteColor = vote === 'yes' ? 'text-green-600' : vote === 'no' ? 'text-red-600' : 'text-orange-600';

//                 return (
//                   <div key={option.id} className="flex justify-between items-center">
//                     <span className="text-gray-600">
//                       {formatDate(option.option_date)} • {formatTime(option.time_slots)}
//                     </span>
//                     <span className={`font-medium ${hasVoted ? voteColor : 'text-gray-400'}`}>
//                       {hasVoted ? voteLabel : '🤔 Peut-être'}
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//                      {/* Formulaire */}
//            <div className="space-y-4 mb-6">
//              <div>
//                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
//                  Votre nom *
//                </label>
//                <input
//                  id="name"
//                  type="text"
//                  placeholder="Ex: Marie Dupont"
//                  value={voterInfo.name}
//                  onChange={(e) => handleNameChange(e.target.value)}
//                  className={`w-full p-4 border rounded-2xl text-lg transition-all ${
//                    formErrors.name
//                      ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
//                      : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
//                  }`}
//                  autoComplete="name"
//                  disabled={isSubmitting}
//                />
//                {formErrors.name && (
//                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
//                )}
//              </div>

//              <div>
//                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                  Votre email *
//                </label>
//                <input
//                  id="email"
//                  type="email"
//                  placeholder="marie@exemple.com"
//                  value={voterInfo.email}
//                  onChange={(e) => handleEmailChange(e.target.value)}
//                  className={`w-full p-4 border rounded-2xl text-lg transition-all ${
//                    formErrors.email
//                      ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
//                      : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
//                  }`}
//                  autoComplete="email"
//                  disabled={isSubmitting}
//                />
//                {formErrors.email && (
//                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
//                )}
//              </div>
//            </div>

//                      {/* Validation et soumission */}
//            <div className="space-y-3">
//              {formErrors.general && (
//                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
//                  <p className="text-red-600 text-sm text-center">{formErrors.general}</p>
//                </div>
//              )}

//              {(!voterInfo.name.trim() || !voterInfo.email.trim()) && !formErrors.general && (
//                <p className="text-sm text-gray-500 text-center">
//                  Veuillez remplir tous les champs obligatoires (*)
//                </p>
//              )}

//              <button
//                onClick={handleSubmit}
//                disabled={!voterInfo.name.trim() || !voterInfo.email.trim() || isSubmitting}
//                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
//               data-testid="ex-votingswipe-button">
//                {isSubmitting ? (
//                  <>
//                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                    Enregistrement...
//                  </>
//                ) : (
//                  <>🗳️ Enregistrer mes votes</>
//                )}
//              </button>

//              <p className="text-xs text-gray-400 text-center">
//                Vos informations restent privées et ne seront utilisées que pour ce sondage
//              </p>
//            </div>
//         </motion.div>
//       </div>
//     );
//   }

//   // Formater la date d'expiration
//   const formatExpiryDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('fr-FR', {
//       day: 'numeric',
//       month: 'long'
//     });
//   };

//   // Compter le total des participants uniques
//   const totalParticipants = swipeVotes.length;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header compact */}
//       <div className="p-4 relative bg-white border-b">
//         <button
//           onClick={onBack}
//           className="absolute top-4 left-4 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
//          data-testid="ex-votingswipe-button">
//           <ChevronLeft className="w-4 h-4" />
//         </button>

//         {/* Titre et description sur une ligne sur mobile */}
//         <div className="text-center px-12">
//           <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
//             {mockPoll.title}
//           </h1>
//           <p className="text-gray-600 text-sm mt-1">{mockPoll.description}</p>
//         </div>

//         {/* Badges info compacts */}
//         <div className="flex justify-center gap-2 sm:gap-4 mt-4 mb-4">
//           <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center gap-1.5">
//             <Users className="w-3 h-3 text-blue-600" />
//             <span className="text-blue-800 font-medium text-sm">{totalParticipants}</span>
//             <span className="text-blue-600 text-xs hidden sm:inline">participants</span>
//           </div>

//           <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 flex items-center gap-1.5">
//             <div className="w-3 h-3 rounded-full bg-orange-500"></div>
//             <span className="text-orange-600 text-xs hidden sm:inline">Expire le</span>
//             <span className="text-orange-800 font-medium text-sm">{formatExpiryDate(mockPoll.expires_at)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Liste swipable des options */}
//       <div className="px-6 space-y-3 py-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">Options disponibles</h3>
//           <div className="text-sm text-gray-500">Swipez pour voter</div>
//         </div>
//         {swipeOptions.map((option, index) => {
//           const optionStats = getStatsWithUser(option.id);
//           const userVote = votes[option.id];
//           const rank = ranking[option.id];

//           // Debug pour la première ligne
//           if (index === 0) {
//             console.log('Première ligne - userHasVoted:', userHasVoted[option.id], 'optionId:', option.id);
//             console.log('Condition flèches:', index === 0 && !userHasVoted[option.id]);
//           }

//           // Badge pour le 1er : plus visible qu'une bordure
//           const getRankingBadge = (rank: number) => {
//             if (rank === 1) {
//               return (
//                 <div className="absolute top-3 left-3 z-30 bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg border-2 border-white">
//                   1er
//                 </div>
//               );
//             }
//             return null;
//           };

//           return (
//             <motion.div
//               key={option.id}
//               drag="x"
//               dragConstraints={{ left: -30, right: 30 }}
//               dragElastic={0.3}
//               dragMomentum={false}
//               dragSnapToOrigin  // Force le retour au centre après swipe
//               initial={{ opacity: 0, x: -20 }}
//               animate={{
//                 opacity: 1,
//                 x: 0 // Ligne statique, plus d'animation
//               }}
//               transition={{
//                 backgroundColor: { duration: 0.3 }
//               }}
//               className="bg-white rounded-xl p-4 border border-gray-200 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm hover:shadow-md relative"
//               whileDrag={{
//                 scale: 1.02,
//                 rotate: 1,
//                 boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
//               }}
//               whileHover={{ scale: 1.01 }}
//               onDrag={(event, info) => {
//                 // Effet de coloration graduelle pendant le drag
//                 const element = event.currentTarget as HTMLElement;
//                 if (!element) return; // Protection contre null

//                 const progress = Math.abs(info.offset.x) / 100;
//                 const clampedProgress = Math.min(progress, 1);

//                 // Déterminer le swipe en cours - SWIPES INVERSÉS
//                 let currentSwipeType: 'yes' | 'no' | 'maybe' | null = null;
//                 const threshold = 20;

//                 if (info.offset.x < -threshold) {
//                   // INVERSÉ: Swipe vers la GAUCHE = Vert (Oui)
//                   currentSwipeType = 'yes';
//                   element.style.background = `linear-gradient(270deg,
//                     rgba(34, 197, 94, ${0.1 + clampedProgress * 0.3}) 0%,
//                     transparent 100%)`;
//                 } else if (info.offset.x > threshold) {
//                   // INVERSÉ: Swipe vers la DROITE = Rouge (Non)
//                   currentSwipeType = 'no';
//                   element.style.background = `linear-gradient(90deg,
//                     rgba(239, 68, 68, ${0.1 + clampedProgress * 0.3}) 0%,
//                     transparent 100%)`;
//                 } else if (info.offset.y < -threshold) {
//                   // Swipe vers le haut = Orange (Peut-être)
//                   currentSwipeType = 'maybe';
//                   element.style.background = `linear-gradient(0deg,
//                     rgba(249, 115, 22, ${0.1 + clampedProgress * 0.3}) 0%,
//                     transparent 100%)`;
//                 } else {
//                   // Retour à la couleur normale
//                   element.style.background = '';
//                 }

//                 // Mettre à jour l'état du swipe en cours
//                 setCurrentSwipe(prev => ({
//                   ...prev,
//                   [option.id]: currentSwipeType
//                 }));
//               }}
//               onDragEnd={(event, info) => {
//                 // Remettre la couleur normale après le drag
//                 const element = event.currentTarget as HTMLElement;
//                 if (element) {
//                   element.style.background = '';
//                 }

//                 // Nettoyer l'état du swipe en cours
//                 setCurrentSwipe(prev => ({
//                   ...prev,
//                   [option.id]: null
//                 }));

//                 handleOptionDragEnd(event, info, option.id);
//               }}
//             >
//               {/* Badge 1er place */}
//               {getRankingBadge(rank)}

//               {/* Date et heure */}
//               <div className="text-center mb-4">
//                 <div className="flex items-center justify-center gap-2 text-gray-800">
//                   <span className="font-semibold">{formatDate(option.option_date)}</span>
//                   <span className="text-gray-400">•</span>
//                   <span className="text-gray-600">{formatTime(option.time_slots)}</span>
//                 </div>
//               </div>

//               {/*
//                   🎨 BOUTONS DE VOTE AVEC SYSTÈME DOUBLE COUCHE

//                   Logique générale :
//                   - Tous les votes sont initialisés à "maybe" par défaut
//                   - userHasVoted[option.id] = false initialement, devient true après clic
//                   - Coloration selon vote explicite OU swipe temporaire OU état par défaut (maybe seulement)
//                   - Double couche : Barre fond (existant) + Barre surbrillance (avec vote utilisateur)
//                 */}
//               <div className="grid grid-cols-3 gap-2 relative">
//                 {/* Flèches positionnées par rapport à la grille des boutons */}
//                 {index === 0 && !Object.values(userHasVoted).some(voted => voted) && (() => {
//                   console.log('🎯 Flèches affichées - index:', index, 'aucun vote encore:', !Object.values(userHasVoted).some(voted => voted));
//                   return (
//                   <>
//                     {/* Flèche verte à GAUCHE du bouton OUI */}
//                     <motion.div
//                       className="absolute z-20"
//                       style={{
//                         left: '-40px',
//                         top: '50%',
//                         transform: 'translateY(-50%)'
//                       }}
//                       animate={{
//                         opacity: [2, 1, 2],
//                         x: [25, 10, 25],
//                         scale: [1, 1.1, 1]
//                       }}
//                       transition={{
//                         repeat: Infinity,
//                         duration: 2,
//                         ease: "easeInOut",
//                         delay: 0.2
//                       }}
//                     >
//                       <div className="bg-green-500/20 border border-green-300 rounded-full p-2 shadow-lg">
//                         <ArrowLeft className="w-4 h-4 text-green-600" />
//                       </div>
//                     </motion.div>

//                     {/* Flèche rouge à DROITE du bouton NON */}
//                     <motion.div
//                       className="absolute z-20"
//                       style={{
//                         right: '-40px',
//                         top: '50%',
//                         transform: 'translateY(-50%)'
//                       }}
//                       animate={{
//                         opacity: [2, 1, 2],
//                         x: [-25, -10, -25],
//                         scale: [1, 1.1, 1]
//                       }}
//                       transition={{
//                         repeat: Infinity,
//                         duration: 2,
//                         ease: "easeInOut",
//                         delay: 1.2
//                       }}
//                     >
//                       <div className="bg-red-500/20 border border-red-300 rounded-full p-2 shadow-lg">
//                         <ArrowRight className="w-4 h-4 text-red-600" />
//                       </div>
//                     </motion.div>
//                   </>
//                   );
//                 })()}

//                 {/*
//                     🟢 BOUTON YES (OUI)

//                     Logique de coloration :
//                     - Vote explicite : userVote === 'yes' && userHasVoted[option.id]
//                     - Swipe temporaire : currentSwipe[option.id] === 'yes'
//                     - Pas d'état par défaut coloré (contrairement au bouton Maybe)
//                   */}
//                 <button
//                   onClick={() => handleVote('yes', option.id)}
//                   className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
//                                           // CONDITION DE COLORATION (2 cas pour YES)
//                       (userVote === 'yes' && userHasVoted[option.id]) || currentSwipe[option.id] === 'yes'
//                         ? 'bg-green-50 border-green-500 ring-2 ring-green-400'  // COLORÉ : fond vert clair + bordure verte + anneau
//                         : 'bg-white border-gray-200 hover:bg-green-50'  // PAS COLORÉ : fond blanc + bordure grise + hover vert
//                     }`}
//                  data-testid="ex-votingswipe-button">
//                   {/* Contenu du bouton (icône + nombre) - reste visible au-dessus des barres */}
//                   <div className="flex flex-col items-center text-center relative z-10">
//                     {/* Icône Check - même logique de coloration */}
//                     <Check className={`w-5 h-5 mb-1 ${(userVote === 'yes' && userHasVoted[option.id]) || currentSwipe[option.id] === 'yes'
//                         ? 'text-green-700'  // COLORÉ : vert foncé (contraste sur fond vert clair)
//                         : 'text-green-600'  // PAS COLORÉ : vert standard
//                       }`} />
//                     {/* Nombre de votes AVEC le vote utilisateur inclus */}
//                     <span className={`text-sm font-bold ${(userVote === 'yes' && userHasVoted[option.id]) || currentSwipe[option.id] === 'yes'
//                         ? 'text-green-700'  // COLORÉ : vert foncé
//                         : 'text-green-600'  // PAS COLORÉ : vert standard
//                       }`}>
//                       {getStatsWithUser(option.id).yes}
//                     </span>
//                   </div>

//                   {/*
//                   📊 RÉSUMÉ DE LA LOGIQUE COMPLÈTE :

//                   COLORATION DES BOUTONS :
//                   - YES : 2 cas (vote explicite + swipe)
//                   - MAYBE : 3 cas (vote explicite + swipe + état par défaut)
//                   - NO : 2 cas (vote explicite + swipe)

//                   SYSTÈME DOUBLE COUCHE :
//                   - Barre fond : Votes existants / Total votants (toujours visible, couleur terne 30%)
//                   - Barre surbrillance : +1 vote utilisateur / Total votants (conditionnelle, couleur vive 75%)
//                   - Résultat : Impact visuel du vote utilisateur en superposition

//                   EXEMPLE CONCRET avec 4 votes YES existants sur 5 votants :
//                   - Barre fond : 4/5 = 80% de hauteur (vert terne à 30% opacité)
//                   - Barre surbrillance : 1/5 = 20% de hauteur (vert vif à 75% opacité)
//                   - Position : surbrillance commence à 80% du bas
//                   - Total visuel : 80% + 20% = 100% = 5 votes YES sur 5 votants
//                 */}

//                   {/* SYSTÈME DOUBLE COUCHE - Barres de progression */}
//                   {(() => {
//                     // Variables explicites pour clarifier la logique
//                     const totalVotants = getExistingStats(option.id).yes + getExistingStats(option.id).maybe + getExistingStats(option.id).no;
//                     const votesExistantsYes = getExistingStats(option.id).yes;
//                     const ajoutVoteUtilisateur = 1;

//                     return (
//                       <>
//                         {/*
//                             COUCHE 1 : Barre de fond (toujours visible)
//                             - Montre les votes existants SANS le vote utilisateur
//                             - Couleur terne avec faible opacité (30%)
//                             - Animation lente (0.5s) pour la stabilité
//                           */}
//                         <motion.div
//                           className="absolute inset-0 bg-green-200/30"
//                           initial={{ scaleY: 0 }}
//                           animate={{
//                             scaleY: votesExistantsYes / totalVotants  // Ex: 4/5 = 80% de hauteur
//                           }}
//                           transition={{ duration: 0.5, ease: "easeOut" }}
//                           style={{ transformOrigin: 'bottom' }}  // Animation du bas vers le haut
//                         />

//                         {/*
//                             COUCHE 2 : Barre de surbrillance (conditionnelle)
//                             - S'affiche SEULEMENT si l'utilisateur vote
//                             - Couleur vive avec forte opacité (75%)
//                             - Animation rapide (0.3s) pour la réactivité
//                             - Positionnée AU-DESSUS de la barre de fond
//                           */}
//                         {(userVote === 'yes' && userHasVoted[option.id]) || currentSwipe[option.id] === 'yes' ? (
//                           <motion.div
//                             className="absolute bg-green-500/75"
//                             initial={{ height: 0 }}
//                             animate={{
//                               height: `${(ajoutVoteUtilisateur / totalVotants) * 100}%`  // Ex: 1/5 = 20% de hauteur
//                             }}
//                             transition={{ duration: 0.3, ease: "easeOut" }}
//                             style={{
//                               left: 0,
//                               right: 0,
//                               bottom: `${(votesExistantsYes / totalVotants) * 100}%`  // Ex: commence à 80% du bas
//                             }}
//                           />
//                         ) : null}
//                       </>
//                     );
//                   })()}
//                 </button>

//                 {/*
//                     🟠 BOUTON MAYBE (PEUT-ÊTRE)

//                     Logique de coloration - LA PLUS COMPLEXE (3 cas) :
//                     - Vote explicite : userVote === 'maybe' && userHasVoted[option.id]
//                     - Swipe temporaire : currentSwipe[option.id] === 'maybe'
//                     - État par défaut : !userHasVoted[option.id] && userVote === 'maybe'
//                       (SEUL bouton coloré par défaut car tous commencent en "maybe")
//                   */}
//                 <button
//                   onClick={() => handleVote('maybe', option.id)}
//                   className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
//                                           // CONDITION DE COLORATION (3 cas pour MAYBE - le plus complexe)
//                       (userVote === 'maybe' && userHasVoted[option.id]) || currentSwipe[option.id] === 'maybe' || (!userHasVoted[option.id] && userVote === 'maybe')
//                         ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400'  // COLORÉ : fond orange clair + bordure orange
//                         : 'bg-white border-gray-200 hover:bg-orange-50'   // PAS COLORÉ : fond blanc + bordure grise
//                     }`}
//                  data-testid="ex-votingswipe-button">
//                   <div className="flex flex-col items-center text-center relative z-10">
//                     {/* Icône HelpCircle - même logique de coloration complexe */}
//                     <HelpCircle className={`w-5 h-5 mb-1 ${(userVote === 'maybe' && userHasVoted[option.id]) || currentSwipe[option.id] === 'maybe' || (!userHasVoted[option.id] && userVote === 'maybe')
//                         ? 'text-orange-700'  // COLORÉ : orange foncé
//                         : 'text-orange-600'  // PAS COLORÉ : orange standard
//                       }`} />
//                     <span className={`text-sm font-bold ${(userVote === 'maybe' && userHasVoted[option.id]) || currentSwipe[option.id] === 'maybe' || (!userHasVoted[option.id] && userVote === 'maybe')
//                         ? 'text-orange-700'  // COLORÉ : orange foncé
//                         : 'text-orange-600'  // PAS COLORÉ : orange standard
//                       }`}>
//                       {getStatsWithUser(option.id).maybe}
//                     </span>
//                   </div>

//                   {/* SYSTÈME DOUBLE COUCHE - Identique à YES mais en orange */}
//                   {(() => {
//                     const totalVotants = getExistingStats(option.id).yes + getExistingStats(option.id).maybe + getExistingStats(option.id).no;
//                     const votesExistantsMaybe = getExistingStats(option.id).maybe;
//                     const ajoutVoteUtilisateur = 1;

//                     return (
//                       <>
//                         {/* COUCHE 1 : Barre de fond orange */}
//                         <motion.div
//                           className="absolute inset-0 bg-orange-200/30"
//                           initial={{ scaleY: 0 }}
//                           animate={{
//                             scaleY: votesExistantsMaybe / totalVotants
//                           }}
//                           transition={{ duration: 0.5, ease: "easeOut" }}
//                           style={{ transformOrigin: 'bottom' }}
//                         />

//                         {/*
//                             COUCHE 2 : Barre de surbrillance orange
//                             ATTENTION : Condition simplifiée (2 cas au lieu de 3)
//                             - On n'affiche PAS la surbrillance pour l'état par défaut
//                             - Seulement pour vote explicite ou swipe
//                           */}
//                         {(userVote === 'maybe' && userHasVoted[option.id]) || currentSwipe[option.id] === 'maybe' ? (
//                           <motion.div
//                             className="absolute bg-orange-500/75"
//                             initial={{ height: 0 }}
//                             animate={{
//                               height: `${(ajoutVoteUtilisateur / totalVotants) * 100}%`
//                             }}
//                             transition={{ duration: 0.3, ease: "easeOut" }}
//                             style={{
//                               left: 0,
//                               right: 0,
//                               bottom: `${(votesExistantsMaybe / totalVotants) * 100}%`
//                             }}
//                           />
//                         ) : null}
//                       </>
//                     );
//                   })()}
//                 </button>

//                 {/*
//                     🔴 BOUTON NO (NON)

//                     Logique de coloration - IDENTIQUE À YES :
//                     - Vote explicite : userVote === 'no' && userHasVoted[option.id]
//                     - Swipe temporaire : currentSwipe[option.id] === 'no'
//                     - Pas d'état par défaut coloré (comme YES)
//                   */}
//                 <button
//                   onClick={() => handleVote('no', option.id)}
//                   className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
//                                           // CONDITION DE COLORATION (2 cas pour NO - identique à YES)
//                       (userVote === 'no' && userHasVoted[option.id]) || currentSwipe[option.id] === 'no'
//                         ? 'bg-red-50 border-red-500 ring-2 ring-red-400'  // COLORÉ : fond rouge clair + bordure rouge
//                         : 'bg-white border-gray-200 hover:bg-red-50' // PAS COLORÉ : fond blanc + bordure grise
//                     }`}
//                  data-testid="ex-votingswipe-button">
//                   <div className="flex flex-col items-center text-center relative z-10">
//                     {/* Icône X - même logique de coloration que YES */}
//                     <X className={`w-5 h-5 mb-1 ${(userVote === 'no' && userHasVoted[option.id]) || currentSwipe[option.id] === 'no'
//                         ? 'text-red-700'  // COLORÉ : rouge foncé
//                         : 'text-red-600'  // PAS COLORÉ : rouge standard
//                       }`} />
//                     <span className={`text-sm font-bold ${(userVote === 'no' && userHasVoted[option.id]) || currentSwipe[option.id] === 'no'
//                         ? 'text-red-700'  // COLORÉ : rouge foncé
//                         : 'text-red-600'  // PAS COLORÉ : rouge standard
//                       }`}>
//                       {getStatsWithUser(option.id).no}
//                     </span>
//                   </div>

//                   {/* SYSTÈME DOUBLE COUCHE - Identique à YES mais en rouge */}
//                   {(() => {
//                     const totalVotants = getExistingStats(option.id).yes + getExistingStats(option.id).maybe + getExistingStats(option.id).no;
//                     const votesExistantsNo = getExistingStats(option.id).no;
//                     const ajoutVoteUtilisateur = 1;

//                     return (
//                       <>
//                         {/* COUCHE 1 : Barre de fond rouge */}
//                         <motion.div
//                           className="absolute inset-0 bg-red-200/30"
//                           initial={{ scaleY: 0 }}
//                           animate={{
//                             scaleY: votesExistantsNo / totalVotants
//                           }}
//                           transition={{ duration: 0.5, ease: "easeOut" }}
//                           style={{ transformOrigin: 'bottom' }}
//                         />

//                         {/* COUCHE 2 : Barre de surbrillance rouge */}
//                         {(userVote === 'no' && userHasVoted[option.id]) || currentSwipe[option.id] === 'no' ? (
//                           <motion.div
//                             className="absolute bg-red-500/75"
//                             initial={{ height: 0 }}
//                             animate={{
//                               height: `${(ajoutVoteUtilisateur / totalVotants) * 100}%`
//                             }}
//                             transition={{ duration: 0.3, ease: "easeOut" }}
//                             style={{
//                               left: 0,
//                               right: 0,
//                               bottom: `${(votesExistantsNo / totalVotants) * 100}%`
//                             }}
//                           />
//                         ) : null}
//                       </>
//                     );
//                   })()}
//                 </button>
//               </div>

//             </motion.div>
//           );
//         })}
//       </div>

//       {/* Bouton de soumission - toujours actif */}
//       <motion.div
//         initial={{ opacity: 0, y: 50 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="p-6 border-t bg-gray-50"
//       >
//         <button
//           onClick={() => setShowForm(true)}
//           className="w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-500 to-purple-600 text-white"
//          data-testid="ex-votingswipe--finaliser-mon-vote">
//           Finaliser mon vote
//         </button>
//       </motion.div>
//     </div>
//   );
// };
