import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { BetaKeyService } from "@/services/BetaKeyService";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2 } from "lucide-react";

interface BetaKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BetaKeyModal({ open, onOpenChange }: BetaKeyModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour activer une clé bêta",
        variant: "destructive",
      });
      return;
    }

    if (!code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un code de clé bêta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await BetaKeyService.redeemKey(user.id, code, session?.access_token);

      if (result.success) {
        toast({
          title: "Clé bêta activée !",
          description: `Vous avez maintenant accès au plan bêta avec ${result.credits} crédits mensuels.`,
        });
        setCode("");
        onOpenChange(false);
        // Recharger la page pour mettre à jour les quotas
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'activer la clé bêta",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCode = (value: string) => {
    // Normaliser : enlever espaces, mettre en majuscules
    const normalized = value.replace(/\s/g, "").toUpperCase();
    // Formater : BETA-XXXX-XXXX-XXXX
    if (normalized.startsWith("BETA-")) {
      return normalized;
    }
    if (normalized.length > 0 && !normalized.startsWith("BETA-")) {
      return `BETA-${normalized}`;
    }
    return normalized;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Activer une clé bêta
          </DialogTitle>
          <DialogDescription>
            Entrez votre code de clé bêta pour accéder aux fonctionnalités avancées.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Format : BETA-XXXX-XXXX-XXXX
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="beta-key">Code de clé bêta</Label>
            <Input
              id="beta-key"
              type="text"
              placeholder="BETA-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(formatCode(e.target.value))}
              maxLength={20}
              disabled={isSubmitting}
              className="font-mono uppercase"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-testid="betakeymodal-annuler"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              data-testid="betakeymodal-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activation...
                </>
              ) : (
                "Activer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
