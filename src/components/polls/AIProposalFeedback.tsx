import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface AIProposalFeedbackProps {
  proposal: {
    userRequest: string;
    generatedContent: any;
    pollContext?: {
      pollId?: string;
      pollTitle?: string;
      pollType?: string;
    };
  };
  onFeedbackSent?: () => void;
}

export function AIProposalFeedback({
  proposal,
  onFeedbackSent,
}: AIProposalFeedbackProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const feedbackReasons = [
    { id: "wrong-options", label: "Les options ne correspondent pas" },
    { id: "wrong-type", label: "Le type de question est incorrect" },
    { id: "unclear-wording", label: "La formulation n'est pas claire" },
    { id: "missing-info", label: "Il manque des informations" },
    { id: "other", label: "Autre problème" },
  ];

  const handleThumbUp = () => {
    // Feedback positif silencieux - pas d'action particulière pour le moment
    // On pourrait tracker ici si besoin futur
    toast({
      title: "Merci pour votre retour !",
    });
  };

  const handleThumbDown = () => {
    setShowFeedbackForm(true);
  };

  const toggleReason = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId],
    );
  };

  const handleSendFeedback = async () => {
    if (selectedReasons.length === 0) {
      toast({
        title: "Veuillez sélectionner au moins une raison",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Préparer les données du feedback
      const feedbackData = {
        userRequest: proposal.userRequest,
        generatedContent: JSON.stringify(proposal.generatedContent, null, 2),
        reasons: selectedReasons.map(
          (id) => feedbackReasons.find((r) => r.id === id)?.label || id,
        ),
        comment: comment.trim(),
        pollContext: proposal.pollContext,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Envoyer via EmailJS
      const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: "service_3l31ox3",
            template_id: "template_ai_feedback", // À créer dans EmailJS
            user_id: "HoNWMyqrINGzjeK6E",
            template_params: {
              subject: "❌ IA Feedback - Proposition rejetée",
              user_request: feedbackData.userRequest,
              generated_content: feedbackData.generatedContent,
              reasons: feedbackData.reasons.join(", "),
              comment: feedbackData.comment || "(Aucun commentaire)",
              poll_id: feedbackData.pollContext?.pollId || "N/A",
              poll_title: feedbackData.pollContext?.pollTitle || "N/A",
              poll_type: feedbackData.pollContext?.pollType || "N/A",
              timestamp: feedbackData.timestamp,
              user_agent: feedbackData.userAgent,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du feedback");
      }

      toast({
        title: "Feedback envoyé",
        description: "Merci ! Nous allons améliorer cette fonctionnalité.",
      });

      // Réinitialiser le formulaire
      setShowFeedbackForm(false);
      setSelectedReasons([]);
      setComment("");

      onFeedbackSent?.();
    } catch (error) {
      console.error("Erreur envoi feedback:", error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le feedback. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (showFeedbackForm) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">
            Qu'est-ce qui ne va pas ?
          </h4>
          <button
            onClick={() => setShowFeedbackForm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {feedbackReasons.map((reason) => (
            <label
              key={reason.id}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason.id)}
                onChange={() => toggleReason(reason.id)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">{reason.label}</span>
            </label>
          ))}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commentaire (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Précisez ce qui ne va pas..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSendFeedback}
            disabled={isSending || selectedReasons.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSending ? "Envoi..." : "Envoyer le feedback"}
          </button>
          <button
            onClick={() => setShowFeedbackForm(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 ml-2">
      <button
        onClick={handleThumbUp}
        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
        title="Proposition correcte"
        aria-label="Thumb up"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={handleThumbDown}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Proposition à améliorer"
        aria-label="Thumb down"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}
