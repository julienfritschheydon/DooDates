// import React, { useState, useEffect, useRef } from 'react';
// import { X, ChevronLeft, ChevronRight, Calendar, Mail, Clock, Plus, Check, AlertCircle, Settings, Menu, Share2, Copy, Loader2 } from 'lucide-react';
// import { usePolls, type PollData } from '../hooks/usePolls';
// import { useAuth } from '../contexts/AuthContext';
// import { UserMenu } from './UserMenu';

// interface TimeSlot {
//   hour: number;
//   minute: number;
//   enabled: boolean;
// }

// interface PollCreationState {
//   selectedDates: string[];
//   currentMonth: Date;
//   calendarConnected: boolean;
//   pollTitle: string;
//   participantEmails: string;
//   showTimeSlots: boolean;
//   timeSlots: TimeSlot[];
//   notificationsEnabled: boolean;
//   userEmail: string;
//   showCalendarConnect: boolean;
//   showShare: boolean;
//   showDescription: boolean;
//   emailErrors: string[];
//   showExtendedHours: boolean;
//   timeGranularity: number;
//   showGranularitySettings: boolean;
//   showCalendarConnection: boolean;
//   pollLinkCopied: boolean;
// }

// interface PollCreatorProps {
//   onBack?: () => void;
//   onOpenMenu?: () => void;
// }

// const PollCreator: React.FC<PollCreatorProps> = ({ onBack, onOpenMenu }) => {
//   const { user } = useAuth();
//   const { createPoll, loading: pollLoading, error: pollError } = usePolls();
//   const [createdPollSlug, setCreatedPollSlug] = useState<string | null>(null);

//   const [state, setState] = useState<PollCreationState>({
//     selectedDates: [],
//     currentMonth: new Date(),
//     calendarConnected: false,
//     pollTitle: '',
//     participantEmails: '',
//     showTimeSlots: false,
//     timeSlots: Array.from({ length: 24 }, (_, i) => ({ hour: i, minute: 0, enabled: false })),
//     notificationsEnabled: true,
//     userEmail: '',
//     showCalendarConnect: false,
//     showShare: false,
//     showDescription: false,
//     emailErrors: [],
//     showExtendedHours: false,
//     timeGranularity: 60,
//     showGranularitySettings: false,
//     showCalendarConnection: true,
//     pollLinkCopied: false,
//   });

//   const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
//   const [timeSlotsByDate, setTimeSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
//   const [initialGranularityState, setInitialGranularityState] = useState<{
//     granularity: number;
//     timeSlots: Record<string, TimeSlot[]>;
//   } | null>(null);
//   const [previousGranularityState, setPreviousGranularityState] = useState<{
//     granularity: number;
//     timeSlots: Record<string, TimeSlot[]>;
//   } | null>(null);
//   const calendarRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const today = new Date();
//     const months = [];
//     for (let i = 0; i <= 6; i++) {
//       months.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
//     }
//     setVisibleMonths(months);
//   }, []);

//   useEffect(() => {
//     const newTimeSlotsByDate: Record<string, TimeSlot[]> = {};
//     state.selectedDates.forEach((dateStr) => {
//       if (!timeSlotsByDate[dateStr]) {
//         newTimeSlotsByDate[dateStr] = Array.from({ length: 24 }, (_, i) => ({ hour: i, minute: 0, enabled: false }));
//       } else {
//         newTimeSlotsByDate[dateStr] = timeSlotsByDate[dateStr];
//       }
//     });
//     setTimeSlotsByDate(newTimeSlotsByDate);
//   }, [state.selectedDates]);

//   useEffect(() => {
//     const autoSave = setTimeout(() => {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const validDates = state.selectedDates.filter((dateStr) => {
//         const date = new Date(dateStr);
//         return date >= today;
//       });

//       if (validDates.length > 0 || state.pollTitle || state.participantEmails) {
//         const cleanState = {
//           ...state,
//           selectedDates: validDates,
//         };
//         localStorage.setItem('doodates-draft', JSON.stringify(cleanState));
//       } else {
//         localStorage.removeItem('doodates-draft');
//       }

