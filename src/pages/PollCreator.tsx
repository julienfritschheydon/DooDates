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
  type Poll,
  type FormQuestionShape,
  getCurrentUserId,
} from "@/lib/pollStorage";
import { useAuth } from "@/contexts/AuthContext";

const PollCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const params = new URLSearchParams(location.search);
  const isForm = (params.get("type") || "").toLowerCase() === "form";
  const draftIdParam = params.get("draftId") || undefined;

  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<Poll | null>(null);

  // Helper to convert AnyFormQuestion to FormQuestionShape
  const convertToFormQuestionShape = (questions: AnyFormQuestion[]): FormQuestionShape[] => {
    return questions.map((q) => {
      const baseShape: FormQuestionShape = {
        id: q.id,
        kind: q.type, // Map 'type' to 'kind'
        title: q.title,
        required: q.required,
      };

      // Add optional properties if they exist
      if ("options" in q && q.options) {
        baseShape.options = q.options;
      }
      if ("maxChoices" in q) {
        baseShape.maxChoices = q.maxChoices;
      }
      if ("placeholder" in q) {
        baseShape.placeholder = q.placeholder;
      }
      if ("maxLength" in q) {
        baseShape.maxLength = q.maxLength;
      }
      if ("matrixRows" in q) {
        baseShape.matrixRows = q.matrixRows;
      }
      if ("matrixColumns" in q) {
        baseShape.matrixColumns = q.matrixColumns;
      }
      if ("matrixType" in q) {
        baseShape.matrixType = q.matrixType;
      }
      if ("matrixColumnsNumeric" in q) {
        baseShape.matrixColumnsNumeric = q.matrixColumnsNumeric;
      }

      return baseShape;
    });
  };

  const upsertFormPollFromDraft = (draft: FormPollDraft, targetStatus: Poll["status"]) => {
    const all = getAllPolls();
    const existingIndex = all.findIndex((p) => p.id === draft.id);

    const now = new Date().toISOString();
    const random = Math.random().toString(36).slice(2);
    const mkSlug = () =>
      (draft.title || "form").toLowerCase().trim().replace(/\s+/g, "-") +
      `-${Date.now().toString(36)}-${random}`;

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      const updated: Poll = {
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

    const created: Poll = {
      id: draft.id, // réutiliser l'id du brouillon comme id local
      creator_id: getCurrentUserId(user?.id),
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
      const forms = all.filter((p) => (p as Poll).type === "form");
      if (forms.length === 0) return undefined;
      if (draftIdParam) {
        const found = forms.find((p) => p.id === draftIdParam);
        if (found)
          return {
            id: found.id,
            type: "form",
            title: found.title || "",
            questions: found.questions || [],
          } as FormPollDraft;
      }
      const last = forms[forms.length - 1];
      return {
        id: last.id,
        type: "form",
        title: last.title || "",
        questions: last.questions || [],
      } as FormPollDraft;
    } catch {
      return undefined;
    }
  }, [draftIdParam]);

  // Écran de succès après publication
  if (published && publishedPoll) {
    const isForm = publishedPoll.type === "form";
    const colorClass = isForm
      ? "text-violet-600 dark:text-violet-400"
      : "text-blue-600 dark:text-blue-400";
    const bgClass = isForm
      ? "bg-violet-100 dark:bg-violet-900/20"
      : "bg-blue-100 dark:bg-blue-900/20";
    const buttonClass = isForm
      ? "bg-violet-600 hover:bg-violet-700"
      : "bg-blue-600 hover:bg-blue-700";

    // Dynamic classes for Beta Information
    const betaBgClass = isForm
      ? "bg-violet-50 dark:bg-violet-900/10"
      : "bg-blue-50 dark:bg-blue-900/10";
    const betaBorderClass = isForm
      ? "border-violet-200 dark:border-violet-900/30"
      : "border-blue-200 dark:border-blue-900/30";
    const betaTextClass = isForm
      ? "text-violet-700 dark:text-violet-300"
      : "text-blue-700 dark:text-blue-300";
    const betaIconClass = isForm
      ? "text-violet-700 dark:text-violet-400"
      : "text-blue-700 dark:text-blue-400";
    const betaLinkClass = isForm
      ? "text-violet-600 dark:text-violet-300"
      : "text-blue-600 dark:text-blue-300";

    // Dynamic classes for Secondary Actions (Outline buttons)
    const outlineButtonClass = isForm
      ? "border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
      : "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20";

    // Dynamic classes for Copy button (Light background)
    const copyButtonClass = isForm
      ? "bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
      : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background pb-8">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-8 text-center space-y-6 shadow-sm">
              {/* Icône de succès */}
              <div className="flex justify-center">
                <div
                  className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center`}
                >
                  <Check className={`w-10 h-10 ${colorClass}`} />
                </div>
              </div>

              {/* Message de succès */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">
                  {isForm ? "Formulaire publié !" : "Sondage publié !"}
                </h1>
                <p className="text-gray-600 dark:text-muted-foreground">
                  {isForm
                    ? `Votre formulaire "${publishedPoll.title}" est maintenant actif et prêt à recevoir des réponses.`
                    : `Votre sondage "${publishedPoll.title}" est maintenant actif et prêt à recevoir des votes.`}
                </p>
              </div>

              {/* Message d'information pour la bêta */}
              <div className={`p-4 ${betaBgClass} border ${betaBorderClass} rounded-lg`}>
                <div className={`flex items-center gap-2 ${betaIconClass}`}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">Information bêta</span>
                </div>
                <p className={`text-sm ${betaLinkClass} mt-1`}>
                  Pour finaliser et partager votre {isForm ? "formulaire" : "sondage"}, après la
                  bêta, vous devrez vous connecter ou créer un compte.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${buttonClass} text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all`}
                  data-testid="go-to-dashboard-button"
                >
                  <Check className="w-5 h-5" />
                  Aller au Tableau de bord
                </Link>
                <Link
                  to={`/poll/${publishedPoll.slug || publishedPoll.id}`}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-lg font-semibold transition-colors ${outlineButtonClass}`}
                  data-testid="view-poll-button"
                >
                  <ExternalLink className="w-5 h-5" />
                  {isForm ? "Voir le formulaire" : "Voir le sondage"}
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Lien de partage :</p>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <code className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
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
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap border ${copyButtonClass}`}
                    data-testid="copy-link-button"
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
    <div className="min-h-screen bg-gray-50 pb-8">
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
          onBack={(createdPoll?: Poll) => {
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
