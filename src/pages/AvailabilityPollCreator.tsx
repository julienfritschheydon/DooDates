import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ExternalLink, X, Calendar } from "lucide-react";
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
import { CreatePageLayout } from "@/components/layout/CreatePageLayout";

const AvailabilityPollCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedulingRules, setSchedulingRules] = useState<SchedulingRules>({
    minLatencyMinutes: 15,
    maxLatencyMinutes: 30,
    preferNearTerm: true,
    preferHalfDays: false,
    slotDurationMinutes: 60,
  });
  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<StoragePoll | null>(null);

  const handleCreate = () => {
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
      status: "active",
      type: "availability",
      dates: [],
      // Champs spécifiques aux sondages disponibilités
      clientAvailabilities: undefined,
      parsedAvailabilities: undefined,
      proposedSlots: undefined,
      // Règles intelligentes d'optimisation
      schedulingRules: Object.keys(schedulingRules).length > 0 ? schedulingRules : undefined,
    };

    all.push(newPoll);
    savePolls(all);

    setPublishedPoll(newPoll);
    setPublished(true);

    toast({
      title: "Sondage créé !",
      description: "Votre sondage disponibilités est maintenant actif.",
    });
  };

  // Écran de succès après publication
  if (published && publishedPoll) {
    const pollUrl = `${window.location.origin}/poll/${publishedPoll.slug || publishedPoll.id}`;

    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-8">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <Card className="bg-[#1e1e1e] border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">
                      Sondage Disponibilités créé !
                    </CardTitle>
                    <p className="text-gray-400 mt-1">
                      Partagez le lien avec vos clients pour qu'ils indiquent leurs disponibilités.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations du sondage */}
                <div className="p-4 bg-[#2a2a2a] rounded-lg border border-gray-700">
                  <h3 className="text-white font-semibold mb-2">{publishedPoll.title}</h3>
                  {publishedPoll.description && (
                    <p className="text-gray-400 text-sm">{publishedPoll.description}</p>
                  )}
                </div>

                {/* Lien de partage */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Lien de partage :</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={pollUrl}
                      readOnly
                      className="bg-[#2a2a2a] border-gray-700 text-gray-300 font-mono text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(pollUrl);
                        toast({
                          title: "Lien copié !",
                          description: "Le lien a été copié dans le presse-papiers.",
                        });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aller au Tableau de bord
                  </Button>
                  <Button
                    onClick={() => navigate(`/poll/${publishedPoll.slug || publishedPoll.id}`)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                    }}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Créer un autre sondage
                  </Button>
                </div>

                {/* Note Version actuelle */}
                <div className="p-4 bg-green-500/10 border border-green-600/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-400 mb-1">Version v1.0 - Optimisation automatique activée</p>
                      <p className="text-sm text-green-300">
                        Vos clients indiquent leurs disponibilités en texte libre. Le système propose automatiquement les créneaux optimaux depuis votre calendrier Google Calendar, selon les règles configurées.
                      </p>
                    </div>
                  </div>
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
    <CreatePageLayout>
      <div className="pb-8">
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <Card className="bg-[#1e1e1e] border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-green-500" />
                      Créer un Sondage Disponibilités
                    </CardTitle>
                    <p className="text-gray-400 mt-1">
                      Vos clients indiquent leurs disponibilités, vous proposez les créneaux
                      optimaux.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/create")}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
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
                  className="bg-[#2a2a2a] border-gray-700 text-white"
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
                  className="bg-[#2a2a2a] border-gray-700 text-white min-h-[100px]"
                />
              </div>

              {/* Règles intelligentes d'optimisation */}
              <SchedulingRulesForm rules={schedulingRules} onChange={setSchedulingRules} />

              {/* Informations Version actuelle */}
              <div className="p-4 bg-green-500/10 border border-green-600/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">Version v1.0 - Optimisation automatique activée</p>
                    <p className="text-sm text-green-300">
                      Vos clients indiquent leurs disponibilités en texte libre.{" "}
                      <strong>L'optimisation automatique avec intégration calendrier</strong> est maintenant active et utilise les règles configurées ci-dessus pour proposer les créneaux optimaux.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                <Button
                  onClick={handleCreate}
                  disabled={!title.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Créer le sondage
                </Button>
                <Button
                  onClick={() => navigate("/create")}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatePageLayout>
  );
};

export default AvailabilityPollCreator;
