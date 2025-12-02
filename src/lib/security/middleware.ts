/**
 * Security Middleware
 * Protection des endpoints Express avec rate limiting et logging RGPD
 */

import { Request, Response, NextFunction } from "express";
import { rateLimiter, RateLimiterService } from "./rate-limiter";
import { hashIP } from "./ip-hash";
import { logConsent } from "./consent-logger";
import { logError, ErrorFactory } from "../error-handling";

interface SecurityMiddlewareOptions {
  // Rate limiting
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
    blockDurationMs?: number;
  };
  // RGPD logging
  gdpr?: {
    logConsent?: boolean;
    hashIP?: boolean;
  };
  // Headers sécurité
  security?: {
    addHeaders?: boolean;
    cors?: boolean;
  };
}

/**
 * Middleware de sécurité complet
 */
export function securityMiddleware(options: SecurityMiddlewareOptions = {}) {
  const {
    rateLimit = {},
    gdpr = { logConsent: true, hashIP: true },
    security = { addHeaders: true, cors: true },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Rate limiting
      const identifier = getRequestIdentifier(req);
      if (!rateLimiter.isAllowed(identifier, rateLimit)) {
        const stats = rateLimiter.getStats(identifier);

        // Logger la tentative de blocage
        logError(
          ErrorFactory.rateLimit(
            `Security middleware blocked request from ${identifier}`,
            "Trop de requêtes. Veuillez patienter.",
          ),
          {
            component: "SecurityMiddleware",
            identifier,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            blockedUntil: stats?.blockUntil,
          },
        );

        return res.status(429).json({
          success: false,
          error: "Too many requests",
          retryAfter: stats?.blockUntil ? Math.ceil((stats.blockUntil - Date.now()) / 1000) : 300,
        });
      }

      // 2. Headers sécurité
      if (security.addHeaders) {
        addSecurityHeaders(res);
      }

      // 3. Logging RGPD
      if (gdpr.logConsent || gdpr.hashIP) {
        const ip = getClientIP(req);
        const hashedIP = gdpr.hashIP ? hashIP(ip) : undefined;

        if (gdpr.logConsent) {
          logConsent({
            action: "api_request",
            endpoint: req.path,
            method: req.method,
            ipHash: hashedIP,
            userAgent: req.headers["user-agent"],
            timestamp: new Date().toISOString(),
          });
        }
      }

      // 4. Continuer
      next();
    } catch (error) {
      logError(
        ErrorFactory.critical(
          "Security middleware error",
          "Erreur interne du middleware de sécurité.",
        ),
        {
          component: "SecurityMiddleware",
          error: error instanceof Error ? error.message : String(error),
        },
      );

      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}

/**
 * Middleware spécialisé pour les endpoints d'authentification
 */
export function authSecurityMiddleware() {
  return securityMiddleware({
    rateLimit: RateLimiterService.configs.auth,
    gdpr: { logConsent: true, hashIP: true },
    security: { addHeaders: true, cors: true },
  });
}

/**
 * Middleware spécialisé pour les endpoints publics
 */
export function publicSecurityMiddleware() {
  return securityMiddleware({
    rateLimit: RateLimiterService.configs.public,
    gdpr: { logConsent: false, hashIP: true },
    security: { addHeaders: true, cors: true },
  });
}

/**
 * Middleware spécialisé pour les endpoints AI/Gemini
 */
export function aiSecurityMiddleware() {
  return securityMiddleware({
    rateLimit: RateLimiterService.configs.ai,
    gdpr: { logConsent: true, hashIP: true },
    security: { addHeaders: true, cors: true },
  });
}

/**
 * Middleware spécialisé pour les endpoints admin
 */
export function adminSecurityMiddleware() {
  return securityMiddleware({
    rateLimit: RateLimiterService.configs.admin,
    gdpr: { logConsent: true, hashIP: true },
    security: { addHeaders: true, cors: true },
  });
}

/**
 * Ajoute les headers de sécurité
 */
function addSecurityHeaders(res: Response) {
  // Headers de sécurité généraux
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Headers CSP
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com;",
  );
}

/**
 * Extrait l'identifiant unique de la requête
 */
function getRequestIdentifier(req: Request): string {
  const ip = getClientIP(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  return `${ip}:${userAgent}`;
}

/**
 * Extrait l'IP réelle du client
 */
function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.headers["x-real-ip"]?.toString() ||
    "unknown"
  );
}

/**
 * Middleware pour logging des requêtes (monitoring)
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const ip = getClientIP(req);

      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${ip}`,
      );
    });

    next();
  };
}

/**
 * Middleware pour validation des origins (CORS)
 */
export function corsMiddleware(allowedOrigins: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (!origin) {
      return next();
    }

    // Vérifier si l'origin est autorisée
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.some((pattern) => new RegExp(pattern).test(origin))
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Gérer les requêtes preflight
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  };
}
