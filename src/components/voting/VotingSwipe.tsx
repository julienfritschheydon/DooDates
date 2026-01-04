/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Check, X, HelpCircle, ChevronDown, ChevronUp, Shield } from "lucide-react";

// Import components
import VoteCompletionScreen from "./VoteCompletionScreen";
import VoterForm from "./VoterForm";
import PollHeader from "./PollHeader";
import VoteOption from "./VoteOption";
import VoteOptionDesktop from "./VoteOptionDesktop";

// Import types and utilities
import { logger } from "@/lib/logger";
import { isDev } from "@/lib/env";
import { VoterInfo, FormErrors, VoteType } from "./utils/types";

// Import custom hooks
import { useVoting } from "../../hooks/useVoting";
import { useIsDesktop } from "../../hooks/useIsDesktop";

interface VotingSwipeProps {
  pollId: string;
  onBack?: () => void;
  onVoteSubmitted?: () => void;
  onViewResults?: () => void;
}

const VotingSwipe: React.FC<VotingSwipeProps> = ({
  pollId,
  onBack,
  onVoteSubmitted,
  onViewResults,
}) => {
  // Détecter si on est sur desktop
  const isDesktop = useIsDesktop();

  // Utiliser le hook useVoting pour gérer toute la logique métier
  const {
    poll,
    options,
    votes: existingVotes,
    currentVote: votes,
    userHasVoted,
    voterInfo,
    loading: isLoading,
    submitting: isSubmitting,
    error,
    setVoterInfo: setVoterInfoData,
    updateVote: handleVote,
    removeVote,
    submitVote: submitUserVote,
    getVoteStats,
    getBestOption,
    hasVotes,
    totalVotes: votesTotalCount,
  } = useVoting(pollId);

  // États locaux pour l'interface
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isVoteComplete, setIsVoteComplete] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);

  const showVoterForm = () => setShowForm(true);
  const hideVoterForm = () => setShowForm(false);

  // Stats SANS le vote utilisateur (pour les barres de fond)
  const getExistingStats = useCallback(
    (optionId: string) => {
      const stats = getVoteStats(optionId);
      return {
        yes: stats.counts.yes,
        maybe: stats.counts.maybe,
        no: stats.counts.no,
      };
    },
    [getVoteStats],
  );

  // Stats AVEC le vote utilisateur en cours (pour les chiffres affichés)
  const getStatsWithUser = useCallback(
    (optionId: string) => {
      const stats = getVoteStats(optionId);
      const result = {
        yes: stats.counts.yes,
        maybe: stats.counts.maybe,
        no: stats.counts.no,
      };

      logger.debug("getStatsWithUser", "vote", {
        optionId,
        existingStats: result,
        userVote: votes[optionId],
        userHasVoted: userHasVoted[optionId],
      });

      // Ajouter le vote utilisateur s'il existe (même si userHasVoted est false)
      // Car en mode swipe, userHasVoted peut ne pas être à jour
      if (votes[optionId]) {
        result[votes[optionId]]++;
        logger.debug("Vote utilisateur ajouté", "vote", {
          voteType: votes[optionId],
          newTotal: result,
        });
      }

      return result;
    },
    [getVoteStats, votes, userHasVoted],
  );

  const getRanking = () => getBestOption();

  const getVoteText = (vote: VoteType) => {
    switch (vote) {
      case "yes":
        return "Oui";
      case "no":
        return "Non";
      case "maybe":
        return "Peut-être";
      default:
        return "";
    }
  };

  const handleSubmit = async (voterInfo: VoterInfo) => {
    logger.debug("VotingSwipe handleSubmit appelé", "vote", {
      voterName: voterInfo.name,
      votesCount: Object.keys(votes).length,
    });
    setVoterInfoData(voterInfo);

    // Vérifier qu'il y a des votes à soumettre
    const hasVotesToSubmit = Object.keys(votes).length > 0;
    if (!hasVotesToSubmit) {
      logger.warn("Aucun vote à soumettre", "vote");
      setFormErrors({
        general: "Veuillez voter sur au moins une option avant de soumettre.",
      });
      return;
    }

    const success = await submitUserVote();
    if (success) {
      setIsVoteComplete(true);
      setShowForm(false);

      // Envoyer l'email de confirmation si activé
      if (poll && shouldSendConfirmationEmail(poll.settings)) {
        try {
          const selectedDates = options
            .filter((opt) => votes[opt.id])
            .map((opt) => ({
              date: opt.date || opt.label,
              slots: opt.timeSlots || [],
            }));

          await sendDatePollConfirmationEmail({
            pollId: poll.id,
            pollTitle: poll.title,
            selectedDates,
            respondentName: voterInfo.name,
            recipientEmail: (poll.settings as any)?.emailForCopy || voterInfo.email || "",
          });

          logger.info("Email de confirmation envoyé", "vote", { pollId: poll.id });
        } catch (error) {
          logger.error("Erreur lors de l'envoi de l'email de confirmation", "vote", { error });
          // Ne pas bloquer le vote si l'email échoue
        }
      }

      if (onVoteSubmitted) onVoteSubmitted();
    }
  };

  const resetVotes = () => {
    // Réinitialiser tous les votes
    options.forEach((option) => removeVote(option.id));
  };

  // Gérer le retour
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Rediriger vers la page d'accueil si onBack n'est pas fourni
      window.location.href = "/";
    }
  };

  // Si le chargement est en cours, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Si le vote est terminé, afficher l'écran de fin
  if (isVoteComplete) {
    const canSeeResults =
      poll?.resultsVisibility === "public" || poll?.resultsVisibility === "voters";
    return (
      <VoteCompletionScreen
        onBack={handleBack}
        onViewResults={canSeeResults && onViewResults ? onViewResults : undefined}
      />
    );
  }

  // Calculer le nombre de votes par type
  const userTotalVotes = Object.values(userHasVoted).filter(Boolean).length;
  const remainingVotes = options.length - userTotalVotes;

  // Calculer le pourcentage de progression
  const progressPercent = (userTotalVotes / options.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] pb-8">
      {/* En-tête avec titre et bouton retour */}
      <PollHeader
        poll={
          poll
            ? {
                ...poll,
                description: poll.description || "",
                expires_at:
                  poll.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : null
        }
        existingVotes={existingVotes}
        onBack={handleBack}
        totalVotes={userTotalVotes}
        remainingVotes={remainingVotes}
        progressPercent={progressPercent}
      />

      {/* Informations sur l'utilisation des données avant le vote */}
      <div className="px-4 pt-2">
        <div className="max-w-3xl mx-auto text-[11px] text-gray-400">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 rounded-md bg-[#111111] border border-gray-800 px-3 py-2 hover:bg-[#151515] transition-colors"
            onClick={() => setShowDataInfo((prev) => !prev)}
            data-testid="rgpd-datepoll-info-toggle"
          >
            <div className="flex items-center gap-2 text-left">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <p className="text-[11px] font-medium text-gray-200">Vos données pour ce sondage</p>
                {showDataInfo && (
                  <p className="text-[10px] text-gray-400">
                    Nom, email et réponses sont utilisés pour organiser l'événement et afficher les
                    résultats.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>{showDataInfo ? "Masquer les détails" : "Voir les détails"}</span>
              {showDataInfo ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </button>

          {showDataInfo && (
            <div
              className="mt-2 rounded-md bg-[#0d0d0d] border border-gray-800 px-3 py-2 text-[11px] text-gray-300"
              data-testid="rgpd-datepoll-info"
            >
              <p className="font-medium text-gray-200 mb-1">Détails sur vos données</p>
              <p className="mb-1">
                Vos nom, email et réponses à ce sondage sont stockés pour permettre à l'organisateur
                d'organiser l'événement et consulter les résultats.
              </p>
              <p className="mb-1">
                Vous pouvez demander la suppression de vos données en contactant l'organisateur du
                sondage.
              </p>
              <p>
                Pour en savoir plus, consultez la{" "}
                <Link
                  to="/privacy"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Politique de confidentialité complète
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        {/* Liste des options */}
        {isDesktop ? (
          /* Vue Desktop : Tableau */
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto">
              <h3 className="text-sm font-medium text-gray-400">Options disponibles</h3>
              <div className="text-xs text-gray-500">Cliquez sur les boutons pour voter</div>
            </div>
            <div className="flex justify-center">
              <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden max-w-3xl w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-[#252525]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 min-w-[200px]">
                        Date
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-medium text-gray-400 w-24"
                        aria-label="Oui"
                      >
                        <Check className="w-4 h-4 text-blue-500 mx-auto" />
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-medium text-gray-400 w-24"
                        aria-label="Peut-être"
                      >
                        <HelpCircle className="w-4 h-4 text-orange-500 mx-auto" />
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-medium text-gray-400 w-24"
                        aria-label="Non"
                      >
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Logique de groupement
                      const processedOptionIds = new Set<string>();
                      const groups: any[] = [];

                      // 1. Traiter les groupes définis
                      if (poll?.dateGroups && poll.dateGroups.length > 0) {
                        if (isDev()) {
                          logger.debug("Groupes détectés dans VotingSwipe Desktop", "vote", {
                            groups: poll.dateGroups,
                          });
                        }
                        poll.dateGroups.forEach((group) => {
                          const groupOptions = options.filter((opt) => {
                            const isMatch = group.dates.includes(opt.option_date);
                            // console.log(`🔍 Check match: ${opt.option_date} in ${group.dates} ? ${isMatch}`);
                            return isMatch;
                          });

                          if (groupOptions.length > 0) {
                            if (isDev()) {
                              logger.debug("Groupe formé", "vote", {
                                label: group.label,
                                count: groupOptions.length,
                              });
                            }
                            groups.push({
                              type: "group",
                              data: group,
                              options: groupOptions,
                              // Utiliser la première date pour le tri
                              sortDate: group.dates[0],
                            });
                            groupOptions.forEach((opt) => processedOptionIds.add(opt.id));
                          } else {
                            console.warn("⚠️ Groupe sans options correspondantes:", group);
                          }
                        });
                      } else {
                        if (isDev()) {
                          logger.debug("Aucun groupe de dates dans le poll", "vote", {
                            pollId: poll?.id,
                          });
                        }
                      }

                      // 2. Traiter les options restantes (individuelles)
                      options.forEach((opt) => {
                        if (!processedOptionIds.has(opt.id)) {
                          groups.push({
                            type: "single",
                            data: opt,
                            options: [opt],
                            sortDate: opt.option_date,
                          });
                        }
                      });

                      // 3. Trier par date
                      groups.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

                      // ⚠️ WARNING: Toujours vérifier les clés dupliquées (même en production)
                      const allIds = groups.map((item) =>
                        item.type === "group" ? `group-${groups.indexOf(item)}` : item.data.id,
                      );
                      const duplicateIds = allIds.filter(
                        (id, index) => allIds.indexOf(id) !== index,
                      );

                      if (duplicateIds.length > 0) {
                        logger.warn("IDs dupliqués détectés dans VotingSwipe Desktop", "vote", {
                          duplicateIds,
                        });
                      }

                      // Vérifier aussi les clés basées sur date + time slots (format potentiel de clé React)
                      const duplicateDateKeys = groups
                        .filter((item) => item.type === "single")
                        .map((item) => {
                          const opt = item.data;
                          return opt.time_slots?.[0]
                            ? `${opt.option_date}-${opt.time_slots[0].hour}-${opt.time_slots[0].minute}`
                            : opt.option_date;
                        })
                        .filter((key, index, arr) => arr.indexOf(key) !== index);

                      if (duplicateDateKeys.length > 0) {
                        logger.warn(
                          "Clés basées sur date+time dupliquées dans VotingSwipe Desktop",
                          "vote",
                          { duplicateDateKeys },
                        );
                      }

                      return groups.map((item, index) => {
                        if (item.type === "group") {
                          // Rendu d'un groupe
                          const groupLabel = item.data.label;
                          // Vérifier l'état du vote pour le groupe (si toutes les options ont le même vote)
                          const firstOptionId = item.options[0].id;
                          const groupVote = votes[firstOptionId];
                          const isGroupVoteConsistent = item.options.every(
                            (opt: any) => votes[opt.id] === groupVote,
                          );
                          const effectiveVote = isGroupVoteConsistent ? groupVote : undefined;

                          // Stats agrégées pour le groupe (moyenne ou somme ?)
                          // Pour l'affichage simplifié, on peut prendre les stats de la première option ou une agrégation
                          // Ici on va tricher un peu et utiliser un faux optionId pour l'affichage,
                          // mais on gère le click pour toutes les options

                          return (
                            <VoteOptionDesktop
                              key={`group-${index}`}
                              option={{
                                ...item.options[0], // Utiliser la première option comme base
                                id: `group-${index}`, // ID virtuel pour l'affichage
                                date_group_label: groupLabel, // Utiliser le champ standard
                                date_group: item.data.dates, // 🔧 Passer toutes les dates du groupe
                              }}
                              index={index}
                              userVote={effectiveVote}
                              userHasVoted={item.options.some((opt: any) => userHasVoted[opt.id])}
                              handleVote={(virtualId: string, voteType: VoteType) => {
                                // Appliquer le vote à TOUTES les options du groupe
                                item.options.forEach((opt: any) => {
                                  logger.debug("Vote groupé", "vote", {
                                    optionId: opt.id,
                                    voteType,
                                  });
                                  handleVote(opt.id, voteType);
                                });
                              }}
                              getStatsWithUser={(id) => getStatsWithUser(item.options[0].id)} // Stats de la 1ère option pour l'instant
                              getExistingStats={(id) => getExistingStats(item.options[0].id)}
                              getRanking={() => ({})} // Pas de ranking pour les groupes pour l'instant
                            />
                          );
                        } else {
                          // Rendu individuel standard
                          return (
                            <VoteOptionDesktop
                              key={item.data.id}
                              option={item.data}
                              index={index}
                              userVote={votes[item.data.id]}
                              userHasVoted={userHasVoted[item.data.id]}
                              handleVote={(optionId: string, voteType: VoteType) => {
                                logger.debug("Vote cliqué", "vote", { optionId, voteType });
                                handleVote(optionId, voteType);
                              }}
                              getStatsWithUser={getStatsWithUser}
                              getExistingStats={getExistingStats}
                              getRanking={(type: string) => {
                                if (type === "all") {
                                  // ... (logique existante)
                                  return {};
                                }
                                return {};
                              }}
                            />
                          );
                        }
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bouton de validation - directement après le tableau */}
            {!showForm && (
              <div className="flex justify-center mt-4 max-w-3xl mx-auto">
                <button
                  className="px-6 py-2.5 text-sm rounded-lg font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowForm(true)}
                  data-testid="open-voter-form"
                >
                  {remainingVotes > 0 && userTotalVotes > 0
                    ? `Envoyer mes votes (${userTotalVotes}/${options.length})`
                    : "Envoyer mes votes"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Vue Mobile : Cartes empilées */
          <div className="px-4 space-y-1.5 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-medium text-gray-400">Options disponibles</h3>
              <div className="text-xs text-gray-500">Swipez pour voter</div>
            </div>

            {(() => {
              // Logique de groupement (dupliquée pour l'instant, idéalement factorisée)
              const processedOptionIds = new Set<string>();
              const groups: any[] = [];

              if (poll?.dateGroups && poll.dateGroups.length > 0) {
                poll.dateGroups.forEach((group) => {
                  const groupOptions = options.filter((opt) =>
                    group.dates.includes(opt.option_date),
                  );
                  if (groupOptions.length > 0) {
                    groups.push({
                      type: "group",
                      data: group,
                      options: groupOptions,
                      sortDate: group.dates[0],
                    });
                    groupOptions.forEach((opt) => processedOptionIds.add(opt.id));
                  }
                });
              }

              options.forEach((opt) => {
                if (!processedOptionIds.has(opt.id)) {
                  groups.push({
                    type: "single",
                    data: opt,
                    options: [opt],
                    sortDate: opt.option_date,
                  });
                }
              });

              groups.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

              // ⚠️ WARNING: Toujours vérifier les clés dupliquées (même en production)
              const allIdsMobile = groups.map((item) =>
                item.type === "group" ? `group-${groups.indexOf(item)}` : item.data.id,
              );
              const duplicateIdsMobile = allIdsMobile.filter(
                (id, index) => allIdsMobile.indexOf(id) !== index,
              );

              if (duplicateIdsMobile.length > 0) {
                logger.warn("IDs dupliqués détectés dans VotingSwipe Mobile", "vote", {
                  duplicateIdsMobile,
                });
              }

              // Vérifier aussi les clés basées sur date + time slots
              const duplicateDateKeysMobile = groups
                .filter((item) => item.type === "single")
                .map((item) => {
                  const opt = item.data;
                  return opt.time_slots?.[0]
                    ? `${opt.option_date}-${opt.time_slots[0].hour}-${opt.time_slots[0].minute}`
                    : opt.option_date;
                })
                .filter((key, index, arr) => arr.indexOf(key) !== index);

              if (duplicateDateKeysMobile.length > 0) {
                logger.warn(
                  "Clés basées sur date+time dupliquées dans VotingSwipe Mobile",
                  "vote",
                  { duplicateDateKeysMobile },
                );
              }

              return groups.map((item, index) => {
                if (item.type === "group") {
                  const groupLabel = item.data.label;
                  const firstOptionId = item.options[0].id;
                  const groupVote = votes[firstOptionId];
                  const isGroupVoteConsistent = item.options.every(
                    (opt: any) => votes[opt.id] === groupVote,
                  );
                  const effectiveVote = isGroupVoteConsistent ? groupVote : undefined;

                  return (
                    <VoteOption
                      key={`group-${index}`}
                      option={{
                        ...item.options[0],
                        id: `group-${index}`,
                        date_group_label: groupLabel, // Utiliser le champ standard
                      }}
                      index={index}
                      userVote={effectiveVote}
                      userHasVoted={item.options.some((opt: any) => userHasVoted[opt.id])}
                      handleVote={(virtualId: string, voteType: VoteType) => {
                        item.options.forEach((opt: any) => {
                          handleVote(opt.id, voteType);
                        });
                      }}
                      getStatsWithUser={(id) => getStatsWithUser(item.options[0].id)}
                      getExistingStats={(id) => getExistingStats(item.options[0].id)}
                      getRanking={() => ({})}
                      anyUserHasVoted={Object.values(userHasVoted).some((voted) => voted)}
                    />
                  );
                } else {
                  return (
                    <VoteOption
                      key={item.data.id}
                      option={item.data}
                      index={index}
                      userVote={votes[item.data.id]}
                      userHasVoted={userHasVoted[item.data.id]}
                      handleVote={(optionId: string, voteType: VoteType) => {
                        logger.debug("Vote cliqué", "vote", { optionId, voteType });
                        handleVote(optionId, voteType);
                      }}
                      getStatsWithUser={getStatsWithUser}
                      getExistingStats={getExistingStats}
                      getRanking={(type: string) => {
                        // ... (logique existante)
                        return {};
                      }}
                      anyUserHasVoted={Object.values(userHasVoted).some((voted) => voted)}
                    />
                  );
                }
              });
            })()}
          </div>
        )}
      </div>

      {/* Bouton de validation - mobile uniquement (desktop est dans le tableau) */}
      {!showForm && !isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e1e1e] border-t border-gray-700 shadow-lg">
          <button
            className="w-full py-4 rounded-lg font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setShowForm(true)}
            data-testid="open-voter-form"
          >
            {remainingVotes > 0 && userTotalVotes > 0
              ? `Envoyer mes votes (${userTotalVotes}/${options.length})`
              : "Envoyer mes votes"}
          </button>
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <VoterForm
          onSubmit={handleSubmit}
          onBack={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
          formErrors={formErrors}
          votes={votes}
          options={options}
          userHasVoted={userHasVoted}
          getVoteText={getVoteText}
          setVoterInfo={setVoterInfoData}
          voterInfo={voterInfo}
        />
      )}
    </div>
  );
};

export default VotingSwipe;
