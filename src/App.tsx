import { lazy, Suspense, useCallback } from "react";
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { logger } from "@/lib/logger";
import { performanceMeasurement } from "@/lib/performance-measurement";
import { performanceAnalyzer } from "@/lib/performance-analyzer";
import VotingSwipe from "./components/voting/VotingSwipe";
// import { VotingSwipe as ExVotingSwipe } from "./components/voting/ex-VotingSwipe";
import { ConversationProvider } from "./components/prototype/ConversationProvider";
import { UIStateProvider } from "./components/prototype/UIStateProvider";
import { ConversationStateProvider } from "./components/prototype/ConversationStateProvider";
import { EditorStateProvider } from "./components/prototype/EditorStateProvider";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Composant de loading avec spinner CSS pur
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Chargement...</p>
      <p className="text-sm text-gray-400 mt-1">Préparation de votre sondage</p>
    </div>
  </div>
);

// Pages avec preload hint pour les pages critiques
const Vote = lazy(() => import("./pages/Vote"));
const Results = lazy(() => import("./pages/Results"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DateCreator = lazy(() => import("./pages/DateCreator"));
const FormCreator = lazy(() => import("./pages/FormCreator"));
const AICreator = lazy(() => import("./pages/AICreator"));
const AvailabilityPollCreator = lazy(() => import("./pages/AvailabilityPollCreator"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Prototype pages (UX IA-First)
const Dashboard = lazy(() => import("./components/Dashboard"));
const ConsumptionJournal = lazy(() => import("./pages/ConsumptionJournal"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Docs = lazy(() => import("./pages/Docs").then((m) => ({ default: m.Docs })));
const Pricing = lazy(() => import("./pages/Pricing").then((m) => ({ default: m.PricingPage })));
const VoteDesktopTest = lazy(() => import("./pages/VoteDesktopTest"));

// Pages de navigation et paramètres
const Settings = lazy(() => import("./pages/Settings"));
const Recent = lazy(() => import("./pages/Recent"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Theme = lazy(() => import("./pages/Theme"));

// Cache persistant pour résister au HMR de Vite
const CACHE_KEY = "doodates-pollcreator-loaded";
const TIMESLOT_CACHE_KEY = "doodates-timeslot-loaded";

type PollCreatorModule = typeof import("./pages/PollCreator");
type TimeSlotFunctionsModule = typeof import("./lib/timeSlotFunctions");

let pollCreatorModule: PollCreatorModule | null = null;
let pollCreatorLoadingPromise: Promise<PollCreatorModule> | null = null;
let timeSlotFunctionsModule: TimeSlotFunctionsModule | null = null;

// Vérifier si le module a déjà été chargé dans cette session
const isModulePreloaded = () => {
  return sessionStorage.getItem(CACHE_KEY) === "true";
};

// Marquer le module comme chargé
const markModuleAsLoaded = () => {
  sessionStorage.setItem(CACHE_KEY, "true");
};

// Préchargement intelligent du PollCreator (fonction simple)
const preloadPollCreator = async (): Promise<PollCreatorModule> => {
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

      // Précharger le module PollCreator (page wrapper, pas le composant direct)
      const module = await import("./pages/PollCreator");
      pollCreatorModule = module;

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Marquer comme préchargé
      sessionStorage.setItem(CACHE_KEY, "true");
      sessionStorage.setItem("pollCreator-loadTime", loadTime.toString());

      // Mesurer avec l'utilitaire de performance (utilise le temps déjà calculé)
      performanceMeasurement.measurePollCreatorLoad(loadTime);

      // Log détaillé selon le temps de chargement
      if (loadTime > 1000) {
        logger.warn("⚠️ PollCreator - Rechargement lent", "performance", {
          loadTime: loadTime.toFixed(2) + " ms",
          suggestion: "Vérifier les dépendances lourdes ou la connexion réseau",
        });
      } else if (loadTime < 50) {
        // Probablement du cache ou module déjà chargé
        logger.debug("⚡ PollCreator - Chargement depuis cache", "performance", {
          loadTime: loadTime.toFixed(2) + " ms",
        });
      } else {
        logger.info("✅ PollCreator - Chargement rapide", "performance", {
          loadTime: loadTime.toFixed(2) + " ms",
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

// Marquer le début du chargement initial
performanceAnalyzer.mark("App-Initialization", "initialization");

// Précharger les fonctions TimeSlot globalement avec cache (légères)
performanceAnalyzer.mark("Preload-TimeSlot-Start", "preload");
preloadTimeSlotFunctions();
performanceAnalyzer.mark("Preload-TimeSlot-End", "preload");

// Calendars chargés à la demande (lazy) pour réduire le bundle initial

// ❌ RETIRÉ: preloadPollCreator() ne se charge plus au démarrage
// Le préchargement se fera maintenant à la demande (navigation, hover, idle)

// Préchargement minimal différé (après 3s) - seulement modules critiques
setTimeout(() => {
  // Précharger seulement Supabase (nécessaire pour l'auth)
  const preloadSupabase = () => {
    Promise.all([import("@supabase/supabase-js")]).catch((error) => {
      logger.warn("Erreur préchargement gros modules", "performance", error);
    });
  };

  // Utiliser requestIdleCallback avec fallback pour navigateurs qui ne le supportent pas
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(preloadSupabase, { timeout: 5000 });
  } else {
    // Fallback pour navigateurs sans requestIdleCallback (ex: Mobile Safari)
    setTimeout(preloadSupabase, 10);
  }

  // ❌ RETIRÉ: Préchargement idle automatique
  // PollCreator ne se charge maintenant QUE sur :
  // 1. Hover sur boutons de création (>300ms)
  // 2. Navigation vers /create ou /create/date
  // 3. Appel explicite via window.preloadPollCreator()
  // Cela garantit un vrai 0 ms au démarrage
}, 3000); // Augmenté de 1s à 3s pour laisser plus de temps au chargement initial

// Exposer globalement pour utilisation dans PollCreator
declare global {
  interface Window {
    getTimeSlotFunctions?: () => TimeSlotFunctionsModule | null;
    preloadPollCreator?: () => Promise<PollCreatorModule>;
  }
}
window.getTimeSlotFunctions = () => timeSlotFunctionsModule;

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

// Exposer fonction de préchargement pour utilisation sur hover/click
window.preloadPollCreator = () => {
  if (pollCreatorModule) {
    return Promise.resolve(pollCreatorModule);
  }
  return preloadPollCreator();
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

// Hook pour précharger PollCreator sur navigation vers /create
const usePreloadOnNavigation = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Précharger PollCreator si navigation vers workspace avec type date ou form
    if (
      location.pathname.startsWith("/workspace/date") ||
      location.pathname.startsWith("/workspace/form") ||
      location.pathname.startsWith("/create/availability")
    ) {
      // Précharger immédiatement car l'utilisateur va probablement l'utiliser
      preloadPollCreator().catch(() => {
        // Ignorer les erreurs silencieusement
      });
    }
  }, [location.pathname]);
};

// Layout principal (anciennement LayoutPrototype)
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // ✅ Hook appelé AVANT tout retour conditionnel
  const isMobile = useIsMobile();

  // Précharger PollCreator sur navigation vers /create
  usePreloadOnNavigation();

  // Pages qui ne doivent pas afficher la Sidebar (garde TopNav)
  const useClassicLayout =
    location.pathname.startsWith("/poll/") ||
    location.pathname.startsWith("/create/availability") ||
    location.pathname.startsWith("/vote/") ||
    location.pathname.startsWith("/docs") ||
    location.pathname.startsWith("/pricing") ||
    location.pathname.startsWith("/dashboard");

  // ✅ Hook appelé AVANT tout return conditionnel
  React.useEffect(() => {
    // Ne s'exécuter que si ce n'est pas une page classique
    if (!useClassicLayout) {
      const mainElement = document.querySelector("main[data-app-main]") as HTMLElement;
      const containerElement = document.querySelector("[data-app-container]") as HTMLElement;
      if (mainElement) {
        console.log("🔍 App Layout - Main Element Debug:", {
          mainHeight: mainElement.offsetHeight,
          mainScrollHeight: mainElement.scrollHeight,
          mainClientHeight: mainElement.clientHeight,
          mainOverflow: window.getComputedStyle(mainElement).overflowY,
          containerHeight: containerElement?.offsetHeight,
          containerOverflow: containerElement
            ? window.getComputedStyle(containerElement).overflowY
            : "N/A",
          canScroll: mainElement.scrollHeight > mainElement.clientHeight,
          pathname: location.pathname,
        });
      }
    }
  }, [location.pathname, useClassicLayout]);

  // Si page classique, utiliser layout simple
  if (useClassicLayout) {
    return <>{children}</>;
  }

  // Sinon, utiliser layout simple (style Gemini)

  return (
    <div data-app-container className="flex flex-col h-screen">
      <main data-app-main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  const AppLayout = Layout;

  // Marquer le début du rendu
  React.useEffect(() => {
    performanceAnalyzer.mark("App-Render-Complete", "rendering");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSpinner />}>
                    {/* OnboardingProvider pour l'état onboarding partagé */}
                    <OnboardingProvider>
                      {/* UIStateProvider pour l'état UI (sidebar, highlights) */}
                      <UIStateProvider>
                        {/* ConversationStateProvider pour l'état conversation (messages, ID) */}
                        <ConversationStateProvider>
                          {/* EditorStateProvider pour l'état éditeur (poll, actions) */}
                          <EditorStateProvider>
                            {/* ConversationProvider LEGACY - À migrer progressivement */}
                            <ConversationProvider>
                              <Routes>
                                {/* Route / vers LandingPage (Marketing) */}
                                <Route path="/" element={<LandingPage />} />

                                {/* Workspace IA - Uses AICreator */}
                                <Route path="/workspace" element={<AICreator />} />
                                <Route path="/workspace/date" element={<AICreator />} />
                                <Route path="/workspace/form" element={<AICreator />} />
                                <Route path="/workspace/availability" element={<AICreator />} />

                                {/* Dashboard */}
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/dashboard/journal" element={<ConsumptionJournal />} />
                                <Route path="/auth/callback" element={<AuthCallback />} />

                                {/* Navigation */}
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/recent" element={<Recent />} />
                                <Route path="/results" element={<ResultsPage />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/theme" element={<Theme />} />

                                {/* Sondages */}
                                <Route path="/poll/:slug" element={<Vote />} />
                                <Route path="/poll/:slug/results" element={<Results />} />
                                <Route path="/vote/:pollId" element={<Vote />} />
                                <Route
                                  path="/poll/:pollSlug/results/:adminToken"
                                  element={<Vote />}
                                />

                                {/* Pages de test */}
                                <Route path="/vote-desktop-test" element={<VoteDesktopTest />} />

                                {/* Création */}
                                <Route path="/create/date" element={<DateCreator />} />
                                <Route path="/create/form" element={<FormCreator />} />
                                <Route path="/create/ai" element={<AICreator />} />
                                <Route
                                  path="/create/availability"
                                  element={<AvailabilityPollCreator />}
                                />

                                {/* Autres */}
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/docs/*" element={<Docs />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </ConversationProvider>
                          </EditorStateProvider>
                        </ConversationStateProvider>
                      </UIStateProvider>
                    </OnboardingProvider>
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
