import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Check, X, Trophy, Star, RefreshCw } from "lucide-react";
import {
  getQuizzBySlugOrId,
  addQuizzResponse,
  type Quizz,
  type QuizzQuestion,
  type QuizzResponse,
} from "../../lib/products/quizz/quizz-service";
import { cn } from "../../lib/utils";
import { logError, ErrorFactory } from "../../lib/error-handling";

type AnswerValue = string | string[] | boolean;

interface QuestionFeedback {
  isCorrect: boolean;
  explanation?: string;
  correctAnswer: string | string[] | boolean;
}

export default function QuizzVote() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [quizz, setQuizz] = useState<Quizz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [respondentName, setRespondentName] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<QuestionFeedback | null>(null);
  const [result, setResult] = useState<QuizzResponse | null>(null);

  // Charger le quizz
  useEffect(() => {
    if (slug) {
      const q = getQuizzBySlugOrId(slug);
      setQuizz(q);
      setLoading(false);
    }
  }, [slug]);

  const questions = quizz?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = currentStep === totalQuestions - 1;

  // Vérifier si la question actuelle a une réponse
  const hasAnswer = useMemo(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null) return false;
    if (typeof answer === "string") return answer.trim().length > 0;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  }, [currentQuestion, answers]);

  const updateAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !quizz) return;

    const userAnswer = answers[currentQuestion.id];

    // Vérifier la réponse
    const isCorrect = checkAnswerLocally(currentQuestion, userAnswer);

    setCurrentFeedback({
      isCorrect,
      explanation: currentQuestion.explanation,
      correctAnswer: currentQuestion.correctAnswer,
    });
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setCurrentFeedback(null);

    if (isLastQuestion) {
      // Soumettre toutes les réponses
      submitQuizz();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const submitQuizz = () => {
    if (!quizz) return;

    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    try {
      const response = addQuizzResponse({
        pollId: quizz.id,
        answers: formattedAnswers,
        respondentName: respondentName.trim() || undefined,
      });
      setResult(response);
    } catch (error) {
      logError(
        ErrorFactory.validation("Erreur lors de la soumission du quiz", "Une erreur est survenue lors de la soumission"),
        { component: "QuizzVote", operation: "handleSubmit", metadata: { error } }
      );
    }
  };

  // Vérification locale (même logique que quizz-service)
  function checkAnswerLocally(question: QuizzQuestion, userAnswer: AnswerValue): boolean {
    switch (question.type) {
      case "single":
      case "text":
        return userAnswer === question.correctAnswer;
      case "multiple":
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
          return false;
        }
        const userSet = new Set(userAnswer);
        const correctSet = new Set(question.correctAnswer as string[]);
        return userSet.size === correctSet.size && [...userSet].every((x) => correctSet.has(x));
      case "true-false":
        return userAnswer === question.correctAnswer;
      default:
        return false;
    }
  }

  // Message d'encouragement selon le score
  function getEncouragementMessage(percentage: number): { emoji: string; message: string } {
    if (percentage >= 90) return { emoji: "🏆", message: "Exceptionnel ! Tu es un champion !" };
    if (percentage >= 75) return { emoji: "🌟", message: "Bravo ! Excellent travail !" };
    if (percentage >= 50) return { emoji: "👍", message: "Bien joué ! Continue comme ça !" };
    if (percentage >= 25) return { emoji: "💪", message: "Pas mal ! Tu peux encore progresser !" };
    return { emoji: "📚", message: "Continue tes efforts, tu vas y arriver !" };
  }

  // États de chargement et erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  if (!quizz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz introuvable</h1>
          <p className="text-gray-600">Ce quiz n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  // Écran de résultat final
  if (result) {
    const { emoji, message } = getEncouragementMessage(result.percentage);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-2xl">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz terminé !</h1>

          <div className="my-8">
            <div className="text-6xl font-bold text-purple-600 mb-2">
              {Math.round(result.percentage)}%
            </div>
            <div className="text-lg text-gray-600">
              {result.totalPoints} / {result.maxPoints} points
            </div>
          </div>

          <p className="text-xl text-gray-700 mb-8">{message}</p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setAnswers({});
                setCurrentStep(0);
                setResult(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Recommencer
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full text-gray-600 py-2 hover:text-gray-800 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Étape : Nom du participant (avant les questions)
  if (currentStep === 0 && !respondentName && questions.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">{quizz.title}</h1>
            {quizz.description && (
              <p className="text-gray-600 mt-2">{quizz.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              {totalQuestions} question{totalQuestions > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment t'appelles-tu ? (optionnel)
              </label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ton prénom..."
              />
            </div>

            <button
              onClick={() => setCurrentStep(0)}
              className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              Commencer le quiz
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la question
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col">
      {/* Barre de progression */}
      <div className="bg-white/20 h-2">
        <div
          className="bg-white h-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Compteur de questions */}
      <div className="text-white text-center py-4">
        <span className="text-lg font-medium">
          Question {currentStep + 1} / {totalQuestions}
        </span>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
          {showFeedback && currentFeedback ? (
            // Affichage du feedback
            <div className="text-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                  currentFeedback.isCorrect ? "bg-green-100" : "bg-red-100"
                )}
              >
                {currentFeedback.isCorrect ? (
                  <Check className="w-10 h-10 text-green-600" />
                ) : (
                  <X className="w-10 h-10 text-red-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold mb-4">
                {currentFeedback.isCorrect ? "Correct ! 🎉" : "Pas tout à fait..."}
              </h2>

              {!currentFeedback.isCorrect && (
                <p className="text-gray-600 mb-4">
                  La bonne réponse était :{" "}
                  <span className="font-semibold text-purple-600">
                    {Array.isArray(currentFeedback.correctAnswer)
                      ? currentFeedback.correctAnswer.join(", ")
                      : String(currentFeedback.correctAnswer)}
                  </span>
                </p>
              )}

              {currentFeedback.explanation && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800">
                    💡 {currentFeedback.explanation}
                  </p>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                {isLastQuestion ? "Voir mes résultats" : "Question suivante"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // Affichage de la question
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {currentQuestion?.question}
              </h2>

              <div className="space-y-3 mb-8">
                {currentQuestion?.type === "single" &&
                  currentQuestion.options?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateAnswer(currentQuestion.id, option)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all",
                        answers[currentQuestion.id] === option
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:border-purple-300"
                      )}
                    >
                      <span className="font-medium">{option}</span>
                    </button>
                  ))}

                {currentQuestion?.type === "multiple" &&
                  currentQuestion.options?.map((option, idx) => {
                    const selected = Array.isArray(answers[currentQuestion.id])
                      ? (answers[currentQuestion.id] as string[]).includes(option)
                      : false;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const current = (answers[currentQuestion.id] as string[]) || [];
                          const next = selected
                            ? current.filter((o) => o !== option)
                            : [...current, option];
                          updateAnswer(currentQuestion.id, next);
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                          selected
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-purple-300"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center",
                            selected ? "bg-purple-600 border-purple-600" : "border-gray-300"
                          )}
                        >
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium">{option}</span>
                      </button>
                    );
                  })}

                {currentQuestion?.type === "true-false" && (
                  <div className="flex gap-4">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        onClick={() => updateAnswer(currentQuestion.id, value)}
                        className={cn(
                          "flex-1 p-4 rounded-xl border-2 font-semibold transition-all",
                          answers[currentQuestion.id] === value
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-purple-300"
                        )}
                      >
                        {value ? "Vrai" : "Faux"}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion?.type === "text" && (
                  <input
                    type="text"
                    value={(answers[currentQuestion.id] as string) || ""}
                    onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ta réponse..."
                  />
                )}
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={!hasAnswer}
                className={cn(
                  "w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2",
                  hasAnswer
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                Valider ma réponse
                <Check className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
