/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Camera,
  Sparkles,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import { addQuizz, type Quizz, type QuizzQuestion } from "@/lib/products/quizz/quizz-service";
import {
  saveQuizzDraft,
  loadQuizzDraft,
  clearQuizzDraft,
  hasDraftWithContent,
  isDraftOld,
  draftToQuizz,
  type QuizzDraft,
} from "@/lib/products/quizz/quizz-draft";
import { quizzVisionService } from "@/services/QuizzVisionService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ErrorFactory, logError } from "@/lib/error-handling";
import { Button } from "@/components/ui/button";
import { Settings, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { guestEmailService } from "@/lib/guestEmailService";
import { useAuth } from "@/contexts/AuthContext";
import { fileToGeminiAttachment } from "@/services/FileAttachmentService";
import { PollSettingsForm } from "@/components/polls/PollSettingsForm";
import type { QuizzSettings } from "@/lib/products/quizz/quizz-settings";

// Limites et formats supportés pour les fichiers utilisés en génération de quizz
const MAX_QUIZZ_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
// Préfixes MIME autorisés : images (PNG/JPEG, etc.) et PDF pour les devoirs scannés
const ALLOWED_QUIZZ_ATTACHMENT_MIME_PREFIXES = ["image/", "application/pdf"];
// Liste de types exacts éventuellement supportés à l'avenir (DOCX, etc.)
const ALLOWED_QUIZZ_ATTACHMENT_MIME_EXACT: string[] = [];

// Génère un slug simple à partir du titre
const generateSlug = (title: string): string => {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlève les accents
      .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères spéciaux par des tirets
      .replace(/^-|-$/g, "") // Enlève les tirets en début/fin
      .substring(0, 50) +
    "-" +
    Date.now().toString(36)
  ); // Ajoute un ID unique
};

