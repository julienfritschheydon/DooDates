import React, { useState } from "react";
import { Copy, Check, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestEmailService } from "@/lib/guestEmailService";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-handling";
import { SafeguardSection } from "./SafeguardSection";

interface GuestPollSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pollUrl: string;
  pollTitle: string;
}

export function GuestPollSuccessDialog({
  isOpen,
  onClose,
  pollUrl,
  pollTitle,
}: GuestPollSuccessDialogProps) {
  const [email, setEmail] = useState("");
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setIsCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien du sondage a été copié dans le presse-papiers.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      logError(err, { component: "GuestPollSuccessDialog", operation: "copyToClipboard" });
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEmail = () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    guestEmailService.saveGuestEmail(email);
    setIsEmailSaved(true);
    toast({
      title: "C'est noté !",
      description: "Votre email a été enregistré pour la gestion du sondage.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-gray-800 text-white">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">Sondage créé avec succès !</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            "{pollTitle}" est maintenant en ligne.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section Partage */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Lien de partage</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 truncate font-mono">
                {pollUrl}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="border-gray-700 hover:bg-gray-800 hover:text-white"
                data-testid="guestpollsuccessdialog-button"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Partagez ce lien avec les participants pour qu'ils puissent voter.
            </p>
          </div>

          <div className="border-t border-gray-800 my-4" />

          {/* Section Safeguard */}
          <SafeguardSection />
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            data-testid="guest-success-close-button"
          >
            Fermer et aller au sondage <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
