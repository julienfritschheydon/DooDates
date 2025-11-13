import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Poll, FormQuestionShape } from "../../lib/pollStorage";
import { addFormResponse } from "../../lib/pollStorage";
import { sendVoteConfirmationEmail } from "../../services/EmailService";
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
  const [respondentEmail, setRespondentEmail] = useState("");
  const [wantsEmailCopy, setWantsEmailCopy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  // Ajouter une étape finale pour les coordonnées (step = visibleQuestions.length)
  const totalSteps = visibleQuestions.length + 1; // +1 pour l'étape coordonnées
  const isOnCoordinatesStep = currentStep === visibleQuestions.length;
  const currentQuestion = isOnCoordinatesStep ? null : visibleQuestions[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastQuestion = currentStep === visibleQuestions.length - 1;

  // Vérifier si la question actuelle est répondue
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];

    if (currentQuestion.required) {
      if (!answer) return false;

      // Vérifications spécifiques par type
      if (
        (currentQuestion.kind === "text" || currentQuestion.kind === "long-text") &&
        typeof answer === "string"
      ) {
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

  const goNext = useCallback(() => {
    if (currentStep < visibleQuestions.length) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, visibleQuestions.length]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

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
  }, [currentStep, isCurrentQuestionAnswered, isLastQuestion, goNext, goBack]);

  const handleAnswer = (value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation email si demandé
      if (wantsEmailCopy && !respondentEmail.trim()) {
        toast({
          title: "Email requis",
          description: "Veuillez entrer votre email pour recevoir une copie",
          variant: "destructive",
        });
        return;
      }
      if (
        wantsEmailCopy &&
        respondentEmail.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail.trim())
      ) {
        toast({
          title: "Email invalide",
          description: "Veuillez entrer une adresse email valide",
          variant: "destructive",
        });
        return;
      }

      const response = addFormResponse({
        pollId: poll.id,
        respondentName: respondentName || undefined,
        respondentEmail: wantsEmailCopy ? respondentEmail.trim() : undefined,
        items: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      });

      // Envoyer l'email si demandé
      if (wantsEmailCopy && respondentEmail.trim()) {
        try {
          await sendVoteConfirmationEmail({
            poll,
            response,
            questions: (poll.questions || []) as FormQuestionShape[],
          });
        } catch (emailError) {
          logError(
            ErrorFactory.api(
              "Erreur lors de l'envoi de l'email",
              "Erreur lors de l'envoi de l'email",
            ),
            {
              component: "MultiStepFormVote",
              operation: "sendVoteConfirmationEmail",
            },
          );
          // Ne pas bloquer la soumission si l'email échoue
        }
      }

      setSubmitted(true);
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

  // Si aucune question visible, afficher un message
  if (visibleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Aucune question disponible</p>
      </div>
    );
  }

  // Page de confirmation après soumission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Merci pour votre participation !
          </h2>
          <p className="text-gray-600 mb-6">Votre réponse a été enregistrée avec succès.</p>

          {/* Message d'information pour la bêta */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Information bêta</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Pour finaliser et partager votre formulaire, après la bêta, vous devrez vous connecter
              ou créer un compte.
            </p>
          </div>
          <div className="space-y-3">
            {(() => {
              const visibility = poll.resultsVisibility || "creator-only";
              const canSeeResults = visibility === "public" || visibility === "voters";

              return canSeeResults ? (
                <button
                  onClick={() => navigate(`/poll/${poll.slug || poll.id}/results`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  Voir les résultats
                </button>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                  ℹ️ Les résultats ne sont pas publics pour ce sondage.
                </div>
              );
            })()}
            <button
              onClick={() => navigate("/")}
              className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all border border-gray-300"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
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

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Indicateur de progression */}
          <div className="text-center mb-8">
            {isOnCoordinatesStep ? (
              <>
                <p className="text-sm text-gray-600 font-medium">
                  Dernière étape : Vos coordonnées (optionnel)
                </p>
                <p className="text-xs text-purple-600 mt-1">Vous y êtes presque ! 🎉</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-medium">
                  Question {currentStep + 1} sur {visibleQuestions.length}
                </p>
                {isLastQuestion && (
                  <p className="text-xs text-purple-600 mt-1">Dernière question ! 🎉</p>
                )}
              </>
            )}
          </div>

          {/* Étape coordonnées OU Question */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fadeIn">
            {isOnCoordinatesStep ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Vos coordonnées
                </h2>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Pour recevoir les résultats (facultatif)
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={respondentName}
                      onChange={(e) => setRespondentName(e.target.value)}
                      placeholder="Anonyme"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsEmailCopy}
                        onChange={(e) => setWantsEmailCopy(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Recevoir une copie de mes réponses par email
                      </span>
                    </label>
                    {wantsEmailCopy && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={respondentEmail}
                          onChange={(e) => setRespondentEmail(e.target.value)}
                          placeholder="votre@email.com"
                          required={wantsEmailCopy}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                        />
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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

            {isOnCoordinatesStep ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
              >
                <Check className="w-5 h-5" />
                Soumettre
              </button>
            ) : !isLastQuestion ? (
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
                onClick={goNext}
                disabled={!isCurrentQuestionAnswered}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isCurrentQuestionAnswered
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Suivant : Vos coordonnées
                <ArrowRight className="w-5 h-5" />
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
      <input
        type="text"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || "Votre réponse..."}
        maxLength={question.maxLength}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
      />
    );
  }

  // Long Text
  if (kind === "long-text") {
    return (
      <textarea
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || "Votre réponse détaillée..."}
        maxLength={question.maxLength}
        rows={6}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y bg-white text-gray-900 placeholder:text-gray-400"
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
                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-900"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        {(question.ratingMinLabel || question.ratingMaxLabel) && (
          <div className="flex justify-between text-xs text-gray-700">
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
                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-900"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-700">
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
              <th className="p-2 text-left border-b-2 border-gray-300 bg-gray-50"></th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="p-2 text-center border-b-2 border-gray-300 bg-gray-50 text-sm font-medium text-gray-800"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-medium text-sm text-gray-800 bg-white">{row.label}</td>
                {columns.map((col) => {
                  const isSelected =
                    question.matrixType === "multiple"
                      ? ((matrixValue[row.id] as string[]) || []).includes(col.id)
                      : matrixValue[row.id] === col.id;

                  return (
                    <td key={col.id} className="p-3 text-center bg-white border-r border-gray-200">
                      <button
                        onClick={() => handleMatrixChange(row.id, col.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-600"
                            : "border-gray-400 hover:border-purple-400 hover:bg-gray-50"
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
