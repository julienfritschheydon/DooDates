import React, { useEffect, useMemo, useState } from "react";

// Types locaux au spike (pas encore partagés avec un modèle global)
export type FormQuestionType = "single" | "multiple" | "text";

export interface FormOption {
  id: string;
  label: string;
}

export interface FormQuestionBase {
  id: string;
  title: string;
  required: boolean;
  type: FormQuestionType;
}

export interface SingleOrMultipleQuestion extends FormQuestionBase {
  type: "single" | "multiple";
  options: FormOption[];
  maxChoices?: number; // applicable uniquement si multiple
}

export interface TextQuestion extends FormQuestionBase {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

export type AnyFormQuestion = SingleOrMultipleQuestion | TextQuestion;

export interface FormPollDraft {
  id: string; // draft id (temporaire pour le spike)
  type: "form";
  title: string;
  questions: AnyFormQuestion[];
}

interface FormPollCreatorProps {
  initialDraft?: FormPollDraft;
  onCancel?: () => void;
  onSave?: (draft: FormPollDraft) => void; // pour le spike: retour du draft, stockage géré ailleurs
  onFinalize?: (draft: FormPollDraft) => void; // finaliser le brouillon
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultOptions = (): FormOption[] => [
  { id: uid(), label: "Option 1" },
  { id: uid(), label: "Option 2" },
];

export default function FormPollCreator({ initialDraft, onCancel, onSave, onFinalize }: FormPollCreatorProps) {
  const [title, setTitle] = useState(initialDraft?.title || "");
  const [questions, setQuestions] = useState<AnyFormQuestion[]>(initialDraft?.questions || []);
  const [draftId] = useState<string>(initialDraft?.id || ("draft-" + uid()));

  // Si le brouillon change (montée en props), synchroniser l'état
  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title || "");
      setQuestions(initialDraft.questions || []);
    }
  }, [initialDraft?.id]);

  const currentDraft: FormPollDraft = useMemo(() => ({
    id: draftId,
    type: "form",
    title,
    questions,
  }), [draftId, title, questions]);

  const canSave = useMemo(() => validateDraft(currentDraft).ok, [currentDraft]);

  const addQuestion = (type: FormQuestionType) => {
    if (type === "text") {
      const q: TextQuestion = {
        id: uid(),
        type: "text",
        title: "Nouvelle question",
        required: false,
        placeholder: "",
        maxLength: 300,
      };
      setQuestions((prev) => [...prev, q]);
      return;
    }
    const q: SingleOrMultipleQuestion = {
      id: uid(),
      type: type === "multiple" ? "multiple" : "single",
      title: "Nouvelle question",
      required: false,
      options: defaultOptions(),
      maxChoices: type === "multiple" ? 2 : undefined,
    };
    setQuestions((prev) => [...prev, q]);
  };

  const updateQuestion = (id: string, updater: (q: AnyFormQuestion) => AnyFormQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? updater(q) : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = () => {
    const draft: FormPollDraft = { ...currentDraft, title: title.trim() };
    const result = validateDraft(draft);
    if (!result.ok) {
      alert("Veuillez corriger: \n- " + result.errors.join("\n- "));
      return;
    }
    if (onSave) onSave(draft);
    // Spike: par défaut, afficher dans la console
    if (!onSave) {
      // eslint-disable-next-line no-console
      console.log("FormPoll draft", draft);
      alert("Brouillon FormPoll prêt (voir console). Stockage local à l'étape suivante.");
    }
  };

  const handleFinalize = () => {
    const draft: FormPollDraft = { ...currentDraft, title: title.trim() };
    const result = validateDraft(draft);
    if (!result.ok) {
      alert("Veuillez corriger: \n- " + result.errors.join("\n- "));
      return;
    }
    if (onFinalize) onFinalize(draft);
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Créer un sondage Formulaire</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Colonne Édition */}
        <div>
          {/* Titre */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Préférences déjeuner"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Questions */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => addQuestion("single")}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                + Choix unique
              </button>
              <button
                type="button"
                onClick={() => addQuestion("multiple")}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                + Choix multiples
              </button>
              <button
                type="button"
                onClick={() => addQuestion("text")}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                + Réponse texte
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border rounded-md p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Question {idx + 1} • {labelType(q.type)}</div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Intitulé */}
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => updateQuestion(q.id, (old) => ({ ...old, title: e.target.value }))}
                    placeholder="Intitulé de la question"
                    className="w-full px-3 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Commun: requis */}
                  <label className="inline-flex items-center gap-2 text-sm mb-3">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, (old) => ({ ...old, required: e.target.checked }))}
                    />
                    <span>Réponse obligatoire</span>
                  </label>

                  {q.type !== "text" ? (
                    <div>
                      {/* Options */}
                      <div className="space-y-2 mb-3">
                        {(q as SingleOrMultipleQuestion).options.map((opt, i) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <span className="w-14 text-xs text-gray-500">Option {i + 1}</span>
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => updateQuestion(q.id, (old) => {
                                const target = old as SingleOrMultipleQuestion;
                                const next = target.options.map((o) => o.id === opt.id ? { ...o, label: e.target.value } : o);
                                return { ...target, options: next } as AnyFormQuestion;
                              })}
                              className="flex-1 px-3 py-2 border rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuestion(q.id, (old) => {
                                const target = old as SingleOrMultipleQuestion;
                                const next = target.options.filter((o) => o.id !== opt.id);
                                return { ...target, options: next } as AnyFormQuestion;
                              })}
                              className="text-red-600 text-xs hover:underline"
                            >
                              retirer
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, (old) => {
                            const target = old as SingleOrMultipleQuestion;
                            const next = [...target.options, { id: uid(), label: `Option ${target.options.length + 1}` }];
                            return { ...target, options: next } as AnyFormQuestion;
                          })}
                          className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        >
                          + Ajouter une option
                        </button>
                        <span className="text-xs text-gray-500">2–10 options</span>
                      </div>

                      {q.type === "multiple" && (
                        <div className="mb-2">
                          <label className="block text-sm text-gray-700 mb-1">Nombre maximum de choix</label>
                          <input
                            type="number"
                            min={1}
                            max={(q as SingleOrMultipleQuestion).options.length || 1}
                            value={(q as SingleOrMultipleQuestion).maxChoices || 1}
                            onChange={(e) => updateQuestion(q.id, (old) => ({
                              ...(old as SingleOrMultipleQuestion),
                              maxChoices: clamp(parseInt(e.target.value || "1", 10), 1, (old as SingleOrMultipleQuestion).options.length || 1),
                            }) as AnyFormQuestion)}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={(q as TextQuestion).placeholder || ""}
                          onChange={(e) => updateQuestion(q.id, (old) => ({
                            ...(old as TextQuestion),
                            placeholder: e.target.value,
                          }) as AnyFormQuestion)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Longueur max</label>
                        <input
                          type="number"
                          min={50}
                          max={1000}
                          value={(q as TextQuestion).maxLength || 300}
                          onChange={(e) => updateQuestion(q.id, (old) => ({
                            ...(old as TextQuestion),
                            maxLength: clamp(parseInt(e.target.value || "300", 10), 50, 1000),
                          }) as AnyFormQuestion)}
                          className="w-28 px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className={`px-4 py-2 rounded-md text-white ${canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"}`}
            >
              Enregistrer le brouillon
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleFinalize}
              className={`px-4 py-2 rounded-md text-white ${canSave ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300"}`}
            >
              Finaliser
            </button>
          </div>
        </div>

        {/* Colonne Aperçu */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Aperçu</h3>
            <span className="text-xs text-gray-500">Lecture seule</span>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900">{title?.trim() || "Sans titre"}</h4>
            </div>
            {questions.length === 0 && (
              <p className="text-sm text-gray-500">Ajoutez des questions pour voir l'aperçu.</p>
            )}
            {questions.map((q, idx) => (
              <div key={q.id} className="border rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm text-gray-900 font-medium">{idx + 1}. {q.title?.trim() || "Sans intitulé"}</div>
                  {q.required && (
                    <span className="text-xs text-red-600">Obligatoire</span>
                  )}
                </div>

                {q.type === "text" && (
                  <textarea
                    disabled
                    placeholder={(q as TextQuestion).placeholder || "Votre réponse"}
                    className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-600"
                  />
                )}
                {q.type === "single" && (
                  <div className="space-y-2">
                    {(q as SingleOrMultipleQuestion).options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="radio" disabled name={`q-${q.id}`} />
                        <span>{opt.label || "Option"}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === "multiple" && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 mb-1">Max {(q as SingleOrMultipleQuestion).maxChoices || 1} choix</div>
                    {(q as SingleOrMultipleQuestion).options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" disabled />
                        <span>{opt.label || "Option"}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function labelType(t: FormQuestionType) {
  switch (t) {
    case "single":
      return "Choix unique";
    case "multiple":
      return "Choix multiples";
    case "text":
      return "Réponse texte";
    default:
      return t;
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function validateDraft(draft: FormPollDraft): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("Titre requis");
  if (draft.questions.length === 0) errors.push("Au moins une question");
  draft.questions.forEach((q, idx) => {
    if (!q.title.trim()) errors.push(`Question ${idx + 1}: intitulé requis`);
    if (q.type !== "text") {
      const sq = q as SingleOrMultipleQuestion;
      if (sq.options.length < 2) errors.push(`Question ${idx + 1}: minimum 2 options`);
      if (sq.options.length > 10) errors.push(`Question ${idx + 1}: maximum 10 options`);
      const empty = sq.options.find((o) => !o.label.trim());
      if (empty) errors.push(`Question ${idx + 1}: une option est vide`);
      if (sq.type === "multiple") {
        const maxChoices = sq.maxChoices ?? 1;
        if (maxChoices < 1) errors.push(`Question ${idx + 1}: maxChoices >= 1`);
        if (maxChoices > sq.options.length) errors.push(`Question ${idx + 1}: maxChoices <= nombre d'options`);
      }
    } else {
      const tq = q as TextQuestion;
      if ((tq.maxLength ?? 300) < 50) errors.push(`Question ${idx + 1}: maxLength >= 50`);
      if ((tq.maxLength ?? 300) > 1000) errors.push(`Question ${idx + 1}: maxLength <= 1000`);
    }
  });
  return { ok: errors.length === 0, errors };
}
