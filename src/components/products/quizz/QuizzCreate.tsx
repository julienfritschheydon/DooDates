/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { addQuizz, type Quizz, type QuizzQuestion } from "@/lib/products/quizz/quizz-service";
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

  // Charger l'email existant si guest
  React.useEffect(() => {
    if (!user) {
      guestEmailService.getGuestEmail().then((email) => {
        if (email) setGuestEmail(email);
      });
      const dismissed = localStorage.getItem("doodates_dismiss_guest_email_field") === "true";
      setIsEmailFieldDismissed(dismissed);
    }
  }, [user]);

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
      console.log("[QuizzCreate] Génération depuis texte:", textPrompt);
      const result = await quizzVisionService.generateFromText(textPrompt);
      console.log("[QuizzCreate] Résultat:", result);

      if (result.success && result.data) {
        setTitle(result.data.title);
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
        setTitle(result.data.title);
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

  // Sauvegarder le quiz
  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Veuillez entrer un titre", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Ajoutez au moins une question", variant: "destructive" });
      return;
    }

    const maxPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const quiz: Quizz = {
      id: `quiz_${Date.now()}`,
      slug: generateSlug(title),
      title,
      description,
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
      toast({ title: "Quiz créé avec succès !" });
      navigate("/quizz");
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
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
          </div>

          {/* Option 2: Texte */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Ex: Quiz de maths pour CE2"
              className="flex-1 px-3 sm:px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={isGenerating}
            />
            <Button
              onClick={handleGenerateFromText}
              disabled={isGenerating || !textPrompt.trim()}
              size="lg"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2 text-sm font-medium flex-shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span>Générer</span>
            </Button>
          </div>
        </div>

        {/* Infos de base */}
        <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titre du quiz *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quiz Mathématiques - Les fractions"
              className="w-full px-3 sm:px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le quiz..."
              rows={2}
              className="w-full px-3 sm:px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Champ Email Invité (RGPD) */}
        {!user && !isEmailFieldDismissed && (
          <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700 relative group">
            <button
              onClick={handleDismissEmailField}
              className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-300 transition-colors bg-gray-800/80 rounded-full"
              title="Ne plus afficher ce message"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <Label className="text-sm font-medium text-blue-400">
                Email pour les alertes RGPD (recommandé)
              </Label>
            </div>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onBlur={() => guestEmail && guestEmailService.saveGuestEmail(guestEmail)}
              className="bg-gray-900 border-gray-700 text-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              En tant qu'invité, vos données sont conservées pendant 1 an. Renseignez votre email
              pour être alerté avant la suppression.
            </p>
          </div>
        )}

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
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Paramètres avancés</h3>
            </div>
            <PollSettingsForm
              settings={advancedSettings}
              onSettingsChange={(newSettings) => setAdvancedSettings(newSettings as QuizzSettings)}
              pollType="date"
            />
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
            disabled={!title.trim() || questions.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Save className="h-4 w-4 sm:h-5 sm:w-5" />
            Créer le quiz
          </button>
        </div>
      </div>
    </div>
  );
};
