import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FormPollCreator, { type FormPollDraft } from "@/components/polls/FormPollCreator";
import { getAllPolls } from "@/lib/pollStorage";
import { ErrorFactory, logError } from "@/lib/error-handling";

export default function FormCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<any>(null);
  const { toast } = useToast();

  const initialDraft = useMemo<FormPollDraft | undefined>(() => {
    if (!editId) return undefined;
    const existing = getAllPolls().find((p) => p.id === editId && p.type === "form");
    if (!existing) return undefined;
    return {
      id: existing.id,
      type: "form",
      title: existing.title || "",
      questions: (existing as any).questions || [],
      conditionalRules: (existing as any).conditionalRules || [], // Récupérer les règles conditionnelles
    } as FormPollDraft;
  }, [editId]);

  const handleCancel = () => navigate(-1);
  const handleSave = (_draft: FormPollDraft) => {
    // Saved as draft via FormPollCreator; stay on page
  };
  const handleFinalize = (draft: FormPollDraft, savedPoll?: any) => {
    // Protection contre les finalisations multiples
    if (published) {
      console.warn("⚠️ Formulaire déjà publié, finalisation ignorée");
      return;
    }

    // Utiliser le poll sauvegardé directement passé par le callback
    if (!savedPoll) {
      logError(
        ErrorFactory.validation(
          "Poll non fourni après finalisation",
          "Une erreur s'est produite lors de la finalisation",
        ),
        { component: "FormCreator", operation: "handleFinalize" },
      );
      return;
    }

    // Vérifier si le poll est déjà actif (déjà publié)
    if (savedPoll.status === "active" && publishedPoll?.id === savedPoll.id) {
      console.warn("⚠️ Formulaire déjà publié avec le même ID, finalisation ignorée", {
        pollId: savedPoll.id,
      });
      return;
    }

    setPublishedPoll(savedPoll);
    setPublished(true);
  };

  if (published && publishedPoll) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="bg-[#3c4043] rounded-lg border border-gray-700 p-8 text-center space-y-6">
              {/* Icône de succès */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
              </div>

              {/* Message de succès */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Formulaire publié !</h1>
                <p className="text-gray-300">
                  Votre formulaire "{publishedPoll.title}" est maintenant actif et prêt à recevoir
                  des réponses.
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
                  to={`/poll/${publishedPoll.slug || publishedPoll.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-gray-300 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Voir le formulaire
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Lien du formulaire :</p>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <code className="px-4 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                    {window.location.origin}/poll/{publishedPoll.slug || publishedPoll.id}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/poll/${publishedPoll.slug || publishedPoll.id}`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Lien copié !",
                        description: "Le lien du formulaire a été copié dans le presse-papiers.",
                      });
                    }}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormPollCreator
      initialDraft={initialDraft}
      onCancel={handleCancel}
      onSave={handleSave}
      onFinalize={handleFinalize}
    />
  );
}
