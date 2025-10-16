import React, { useMemo } from "react";
import PollCreatorComponent from "@/components/PollCreator";
import FormPollCreator, {
  type FormPollDraft,
  type AnyFormQuestion,
} from "@/components/polls/FormPollCreator";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getAllPolls,
  savePolls,
  type Poll as StoragePoll,
  type FormQuestionShape,
} from "@/lib/pollStorage";

const PollCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isForm = (params.get("type") || "").toLowerCase() === "form";
  const draftIdParam = params.get("draftId") || undefined;

  // Helper to convert AnyFormQuestion to FormQuestionShape
  const convertToFormQuestionShape = (
    questions: AnyFormQuestion[],
  ): FormQuestionShape[] => {
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

  const upsertFormPollFromDraft = (
    draft: FormPollDraft,
    targetStatus: StoragePoll["status"],
  ) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20">
        <div className="w-full max-w-4xl mx-auto">
          {isForm ? (
            <FormPollCreator
              initialDraft={latestFormDraft}
              onCancel={() => navigate("/")}
              onSave={(draft) => {
                upsertFormPollFromDraft(draft, "draft");
                // Rester sur la page pour continuer l'édition
              }}
              onFinalize={(draft) => {
                upsertFormPollFromDraft(draft, "active");
                // Pour l'instant, on retourne au dashboard après finalisation
                navigate("/");
              }}
            />
          ) : (
            <PollCreatorComponent onBack={() => navigate("/")} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PollCreator;