export const QuizzCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizzQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [advancedSettings, setAdvancedSettings] = useState<QuizzSettings>({
    showEstimatedTime: true,
    showQuestionCount: true,
    requireAuth: false,
    oneResponsePerPerson: true,
    maxResponses: undefined,
    resultsVisibility: "creator-only",
    allowRetry: false,
    showCorrectAnswers: true,
  });
  const { user } = useAuth();
  const [guestEmail, setGuestEmail] = useState("");
  const [isEmailFieldDismissed, setIsEmailFieldDismissed] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedQuiz, setPublishedQuiz] = useState<Quizz | null>(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Auto-save draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftCreatedAt, setDraftCreatedAt] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Charger l'email existant si guest + vérifier le draft
  React.useEffect(() => {
    if (!user) {
      guestEmailService.getGuestEmail().then((email) => {
        if (email) setGuestEmail(email);
      });
      const dismissed = localStorage.getItem("doodates_dismiss_guest_email_field") === "true";
      setIsEmailFieldDismissed(dismissed);
    }

    // Vérifier s'il y a un draft à charger
    const draft = loadQuizzDraft();
    if (draft && hasDraftWithContent()) {
      setShowDraftBanner(true);
      if (isDraftOld()) {
        toast({
          title: "Ancien brouillon trouvé",
          description:
            "Un brouillon de plus de 24h est disponible. Vous pouvez le continuer ou commencer un nouveau quiz.",
          duration: 5000,
        });
      }
    }
  }, [user, toast]);

  // Auto-save après chaque modification
  React.useEffect(() => {
    if (title || questions.length > 0) {
      const draft: QuizzDraft = {
        id: draftId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        questions,
        settings: advancedSettings,
        createdAt: draftCreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveQuizzDraft(draft);

      // Mettre à jour l'ID du draft si nouveau
      if (!draftId) {
        setDraftId(draft.id);
        setDraftCreatedAt(draft.createdAt);
      }
    }
  }, [title, description, questions, advancedSettings, draftId, draftCreatedAt]);

  // Continuer le brouillon
  const handleContinueDraft = () => {
    const draft = loadQuizzDraft();
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
      setQuestions(draft.questions);
      setAdvancedSettings(draft.settings);
      setDraftId(draft.id);
      setDraftCreatedAt(draft.createdAt);
      setShowDraftBanner(false);

      toast({
        title: "Brouillon chargé",
        description: "Votre travail a été restauré.",
      });
    }
  };

  // Ignorer le brouillon
  const handleDismissDraft = () => {
    setShowDraftBanner(false);
    toast({
      title: "Nouveau quiz",
      description: "Vous pouvez commencer un nouveau quiz.",
    });
  };

  const handleDismissEmailField = () => {
    setIsEmailFieldDismissed(true);
    localStorage.setItem("doodates_dismiss_guest_email_field", "true");
  };

  // Toggle question expansion
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Expand all questions
  const expandAll = () => {
    setExpandedQuestions(new Set(questions.map((q) => q.id)));
  };

  // Collapse all questions
  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  // Génération depuis texte
  const handleGenerateFromText = async () => {
    console.log("[QuizzCreate] handleGenerateFromText appelé, textPrompt:", textPrompt);

    if (!textPrompt.trim()) {
      console.log("[QuizzCreate] textPrompt vide, affichage toast");
      toast({ title: "Veuillez décrire le quiz souhaité", variant: "destructive" });
      return;
    }

    console.log("[QuizzCreate] Début génération...");
    setIsGenerating(true);
    toast({ title: "Génération en cours...", description: "Gemini analyse votre demande" });

    try {
      // Construire le contexte complet pour la génération
      let fullPrompt = textPrompt;
      if (title.trim()) {
        fullPrompt = `CONTEXTE DÉJÀ SAISI:\nTitre: "${title}"\n\nDEMANDE COMPLÉMENTAIRE: ${textPrompt}`;
      }

      console.log("[QuizzCreate] Génération avec contexte complet:", fullPrompt);
      const result = await quizzVisionService.generateFromText(fullPrompt);
      console.log("[QuizzCreate] Résultat:", result);

      if (result.success && result.data) {
        // Mettre à jour le titre seulement si non déjà saisi manuellement
        if (!title.trim()) {
          setTitle(result.data.title);
        }
        setQuestions(result.data.questions);
        toast({ title: `✅ ${result.data.questions.length} questions générées !` });
      } else {
        const error = ErrorFactory.api(
          "Erreur génération quiz",
          "Erreur lors de la génération du quiz",
          {
            originalError: result.error,
            source: "QuizzCreate.handleGenerateFromText",
          },
        );
        logError(error, { component: "QuizzCreate", operation: "generateFromText" });
        toast({
          title: "Erreur de génération",
          description: result.error || "Vérifiez que VITE_GEMINI_API_KEY est configurée",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const processedError = ErrorFactory.api(
        "Exception génération quiz",
        "Erreur lors de la génération du quiz",
        {
          originalError: error,
          source: "QuizzCreate.handleGenerateFromText",
        },
      );
      logError(processedError, { component: "QuizzCreate", operation: "generateFromText" });
      toast({
        title: "Erreur",
        description: error?.message || "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération depuis fichier (image, PDF, ...)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[QuizzCreate] handleImageUpload appelé");
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[QuizzCreate] Aucun fichier sélectionné");
      return;
    }

    console.log("[QuizzCreate] Fichier sélectionné:", file.name, file.type);
    // Validation de base sur le fichier avant de lancer la génération
    const { size, type, name } = file;

    if (size > MAX_QUIZZ_ATTACHMENT_SIZE_BYTES) {
      const processedError = ErrorFactory.validation(
        "Fichier trop volumineux pour le quizz",
        "Le fichier dépasse la taille maximale autorisée (10 Mo).",
        { size, name, limit: MAX_QUIZZ_ATTACHMENT_SIZE_BYTES },
      );
      logError(processedError, {
        component: "QuizzCreate",
        operation: "validateImageAttachmentSize",
      });
      toast({
        title: "Fichier trop volumineux",
        description: "Le fichier dépasse 10 Mo. Essayez avec un fichier plus léger.",
        variant: "destructive",
      });
      return;
    }

    const isAllowedMime =
      !type ||
      ALLOWED_QUIZZ_ATTACHMENT_MIME_EXACT.includes(type) ||
      ALLOWED_QUIZZ_ATTACHMENT_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));

    if (!isAllowedMime) {
      const processedError = ErrorFactory.validation(
        "Type de fichier non supporté pour le quizz",
        "Ce type de fichier n'est pas encore supporté pour l'analyse automatique.",
        { mimeType: type, name },
      );
      logError(processedError, {
        component: "QuizzCreate",
        operation: "validateImageAttachmentMimeType",
      });
      toast({
        title: "Type de fichier non supporté",
        description: "Formats conseillés : image (PNG/JPEG) ou PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    toast({ title: "Analyse en cours...", description: "Gemini analyse votre photo" });

    try {
      console.log("[QuizzCreate] Analyse image:", file.name, file.type);
      const attachment = await fileToGeminiAttachment(file);
      const result = await quizzVisionService.extractFromImage(
        attachment.contentBase64,
        attachment.mimeType,
      );
      console.log("[QuizzCreate] Résultat:", result);

      if (result.success && result.data) {
        // Mettre à jour le titre seulement si non déjà saisi manuellement
        if (!title.trim()) {
          setTitle(result.data.title);
        }
        setQuestions(result.data.questions);
        if (result.data.questions.length === 0) {
          toast({
            title: "Aucune question détectée",
            description:
              "Cette image ne semble pas contenir de devoir. Essayez avec une photo d'exercice scolaire.",
            variant: "destructive",
          });
        } else {
          toast({ title: `✅ ${result.data.questions.length} questions extraites !` });
        }
      } else {
        const error = ErrorFactory.api(
          "Erreur extraction quiz depuis image",
          "Erreur lors de l'extraction du quiz depuis l'image",
          {
            originalError: result.error,
            source: "QuizzCreate.handleImageUpload",
          },
        );
        logError(error, { component: "QuizzCreate", operation: "extractFromImage" });
        toast({
          title: "Erreur d'extraction",
          description: result.error || "Vérifiez que VITE_GEMINI_API_KEY est configurée",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const processedError = ErrorFactory.api(
        "Exception extraction quiz depuis image",
        "Erreur lors de l'extraction du quiz depuis l'image",
        {
          originalError: error,
          source: "QuizzCreate.handleImageUpload",
        },
      );
      logError(processedError, { component: "QuizzCreate", operation: "extractFromImage" });
      toast({
        title: "Erreur",
        description: error?.message || "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Ajouter une question manuellement
  const addQuestion = () => {
    const newQ: QuizzQuestion = {
      id: `q${Date.now()}`,
      question: "",
      type: "single",
      options: ["", ""],
      correctAnswer: "",
      points: 1,
    };
    setQuestions([...questions, newQ]);
    // Déplier automatiquement la nouvelle question
    setExpandedQuestions((prev) => new Set([...prev, newQ.id]));
  };

  // Mettre à jour une question
  const updateQuestion = (index: number, updates: Partial<QuizzQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  // Supprimer une question
  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Valider qu'une question est complète
  const isQuestionComplete = (question: QuizzQuestion): boolean => {
    if (!question.question?.trim()) return false;

    if (question.type === "single" || question.type === "multiple") {
      if (!question.options || question.options.length < 2) return false;
      return question.options.every((opt) => opt.trim() !== "");
    }

    // Pour les autres types (text, text-ai, true-false), juste vérifier que la question est remplie
    return true;
  };

  // Valider que toutes les questions sont complètes
  const areAllQuestionsValid = questions.every(isQuestionComplete);

  // Sauvegarder le quiz
  const handleSave = async () => {
    if (questions.length === 0) {
      toast({ title: "Ajoutez au moins une question", variant: "destructive" });
      return;
    }
    if (!areAllQuestionsValid) {
      toast({ title: "Veuillez compléter toutes les questions", variant: "destructive" });
      return;
    }

    // Générer automatiquement un titre si non saisi
    let finalTitle = title.trim();
    if (!finalTitle) {
      // Générer un titre basé sur les questions ou le contenu
      const firstQuestion = questions[0]?.question || "";
      const subject = questions[0]?.explanation?.includes("math")
        ? "Mathématiques"
        : questions[0]?.explanation?.includes("français")
          ? "Français"
          : questions[0]?.explanation?.includes("histoire")
            ? "Histoire"
            : "Quiz";
      finalTitle = `Quiz ${subject} - ${new Date().toLocaleDateString("fr-FR")}`;

      // Mettre à jour le titre généré
      setTitle(finalTitle);
      toast({
        title: "Titre généré automatiquement",
        description: `Titre : "${finalTitle}"`,
        duration: 3000,
      });
    }

    const maxPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const quiz: Quizz = {
      id: `quiz_${Date.now()}`,
      slug: generateSlug(finalTitle),
      title: finalTitle,
      description: "", // Description retirée
      type: "quizz",
      questions,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: "local",
      maxPoints,
      settings: advancedSettings,
    };

    try {
      await addQuizz(quiz);
      setPublishedQuiz(quiz);
      setPublished(true);

      // Nettoyer le draft après création réussie
      clearQuizzDraft();

      toast({ title: "Quiz créé avec succès !" });

      // Note: L'écran de succès s'affiche via le return ci-dessous
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  // Écran de succès après publication
  if (published && publishedQuiz) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <div
              className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl border border-amber-700/30 p-8 text-center space-y-6"
              data-testid="quiz-success-screen"
            >
              {/* Icône de succès */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              {/* Message de succès */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2" data-testid="quiz-success-title">
                  Quiz publié !
                </h1>
                <p className="text-gray-300">
                  Votre quiz "{publishedQuiz.title}" est maintenant actif et prêt à recevoir des
                  réponses.
                </p>
              </div>

              {/* Message d'information pour la bêta */}
              <div className="p-4 bg-blue-500/10 border border-blue-600/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">Information bêta</span>
                </div>
                <p className="text-sm text-blue-300 mt-1">
                  Pour finaliser et partager votre quiz, après la bêta, vous devrez vous connecter
                  ou créer un compte.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to="/quizz/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                  data-testid="quiz-go-to-dashboard"
                >
                  <Check className="w-5 h-5" />
                  Aller au Tableau de bord
                </Link>
                <Link
                  to={`/quizz/${publishedQuiz.slug || publishedQuiz.id}/vote`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-amber-300 border-2 border-amber-600/50 rounded-lg font-semibold hover:bg-amber-900/30 transition-colors"
                  data-testid="quiz-view-quiz"
                >
                  <ExternalLink className="w-5 h-5" />
                  Voir le quiz
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t border-amber-700/50">
                <p className="text-sm text-gray-400 mb-3">Lien de partage :</p>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <code
                    className="px-4 py-2 bg-[#1e1e1e] border border-amber-700/50 rounded text-sm font-mono text-gray-300 break-all"
                    data-testid="quiz-share-link"
                  >
                    {window.location.origin}/quizz/{publishedQuiz.slug || publishedQuiz.id}/vote
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/quizz/${publishedQuiz.slug || publishedQuiz.id}/vote`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Lien copié !",
                        description: "Le lien a été copié dans le presse-papiers.",
                      });
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                    data-testid="quiz-copy-link"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Banner de brouillon */}
        {showDraftBanner && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-amber-300 font-medium">Brouillon disponible</p>
                <p className="text-amber-400 text-sm">Continuer votre travail précédent ?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleContinueDraft}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Continuer
              </button>
              <button
                onClick={handleDismissDraft}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Créer un Quiz</h1>
          <p className="text-sm text-gray-400 mt-1">
            Générez un quiz depuis un fichier (photo, PDF...) ou du texte
          </p>
        </div>

        {/* Génération IA */}
        <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl p-4 sm:p-6 border border-amber-700/30">
          <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 text-amber-300">
            <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0" />
            Génération IA
          </h2>

          {/* Option 1: Fichier (photo, PDF, ...) */}
          <div className="mb-3 sm:mb-4">
            {/* Input pour sélectionner depuis la galerie */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* Input pour prendre une photo (caméra) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isGenerating}
                variant="outline"
                className="flex items-center justify-center gap-1.5 sm:gap-2 border-amber-600/50 hover:border-amber-500 hover:bg-gray-800 bg-gray-800/50"
              >
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0" />
                <span className="font-medium text-amber-300 text-xs sm:text-sm truncate">
                  Prendre une photo
                </span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                variant="outline"
                className="flex items-center justify-center gap-1.5 sm:gap-2 border-gray-600 hover:border-gray-500 hover:bg-gray-800 bg-gray-800/50"
              >
                <span className="font-medium text-gray-300 text-xs sm:text-sm truncate">
                  📎 Fichier (photo/PDF)
                </span>
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              L'IA générera automatiquement le titre et les questions
            </p>
          </div>
        </div>

        {/* Infos de base - toujours visible */}
        <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titre du quiz *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quiz Mathématiques - CE2"
              className="w-full px-3 sm:px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              data-testid="quiz-title-input"
            />
            {!title.trim() && (
              <p className="text-xs text-amber-400 mt-1">
                💡 Laissez vide pour que l'IA génère automatiquement un titre
              </p>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-base sm:text-lg text-white">
              Questions ({questions.length})
            </h2>
            <div className="flex items-center gap-2">
              {questions.length > 0 && (
                <button
                  onClick={expandedQuestions.size === questions.length ? collapseAll : expandAll}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {expandedQuestions.size === questions.length ? "Tout replier" : "Tout déplier"}
                </button>
              )}
              <Button
                onClick={addQuestion}
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border-gray-700"
                data-testid="add-question-button"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>
          </div>

          {questions.map((q, idx) => {
            const isExpanded = expandedQuestions.has(q.id);
            return (
              <div
                key={q.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
              >
                {/* Question Header - Always visible */}
                <div
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => toggleQuestion(q.id)}
                >
                  <button className="text-gray-400 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 block">Question {idx + 1}</span>
                    <p className="text-sm sm:text-base text-white truncate">
                      {q.question || <span className="text-gray-500 italic">Sans titre</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {q.options && (
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded hidden sm:inline">
                        {q.options.length} options
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(idx);
                      }}
                      className="p-1.5 sm:p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Question Details - Collapsible */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="p-3 sm:p-4 pt-0 space-y-3 border-t border-gray-700/50">
                    {/* Question text */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
                        Texte de la question
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                        placeholder="Entrez la question..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500"
                      />
                    </div>

                    {/* Options pour QCM */}
                    {(q.type === "single" || q.type === "multiple") && q.options && (
                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-400">
                          Options (bonne réponse en premier)
                        </label>
                        {q.options.map((opt, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[optIdx] = e.target.value;
                              updateQuestion(idx, {
                                options: newOpts,
                                correctAnswer: newOpts[0],
                              });
                            }}
                            placeholder={optIdx === 0 ? "✓ Bonne réponse" : `Option ${optIdx + 1}`}
                            className={cn(
                              "w-full px-3 py-2 border rounded-lg text-white text-sm placeholder:text-gray-500",
                              optIdx === 0
                                ? "border-green-600/50 bg-green-900/20"
                                : "border-gray-700 bg-gray-900",
                            )}
                          />
                        ))}
                        <Button
                          onClick={() => {
                            const newOpts = [...(q.options || []), ""];
                            updateQuestion(idx, { options: newOpts });
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-xs sm:text-sm text-amber-400 hover:text-amber-300 hover:bg-transparent"
                        >
                          + Ajouter une option
                        </Button>
                      </div>
                    )}

                    {/* Explication */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
                        Explication (optionnel)
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ""}
                        onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                        placeholder="Pourquoi cette réponse est correcte..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paramètres avancés */}
        {questions.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Header cliquable pour ouvrir/fermer */}
            <button
              onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
              className="w-full flex items-center justify-between gap-2 p-4 sm:p-6 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Paramètres avancés</h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  advancedSettingsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Contenu des paramètres - affiché seulement si ouvert */}
            {advancedSettingsOpen && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-700">
                <PollSettingsForm
                  settings={advancedSettings}
                  onSettingsChange={(newSettings) =>
                    setAdvancedSettings(newSettings as QuizzSettings)
                  }
                  pollType="date"
                />
              </div>
            )}
          </div>
        )}

        {/* Champ Email Invité (RGPD) - Moins proéminent, juste avant les actions */}
        {!user && !isEmailFieldDismissed && (
          <div className="mt-6 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800 relative group">
            <button
              onClick={handleDismissEmailField}
              className="absolute top-2 right-2 p-1 text-gray-600 hover:text-gray-400 transition-colors"
              title="Ne plus afficher"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <Label className="text-xs font-medium text-gray-400">
                Email pour les alertes RGPD
              </Label>
            </div>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onBlur={() => guestEmail && guestEmailService.saveGuestEmail(guestEmail)}
              className="bg-[#0a0a0a] border-gray-700 text-gray-300 text-sm h-8"
            />
            <p className="text-xs text-gray-600 mt-1">
              Invité : données conservées 1 an. Email recommandé pour alerte avant suppression.
            </p>
          </div>
        )}

        {/* Actions - Fixed on mobile */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 pb-8">
          <button
            onClick={() => navigate("/quizz")}
            className="w-full sm:w-auto px-6 py-2.5 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || questions.length === 0 || !areAllQuestionsValid}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
            data-testid="finalize-quizz"
          >
            <Save className="h-4 w-4 sm:h-5 sm:w-5" />
            Créer le quiz
          </button>
        </div>
      </div>
    </div>
  );
};
