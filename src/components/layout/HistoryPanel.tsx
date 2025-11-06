import { X, Clock, Calendar, FileText, Plus, ClipboardList } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { useNavigate } from "react-router-dom";
import { useConversations } from "../../hooks/useConversations";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { getAllPolls, type Poll, getCurrentUserId } from "../../lib/pollStorage";
import { useAuth } from "../../contexts/AuthContext";
import { logger } from "../../lib/logger";

interface HistoryPanelProps {
  onClose: () => void;
  onConversationSelect?: (conversationId: string) => void;
}

/**
 * Panel historique collapsible (style ChatGPT) - Phase 6C: Historique fonctionnel
 *
 * S'ouvre depuis le burger, affiche l'historique réel des conversations
 */
export default function HistoryPanel({ onClose, onConversationSelect }: HistoryPanelProps) {
  const navigate = useNavigate();
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [pollsRefreshKey, setPollsRefreshKey] = useState(0);
  const { user } = useAuth();

  // Récupérer les vraies conversations depuis le storage
  const { conversations: conversationsState, refresh: refetchConversations } = useConversations({
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  // Charger les sondages récents depuis localStorage
  useEffect(() => {
    logger.info(`🔄 HistoryPanel: Loading polls (refreshKey=${pollsRefreshKey})`, "poll");
    try {
      // Utiliser getAllPolls() comme le Dashboard
      const allPolls = getAllPolls();

      // Filtrer les polls pour ne garder que ceux du créateur actuel (sécurité)
      const currentUserId = getCurrentUserId(user?.id);
      const filteredPolls = allPolls.filter((poll) => {
        if (user?.id) {
          // Mode connecté : seulement les polls du créateur authentifié
          return poll.creator_id === user.id;
        } else {
          // Mode invité : SEULEMENT les polls avec le device ID actuel
          return poll.creator_id === currentUserId;
        }
      });

      logger.info("📊 HistoryPanel: Polls récupérés et filtrés", "poll", {
        total: allPolls.length,
        filtered: filteredPolls.length,
        pollIds: filteredPolls.map((p) => p.id),
      });

      // Trier par date de création décroissante et prendre les 5 derniers
      const withDate = filteredPolls.filter((p) => p.created_at);
      logger.debug("Polls avec created_at", "poll", { count: withDate.length });

      const sorted = withDate
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      logger.info("✅ HistoryPanel: Polls triés (top 5)", "poll", {
        polls: sorted.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
        })),
      });

      setRecentPolls(sorted);
    } catch (error) {
      logger.error("[HistoryPanel] Erreur chargement sondages", error);
    }
  }, [pollsRefreshKey, user?.id]);

  // Écouter les changements de polls pour rafraîchir automatiquement
  useEffect(() => {
    logger.info("🎧 HistoryPanel: Setting up pollsChanged listener", "poll");

    const handlePollsChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      logger.info("🔔 HistoryPanel: Received pollsChanged event!", "poll", {
        detail: customEvent.detail,
      });
      setPollsRefreshKey((prev) => {
        const newKey = prev + 1;
        logger.info(`🔄 HistoryPanel: Incrementing refresh key ${prev} → ${newKey}`, "poll");
        return newKey;
      });
    };

    window.addEventListener("pollsChanged", handlePollsChange);
    logger.info("✅ HistoryPanel: pollsChanged listener registered", "poll");

    return () => {
      logger.info("🧹 HistoryPanel: Removing pollsChanged listener", "poll");
      window.removeEventListener("pollsChanged", handlePollsChange);
    };
  }, []);

  // Écouter les changements de conversations pour rafraîchir automatiquement
  useEffect(() => {
    logger.info("🎧 HistoryPanel: Setting up conversationsChanged listener", "conversation");

    const handleConversationsChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      logger.info("🔔 HistoryPanel: Received conversationsChanged event!", "conversation", {
        detail: customEvent.detail,
      });
      refetchConversations();
      logger.info("🔄 HistoryPanel: Refetched conversations", "conversation");
    };

    window.addEventListener("conversationsChanged", handleConversationsChange);
    logger.info("✅ HistoryPanel: conversationsChanged listener registered", "conversation");

    return () => {
      logger.info("🧹 HistoryPanel: Removing conversationsChanged listener", "conversation");
      window.removeEventListener("conversationsChanged", handleConversationsChange);
    };
  }, [refetchConversations]);

  // Grouper par période
  const groupConversationsByPeriod = (conversations: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      today: conversations.filter((conv) => new Date(conv.updatedAt) >= today),
      yesterday: conversations.filter((conv) => {
        const date = new Date(conv.updatedAt);
        return date >= yesterday && date < today;
      }),
      thisWeek: conversations.filter((conv) => {
        const date = new Date(conv.updatedAt);
        return date >= weekAgo && date < yesterday;
      }),
      older: conversations.filter((conv) => new Date(conv.updatedAt) < weekAgo),
    };
  };

  const conversations = conversationsState.conversations || [];
  const isLoading = conversationsState.isLoading;
  const grouped =
    conversations.length > 0
      ? groupConversationsByPeriod(conversations)
      : {
          today: [],
          yesterday: [],
          thisWeek: [],
          older: [],
        };

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect?.(conversationId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* Panel historique - Responsive width */}
      <aside className="fixed top-0 left-0 bottom-0 w-full sm:w-80 bg-[#1e1e1e] z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="font-semibold text-white">Historique</h2>
          <CloseButton onClick={onClose} ariaLabel="Fermer" iconSize={5} />
        </div>

        {/* Bouton création manuelle */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => {
              navigate("/create");
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer sans IA</span>
          </button>
        </div>

        {/* Liste conversations et sondages - Scrollable */}
        <div className="overflow-y-auto" style={{ height: "calc(100vh - 162px)" }}>
          {/* Sondages récents */}
          {(() => {
            logger.debug("Rendu - recentPolls", "poll", { count: recentPolls.length });
            if (recentPolls.length > 0) {
              return (
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Sondages récents
                  </h3>
                  {recentPolls.map((poll) => (
                    <PollItem
                      key={poll.id}
                      poll={poll}
                      onClick={() => {
                        const slug = poll.slug || poll.id;
                        if (poll.type === "form") {
                          navigate(`/poll/${slug}/vote`);
                        } else {
                          navigate(`/poll/${slug}`);
                        }
                        onClose();
                      }}
                    />
                  ))}
                </div>
              );
            }
            return null;
          })()}

          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p>Chargement...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucune conversation</p>
              <p className="text-xs">Créez votre premier sondage !</p>
            </div>
          ) : (
            <>
              {/* Aujourd'hui */}
              {grouped.today.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Aujourd'hui
                  </h3>
                  {grouped.today.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      onClick={() => handleConversationClick(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Hier */}
              {grouped.yesterday.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Hier</h3>
                  {grouped.yesterday.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      onClick={() => handleConversationClick(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Cette semaine */}
              {grouped.thisWeek.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Cette semaine
                  </h3>
                  {grouped.thisWeek.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      onClick={() => handleConversationClick(conv.id)}
                    />
                  ))}
                </div>
              )}

              {/* Plus ancien */}
              {grouped.older.length > 0 && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Plus ancien
                  </h3>
                  {grouped.older.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      onClick={() => handleConversationClick(conv.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * Composant pour afficher une conversation dans l'historique
 */
interface ConversationItemProps {
  conversation: any;
  onClick: () => void;
}

function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  // Déterminer l'icône selon le contenu de la conversation
  const getIcon = () => {
    if (conversation.relatedPollId) {
      // Si lié à un poll, vérifier le type
      return Calendar; // Par défaut calendrier
    }
    return FileText; // Conversation générale
  };

  // Générer un titre intelligent : 1) Titre du poll, 2) Titre conversation, 3) Premier message
  const getTitle = () => {
    // 1. Si conversation liée à un poll, récupérer le titre du poll
    if (conversation.relatedPollId || conversation.pollId) {
      const pollId = conversation.relatedPollId || conversation.pollId;
      try {
        // Filtrer les polls pour ne garder que ceux du créateur actuel (sécurité)
        const { user } = useAuth();
        const currentUserId = getCurrentUserId(user?.id);
        const allPolls = getAllPolls();
        const filteredPolls = allPolls.filter((poll) => {
          if (user?.id) {
            return poll.creator_id === user.id;
          } else {
            return poll.creator_id === currentUserId;
          }
        });
        const poll = filteredPolls.find((p) => p.id === pollId);
        if (poll?.title) return poll.title;
      } catch {
        // Ignore errors
      }
    }

    // 2. Titre de la conversation si existant et pertinent
    if (conversation.title && !conversation.title.startsWith("Discussion avec")) {
      return conversation.title;
    }

    // 3. Extraire le premier message utilisateur
    const firstUserMessage = conversation.messages?.find((msg: any) => msg.role === "user");
    if (firstUserMessage) {
      return (
        firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
      );
    }

    return "Nouvelle conversation";
  };

  const getSubtitle = () => {
    if (conversation.relatedPollId) {
      return "Sondage créé";
    }
    return "Conversation";
  };

  const Icon = getIcon();

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-[#2a2a2a] rounded-lg transition-colors text-left mb-1"
    >
      <div className="p-2 bg-[#0a0a0a] rounded-lg">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{getTitle()}</p>
        <p className="text-xs text-gray-400">
          {getSubtitle()} •{" "}
          {formatDistanceToNow(new Date(conversation.updatedAt), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </button>
  );
}

/**
 * Composant pour afficher un sondage dans l'historique
 */
interface PollItemProps {
  poll: Poll;
  onClick: () => void;
}

function PollItem({ poll, onClick }: PollItemProps) {
  // Icône selon le type
  const Icon = poll.type === "form" ? ClipboardList : Calendar;

  // Titre du sondage
  const title = poll.title || "Sans titre";

  // Type lisible
  const getTypeLabel = () => {
    if (poll.type === "form") return "Formulaire";
    return "Sondage dates";
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-[#2a2a2a] rounded-lg transition-colors text-left mb-1"
    >
      <div className="p-2 bg-[#0a0a0a] rounded-lg">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-gray-400">
          {getTypeLabel()} •{" "}
          {poll.created_at &&
            formatDistanceToNow(new Date(poll.created_at), {
              addSuffix: true,
              locale: fr,
            })}
        </p>
      </div>
    </button>
  );
}