//       if (validDates.length !== state.selectedDates.length) {
//         setState((prev) => ({ ...prev, selectedDates: validDates }));
//       }
//     }, 1000);
//     return () => clearTimeout(autoSave);
//   }, [state]);

//   useEffect(() => {
//     localStorage.removeItem('doodates-draft');
//   }, []);

//   const isGranularityCompatible = (newGranularity: number): boolean => {
//     if (newGranularity > state.timeGranularity) {
//       for (const dateStr of state.selectedDates) {
//         const slots = timeSlotsByDate[dateStr] || [];
//         const enabledSlots = slots.filter((slot) => slot.enabled)
//           .sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));

//         for (const slot of enabledSlots) {
//           const slotMinutes = slot.hour * 60 + slot.minute;
//           if (slotMinutes % newGranularity !== 0) {
//             return false;
//           }
//         }
//       }
//     }
//     return true;
//   };

//   const handleGranularityChange = (newGranularity: number) => {
//     if (!isGranularityCompatible(newGranularity)) {
//       return;
//     }

//     if (!initialGranularityState) {
//       setInitialGranularityState({
//         granularity: state.timeGranularity,
//         timeSlots: { ...timeSlotsByDate },
//       });
//     }

//     if (newGranularity < state.timeGranularity) {
//       const newTimeSlotsByDate: Record<string, TimeSlot[]> = {};

//       for (const dateStr of state.selectedDates) {
//         const slots = timeSlotsByDate[dateStr] || [];
//         const newSlots: TimeSlot[] = [];

//         const totalMinutes = 24 * 60;
//         for (let minutes = 0; minutes < totalMinutes; minutes += newGranularity) {
//           const hour = Math.floor(minutes / 60);
//           const minute = minutes % 60;

//           const blocks = getTimeSlotBlocks(dateStr);
//           let isEnabled = false;

//           for (const block of blocks) {
//             const blockStartMinutes = block.start.hour * 60 + block.start.minute;
//             const blockEndMinutes = block.end.hour * 60 + block.end.minute + state.timeGranularity;

//             if (minutes >= blockStartMinutes && minutes < blockEndMinutes) {
//               isEnabled = true;
//               break;
//             }
//           }

//           newSlots.push({ hour, minute, enabled: isEnabled });
//         }

//         newTimeSlotsByDate[dateStr] = newSlots;
//       }

//       setTimeSlotsByDate(newTimeSlotsByDate);
//     }

//     setState((prev) => ({ ...prev, timeGranularity: newGranularity }));
//   };

//   const undoGranularityChange = () => {
//     if (initialGranularityState) {
//       setState((prev) => ({ ...prev, timeGranularity: initialGranularityState.granularity }));
//       setTimeSlotsByDate(initialGranularityState.timeSlots);
//       setInitialGranularityState(null);
//     }
//   };

//   useEffect(() => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const validDates = state.selectedDates.filter((dateStr) => {
//       const date = new Date(dateStr);
//       return date >= today;
//     });

//     if (validDates.length > 0 || state.pollTitle || state.participantEmails) {
//       const cleanState = {
//         ...state,
//         selectedDates: validDates,
//       };
//       localStorage.setItem('doodates-draft', JSON.stringify(cleanState));
//     } else {
//       localStorage.removeItem('doodates-draft');
//     }

//     if (validDates.length !== state.selectedDates.length) {
//       setState((prev) => ({ ...prev, selectedDates: validDates }));
//     }
//   }, [state]);

