/**
 * Hook pour écouter les événements de quota dépassé et afficher un toast approprié
 */
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface PollQuotaExceededDetail {
  pollType: string;
  message: string;
}

export function usePollQuotaListener(onQuotaExceeded?: () => void) {
  const { toast } = useToast();

  useEffect(() => {
    const handlePollQuotaExceeded = (event: Event) => {
      const customEvent = event as CustomEvent<PollQuotaExceededDetail>;
      const pollType = customEvent.detail.pollType;
      const pollTypeLabel =
        pollType === "date"
          ? "sondages de dates"
          : pollType === "form"
            ? "formulaires"
            : pollType === "availability"
              ? "sondages de disponibilités"
              : "sondages";

      toast({
        title: "Limite atteinte",
        description: `Vous avez atteint la limite de ${pollTypeLabel} gratuits (5). Connectez-vous pour en créer plus.`,
        variant: "destructive",
      });

      // Appeler le callback pour ouvrir le modal
      onQuotaExceeded?.();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pollQuotaExceeded", handlePollQuotaExceeded);
      return () => {
        window.removeEventListener("pollQuotaExceeded", handlePollQuotaExceeded);
      };
    }
  }, [toast, onQuotaExceeded]);
}
