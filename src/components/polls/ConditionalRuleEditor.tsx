import React, { useState, useEffect } from "react";
import { X, Plus, GitBranch } from "lucide-react";
import { ConditionalRule } from "../../types/conditionalRules";
import { logger } from "../../lib/logger";

interface Question {
  id: string;
  title: string;
  options?: Array<{ id: string; label: string }>;
}

interface ConditionalRuleEditorProps {
  questionId: string;
  questions: Question[]; // Toutes les questions du formulaire
  existingRules: ConditionalRule[];
  onChange: (rules: ConditionalRule[]) => void;
}

export default function ConditionalRuleEditor({
  questionId,
  questions,
  existingRules,
  onChange,
}: ConditionalRuleEditorProps) {
  const currentRules = existingRules.filter((r) => r.questionId === questionId);

  // Par défaut, ouvrir en mode édition s'il y a déjà des règles
  const [isEditing, setIsEditing] = useState(currentRules.length > 0);

  // Détecter les changements de règles et afficher automatiquement si des règles existent
  useEffect(() => {
    if (currentRules.length > 0) {
      setIsEditing(true);
    }
  }, [currentRules.length]);

  // Trouver l'index de la question actuelle
  const currentIndex = questions.findIndex((q) => q.id === questionId);

  // Questions précédentes (celles dont on peut dépendre)
  const previousQuestions = questions.slice(0, currentIndex);

  const addRule = () => {
    if (previousQuestions.length === 0) {
      logger.warn("Aucune question précédente disponible", "poll");
      return;
    }

    // Sélectionner la dernière question précédente (la plus proche)
    const lastPrevQuestion = previousQuestions[previousQuestions.length - 1];
    const firstOption = lastPrevQuestion.options?.[0]?.label || "";

    const newRule: ConditionalRule = {
      questionId,
      dependsOn: lastPrevQuestion.id,
      showIf: {
        operator: "equals",
        value: firstOption,
      },
    };

    logger.debug("Adding conditional rule", "poll", { newRule });
    onChange([...existingRules, newRule]);
    setIsEditing(true); // Passer en mode édition pour afficher la règle
  };

  const updateRule = (ruleIndex: number, updates: Partial<ConditionalRule>) => {
    const updatedRules = existingRules.map((rule, idx) => {
      if (idx === ruleIndex) {
        return { ...rule, ...updates };
      }
      return rule;
    });
    onChange(updatedRules);
  };

  const removeRule = (ruleIndex: number) => {
    const updatedRules = existingRules.filter((_, idx) => idx !== ruleIndex);
    onChange(updatedRules);
    if (currentRules.length === 1) {
      setIsEditing(false);
    }
  };

  // Trouver une règle globalement
  const getRuleGlobalIndex = (localIndex: number) => {
    return existingRules.findIndex(
      (r, idx) =>
        r.questionId === questionId &&
        existingRules.slice(0, idx + 1).filter((r2) => r2.questionId === questionId).length ===
          localIndex + 1,
    );
  };

  if (previousQuestions.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic">
        Aucune question précédente pour créer une condition
      </div>
    );
  }

  if (!isEditing && currentRules.length === 0) {
    return (
      <button
        type="button"
        onClick={addRule}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
        data-testid="add-conditional-rule-button"
      >
        <Plus className="w-4 h-4" />
        Ajouter une condition d'affichage
      </button>
    );
  }

  return (
    <div
      className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-md"
      data-testid="conditional-rules-editor"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-900">
          <GitBranch className="w-4 h-4" />
          Conditions d'affichage
          {!isEditing && (
            <span className="text-xs font-normal text-purple-700">
              ({currentRules.length} règle{currentRules.length > 1 ? "s" : ""})
            </span>
          )}
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
            data-testid="edit-conditional-rules-button"
          >
            Modifier
          </button>
        )}
      </div>

      {currentRules.map((rule, localIdx) => {
        const globalIdx = getRuleGlobalIndex(localIdx);
        const dependsOnQuestion = questions.find((q) => q.id === rule.dependsOn);

        // Mode lecture : afficher juste le résumé
        if (!isEditing) {
          return (
            <div
              key={localIdx}
              className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200"
              data-testid={`conditional-rule-summary-${localIdx}`}
            >
              <span className="text-purple-700 font-medium">
                "{dependsOnQuestion?.title || "Question"}"
              </span>{" "}
              <span>
                {rule.showIf.operator === "equals" && "est égal à"}
                {rule.showIf.operator === "notEquals" && "est différent de"}
                {rule.showIf.operator === "contains" && "contient"}
                {rule.showIf.operator === "isEmpty" && "est vide"}
                {rule.showIf.operator === "isNotEmpty" && "n'est pas vide"}
              </span>
              {rule.showIf.value && (
                <>
                  {" "}
                  <span className="text-green-700 font-medium">"{rule.showIf.value}"</span>
                </>
              )}
            </div>
          );
        }

        // Mode édition : afficher tous les champs
        return (
          <div
            key={localIdx}
            className="p-2 bg-white border rounded space-y-2"
            data-testid={`conditional-rule-${localIdx}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                {/* Sélection question dépendante */}
                <div>
                  <label className="text-xs text-gray-600">Afficher si</label>
                  <select
                    className="w-full text-sm border rounded px-2 py-1"
                    value={rule.dependsOn}
                    data-testid="conditional-rule-depends-on"
                    onChange={(e) => {
                      const newDependsOn = e.target.value;
                      const newQuestion = questions.find((q) => q.id === newDependsOn);
                      const firstOption = newQuestion?.options?.[0]?.label || "";
                      updateRule(globalIdx, {
                        dependsOn: newDependsOn,
                        showIf: { ...rule.showIf, value: firstOption },
                      });
                    }}
                  >
                    {previousQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title || "(Sans titre)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection opérateur */}
                <div>
                  <label className="text-xs text-gray-600">Condition</label>
                  <select
                    className="w-full text-sm border rounded px-2 py-1"
                    value={rule.showIf.operator}
                    data-testid="conditional-rule-operator"
                    onChange={(e) =>
                      updateRule(globalIdx, {
                        showIf: {
                          ...rule.showIf,
                          operator: e.target.value as ConditionalRule["showIf"]["operator"],
                        },
                      })
                    }
                  >
                    <option value="equals">est égal à</option>
                    <option value="notEquals">est différent de</option>
                    <option value="contains">contient</option>
                    <option value="isEmpty">est vide</option>
                    <option value="isNotEmpty">n'est pas vide</option>
                  </select>
                </div>

                {/* Sélection valeur (si opérateur nécessite une valeur) */}
                {rule.showIf.operator !== "isEmpty" && rule.showIf.operator !== "isNotEmpty" && (
                  <div>
                    <label className="text-xs text-gray-600">Valeur</label>
                    {/* Pour "contient", toujours afficher un input texte libre */}
                    {rule.showIf.operator === "contains" ? (
                      <input
                        type="text"
                        className="w-full text-sm border rounded px-2 py-1"
                        value={
                          Array.isArray(rule.showIf.value)
                            ? rule.showIf.value[0]
                            : rule.showIf.value || ""
                        }
                        onChange={(e) =>
                          updateRule(globalIdx, {
                            showIf: { ...rule.showIf, value: e.target.value },
                          })
                        }
                        placeholder="Texte à rechercher"
                        data-testid="conditional-rule-value-text"
                      />
                    ) : dependsOnQuestion?.options && dependsOnQuestion.options.length > 0 ? (
                      <select
                        className="w-full text-sm border rounded px-2 py-1"
                        value={
                          Array.isArray(rule.showIf.value)
                            ? rule.showIf.value[0]
                            : rule.showIf.value || ""
                        }
                        onChange={(e) =>
                          updateRule(globalIdx, {
                            showIf: { ...rule.showIf, value: e.target.value },
                          })
                        }
                        data-testid="conditional-rule-value-select"
                      >
                        {dependsOnQuestion.options.map((opt) => (
                          <option key={opt.id} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="w-full text-sm border rounded px-2 py-1"
                        value={
                          Array.isArray(rule.showIf.value)
                            ? rule.showIf.value[0]
                            : rule.showIf.value || ""
                        }
                        onChange={(e) =>
                          updateRule(globalIdx, {
                            showIf: { ...rule.showIf, value: e.target.value },
                          })
                        }
                        placeholder="Entrez une valeur"
                      />
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeRule(globalIdx)}
                className="p-1 hover:bg-red-100 rounded"
                title="Supprimer cette règle"
                data-testid="remove-conditional-rule-button"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        );
      })}

      {isEditing && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
            data-testid="add-another-conditional-rule-button"
          >
            <Plus className="w-4 h-4" />
            Ajouter une règle
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
            data-testid="done-conditional-rules-button"
          >
            Terminé
          </button>
        </div>
      )}
    </div>
  );
}
