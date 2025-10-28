import {
  X,
  Menu,
  Plus,
  Calendar,
  ClipboardList,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useConversation } from "./ConversationProvider";
import GeminiChatInterface, { type GeminiChatHandle } from "../GeminiChatInterface";
import { PollPreview } from "./PollPreview";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllPolls, type Poll } from "../../lib/pollStorage";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getConversations } from "../../lib/storage/ConversationStorageSimple";

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
        metadata?.pollGenerated &&
        metadata?.pollTitle?.toLowerCase() === poll.title.toLowerCase()
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

  // Lire les paramètres de l'URL pour forcer le remontage du chat
  const searchParams = new URLSearchParams(location.search);
  const resumeId = searchParams.get("resume");
  const newChatTimestamp = searchParams.get("new");
  const chatKey = resumeId || newChatTimestamp || "new-chat";
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [conversations, setConversations] = useState<
    ReturnType<typeof getConversations>
  >([]);
  const {
    isEditorOpen,
    currentPoll,
    closeEditor,
    openEditor,
    createPollFromChat,
    clearConversation,
    isMobile,
    isSidebarOpen,
    setSidebarOpen,
  } = useConversation();

  // Basculer automatiquement sur preview mobile quand l'éditeur s'ouvre/ferme
  useEffect(() => {
    if (isMobile) {
      if (isEditorOpen && currentPoll) {
        setShowPreviewOnMobile(true);
        // Forcer le scroll en haut quand la preview s'ouvre pour éviter le focus automatique vers le bas
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }, 0);
      } else {
        setShowPreviewOnMobile(false);
      }
    }
  }, [isMobile, isEditorOpen, currentPoll]);

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
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);
      setRecentPolls(sorted);

      // Charger conversations
      const convs = getConversations();
      const sortedConvs = convs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setConversations(sortedConvs);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  }, [chatKey, currentPoll]);

  return (
    <>
      <div
        className={`flex h-screen bg-[#1e1e1e] ${isMobile ? "flex-col overflow-y-auto" : ""}`}
      >
        {/* Backdrop pour fermer la sidebar en cliquant à l'extérieur */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar gauche - Mode overlay pour tous les écrans */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] transform transition-transform duration-300 flex flex-col border-r border-gray-700 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Bouton fermer en haut de la sidebar */}
          <div className="p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Fermer le menu"
              title="Fermer le menu"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {isSidebarOpen && (
            <>
              <div className="px-4 pb-4 space-y-2">
                <button
                  onClick={() => {
                    // Tout réinitialiser (messages + poll)
                    clearConversation();
                    // Créer une nouvelle conversation en naviguant vers /workspace sans paramètre resume
                    // Ajouter un timestamp pour forcer le remontage du composant GeminiChatInterface
                    navigate(`/workspace?new=${Date.now()}`);
                    // Fermer la sidebar sur mobile
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-colors font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Créer avec IA</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/create");
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Créer sans IA</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/dashboard");
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span>Dashboard</span>
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
                              openEditor(relatedPoll);
                            }

                            navigate(`/workspace?resume=${conv.id}`);
                            // Fermer la sidebar sur mobile
                            if (isMobile) setSidebarOpen(false);
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
                                  {relatedPoll.type === "form"
                                    ? "Formulaire"
                                    : "Sondage"}{" "}
                                  : {relatedPoll.title}
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

          {/* Statut en bas de la sidebar */}
          <div className="p-4">
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
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={
                  isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"
                }
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>
              <h1 className="text-xl font-medium text-white">DooDates</h1>
            </div>

            {/* Icônes settings & account à droite */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Toggle Chat/Preview sur mobile */}
          <div className="flex-1 min-h-0 pt-14">
            {/* Chat toujours rendu (masqué en Preview) pour que chatRef soit accessible */}
            <div className={`h-full ${isMobile && showPreviewOnMobile && isEditorOpen && currentPoll ? "hidden" : ""}`}>
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
              />
            </div>

            {/* Preview overlay sur mobile */}
            {isMobile && showPreviewOnMobile && isEditorOpen && currentPoll && (
              <div className="absolute inset-0 bg-[#0a0a0a] z-10 overflow-y-auto pt-14">
                <div className="relative">
                  <button
                    onClick={closeEditor}
                    className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                    aria-label="Fermer l'éditeur"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <PollPreview poll={currentPoll} />

                  {/* Barre d'input fixe en bas pour envoyer des messages depuis la Preview */}
                  <div className="p-4 md:p-6 fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center gap-3 rounded-full p-2 border bg-[#0a0a0a] border-gray-700 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <input
                          type="text"
                          value={previewInputValue}
                          onChange={(e) => setPreviewInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (previewInputValue.trim() && chatRef.current) {
                                chatRef.current.submitMessage(previewInputValue);
                                setPreviewInputValue("");
                              }
                            }
                          }}
                          placeholder="Décrivez votre sondage..."
                          className="flex-1 border-0 px-4 py-3 focus:outline-none min-h-[44px] text-sm md:text-base bg-transparent text-white placeholder-gray-400"
                        />
                        <button
                          onClick={() => {
                            if (previewInputValue.trim() && chatRef.current) {
                              chatRef.current.submitMessage(previewInputValue);
                              setPreviewInputValue("");
                            }
                          }}
                          disabled={!previewInputValue.trim()}
                          className="rounded-full p-2 transition-all flex-shrink-0 bg-transparent text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Envoyer le message"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13" />
                            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Éditeur conditionnel - Sidebar droite sur desktop uniquement */}
        {!isMobile && isEditorOpen && currentPoll && (
          <div className="w-1/2 bg-[#0a0a0a] flex flex-col">
            {/* Contenu éditeur avec bouton fermer intégré */}
            <div className="flex-1 overflow-y-auto relative">
              <button
                onClick={closeEditor}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                aria-label="Fermer l'éditeur"
              >
                <X className="w-4 h-4" />
              </button>
              <PollPreview poll={currentPoll} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
