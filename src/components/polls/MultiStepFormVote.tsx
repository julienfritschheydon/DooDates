import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Poll, FormQuestionShape } from "../../lib/pollStorage";
import { addFormResponse } from "../../lib/pollStorage";
import { shouldShowQuestion } from "../../lib/conditionalEvaluator";
import { useToast } from "../../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { logError, ErrorFactory } from "../../lib/error-handling";
import "./multi-step-animations.css";

interface MultiStepFormVoteProps {
  poll: Poll;
}

type AnswerValue = string | string[] | Record<string, string | string[]> | number;

export default function MultiStepFormVote({ poll }: MultiStepFormVoteProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [respondentName, setRespondentName] = useState("");

  // Filtrer les questions visibles selon les règles conditionnelles
  const visibleQuestions = useMemo(() => {
    const allQuestions = poll.questions || [];
    const rules = poll.conditionalRules || [];

    // Simplifier les réponses pour l'évaluation conditionnelle
    const simplifiedAnswers: Record<string, string | string[]> = {};
    Object.entries(answers).forEach(([qId, value]) => {
      if (typeof value === "number") {
        simplifiedAnswers[qId] = value.toString();
      } else if (typeof value === "object" && !Array.isArray(value)) {
        // Matrix: vérifier si au moins une ligne est remplie
        const hasAnswer = Object.values(value).some((v) =>
          Array.isArray(v) ? v.length > 0 : Boolean(v),
        );
        simplifiedAnswers[qId] = hasAnswer ? "answered" : "";
      } else {
        simplifiedAnswers[qId] = value;
      }
    });

    return allQuestions.filter((q) => shouldShowQuestion(q.id, rules, simplifiedAnswers));
  }, [poll.questions, poll.conditionalRules, answers]);

  const currentQuestion = visibleQuestions[currentStep];
  const progress = ((currentStep + 1) / visibleQuestions.length) * 100;
  const isLastQuestion = currentStep === visibleQuestions.length - 1;

  // Vérifier si la question actuelle est répondue
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];

    if (currentQuestion.required) {
      if (!answer) return false;

      // Vérifications spécifiques par type
      if (currentQuestion.kind === "text" && typeof answer === "string") {
        return answer.trim().length > 0;
      }
      if (currentQuestion.kind === "multiple" && Array.isArray(answer)) {
        return answer.length > 0;
      }
      if (
        currentQuestion.kind === "matrix" &&
        typeof answer === "object" &&
        !Array.isArray(answer)
      ) {
        const matrixAnswer = answer as Record<string, string | string[]>;
        const rows = currentQuestion.matrixRows || [];
        return rows.every((row) => {
          const rowValue = matrixAnswer[row.id];
          if (currentQuestion.matrixType === "multiple") {
            return Array.isArray(rowValue) && rowValue.length > 0;
          }
          return Boolean(rowValue);
        });
      }
      if (
        (currentQuestion.kind === "rating" || currentQuestion.kind === "nps") &&
        typeof answer === "number"
      ) {
        return true;
      }
      return Boolean(answer);
    }

    return true; // Non requis = toujours OK
  }, [currentQuestion, answers]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isCurrentQuestionAnswered && !isLastQuestion) {
        goNext();
      }
      if (e.key === "ArrowRight" && isCurrentQuestionAnswered && !isLastQuestion) {
        goNext();
      }
      if (e.key === "ArrowLeft" && currentStep > 0) {
        goBack();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, isCurrentQuestionAnswered, isLastQuestion]);

  const goNext = () => {
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAnswer = (value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!isCurrentQuestionAnswered) {
      toast({
        title: "Question requise",
        description: "Veuillez répondre à cette question avant de soumettre.",
        variant: "destructive",
      });
      return;
    }

    try {
      addFormResponse({
        pollId: poll.id,
        respondentName: respondentName || undefined,
        items: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      });

      toast({
        title: "✅ Réponse enregistrée !",
        description: "Merci pour votre participation.",
      });

      // Rediriger vers les résultats après 1 seconde
      setTimeout(() => {
        navigate(`/poll/${poll.slug}/results`);
      }, 1000);
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to submit multi-step form response",
          "Impossible d'enregistrer votre réponse. Veuillez réessayer.",
        ),
        { component: "MultiStepFormVote", pollId: poll.id, metadata: { originalError: error } },
      );
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre réponse. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Aucune question disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Barre de progression */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Nom du répondant (au début, avant les questions) */}
      {currentStep === 0 && (
        <div className="pt-8 px-4">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Votre nom (optionnel)
            </label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Anonyme"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-gray-900"
            />
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Indicateur de progression */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 font-medium">
              Question {currentStep + 1} sur {visibleQuestions.length}
            </p>
            {isLastQuestion && (
              <p className="text-xs text-purple-600 mt-1">Dernière question ! 🎉</p>
            )}
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {currentQuestion.title}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </h2>

            {/* Rendu selon le type de question */}
            <QuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={handleAnswer}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100 shadow-md hover:shadow-lg"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>

            {!isLastQuestion ? (
              <button
                onClick={goNext}
                disabled={!isCurrentQuestionAnswered}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isCurrentQuestionAnswered
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isCurrentQuestionAnswered}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isCurrentQuestionAnswered
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Check className="w-5 h-5" />
                Soumettre
              </button>
            )}
          </div>

          {/* Hint clavier */}
          <div className="text-center mt-4 text-xs text-gray-500">
            {isCurrentQuestionAnswered && !isLastQuestion && (
              <p>
                Appuyez sur <kbd className="px-2 py-1 bg-gray-200 rounded">Entrée</kbd> ou{" "}
                <kbd className="px-2 py-1 bg-gray-200 rounded">→</kbd> pour continuer
              </p>
            )}
            {currentStep > 0 && (
              <p className="mt-1">
                Appuyez sur <kbd className="px-2 py-1 bg-gray-200 rounded">←</kbd> pour revenir
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour rendre chaque type de question
function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: FormQuestionShape;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const kind = question.kind || question.type || "text";

  // Single choice
  if (kind === "single") {
    const options = question.options || [];
    return (
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              value === option.id
                ? "border-purple-600 bg-purple-50 shadow-md"
                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  value === option.id ? "border-purple-600" : "border-gray-300"
                }`}
              >
                {value === option.id && <div className="w-3 h-3 rounded-full bg-purple-600" />}
              </div>
              <span className="font-medium text-gray-900">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Multiple choice
  if (kind === "multiple") {
    const options = question.options || [];
    const selectedValues = (value as string[]) || [];

    const toggleOption = (optionId: string) => {
      const newValues = selectedValues.includes(optionId)
        ? selectedValues.filter((id) => id !== optionId)
        : [...selectedValues, optionId];
      onChange(newValues);
    };

    return (
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedValues.includes(option.id)
                ? "border-purple-600 bg-purple-50 shadow-md"
                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedValues.includes(option.id)
                    ? "border-purple-600 bg-purple-600"
                    : "border-gray-300"
                }`}
              >
                {selectedValues.includes(option.id) && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="font-medium text-gray-900">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Text
  if (kind === "text") {
    return (
      <textarea
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || "Votre réponse..."}
        maxLength={question.maxLength}
        rows={4}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
      />
    );
  }

  // Rating
  if (kind === "rating") {
    const scale = question.ratingScale || 5;
    const currentValue = (value as number) || 0;

    return (
      <div className="space-y-4">
        <div className="flex justify-between gap-2">
          {Array.from({ length: scale }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`flex-1 py-4 rounded-lg border-2 font-bold text-lg transition-all ${
                currentValue === num
                  ? "border-purple-600 bg-purple-600 text-white shadow-lg scale-110"
                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        {(question.ratingMinLabel || question.ratingMaxLabel) && (
          <div className="flex justify-between text-xs text-gray-600">
            <span>{question.ratingMinLabel || ""}</span>
            <span>{question.ratingMaxLabel || ""}</span>
          </div>
        )}
      </div>
    );
  }

  // NPS
  if (kind === "nps") {
    const currentValue = (value as number) || -1;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, i) => i).map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`py-3 rounded-lg border-2 font-bold text-sm transition-all ${
                currentValue === num
                  ? "border-purple-600 bg-purple-600 text-white shadow-lg scale-110"
                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Pas du tout probable</span>
          <span>Extrêmement probable</span>
        </div>
      </div>
    );
  }

  // Matrix
  if (kind === "matrix") {
    const rows = question.matrixRows || [];
    const columns = question.matrixColumns || [];
    const matrixValue = (value as Record<string, string | string[]>) || {};

    const handleMatrixChange = (rowId: string, colId: string) => {
      const newValue = { ...matrixValue };

      if (question.matrixType === "multiple") {
        const current = (newValue[rowId] as string[]) || [];
        newValue[rowId] = current.includes(colId)
          ? current.filter((id) => id !== colId)
          : [...current, colId];
      } else {
        newValue[rowId] = colId;
      }

      onChange(newValue);
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left border-b-2 border-gray-200"></th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="p-2 text-center border-b-2 border-gray-200 text-sm font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="p-3 font-medium text-sm">{row.label}</td>
                {columns.map((col) => {
                  const isSelected =
                    question.matrixType === "multiple"
                      ? ((matrixValue[row.id] as string[]) || []).includes(col.id)
                      : matrixValue[row.id] === col.id;

                  return (
                    <td key={col.id} className="p-3 text-center">
                      <button
                        onClick={() => handleMatrixChange(row.id, col.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-600"
                            : "border-gray-300 hover:border-purple-300"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white mx-auto" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p className="text-gray-500">Type de question non supporté</p>;
}
