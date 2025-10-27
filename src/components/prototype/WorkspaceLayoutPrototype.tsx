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
import { useState, useEffect } from "react";
import { useConversation } from "./ConversationProvider";
import GeminiChatInterface from "../GeminiChatInterface";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Sur mobile : true = afficher preview, false = afficher chat
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);

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
        className={`flex h-screen bg-[#1e1e1e] ${isMobile ? "flex-col overflow-y-auto" : "overflow-hidden"}`}
      >
        {/* Backdrop pour mobile */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar sombre à gauche - Style Gemini - Collapsible */}
        <div
          className={`${
            isMobile
              ? isSidebarOpen
                ? "fixed inset-y-0 left-0 w-80 z-50"
                : "hidden"
              : sidebarCollapsed
                ? "w-16"
                : "w-64"
          } bg-[#1e1e1e] flex-shrink-0 flex flex-col border-r border-gray-700 transition-all duration-300`}
        >
          {/* Burger icon en haut de la sidebar - Fermer sur mobile, collapse sur desktop */}
          <div className="p-4">
            <button
              onClick={() => {
                if (isMobile) {
                  setSidebarOpen(false);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={
                isMobile
                  ? "Fermer le menu"
                  : sidebarCollapsed
                    ? "Agrandir le menu"
                    : "Réduire le menu"
              }
              title={
                isMobile
                  ? "Fermer le menu"
                  : sidebarCollapsed
                    ? "Agrandir le menu"
                    : "Réduire le menu"
              }
            >
              {isMobile ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>

          {!sidebarCollapsed && (
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
          className={`flex flex-col bg-[#0a0a0a] transition-all duration-300 ${
            isEditorOpen ? "flex-1" : "flex-1"
          }`}
        >
          {/* Header DooDates en haut de la zone de chat */}
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {/* Bouton hamburger sur mobile */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label={
                    isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"
                  }
                >
                  <Menu className="w-5 h-5 text-gray-300" />
                </button>
              )}
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
          <div className="flex-1 overflow-y-auto min-h-0">
            {isMobile && showPreviewOnMobile && isEditorOpen && currentPoll ? (
              // PREVIEW MODE : Afficher le poll
              <div className="relative pb-4">
                <button
                  onClick={closeEditor}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                  aria-label="Fermer l'éditeur"
                >
                  <X className="w-4 h-4" />
                </button>
                <PollPreview poll={currentPoll} />
              </div>
            ) : (
              // CHAT MODE : Afficher le chat
              <GeminiChatInterface
                key={chatKey}
                onPollCreated={(pollData) => {
                  createPollFromChat(pollData);
                  // Basculer sur preview après création
                  if (isMobile) {
                    setShowPreviewOnMobile(true);
                  }
                }}
                onUserMessage={() => {
                  // Basculer sur chat quand user tape
                  if (isMobile && showPreviewOnMobile) {
                    setShowPreviewOnMobile(false);
                  }
                }}
                hideStatusBar={true}
                darkTheme={true}
              />
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
