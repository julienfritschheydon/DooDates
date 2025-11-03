import React, { useCallback, useState } from "react";
import { ArrowUp, ArrowDown, Copy, Trash2, Edit2, Plus, GitBranch } from "lucide-react";
import type { ConditionalRule } from "../../types/conditionalRules";
import ConditionalRuleEditor from "./ConditionalRuleEditor";
import { useUIState } from "../prototype/UIStateProvider";

export type QuestionKind = "single" | "multiple" | "text" | "long-text" | "matrix" | "rating" | "nps";

export type QuestionOption = {
  id: string;
  label: string;
  isOther?: boolean; // Option "Autre" avec champ texte libre
};

export type Question = {
  id: string;
  title: string;
  kind: QuestionKind;
  required?: boolean;
  options?: QuestionOption[]; // for single/multiple
  maxChoices?: number; // for multiple
  // Matrix-specific fields
  matrixRows?: QuestionOption[]; // Lignes (aspects à évaluer)
  matrixColumns?: QuestionOption[]; // Colonnes (échelle de réponse)
  matrixType?: "single" | "multiple"; // Une seule réponse par ligne ou plusieurs
  matrixColumnsNumeric?: boolean; // Colonnes numériques (1-5) au lieu de texte
  // Rating-specific fields
  ratingScale?: number; // 5 ou 10 (par défaut 5)
  ratingStyle?: "numbers" | "stars" | "emojis"; // Style d'affichage (par défaut numbers)
  ratingMinLabel?: string; // Label pour la valeur minimale
  ratingMaxLabel?: string; // Label pour la valeur maximale
  // Text validation fields
  validationType?: "email" | "phone" | "url" | "number" | "date"; // Type de validation pour champs text
  placeholder?: string; // Placeholder personnalisé
};

