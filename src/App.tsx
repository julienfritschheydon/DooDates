import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthCallback } from "./pages/Auth";
import { VotingSwipe } from "./components/voting/VotingSwipe";
import { Loader2 } from "lucide-react";

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
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Vote = lazy(() => import('./pages/Vote'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PollCreator = lazy(() => 
  import('./pages/PollCreator').then(module => {
    // Preload des dépendances critiques
    import('./components/PollCreator');
    import('./components/Calendar');
    return module;
  })
);

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/vote/:pollId" element={<Vote />} />
              <Route path="/vote-swipe/:pollId" element={<VotingSwipe />} />
              <Route path="/demo/swipe" element={<VotingSwipe />} />
              <Route path="/create" element={<PollCreator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster />
      <Sonner />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
