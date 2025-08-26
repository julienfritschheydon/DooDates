import React, { useMemo } from "react";
import PollCreatorComponent from "@/components/PollCreator";
import FormPollCreator, {
  type FormPollDraft,
} from "@/components/polls/FormPollCreator";
import TopNav from "../components/TopNav";
import { useNavigate, useLocation } from "react-router-dom";

const PollCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isForm = (params.get("type") || "").toLowerCase() === "form";
  const draftIdParam = params.get("draftId") || undefined;

  const saveFormDraft = (draft: FormPollDraft) => {
    try {
      const key = "dev-form-polls";
      const raw =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      const arr: FormPollDraft[] = raw
        ? (JSON.parse(raw) as FormPollDraft[])
        : [];
      // Remplacer si même id, sinon pousser
      const idx = arr.findIndex((d) => d.id === draft.id);
      if (idx >= 0) arr[idx] = draft;
      else arr.push(draft);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        "Impossible d'enregistrer le brouillon form dans localStorage",
        e,
      );
    }
  };

  const latestFormDraft: FormPollDraft | undefined = useMemo(() => {
    try {
      const key = "dev-form-polls";
      const raw =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      const arr: FormPollDraft[] = raw
        ? (JSON.parse(raw) as FormPollDraft[])
        : [];
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      if (draftIdParam) {
        const found = arr.find((d) => d.id === draftIdParam);
        if (found) return found;
      }
      // Retourner le dernier en fin de tableau si pas de draftId valide
      return arr[arr.length - 1];
    } catch {
      return undefined;
    }
  }, [location.key, draftIdParam]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="w-full max-w-4xl mx-auto">
        {isForm ? (
          <FormPollCreator
            initialDraft={latestFormDraft}
            onCancel={() => navigate("/")}
            onSave={(draft) => {
              saveFormDraft(draft);
              // Rester sur la page pour continuer l'édition
            }}
            onFinalize={(draft) => {
              saveFormDraft(draft);
              // Pour l'instant, on retourne au dashboard après finalisation
              navigate("/");
            }}
          />
        ) : (
          <PollCreatorComponent onBack={() => navigate("/")} />
        )}
      </div>
    </div>
  );
};

export default PollCreator;