//   useEffect(() => {
//     const draft = localStorage.getItem('doodates-draft');
//     if (draft) {
//       try {
//         const parsed = JSON.parse(draft);

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         const validDates = parsed.selectedDates?.filter((dateStr: string) => {
//           const date = new Date(dateStr);
//           return date >= today;
//         }) || [];

//         if (validDates.length > 0 || parsed.selectedDates?.length === 0) {
//           setState((prev) => ({ ...prev, ...parsed, selectedDates: validDates }));
//         } else {
//           localStorage.removeItem('doodates-draft');
//         }
//       } catch (e) {
//         console.warn('Failed to load draft');
//         localStorage.removeItem('doodates-draft');
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (state.selectedDates.length > 0 && !state.showCalendarConnect) {
//       setState((prev) => ({ ...prev, showCalendarConnect: true }));
//     }
//   }, [state.selectedDates.length, state.showCalendarConnect]);

//   const generateCalendarForMonth = (monthDate: Date) => {
//     const year = monthDate.getFullYear();
//     const monthIndex = monthDate.getMonth();
//     const firstDay = new Date(year, monthIndex, 1);
//     const lastDay = new Date(year, monthIndex + 1, 0);

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const days = [];

//     // Calcul du jour de la semaine (0 = dimanche, 1 = lundi, etc.)
//     // On veut que lundi soit 0, donc on ajuste
//     const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Conversion pour que lundi = 0

//     for (let day = 1; day <= lastDay.getDate(); day++) {
//       const date = new Date(year, monthIndex, day);
//       if (date >= today) {
//         days.push({
//           date,
//           day,
//           dayOfWeek: day === 1 ? startDayOfWeek : 0,
//         });
//       }
//     }

//     return days;
//   };

//   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
//     const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

//     if (scrollHeight - scrollTop <= clientHeight + 100) {
//       const lastMonth = visibleMonths[visibleMonths.length - 1];
//       const newMonths = [];
//       for (let i = 1; i <= 3; i++) {
//         newMonths.push(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1));
//       }
//       setVisibleMonths((prev) => [...prev, ...newMonths]);
//     }
//   };

//   const toggleDate = (date: Date) => {
//     // Formater la date en mode local pour éviter les décalages timezone
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const dateStr = `${year}-${month}-${day}`;

//     setState((prev) => ({
//       ...prev,
//       selectedDates: prev.selectedDates.includes(dateStr)
//         ? prev.selectedDates.filter((d) => d !== dateStr)
//         : [...prev.selectedDates, dateStr],
//     }));
//   };

//   const connectCalendar = (provider: 'google' | 'outlook') => {
//     setState((prev) => ({ ...prev, calendarConnected: true }));
//   };

//   const validateEmails = (emailString: string): { valid: string[]; errors: string[] } => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const emails = emailString
//       .split(/[,;\s\n]+/)
//       .map((email) => email.trim())
//       .filter((email) => email.length > 0);

//     const valid: string[] = [];
//     const errors: string[] = [];

//     emails.forEach((email) => {
//       if (emailRegex.test(email)) {
//         valid.push(email);
//       } else {
//         errors.push(`Email invalide: ${email}`);
//       }
//     });

//     return { valid, errors };
//   };

//   const handleEmailInput = (value: string) => {
//     setState((prev) => ({ ...prev, participantEmails: value }));

//     const { valid, errors } = validateEmails(value);
//     setState((prev) => ({
//       ...prev,
//       emailErrors: errors,
//       notificationsEnabled: prev.userEmail ? true : valid.length > 0,
//     }));
//   };

//   const toggleTimeSlotForDate = (dateStr: string, hour: number, minute: number) => {
//     setTimeSlotsByDate((prev) => {
//       const currentSlots = prev[dateStr] || [];
//       const slotKey = `${hour}-${minute}`;
//       const existingSlot = currentSlots.find((s) => s.hour === hour && s.minute === minute);

//       let newSlots;
//       if (existingSlot) {
//         newSlots = currentSlots.map((slot) =>
//           slot.hour === hour && slot.minute === minute ? { ...slot, enabled: !slot.enabled } : slot
//         );
//       } else {
//         newSlots = [...currentSlots, { hour, minute, enabled: true }];
//       }

//       return {
//         ...prev,
//         [dateStr]: newSlots,
//       };
//     });
//   };

//   const generateTimeSlots = (): { hour: number; minute: number; label: string }[] => {
//     const slots = [];
//     const totalMinutes = 24 * 60;

//     for (let minutes = 0; minutes < totalMinutes; minutes += state.timeGranularity) {
//       const hour = Math.floor(minutes / 60);
//       const minute = minutes % 60;
//       const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
//       slots.push({ hour, minute, label });
//     }

//     return slots;
//   };

//   const getVisibleTimeSlots = () => {
//     const allSlots = generateTimeSlots();

//     if (state.showExtendedHours) {
//       return allSlots;
//     } else {
//       return allSlots.filter((slot) => slot.hour >= 7 && slot.hour <= 22);
//     }
//   };

//   const getTimeSlotBlocks = (dateStr: string): {
//     start: { hour: number; minute: number };
//     end: { hour: number; minute: number };
//   }[] => {
//     const slots = timeSlotsByDate[dateStr] || [];
//     const enabledSlots = slots.filter((slot) => slot.enabled)
//       .sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));

//     const blocks = [];
//     let currentBlock = null;

//     enabledSlots.forEach((slot) => {
//       const slotMinutes = slot.hour * 60 + slot.minute;

//       if (!currentBlock) {
//         currentBlock = { start: slot, end: slot };
//       } else {
//         const blockEndMinutes = currentBlock.end.hour * 60 + currentBlock.end.minute;

//         if (slotMinutes === blockEndMinutes + state.timeGranularity) {
//           currentBlock.end = slot;
//         } else {
//           blocks.push(currentBlock);
//           currentBlock = { start: slot, end: slot };
//         }
//       }
//     });

//     if (currentBlock) {
//       blocks.push(currentBlock);
//     }

//     return blocks;
//   };

//   const formatSelectedDateHeader = (dateStr: string) => {
//     // Parser la date en mode local pour éviter les décalages timezone
//     const [year, month, day] = dateStr.split('-').map(Number);
//     const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

//     return {
//       dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
//       dayNumber: date.getDate(),
//       month: date.toLocaleDateString('fr-FR', { month: 'short' }),
//     };
//   };

//   const canFinalize = () => {
//     const hasDates = state.selectedDates.length > 0;
//     const noEmailErrors = state.emailErrors.length === 0;

//     return hasDates && noEmailErrors;
//   };

//   const handleFinalize = async () => {
//     // Vérification : si pas d'utilisateur, créer un sondage anonyme
//     if (!user) {
//       console.log('Création d\'un sondage anonyme (fonctionnalité limitée)');
//       // TODO: Implémenter la création de sondages anonymes
//       // Pour l'instant, on redirige vers la connexion
//       window.location.href = '/auth';
//       return;
//     }

//     // Validation des emails
//     const { valid: validEmails, errors: emailErrors } = validateEmails(state.participantEmails);
//     if (emailErrors.length > 0) {
//       setState(prev => ({ ...prev, emailErrors }));
//       return;
//     }

//     // Préparation des données du sondage
//     const pollData: PollData = {
//       title: state.pollTitle.trim() || `Sondage du ${new Date().toLocaleDateString('fr-FR')}`,
//       description: null, // Pas de description pour l'instant
//       selectedDates: state.selectedDates,
//       timeSlotsByDate: timeSlotsByDate,
//       participantEmails: validEmails,
//       settings: {
//         timeGranularity: state.timeGranularity,
//         allowAnonymousVotes: true, // Par défaut
//         allowMaybeVotes: true, // Par défaut
//         sendNotifications: state.notificationsEnabled,
//         expiresAt: undefined, // Pas d'expiration par défaut
//       },
//     };

//     console.log('Création du sondage avec les données:', pollData);

//     // Créer le sondage
//     const result = await createPoll(pollData);
//     console.log('Résultat createPoll:', result);

//     if (result.error) {
//       console.error('Erreur lors de la création du sondage:', result.error);
//       return;
//     }

//     if (result.poll) {
//       console.log('Sondage créé avec succès:', result.poll);
//       setCreatedPollSlug(result.poll.slug);

//       // Nettoyer le brouillon
//       localStorage.removeItem('doodates-draft');

//       console.log('createdPollSlug défini à:', result.poll.slug);

//       // Optionnel : rediriger vers le sondage créé
//       // window.location.href = `/poll/${poll.slug}`;
//     } else {
//       console.error('Aucun sondage retourné malgré l\'absence d\'erreur');
//     }
//   };

//   const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

//   const copyPollLink = async () => {
//     try {
//       const pollUrl = createdPollSlug
//         ? `https://doodates.app/poll/${createdPollSlug}`
//         : `https://doodates.app/poll/${state.pollTitle.replace(/\s+/g, '-').toLowerCase() || 'nouveau-sondage'}`;

//       await navigator.clipboard.writeText(pollUrl);
//       setState(prev => ({ ...prev, pollLinkCopied: true }));

//       // Reset après 3 secondes
//       setTimeout(() => {
//         setState(prev => ({ ...prev, pollLinkCopied: false }));
//       }, 3000);
//     } catch (err) {
//       console.error('Erreur lors de la copie:', err);
//     }
//   };

//   const monthNames = [
//     'Janvier',
//     'Février',
//     'Mars',
//     'Avril',
//     'Mai',
//     'Juin',
//     'Juillet',
//     'Août',
//     'Septembre',
//     'Octobre',
//     'Novembre',
//     'Décembre',
//   ];

//   return (
//     <div className="min-h-screen bg-white p-4">
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center">
//               {onOpenMenu && (
//                 <button
//                   onClick={onOpenMenu}
//                   className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
//                   aria-label="Ouvrir le menu"
//                 >
//                   <Menu className="w-5 h-5 text-gray-600" />
//                 </button>
//               )}
//             </div>
//             <div className="flex items-center gap-3">
//               {onBack && (
//                 <button
//                   onClick={onBack}
//                   className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
//                   aria-label="Fermer"
//                 >
//                   <X className="w-5 h-5 text-gray-400" />
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="space-y-6">
//             <div>
//               {/* En-têtes des jours de la semaine - fixes */}
//               <div className="grid grid-cols-7 gap-1 mb-2 px-4 py-2 bg-gray-50 rounded-t-lg">
//                 {weekDays.map((day) => (
//                   <div key={day} className="text-center text-xs text-gray-600 py-1 font-medium">
//                     {day}
//                   </div>
//                 ))}
//               </div>

//               <div
//                 ref={calendarRef}
//                 onScroll={handleScroll}
//                 className="h-96 overflow-y-auto border border-t-0 rounded-b-lg p-4"
//               >
//                 {visibleMonths.map((month, monthIndex) => (
//                   <div key={`${month.getFullYear()}-${month.getMonth()}`} className="relative">
//                     <div className="absolute top-4 left-4 text-6xl font-bold text-gray-100 pointer-events-none select-none z-0">
//                       {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
//                     </div>

//                     <div className="relative z-10 mb-2">
//                       <div className="grid grid-cols-7 gap-1">
//                         {generateCalendarForMonth(month).length > 0 &&
//                           Array.from({ length: generateCalendarForMonth(month)[0].dayOfWeek }).map((_, index) => (
//                             <div key={`empty-${index}`} className="w-10 h-10"></div>
//                           ))}

//                         {generateCalendarForMonth(month).map(({ date, day }, index) => {
//                           // Formater la date en mode local pour éviter les décalages timezone
//                           const year = date.getFullYear();
//                           const month = (date.getMonth() + 1).toString().padStart(2, '0');
//                           const dayStr = date.getDate().toString().padStart(2, '0');
//                           const dateStr = `${year}-${month}-${dayStr}`;
//                           const isSelected = state.selectedDates.includes(dateStr);
//                           const today = new Date();
//                           today.setHours(0, 0, 0, 0);
//                           const isToday = date.getTime() === today.getTime();

//                           return (
//                             <button
//                               key={index}
//                               onClick={() => toggleDate(date)}
//                               className={`w-10 h-10 text-sm rounded-lg transition-all duration-200 font-medium
//                                 ${isSelected
//                                   ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
//                                   : isToday
//                                   ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100'
//                                   : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
//                                 }
//                               `}
//                             >
//                               {day}
//                             </button>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {state.selectedDates.length > 0 && (
//                 <div className="space-y-4">
//                   {state.showCalendarConnection && (
//                     <div className="border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center justify-between mb-2">
//                         <a href="#" className="text-sm text-blue-600 hover:text-blue-800 underline">
//                           Connecter votre calendrier (optionnel)
//                         </a>
//                         <button
//                           onClick={() => setState((prev) => ({ ...prev, showCalendarConnection: false }))}
//                           className="text-gray-400 hover:text-gray-600"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </div>
//                   )}

//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setState((prev) => ({ ...prev, showTimeSlots: !prev.showTimeSlots }))}
//                       className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-300 transition-colors"
//                     >
//                       <Clock className="w-4 h-4" />
//                       Horaires
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {state.showTimeSlots && (
//               <div className="mt-6">
//                 {state.showGranularitySettings && (
//                   <div className="mb-4 p-4 bg-gray-50 rounded-lg">
//                     <div className="flex items-center justify-between mb-3">
//                       <h4 className="text-sm font-medium text-gray-700">Précision des créneaux</h4>
//                       <button
//                         onClick={() => setState((prev) => ({ ...prev, showGranularitySettings: false }))}
//                         className="text-gray-400 hover:text-gray-600"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                     <div className="flex gap-2 flex-wrap">
//                       {[
//                         { value: 15, label: '15 min' },
//                         { value: 30, label: '30 min' },
//                         { value: 60, label: '1 heure' },
//                         { value: 120, label: '2 heures' },
//                         { value: 240, label: '4 heures' },
//                       ].map((option) => {
//                         const compatible = isGranularityCompatible(option.value);
//                         return (
//                           <button
//                             key={option.value}
//                             onClick={() => handleGranularityChange(option.value)}
//                             disabled={!compatible}
//                             className={`px-3 py-1 text-sm rounded-full transition-colors
//                               ${state.timeGranularity === option.value
//                                 ? 'bg-blue-500 text-white'
//                                 : compatible
//                                 ? 'bg-white border border-gray-300 hover:border-blue-300'
//                                 : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
//                               }
//                             `}
//                           >
//                             {option.label}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 <div className="border rounded-lg overflow-hidden">
//                   <div
//                     className="grid gap-px bg-gray-200"
//                     style={{ gridTemplateColumns: `80px repeat(${state.selectedDates.length}, 1fr)` }}
//                   >
//                     <div className="bg-gray-50 p-2 text-xs font-medium text-gray-600 flex items-center justify-between">
//                       <span>Horaires</span>
//                       <button
//                         onClick={() => setState((prev) => ({ ...prev, showGranularitySettings: !prev.showGranularitySettings }))}
//                         className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
//                         title="Précision des créneaux"
//                       >
//                         <Settings className="w-3 h-3" />
//                       </button>
//                     </div>
//                     {state.selectedDates.map((dateStr) => {
//                       const dateInfo = formatSelectedDateHeader(dateStr);
//                       return (
//                         <div key={dateStr} className="bg-gray-50 p-2 text-center">
//                           <div className="text-xs font-medium text-gray-800">{dateInfo.dayName}</div>
//                           <div className="text-sm font-bold">{dateInfo.dayNumber}</div>
//                           <div className="text-xs text-gray-600">{dateInfo.month}</div>
//                         </div>
//                       );
//                     })}
//                   </div>

//                   <div className="max-h-64 overflow-y-auto">
//                     {getVisibleTimeSlots().map((timeSlot) => (
//                       <div
//                         key={`${timeSlot.hour}-${timeSlot.minute}`}
//                         className="grid bg-gray-200 border-b border-gray-200"
//                         style={{
//                           gridTemplateColumns: `80px repeat(${state.selectedDates.length}, 1fr)`,
//                           gap: '1px',
//                         }}
//                       >
//                         <div className="bg-white p-2 text-xs text-gray-600 flex items-center">
//                           {timeSlot.label}
//                         </div>
//                         {state.selectedDates.map((dateStr) => {
//                           const slot = timeSlotsByDate[dateStr]?.find((s) => s.hour === timeSlot.hour && s.minute === timeSlot.minute);
//                           const blocks = getTimeSlotBlocks(dateStr);
//                           const currentBlock = blocks.find((block) =>
//                             (timeSlot.hour * 60 + timeSlot.minute) >= (block.start.hour * 60 + block.start.minute) &&
//                             (timeSlot.hour * 60 + timeSlot.minute) <= (block.end.hour * 60 + block.end.minute)
//                           );
//                           const isBlockStart = blocks.some((block) => block.start.hour === timeSlot.hour && block.start.minute === timeSlot.minute);
//                           const isBlockEnd = blocks.some((block) => block.end.hour === timeSlot.hour && block.end.minute === timeSlot.minute);
//                           const isBlockMiddle = currentBlock && !isBlockStart && !isBlockEnd;

//                           return (
//                             <button
//                               key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
//                               onClick={() => toggleTimeSlotForDate(dateStr, timeSlot.hour, timeSlot.minute)}
//                               className={`bg-white relative transition-colors hover:bg-gray-50
//                                 ${slot?.enabled ? 'bg-blue-50' : ''}
//                                 ${state.timeGranularity >= 60 ? 'min-h-[40px] p-1' : 'min-h-[24px] p-0.5'}
//                               `}
//                             >
//                               {slot?.enabled && (
//                                 <div
//                                   className={`absolute bg-blue-500 transition-all
//                                   ${isBlockStart && isBlockEnd ? 'inset-1 rounded-lg' : ''}
//                                   ${isBlockStart && !isBlockEnd ? 'inset-x-1 top-1 bottom-0 rounded-t-lg' : ''}
//                                   ${isBlockEnd && !isBlockStart ? 'inset-x-1 bottom-1 top-0 rounded-b-lg' : ''}
//                                   ${isBlockMiddle ? 'inset-x-1 top-0 bottom-0' : ''}
//                                 `}
//                                 >
//                                   {isBlockStart && (
//                                     <div className="absolute top-1 left-1 right-1">
//                                       <div className="text-white text-xs font-semibold text-center bg-blue-600 rounded px-1 py-0.5">
//                                         {timeSlot.label}
//                                       </div>
//                                     </div>
//                                   )}
//                                   {isBlockEnd && (
//                                     <div className="absolute bottom-1 left-1 right-1">
//                                       <div className="text-white text-xs font-semibold text-center bg-blue-600 rounded px-1 py-0.5">
//                                         {(() => {
//                                           const endMinutes = timeSlot.hour * 60 + timeSlot.minute + state.timeGranularity;
//                                           const endHour = Math.floor(endMinutes / 60);
//                                           const endMin = endMinutes % 60;
//                                           return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
//                                         })()}
//                                       </div>
//                                     </div>
//                                   )}
//                                 </div>
//                               )}
//                             </button>
//                           );
//                         })}
//                       </div>
//                     ))}
//                   </div>

//                   {!state.showExtendedHours && (
//                     <div className="p-3 bg-gray-50 border-t">
//                       <button
//                         onClick={() => setState((prev) => ({ ...prev, showExtendedHours: true }))}
//                         className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
//                       >
//                         <Plus className="w-3 h-3" />
//                         Afficher plus d'horaires (0h-6h, 23h)
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {/* Bouton Partager affiché après la section horaires */}
//                 <div className="mt-4">
//                   <button
//                     onClick={() => setState(prev => ({ ...prev, showShare: true }))}
//                     className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//                   >
//                     <Share2 className="w-4 h-4" />
//                     Partager
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Bouton Partager affiché si pas d'horaires sélectionnés */}
//             {state.selectedDates.length > 0 && !state.showTimeSlots && (
//               <div className="mt-4">
//                 <button
//                   onClick={() => setState(prev => ({ ...prev, showShare: true }))}
//                   className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//                 >
//                   <Share2 className="w-4 h-4" />
//                   Partager
//                 </button>
//               </div>
//             )}

//             {/* Section partage accessible depuis le bouton principal */}
//             {state.showShare && (
//               <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//                 <div className="space-y-4">
//                   {/* Affichage utilisateur connecté */}
//                   <UserMenu />
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Titre du sondage <span className="text-gray-400 text-sm">(optionnel)</span>
//                     </label>
//                     <input
//                       type="text"
//                       value={state.pollTitle}
//                       onChange={(e) => setState((prev) => ({ ...prev, pollTitle: e.target.value }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="Ex: Réunion équipe marketing"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Emails des participants (séparés par des virgules)
//                     </label>
//                     <textarea
//                       value={state.participantEmails}
//                       onChange={(e) => setState((prev) => ({ ...prev, participantEmails: e.target.value }))}
//                       rows={3}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="email1@exemple.com, email2@exemple.com"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Lien du sondage
//                     </label>
//                     <div className="flex gap-2">
//                       <input
//                         type="text"
//                         value={createdPollSlug
//                           ? `https://doodates.app/poll/${createdPollSlug}`
//                           : `https://doodates.app/poll/${state.pollTitle.replace(/\s+/g, '-').toLowerCase() || 'nouveau-sondage'}`
//                         }
//                         readOnly
//                         className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600"
//                       />
//                       <button
//                         onClick={copyPollLink}
//                         className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
//                         title="Copier le lien du sondage"
//                       >
//                         <Copy className="w-4 h-4" />
//                         {state.pollLinkCopied ? '✓' : 'Copier'}
//                       </button>
//                     </div>
//                     {state.pollLinkCopied && (
//                       <div className="text-sm text-green-600 mt-1">
//                         Lien copié dans le presse-papier !
//                       </div>
//                     )}
//                   </div>

//                   {/* Suggestion de connexion pour utilisateur non connecté */}
//                   {!user && (
//                     <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                       <div className="flex items-center gap-2 text-blue-800">
//                         <AlertCircle className="w-4 h-4" />
//                         <span className="text-sm font-medium">Connexion recommandée</span>
//                       </div>
//                       <p className="text-sm text-blue-700 mt-1">
//                         Connectez-vous pour gérer vos sondages et accéder à plus de fonctionnalités.
//                       </p>
//                       <button
//                         onClick={() => window.location.href = '/auth'}
//                         className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
//                       >
//                         Se connecter maintenant
//                       </button>
//                     </div>
//                   )}

//                   {/* Affichage des erreurs */}
//                   {pollError && (
//                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                       <div className="flex items-center gap-2 text-red-800">
//                         <AlertCircle className="w-4 h-4" />
//                         <span className="text-sm font-medium">Erreur</span>
//                       </div>
//                       <p className="text-sm text-red-700 mt-1">{pollError}</p>
//                     </div>
//                   )}

//                   {/* Affichage des erreurs d'email */}
//                   {state.emailErrors.length > 0 && (
//                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                       <div className="flex items-center gap-2 text-red-800">
//                         <AlertCircle className="w-4 h-4" />
//                         <span className="text-sm font-medium">Emails invalides</span>
//                       </div>
//                       <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
//                         {state.emailErrors.map((error, index) => (
//                           <li key={index}>{error}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                   {/* Succès de création */}
//                   {createdPollSlug && (
//                     <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
//                       <div className="flex items-center gap-2 text-green-800">
//                         <Check className="w-4 h-4" />
//                         <span className="text-sm font-medium">Sondage créé avec succès !</span>
//                       </div>
//                       <p className="text-sm text-green-700 mt-1">
//                         Votre sondage est maintenant disponible à l'adresse :
//                       </p>
//                       <div className="mt-2 p-2 bg-white border border-green-200 rounded text-sm font-mono text-green-900">
//                         https://doodates.app/poll/{createdPollSlug}
//                       </div>
//                     </div>
//                   )}

//                   {/* Aide pour les exigences */}
//                   {!canFinalize() && !pollLoading && !createdPollSlug && (
//                     <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
//                       <p className="font-medium mb-1">Pour créer le sondage :</p>
//                       <ul className="space-y-1">
//                         {state.selectedDates.length === 0 && (
//                           <li className="flex items-center gap-2">
//                             <span className="w-2 h-2 bg-red-400 rounded-full"></span>
//                             Sélectionnez au moins une date
//                           </li>
//                         )}
//                         {state.emailErrors.length > 0 && (
//                           <li className="flex items-center gap-2">
//                             <span className="w-2 h-2 bg-red-400 rounded-full"></span>
//                             Corrigez les emails invalides
//                           </li>
//                         )}
//                       </ul>
//                     </div>
//                   )}

//                   <div className="pt-2">
//                     <button
//                       onClick={handleFinalize}
//                       disabled={!canFinalize() || pollLoading}
//                       className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
//                     >
//                       {pollLoading && <Loader2 className="w-4 h-4 animate-spin" />}
//                       {pollLoading
//                         ? 'Création en cours...'
//                         : createdPollSlug
//                         ? 'Sondage créé !'
//                         : (state.participantEmails.trim() ? 'Sauvegarder' : 'Enregistrer')
//                       }
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PollCreator;
