import { supabaseInsert, supabaseSelectMaybeSingle } from "./supabaseApi";
import { getCachedFingerprint } from "./browserFingerprint";
import { logger } from "./logger";

export interface GuestEmailData {
    guestId: string;
    email: string;
    verified?: boolean;
}

const GUEST_EMAILS_TABLE = "guest_emails";

/**
 * Service pour gérer les emails des utilisateurs invités (RGPD)
 */
export const guestEmailService = {
    /**
     * Enregistre ou met à jour l'email d'un invité
     */
    async saveGuestEmail(email: string): Promise<boolean> {
        try {
            const guestId = await getCachedFingerprint();

            const { data, error } = await supabaseInsert(GUEST_EMAILS_TABLE, {
                guest_id: guestId,
                email: email,
            }, { requireAuth: false });

            if (error) {
                logger.error("Failed to save guest email", "quota", error);
                return false;
            }

            logger.info("Guest email saved successfully", "quota", { guestId: guestId.substring(0, 8) });
            return true;
        } catch (error) {
            logger.error("Error in saveGuestEmail", "quota", error);
            return false;
        }
    },

    /**
     * Récupère l'email enregistré pour l'invité actuel
     */
    async getGuestEmail(): Promise<string | null> {
        try {
            const guestId = await getCachedFingerprint();

            const data = await supabaseSelectMaybeSingle<{ email: string }>(GUEST_EMAILS_TABLE, {
                guest_id: `eq.${guestId}`,
                select: "email",
            }, { requireAuth: false });

            return data?.email ?? null;
        } catch (error) {
            logger.error("Error in getGuestEmail", "quota", error);
            return null;
        }
    }
};
