import React, { useState, useMemo } from "react";
import type { ConditionalRule } from "../../types/conditionalRules";
import { shouldShowQuestion, cleanHiddenAnswers } from "../../lib/conditionalEvaluator";

interface FormQuestion {
  id: string;
  title: string;
  type: "single" | "multiple" | "text" | "long-text";
  required?: boolean;
  options?: Array<{ id: string; label: string }>;
  maxChoices?: number;
  placeholder?: string;
}

interface FormWithConditionalsProps {
  title: string;
  questions: FormQuestion[];
  conditionalRules?: ConditionalRule[];
  onSubmit: (answers: Record<string, string | string[]>) => void;
  respondentName?: string;
}

/**
 * Formulaire avec support des questions conditionnelles
 * Affiche/masque dynamiquement les questions selon les réponses
 */
export default function FormWithConditionals({
  title,
  questions,
  conditionalRules = [],
  onSubmit,
  respondentName = "",
}: FormWithConditionalsProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [name, setName] = useState(respondentName);

  // Calculer les questions visibles
  const visibleQuestionIds = useMemo(() => {
    return questions
      .filter((q) => shouldShowQuestion(q.id, conditionalRules, answers))
      .map((q) => q.id);
  }, [questions, conditionalRules, answers]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Nettoyer les réponses des questions masquées
    const cleanedAnswers = cleanHiddenAnswers(answers, visibleQuestionIds);

    // Valider que toutes les questions visibles requises sont remplies
    const requiredQuestions = questions.filter(
      (q) => q.required && visibleQuestionIds.includes(q.id),
    );

    for (const q of requiredQuestions) {
      const answer = cleanedAnswers[q.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        alert(`Veuillez répondre à la question : ${q.title}`);
        return;
      }
    }

    onSubmit(cleanedAnswers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
      </div>

      {/* Nom du répondant (optionnel) */}
      <div>
        <label className="block text-sm font-medium mb-1">Votre nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Entrez votre nom"
        />
      </div>

      {/* Questions */}
      {questions.map((question) => {
        // Ne pas afficher la question si elle est masquée
        if (!visibleQuestionIds.includes(question.id)) {
          return null;
        }

        const answer = answers[question.id];

        return (
          <div key={question.id} className="space-y-2">
            <label className="block font-medium">
              {question.title}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {question.type === "single" && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.label}
                      checked={answer === option.label}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "multiple" && question.options && (
              <div className="space-y-2">
                {question.maxChoices && (
                  <div className="text-sm text-gray-600">(Maximum {question.maxChoices} choix)</div>
                )}
                {question.options.map((option) => {
                  const selectedOptions = Array.isArray(answer) ? answer : [];
                  const isChecked = selectedOptions.includes(option.label);
                  const maxReached =
                    question.maxChoices &&
                    selectedOptions.length >= question.maxChoices &&
                    !isChecked;

                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-2 ${maxReached ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        value={option.label}
                        checked={isChecked}
                        disabled={maxReached}
                        onChange={(e) => {
                          const currentSelected = Array.isArray(answer) ? answer : [];
                          const newSelected = e.target.checked
                            ? [...currentSelected, e.target.value]
                            : currentSelected.filter((v) => v !== e.target.value);
                          handleAnswerChange(question.id, newSelected);
                        }}
                        className="w-4 h-4"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {question.type === "text" && (
              <input
                type="text"
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || "Votre réponse"}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}

            {question.type === "long-text" && (
              <textarea
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || "Votre réponse détaillée..."}
                className="w-full px-3 py-2 border rounded-md"
                rows={6}
              />
            )}
          </div>
        );
      })}

      {/* Submit button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700"
        data-testid="formwithconditionals-envoyer-mes-rponses"
      >
        Envoyer mes réponses
      </button>

      {/* Debug info in dev */}
      {import.meta.env.DEV && (
        <details className="text-xs text-gray-500">
          <summary>Debug conditionnelles</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify({ visibleQuestionIds, answers, conditionalRules }, null, 2)}
          </pre>
        </details>
      )}
    </form>
  );
}
