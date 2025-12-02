import React, { createContext, useContext, ReactNode } from "react";
import { ErrorFactory } from "@/lib/error-handling";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  trackPageView: (path: string, title?: string) => void;
  trackUserAction: (action: string, context?: string) => void;
  trackError: (error: Error, context?: string) => void;
  trackProductInteraction: (productType: string, action: string, productId?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  enabled = true,
}) => {
  const track = (event: string, properties?: Record<string, any>) => {
    if (!enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties,
      timestamp: Date.now(),
    };

    // Send to analytics service
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", event, properties);
    }

    // Console logging for development
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", analyticsEvent);
    }
  };

  const trackPageView = (path: string, title?: string) => {
    track("page_view", {
      page_path: path,
      page_title: title,
    });
  };

  const trackUserAction = (action: string, context?: string) => {
    track("user_action", {
      action,
      context,
    });
  };

  const trackError = (error: Error, context?: string) => {
    track("error", {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  };

  const trackProductInteraction = (productType: string, action: string, productId?: string) => {
    track("product_interaction", {
      product_type: productType,
      action,
      product_id: productId,
    });
  };

  const value: AnalyticsContextType = {
    track,
    trackPageView,
    trackUserAction,
    trackError,
    trackProductInteraction,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw ErrorFactory.validation(
      "useAnalytics must be used within an AnalyticsProvider",
      "Erreur de configuration du contexte"
    );
  }
  return context;
};

// Extend window interface for Google Analytics
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}
