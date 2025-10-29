import { lazy, Suspense, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Auth, AuthCallback } from "./pages/Auth";
import { logger } from "@/lib/logger";
import VotingSwipe from "./components/voting/VotingSwipe";
// import { VotingSwipe as ExVotingSwipe } from "./components/voting/ex-VotingSwipe";
import { Loader2 } from "lucide-react";
import { ConversationProvider } from "./components/prototype/ConversationProvider";
import { UIStateProvider } from "./components/prototype/UIStateProvider";
import { ConversationStateProvider } from "./components/prototype/ConversationStateProvider";
import { EditorStateProvider } from "./components/prototype/EditorStateProvider";
import { useIsMobile } from "@/hooks/use-mobile";

// Composant de loading optimisé
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600 font-medium">Chargement...</p>
      <p className="text-sm text-gray-400 mt-1">Préparation de votre sondage</p>
    </div>
  </div>
);

// Pages avec preload hint pour les pages critiques
const Vote = lazy(() => import("./pages/Vote"));
const Results = lazy(() => import("./pages/Results"));
const CreateChooser = lazy(() => import("./pages/CreateChooser"));
const DateCreator = lazy(() => import("./pages/DateCreator"));
const FormCreator = lazy(() => import("./pages/FormCreator"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Prototype pages (UX IA-First)
const ChatLandingPrototype = lazy(() =>
  import("./components/prototype/ChatLandingPrototype").then((m) => ({
    default: m.ChatLandingPrototype,
  })),
);
const WorkspacePage = lazy(() =>
  import("./app/workspace/page").then((m) => ({ default: m.default })),
);

// Cache persistant pour résister au HMR de Vite
const CACHE_KEY = "doodates-pollcreator-loaded";
const TIMESLOT_CACHE_KEY = "doodates-timeslot-loaded";
let pollCreatorModule: any = null;
let pollCreatorLoadingPromise: Promise<any> | null = null;
let timeSlotFunctionsModule: any = null;

// Vérifier si le module a déjà été chargé dans cette session
const isModulePreloaded = () => {
  return sessionStorage.getItem(CACHE_KEY) === "true";
};

// Marquer le module comme chargé
const markModuleAsLoaded = () => {
  sessionStorage.setItem(CACHE_KEY, "true");
};

// Préchargement intelligent du PollCreator (fonction simple)
const preloadPollCreator = async () => {
  if (pollCreatorModule) {
    return pollCreatorModule;
  }

  // Si une promesse de préchargement est déjà en cours
  if (pollCreatorLoadingPromise) {
    return pollCreatorLoadingPromise;
  }

  // Démarrer le préchargement
  pollCreatorLoadingPromise = (async () => {
    try {
      const startTime = performance.now();

      // Précharger le module PollCreator
      const module = await import("./components/PollCreator");
      pollCreatorModule = module;

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Marquer comme préchargé
      sessionStorage.setItem(CACHE_KEY, "true");
      sessionStorage.setItem("pollCreator-loadTime", loadTime.toString());

      // Log seulement si temps de chargement élevé
      if (loadTime > 1000) {
        logger.warn("PollCreator - Rechargement lent", "performance", {
          loadTime,
        });
      }

      return module;
    } catch (error) {
      logger.error("Erreur préchargement PollCreator", "general", error);
      pollCreatorLoadingPromise = null;
      throw error;
    }
  })();

  return pollCreatorLoadingPromise;
};

// Préchargement TimeSlot Functions (fonction simple)
const preloadTimeSlotFunctions = async () => {
  if (timeSlotFunctionsModule) {
    return;
  }

  try {
    const startTime = performance.now();

    // Importer le module
    timeSlotFunctionsModule = await import("./lib/timeSlotFunctions");

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    sessionStorage.setItem(TIMESLOT_CACHE_KEY, "loaded");

    // Log seulement si rechargement session
    if (!sessionStorage.getItem(TIMESLOT_CACHE_KEY + "-session")) {
      //console.log(`⏰ TimeSlot Functions - Rechargement session: ${loadTime} ms`);
      sessionStorage.setItem(TIMESLOT_CACHE_KEY + "-session", "true");
    }
  } catch (error) {
    logger.error("Erreur préchargement TimeSlot Functions", "performance", error);
  }
};

// Préchargement calendrier progressif (fonction simple)
const preloadProgressiveCalendar = async () => {
  try {
    const startTime = performance.now();

    // Précharger le calendrier progressif
    const { getProgressiveCalendar } = await import("./lib/progressive-calendar");
    await getProgressiveCalendar();

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Log seulement les temps significatifs
    //if (loadTime > 500) {
    //  console.log(`📅 Préchargement calendrier progressif: ${loadTime} ms`);
    //}
  } catch (error) {
    logger.error("Erreur préchargement calendrier", "calendar", error);
  }
};

// Préchargement du calendrier statique
const preloadStaticCalendar = async () => {
  try {
    const startTime = performance.now();

    // Précharger le calendrier statique pour éviter le fallback
    const { getStaticCalendar } = await import("./lib/calendar-data");
    await getStaticCalendar();

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Log seulement les temps significatifs
    if (loadTime > 100) {
      //console.log(`📅 Calendrier statique préchargé: ${loadTime} ms`);
    }
  } catch (error) {
    logger.warn("Erreur préchargement calendrier statique", "calendar", error);
  }
};

// Démarrer le preload immédiatement + fonctions TimeSlot
preloadPollCreator();

// Précharger aussi les fonctions TimeSlot globalement avec cache
preloadTimeSlotFunctions();
preloadProgressiveCalendar();
preloadStaticCalendar();

// Préchargement complet en arrière-plan (après 1 seconde)
setTimeout(() => {
  //console.log("🚀 Préchargement complet en arrière-plan...");
  //console.time("📦 Préchargement complet");
  // Diviser le préchargement en chunks plus petits pour éviter les violations
  const preloadInBatches = async () => {
    // Batch 1: Composants critiques (petits)
    await Promise.all([
      import("./components/ui/button"),
      import("./components/ui/card"),
      import("./lib/utils"),
    ]);

    // Petit délai pour éviter de bloquer le thread principal
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Batch 2: Composants moyens
    await Promise.all([
      import("./components/ui/calendar"),
      import("./components/Calendar"),
      import("./lib/schemas"),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Batch 3: Gros modules (chargement différé)
    requestIdleCallback(() => {
      Promise.all([
        import("framer-motion"),
        import("@supabase/supabase-js"),
        import("lucide-react"),
      ]).catch((error) => {
        logger.warn("Erreur préchargement gros modules", "performance", error);
      });
    });

    // PollCreator en dernier si pas déjà chargé
    if (!pollCreatorModule) {
      await preloadPollCreator();
    }
  };

  preloadInBatches().catch((error) => {
    logger.warn("Erreur préchargement complet", "performance", error);
  });
}, 1000);

// Exposer globalement pour utilisation dans PollCreator
(window as any).getTimeSlotFunctions = () => timeSlotFunctionsModule;

const PollCreator = lazy(() => {
  if (pollCreatorModule) {
    // Module already in memory - no need to measure time
    return Promise.resolve(pollCreatorModule);
  }

  if (isModulePreloaded()) {
    const timerId = logger.time("PollCreator - Cache session", "performance");
    return import("./pages/PollCreator")
      .then((module) => {
        logger.timeEnd(timerId);
        pollCreatorModule = module;
        return module;
      })
      .catch((error) => {
        logger.error("Erreur chargement PollCreator (cache)", "general", error);
        throw error;
      });
  }

  const timerId = logger.time("PollCreator - Chargement initial", "performance");
  return preloadPollCreator()
    .then((module) => {
      logger.timeEnd(timerId);
      return module;
    })
    .catch((error) => {
      logger.error("Erreur chargement PollCreator (initial)", "general", error);
      throw error;
    });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Réduire les refetch automatiques pour améliorer les performances
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

// Plus besoin de préchargement au survol - tout se charge en arrière-plan
(window as any).preloadPollCreator = () => {
  logger.info("Préchargement déjà effectué en arrière-plan", "performance");
};

// Composant wrapper pour VotingSwipe qui extrait le pollId de l'URL
const VotingSwipeWrapper = () => {
  const { pollId } = useParams<{ pollId: string }>();
  return pollId ? <VotingSwipe pollId={pollId} /> : <div>ID du sondage manquant</div>;
};

// Composant pour la démo avec un ID fixe
// const VotingSwipeDemo = () => {
//   return <VotingSwipe pollId="demo-poll-id" />;
// };

// Composant pour afficher l'ancienne version ex-VotingSwipe
// const ExVotingSwipeDemo = () => {
//   return <ExVotingSwipe onBack={() => window.history.back()} />;
// };

// Layout principal (anciennement LayoutPrototype)
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  // Pages qui ne doivent pas afficher la Sidebar (garde TopNav)
  const useClassicLayout =
    location.pathname.startsWith("/poll/") ||
    location.pathname.startsWith("/create/") ||
    location.pathname.startsWith("/vote/") ||
    location.pathname.startsWith("/auth");

  // Si page classique, utiliser layout simple
  if (useClassicLayout) {
    return <>{children}</>;
  }

  // Sinon, utiliser layout sans TopBar (style Gemini)
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen">
      <main className={`flex-1 ${isMobile ? "overflow-y-auto" : "overflow-hidden"}`}>
        {children}
      </main>
    </div>
  );
};

const App = () => {
  const AppLayout = Layout;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppLayout>
              <Suspense fallback={<LoadingSpinner />}>
                {/* UIStateProvider pour l'état UI (sidebar, highlights) */}
                <UIStateProvider>
                  {/* ConversationStateProvider pour l'état conversation (messages, ID) */}
                  <ConversationStateProvider>
                    {/* EditorStateProvider pour l'état éditeur (poll, actions) */}
                    <EditorStateProvider>
                      {/* ConversationProvider LEGACY - À migrer progressivement */}
                      <ConversationProvider>
                        <Routes>
                          {/* Route / vers WorkspacePage (AI-First UX) */}
                          <Route path="/" element={<WorkspacePage />} />

                          {/* Redirections vers / */}
                          <Route path="/workspace" element={<WorkspacePage />} />
                          <Route path="/dashboard" element={<WorkspacePage />} />

                          <Route path="/auth" element={<Auth />} />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/poll/:slug" element={<Vote />} />
                          <Route path="/poll/:slug/results" element={<Results />} />
                          <Route path="/vote/:pollId" element={<Vote />} />
                          <Route path="/create" element={<CreateChooser />} />
                          <Route path="/create/date" element={<DateCreator />} />
                          <Route path="/create/form" element={<FormCreator />} />
                          <Route path="/poll/:pollSlug/results/:adminToken" element={<Vote />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ConversationProvider>
                    </EditorStateProvider>
                  </ConversationStateProvider>
                </UIStateProvider>
              </Suspense>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
