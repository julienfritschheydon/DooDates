import React, { useState, useEffect } from "react";
import {
  fetchPoll,
  fetchPollOptions,
  fetchPollVotes,
  submitVote,
} from "./services/voteService";
import { Poll, SwipeOption, SwipeVote, VoterInfo } from "./utils/types";

/**
 * Composant de test pour vérifier l'enregistrement des votes
 */
const TestVoteSubmission: React.FC = () => {
  // États pour le formulaire de test
  const [pollId, setPollId] = useState<string>("");
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<SwipeOption[]>([]);
  const [votes, setVotes] = useState<Record<string, "yes" | "no" | "maybe">>(
    {},
  );
  const [voterInfo, setVoterInfo] = useState<VoterInfo>({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingVotes, setExistingVotes] = useState<SwipeVote[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Fonction pour ajouter un log
  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toISOString().split("T")[1].split(".")[0]} - ${message}`,
    ]);
  };

  // Fonction pour charger un sondage
  const loadPoll = async () => {
    if (!pollId.trim()) {
      setError("Veuillez entrer un ID de sondage");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPoll(null);
    setOptions([]);
    setExistingVotes([]);
    setVotes({});

    try {
      addLog(`Chargement du sondage avec ID/slug: ${pollId}`);
      const pollData = await fetchPoll(pollId);
      setPoll(pollData);
      addLog(`Sondage chargé: ${pollData.title} (UUID: ${pollData.id})`);

      // Utiliser l'UUID réel du sondage pour charger les options
      addLog(`Chargement des options pour le sondage UUID: ${pollData.id}`);
      const optionsData = await fetchPollOptions(pollData.id);
      setOptions(optionsData);
      addLog(`${optionsData.length} options chargées`);

      // Initialiser les votes à "maybe" par défaut
      const initialVotes: Record<string, "yes" | "no" | "maybe"> = {};
      optionsData.forEach((option) => {
        initialVotes[option.id] = "maybe";
      });
      setVotes(initialVotes);

      // Charger les votes existants
      addLog(
        `Chargement des votes existants pour le sondage UUID: ${pollData.id}`,
      );
      const votesData = await fetchPollVotes(pollData.id);
      setExistingVotes(votesData);
      addLog(`${votesData.length} votes existants chargés`);
    } catch (err) {
      console.error("Erreur lors du chargement du sondage:", err);
      setError(
        `Erreur lors du chargement du sondage: ${err instanceof Error ? err.message : String(err)}`,
      );
      addLog(`❌ Erreur: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour soumettre un vote
  const handleSubmitVote = async () => {
    if (!poll) {
      setError("Aucun sondage chargé");
      return;
    }

    if (!voterInfo.name || !voterInfo.email) {
      setError("Veuillez remplir les informations du votant");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      addLog(`Soumission du vote pour ${voterInfo.name} (${voterInfo.email})`);
      addLog(`Données de vote: ${JSON.stringify(votes)}`);

      const result = await submitVote(poll.id, voterInfo, votes);

      setSuccess(`Vote enregistré avec succès! ID: ${result.id}`);
      addLog(`✅ Vote enregistré avec succès! ID: ${result.id}`);

      // Recharger les votes existants
      const updatedVotes = await fetchPollVotes(poll.id);
      setExistingVotes(updatedVotes);
      addLog(`${updatedVotes.length} votes existants après soumission`);
    } catch (err) {
      console.error("Erreur lors de la soumission du vote:", err);
      setError(
        `Erreur lors de la soumission du vote: ${err instanceof Error ? err.message : String(err)}`,
      );
      addLog(`❌ Erreur: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer un vote
  const handleVoteChange = (
    optionId: string,
    value: "yes" | "no" | "maybe",
  ) => {
    setVotes((prev) => ({
      ...prev,
      [optionId]: value,
    }));
  };

  // Effacer les logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test de Soumission des Votes</h1>

      {/* Formulaire pour charger un sondage */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Charger un sondage</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={pollId}
            onChange={(e) => setPollId(e.target.value)}
            placeholder="ID ou slug du sondage"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2"
          />
          <button
            onClick={loadPoll}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Charger"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {poll && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            2. Informations du sondage
          </h2>
          <div className="mb-4">
            <p>
              <strong>ID:</strong> {poll.id}
            </p>
            <p>
              <strong>Titre:</strong> {poll.title}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {poll.description || "Aucune description"}
            </p>
            <p>
              <strong>Statut:</strong> {poll.status}
            </p>
            <p>
              <strong>Date d'expiration:</strong>{" "}
              {new Date(poll.expires_at).toLocaleString()}
            </p>
          </div>

          <h3 className="text-lg font-medium mb-2">
            Options ({options.length})
          </h3>
          <ul className="mb-4 divide-y divide-gray-200">
            {options.map((option) => (
              <li key={option.id} className="py-2">
                <p>
                  <strong>Date:</strong> {option.option_date}
                </p>
                <p>
                  <strong>Créneaux horaires:</strong>{" "}
                  {option.time_slots
                    ? JSON.stringify(option.time_slots)
                    : "Aucun"}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-medium mb-2">
            Votes existants ({existingVotes.length})
          </h3>
          <ul className="mb-4 divide-y divide-gray-200">
            {existingVotes.map((vote) => (
              <li key={vote.id} className="py-2">
                <p>
                  <strong>Votant:</strong> {vote.voter_name} ({vote.voter_email}
                  )
                </p>
                <p>
                  <strong>Sélections:</strong> {JSON.stringify(vote.selections)}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(vote.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {poll && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">3. Soumettre un vote</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du votant
            </label>
            <input
              type="text"
              value={voterInfo.name}
              onChange={(e) =>
                setVoterInfo((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email du votant
            </label>
            <input
              type="email"
              value={voterInfo.email}
              onChange={(e) =>
                setVoterInfo((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          <h3 className="text-lg font-medium mb-2">Votes</h3>
          <div className="space-y-4 mb-6">
            {options.map((option) => (
              <div
                key={option.id}
                className="p-4 border border-gray-200 rounded-md"
              >
                <p className="font-medium mb-2">Option: {option.option_date}</p>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={votes[option.id] === "yes"}
                      onChange={() => handleVoteChange(option.id, "yes")}
                      className="form-radio h-5 w-5 text-green-600"
                    />
                    <span className="ml-2 text-green-600">Oui</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={votes[option.id] === "maybe"}
                      onChange={() => handleVoteChange(option.id, "maybe")}
                      className="form-radio h-5 w-5 text-yellow-600"
                    />
                    <span className="ml-2 text-yellow-600">Peut-être</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={votes[option.id] === "no"}
                      onChange={() => handleVoteChange(option.id, "no")}
                      className="form-radio h-5 w-5 text-red-600"
                    />
                    <span className="ml-2 text-red-600">Non</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitVote}
            disabled={loading}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Soumission en cours..." : "Soumettre le vote"}
          </button>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-800 text-white rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Logs</h2>
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
          >
            Effacer
          </button>
        </div>
        <div className="bg-gray-900 p-3 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">Aucun log disponible</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestVoteSubmission;
