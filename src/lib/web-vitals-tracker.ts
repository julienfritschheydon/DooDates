import { useEffect } from 'react';
import { logError, ErrorFactory } from './error-handling';

// Web Vitals types
interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

interface WebVitalsData {
  timestamp: string;
  cls?: number;
  fid?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
  url: string;
  userAgent: string;
  sessionId: string;
}

// Hook to track Web Vitals
export function useWebVitals() {
  useEffect(() => {
    import('web-vitals').then((webVitals) => {
      const sendToAnalytics = (metric: WebVitalsMetric) => {
        const data: WebVitalsData = {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: getSessionId(),
          [metric.name.toLowerCase()]: metric.value
        };

        // Send to Supabase or analytics service
        sendWebVitalsToSupabase(data);
      };

      // Track all Core Web Vitals using onCLS, onFID, etc. (web-vitals v5 API)
      if (webVitals.onCLS) webVitals.onCLS(sendToAnalytics);
      if (webVitals.onFID) webVitals.onFID(sendToAnalytics);
      if (webVitals.onFCP) webVitals.onFCP(sendToAnalytics);
      if (webVitals.onLCP) webVitals.onLCP(sendToAnalytics);
      if (webVitals.onTTFB) webVitals.onTTFB(sendToAnalytics);
      if (webVitals.onINP) webVitals.onINP(sendToAnalytics); // INP replaces FID in newer versions
    }).catch((error) => {
      logError(
        ErrorFactory.api('Web Vitals tracking not available', 'Suivi Web Vitals non disponible'),
        { component: 'web-vitals-tracker', operation: 'useWebVitals', error }
      );
    });
  }, []);
}

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('webVitalsSessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('webVitalsSessionId', sessionId);
  }
  return sessionId;
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Send Web Vitals data to Supabase
async function sendWebVitalsToSupabase(data: WebVitalsData) {
  try {
    // Only send in production
    if (import.meta.env.PROD) {
      const { supabase } = await import('./supabase');
      await supabase
        .from('web_vitals')
        .insert([data]);
    } else {
      // Log in development
      console.log('Web Vitals:', data);
    }
  } catch (error) {
    logError(
      ErrorFactory.api('Failed to send Web Vitals data', 'Erreur lors de l\'envoi des données Web Vitals'),
      { component: 'web-vitals-tracker', operation: 'sendWebVitalsToSupabase', error }
    );
  }
}

// Component to initialize Web Vitals tracking
export function WebVitalsTracker() {
  useWebVitals();
  return null; // This component doesn't render anything
}
