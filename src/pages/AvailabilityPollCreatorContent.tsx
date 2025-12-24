import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ExternalLink, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllPolls,
  savePolls,
  type Poll as StoragePoll,
  getCurrentUserId,
} from "@/lib/pollStorage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  SchedulingRulesForm,
  type SchedulingRules,
} from "@/components/availability/SchedulingRulesForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PollSettingsForm } from "@/components/polls/PollSettingsForm";
import type { AvailabilityPollSettings } from "@/lib/products/availability-polls/availability-polls-service";
import { Settings as SettingsIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";


interface AvailabilityPollCreatorContentProps {
  onBack?: (createdPoll?: StoragePoll) => void;
  initialData?: {
    title?: string;
    description?: string;
  };
  onCreate?: (poll: StoragePoll) => void;
}

export const AvailabilityPollCreatorContent: React.FC<AvailabilityPollCreatorContentProps> = ({
  onBack,
  initialData,
  onCreate,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [schedulingRules, setSchedulingRules] = useState<SchedulingRules>({
    minLatencyMinutes: 15,
    maxLatencyMinutes: 30,
    preferNearTerm: true,
    preferHalfDays: false,
    slotDurationMinutes: 60,
  });
  const [advancedSettings, setAdvancedSettings] = useState<AvailabilityPollSettings>({
    showLogo: true,
    requireAuth: false,
    oneResponsePerPerson: false,
    allowEditAfterSubmit: true,
    maxResponses: undefined,
    resultsVisibility: 'public',
  });
  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<StoragePoll | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleCreate = (asDraft = false) => {
    if (!title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez entrer un titre pour votre sondage disponibilités.",
        variant: "destructive",
      });
      return;
    }

    const all = getAllPolls();
    const now = new Date().toISOString();
    const random = Math.random().toString(36).slice(2);
    const slug =
      title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") + `-${Date.now().toString(36)}-${random}`;

    const newPoll: StoragePoll = {
      id: `availability-${Date.now()}-${random}`,
      creator_id: getCurrentUserId(user?.id),
      title: title.trim(),
      description: description.trim() || undefined,
      slug,
      created_at: now,
      updated_at: now,
      status: asDraft ? "draft" : "active",
      type: "availability",
      dates: [],
      settings: {
        ...advancedSettings,
        // Règles intelligentes d'optimisation
        minLatencyMinutes: schedulingRules.minLatencyMinutes,
        maxLatencyMinutes: schedulingRules.maxLatencyMinutes,
        preferNearTerm: schedulingRules.preferNearTerm,
        preferHalfDays: schedulingRules.preferHalfDays,
        slotDurationMinutes: schedulingRules.slotDurationMinutes,
      },
      // Champs spécifiques aux sondages disponibilités
      clientAvailabilities: undefined,
      parsedAvailabilities: undefined,
      proposedSlots: undefined,
      // Règles intelligentes d'optimisation (legacy, gardé pour compatibilité)
      schedulingRules: Object.keys(schedulingRules).length > 0 ? schedulingRules : undefined,
    };

    all.push(newPoll);
    savePolls(all);

    if (onCreate) {
      onCreate(newPoll);
    }

    if (asDraft) {
      toast({
        title: "Brouillon enregistré !",
        description: "Votre sondage disponibilités a été sauvegardé comme brouillon.",
      });
      // Ne pas afficher l'écran de succès pour un brouillon
      if (onBack) {
        onBack(newPoll);
      }
      return;
    }

    setPublishedPoll(newPoll);
    setPublished(true);

    toast({
      title: "Sondage créé !",
      description: "Votre sondage disponibilités est maintenant actif.",
    });

    // Si onBack est fourni, on l'appelle avec le poll créé (pour l'intégration workspace)
    if (onBack) {
      onBack(newPoll);
    }
  };

  // Écran de succès après publication
  if (published && publishedPoll) {
    const pollUrl = `${window.location.origin}/poll/${publishedPoll.slug || publishedPoll.id}`;

    return (
      <div className="min-h-screen bg-gray-900 pb-8">
        <div className="pt-20">
          {/* Si utilisé dans le workspace, on n'a pas besoin de padding top aussi grand ni de max-w aussi petit */}
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <Card className="bg-gray-800 border-gray-700 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">
                      Sondage Disponibilités créé !
                    </CardTitle>
                    <p className="text-gray-300 mt-1">
                      Partagez le lien avec vos clients pour qu'ils indiquent leurs disponibilités.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations du sondage */}
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h3 className="text-white font-semibold mb-2">
                    {publishedPoll.title}
                  </h3>
                  {publishedPoll.description && (
                    <p className="text-gray-300 text-sm">
                      {publishedPoll.description}
                    </p>
                  )}
                </div>

                {/* Lien de partage */}
                <TooltipProvider>
                  <div>
                    <Label htmlFor="share-link" className="text-gray-300 mb-2 block">
                      Lien de partage :
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="share-link"
                        value={pollUrl}
                        readOnly
                        className="bg-gray-700 border-gray-600 text-gray-300 font-mono text-sm"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(pollUrl);
                              toast({
                                title: "Lien copié !",
                                description: "Le lien a été copié dans le presse-papiers.",
                              });
                            }}
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Copier
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copier le lien dans le presse-papiers</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TooltipProvider>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-600">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aller au Tableau de bord
                  </Button>
                  <Button
                    onClick={() => navigate(`/poll/${publishedPoll.slug || publishedPoll.id}`)}
                    size="lg"
                    variant="outline"
                    className="border-green-800 text-green-400 hover:bg-green-900/20"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir le sondage
                  </Button>
                  <Button
                    onClick={() => {
                      setPublished(false);
                      setPublishedPoll(null);
                      setTitle("");
                      setDescription("");
                      if (onBack) onBack(undefined);
                    }}
                    size="sm"
                    variant="outline"
                    className="border-green-800 text-green-400 hover:bg-green-900/20"
                  >
                    Créer un autre sondage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de création
  return (
    <div className="pb-8">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-500" />
                  Créer un Sondage Disponibilités
                </CardTitle>
                <p className="text-gray-300 mt-1">
                  Vos clients indiquent leurs disponibilités, vous proposez les créneaux optimaux.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Titre */}
            <div>
              <Label htmlFor="title" className="text-gray-300 mb-2 block">
                Titre du sondage *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Planification rendez-vous - Novembre 2025"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-gray-300 mb-2 block">
                Description (optionnel)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Indiquez vos disponibilités pour planifier notre prochain rendez-vous..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
            </div>

            {/* Règles intelligentes d'optimisation */}
            <SchedulingRulesForm rules={schedulingRules} onChange={setSchedulingRules} />

            {/* Paramètres avancés - Collapsible */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-green-500/50 outline-none"
                >
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-gray-300" />
                    <h3 className="text-lg font-semibold text-white">Paramètres avancés</h3>
                  </div>
                  {isAdvancedOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-300" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  )}
                </motion.button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2">
                <div className="border border-gray-700 rounded-lg p-4">
                  <PollSettingsForm
                    settings={advancedSettings}
                    onSettingsChange={(newSettings) => setAdvancedSettings(newSettings as AvailabilityPollSettings)}
                    pollType="date"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-600">
              <Button
                onClick={() => handleCreate(false)}
                disabled={!title.trim()}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Créer le sondage
              </Button>
              <Button
                onClick={() => handleCreate(true)}
                disabled={!title.trim()}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Enregistrer le brouillon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