export type QuestionCardProps = {
  question: Question;
  isActive: boolean;
  onEdit: () => void;
  onChange: (patch: Partial<Question>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  // Conditional rules support
  allQuestions?: Question[];
  conditionalRules?: ConditionalRule[];
  onConditionalRulesChange?: (rules: ConditionalRule[]) => void;
};

export default function QuestionCard({
  question,
  isActive,
  onEdit,
  onChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  allQuestions,
  conditionalRules,
  onConditionalRulesChange,
}: QuestionCardProps) {
  const { highlightedId, highlightType } = useUIState();
  const [showConditionalEditor, setShowConditionalEditor] = useState(false);

  // Déterminer si cette question doit être animée
  const isHighlighted = highlightedId === question.id;
  const highlightClass =
    isHighlighted && highlightType ? `question-highlight-${highlightType}` : "";
  // Sauvegarder les options avant de changer de type (pour pouvoir les restaurer)
  const [savedOptions, setSavedOptions] = useState<QuestionOption[] | undefined>(question.options);
  const setTitle = useCallback((title: string) => onChange({ title }), [onChange]);
  const setKind = useCallback(
    (kind: QuestionKind) => {
      // Sauvegarder les options actuelles si on quitte single/multiple
      if ((question.kind === "single" || question.kind === "multiple") && question.options) {
        setSavedOptions(question.options);
      }

      // reset incompatible fields when switching kind
      if (kind === "text" || kind === "long-text") {
        onChange({
          kind,
          options: undefined,
          maxChoices: undefined,
          matrixRows: undefined,
          matrixColumns: undefined,
          matrixType: undefined,
        });
      } else if (kind === "single") {
        onChange({
          kind,
          maxChoices: undefined,
          options: question.options ?? savedOptions ?? makeDefaultOptions(),
          matrixRows: undefined,
          matrixColumns: undefined,
          matrixType: undefined,
        });
      } else if (kind === "multiple") {
        onChange({
          kind,
          options: question.options ?? savedOptions ?? makeDefaultOptions(),
          maxChoices: question.maxChoices ?? 1,
          matrixRows: undefined,
          matrixColumns: undefined,
          matrixType: undefined,
        });
      } else if (kind === "matrix") {
        // Sauvegarder les options avant de passer en matrice
        if (question.options && question.options.length > 0) {
          setSavedOptions(question.options);
        }

        // Réutiliser les options existantes comme lignes de la matrice
        const defaultRows =
          question.options && question.options.length > 0
            ? question.options.map((opt) => ({ id: opt.id, label: opt.label }))
            : [
                { id: rid(), label: "Ligne 1" },
                { id: rid(), label: "Ligne 2" },
              ];

        onChange({
          kind,
          options: undefined,
          maxChoices: undefined,
          matrixRows: question.matrixRows ?? defaultRows,
          matrixColumns: question.matrixColumns ?? [
            { id: rid(), label: "Pas du tout" },
            { id: rid(), label: "Peu" },
            { id: rid(), label: "Moyennement" },
            { id: rid(), label: "Beaucoup" },
            { id: rid(), label: "Énormément" },
          ],
          matrixType: question.matrixType ?? "single",
        });
      } else if (kind === "rating") {
        onChange({
          kind,
          options: undefined,
          maxChoices: undefined,
          matrixRows: undefined,
          matrixColumns: undefined,
          matrixType: undefined,
          ratingScale: question.ratingScale ?? 5,
          ratingStyle: question.ratingStyle ?? "numbers",
          ratingMinLabel: question.ratingMinLabel ?? "",
          ratingMaxLabel: question.ratingMaxLabel ?? "",
        });
      } else if (kind === "nps") {
        onChange({
          kind,
          options: undefined,
          maxChoices: undefined,
          matrixRows: undefined,
          matrixColumns: undefined,
          matrixType: undefined,
          ratingScale: undefined,
          ratingStyle: undefined,
          ratingMinLabel: undefined,
          ratingMaxLabel: undefined,
        });
      }
    },
    [
      onChange,
      question.kind,
      question.options,
      question.maxChoices,
      question.matrixRows,
      question.matrixColumns,
      question.matrixType,
      question.ratingScale,
      question.ratingStyle,
      question.ratingMinLabel,
      question.ratingMaxLabel,
      savedOptions,
    ],
  );
  const setRequired = useCallback((required: boolean) => onChange({ required }), [onChange]);

  const addOption = useCallback(() => {
    const next = (question.options ?? []).concat({
      id: rid(),
      label: "Option",
    });
    onChange({ options: next });
  }, [onChange, question.options]);

  const updateOption = useCallback(
    (optId: string, label: string) => {
      const next = (question.options ?? []).map((o) => (o.id === optId ? { ...o, label } : o));
      onChange({ options: next });
    },
    [onChange, question.options],
  );

  const removeOption = useCallback(
    (optId: string) => {
      const next = (question.options ?? []).filter((o) => o.id !== optId);
      onChange({ options: next });
    },
    [onChange, question.options],
  );

  const setMaxChoices = useCallback(
    (n: number) => {
      if (!Number.isFinite(n) || n < 1) n = 1;
      onChange({ maxChoices: Math.floor(n) });
    },
    [onChange],
  );

  const toggleOtherOption = useCallback(() => {
    const hasOther = question.options?.some((o) => o.isOther);
    if (hasOther) {
      // Supprimer l'option "Autre"
      const next = (question.options ?? []).filter((o) => !o.isOther);
      onChange({ options: next });
    } else {
      // Ajouter l'option "Autre"
      const next = (question.options ?? []).concat({
        id: rid(),
        label: "Autre",
        isOther: true,
      });
      onChange({ options: next });
    }
  }, [onChange, question.options]);

  // Matrix-specific handlers
  const addMatrixRow = useCallback(() => {
    const next = (question.matrixRows ?? []).concat({
      id: rid(),
      label: "Ligne",
    });
    onChange({ matrixRows: next });
  }, [onChange, question.matrixRows]);

  const updateMatrixRow = useCallback(
    (rowId: string, label: string) => {
      const next = (question.matrixRows ?? []).map((r) => (r.id === rowId ? { ...r, label } : r));
      onChange({ matrixRows: next });
    },
    [onChange, question.matrixRows],
  );

  const removeMatrixRow = useCallback(
    (rowId: string) => {
      const next = (question.matrixRows ?? []).filter((r) => r.id !== rowId);
      onChange({ matrixRows: next });
    },
    [onChange, question.matrixRows],
  );

  const addMatrixColumn = useCallback(() => {
    const next = (question.matrixColumns ?? []).concat({
      id: rid(),
      label: "Colonne",
    });
    onChange({ matrixColumns: next });
  }, [onChange, question.matrixColumns]);

  const updateMatrixColumn = useCallback(
    (colId: string, label: string) => {
      const next = (question.matrixColumns ?? []).map((c) =>
        c.id === colId ? { ...c, label } : c,
      );
      onChange({ matrixColumns: next });
    },
    [onChange, question.matrixColumns],
  );

  const removeMatrixColumn = useCallback(
    (colId: string) => {
      const next = (question.matrixColumns ?? []).filter((c) => c.id !== colId);
      onChange({ matrixColumns: next });
    },
    [onChange, question.matrixColumns],
  );

  const setMatrixType = useCallback(
    (type: "single" | "multiple") => {
      onChange({ matrixType: type });
    },
    [onChange],
  );

  const toggleMatrixColumnsNumeric = useCallback(() => {
    const isNumeric = !question.matrixColumnsNumeric;
    if (isNumeric) {
      // Passer en colonnes numériques (1-5)
      onChange({
        matrixColumnsNumeric: true,
        matrixColumns: [
          { id: rid(), label: "1" },
          { id: rid(), label: "2" },
          { id: rid(), label: "3" },
          { id: rid(), label: "4" },
          { id: rid(), label: "5" },
        ],
      });
    } else {
      // Revenir aux colonnes texte (échelle Likert)
      onChange({
        matrixColumnsNumeric: false,
        matrixColumns: [
          { id: rid(), label: "Pas du tout" },
          { id: rid(), label: "Peu" },
          { id: rid(), label: "Moyennement" },
          { id: rid(), label: "Beaucoup" },
          { id: rid(), label: "Énormément" },
        ],
      });
    }
  }, [onChange, question.matrixColumnsNumeric]);

  if (!isActive) {
    return (
      <div
        className={`rounded-md border border-gray-700 bg-[#1a1a1a] p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 ${highlightClass}`}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <div className="font-medium break-words text-white">
              {question.title || "(Sans titre)"}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 justify-end">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              title="Éditer"
              aria-label="Éditer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voter-style preview for non-active cards */}
        {question.kind === "text" && (
          <input
            type="text"
            disabled
            placeholder="Votre réponse"
            className="w-full px-3 py-2 border border-gray-700 rounded bg-[#3c4043] text-gray-300 placeholder-gray-500"
          />
        )}
        {question.kind === "long-text" && (
          <textarea
            disabled
            placeholder="Votre réponse détaillée..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-700 rounded bg-[#3c4043] text-gray-300 placeholder-gray-500"
          />
        )}
        {(question.kind === "single" || question.kind === "multiple") && (
          <div className="space-y-2">
            {(question.options ?? []).map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-300">
                {question.kind === "single" ? (
                  <input type="radio" disabled />
                ) : (
                  <input type="checkbox" disabled />
                )}
                <span>{opt.label || "Option"}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-md border border-gray-700 bg-[#1a1a1a] p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 ${highlightClass}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base"
            value={question.kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
            data-testid="question-kind-select"
            data-qid={question.id}
          >
            <option value="single">Choix unique</option>
            <option value="multiple">Choix multiples</option>
            <option value="text">Texte court</option>
            <option value="long-text">Texte long</option>
            <option value="matrix">Matrice</option>
            <option value="rating">Échelle de notation</option>
            <option value="nps">Net Promoter Score (NPS)</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors flex-shrink-0"
            title="Monter"
            aria-label="Monter"
            data-testid="question-move-up"
            data-qid={question.id}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors flex-shrink-0"
            title="Descendre"
            aria-label="Descendre"
            data-testid="question-move-down"
            data-qid={question.id}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors flex-shrink-0"
            title="Dupliquer"
            aria-label="Dupliquer"
            data-testid="question-duplicate"
            data-qid={question.id}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border border-gray-700 text-gray-300 hover:bg-red-600 hover:border-red-600 transition-colors flex-shrink-0"
            title="Supprimer"
            aria-label="Supprimer"
            data-testid="question-delete"
            data-qid={question.id}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {allQuestions && onConditionalRulesChange && (
            <button
              type="button"
              onClick={() => setShowConditionalEditor(!showConditionalEditor)}
              className={`inline-flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-3 rounded-md border text-xs sm:text-sm transition-colors ${
                showConditionalEditor
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
              title="Règles conditionnelles"
              aria-label="Règles conditionnelles"
              data-testid="question-conditional"
              data-qid={question.id}
            >
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Conditions</span>
            </button>
          )}
        </div>
      </div>

      <input
        className="w-full rounded-md border border-gray-700 bg-[#3c4043] text-white placeholder-gray-500 px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base"
        placeholder="Intitulé de la question"
        value={question.title}
        onChange={(e) => setTitle(e.target.value)}
        data-testid="question-title-input"
        data-qid={question.id}
      />

      {(question.kind === "single" || question.kind === "multiple") && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-400">Options</div>
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  className={`flex-1 rounded-md border px-2 py-1 text-sm sm:text-base ${
                    opt.isOther
                      ? "bg-blue-900 border-blue-500 text-white"
                      : "border-gray-700 bg-[#3c4043] text-white placeholder-gray-500"
                  }`}
                  value={opt.label || ""}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  readOnly={opt.isOther}
                  disabled={opt.isOther}
                  placeholder={
                    opt.isOther ? "Autre (champ libre pour l'utilisateur)" : "Entrez une option"
                  }
                  data-testid="question-option-input"
                  data-qid={question.id}
                  data-optid={opt.id}
                />
                {opt.isOther && (
                  <span className="text-xs text-blue-600 whitespace-nowrap">+ Texte libre</span>
                )}
                {!opt.isOther && (
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border border-gray-700 text-gray-300 hover:bg-red-600 hover:border-red-600 transition-colors"
                    title="Supprimer l'option"
                    aria-label="Supprimer l'option"
                    data-testid="question-option-remove"
                    data-qid={question.id}
                    data-optid={opt.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {question.kind === "multiple" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Max choix</label>
              <input
                type="number"
                min={1}
                className="w-20 rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1 text-sm sm:text-base"
                value={question.maxChoices ?? 1}
                onChange={(e) => setMaxChoices(parseInt(e.target.value, 10))}
                data-testid="question-maxchoices"
                data-qid={question.id}
              />
            </div>
          )}
        </div>
      )}

      {/* Matrix editor */}
      {question.kind === "matrix" && (
        <div className="flex flex-col gap-3">
          {/* Matrix type selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Type de réponse</label>
            <select
              className="rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1 text-sm"
              value={question.matrixType ?? "single"}
              onChange={(e) => setMatrixType(e.target.value as "single" | "multiple")}
            >
              <option value="single">Une seule réponse par ligne</option>
              <option value="multiple">Plusieurs réponses par ligne</option>
            </select>
          </div>

          {/* Rows editor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Lignes (aspects à évaluer)</div>
              <button
                type="button"
                onClick={addMatrixRow}
                className="inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors h-7 px-2 text-xs"
                title="Ajouter une ligne"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ligne
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {(question.matrixRows ?? []).map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-md border border-gray-700 bg-[#3c4043] text-white placeholder-gray-500 px-2 py-1 text-sm"
                    value={row.label}
                    onChange={(e) => updateMatrixRow(row.id, e.target.value)}
                    placeholder="Nom de la ligne"
                  />
                  <button
                    type="button"
                    onClick={() => removeMatrixRow(row.id)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-700 text-gray-300 hover:bg-red-600 hover:border-red-600 transition-colors"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columns editor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Colonnes (échelle de réponse)</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMatrixColumnsNumeric}
                  className={`inline-flex items-center rounded-md border h-7 px-2 text-xs transition-colors ${
                    question.matrixColumnsNumeric
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                  title={
                    question.matrixColumnsNumeric ? "Passer en texte" : "Passer en numérique (1-5)"
                  }
                >
                  {question.matrixColumnsNumeric ? "↻ Texte" : "↻ 1-5"}
                </button>
                <button
                  type="button"
                  onClick={addMatrixColumn}
                  className="inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors h-7 px-2 text-xs"
                  title="Ajouter une colonne"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Colonne
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {(question.matrixColumns ?? []).map((col) => (
                <div key={col.id} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-md border border-gray-700 bg-[#3c4043] text-white placeholder-gray-500 px-2 py-1 text-sm"
                    value={col.label}
                    onChange={(e) => updateMatrixColumn(col.id, e.target.value)}
                    placeholder="Nom de la colonne"
                  />
                  <button
                    type="button"
                    onClick={() => removeMatrixColumn(col.id)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-700 text-gray-300 hover:bg-red-600 hover:border-red-600 transition-colors"
                    title="Supprimer la colonne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating editor */}
      {question.kind === "rating" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Scale selector */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Échelle</label>
              <select
                className="rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1 text-sm"
                value={question.ratingScale ?? 5}
                onChange={(e) => onChange({ ratingScale: parseInt(e.target.value, 10) })}
              >
                <option value={5}>1 à 5</option>
                <option value={10}>1 à 10</option>
              </select>
            </div>

            {/* Style selector */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Style</label>
              <select
                className="rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1 text-sm"
                value={question.ratingStyle ?? "numbers"}
                onChange={(e) =>
                  onChange({ ratingStyle: e.target.value as "numbers" | "stars" | "emojis" })
                }
              >
                <option value="numbers">Chiffres</option>
                <option value="stars">Étoiles</option>
                <option value="emojis">Emojis</option>
              </select>
            </div>
          </div>

          {/* Labels min/max */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Label min (optionnel)</label>
              <input
                type="text"
                className="rounded-md border border-gray-700 bg-[#3c4043] text-white placeholder-gray-500 px-2 py-1 text-sm"
                placeholder="Ex: Pas du tout"
                value={question.ratingMinLabel ?? ""}
                onChange={(e) => onChange({ ratingMinLabel: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Label max (optionnel)</label>
              <input
                type="text"
                className="rounded-md border border-gray-700 bg-[#3c4043] text-white placeholder-gray-500 px-2 py-1 text-sm"
                placeholder="Ex: Tout à fait"
                value={question.ratingMaxLabel ?? ""}
                onChange={(e) => onChange({ ratingMaxLabel: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* NPS editor (pas de configuration, juste un message informatif) */}
      {question.kind === "nps" && (
        <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>Net Promoter Score (NPS)</strong> : Échelle fixe de 0 à 10 pour mesurer la
            probabilité de recommandation.
          </p>
          <p className="text-xs text-blue-400 mt-1">
            0-6 = Détracteurs • 7-8 = Passifs • 9-10 = Promoteurs
          </p>
        </div>
      )}

      {/* Text editor - Validation type */}
      {(question.kind === "text" || question.kind === "long-text") && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Type de validation (optionnel)</label>
            <select
              className="rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1 text-sm"
              value={question.validationType ?? ""}
              onChange={(e) => onChange({ validationType: (e.target.value as any) || undefined })}
            >
              <option value="">Aucune validation</option>
              <option value="email">Email</option>
              <option value="phone">Téléphone (format français)</option>
              <option value="url">URL</option>
              <option value="number">Nombre</option>
              <option value="date">Date</option>
            </select>
          </div>
          {question.validationType && (
            <div className="p-2 bg-green-900/20 border border-green-700 rounded text-xs text-green-300">
              ✓ La saisie sera validée automatiquement selon le format {question.validationType}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Placeholder (optionnel)</label>
            <input
              type="text"
              className="rounded-md border border-gray-700 bg-[#3c4043] text-white placeholder-gray-500 px-2 py-1 text-sm"
              placeholder="Ex: Entrez votre email"
              value={question.placeholder ?? ""}
              onChange={(e) => onChange({ placeholder: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Footer row: Add option (if applicable) + Required toggle side-by-side */}
      {/* Actions bar - Only show for relevant question types */}
      <div className="pt-1 flex items-center gap-3 flex-wrap">
        {(question.kind === "single" || question.kind === "multiple") && (
          <>
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors h-8 sm:h-9 px-2 sm:px-3 text-sm"
              title="Ajouter une option"
              aria-label="Ajouter une option"
              data-testid="question-add-option"
              data-qid={question.id}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Ajouter une option</span>
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-300 select-none">
              <input
                type="checkbox"
                checked={question.options?.some((o) => o.isOther) ?? false}
                onChange={toggleOtherOption}
                data-testid="question-other-option"
                data-qid={question.id}
              />
              Option "Autre"
            </label>
          </>
        )}
        {/* Checkbox "Obligatoire" visible pour tous les types */}
        <label className="flex items-center gap-2 text-sm text-gray-300 select-none">
          <input
            type="checkbox"
            checked={!!question.required}
            onChange={(e) => setRequired(e.target.checked)}
            data-testid="question-required"
            data-qid={question.id}
          />
          Obligatoire
        </label>
      </div>

      {/* Conditional Rules Editor */}
      {showConditionalEditor &&
        allQuestions &&
        conditionalRules !== undefined &&
        onConditionalRulesChange && (
          <div className="mt-3">
            <ConditionalRuleEditor
              questionId={question.id}
              questions={allQuestions}
              existingRules={conditionalRules}
              onChange={onConditionalRulesChange}
            />
          </div>
        )}

      {/* actions déplacées dans la barre d'entête pour gagner de l'espace vertical */}
    </div>
  );
}

function rid() {
  return Math.random().toString(36).slice(2, 8);
}

function makeDefaultOptions(): QuestionOption[] {
  return [
    { id: rid(), label: "Option 1" },
    { id: rid(), label: "Option 2" },
  ];
}

function labelForKind(kind: QuestionKind) {
  switch (kind) {
    case "single":
      return "Choix unique";
    case "multiple":
      return "Choix multiples";
    case "text":
      return "Texte court";
    case "long-text":
      return "Texte long";
    default:
      return kind;
  }
}
