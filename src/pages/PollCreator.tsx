import React, { useMemo, useState } from "react";
import PollCreatorComponent from "@/components/PollCreator";
import FormPollCreator, {
  type FormPollDraft,
  type AnyFormQuestion,
} from "@/components/polls/FormPollCreator";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllPolls,
  savePolls,
  type Poll as StoragePoll,
  type FormQuestionShape,
} from "@/lib/pollStorage";

const PollCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(location.search);
  const isForm = (params.get("type") || "").toLowerCase() === "form";
  const draftIdParam = params.get("draftId") || undefined;

  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<StoragePoll | null>(null);

  // Helper to convert AnyFormQuestion to FormQuestionShape
  const convertToFormQuestionShape = (questions: AnyFormQuestion[]): FormQuestionShape[] => {
    return questions.map((q) => ({
      id: q.id,
      kind: q.type, // Map 'type' to 'kind'
      title: q.title,
      required: q.required,
      options: (q as any).options,
      maxChoices: (q as any).maxChoices,
      placeholder: (q as any).placeholder,
      maxLength: (q as any).maxLength,
    }));
  };

  const upsertFormPollFromDraft = (draft: FormPollDraft, targetStatus: StoragePoll["status"]) => {
    const all = getAllPolls();
    const existingIndex = all.findIndex((p) => p.id === draft.id);

    const now = new Date().toISOString();
    const random = Math.random().toString(36).slice(2);
    const mkSlug = () =>
      (draft.title || "form").toLowerCase().trim().replace(/\s+/g, "-") +
      `-${Date.now().toString(36)}-${random}`;

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      const updated: StoragePoll = {
        ...existing,
        title: draft.title.trim(),
        type: "form",
        questions: convertToFormQuestionShape(draft.questions),
        status: targetStatus || existing.status || "draft",
        updated_at: now,
      };
      all[existingIndex] = updated;
      savePolls(all);
      return updated;
    }

    const created: StoragePoll = {
      id: draft.id, // réutiliser l'id du brouillon comme id local
      creator_id: "anonymous",
      title: draft.title.trim() || "Sans titre",
      slug: mkSlug(),
      created_at: now,
      updated_at: now,
      description: undefined,
      status: targetStatus || "draft",
      type: "form",
      dates: [],
      questions: convertToFormQuestionShape(draft.questions),
    };
    all.push(created);
    savePolls(all);
    return created;
  };

  const latestFormDraft: FormPollDraft | undefined = useMemo(() => {
    try {
      const all = getAllPolls();
      const forms = all.filter((p) => (p as StoragePoll).type === "form");
      if (forms.length === 0) return undefined;
      if (draftIdParam) {
        const found = forms.find((p) => p.id === draftIdParam);
        if (found)
          return {
            id: found.id,
            type: "form",
            title: found.title || "",
            questions: (found as any)?.questions || [],
          } as FormPollDraft;
      }
      const last = forms[forms.length - 1];
      return {
        id: last.id,
        type: "form",
        title: last.title || "",
        questions: (last as any)?.questions || [],
      } as FormPollDraft;
    } catch {
      return undefined;
    }
  }, [location.key, draftIdParam]);

  // Écran de succès après publication
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
                <h1 className="text-3xl font-bold text-white mb-2">
                  {publishedPoll.type === "form" ? "Formulaire publié !" : "Sondage publié !"}
                </h1>
                <p className="text-gray-300">
                  {publishedPoll.type === "form"
                    ? `Votre formulaire "${publishedPoll.title}" est maintenant actif et prêt à recevoir des réponses.`
                    : `Votre sondage "${publishedPoll.title}" est maintenant actif et prêt à recevoir des votes.`}
                </p>
              </div>

              {/* Message d'information pour la bêta */}
              <div className="p-4 bg-blue-500/10 border border-blue-600/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Information bêta</span>
                </div>
                <p className="text-sm text-blue-300 mt-1">
                  Pour finaliser et partager votre {publishedPoll.type === "form" ? "formulaire" : "sondage"}, après la bêta, vous devrez vous connecter ou créer un compte.
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
                  {publishedPoll.type === "form" ? "Voir le formulaire" : "Voir le sondage"}
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Lien de partage :</p>
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
                        description: "Le lien a été copié dans le presse-papiers.",
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
    <div className="min-h-screen bg-gray-50">
      {isForm ? (
        <FormPollCreator
          initialDraft={latestFormDraft}
          onCancel={() => navigate("/")}
          onSave={(draft) => {
            upsertFormPollFromDraft(draft, "draft");
            // Rester sur la page pour continuer l'édition
          }}
          onFinalize={(draft) => {
            // Créer le poll actif AVANT de supprimer les brouillons
            const savedPoll = upsertFormPollFromDraft(draft, "active");

            // Supprimer les anciens brouillons (mais garder le poll actif qu'on vient de créer)
            const all = getAllPolls();
            const withoutOldDrafts = all.filter(
              (p) => !(p.id === draft.id && p.status === "draft"),
            );
            savePolls(withoutOldDrafts);

            setPublishedPoll(savedPoll);
            setPublished(true);
          }}
        />
      ) : (
        <PollCreatorComponent
          onBack={(createdPoll?: any) => {
            if (createdPoll) {
              setPublishedPoll(createdPoll);
              setPublished(true);
            } else {
              navigate("/");
            }
          }}
        />
      )}
    </div>
  );
};

export default PollCreator;
