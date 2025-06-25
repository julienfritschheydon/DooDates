import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Auth, AuthCallback } from "./pages/Auth";
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
const Vote = lazy(() => import('./pages/Vote'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Cache persistant pour résister au HMR de Vite
const CACHE_KEY = 'doodates-pollcreator-loaded';
const TIMESLOT_CACHE_KEY = 'doodates-timeslot-loaded';
let pollCreatorModule: any = null;
let pollCreatorLoadingPromise: Promise<any> | null = null;
let timeSlotFunctionsModule: any = null;

// Vérifier si le module a déjà été chargé dans cette session
const isModulePreloaded = () => {
  return sessionStorage.getItem(CACHE_KEY) === 'true';
};

// Marquer le module comme chargé
const markModuleAsLoaded = () => {
  sessionStorage.setItem(CACHE_KEY, 'true');
};

const preloadPollCreator = () => {
  if (pollCreatorModule) {
    console.log('📦 PollCreator - Module déjà en cache (mémoire)');
    return Promise.resolve(pollCreatorModule);
  }
  
  if (isModulePreloaded()) {
    console.log('📦 PollCreator - Module marqué comme pré-chargé (session)');
    const timerId = `📦 PollCreator - Rechargement optimisé - ${Date.now()}`;
    console.time(timerId);
    return import('./pages/PollCreator').then(module => {
      console.timeEnd(timerId);
      pollCreatorModule = module;
      return module;
    });
  }
  
  if (pollCreatorLoadingPromise) {
    console.log('📦 PollCreator - Utilisation de la promesse existante');
    return pollCreatorLoadingPromise;
  }

  console.time('📦 PollCreator - Premier chargement complet');
  pollCreatorLoadingPromise = Promise.all([
    import('./pages/PollCreator'),
    import('./components/PollCreator'),
    import('./components/Calendar')
  ]).then(([pageModule]) => {
    console.timeEnd('📦 PollCreator - Premier chargement complet');
    pollCreatorModule = pageModule;
    markModuleAsLoaded(); // Marquer comme chargé
    pollCreatorLoadingPromise = null;
    return pageModule;
  }).catch(error => {
    console.error('❌ Erreur preload PollCreator:', error);
    pollCreatorLoadingPromise = null;
    throw error;
  });
  
  return pollCreatorLoadingPromise;
};

// Démarrer le preload immédiatement + fonctions TimeSlot
preloadPollCreator();

// Précharger aussi les fonctions TimeSlot globalement avec cache
const preloadTimeSlotFunctions = () => {
  if (timeSlotFunctionsModule) {
    console.log('⏰ TimeSlot Functions - Déjà en cache');
    return Promise.resolve(timeSlotFunctionsModule);
  }
  
  if (sessionStorage.getItem(TIMESLOT_CACHE_KEY) === 'true') {
    console.time('⏰ TimeSlot Functions - Rechargement session');
    return import('./lib/timeSlotFunctions').then(module => {
      console.timeEnd('⏰ TimeSlot Functions - Rechargement session');
      timeSlotFunctionsModule = module;
      return module;
    });
  }
  
  console.time('⏰ TimeSlot Functions - Premier chargement');
  return import('./lib/timeSlotFunctions').then(module => {
    console.timeEnd('⏰ TimeSlot Functions - Premier chargement');
    timeSlotFunctionsModule = module;
    sessionStorage.setItem(TIMESLOT_CACHE_KEY, 'true');
    return module;
  });
};

// Précharger le calendrier progressif dès le démarrage
const preloadProgressiveCalendar = () => {
  console.time('📅 Préchargement calendrier progressif');
  return import('./lib/progressive-calendar').then(progressiveModule => {
    return import('./lib/calendar-generator').then(generatorModule => {
      return progressiveModule.getProgressiveCalendar().then(calendar => {
        generatorModule.initializeGlobalCalendarCache(calendar);
        console.timeEnd('📅 Préchargement calendrier progressif');
        console.log('✅ Calendrier progressif préchargé et cache initialisé');
        return calendar;
      });
    });
  }).catch(error => {
    console.warn('⚠️ Erreur préchargement calendrier progressif:', error);
    // Fallback: calendrier statique
    console.time('📅 Fallback: calendrier statique');
    return import('./lib/calendar-data').then(module => {
      console.timeEnd('📅 Fallback: calendrier statique');
      return module.getStaticCalendar();
    }).then(() => {
      console.log('✅ Calendrier statique préchargé (fallback)');
    }).catch(fallbackError => {
      console.warn('⚠️ Erreur fallback calendrier:', fallbackError);
    });
  });
};

preloadTimeSlotFunctions();
preloadProgressiveCalendar();

// Préchargement complet en arrière-plan (après 1 seconde)
setTimeout(() => {
  console.log('🚀 Préchargement complet en arrière-plan...');
  console.time('📦 Préchargement complet');
  
  // Diviser le préchargement en chunks plus petits pour éviter les violations
  const preloadInBatches = async () => {
    // Batch 1: Composants critiques (petits)
    await Promise.all([
      import('./components/ui/button'),
      import('./components/ui/card'),
      import('./lib/utils')
    ]);
    
    // Petit délai pour éviter de bloquer le thread principal
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Batch 2: Composants moyens
    await Promise.all([
      import('./components/ui/calendar'),
      import('./components/Calendar'),
      import('./lib/schemas')
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Batch 3: Gros modules (chargement différé)
    requestIdleCallback(() => {
      Promise.all([
        import('framer-motion'),
        import('@supabase/supabase-js'),
        import('lucide-react')
      ]).catch(error => {
        console.warn('⚠️ Erreur préchargement gros modules:', error);
      });
    });
    
    // PollCreator en dernier si pas déjà chargé
    if (!pollCreatorModule) {
      await preloadPollCreator();
    }
  };
  
  preloadInBatches().then(() => {
    console.timeEnd('📦 Préchargement complet');
    console.log('✅ Préchargement complet terminé - Navigation instantanée !');
  }).catch(error => {
    console.warn('⚠️ Erreur préchargement complet:', error);
  });
}, 1000);

// Exposer globalement pour utilisation dans PollCreator
(window as any).getTimeSlotFunctions = () => timeSlotFunctionsModule;

const PollCreator = lazy(() => {
  if (pollCreatorModule) {
    console.time('📦 PollCreator - Cache mémoire instantané');
    const result = Promise.resolve(pollCreatorModule);
    console.timeEnd('📦 PollCreator - Cache mémoire instantané');
    return result;
  }
  
  if (isModulePreloaded()) {
    console.time('📦 PollCreator - Cache session rapide');
    return import('./pages/PollCreator').then(module => {
      console.timeEnd('📦 PollCreator - Cache session rapide');
      pollCreatorModule = module;
      return module;
    });
  }
  
  console.time('📦 PollCreator - Chargement initial');
  return preloadPollCreator().then(module => {
    console.timeEnd('📦 PollCreator - Chargement initial');
    return module;
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
  console.log('ℹ️ Préchargement déjà effectué en arrière-plan');
};

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
