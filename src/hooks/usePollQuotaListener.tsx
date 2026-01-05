/**
 * Hook pour écouter les événements de quota dépassé et afficher un toast approprié
 */
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

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
        description: `Vous avez atteint la limite de ${pollTypeLabel} gratuits (5). Connectez-vous pour créer plus de sondages.`,
        variant: "destructive",
        action: (
          <ToastAction altText="Se connecter" onClick={() => onQuotaExceeded?.()}>
            Se connecter
          </ToastAction>
        ),
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pollQuotaExceeded", handlePollQuotaExceeded);
      return () => {
        window.removeEventListener("pollQuotaExceeded", handlePollQuotaExceeded);
      };
    }
  }, [toast, onQuotaExceeded]);
}
