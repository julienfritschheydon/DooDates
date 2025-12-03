import React from "react";
import { Routes, Route } from "react-router-dom";
import { ProductApp } from "./app/ProductApp";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<ProductApp />} />
      </Routes>
    </AuthProvider>
  );
}
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

import { useGeoLocation } from "@/hooks/useGeoLocation";

const App = () => {
  const AppLayout = Layout;

  // Trigger Geo Detection on app load
  useGeoLocation();

  // Marquer le début du rendu
  React.useEffect(() => {
    performanceAnalyzer.mark("App-Render-Complete", "rendering");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter basename="/DooDates">
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
