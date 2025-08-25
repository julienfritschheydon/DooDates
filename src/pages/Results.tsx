import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart3, Users, Calendar, ArrowLeft, Vote } from "lucide-react";
import TopNav from "../components/TopNav";

interface VoteData {
  poll_id: string;
  voter_email: string;
  voter_name: string;
  vote_data: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}

interface Poll {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  settings?: {
    selectedDates?: string[];
    timeSlotsByDate?: Record<string, any[]>;
  };
}

const Results: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    // Charger le sondage
    const existingPolls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
    const foundPoll = existingPolls.find((p: Poll) => p.slug === slug);

    if (foundPoll) {
      setPoll(foundPoll);

      // Charger les votes et filtrer seulement les dates du sondage
      const existingVotes = JSON.parse(
        localStorage.getItem("dev-votes") || "[]",
      );
      const pollVotes = existingVotes.filter((vote: VoteData) => {
        if (vote.poll_id !== foundPoll.id) return false;

        // Filtrer les votes pour ne garder que les dates du sondage
        if (foundPoll.settings?.selectedDates) {
          const filteredVoteData: Record<string, "yes" | "no" | "maybe"> = {};
          Object.keys(vote.vote_data).forEach((optionId) => {
            // Extraire la date de l'option ID ou utiliser une logique de mapping
            const optionIndex = parseInt(optionId.replace("option-", ""));
            if (
              !isNaN(optionIndex) &&
              foundPoll.settings?.selectedDates?.[optionIndex]
            ) {
              filteredVoteData[optionId] = vote.vote_data[optionId];
            }
          });
          return Object.keys(filteredVoteData).length > 0;
        }
        return true;
      });
      setVotes(pollVotes);
    }

    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sondage non trouvé
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:text-blue-800"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const getAllDates = () => {
    // Utiliser uniquement les dates du sondage depuis settings.selectedDates
    if (poll?.settings?.selectedDates) {
      return poll.settings.selectedDates.sort();
    }

    // Fallback: dates depuis les votes (ancien comportement)
    const dates = new Set<string>();
    votes.forEach((vote) => {
      Object.keys(vote.vote_data).forEach((optionId) => {
        const optionIndex = parseInt(optionId.replace("option-", ""));
        if (
          !isNaN(optionIndex) &&
          poll?.settings?.selectedDates?.[optionIndex]
        ) {
          dates.add(poll.settings.selectedDates[optionIndex]);
        }
      });
    });

    return Array.from(dates).sort();
  };

  const getVoteStats = (date: string) => {
    // Trouver l'index de la date dans selectedDates pour mapper aux option IDs
    const dateIndex = poll?.settings?.selectedDates?.indexOf(date);
    if (dateIndex === -1 || dateIndex === undefined) {
      return { yes: 0, no: 0, maybe: 0, total: 0 };
    }

    const optionId = `option-${dateIndex}`;
    const dateVotes = votes
      .map((vote) => vote.vote_data[optionId])
      .filter(Boolean);
    const yes = dateVotes.filter((v) => v === "yes").length;
    const no = dateVotes.filter((v) => v === "no").length;
    const maybe = dateVotes.filter((v) => v === "maybe").length;

    return { yes, no, maybe, total: dateVotes.length };
  };

  const allDates = getAllDates();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Résultats : {poll.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {(() => {
                const uniqueVoters = new Set(votes.map((v) => v.voter_email))
                  .size;
                return uniqueVoters;
              })()}{" "}
              participant
              {(() => {
                const uniqueVoters = new Set(votes.map((v) => v.voter_email))
                  .size;
                return uniqueVoters > 1 ? "s" : "";
              })()}{" "}
              • {allDates.length} date{allDates.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => window.open(`/poll/${slug}`, "_blank")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Vote className="w-4 h-4" />
            Participer au vote
          </button>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    const uniqueVoters = new Set(
                      votes.map((v) => v.voter_email),
                    ).size;
                    return uniqueVoters;
                  })()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Participants</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allDates.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Dates proposées
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    const uniqueVoters = new Set(
                      votes.map((v) => v.voter_email),
                    ).size;
                    return uniqueVoters;
                  })()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Votants uniques
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Résultats par date */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Résultats détaillés
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
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
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {allDates.map((date) => {
                  const stats = getVoteStats(date);
                  const maxVotes = Math.max(stats.yes, stats.maybe, stats.no);

                  return (
                    <tr
                      key={date}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${stats.yes === maxVotes && stats.yes > 0 ? "bg-green-500" : "bg-green-300"}`}
                          ></div>
                          {stats.yes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${stats.maybe === maxVotes && stats.maybe > 0 ? "bg-yellow-500" : "bg-yellow-300"}`}
                          ></div>
                          {stats.maybe}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-300"></div>
                          {stats.no}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {stats.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table des votes par participant */}
        {votes.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Votes par participant
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
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
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    const uniqueVoters = Array.from(
                      new Set(votes.map((v) => v.voter_email)),
                    )
                      .map(
                        (email) => votes.find((v) => v.voter_email === email)!,
                      )
                      .sort((a, b) => a.voter_name.localeCompare(b.voter_name));

                    return uniqueVoters.map((vote, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {vote.voter_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {vote.voter_name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(vote.created_at).toLocaleDateString(
                                  "fr-FR",
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        {allDates.map((date) => {
                          const voteValue = vote.vote_data[date];
                          return (
                            <td
                              key={date}
                              className="px-6 py-4 whitespace-nowrap text-center"
                            >
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
                                <span className="text-gray-400 dark:text-gray-500">
                                  -
                                </span>
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
      </div>
    </div>
  );
};

export default Results;
