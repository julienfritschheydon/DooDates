import {
  X,
  Menu,
  Plus,
  Calendar,
  ClipboardList,
  FileText,
  MessageSquare,
  Sparkles,
  Settings,
  User,
  LogOut,
  UserCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useConversation } from "./ConversationProvider";
import { useEditorState, useEditorActions } from "./EditorStateProvider";
import { useUIState } from "./UIStateProvider";
import GeminiChatInterface, { type GeminiChatHandle } from "../GeminiChatInterface";
import { PollPreview } from "./PollPreview";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllPolls, type Poll } from "../../lib/pollStorage";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { useToast } from "../../hooks/use-toast";
import { ChatInput } from "../chat/ChatInput";
import { VOICE_RECOGNITION_CONFIG } from "../../config/voiceRecognition.config";
import { logger } from "../../lib/logger";
import { getConversations } from "../../lib/storage/ConversationStorageSimple";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useAuth } from "../../contexts/AuthContext";

// Fonction pour trouver la conversation liée à un sondage (rétrocompatibilité)
function findRelatedConversation(poll: Poll): string | undefined {
  // Si déjà défini, le retourner
  if (poll.relatedConversationId) return poll.relatedConversationId;

  // Sinon, chercher une conversation avec le même titre de sondage
  try {
    const conversations = getConversations();
    const match = conversations.find((conv) => {
      const metadata = conv.metadata as any;
      return (
        metadata?.pollGenerated && metadata?.pollTitle?.toLowerCase() === poll.title.toLowerCase()
      );
    });
    return match?.id;
  } catch {
    return undefined;
  }
}

/**
 * Workspace Layout Prototype - Architecture Context-based
 *
 * Chat principal (toujours visible) + Éditeur conditionnel (sidebar droite)
 * - Chat : Fenêtre principale, contrôle l'éditeur
 * - Éditeur : S'ouvre/ferme selon l'état, interaction bidirectionnelle
 */
