/**
 * Utilitaires pour le débogage mobile
 * Fournit des fonctions pour détecter et diagnostiquer les problèmes de gestes tactiles
 */

interface TouchEventLog {
  type: string;
  timestamp: number;
  position: { x: number; y: number };
  target: {
    id: string;
    tagName: string;
    className: string;
  };
}

class MobileDebugger {
  private eventLog: TouchEventLog[] = [];
  private isInitialized = false;
  private readonly LONG_PRESS_DURATION = 500; // ms

  /**
   * Initialise le débogueur mobile
   * @param options Options de configuration
   */
  public init(options: { logToConsole?: boolean } = {}): void {
    if (this.isInitialized) return;

    const { logToConsole = true } = options;

    // Fonction pour logger les événements
    const log = (message: string, data?: unknown) => {
      if (logToConsole) {
        console.log(`[MobileDebug] ${message}`, data || "");
      }
      // Ici, vous pourriez ajouter un envoi à un serveur de logs
    };

    // Fonction pour enregistrer un événement tactile
    const logTouchEvent = (event: TouchEvent) => {
      if (!event.touches || event.touches.length === 0) return;

      const target = event.target as HTMLElement;
      const touch = event.touches[0];

      const eventData: TouchEventLog = {
        type: event.type,
        timestamp: Date.now(),
        position: { x: touch.clientX, y: touch.clientY },
        target: {
          id: target.id || "",
          tagName: target.tagName,
          className: target.className || "",
        },
      };

      this.eventLog.push(eventData);
      log(`Événement tactile: ${event.type}`, eventData);

      // Détection de conflits en temps réel
      this.detectConflicts();
    };

    // Ajouter les écouteurs d'événements
    const eventTypes: (keyof WindowEventMap)[] = [
      "touchstart",
      "touchmove",
      "touchend",
      "touchcancel",
    ];
    eventTypes.forEach((type) => {
      window.addEventListener(type, logTouchEvent as EventListener, { passive: true });
    });

    // Exposer l'API de débogage dans la console
    (window as any).__mobileDebug = {
      getEventLog: () => [...this.eventLog],
      clearLog: () => {
        this.eventLog = [];
      },
      detectConflicts: () => this.detectConflicts(),
    };

    log("Débogueur mobile initialisé");
    this.isInitialized = true;
  }

  /**
   * Détecte les conflits potentiels entre les gestes
   */
  private detectConflicts(): void {
    const recentEvents = this.eventLog.slice(-10); // Analyser les 10 derniers événements

    // Détecter les long-press suivis de mouvements (conflit potentiel)
    for (let i = 0; i < recentEvents.length - 1; i++) {
      const startEvent = recentEvents[i];

      if (startEvent.type !== "touchstart") continue;

      // Trouver les événements suivants liés à ce touchstart
      const relatedEvents = recentEvents.slice(i + 1).filter((e) => e.target === startEvent.target);

      for (const event of relatedEvents) {
        const duration = event.timestamp - startEvent.timestamp;

        if (event.type === "touchmove" && duration > this.LONG_PRESS_DURATION) {
          console.warn(
            `[MobileDebug] Conflit détecté: long-press (${duration}ms) suivi d'un mouvement`,
            {
              startEvent,
              moveEvent: event,
              duration,
            },
          );
        }
      }
    }
  }

  /**
   * Simule un geste tactile pour les tests
   */
  public async simulateLongPress(
    element: HTMLElement,
    duration: number = this.LONG_PRESS_DURATION * 1.5,
  ): Promise<void> {
    const startTime = Date.now();
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Créer un événement touchstart
    const touchStart = new TouchEvent("touchstart", {
      touches: [
        {
          identifier: Date.now(),
          target: element,
          clientX: startX,
          clientY: startY,
          pageX: startX,
          pageY: startY,
          screenX: startX,
          screenY: startY,
          radiusX: 5,
          radiusY: 5,
          rotationAngle: 0,
          force: 1,
        } as any,
      ],
      bubbles: true,
      cancelable: true,
    });

    // Déclencher l'événement
    element.dispatchEvent(touchStart);

    // Attendre la durée du long-press
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Créer un événement touchend
    const touchEnd = new TouchEvent("touchend", {
      changedTouches: [
        {
          identifier: Date.now(),
          target: element,
          clientX: startX,
          clientY: startY,
          pageX: startX,
          pageY: startY,
          screenX: startX,
          screenY: startY,
          radiusX: 5,
          radiusY: 5,
          rotationAngle: 0,
          force: 0,
        } as any,
      ],
      bubbles: true,
      cancelable: true,
    });

    // Déclencher l'événement
    element.dispatchEvent(touchEnd);

    console.log(`[MobileDebug] Simulation de long-press de ${duration}ms terminée`);
  }
}

// Exporter une instance unique
export const mobileDebug = new MobileDebugger();

// Initialisation automatique en mode développement
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    mobileDebug.init({ logToConsole: true });
  }
}
