import React, { useState } from "react";
import { Calendar, Clock, Users, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import PollCreator from "../PollCreator";
import FormPollCreator from "../polls/FormPollCreator";
import { useEditorActions } from "./EditorStateProvider";
import { useToast } from "@/hooks/use-toast";
import { addPoll } from "@/lib/pollStorage";
import { logger } from "@/lib/logger";

interface PollPreviewProps {
  poll: any;
}

/**
 * Composant Preview pour afficher l'interface d'édition du sondage
 * Utilise les composants existants PollCreator/FormPollCreator
 */
export function PollPreview({ poll }: PollPreviewProps) {
  const { setCurrentPoll } = useEditorActions();
  const { toast } = useToast();
  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<any>(null);

  // Écran de succès après publication (Session 2)
  if (published && publishedPoll) {
    const pollType = publishedPoll.type === "form" ? "Formulaire" : "Sondage";
    const pollUrl = `/poll/${publishedPoll.slug || publishedPoll.id}`;

    return (
      <div className="min-h-[400px] bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="bg-[#3c4043] rounded-lg border border-gray-700 p-8 text-center space-y-6">
            {/* Icône de succès */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-500" />
              </div>
            </div>

            {/* Message de succès */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{pollType} publié !</h1>
              <p className="text-gray-300">
                "{publishedPoll.title}" est maintenant actif et prêt à recevoir des réponses.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg"
              >
                <Check className="w-5 h-5" />
                Aller au Tableau de bord
              </Link>
              <Link
                to={pollUrl}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-gray-300 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Voir le {pollType.toLowerCase()}
              </Link>
            </div>

            {/* Lien de partage */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-3">Lien du {pollType.toLowerCase()} :</p>
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                <code className="px-4 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                  {window.location.origin}
                  {pollUrl}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}${pollUrl}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "✅ Lien copié !",
                      description: "Le lien a été copié dans le presse-papiers.",
                    });
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="bg-[#1e1e1e] p-8 rounded-lg border-2 border-dashed border-gray-700 text-center">
        <p className="text-gray-400">Aucun sondage sélectionné</p>
      </div>
    );
  }

  const handleSave = (draft: any) => {
    try {
      // Mettre à jour le poll avec les nouvelles données
      const updatedPoll = {
        ...poll,
        ...draft,
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder dans localStorage
      addPoll(updatedPoll);

      // Mettre à jour le contexte
      setCurrentPoll(updatedPoll);

      toast({
        title: "✅ Brouillon enregistré",
        description: "Votre questionnaire a été sauvegardé avec succès.",
      });
    } catch (error) {
      logger.error("Erreur sauvegarde", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de sauvegarder le questionnaire.",
        variant: "destructive",
      });
    }
  };

  const handleFinalize = (draft: any, savedPoll?: any) => {
    try {
      // Utiliser le poll sauvegardé s'il est fourni (FormPollCreator), sinon créer
      const finalizedPoll = savedPoll || {
        ...poll,
        ...draft,
        status: "active" as const,
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder dans localStorage si pas déjà fait
      if (!savedPoll) {
        addPoll(finalizedPoll);
      }

      // Mettre à jour le contexte
      setCurrentPoll(finalizedPoll);

      // Afficher l'écran de succès (Session 2)
      setPublishedPoll(finalizedPoll);
      setPublished(true);
    } catch (error) {
      logger.error("Erreur finalisation", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de finaliser le questionnaire.",
        variant: "destructive",
      });
    }
  };

  // Preview pour sondage de dates - UTILISER L'EXPÉRIENCE EXISTANTE
  if (poll.type === "date" || poll.type === "datetime") {
    // Convertir le format StoragePoll vers le format attendu par PollCreator
    const initialData = {
      title: poll.title,
      type: poll.type,
      dates: poll.dates || poll.settings?.selectedDates || [],
      timeSlots: poll.settings?.timeSlotsByDate
        ? Object.entries(poll.settings.timeSlotsByDate).flatMap(([date, slots]: [string, any]) =>
            slots.map((slot: any) => {
              // Calculer l'heure de fin en fonction de la durée si disponible
              // Sinon, par défaut 1 heure
              const duration = slot.duration || 60; // durée en minutes
              const endHour = slot.hour + Math.floor(duration / 60);
              const endMinute = slot.minute + (duration % 60);

              return {
                start: `${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`,
                end: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`,
                dates: [date],
              };
            }),
          )
        : [],
    };

    return (
      <div className="bg-[#0a0a0a] rounded-lg shadow-sm">
        {/* <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Édition du sondage</h3>
          <p className="text-sm text-gray-600">Utilisez l'interface familière de DooDates</p>
        </div> */}

        {/* Utiliser le PollCreator existant */}
        {/* Key basée sur updated_at pour forcer le remontage quand le poll change */}
        <PollCreator
          key={`${poll.id}-${poll.updated_at}`}
          initialData={initialData}
          onBack={(createdPoll) => {
            // Callback appelé après finalisation (Session 2)
            if (createdPoll) {
              handleFinalize({}, createdPoll);
            }
          }}
        />
      </div>
    );
  }

  // Preview pour questionnaire/formulaire - UTILISER L'EXPÉRIENCE EXISTANTE
  if (poll.type === "form") {
    return (
      <div className="bg-[#0a0a0a] rounded-lg shadow-sm" data-poll-preview>
        {/* <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Édition du questionnaire</h3>
          <p className="text-sm text-gray-600">Utilisez l'interface familière de DooDates</p>
        </div> */}

        {/* Utiliser le FormPollCreator existant */}
        <FormPollCreator
          key={`form-${poll.id}-${poll.questions?.length || 0}-${poll.updated_at}-${Date.now()}`}
          initialDraft={poll}
          onSave={handleSave}
          onFinalize={handleFinalize}
        />
      </div>
    );
  }

  // Fallback pour types inconnus
  return (
    <div className="bg-[#1e1e1e] p-8 rounded-lg border-2 border-dashed border-gray-700 text-center">
      <p className="text-gray-400">Type de sondage non supporté: {poll.type}</p>
    </div>
  );
}
