import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  X,
  Trophy,
  RefreshCw,
  Loader2,
  Brain,
  Share2,
  Copy,
  CheckCircle,
  Mic,
  MicOff,
  Clock,
  BarChart3,
  Shield,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  getQuizzBySlugOrId,
  addQuizzResponse,
  getChildHistory,
  getNewBadges,
  getQuizzResponses,
  type Quizz,
  type QuizzQuestion,
  type QuizzResponse,
  type Badge,
} from "../../lib/products/quizz/quizz-service";
import type { Poll } from "../../lib/pollStorage";
import { secureGeminiService } from "../../services/SecureGeminiService";
import { cn } from "../../lib/utils";
import { logError, ErrorFactory } from "../../lib/error-handling";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { getPollClosureReason } from "../../lib/pollEnforcement";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildAbsoluteUrl } from "@/lib/baseUrlUtils";

// Configuration du timer (en secondes)
const DEFAULT_TIME_PER_QUESTION = 30; // 30 secondes par question par défaut

// Couleurs cohérentes pour le produit Quizz (jaune/amber)
const QUIZZ_COLORS = {
  primary: "amber",
  gradient: "from-amber-500 to-yellow-500",
  button: "bg-amber-500 hover:bg-amber-600",
  buttonOutline: "border-amber-500 text-amber-700 bg-amber-50",
  text: "text-amber-700",
  border: "border-amber-500",
  light: "bg-amber-50",
} as const;

