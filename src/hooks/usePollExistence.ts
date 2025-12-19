import { useState, useEffect } from "react";
import { getPollBySlugOrId } from "@/lib/pollStorage";
import type { Poll } from "@/types/poll";

/**
 * Hook pour vérifier si un sondage existe encore
 * Retourne l'état d'existence et les données du sondage si disponible
 */
export function usePollExistence(pollId: string | undefined): {
    exists: boolean | null; // null = loading
    poll: Poll | null;
} {
    const [exists, setExists] = useState<boolean | null>(null);
    const [poll, setPoll] = useState<Poll | null>(null);

    useEffect(() => {
        if (!pollId) {
            setExists(null);
            setPoll(null);
            return;
        }

        // Vérifier si le sondage existe (fonction synchrone)
        try {
            const p = getPollBySlugOrId(pollId);
            setExists(!!p);
            setPoll(p);
        } catch (error) {
            setExists(false);
            setPoll(null);
        }
    }, [pollId]);

    return { exists, poll };
}
