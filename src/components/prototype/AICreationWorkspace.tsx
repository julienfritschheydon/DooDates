// Lazy load de toutes les icônes (chargées à la demande)
import { Suspense } from "react";
import { createLazyIcon } from "../../lib/lazy-icons";

// Lazy load de toutes les icônes (X et Plus utilisées dans sidebar/éditeur conditionnels)
const X = createLazyIcon("X");
const Plus = createLazyIcon("Plus");
const Menu = createLazyIcon("Menu");
const Calendar = createLazyIcon("Calendar");
const ClipboardList = createLazyIcon("ClipboardList");
const Clock = createLazyIcon("Clock");
const FileText = createLazyIcon("FileText");
const MessageSquare = createLazyIcon("MessageSquare");
const Check = createLazyIcon("Check");
const ExternalLink = createLazyIcon("ExternalLink");
const Sparkles = createLazyIcon("Sparkles");
const Settings = createLazyIcon("Settings");
const User = createLazyIcon("User");
const LogOut = createLazyIcon("LogOut");
const UserCircle = createLazyIcon("UserCircle");
const Book = createLazyIcon("Book");
const DollarSign = createLazyIcon("DollarSign");
const Key = createLazyIcon("Key");

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
import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "./ConversationProvider";
import { useEditorState, useEditorActions } from "./EditorStateProvider";
import { useUIState } from "./UIStateProvider";
import GeminiChatInterface, { type GeminiChatHandle } from "../GeminiChatInterface";
import { PollPreview } from "./PollPreview";
import PollCreatorComponent from "../PollCreator";
import { MobileNavigationTabs } from "./MobileNavigationTabs";
import FormPollCreator, {
  type FormPollDraft,
  type AnyFormQuestion,
  type SingleOrMultipleQuestion,
  type TextQuestion,
  type LongTextQuestion,
  type MatrixQuestion,
  type RatingQuestion,
} from "../polls/FormPollCreator";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getAllPolls, savePolls, getCurrentUserId, type Poll } from "../../lib/pollStorage";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { useToast } from "../../hooks/use-toast";
import { ChatInput } from "../chat/ChatInput";
import { VOICE_RECOGNITION_CONFIG } from "../../config/voiceRecognition.config";
import { logger } from "../../lib/logger";
import { getConversations } from "../../lib/storage/ConversationStorageSimple";
import type { ConversationMetadata } from "../../types/conversation";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useAuth } from "../../contexts/AuthContext";
import { AuthModal } from "../modals/AuthModal";
import { BetaKeyModal } from "../modals/BetaKeyModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

