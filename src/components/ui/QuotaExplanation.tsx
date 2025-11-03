/**
 * Composant d'explication des quotas DooDates
 * 
 * Affiche de manière claire et visuelle :
 * - Les limites actuelles de l'utilisateur
 * - Ce qui compte dans les quotas
 * - Comment augmenter les limites
 */

import { Info, Zap, Users, MessageSquare, BarChart3, HardDrive } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllQuotas } from "@/constants/quotas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuotaExplanationProps {
  /** Afficher comme bouton info ou trigger custom */
  trigger?: React.ReactNode;
  /** Titre custom */
  title?: string;
}

export function QuotaExplanation({ trigger, title = "Comprendre les quotas" }: QuotaExplanationProps) {
  const { user } = useAuth();
  const quotas = getAllQuotas(!!user);
  const isGuest = !user;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Info className="w-4 h-4" />
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-6 h-6 text-yellow-500" />
            Comment fonctionnent les quotas ?
          </DialogTitle>
          <DialogDescription>
            Tout ce qu'il faut savoir sur vos limites et comment les augmenter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Statut actuel */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isGuest
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className={`w-5 h-5 ${isGuest ? "text-orange-600" : "text-green-600"}`} />
              <h3 className="font-semibold">
                {isGuest ? "Mode Invité (Gratuit)" : "Mode Connecté"}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isGuest
                ? "Vous utilisez DooDates sans compte. Vos données sont stockées localement sur votre appareil."
                : "Vous êtes connecté ! Profitez de limites généreuses et d'une synchronisation cloud (bientôt)."}
            </p>
          </div>

          {/* Quotas principaux */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vos limites actuelles
            </h3>

            <div className="grid gap-3">
              {/* Conversations IA */}
              <QuotaItem
                icon={<MessageSquare className="w-4 h-4" />}
                label="Conversations IA"
                value={quotas.conversations}
                description="Nombre de sondages que vous pouvez créer avec l'IA"
                highlight={isGuest}
              />

              {/* Messages IA */}
              <QuotaItem
                icon={<Zap className="w-4 h-4" />}
                label="Messages IA par conversation"
                value={quotas.aiMessages}
                description={`Messages maximum dans une conversation${!isGuest ? " (par mois)" : ""}`}
              />

              {/* Analytics */}
              <QuotaItem
                icon={<BarChart3 className="w-4 h-4" />}
                label="Requêtes Analytics IA"
                value={quotas.analytics}
                description="Analyses conversationnelles par jour"
              />

              {/* Stockage */}
              <QuotaItem
                icon={<HardDrive className="w-4 h-4" />}
                label="Stockage"
                value={`${quotas.storage} MB`}
                description="Espace de stockage local (approximatif)"
              />
            </div>
          </div>

          {/* Ce qui compte */}
          <div className="space-y-3">
            <h3 className="font-semibold">💡 Ce qui compte dans vos quotas</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>
                  <strong>Nouvelle conversation IA</strong> : Compté quand vous créez un nouveau sondage
                  via l'IA
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>
                  <strong>Messages IA</strong> : Chaque message envoyé à l'IA (créations et
                  modifications)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>
                  <strong>Analytics conversationnels</strong> : Questions posées à l'IA sur vos résultats
                </span>
              </li>
            </ul>
          </div>

          {/* Ce qui ne compte PAS */}
          <div className="space-y-3">
            <h3 className="font-semibold">🎉 Ce qui ne compte PAS</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>
                  <strong>Création manuelle</strong> : Sondages créés sans l'IA (bouton "Créer sans IA")
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>
                  <strong>Modifications manuelles</strong> : Éditions directes dans l'éditeur
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>
                  <strong>Votes & partages</strong> : Les participants ne consomment pas de quota
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>
                  <strong>Insights automatiques</strong> : Les analyses auto-générées sont gratuites
                </span>
              </li>
            </ul>
          </div>

          {/* CTA pour upgrade */}
          {isGuest && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Créez un compte gratuit
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <li>✨ <strong>1000 conversations</strong> au lieu de {quotas.conversations}</li>
                <li>✨ <strong>100 messages IA/mois</strong> au lieu de {quotas.aiMessages}</li>
                <li>✨ <strong>50 analyses/jour</strong> au lieu de {quotas.analytics}</li>
                <li>✨ <strong>Synchronisation cloud</strong> (bientôt disponible)</li>
                <li>✨ <strong>Conservation 1 an</strong> au lieu de {quotas.retentionDays} jours</li>
                <li>✨ <strong>Données sauvegardées</strong> même si vous videz le cache</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Créer un compte gratuit
              </Button>
            </div>
          )}

          {/* Reset */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t">
            <p>
              <strong>Réinitialisation :</strong>{" "}
              {isGuest
                ? "Les quotas anonymes ne se réinitialisent pas. Créez un compte pour des limites mensuelles."
                : "Vos quotas se réinitialisent automatiquement chaque mois."}
            </p>
            <p className="mt-1">
              <strong>Rétention :</strong> Vos données sont conservées pendant {quotas.retentionDays}{" "}
              jours.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant pour afficher un item de quota
interface QuotaItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  highlight?: boolean;
}

function QuotaItem({ icon, label, value, description, highlight }: QuotaItemProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${
        highlight
          ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
          : "bg-gray-50 dark:bg-gray-800"
      }`}
    >
      <div className="mt-0.5 text-gray-600 dark:text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">{label}</span>
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{value}</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

