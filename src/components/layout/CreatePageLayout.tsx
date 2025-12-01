import { Suspense, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSmartNavigation } from "../../hooks/useSmartNavigation";
import { useUIState } from "../prototype/UIStateProvider";
import { createLazyIcon } from "../../lib/lazy-icons";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getAllPolls, type Poll } from "../../lib/pollStorage";
import { getConversations } from "../../lib/storage/ConversationStorageSimple";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { logger } from "../../lib/logger";
import { AuthModal } from "../modals/AuthModal";

// Lazy load des icônes
const X = createLazyIcon("X");
const Plus = createLazyIcon("Plus");
const Menu = createLazyIcon("Menu");
const Calendar = createLazyIcon("Calendar");
const ClipboardList = createLazyIcon("ClipboardList");
const Clock = createLazyIcon("Clock");
const FileText = createLazyIcon("FileText");
const MessageSquare = createLazyIcon("MessageSquare");
const Sparkles = createLazyIcon("Sparkles");
const Settings = createLazyIcon("Settings");
const User = createLazyIcon("User");
const LogOut = createLazyIcon("LogOut");
const DollarSign = createLazyIcon("DollarSign");
const Key = createLazyIcon("Key");
const Book = createLazyIcon("Book");

// Wrapper pour icônes lazy avec Suspense
const LazyIconWrapper = ({
  Icon,
  className,
  ...props
}: {
  Icon: React.LazyExoticComponent<React.ComponentType<React.SVGProps<SVGSVGElement>>>;
  className?: string;
} & Omit<React.SVGProps<SVGSVGElement>, "ref">) => {
  const IconComponent = Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  return (
    <Suspense fallback={<span className={className || "w-5 h-5"} />}>
      <IconComponent className={className} {...props} />
    </Suspense>
  );
};

interface CreatePageLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout pour les pages de création avec sidebar
 * Utilise le même style de sidebar que AICreationWorkspace
 */
