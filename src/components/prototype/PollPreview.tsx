import { Calendar, Clock, Users } from "lucide-react";
import PollCreator from "../PollCreator";
import FormPollCreator from "../polls/FormPollCreator";
import { useConversation } from "./ConversationProvider";
import { useToast } from "@/hooks/use-toast";
import { addPoll } from "@/lib/pollStorage";

interface PollPreviewProps {
  poll: any;
}

/**
 * Composant Preview pour afficher l'interface d'édition du sondage
 * Utilise les composants existants PollCreator/FormPollCreator
 */
export function PollPreview({ poll }: PollPreviewProps) {
  const { updatePoll: updateContextPoll } = useConversation();
  const { toast } = useToast();

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
      updateContextPoll(updatedPoll);

      toast({
        title: "✅ Brouillon enregistré",
        description: "Votre questionnaire a été sauvegardé avec succès.",
      });
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de sauvegarder le questionnaire.",
        variant: "destructive",
      });
    }
  };

  const handleFinalize = (draft: any) => {
    try {
      // Finaliser = sauvegarder + changer le statut
      const finalizedPoll = {
        ...poll,
        ...draft,
        status: "published" as const,
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder dans localStorage
      addPoll(finalizedPoll);

      // Mettre à jour le contexte
      updateContextPoll(finalizedPoll);

      toast({
        title: "🎉 Questionnaire finalisé !",
        description: "Votre formulaire est maintenant disponible.",
      });
    } catch (error) {
      console.error("Erreur finalisation:", error);
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
        ? Object.entries(poll.settings.timeSlotsByDate).flatMap(
            ([date, slots]: [string, any]) =>
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
          onBack={() => {}} // Pas de retour dans le preview
        />
      </div>
    );
  }

  // Preview pour questionnaire/formulaire - UTILISER L'EXPÉRIENCE EXISTANTE
  if (poll.type === "form") {
    return (
      <div className="bg-[#0a0a0a] rounded-lg shadow-sm">
        {/* <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Édition du questionnaire</h3>
          <p className="text-sm text-gray-600">Utilisez l'interface familière de DooDates</p>
        </div> */}

        {/* Utiliser le FormPollCreator existant */}
        <FormPollCreator
          key={`form-${poll.id}-${poll.questions?.length || 0}-${poll.updated_at}`}
          initialDraft={poll}
          onCancel={() => {}} // Pas d'annulation dans le preview
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
