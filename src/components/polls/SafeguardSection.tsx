import React, { useState } from "react";
import { Mail, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guestEmailService } from "@/lib/guestEmailService";
import { useToast } from "@/hooks/use-toast";

export function SafeguardSection() {
  const [email, setEmail] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

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
    setIsSaved(true);
    toast({
      title: "C'est noté !",
      description: "Votre email a été enregistré pour la gestion du sondage.",
    });
  };

  if (isSaved) {
    return (
      <div className="bg-green-900/10 border border-green-900/30 rounded-lg p-4 flex items-center gap-3">
        <Check className="w-5 h-5 text-green-500" />
        <div>
          <p className="text-sm font-medium text-green-500">Email enregistré</p>
          <p className="text-xs text-gray-400">Vous recevrez le lien de gestion par email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-amber-950/10 border border-amber-900/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-amber-500">Ne perdez pas l'accès !</h4>
          <p className="text-xs text-amber-200/70">
            En tant qu'invité, vous risquez de perdre l'accès admin. Ajoutez votre email pour
            recevoir un lien de gestion sécurisé.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 bg-[#0a0a0a] border-gray-700 h-9 text-sm text-white"
            data-testid="guest-email-input"
          />
        </div>
        <Button
          size="sm"
          onClick={handleSaveEmail}
          className="bg-amber-600 hover:bg-amber-700 text-white h-9"
          data-testid="safeguardsection-sauvegarder"
        >
          Sauvegarder
        </Button>
      </div>
      <p className="text-[10px] text-gray-500 ml-1">
        Utilisé uniquement pour l'administration et les alertes de suppression (RGPD).
      </p>
    </div>
  );
}