// Fonction pour lancer des confettis CSS
function launchConfetti() {
  const colors = ["#a855f7", "#3b82f6", "#22c55e", "#eab308", "#ef4444", "#ec4899"];
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(container);

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 2;

    confetti.style.cssText = `
      position:absolute;
      width:${size}px;
      height:${size}px;
      background:${color};
      left:${left}%;
      top:-20px;
      border-radius:${Math.random() > 0.5 ? "50%" : "0"};
      animation:confetti-fall ${duration}s ease-out ${delay}s forwards;
    `;
    container.appendChild(confetti);
  }

  // Ajouter l'animation CSS si elle n'existe pas
  if (!document.getElementById("confetti-style")) {
    const style = document.createElement("style");
    style.id = "confetti-style";
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Nettoyer après l'animation
  setTimeout(() => container.remove(), 4000);
}

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
  const [hasStarted, setHasStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<QuestionFeedback | null>(null);
  const [result, setResult] = useState<QuizzResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false); // Pour la vérification Gemini
  const [linkCopied, setLinkCopied] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]); // Nouveaux badges gagnés
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0); // Pour calculer les nouveaux
  const [closureReason, setClosureReason] = useState<
    "expired" | "capped" | "closed" | "archived" | null
  >(null);

  // ⏱️ Timer
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_PER_QUESTION);
  const [timerDuration, setTimerDuration] = useState(DEFAULT_TIME_PER_QUESTION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🎤 Dictée vocale
  const voiceRecognition = useVoiceRecognition({
    lang: "fr-FR",
    interimResults: true,
    continuous: false,
  });

  // Lancer les confettis quand le résultat est bon (>75%)
  useEffect(() => {
    if (result && result.percentage >= 75) {
      launchConfetti();
    }
  }, [result]);

  // Copier le lien du quiz
  const copyQuizLink = useCallback(() => {
    const url = buildAbsoluteUrl(`quizz/${slug}/vote`);
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [slug]);

  useEffect(() => {
    if (slug) {
      const q = getQuizzBySlugOrId(slug);
      setQuizz(q);

      if (q) {
        // Vérifier si le quiz est fermé/expiré/complet
        const responses = getQuizzResponses(q.id);
        const reason = getPollClosureReason(q as unknown as Poll, responses.length);
        setClosureReason(reason);
      }

      setLoading(false);
    }
  }, [slug]);

  const questions = quizz?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = currentStep === totalQuestions - 1;

  // ⏱️ Timer logic - doit être après la définition de currentQuestion
  useEffect(() => {
    // Réinitialiser le timer à chaque nouvelle question
    if (timerEnabled && hasStarted && !showFeedback && currentQuestion) {
      setTimeLeft(timerDuration);
    }
  }, [currentStep, timerEnabled, hasStarted, showFeedback, timerDuration, currentQuestion]);

  // Fonction appelée quand le temps est écoulé
  const handleTimeUp = useCallback(() => {
    if (!currentQuestion || !quizz) return;

    // Si pas de réponse, marquer comme incorrect
    const userAnswer = answers[currentQuestion.id];
    if (
      userAnswer === undefined ||
      userAnswer === null ||
      (typeof userAnswer === "string" && userAnswer.trim() === "") ||
      (Array.isArray(userAnswer) && userAnswer.length === 0)
    ) {
      // Pas de réponse = faux
      setCurrentFeedback({
        isCorrect: false,
        explanation: "⏱️ Temps écoulé ! Tu n'as pas répondu à temps.",
        correctAnswer: currentQuestion.correctAnswer,
      });
      setShowFeedback(true);
    }
  }, [currentQuestion, quizz, answers]);

  useEffect(() => {
    // Arrêter le timer si pas activé ou si on montre le feedback
    if (!timerEnabled || !hasStarted || showFeedback || !currentQuestion) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Démarrer le compte à rebours
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Temps écoulé ! Soumettre automatiquement
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Marquer comme faux si pas de réponse
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerEnabled, hasStarted, showFeedback, currentQuestion, handleTimeUp]);

  // 🎤 Synchroniser la dictée vocale avec le champ de réponse texte
  useEffect(() => {
    if (voiceRecognition.isListening && currentQuestion) {
      const transcript =
        voiceRecognition.finalTranscript +
        (voiceRecognition.interimTranscript ? " " + voiceRecognition.interimTranscript : "");
      if (transcript.trim()) {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: transcript.trim() }));
      }
    }
  }, [
    voiceRecognition.finalTranscript,
    voiceRecognition.interimTranscript,
    voiceRecognition.isListening,
    currentQuestion,
  ]);

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

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !quizz) return;

    const userAnswer = answers[currentQuestion.id];

    // Pour les questions text-ai, utiliser Gemini pour vérifier
    if (currentQuestion.type === "text-ai") {
      setIsChecking(true);
      try {
        const result = await checkAnswerWithGemini(currentQuestion, userAnswer as string);
        setCurrentFeedback({
          isCorrect: result.isCorrect,
          explanation: result.explanation || currentQuestion.explanation,
          correctAnswer: currentQuestion.correctAnswer,
        });
      } catch {
        // Fallback sur comparaison locale si Gemini échoue
        const isCorrect = checkAnswerLocally(currentQuestion, userAnswer);
        setCurrentFeedback({
          isCorrect,
          explanation: currentQuestion.explanation,
          correctAnswer: currentQuestion.correctAnswer,
        });
      } finally {
        setIsChecking(false);
      }
    } else {
      // Vérification locale pour les autres types
      const isCorrect = checkAnswerLocally(currentQuestion, userAnswer);
      setCurrentFeedback({
        isCorrect,
        explanation: currentQuestion.explanation,
        correctAnswer: currentQuestion.correctAnswer,
      });
    }
    setShowFeedback(true);
  };

  // Vérification par Gemini pour les réponses complexes
  async function checkAnswerWithGemini(
    question: QuizzQuestion,
    userAnswer: string,
  ): Promise<{ isCorrect: boolean; explanation?: string }> {
    const prompt = `Tu es un correcteur de quiz scolaire. Compare la réponse de l'élève avec la réponse attendue.

Question: ${question.question}
Réponse attendue: ${question.correctAnswer}
Réponse de l'élève: ${userAnswer}

Analyse si la réponse de l'élève est correcte (même sens, synonymes acceptés, petites erreurs d'orthographe tolérées).

Réponds UNIQUEMENT en JSON:
{"isCorrect": true/false, "explanation": "Brève explication pédagogique"}`;

    const response = await secureGeminiService.generateContent(userAnswer, prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback
      }
    }

    // Si parsing échoue, comparaison souple
    return {
      isCorrect: normalizeAnswer(userAnswer) === normalizeAnswer(String(question.correctAnswer)),
    };
  }

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
      // Récupérer le nombre de badges AVANT la soumission
      const childName = respondentName.trim();
      let badgeCountBefore = 0;
      if (childName) {
        const historyBefore = getChildHistory(childName);
        badgeCountBefore = historyBefore?.badges.length || 0;
      }

      const response = addQuizzResponse({
        pollId: quizz.id,
        answers: formattedAnswers,
        respondentName: childName || undefined,
      });
      setResult(response);

      // Calculer les nouveaux badges gagnés
      if (childName) {
        const newBadges = getNewBadges(childName, badgeCountBefore);
        if (newBadges.length > 0) {
          setEarnedBadges(newBadges);
        }
      }
    } catch (error) {
      logError(
        ErrorFactory.validation(
          "Erreur lors de la soumission du quiz",
          "Une erreur est survenue lors de la soumission",
        ),
        { component: "QuizzVote", operation: "handleSubmit", metadata: { error } },
      );
    }
  };

  // Normalise une réponse pour comparaison souple
  function normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^\w\s]/g, "") // Supprime la ponctuation
      .replace(/\s+/g, " "); // Normalise les espaces
  }

  // Vérification locale avec comparaison souple pour le texte
  function checkAnswerLocally(question: QuizzQuestion, userAnswer: AnswerValue): boolean {
    switch (question.type) {
      case "single":
        // QCM : comparaison exacte
        return userAnswer === question.correctAnswer;
      case "text":
      case "text-ai":
        // Texte : comparaison souple (insensible casse/accents/espaces)
        // Pour text-ai, c'est un fallback si Gemini échoue
        if (typeof userAnswer !== "string" || typeof question.correctAnswer !== "string") {
          return userAnswer === question.correctAnswer;
        }
        return normalizeAnswer(userAnswer) === normalizeAnswer(question.correctAnswer);
      case "multiple": {
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
          return false;
        }
        const userSet = new Set(userAnswer);
        const correctSet = new Set(question.correctAnswer as string[]);
        return userSet.size === correctSet.size && [...userSet].every((x) => correctSet.has(x));
      }
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
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // Écran de clôture / Quota atteint / Expiration
  if (closureReason && !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-2xl">
          {closureReason === "expired" ? (
            <>
              <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz expiré</h1>
              <p className="text-gray-600 mb-6">
                Le temps imparti pour participer à ce quiz est écoulé.
              </p>
            </>
          ) : closureReason === "capped" ? (
            <>
              <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz complet</h1>
              <p className="text-gray-600 mb-6">
                Le nombre maximum de participants pour ce quiz a été atteint.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz clôturé</h1>
              <p className="text-gray-600 mb-6">Ce quiz n'accepte plus de réponses.</p>
            </>
          )}

          <Button
            onClick={() => navigate("/quizz")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            data-testid="quizzvote-retour-aux-quiz"
          >
            Retour aux quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!quizz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-md w-full shadow-2xl">
          <div className="text-5xl sm:text-6xl mb-4">{emoji}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Quiz terminé !</h1>

          <div className="my-6 sm:my-8">
            <div className="text-5xl sm:text-6xl font-bold text-amber-600 mb-2">
              {Math.round(result.percentage)}%
            </div>
            <div className="text-base sm:text-lg text-gray-600">
              {result.totalPoints} / {result.maxPoints} points
            </div>
          </div>

          <p className="text-lg sm:text-xl text-gray-700 mb-4">{message}</p>

          {/* Nouveaux badges gagnés */}
          {earnedBadges.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-3">
                🎉{" "}
                {earnedBadges.length === 1
                  ? "Nouveau badge débloqué !"
                  : `${earnedBadges.length} nouveaux badges débloqués !`}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {earnedBadges.map((badge, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm"
                  >
                    <span className="text-2xl mb-1">{badge.emoji}</span>
                    <span className="text-xs font-medium text-gray-700">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lien vers l'historique */}
          {respondentName.trim() && (
            <Button
              onClick={() =>
                navigate(
                  `/quizz/history/${encodeURIComponent(respondentName.trim().toLowerCase())}`,
                )
              }
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="quizzvote-voir-mon-historique-et-tous-mes-badges-"
            >
              Voir mon historique et tous mes badges →
            </Button>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => {
                setAnswers({});
                setCurrentStep(0);
                setHasStarted(false);
                setResult(null);
                setTimeLeft(timerDuration);
                setEarnedBadges([]);
              }}
              size="lg"
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-amber-700 transition-colors active:scale-[0.98]"
              data-testid="quizzvote-button"
            >
              <RefreshCw className="w-5 h-5" />
              Recommencer
            </Button>

            {/* Bouton Partager */}
            <Button
              onClick={copyQuizLink}
              size="lg"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-[0.98]"
              data-testid="quizzvote-button"
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-600">Lien copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Partager ce quiz
                </>
              )}
            </Button>

            {/* Lien vers les résultats détaillés */}
            <Button
              onClick={() => navigate(`/quizz/${slug}/results`)}
              size="lg"
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 px-6 rounded-xl font-medium hover:bg-blue-100 transition-colors"
              data-testid="quizzvote-navigate"
            >
              <BarChart3 className="w-5 h-5" />
              Voir les statistiques
            </Button>

            <Button
              onClick={() => navigate("/quizz")}
              size="sm"
              variant="ghost"
              className="w-full text-gray-500 py-3 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              data-testid="quizzvote-retour-aux-quiz"
            >
              Retour aux quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Étape : Nom du participant (avant les questions)
  if (!hasStarted && questions.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
          {/* Bouton partage en haut à droite */}
          <div className="flex justify-end mb-2">
            <Button
              onClick={copyQuizLink}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 transition-colors"
              title="Copier le lien"
              data-testid="quizzvote-button"
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le lien</span>
                </>
              )}
            </Button>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{quizz.title}</h1>
            {quizz.description && (
              <p className="text-gray-600 mt-2 text-sm sm:text-base">{quizz.description}</p>
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
                className="w-full px-4 py-3 sm:py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base text-gray-900"
                placeholder="Ton prénom..."
                data-testid="quizz-voter-name-input"
              />
            </div>

            {/* Option Timer */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-gray-700">Mode chrono</span>
                </div>
                <Button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    timerEnabled ? "bg-amber-500" : "bg-gray-300",
                  )}
                  data-testid="quizzvote-button"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      timerEnabled ? "translate-x-6" : "translate-x-0.5",
                    )}
                  />
                </Button>
              </div>
              {timerEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Temps par question :</span>
                  <select
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                    <option value={45}>45s</option>
                    <option value={60}>1 min</option>
                    <option value={90}>1m30</option>
                    <option value={120}>2 min</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              onClick={() => setHasStarted(true)}
              size="lg"
              className="w-full bg-amber-600 text-white py-4 sm:py-5 px-6 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              data-testid="quizzvote-commencer-le-quiz"
            >
              Commencer le quiz
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* Informations RGPD */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Vos données</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Vos réponses et nom (si fourni) sont stockés pour afficher les résultats.</p>
                <p>Vous pouvez demander la suppression en contactant le créateur du quiz.</p>
                <p>
                  Pour en savoir plus, consultez la{" "}
                  <Link
                    to="/privacy"
                    className="text-blue-600 hover:text-blue-500 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Politique de confidentialité complète
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la question
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-yellow-500 flex flex-col">
      {/* Barre de progression */}
      <div className="bg-white/20 h-2">
        <div
          className="bg-white h-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Compteur de questions + Timer */}
      <div className="text-white text-center py-4 flex items-center justify-center gap-4">
        <span className="text-lg font-medium">
          Question {currentStep + 1} / {totalQuestions}
        </span>
        {timerEnabled && !showFeedback && (
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full font-bold",
              timeLeft <= 5
                ? "bg-red-500 animate-pulse"
                : timeLeft <= 10
                  ? "bg-orange-500"
                  : "bg-white/20",
            )}
          >
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl p-5 sm:p-8 max-w-lg w-full shadow-2xl">
          {showFeedback && currentFeedback ? (
            // Affichage du feedback
            <div className="text-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                  currentFeedback.isCorrect ? "bg-green-100" : "bg-red-100",
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
                  <span className="font-semibold text-amber-600">
                    {Array.isArray(currentFeedback.correctAnswer)
                      ? currentFeedback.correctAnswer.join(", ")
                      : String(currentFeedback.correctAnswer)}
                  </span>
                </p>
              )}

              {currentFeedback.explanation && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800">💡 {currentFeedback.explanation}</p>
                </div>
              )}

              <Button
                onClick={handleNextQuestion}
                className="w-full bg-amber-600 text-white py-5 sm:py-4 px-6 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                data-testid="quizzvote-button"
              >
                {isLastQuestion ? "Voir mes résultats" : "Question suivante"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            // Affichage de la question
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">{currentQuestion?.question}</h2>

              <div className="space-y-3 mb-8">
                {currentQuestion?.type === "single" &&
                  currentQuestion.options?.map((option, idx) => (
                    <Button
                      key={idx}
                      onClick={() => updateAnswer(currentQuestion.id, option)}
                      className={cn(
                        "w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all active:scale-[0.98]",
                        answers[currentQuestion.id] === option
                          ? "border-amber-600 bg-amber-50 text-amber-700"
                          : "border-gray-200 hover:border-amber-300 text-gray-800",
                      )}
                      data-testid="quizzvote-button"
                    >
                      <span className="font-medium text-gray-800 text-base sm:text-lg">
                        {option}
                      </span>
                    </Button>
                  ))}

                {currentQuestion?.type === "multiple" &&
                  currentQuestion.options?.map((option, idx) => {
                    const selected = Array.isArray(answers[currentQuestion.id])
                      ? (answers[currentQuestion.id] as string[]).includes(option)
                      : false;
                    return (
                      <Button
                        key={idx}
                        onClick={() => {
                          const current = (answers[currentQuestion.id] as string[]) || [];
                          const next = selected
                            ? current.filter((o) => o !== option)
                            : [...current, option];
                          updateAnswer(currentQuestion.id, next);
                        }}
                        className={cn(
                          "w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all flex items-center gap-3 active:scale-[0.98]",
                          selected
                            ? "border-amber-600 bg-amber-50 text-amber-700"
                            : "border-gray-200 hover:border-amber-300 text-gray-800",
                        )}
                        data-testid="quizzvote-button"
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0",
                            selected ? "bg-amber-600 border-amber-600" : "border-gray-300",
                          )}
                        >
                          {selected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium text-gray-800 text-base sm:text-lg">
                          {option}
                        </span>
                      </Button>
                    );
                  })}

                {currentQuestion?.type === "true-false" && (
                  <div className="flex gap-3 sm:gap-4">
                    {[true, false].map((value) => (
                      <Button
                        key={String(value)}
                        onClick={() => updateAnswer(currentQuestion.id, value)}
                        className={cn(
                          "flex-1 p-5 sm:p-6 rounded-xl border-2 font-bold text-lg sm:text-xl transition-all active:scale-[0.98]",
                          answers[currentQuestion.id] === value
                            ? "border-amber-600 bg-amber-50 text-amber-700"
                            : "border-gray-200 hover:border-amber-300 text-gray-800",
                        )}
                        data-testid="quizzvote-button"
                      >
                        {value ? "✓ Vrai" : "✗ Faux"}
                      </Button>
                    ))}
                  </div>
                )}

                {currentQuestion?.type === "text" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={(answers[currentQuestion.id] as string) || ""}
                        onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        placeholder="Ta réponse..."
                      />
                      {/* Bouton dictée vocale */}
                      {voiceRecognition.isSupported && (
                        <Button
                          type="button"
                          onClick={() => {
                            if (voiceRecognition.isListening) {
                              voiceRecognition.stopListening();
                            } else {
                              voiceRecognition.resetTranscript();
                              voiceRecognition.startListening();
                            }
                          }}
                          className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                            voiceRecognition.isListening
                              ? "bg-red-100 text-red-600 animate-pulse"
                              : "bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-600",
                          )}
                          title={
                            voiceRecognition.isListening ? "Arrêter la dictée" : "Dicter ma réponse"
                          }
                          data-testid="quizzvote-button"
                        >
                          {voiceRecognition.isListening ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </Button>
                      )}
                    </div>
                    {/* Message d'erreur dictée vocale */}
                    {voiceRecognition.error && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <MicOff className="w-3 h-3" />
                        {voiceRecognition.error}
                      </p>
                    )}
                    {/* Message si navigateur non supporté (Safari iOS) */}
                    {voiceRecognition.isUnsupportedBrowser && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MicOff className="w-3 h-3" />
                        Dictée vocale non disponible sur Safari iOS
                      </p>
                    )}
                  </div>
                )}

                {currentQuestion?.type === "text-ai" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={(answers[currentQuestion.id] as string) || ""}
                        onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[100px] text-gray-900"
                        placeholder="Écris ta réponse complète..."
                      />
                      {/* Bouton dictée vocale */}
                      {voiceRecognition.isSupported && (
                        <Button
                          type="button"
                          onClick={() => {
                            if (voiceRecognition.isListening) {
                              voiceRecognition.stopListening();
                            } else {
                              voiceRecognition.resetTranscript();
                              voiceRecognition.startListening();
                            }
                          }}
                          className={cn(
                            "absolute right-3 top-3 p-2 rounded-lg transition-colors",
                            voiceRecognition.isListening
                              ? "bg-red-100 text-red-600 animate-pulse"
                              : "bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-600",
                          )}
                          title={
                            voiceRecognition.isListening ? "Arrêter la dictée" : "Dicter ma réponse"
                          }
                          data-testid="quizzvote-button"
                        >
                          {voiceRecognition.isListening ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </Button>
                      )}
                    </div>
                    {/* Message d'erreur dictée vocale */}
                    {voiceRecognition.error && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <MicOff className="w-3 h-3" />
                        {voiceRecognition.error}
                      </p>
                    )}
                    {/* Message si navigateur non supporté (Safari iOS) */}
                    {voiceRecognition.isUnsupportedBrowser && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MicOff className="w-3 h-3" />
                        Dictée vocale non disponible sur Safari iOS
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <Brain className="w-4 h-4" />
                      <span>Réponse vérifiée par IA (synonymes acceptés)</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmitAnswer}
                disabled={!hasAnswer || isChecking}
                className={cn(
                  "w-full py-5 sm:py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                  hasAnswer && !isChecking
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                )}
                data-testid="quizzvote-button"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Vérification IA...
                  </>
                ) : (
                  <>
                    Valider ma réponse
                    <Check className="w-5 h-5" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
