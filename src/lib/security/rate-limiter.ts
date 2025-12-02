/**
 * Rate Limiter Service
 * Protection contre les abus et attaques DDoS basiques
 * Extension de InfiniteLoopProtection.ts pour usage backend
 */

import { ErrorFactory, logError } from "../error-handling";

interface RateLimitTracker {
  count: number;
  lastReset: number;
  isBlocked: boolean;
  blockUntil?: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

export class RateLimiterService {
  private trackers = new Map<string, RateLimitTracker>();
  private defaultConfig: RateLimitConfig = {
    maxRequests: 10, // 10 requêtes par minute
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000, // 5 minutes de blocage
  };

  static configs = {
    // API publiques (plus strictes)
    public: {
      maxRequests: 5,
      windowMs: 60000,
      blockDurationMs: 600000, // 10 minutes
    },
    // API authentifiées
    auth: {
      maxRequests: 20,
      windowMs: 60000,
      blockDurationMs: 300000, // 5 minutes
    },
    // Admin endpoints
    admin: {
      maxRequests: 30,
      windowMs: 60000,
      blockDurationMs: 180000, // 3 minutes
    },
    // AI/Gemini endpoints (très stricts)
    ai: {
      maxRequests: 3,
      windowMs: 60000,
      blockDurationMs: 900000, // 15 minutes
    },
  };

  /**
   * Vérifie si une requête est autorisée
   */
  isAllowed(identifier: string, config?: Partial<RateLimitConfig>): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const tracker = this.trackers.get(identifier);

    // Première requête
    if (!tracker) {
      this.trackers.set(identifier, {
        count: 1,
        lastReset: now,
        isBlocked: false,
      });
      return true;
    }

    // Vérifier si le blocage est toujours actif
    if (tracker.isBlocked && tracker.blockUntil && now < tracker.blockUntil) {
      logError(
        ErrorFactory.rateLimit(
          `Rate limit exceeded for ${identifier}`,
          "Trop de requêtes. Veuillez patienter.",
        ),
        { component: "RateLimiter", identifier, blockedUntil: tracker.blockUntil },
      );
      return false;
    }

    // Réinitialiser si la fenêtre est passée
    if (now - tracker.lastReset > finalConfig.windowMs) {
      tracker.count = 1; // Reset à 1 car cette requête compte
      tracker.lastReset = now;
      tracker.isBlocked = false;
      tracker.blockUntil = undefined;
      return true;
    }

    // Vérifier si le blocage est terminé
    if (tracker.isBlocked && tracker.blockUntil && now >= tracker.blockUntil) {
      tracker.isBlocked = false;
      tracker.blockUntil = undefined;
      tracker.count = 1; // Reset à 1 car cette requête compte
      tracker.lastReset = now;
      return true;
    }

    // Incrémenter le compteur
    tracker.count++;

    // Vérifier si la limite est dépassée
    if (tracker.count > finalConfig.maxRequests) {
      tracker.isBlocked = true;
      tracker.blockUntil = now + finalConfig.blockDurationMs;

      logError(
        ErrorFactory.critical(
          `RATE LIMIT EXCEEDED: ${identifier} blocked for ${finalConfig.blockDurationMs / 1000}s`,
          "Système temporairement bloqué pour prévenir les abus.",
        ),
        {
          component: "RateLimiter",
          identifier,
          count: tracker.count,
          maxRequests: finalConfig.maxRequests,
          blockedUntil: tracker.blockUntil,
        },
      );

      return false;
    }

    return true;
  }

  /**
   * Enregistre une requête réussie
   */
  recordRequest(identifier: string, config?: Partial<RateLimitConfig>): boolean {
    return this.isAllowed(identifier, config);
  }

  /**
   * Obtient les statistiques actuelles
   */
  getStats(identifier: string): RateLimitTracker | null {
    const tracker = this.trackers.get(identifier);
    if (!tracker) return null;

    return {
      ...tracker,
      isBlocked: tracker.isBlocked && (!tracker.blockUntil || Date.now() < tracker.blockUntil),
    };
  }

  /**
   * Réinitialise manuellement un tracker
   */
  reset(identifier: string): void {
    this.trackers.delete(identifier);
  }

  /**
   * Nettoie les trackers expirés (ou tous si forceAll=true)
   */
  cleanup(forceAll: boolean = true): void {
    if (forceAll) {
      this.trackers.clear();
      return;
    }
    
    const now = Date.now();
    for (const [identifier, tracker] of this.trackers.entries()) {
      if (
        tracker.blockUntil &&
        now > tracker.blockUntil &&
        now - tracker.lastReset > this.defaultConfig.windowMs * 2
      ) {
        this.trackers.delete(identifier);
      }
    }
  }

  /**
   * Middleware Express pour rate limiting
   */
  middleware(config?: Partial<RateLimitConfig>) {
    return (req: any, res: any, next: any) => {
      // Identifier par IP + User-Agent
      const identifier = this.getRequestIdentifier(req);

      if (!this.isAllowed(identifier, config)) {
        const stats = this.getStats(identifier);
        return res.status(429).json({
          success: false,
          error: "Too many requests",
          retryAfter: stats?.blockUntil ? Math.ceil((stats.blockUntil - Date.now()) / 1000) : 300,
        });
      }

      next();
    };
  }

  /**
   * Extrait un identifiant unique de la requête
   */
  private getRequestIdentifier(req: any): string {
    const ip =
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";

    return `${ip}:${userAgent}`;
  }
}

export const rateLimiter = new RateLimiterService();

/**
 * Hook React pour rate limiting côté client
 */
export function useRateLimit(identifier: string, config?: Partial<RateLimitConfig>) {
  return {
    isAllowed: () => rateLimiter.isAllowed(identifier, config),
    recordRequest: () => rateLimiter.recordRequest(identifier, config),
    getStats: () => rateLimiter.getStats(identifier),
    reset: () => rateLimiter.reset(identifier),
  };
}

/**
 * Decorator pour protéger les fonctions
 */
export function rateLimit(config?: Partial<RateLimitConfig>) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const method = descriptor.value!;

    descriptor.value = ((...args: unknown[]) => {
      const identifier = `${target?.constructor?.name || "unknown"}:${propertyName}`;

      if (!rateLimiter.isAllowed(identifier, config)) {
        logError(
          ErrorFactory.rateLimit(
            `Function ${propertyName} rate limited`,
            "Fonction temporairement limitée.",
          ),
          { component: "RateLimitDecorator", function: propertyName },
        );
        return Promise.resolve({ success: false, error: "Rate limit exceeded" });
      }

      return method.apply(target, args);
    }) as T;
  };
}
