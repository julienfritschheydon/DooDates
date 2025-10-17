import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FormPollCreator, {
  type FormPollDraft,
} from "@/components/polls/FormPollCreator";
import { getAllPolls } from "@/lib/pollStorage";

export default function FormCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<any>(null);
  const { toast } = useToast();

  const initialDraft = useMemo<FormPollDraft | undefined>(() => {
    if (!editId) return undefined;
    const existing = getAllPolls().find(
      (p) => p.id === editId && p.type === "form",
    );
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
    // Utiliser le poll sauvegardé directement passé par le callback
    if (!savedPoll) {
      console.error("❌ Poll non fourni après finalisation!");
      return;
    }

    setPublishedPoll(savedPoll);
    setPublished(true);
  };

  if (published && publishedPoll) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20">
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
              {/* Icône de succès */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
              </div>

              {/* Message de succès */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Formulaire publié !
                </h1>
                <p className="text-gray-600">
                  Votre formulaire "{publishedPoll.title}" est maintenant actif
                  et prêt à recevoir des réponses.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                >
                  <Check className="w-5 h-5" />
                  Aller au Dashboard
                </Link>
                <Link
                  to={`/poll/${publishedPoll.id}/vote`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Voir le formulaire
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Lien du formulaire :
                </p>
                <div className="flex gap-2 items-center justify-center">
                  <code className="px-4 py-2 bg-gray-100 rounded text-sm font-mono text-gray-800">
                    {window.location.origin}/poll/{publishedPoll.id}/vote
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/poll/${publishedPoll.id}/vote`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Lien copié !",
                        description:
                          "Le lien du formulaire a été copié dans le presse-papiers.",
                      });
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
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
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <FormPollCreator
            initialDraft={initialDraft}
            onCancel={handleCancel}
            onSave={handleSave}
            onFinalize={handleFinalize}
          />
        </div>
      </div>
    </div>
  );
}