// Fonction pour trouver la conversation liée à un sondage (rétrocompatibilité)
function findRelatedConversation(poll: Poll): string | undefined {
  // Si déjà défini, le retourner
  if (poll.relatedConversationId) return poll.relatedConversationId;

  // Sinon, chercher une conversation avec le même titre de sondage
  try {
    const conversations = getConversations();
    const match = conversations.find((conv) => {
      const metadata = conv.metadata as ConversationMetadata | undefined;
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
 * AI Creation Workspace - Espace de création avec IA
 *
 * Layout avec :
 * - Messages à gauche (chat IA)
 * - Créateur de sondage/formulaire à droite (par défaut)
 * - Input en bas
 */
export function AICreationWorkspace({
  pollTypeFromUrl: pollTypeFromProp,
}: {
  pollTypeFromUrl?: "date" | "form" | "availability" | null;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  // Sur mobile : "chat" ou "editor" pour gérer les onglets
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "editor">("chat");
  const [previewInputValue, setPreviewInputValue] = useState("");
  const chatRef = useRef<GeminiChatHandle>(null);
  const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Lire les paramètres de l'URL pour forcer le remontage du chat
  const searchParams = new URLSearchParams(location.search);
  const resumeId = searchParams.get("resume");
  const conversationId = searchParams.get("conversationId");
  const newChatTimestamp = searchParams.get("new");

  // Priorité : prop > query param > défaut "date"
  const pollTypeFromQuery = searchParams.get("type") as "date" | "form" | "availability" | null;
  const pollTypeFromUrl = pollTypeFromProp || pollTypeFromQuery || "date";

  // Convertir "availability" en "date" pour les composants qui ne supportent que "date" | "form"
  const pollTypeForComponents: "date" | "form" =
    pollTypeFromUrl === "availability" ? "date" : pollTypeFromUrl === "form" ? "form" : "date";

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
  const [conversationsRefreshKey, setConversationsRefreshKey] = useState(0);
  const [publishedPoll, setPublishedPoll] = useState<Poll | null>(null);

  // Nouveaux hooks spécialisés
  const { isEditorOpen, currentPoll } = useEditorState();
  const { openEditor, closeEditor, setCurrentPoll, createPollFromChat } = useEditorActions();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUIState();
  const [showManualEditorOnMobile, setShowManualEditorOnMobile] = useState(false);

  // Fermer le preview et nettoyer le poll quand on démarre un nouveau chat (Session 2 - Bug 4)
  useEffect(() => {
    if (newChatTimestamp && !conversationId && !resumeId) {
      closeEditor();
      setCurrentPoll(null);
    }
  }, [newChatTimestamp, conversationId, resumeId, closeEditor, setCurrentPoll]);

  // Hook legacy pour clearConversation (non migré)
  const conversationContext = useConversation();
  const clearConversation = conversationContext?.clearConversation || (() => {});

  // Hook onboarding
  const { startOnboarding } = useOnboarding();

  // Hook auth
  const { user, profile, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [betaKeyModalOpen, setBetaKeyModalOpen] = useState(false);

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
  // Seulement quand l'éditeur est visible sur mobile
  useEffect(() => {
    if (sharedVoiceRecognition.isListening && isMobile && mobileActiveTab === "editor") {
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
    mobileActiveTab,
  ]);

  // Basculer automatiquement sur l'onglet éditeur mobile quand un poll est créé
  useEffect(() => {
    if (isMobile) {
      if (isEditorOpen && currentPoll) {
        setMobileActiveTab("editor");
        // Forcer le scroll en haut quand l'éditeur s'ouvre pour éviter le focus automatique vers le bas
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
        }, 0);
      }
      // Ne pas basculer automatiquement sur "chat" quand l'éditeur se ferme
      // L'utilisateur peut vouloir rester sur l'onglet éditeur
    }
  }, [isMobile, isEditorOpen, currentPoll]);

  // Détecter le paramètre 'new' pour réinitialiser la conversation
  useEffect(() => {
    if (newChatTimestamp) {
      console.log('🔄 [AICreationWorkspace] Nouvelle conversation détectée - Nettoyage du paramètre ?new=');
      // Réinitialiser la conversation
      clearConversation();
      
      // Nettoyer le paramètre ?new= de l'URL SANS changer de page
      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('new');
      const newUrl = searchParams.toString() ? `${currentPath}?${searchParams.toString()}` : currentPath;
      console.log('🔄 [AICreationWorkspace] Navigation vers:', newUrl);
      navigate(newUrl, { replace: true });
      
      // 🔧 FIX: Ouvrir l'éditeur APRÈS la navigation pour éviter que l'état soit perdu
      setTimeout(() => {
        console.log('🔓 [AICreationWorkspace] Ouverture éditeur après navigation');
        openEditor();
      }, 100);
    }
  }, [newChatTimestamp, clearConversation, openEditor, navigate]);

  // Fonction pour charger les données
  const loadData = useCallback(() => {
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

      // Charger conversations et filtrer par utilisateur
      const allConvs = getConversations();
      // Filtrer les conversations pour ne garder que celles du créateur actuel
      // Si connecté : garder celles avec userId === user.id
      // Si invité : garder celles avec userId === "guest" ou undefined (rétrocompatibilité)
      const filteredConvs = allConvs.filter((conv) => {
        if (user?.id) {
          // Mode connecté : garder seulement les conversations de l'utilisateur
          return conv.userId === user.id;
        } else {
          // Mode invité : garder seulement les conversations invitées
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

  // Charger les sondages récents et conversations
  // Se recharge quand on change de conversation (chatKey change), quand un poll est mis à jour, ou quand conversationsRefreshKey change
  useEffect(() => {
    loadData();
  }, [chatKey, currentPoll, loadData, conversationsRefreshKey]);

  // Écouter les événements de changement de conversations (suppression, création, etc.)
  useEffect(() => {
    const handleConversationsChanged = (event?: CustomEvent) => {
      logger.info("🔄 Conversations changées, rechargement du sidebar", "conversation", {
        action: event?.detail?.action,
        conversationId: event?.detail?.conversationId,
      });
      // Petit délai pour s'assurer que localStorage est bien mis à jour
      // puis forcer le rechargement en incrémentant la clé de rafraîchissement
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

  // Écran de succès après publication
  if (publishedPoll) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="pt-20">
            <div className="max-w-2xl mx-auto p-4 sm:p-6">
              <div className="bg-[#3c4043] rounded-lg border border-gray-700 p-8 text-center space-y-6">
                {/* Icône de succès */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <LazyIconWrapper Icon={Check} className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                {/* Message de succès */}
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                  {publishedPoll.type === "form" ? "Formulaire publié !" : "Sondage publié !"}
                </h1>
                <p className="text-gray-300">
                  {publishedPoll.type === "form"
                    ? `Votre formulaire "${publishedPoll.title}" est maintenant actif et prêt à recevoir des réponses.`
                    : `Votre sondage "${publishedPoll.title}" est maintenant actif et prêt à recevoir des votes.`}
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
                  Pour finaliser et partager votre{" "}
                  {publishedPoll.type === "form" ? "formulaire" : "sondage"}, après la bêta, vous
                  devrez vous connecter ou créer un compte.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  <LazyIconWrapper Icon={Check} className="w-5 h-5" />
                  Aller au Tableau de bord
                </Link>
                <Link
                  to={`/poll/${publishedPoll.slug || publishedPoll.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-gray-300 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  data-testid="view-poll-button"
                >
                  <LazyIconWrapper Icon={ExternalLink} className="w-5 h-5" />
                  {publishedPoll.type === "form" ? "Voir le formulaire" : "Voir le sondage"}
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Lien de partage :</p>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <code className="px-4 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                    {window.location.origin}/poll/{publishedPoll.slug || publishedPoll.id}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/poll/${publishedPoll.slug || publishedPoll.id}`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Lien copié !",
                        description: "Le lien a été copié dans le presse-papiers.",
                      });
                    }}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
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
    <>
      {/* Style global pour ajuster le ChatInput au-dessus de la barre de navigation mobile */}
      {isMobile && (
        <style>{`
          @media (max-width: 768px) {
            /* Ajuster le ChatInput pour qu'il soit au-dessus de la barre de navigation (48px) */
            [class*="p-4"][class*="fixed"][class*="bottom-0"][class*="z-40"] {
              bottom: 48px !important;
            }
          }
        `}</style>
      )}
      
      <div
        className={`flex flex-col h-screen bg-[#1e1e1e] ${isMobile ? "overflow-y-auto" : "overflow-hidden"}`}
      >
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
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">DooDates</h2>
            <div className="flex items-center gap-2">
              {/* Bouton Documentation
              <button
                onClick={() => {
                  navigate("/docs");
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Documentation"
                title="Voir la documentation"
              > */}
              {/* <Book className="w-5 h-5 text-gray-300" /> */}
              {/* </button> */}
              {/* Bouton Aide - Onboarding désactivé temporairement */}
              {/* <button
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
              </button> */}
              {/* Bouton Fermer */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Fermer le menu"
                title="Fermer le menu"
              >
                <LazyIconWrapper Icon={X} className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>

          {isSidebarOpen && (
            <>
              <div className="px-4 pb-4 space-y-2">
                {/* Phase 0: Trois boutons distincts pour les trois types de création */}
                <button
                  onClick={() => {
                    const url = `/workspace/date?new=${Date.now()}`;
                    console.log('🔵 [AICreationWorkspace] Bouton "Créer un sondage" cliqué - Navigation vers:', url);
                    navigate(url);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors font-medium"
                >
                  <LazyIconWrapper Icon={Calendar} className="w-5 h-5" />
                  <span>Créer un sondage</span>
                </button>

                <button
                  onClick={() => {
                    const url = `/workspace/form?new=${Date.now()}`;
                    console.log('🟣 [AICreationWorkspace] Bouton "Créer un formulaire" cliqué - Navigation vers:', url);
                    navigate(url);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-lg transition-colors font-medium"
                >
                  <LazyIconWrapper Icon={ClipboardList} className="w-5 h-5" />
                  <span>Créer un formulaire</span>
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
                    if (user) {
                      setBetaKeyModalOpen(true);
                    } else {
                      setAuthModalOpen(true);
                    }
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
                >
                  <LazyIconWrapper Icon={Key} className="w-5 h-5" />
                  <span>Clé bêta</span>
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

              {/* Historique directement dans la sidebar - Vue unifiée */}
              <div className="flex-1 overflow-y-auto px-4">
                {/* Une seule section : Conversations (avec polls associés) */}
                {conversations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Mes conversations
                    </h3>
                    {conversations.slice(0, 10).map((conv) => {
                      const metadata = conv.metadata as
                        | import("../../types/conversation").ConversationMetadata
                        | undefined;
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
                              setCurrentPoll(relatedPoll);
                              openEditor();
                            }

                            navigate(`/workspace?conversationId=${conv.id}`);
                            // Fermer la sidebar sur mobile
                            if (isMobile) setIsSidebarOpen(false);
                          }}
                          className="w-full flex items-start gap-3 p-3 hover:bg-[#2a2a2a] rounded-lg transition-colors text-left mb-1"
                        >
                          <div className="p-2 bg-[#0a0a0a] rounded-lg flex-shrink-0">
                            <LazyIconWrapper
                              Icon={MessageSquare}
                              className="w-4 h-4 text-gray-400"
                            />
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
                    <LazyIconWrapper
                      Icon={FileText}
                      className="w-8 h-8 mx-auto mb-2 text-gray-500"
                    />
                    <p className="text-xs text-gray-400">Aucune conversation</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Menu utilisateur en bas de la sidebar */}
          <div className="p-3 border-t border-gray-800/50 space-y-3">
            {/* Section utilisateur */}
            {user ? (
              <div className="px-3 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                {/* En-tête utilisateur */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <span className="text-sm font-semibold text-white">
                        {(profile?.full_name || user.email?.split("@")[0] || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                      {profile?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => {
                      toast({
                        title: "Paramètres",
                        description: "Page en cours de développement",
                      });
                    }}
                    className="flex-1 min-w-0 px-2 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 border border-gray-700/30 hover:border-gray-600/50"
                    title="Paramètres"
                  >
                    <LazyIconWrapper Icon={Settings} className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Paramètres</span>
                  </button>
                  <button
                    onClick={() => setSignOutDialogOpen(true)}
                    className="flex-1 min-w-0 px-2 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 border border-red-500/30 hover:border-red-500/50 hover:shadow-sm hover:shadow-red-500/10"
                    title="Déconnexion"
                  >
                    <LazyIconWrapper Icon={LogOut} className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Déconnexion</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-600">
                    <LazyIconWrapper Icon={User} className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-400">Invité</p>
                    <p className="text-xs text-gray-500">Non connecté</p>
                  </div>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Se connecter
                </button>
              </div>
            )}

            {/* Statut système */}
            <div className="px-2 py-2 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full shadow-sm shadow-blue-400/50"></div>
                  <span className="text-xs font-medium">IA connectée</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header DooDates global - Au-dessus de tout */}
        <div
          className={`h-14 flex-shrink-0 z-40 bg-[#0a0a0a] flex items-center justify-between px-4`}
        >
          <div className="flex items-center gap-3">
            {/* Bouton hamburger (mobile + desktop pour replier sidebar) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <LazyIconWrapper Icon={Menu} className="w-5 h-5 text-gray-300" />
            </button>
            <h1 className="text-xl font-medium text-white">DooDates</h1>
          </div>
        </div>

        {/* Contenu principal - Chat et Créateur côte à côte */}
        <div className={`flex flex-1 min-h-0 ${isMobile ? "flex-col" : "flex-row"}`}>
          {/* Chat principal - Zone gauche */}
          <div
            className={`flex flex-col bg-[#0a0a0a] transition-all duration-300 flex-1 flex-shrink-0 ${
              isMobile ? "w-full" : "w-1/2"
            }`}
          >
            {/* Toggle Chat/Preview sur mobile */}
            {/* 
              NOTE: Structure flex pour permettre le centrage vertical du chat
              - flex flex-col: Crée un contexte flex vertical pour les enfants
              - flex-1 min-h-0: Prend toute la hauteur disponible
            */}
            <div className="flex-1 min-h-0 bg-[#0a0a0a] flex flex-col">
              {/* Chat toujours rendu (masqué en Preview) pour que chatRef soit accessible */}
              {/* 
              NOTE: Conteneur pour GeminiChatInterface
              - flex-1 min-h-0: Prend toute la hauteur disponible dans le flex parent
              - pb-32: Espace pour l'input fixe en bas
            */}

              <div
                className={`flex-1 min-h-0 w-full ${isMobile && mobileActiveTab === "editor" ? "hidden" : ""} ${isMobile && showManualEditorOnMobile ? "hidden" : ""}`}
              >
                <GeminiChatInterface
                  ref={chatRef}
                  key={chatKey}
                  onPollCreated={(pollData) => {
                    createPollFromChat(pollData as Partial<Poll>);
                    // Basculer sur l'onglet éditeur après création
                    if (isMobile) {
                      setMobileActiveTab("editor");
                      setShowManualEditorOnMobile(false);
                    }
                  }}
                  onUserMessage={() => {
                    // Ne plus basculer automatiquement sur Chat en mobile
                  }}
                  hideStatusBar={true}
                  darkTheme={true}
                  voiceRecognition={sharedVoiceRecognition}
                  pollType={pollTypeForComponents}
                />
              </div>

              {/* Éditeur sur mobile - affiché quand l'onglet "editor" est actif */}
              {isMobile && mobileActiveTab === "editor" && (
                <div className="absolute inset-0 bg-[#0a0a0a] z-10 overflow-y-auto pt-14 pb-16">
                  <div className="relative">
                    {/* Bouton fermer visible seulement si un poll existe */}
                    {currentPoll && (
                      <button
                        onClick={() => {
                          closeEditor();
                          setMobileActiveTab("chat");
                        }}
                        className="fixed top-4 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                        aria-label="Fermer l'éditeur"
                        title="Fermer"
                      >
                        <LazyIconWrapper Icon={X} className="w-5 h-5" />
                      </button>
                    )}
                    
                    {currentPoll ? (
                      <>
                        <PollPreview poll={currentPoll} />
                        {/* Barre d'input fixe en bas pour envoyer des messages depuis l'éditeur */}
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
                          pollType={pollTypeForComponents}
                        />
                      </>
                    ) : (
                      // Afficher le créateur vide si pas de poll
                      <>
                        {pollTypeFromUrl === "form" ? (
                          <FormPollCreator
                            initialDraft={undefined}
                            onCancel={() => {
                              setShowManualEditorOnMobile(false);
                              setMobileActiveTab("chat");
                            }}
                            onSave={() => {}}
                            onFinalize={(draft, savedPoll) => {
                              if (savedPoll) {
                                setPublishedPoll(savedPoll);
                              }
                              setShowManualEditorOnMobile(false);
                            }}
                          />
                        ) : (
                          <PollCreatorComponent
                            onBack={(createdPoll) => {
                              if (createdPoll) {
                                setPublishedPoll(createdPoll);
                              }
                              setShowManualEditorOnMobile(false);
                              setMobileActiveTab("chat");
                            }}
                            initialData={undefined}
                          />
                        )}
                        {/* Barre d'input fixe en bas pour envoyer des messages depuis l'éditeur vide */}
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
                          pollType={pollTypeForComponents}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Barre de navigation mobile avec onglets */}
              {isMobile && (
                <MobileNavigationTabs
                  activeTab={mobileActiveTab}
                  onTabChange={setMobileActiveTab}
                  pollType={pollTypeFromUrl}
                  hasPoll={!!currentPoll}
                />
              )}
            </div>
          </div>

          {/* Créateur de sondage/formulaire - Sidebar droite sur desktop, visible si éditeur ouvert */}
          {/* Sur mobile, afficher l'éditeur manuel quand showManualEditorOnMobile est true */}
          {((!isMobile && isEditorOpen) || (isMobile && showManualEditorOnMobile)) && (
            <div
              className={`${isMobile ? "w-full absolute inset-0 z-20" : "w-1/2"} bg-[#0a0a0a] flex flex-col`}
            >
              {/* Bouton retour sur mobile */}
              {isMobile && showManualEditorOnMobile && (
                <button
                  onClick={() => {
                    setShowManualEditorOnMobile(false);
                    closeEditor();
                  }}
                  className="fixed top-4 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                  aria-label="Retour au chat"
                  title="Retour au chat"
                >
                  <LazyIconWrapper Icon={X} className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 overflow-y-auto relative pt-4">
                {isEditorOpen && currentPoll ? (
                  currentPoll.type === "date" ? (
                    // Pour les sondages de dates, utiliser PollCreator avec les données du poll
                    (() => {
                      const initialData = {
                        title: currentPoll.title,
                        description: currentPoll.description,
                        dates: currentPoll.dates || [],
                        dateGroups: currentPoll.dateGroups,
                        type: "date" as const,
                      };
                      console.log('[WEEKEND_GROUPING] 🎯 AICreationWorkspace - Passage à PollCreator:', {
                        hasDates: !!initialData.dates?.length,
                        datesCount: initialData.dates?.length,
                        hasDateGroups: !!initialData.dateGroups,
                        dateGroupsCount: initialData.dateGroups?.length,
                        dateGroups: initialData.dateGroups,
                      });
                      return (
                        <PollCreatorComponent
                          onBack={(createdPoll) => {
                            if (createdPoll) {
                              setPublishedPoll(createdPoll);
                            }
                            closeEditor();
                          }}
                          initialData={initialData}
                        />
                      );
                    })()
                  ) : (
                    // Pour les autres types, afficher la preview
                    <>
                      <button
                        onClick={closeEditor}
                        className="fixed top-4 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                        aria-label="Fermer l'éditeur"
                        title="Fermer"
                      >
                        <LazyIconWrapper Icon={X} className="w-5 h-5" />
                      </button>
                      <PollPreview poll={currentPoll} />
                    </>
                  )
                ) : // Afficher le créateur vide par défaut selon le type
                pollTypeFromUrl === "form" ? (
                  <FormPollCreator
                    initialDraft={undefined}
                    onCancel={() => {}}
                    onSave={() => {}}
                    onFinalize={(draft, savedPoll) => {
                      // Utiliser le poll créé par createFormPoll au lieu de créer un nouveau poll
                      if (savedPoll) {
                        setPublishedPoll(savedPoll);
                      }
                    }}
                  />
                ) : (
                  <PollCreatorComponent
                    onBack={(createdPoll) => {
                      if (createdPoll) {
                        setPublishedPoll(createdPoll);
                      }
                    }}
                    initialData={undefined}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'authentification */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Modal clé bêta */}
      <BetaKeyModal open={betaKeyModalOpen} onOpenChange={setBetaKeyModalOpen} />

      {/* Dialog de confirmation de déconnexion */}
      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ?
              <br />
              <br />
              <span className="font-medium">Connecté en tant que {user?.email}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { error } = await signOut();
                  if (error) {
                    toast({
                      title: "Erreur",
                      description: error.message || "Erreur lors de la déconnexion",
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Déconnexion",
                      description: "Vous avez été déconnecté",
                    });
                    setSignOutDialogOpen(false);
                    // Forcer le rechargement pour s'assurer que tout est nettoyé
                    setTimeout(() => {
                      window.location.href = "/";
                    }, 500);
                  }
                } catch (error) {
                  toast({
                    title: "Erreur",
                    description: "Erreur lors de la déconnexion",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
