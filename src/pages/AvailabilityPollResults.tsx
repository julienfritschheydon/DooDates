import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPollBySlugOrId, savePolls, getAllPolls, type Poll } from "@/lib/pollStorage";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Send,
  Loader2,
  Sparkles,
  Zap,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { optimizeSchedule, type ProposedSlot } from "@/services/schedulingOptimizer";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { useAuth } from "@/contexts/AuthContext";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" },
];

const AvailabilityPollResults = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [proposedSlots, setProposedSlots] = useState<
    Array<{ date: string; start: string; end: string; score?: number; reasons?: string[] }>
  >([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedSlots, setOptimizedSlots] = useState<ProposedSlot[]>([]);
  const { user } = useAuth();
  const calendarService = useMemo(() => (user ? new GoogleCalendarService() : undefined), [user]);

  // Fonction pour charger le poll
  const loadPoll = React.useCallback(() => {
    if (!slug) return;
    const foundPoll = getPollBySlugOrId(slug);
    setPoll(foundPoll);
    if (foundPoll?.proposedSlots) {
      setProposedSlots(foundPoll.proposedSlots);
      // Sélectionner tous les créneaux par défaut
      setSelectedSlots(new Set(foundPoll.proposedSlots.map((_, index) => index)));
    }
  }, [slug]);

  useEffect(() => {
    loadPoll();
    // Rafraîchir le poll toutes les 5 secondes pour voir les validations en temps réel
    const interval = setInterval(() => {
      loadPoll();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadPoll]);

  // Optimisation automatique si disponibilités parsées disponibles
  useEffect(() => {
    if (!poll || !calendarService) return;

    const parsedAvailabilities = poll.parsedAvailabilities;
    const hasParsedAvailabilities =
      !!parsedAvailabilities &&
      Array.isArray(parsedAvailabilities) &&
      parsedAvailabilities.length > 0;

    if (!hasParsedAvailabilities) return;

    const runOptimization = async () => {
      setIsOptimizing(true);
      try {
        // Passer directement les dates concrètes au service d'optimisation avec les règles du poll
        const rules = poll.schedulingRules || {};
        const optimized = await optimizeSchedule(parsedAvailabilities, rules, calendarService);
        setOptimizedSlots(optimized);

        // Si des créneaux optimisés sont trouvés et qu'aucun créneau n'est encore proposé, les proposer automatiquement
        if (optimized.length > 0 && proposedSlots.length === 0) {
          const autoProposed = optimized.slice(0, 3).map((slot) => ({
            date: slot.date,
            start: slot.start,
            end: slot.end,
            score: slot.score,
            reasons: slot.reasons,
          }));
          setProposedSlots(autoProposed);
          // Sélectionner tous les créneaux optimisés par défaut
          setSelectedSlots(new Set(autoProposed.map((_, index) => index)));
        }
      } catch (error) {
        logger.warn("Erreur lors de l'optimisation automatique", "poll", error);
      } finally {
        setIsOptimizing(false);
      }
    };

    runOptimization();
  }, [poll, calendarService, proposedSlots.length]);

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#1e1e1e] border-gray-700 max-w-md">
          <CardContent className="pt-6">
            <p className="text-white text-center">Sondage introuvable</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#1e1e1e] border-gray-700 max-w-md">
          <CardContent className="pt-6">
            <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-white text-center">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (poll.type !== "availability") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#1e1e1e] border-gray-700 max-w-md">
          <CardContent className="pt-6">
            <p className="text-white text-center">Ce n'est pas un sondage de disponibilités</p>
            <Button onClick={() => navigate("/")} className="mt-4 w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parsedAvailabilities = poll.parsedAvailabilities;
  const hasClientAvailabilities = !!poll.clientAvailabilities;
  const hasParsedAvailabilities =
    !!parsedAvailabilities &&
    Array.isArray(parsedAvailabilities) &&
    parsedAvailabilities.length > 0;

  const handleAddSlot = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    const dateStr = nextMonday.toISOString().split("T")[0];

    setProposedSlots([
      ...proposedSlots,
      {
        date: dateStr,
        start: "09:00",
        end: "10:00",
      },
    ]);
  };

  const handleSlotChange = (index: number, field: "date" | "start" | "end", value: string) => {
    const newSlots = [...proposedSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setProposedSlots(newSlots);
  };

  const handleRemoveSlot = (index: number) => {
    setProposedSlots(proposedSlots.filter((_, i) => i !== index));
  };

  const handleToggleSlotSelection = (index: number) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSlots(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSlots.size === proposedSlots.length) {
      setSelectedSlots(new Set());
    } else {
      setSelectedSlots(new Set(proposedSlots.map((_, index) => index)));
    }
  };

  const handleSaveProposedSlots = async () => {
    if (selectedSlots.size === 0) {
      toast({
        title: "Aucun créneau sélectionné",
        description: "Veuillez sélectionner au moins un créneau à proposer au client.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Sauvegarder uniquement les créneaux sélectionnés
      const slotsToSave = proposedSlots.filter((_, index) => selectedSlots.has(index));

      const allPolls = getAllPolls();
      const pollIndex = allPolls.findIndex((p) => p.id === poll.id);

      if (pollIndex !== -1) {
        allPolls[pollIndex] = {
          ...allPolls[pollIndex],
          proposedSlots: slotsToSave.length > 0 ? slotsToSave : undefined,
          updated_at: new Date().toISOString(),
        };
        savePolls(allPolls);
        setPoll(allPolls[pollIndex]);
        // Mettre à jour les créneaux proposés et la sélection
        setProposedSlots(slotsToSave);
        setSelectedSlots(new Set(slotsToSave.map((_, index) => index)));
      }

      toast({
        title: "Créneaux proposés sauvegardés",
        description: `${slotsToSave.length} créneau(x) proposé(s) au client. Le client peut maintenant les voir via le lien de vote.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les créneaux proposés.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Grouper les disponibilités parsées par date
  const availabilitiesByDate = hasParsedAvailabilities
    ? parsedAvailabilities.reduce(
        (
          acc: Record<string, Array<{ start: string; end: string }>>,
          avail: { date: string; timeRanges: Array<{ start: string; end: string }> },
        ) => {
          acc[avail.date] = avail.timeRanges;
          return acc;
        },
        {},
      )
    : {};

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Boutons actions */}
      <div className="fixed top-20 right-4 z-50 flex gap-2">
        <button
          onClick={loadPoll}
          className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
          title="Rafraîchir"
          aria-label="Rafraîchir"
        >
          <Loader2 className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
          title="Retour"
          aria-label="Retour"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="pt-20">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* En-tête */}
          <Card className="bg-[#1e1e1e] border-gray-700 mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">{poll.title}</CardTitle>
                  {poll.description && <p className="text-gray-400 mt-1">{poll.description}</p>}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Disponibilités client */}
          {hasClientAvailabilities && (
            <Card className="bg-[#1e1e1e] border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Disponibilités du client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Texte brut */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Texte original</Label>
                  <div className="p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg">
                    <p className="text-white">{poll.clientAvailabilities}</p>
                  </div>
                </div>

                {/* Disponibilités parsées */}
                {hasParsedAvailabilities ? (
                  <div>
                    <Label className="text-gray-300 mb-3 block flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Disponibilités analysées par IA
                    </Label>
                    <div className="space-y-3">
                      {Object.entries(availabilitiesByDate).map(
                        ([date, timeRanges]: [string, Array<{ start: string; end: string }>]) => (
                          <div
                            key={date}
                            className="p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg"
                          >
                            <div className="font-medium text-white mb-2">
                              {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </div>
                            <div className="space-y-2">
                              {timeRanges.map(
                                (timeRange: { start: string; end: string }, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-600/30 rounded"
                                  >
                                    <Clock className="w-4 h-4 text-green-400" />
                                    <span className="text-green-300 font-mono text-sm">
                                      {timeRange.start} - {timeRange.end}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription className="text-gray-300">
                      Les disponibilités n'ont pas encore été analysées par l'IA. Le texte brut est
                      disponible ci-dessus.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Créneau validé par le client */}
          {poll.validatedSlot && (
            <Card className="bg-[#1e1e1e] border-green-600/50 mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Créneau confirmé par le client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-600/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold">
                      {new Date(`${poll.validatedSlot.date}T00:00:00`).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-mono text-lg">
                      {poll.validatedSlot.start} - {poll.validatedSlot.end}
                    </span>
                  </div>
                  <Alert className="bg-blue-500/10 border-blue-600/30">
                    <AlertDescription className="text-blue-300 text-sm">
                      ✅ L'événement a été créé automatiquement dans votre calendrier Google
                      Calendar.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => {
                        const startDate = new Date(
                          `${poll.validatedSlot.date}T${poll.validatedSlot.start}:00`,
                        );
                        const endDate = new Date(
                          `${poll.validatedSlot.date}T${poll.validatedSlot.end}:00`,
                        );
                        // Ouvrir Google Calendar à la date du rendez-vous
                        const dateStr = startDate.toISOString().split("T")[0].replace(/-/g, "");
                        window.open(
                          `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dateStr}T${poll.validatedSlot.start.replace(":", "")}00Z/${dateStr}T${poll.validatedSlot.end.replace(":", "")}00Z&text=${encodeURIComponent(poll.title || "Rendez-vous")}`,
                          "_blank",
                        );
                      }}
                      variant="outline"
                      className="border-green-600 text-green-400 hover:bg-green-600/20"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ajouter à Google Calendar
                    </Button>
                    <Button
                      onClick={() => {
                        window.open("https://calendar.google.com/calendar/u/0/r", "_blank");
                      }}
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Ouvrir mon calendrier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Créneaux proposés */}
          <Card className="bg-[#1e1e1e] border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Créneaux proposés au client
                  {isOptimizing && <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-2" />}
                  {optimizedSlots.length > 0 && !isOptimizing && (
                    <div title="Optimisation automatique activée">
                      <Zap className="w-4 h-4 text-yellow-400 ml-2" />
                    </div>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {hasParsedAvailabilities && calendarService && (
                    <Button
                      onClick={async () => {
                        setIsOptimizing(true);
                        try {
                          // Passer directement les dates concrètes au service d'optimisation avec les règles du poll
                          const rules = poll.schedulingRules || {};
                          const optimized = await optimizeSchedule(
                            parsedAvailabilities,
                            rules,
                            calendarService,
                          );
                          setOptimizedSlots(optimized);
                          if (optimized.length > 0) {
                            const autoProposed = optimized.slice(0, 3).map((slot) => ({
                              date: slot.date,
                              start: slot.start,
                              end: slot.end,
                              score: slot.score,
                              reasons: slot.reasons,
                            }));
                            setProposedSlots(autoProposed);
                            // Sélectionner tous les créneaux optimisés par défaut
                            setSelectedSlots(new Set(autoProposed.map((_, index) => index)));
                            toast({
                              title: "Optimisation terminée",
                              description: `${optimized.length} créneau(x) optimal(x) trouvé(s).`,
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Erreur d'optimisation",
                            description:
                              "Impossible d'optimiser automatiquement. Vous pouvez proposer manuellement.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsOptimizing(false);
                        }
                      }}
                      disabled={isOptimizing}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Optimisation...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Optimiser automatiquement
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handleAddSlot}
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-400 hover:bg-green-600/20"
                  >
                    + Ajouter un créneau
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposedSlots.length === 0 ? (
                <Alert>
                  <AlertDescription className="text-gray-300">
                    Aucun créneau proposé pour le moment. Cliquez sur "Ajouter un créneau" pour
                    commencer.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Sélection multiple */}
                  {proposedSlots.length > 1 && (
                    <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedSlots.size === proposedSlots.length}
                          onCheckedChange={handleSelectAll}
                          id="select-all"
                        />
                        <Label htmlFor="select-all" className="text-gray-300 cursor-pointer">
                          Tout sélectionner ({selectedSlots.size}/{proposedSlots.length})
                        </Label>
                      </div>
                      <span className="text-sm text-gray-400">
                        {selectedSlots.size} créneau{selectedSlots.size > 1 ? "x" : ""} sélectionné
                        {selectedSlots.size > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {proposedSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedSlots.has(index)
                          ? "bg-[#0a0a0a] border-green-600/50"
                          : "bg-[#0a0a0a] border-gray-700 opacity-60"
                      }`}
                    >
                      {/* Checkbox de sélection */}
                      <div className="flex items-start gap-3 mb-4">
                        <Checkbox
                          checked={selectedSlots.has(index)}
                          onCheckedChange={() => handleToggleSlotSelection(index)}
                          id={`slot-${index}`}
                          className="mt-1"
                        />
                        <Label htmlFor={`slot-${index}`} className="flex-1 cursor-pointer">
                          <span className="text-white font-medium">Créneau {index + 1}</span>
                        </Label>
                      </div>
                      {/* Affichage score et raisons si disponibles */}
                      {(slot.score !== undefined || slot.reasons) && (
                        <div className="mb-4 pb-4 border-b border-gray-700">
                          {slot.score !== undefined && (
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-300 text-sm font-medium">
                                Score d'optimisation : {slot.score}%
                              </span>
                            </div>
                          )}
                          {slot.reasons && slot.reasons.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                Raisons de la recommandation :
                              </p>
                              <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                {slot.reasons.map((reason: string, idx: number) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Date</Label>
                          <Input
                            type="date"
                            value={slot.date}
                            onChange={(e) => handleSlotChange(index, "date", e.target.value)}
                            className="bg-[#1e1e1e] border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 mb-2 block">Heure de début</Label>
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleSlotChange(index, "start", e.target.value)}
                            className="bg-[#1e1e1e] border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 mb-2 block">Heure de fin</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleSlotChange(index, "end", e.target.value)}
                              className="bg-[#1e1e1e] border-gray-700 text-white flex-1"
                            />
                            <Button
                              onClick={() => handleRemoveSlot(index)}
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/20"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handleSaveProposedSlots}
                    disabled={isSaving || selectedSlots.size === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Sauvegarder {selectedSlots.size > 0 ? `${selectedSlots.size} ` : ""}créneau
                        {selectedSlots.size > 1 ? "x" : ""} sélectionné
                        {selectedSlots.size > 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                  {selectedSlots.size === 0 && proposedSlots.length > 0 && (
                    <p className="text-sm text-yellow-400 text-center mt-2">
                      ⚠️ Veuillez sélectionner au moins un créneau à proposer au client
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Note Version actuelle */}
          <Alert className="mt-6">
            <AlertDescription className="text-sm text-green-300">
              ✅ <strong>Optimisation automatique active</strong> : Si votre calendrier Google
              Calendar est connecté, le système propose automatiquement les créneaux optimaux.
              Sinon, vous pouvez proposer manuellement les créneaux.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPollResults;