export function CreatePageLayout({ children }: CreatePageLayoutProps) {
  const navigate = useNavigate();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUIState();
  const { user, profile, signOut } = useAuth();
  const { toast: showToast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { smartNavigate } = useSmartNavigation();

  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [conversations, setConversations] = useState<ReturnType<typeof getConversations>>([]);
  const [conversationsRefreshKey, setConversationsRefreshKey] = useState(0);

  // Charger les données
  const loadData = useCallback(() => {
    try {
      const polls = getAllPolls();
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

      const allConvs = getConversations();
      const filteredConvs = allConvs.filter((conv) => {
        if (user?.id) {
          return conv.userId === user.id;
        } else {
          return conv.userId === "guest" || conv.userId === undefined;
        }
      });
      const sortedConvs = filteredConvs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setConversations(sortedConvs);
    } catch (error) {
      logger.error("Erreur chargement données", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData, conversationsRefreshKey]);

  useEffect(() => {
    const handleConversationsChanged = (event?: CustomEvent) => {
      setTimeout(() => {
        setConversationsRefreshKey((prev) => prev + 1);
      }, 0);
    };

    window.addEventListener("conversationsChanged", handleConversationsChanged as EventListener);
    return () =>
      window.removeEventListener(
        "conversationsChanged",
        handleConversationsChanged as EventListener,
      );
  }, []);

  return (
    <div className="flex h-screen bg-[#1e1e1e] overflow-hidden">
      {/* Backdrop pour fermer la sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar gauche */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] transform transition-transform duration-300 flex flex-col border-r border-gray-700 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">DooDates</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <LazyIconWrapper Icon={X} className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {isSidebarOpen && (
          <>
            <div className="px-4 pb-4 space-y-2">
              {/* Phase 0: Trois boutons distincts pour les trois types de création */}
              <button
                data-testid="create-date-poll"
                onClick={() => {
                  const url = `/workspace/date?new=${Date.now()}`;
                  console.log(
                    '🔵 [CreatePageLayout] Bouton "Créer un nouveau sondage" cliqué - Navigation vers:',
                    url,
                  );
                  smartNavigate(url);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors font-medium"
              >
                <LazyIconWrapper Icon={Calendar} className="w-5 h-5" />
                <span>Créer un nouveau sondage</span>
              </button>

              <button
                data-testid="create-form-poll"
                onClick={() => {
                  const url = `/workspace/form?new=${Date.now()}`;
                  console.log(
                    '🟣 [CreatePageLayout] Bouton "Créer un nouveau formulaire" cliqué - Navigation vers:',
                    url,
                  );
                  smartNavigate(url);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-lg transition-colors font-medium"
              >
                <LazyIconWrapper Icon={ClipboardList} className="w-5 h-5" />
                <span>Créer un nouveau formulaire</span>
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

              <button
                onClick={() => {
                  navigate("/pricing");
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
              >
                <LazyIconWrapper Icon={DollarSign} className="w-5 h-5" />
                <span>Tarifs</span>
              </button>

              <button
                onClick={() => {
                  navigate("/docs");
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
              >
                <LazyIconWrapper Icon={Book} className="w-5 h-5" />
                <span>Documentation</span>
              </button>
            </div>

            {/* Historique */}
            <div className="flex-1 overflow-y-auto px-4">
              {conversations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Mes conversations
                  </h3>
                  {conversations.slice(0, 10).map((conv) => {
                    const metadata = conv.metadata || {};
                    const hasPoll = metadata?.pollGenerated;
                    const relatedPoll =
                      hasPoll && metadata?.pollId
                        ? recentPolls.find((p) => p.id === metadata.pollId)
                        : undefined;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          navigate(`/workspace?conversationId=${conv.id}`);
                          if (isMobile) setIsSidebarOpen(false);
                        }}
                        className="w-full flex items-start gap-3 p-3 hover:bg-[#2a2a2a] rounded-lg transition-colors text-left mb-1"
                      >
                        <div className="p-2 bg-[#0a0a0a] rounded-lg flex-shrink-0">
                          <LazyIconWrapper Icon={MessageSquare} className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {conv.title || "Conversation sans titre"}
                          </p>
                          {relatedPoll && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {relatedPoll.type === "form" ? (
                                <LazyIconWrapper
                                  Icon={ClipboardList}
                                  className="w-3 h-3 text-gray-500 flex-shrink-0"
                                />
                              ) : (
                                <LazyIconWrapper
                                  Icon={Calendar}
                                  className="w-3 h-3 text-gray-500 flex-shrink-0"
                                />
                              )}
                              <p className="text-xs text-gray-500 truncate">
                                {relatedPoll.type === "form" ? "Formulaire" : "Sondage"} :{" "}
                                {relatedPoll.title}
                              </p>
                            </div>
                          )}
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

              {conversations.length === 0 && recentPolls.length === 0 && (
                <div className="text-center py-8">
                  <LazyIconWrapper Icon={FileText} className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-xs text-gray-400">Aucune conversation</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Menu utilisateur */}
        <div className="p-3 border-t border-gray-800/50">
          {user ? (
            <div className="px-3 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {(profile?.full_name || user.email?.split("@")[0] || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {profile?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast({
                      title: "Paramètres",
                      description: "Page en cours de développement",
                    });
                  }}
                  className="flex-1 px-2 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-gray-700/30"
                >
                  <LazyIconWrapper Icon={Settings} className="w-4 h-4" />
                  <span>Paramètres</span>
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="flex-1 px-2 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-red-500/30"
                >
                  <LazyIconWrapper Icon={LogOut} className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <LazyIconWrapper Icon={User} className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-400">Invité</p>
                  <p className="text-xs text-gray-500">Non connecté</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthModalOpen(true);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-500/20"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Header avec bouton hamburger */}
        <div className="h-14 flex-shrink-0 bg-[#0a0a0a] flex items-center justify-between px-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button
              data-testid="sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <LazyIconWrapper Icon={Menu} className="w-5 h-5 text-gray-300" />
            </button>
            <h1 className="text-xl font-medium text-white">DooDates</h1>
          </div>
        </div>

        {/* Contenu de la page */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>

      {/* Modal d'authentification */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