export function WorkspaceLayoutPrototype() {
  const navigate = useNavigate();
  const location = useLocation();
  // Sur mobile : true = afficher preview, false = afficher chat
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);
  const [previewInputValue, setPreviewInputValue] = useState("");
  const chatRef = useRef<GeminiChatHandle>(null);
  const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Lire les paramètres de l'URL pour forcer le remontage du chat
  const searchParams = new URLSearchParams(location.search);
  const resumeId = searchParams.get("resume");
  const conversationId = searchParams.get("conversationId");
  const newChatTimestamp = searchParams.get("new");

  // Convertir "resume" en "conversationId" si nécessaire (Session 2 - Bug 3)
  useEffect(() => {
    if (resumeId && !conversationId) {
      const newUrl = `${location.pathname}?conversationId=${resumeId}`;
      navigate(newUrl, { replace: true });
    }
  }, [resumeId, conversationId, location.pathname, navigate]);

  const chatKey = resumeId || conversationId || newChatTimestamp || "new-chat";
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [conversations, setConversations] = useState<ReturnType<typeof getConversations>>([]);

  // Nouveaux hooks spécialisés
  const { isEditorOpen, currentPoll } = useEditorState();
  const { openEditor, closeEditor, setCurrentPoll, createPollFromChat } = useEditorActions();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUIState();

  // Fermer le preview et nettoyer le poll quand on démarre un nouveau chat (Session 2 - Bug 4)
  useEffect(() => {
    if (newChatTimestamp && !conversationId && !resumeId) {
      closeEditor();
      setCurrentPoll(null);
    }
  }, [newChatTimestamp, conversationId, resumeId, closeEditor, setCurrentPoll]);

  // Hook legacy pour clearConversation (non migré)
  const { clearConversation } = useConversation();

  // Hook onboarding
  const { startOnboarding } = useOnboarding();

  // Hook auth
  const { user, profile, signOut } = useAuth();

  // Hook reconnaissance vocale UNIQUE pour toute l'application
  // Partagé entre le chat et la preview pour éviter les conflits
  const { toast } = useToast();
  const sharedVoiceRecognition = useVoiceRecognition({
    lang: VOICE_RECOGNITION_CONFIG.lang,
    interimResults: VOICE_RECOGNITION_CONFIG.interimResults,
    continuous: VOICE_RECOGNITION_CONFIG.continuous,
    onTranscriptChange: (transcript) => {
      // Ne rien faire ici, on utilisera finalTranscript directement
    },
    onError: (error) => {
      toast({
        title: "Erreur microphone",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Synchroniser la transcription vocale avec l'input de preview
  // Seulement quand la preview est visible sur mobile
  useEffect(() => {
    if (sharedVoiceRecognition.isListening && isMobile && showPreviewOnMobile) {
      const fullText =
        sharedVoiceRecognition.finalTranscript +
        (sharedVoiceRecognition.interimTranscript
          ? " " + sharedVoiceRecognition.interimTranscript
          : "");
      setPreviewInputValue(fullText.trim());
    }
  }, [
    sharedVoiceRecognition.isListening,
    sharedVoiceRecognition.finalTranscript,
    sharedVoiceRecognition.interimTranscript,
    isMobile,
    showPreviewOnMobile,
  ]);

  // Basculer automatiquement sur preview mobile quand l'éditeur s'ouvre/ferme
  useEffect(() => {
    if (isMobile) {
      if (isEditorOpen && currentPoll) {
        setShowPreviewOnMobile(true);
        // Forcer le scroll en haut quand la preview s'ouvre pour éviter le focus automatique vers le bas
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
        }, 0);
      } else {
        setShowPreviewOnMobile(false);
      }
    }
  }, [isMobile, isEditorOpen, currentPoll]);

  // Détecter le paramètre 'new' pour réinitialiser la conversation
  useEffect(() => {
    if (newChatTimestamp) {
      // Réinitialiser la conversation
      clearConversation();
      // Nettoyer le paramètre de l'URL
      navigate("/", { replace: true });
    }
  }, [newChatTimestamp, clearConversation, navigate]);

  // Charger les sondages récents et conversations
  // Se recharge quand on change de conversation (chatKey change) ou quand un poll est mis à jour
  useEffect(() => {
    try {
      // Charger sondages
      const polls = getAllPolls();

      // Dédupliquer par ID (garder le plus récent en cas de doublon)
      const uniquePolls = Array.from(
        polls
          .reduce((map, poll) => {
            const existing = map.get(poll.id);
            if (
              !existing ||
              new Date(poll.updated_at || poll.created_at) >
                new Date(existing.updated_at || existing.created_at)
            ) {
              map.set(poll.id, poll);
            }
            return map;
          }, new Map<string, Poll>())
          .values(),
      );

      const sorted = uniquePolls
        .filter((p) => p.created_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentPolls(sorted);

      // Charger conversations
      const convs = getConversations();
      const sortedConvs = convs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setConversations(sortedConvs);
    } catch (error) {
      logger.error("Erreur chargement données", error);
    }
  }, [chatKey, currentPoll]);

  return (
    <>
      <div className={`flex h-screen bg-[#1e1e1e] ${isMobile ? "flex-col overflow-y-auto" : ""}`}>
        {/* Backdrop pour fermer la sidebar en cliquant à l'extérieur */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Sidebar gauche - Mode overlay pour tous les écrans */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] transform transition-transform duration-300 flex flex-col border-r border-gray-700 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header avec bouton fermer */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">DooDates</h2>
            <div className="flex items-center gap-2">
              {/* Bouton Aide */}
              <button
                onClick={() => {
                  startOnboarding();
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Aide"
                title="Voir le tour guidé"
              >
                <svg
                  className="w-5 h-5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {/* Bouton Fermer */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Fermer le menu"
                title="Fermer le menu"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>

          {isSidebarOpen && (
            <>
              <div className="px-4 pb-4 space-y-2">
                <button
                  onClick={() => {
                    // Ajouter un timestamp pour forcer le remontage du composant GeminiChatInterface
                    navigate(`/?new=${Date.now()}`);
                    // Fermer la sidebar sur mobile
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-colors font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Créer avec IA</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/create");
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Créer sans IA</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/dashboard");
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span>Tableau de bord</span>
                </button>
              </div>

              {/* Historique directement dans la sidebar - Vue unifiée */}
              <div className="flex-1 overflow-y-auto px-4">
                {/* Une seule section : Conversations (avec polls associés) */}
                {conversations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Mes conversations
                    </h3>
                    {conversations.slice(0, 10).map((conv) => {
                      const metadata = conv.metadata as any;
                      const hasPoll = metadata?.pollGenerated;

                      // Trouver le poll associé
                      const relatedPoll =
                        hasPoll && metadata?.pollId
                          ? recentPolls.find((p) => p.id === metadata.pollId)
                          : undefined;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => {
                            // Si la conversation a un poll associé, l'ouvrir aussi
                            if (relatedPoll) {
                              setCurrentPoll(relatedPoll as any);
                              openEditor();
                            }

                            navigate(`/?resume=${conv.id}`);
                            // Fermer la sidebar sur mobile
                            if (isMobile) setIsSidebarOpen(false);
                          }}
                          className="w-full flex items-start gap-3 p-3 hover:bg-[#2a2a2a] rounded-lg transition-colors text-left mb-1"
                        >
                          <div className="p-2 bg-[#0a0a0a] rounded-lg flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Titre de la conversation */}
                            <p className="text-sm font-medium text-white truncate">
                              {conv.title || "Conversation sans titre"}
                            </p>

                            {/* Poll associé (si existe) */}
                            {relatedPoll && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {relatedPoll.type === "form" ? (
                                  <ClipboardList className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                )}
                                <p className="text-xs text-gray-500 truncate">
                                  {relatedPoll.type === "form" ? "Formulaire" : "Sondage"} :{" "}
                                  {relatedPoll.title}
                                </p>
                              </div>
                            )}

                            {/* Date */}
                            <p className="text-xs text-gray-600 mt-1">
                              {conv.createdAt &&
                                formatDistanceToNow(new Date(conv.createdAt), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Message si rien */}
                {conversations.length === 0 && recentPolls.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-xs text-gray-400">Aucune conversation</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Boutons settings & compte en bas de la sidebar */}
          <div className="p-4 border-t border-gray-800">
            {/* Nom d'utilisateur si connecté */}
            {user && (
              <div className="mb-3 px-2">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              {/* Bouton Settings */}
              <button
                className="flex-1 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Paramètres"
                aria-label="Paramètres"
                onClick={() => {
                  // TODO: Ouvrir page settings
                  toast({
                    title: "Paramètres",
                    description: "Page en cours de développement",
                  });
                }}
              >
                <Settings className="w-5 h-5 text-gray-300 mx-auto" />
              </button>

              {/* Bouton Account */}
              <button
                onClick={() =>
                  toast({
                    title: "Compte",
                    description: "Page en cours de développement",
                  })
                }
                className="w-full p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Compte"
                aria-label="Compte"
              >
                <User className="w-5 h-5 text-gray-300 mx-auto" />
              </button>
            </div>

            {/* Statut */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>IA connectée</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span>
                  {conversations.length} conversation
                  {conversations.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat principal - Zone centrale avec header DooDates */}
        <div
          className={`flex flex-col bg-[#0a0a0a] transition-all duration-300 flex-1 flex-shrink-0 ${
            isMobile ? "w-full" : "min-w-[500px]"
          } ${isEditorOpen ? "" : ""}`}
        >
          {/* Header DooDates en haut de la zone de chat */}
          <div className="h-14 fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {/* Bouton hamburger (mobile + desktop pour replier sidebar) */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>
              <h1 className="text-xl font-medium text-white">DooDates</h1>
            </div>
          </div>

          {/* Toggle Chat/Preview sur mobile */}
          <div className="flex-1 min-h-0 pt-14">
            {/* Chat toujours rendu (masqué en Preview) pour que chatRef soit accessible */}
            <div
              className={`h-full ${isMobile && showPreviewOnMobile && isEditorOpen && currentPoll ? "hidden" : ""}`}
            >
              <GeminiChatInterface
                ref={chatRef}
                key={chatKey}
                onPollCreated={(pollData) => {
                  createPollFromChat(pollData);
                  // Basculer sur preview après création
                  if (isMobile) {
                    setShowPreviewOnMobile(true);
                  }
                }}
                onUserMessage={() => {
                  // Ne plus basculer automatiquement sur Chat en mobile
                }}
                hideStatusBar={true}
                darkTheme={true}
                voiceRecognition={sharedVoiceRecognition}
              />
            </div>

            {/* Preview overlay sur mobile */}
            {isMobile && showPreviewOnMobile && isEditorOpen && currentPoll && (
              <div className="absolute inset-0 bg-[#0a0a0a] z-10 overflow-y-auto pt-20">
                <div className="relative">
                  <button
                    onClick={closeEditor}
                    className="fixed top-4 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                    aria-label="Fermer l'éditeur"
                    title="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <PollPreview poll={currentPoll} />

                  {/* Barre d'input fixe en bas pour envoyer des messages depuis la Preview */}
                  <ChatInput
                    value={previewInputValue}
                    onChange={setPreviewInputValue}
                    onSend={() => {
                      if (previewInputValue.trim() && chatRef.current) {
                        chatRef.current.submitMessage(previewInputValue);
                        setPreviewInputValue("");
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (previewInputValue.trim() && chatRef.current) {
                          chatRef.current.submitMessage(previewInputValue);
                          setPreviewInputValue("");
                        }
                      }
                    }}
                    isLoading={false}
                    darkTheme={true}
                    voiceRecognition={sharedVoiceRecognition}
                    textareaRef={previewTextareaRef}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Éditeur conditionnel - Sidebar droite sur desktop uniquement */}
        {!isMobile && isEditorOpen && currentPoll && (
          <div className="w-1/2 bg-[#0a0a0a] flex flex-col">
            {/* Contenu éditeur avec bouton fermer intégré */}
            <div className="flex-1 overflow-y-auto relative pt-4">
              <button
                onClick={closeEditor}
                className="fixed top-4 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                aria-label="Fermer l'éditeur"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
              <PollPreview poll={currentPoll} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
