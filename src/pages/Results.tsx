import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart3, Users, Calendar, ArrowLeft } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import PollActions from "@/components/polls/PollActions";
import { Poll, getPollBySlugOrId, getCurrentUserId, getVoterId, getAllPolls } from "@/lib/pollStorage";
import FormPollResults from "@/components/polls/FormPollResults";
import ResultsLayout from "@/components/polls/ResultsLayout";
import { ResultsEmpty, ResultsLoading } from "@/components/polls/ResultsStates";
import { ResultsAccessDenied } from "@/components/polls/ResultsAccessDenied";
import { useResultsAccess } from "@/hooks/useResultsAccess";
import { logger } from "@/lib/logger";

interface VoteData {
  poll_id: string;
  voter_email: string;
  voter_name: string;
  vote_data: Record<string, "yes" | "no" | "maybe">;
  selections?: Record<string, "yes" | "no" | "maybe">; // Support pour structure alternative
  created_at: string;
}

// Le type Poll est importé depuis lib/pollStorage pour cohérence

const Results: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Hooks doivent être appelés AVANT tout return conditionnel
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  // Vérifier le type de poll pour le routing
  const pollForTypeCheck = slug ? getPollBySlugOrId(slug) : null;
  const isFormPoll = pollForTypeCheck?.type === "form";
  const isAvailabilityPoll = pollForTypeCheck?.type === "availability";

  // Vérifier l'accès aux résultats
  const accessStatus = useResultsAccess(poll, hasVoted);

  // Enforcer: un sondage doit avoir des dates. Pas de fallback synthétique ici.

  useEffect(() => {
    if (!slug) return;

    // Charger le sondage depuis le stockage unifié
    const existingPolls = getAllPolls();
    const foundPoll = existingPolls.find((p: Poll) => p.slug === slug);

    if (foundPoll) {
      setPoll(foundPoll);

      // Charger les votes et filtrer seulement les dates du sondage
      const existingVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
      const pollVotes = existingVotes.filter((vote: VoteData) => {
        if (vote.poll_id !== foundPoll.id) return false;

        // Filtrer les votes pour ne garder que les dates du sondage
        if (foundPoll.settings?.selectedDates && foundPoll.settings.selectedDates.length > 0) {
          const filteredVoteData: Record<string, "yes" | "no" | "maybe"> = {};
          Object.keys(vote.vote_data).forEach((optionId) => {
            // Extraire la date de l'option ID ou utiliser une logique de mapping
            const optionIndex = parseInt(optionId.replace("option-", ""));
            if (!isNaN(optionIndex) && foundPoll.settings?.selectedDates?.[optionIndex]) {
              filteredVoteData[optionId] = vote.vote_data[optionId];
            }
          });
          return Object.keys(filteredVoteData).length > 0;
        }
        return true;
      });
      setVotes(pollVotes);

      // Vérifier si l'utilisateur actuel a voté
      const currentUserId = getCurrentUserId();
      const userHasVoted = pollVotes.some((vote: VoteData) => {
        // Vérifier par voter_email ou par un identifiant stocké
        return (
          vote.voter_email === currentUserId || localStorage.getItem(`voted-${foundPoll.id}`) === "true"
        );
      });
      setHasVoted(userHasVoted);
    }

    setLoading(false);
  }, [slug]);

  // Router vers résultats FormPoll si nécessaire (après tous les hooks)
  if (isFormPoll && slug) {
    return <FormPollResults idOrSlug={slug} />;
  }

  // Router vers résultats AvailabilityPoll si nécessaire
  if (isAvailabilityPoll && slug) {
    const AvailabilityPollResults = React.lazy(() => import("./AvailabilityPollResults"));
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-white">Chargement...</div>
          </div>
        }
      >
        <AvailabilityPollResults />
      </React.Suspense>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-8">
        <div className="pt-20">
          <ResultsLoading label="Chargement des résultats..." />
        </div>
      </div>
    );
  }

  // Vérifier l'accès aux résultats
  if (!accessStatus.allowed) {
    const deniedStatus = accessStatus as { allowed: false; reason: string; message: string };
    return (
      <ResultsAccessDenied
        message={deniedStatus.message}
        pollSlug={slug}
        showVoteButton={deniedStatus.reason === "not-voted"}
      />
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-8">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <ResultsEmpty
              message={<>Sondage introuvable.</>}
              action={
                <button
                  onClick={() => navigate("/date-polls/dashboard")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  data-testid="dashboard-button"
                >
                  Retour au tableau de bord
                </button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const getAllDates = () => {
    return poll?.settings?.selectedDates ? [...poll.settings.selectedDates].sort() : [];
  };

  const getVoteStats = (date: string) => {
    // Trouver l'index de la date dans selectedDates pour mapper aux option IDs
    const dates = poll?.settings?.selectedDates || [];
    const dateIndex = dates.indexOf(date);
    if (dateIndex < 0) return { yes: 0, no: 0, maybe: 0, total: 0 };

    const optionId = `option-${dateIndex}`;

    // Debug: Log pour comprendre la structure
    logger.debug("getVoteStats Debug", "vote", {
      date,
      dateIndex,
      optionId,
      allVotes: votes.length,
    });

    // Extraire les votes pour cette option
    const dateVotes = votes
      .map((vote) => {
        // Supporter les deux structures: vote_data (localStorage brut) et selections (mappé)
        const voteValue = vote.vote_data?.[optionId] || vote.selections?.[optionId];
        logger.debug("Vote detail", "vote", { voter: vote.voter_name, optionId, voteValue });
        return voteValue;
      })
      .filter(Boolean);

    const yes = dateVotes.filter((v) => v === "yes").length;
    const no = dateVotes.filter((v) => v === "no").length;
    const maybe = dateVotes.filter((v) => v === "maybe").length;

    logger.debug("Vote result", "vote", { yes, no, maybe, total: dateVotes.length });

    return { yes, no, maybe, total: dateVotes.length };
  };

  const allDates = getAllDates();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="pt-20">
        <ResultsLayout
          title={`Résultats : ${poll.title}`}
          subtitle={
            <>
              {(() => {
                const uniqueVoters = new Set(votes.map((v) => getVoterId(v))).size;
                return uniqueVoters;
              })()}{" "}
              participant
              {(() => {
                const uniqueVoters = new Set(votes.map((v) => getVoterId(v))).size;
                return uniqueVoters > 1 ? "s" : "";
              })()}{" "}
              • {allDates.length} date{allDates.length > 1 ? "s" : ""}
            </>
          }
          actions={
            <PollActions poll={poll} showVoteButton onAfterDelete={() => navigate("/dashboard")} />
          }
          onClose={() => navigate("/dashboard")}
          kpis={[
            {
              label: "Participants",
              value: (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>{new Set(votes.map((v) => getVoterId(v))).size}</span>
                </div>
              ),
            },
            {
              label: "Dates proposées",
              value: (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>{allDates.length}</span>
                </div>
              ),
            },
            {
              label: "Votants uniques",
              value: (
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span>{new Set(votes.map((v) => getVoterId(v))).size}</span>
                </div>
              ),
            },
          ]}
        >
          {/* Résultats par date */}
          <div className="bg-[#1e1e1e] rounded-lg shadow overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Résultats détaillés</h2>
            </div>
            {allDates.length === 0 ? (
              <div className="p-6">
                <ResultsEmpty
                  message={<>Ce sondage n'a aucune date configurée.</>}
                  action={
                    <button
                      onClick={() => navigate("/date-polls/dashboard")}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      data-testid="dashboard-button"
                    >
                      Retour au tableau de bord
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-[#0a0a0a]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Oui
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Peut-être
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Non
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1e1e1e] divide-y divide-gray-700">
                    {allDates.map((date) => {
                      const stats = getVoteStats(date);
                      const maxVotes = Math.max(stats.yes, stats.maybe, stats.no);

                      return (
                        <tr key={date} className="hover:bg-[#2a2a2a]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {new Date(date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${stats.yes === maxVotes && stats.yes > 0 ? "bg-green-500" : "bg-green-300"}`}
                              ></div>
                              {stats.yes}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${stats.maybe === maxVotes && stats.maybe > 0 ? "bg-yellow-500" : "bg-yellow-300"}`}
                              ></div>
                              {stats.maybe}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-300"></div>
                              {stats.no}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {stats.total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table des votes par participant */}
          {votes.length > 0 && allDates.length > 0 && (
            <div className="mt-8 bg-[#1e1e1e] rounded-lg shadow overflow-hidden border border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Votes par participant
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Participant
                      </th>
                      {allDates.map((date) => (
                        <th
                          key={date}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          {new Date(date).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-[#1e1e1e] divide-y divide-gray-700">
                    {(() => {
                      const byId = new Map<string, (typeof votes)[number]>();
                      for (const v of votes) {
                        const id = getVoterId(v);
                        if (!byId.has(id)) byId.set(id, v);
                      }
                      const uniqueVoters = Array.from(byId.values()).sort((a, b) =>
                        a.voter_name.localeCompare(b.voter_name),
                      );

                      return uniqueVoters.map((vote, index) => (
                        <tr key={index} className="hover:bg-[#2a2a2a]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {vote.voter_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white">{vote.voter_name}</p>
                                <p className="text-sm text-gray-400">
                                  {new Date(vote.created_at).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                          </td>
                          {allDates.map((date) => {
                            // Mapper la date vers l'optionId correspondant (option-<index>) via selectedDates
                            const dates = poll?.settings?.selectedDates || [];
                            const dateIndex = dates.indexOf(date);
                            const optionId = dateIndex >= 0 ? `option-${dateIndex}` : undefined;
                            const voteValue = optionId ? vote.vote_data[optionId] : undefined;
                            return (
                              <td key={date} className="px-6 py-4 whitespace-nowrap text-center">
                                {voteValue ? (
                                  <span
                                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                      voteValue === "yes"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : voteValue === "maybe"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    }`}
                                  >
                                    {voteValue === "yes"
                                      ? "Oui"
                                      : voteValue === "maybe"
                                        ? "Peut-être"
                                        : "Non"}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ResultsLayout>
      </div>
    </div>
  );
};

export default Results;
