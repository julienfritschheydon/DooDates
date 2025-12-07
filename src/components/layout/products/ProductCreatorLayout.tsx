import { Suspense, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSmartNavigation } from "../../../hooks/useSmartNavigation";
import { useUIState } from "../../prototype/UIStateProvider";
import { createLazyIcon } from "../../../lib/lazy-icons";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getAllPolls, type Poll } from "../../../lib/pollStorage";
import { getConversations } from "../../../lib/storage/ConversationStorageSimple";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../hooks/use-toast";
import { logger } from "../../../lib/logger";
import { AuthModal } from "../../modals/AuthModal";
import { getProductConfig, getThemeClasses, type ProductType } from "@/config/products.config";
import { cn } from "@/lib/utils";

// Lazy load icons
const X = createLazyIcon("X");
const Menu = createLazyIcon("Menu");
const MessageSquare = createLazyIcon("MessageSquare");
const Settings = createLazyIcon("Settings");
const User = createLazyIcon("User");
const LogOut = createLazyIcon("LogOut");
const DollarSign = createLazyIcon("DollarSign");
const Book = createLazyIcon("Book");
const LayoutGrid = createLazyIcon("LayoutGrid");

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

interface ProductCreatorLayoutProps {
  children: React.ReactNode;
  productType: ProductType;
}

export function ProductCreatorLayout({ children, productType }: ProductCreatorLayoutProps) {
  const navigate = useNavigate();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUIState();
  const { user, profile, signOut } = useAuth();
  const { toast: showToast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { smartNavigate } = useSmartNavigation();

  const config = getProductConfig(productType);
  const theme = getThemeClasses(config.theme);
  const ProductIcon = createLazyIcon(config.iconName);

  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [conversations, setConversations] = useState<ReturnType<typeof getConversations>>([]);
  const [conversationsRefreshKey, setConversationsRefreshKey] = useState(0);

  const loadData = useCallback(() => {
    try {
      const polls = getAllPolls();
      const filteredPolls = polls.filter((p) => p.type === productType);
      const uniquePolls = Array.from(
        filteredPolls
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
  }, [user?.id, productType]);

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
    <>
      {/**
       * LEGACY-WORKSPACE-IA (désactivé le 2025-12-07)
       * Ancien sidebar IA (DooDates + conversations produits) remplacé par les nouveaux sidebars produits.
       * À SUPPRIMER AVANT LE 2026-06-07.
       *
       * Ancien JSX :
       * <div className="flex h-screen bg-[#1e1e1e] overflow-hidden">...
       */}

      {/* Nouveau comportement minimal : on ne rend plus de sidebar IA ici,
          seulement le contenu fourni par les layouts produits. */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>

      {/* Modal d'authentification conservée pour compatibilité éventuelle */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
