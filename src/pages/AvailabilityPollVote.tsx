import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPollBySlugOrId, savePolls, getAllPolls } from "@/lib/pollStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  Send,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
  Download,
  ExternalLink,
  Lock,
} from "lucide-react";
import { getPollClosureReason } from "@/lib/pollEnforcement";
import { useToast } from "@/hooks/use-toast";
import { parseAvailabilitiesWithAI, parseAvailabilitiesSimple } from "@/lib/availability-parser";
import { getTodayLocal, formatDateLocal } from "@/lib/date-utils";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import {
  createTemporaryReservation,
  releaseTemporaryReservation,
  isSlotReserved,
  cleanupExpiredReservations,
} from "@/services/temporaryReservation";
import {
  generateICS,
  downloadICS,
  generateGoogleCalendarLink,
  generateOutlookCalendarLink,
} from "@/lib/calendar-ics";

// Convertir disponibilités parsées (jours de la semaine) en dates concrètes
function convertAvailabilitiesToDates(
  availabilities: Array<{ day: string; timeRange: { start: string; end: string } }>,
): Array<{ date: string; timeRanges: Array<{ start: string; end: string }> }> {
  const todayStr = getTodayLocal();
  const todayDate = new Date(todayStr);
  const result: Array<{ date: string; timeRanges: Array<{ start: string; end: string }> }> = [];
  const dayMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  // Grouper par jour de la semaine
  const byDay: Record<string, Array<{ start: string; end: string }>> = {};
  availabilities.forEach((avail) => {
    if (!byDay[avail.day]) {
      byDay[avail.day] = [];
    }
    byDay[avail.day].push(avail.timeRange);
  });

  // Pour chaque jour de la semaine, trouver les dates correspondantes dans les prochaines 4 semaines
  Object.entries(byDay).forEach(([dayName, timeRanges]) => {
    const targetDay = dayMap[dayName];
    if (targetDay === undefined) return;

    for (let week = 0; week < 4; week++) {
      const date = new Date(todayDate);
      const currentDay = date.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysUntilTarget + week * 7);

      // Éviter les dates passées
      if (date < todayDate) continue;

      const dateStr = formatDateLocal(date);
      result.push({
        date: dateStr,
        timeRanges,
      });
    }
  });

  return result;
}

const AvailabilityPollVote = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [availabilityText, setAvailabilityText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [pollState, setPollState] = useState<import("../lib/pollStorage").Poll | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedSlot, setValidatedSlot] = useState<string | null>(null);
  const { user } = useAuth();
  const [closureReason, setClosureReason] = useState<
    "expired" | "capped" | "closed" | "archived" | null
  >(null);
  const calendarService = user ? new GoogleCalendarService() : undefined;

  const poll = slug ? getPollBySlugOrId(slug) : null;

  // Recharger le poll pour voir les créneaux proposés
  useEffect(() => {
    if (poll && slug) {
      setPollState(poll);

      // Check enforcement initial
      // Pour les sondages de disponibilité, on vérifie si une réponse (clientAvailabilities) existe déjà
      const responseCount = poll.clientAvailabilities ? 1 : 0;
      setClosureReason(getPollClosureReason(poll, responseCount));

      // Vérifier périodiquement si des créneaux ont été proposés
      const interval = setInterval(() => {
        const updatedPoll = getPollBySlugOrId(slug);
        if (updatedPoll) {
          if (updatedPoll.proposedSlots && updatedPoll.proposedSlots.length > 0) {
            setPollState(updatedPoll);
          }
          setClosureReason(
            getPollClosureReason(updatedPoll, updatedPoll.clientAvailabilities ? 1 : 0),
          );
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [poll, slug]);

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

  if (!poll || poll.type !== "availability") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#1e1e1e] border-gray-700 max-w-md">
          <CardContent className="pt-6">
            <p className="text-white text-center">Sondage de disponibilités introuvable</p>
            <Button
              onClick={() => navigate("/availability")}
              className="mt-4 w-full"
              data-testid="availability-vote-back-home"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🛑 Écran de sondage fermé
  if (closureReason && !submitted) {
    const getClosureInfo = () => {
      switch (closureReason) {
        case "expired":
          return {
            title: "Sondage expiré",
            message: "La date limite pour participer à ce sondage est dépassée.",
            icon: Clock,
            color: "text-amber-500",
          };
        case "capped":
          return {
            title: "Sondage complet",
            message: "Le nombre maximum de participations a été atteint.",
            icon: Lock,
            color: "text-blue-500",
          };
        default:
          return {
            title: "Sondage clôturé",
            message: "Ce sondage n'accepte plus de nouvelles réponses pour le moment.",
            icon: Lock,
            color: "text-gray-500",
          };
      }
    };

    const info = getClosureInfo();
    const Icon = info.icon;

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-white">
        <Card className="bg-[#1e1e1e] border-gray-700 max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 px-8">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-gray-800 mb-6">
              <Icon className={`w-10 h-10 ${info.color}`} />
            </div>
            <h2 className="text-2xl font-bold mb-3">{info.title}</h2>
            <p className="text-gray-400 mb-8">{info.message}</p>
            <Button
              onClick={() => navigate("/availability")}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              data-testid="availability-vote-understood"
            >
              C'est compris
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!availabilityText.trim()) {
      toast({
        title: "Disponibilités requises",
        description: "Veuillez indiquer vos disponibilités.",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);

    try {
      // Parser les disponibilités avec IA
      const parseResult = await parseAvailabilitiesWithAI(availabilityText.trim());

      // Si parsing IA échoue, utiliser parsing simple
      if (parseResult.availabilities.length === 0 && parseResult.errors) {
        const simpleResult = parseAvailabilitiesSimple(availabilityText.trim());
        if (simpleResult.availabilities.length > 0) {
          parseResult.availabilities = simpleResult.availabilities;
          parseResult.confidence = simpleResult.confidence;
        }
      }

      // Convertir la structure du parser (jours de la semaine) vers la nouvelle structure (dates concrètes)
      const convertedAvailabilities = convertAvailabilitiesToDates(parseResult.availabilities);

      // Sauvegarder les disponibilités dans le poll
      const allPolls = getAllPolls();
      const pollIndex = allPolls.findIndex((p) => p.id === poll.id);

      if (pollIndex !== -1) {
        allPolls[pollIndex] = {
          ...allPolls[pollIndex],
          clientAvailabilities: availabilityText.trim(),
          parsedAvailabilities: convertedAvailabilities,
          updated_at: new Date().toISOString(),
        };
        savePolls(allPolls);
      }

      setSubmitted(true);
      toast({
        title: "Disponibilités envoyées !",
        description:
          parseResult.availabilities.length > 0
            ? `${parseResult.availabilities.length} disponibilité(s) analysée(s) avec succès.`
            : "Vos disponibilités ont été transmises au professionnel.",
      });
    } catch (error) {
      // En cas d'erreur, sauvegarder quand même le texte brut
      const allPolls = getAllPolls();
      const pollIndex = allPolls.findIndex((p) => p.id === poll.id);

      if (pollIndex !== -1) {
        allPolls[pollIndex] = {
          ...allPolls[pollIndex],
          clientAvailabilities: availabilityText.trim(),
          updated_at: new Date().toISOString(),
        };
        savePolls(allPolls);
      }

      toast({
        title: "Disponibilités envoyées",
        description:
          "Vos disponibilités ont été transmises (analyse automatique temporairement indisponible).",
        variant: "default",
      });
      setSubmitted(true);
    } finally {
      setIsParsing(false);
    }
  };

  const handleValidateSlot = async (slot: { date: string; start: string; end: string }) => {
    // Utiliser pollState si disponible, sinon poll
    const currentPoll = pollState || poll;

    if (!currentPoll || !currentPoll.id) {
      toast({
        title: "Erreur",
        description: "Sondage introuvable. Veuillez rafraîchir la page.",
        variant: "destructive",
      });
      logger.error("Poll introuvable lors de la validation", "poll", { poll, pollState });
      return;
    }

    logger.info("Validation créneau démarrée", "poll", { pollId: currentPoll.id, slot });

    // Nettoyer les réservations expirées
    cleanupExpiredReservations();

    // Vérifier si le créneau est déjà réservé temporairement (Phase 3)
    if (isSlotReserved(currentPoll.id, slot)) {
      toast({
        title: "Créneau temporairement réservé",
        description:
          "Ce créneau est actuellement réservé par un autre client. Veuillez choisir un autre créneau ou réessayer dans quelques minutes.",
        variant: "destructive",
      });
      return;
    }

    // Créer une réservation temporaire (Phase 3)
    createTemporaryReservation(currentPoll.id, slot);

    // Vérifier si le professionnel a connecté son calendrier
    if (!calendarService) {
      toast({
        title: "Calendrier non connecté",
        description:
          "Le professionnel doit connecter son calendrier pour créer automatiquement l'événement. Vous pouvez quand même confirmer votre choix.",
        variant: "destructive",
      });
      // Permettre quand même la validation sans création d'événement
    }

    setIsValidating(true);
    const slotKey = `${slot.date}-${slot.start}-${slot.end}`;

    try {
      let eventCreated = false;

      // Créer l'événement dans le calendrier professionnel si connecté
      if (calendarService) {
        try {
          // Vérifier d'abord si le créneau est toujours disponible
          const startDateTime = new Date(`${slot.date}T${slot.start}:00`);
          const endDateTime = new Date(`${slot.date}T${slot.end}:00`);
          const today = new Date();
          const lookAhead = new Date(today);
          lookAhead.setDate(lookAhead.getDate() + 30);

          // Vérifier si le créneau est toujours disponible
          // Utiliser une plage plus large pour vérifier les conflits
          const checkStart = new Date(startDateTime);
          checkStart.setHours(0, 0, 0, 0);
          const checkEnd = new Date(endDateTime);
          checkEnd.setHours(23, 59, 59, 999);

          const busySlots = await calendarService.getFreeBusy(
            checkStart.toISOString(),
            checkEnd.toISOString(),
          );

          // Vérifier si le créneau chevauche un créneau occupé
          const overlaps = busySlots.some((busy) => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            // Vérifier chevauchement : le créneau proposé chevauche si les dates se chevauchent
            return !(endDateTime <= busyStart || startDateTime >= busyEnd);
          });

          if (overlaps) {
            // Libérer la réservation temporaire si le créneau est occupé
            releaseTemporaryReservation(currentPoll.id, slot);
            toast({
              title: "Créneau occupé",
              description: "Ce créneau n'est plus disponible. Veuillez choisir un autre créneau.",
              variant: "destructive",
            });
            setIsValidating(false);
            return;
          }

          // Créer l'événement
          const eventTitle = currentPoll.title || "Rendez-vous";
          const eventDescription = currentPoll.description || "";

          await calendarService.createEvent({
            summary: eventTitle,
            description: eventDescription,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
          });

          eventCreated = true;
          // Libérer la réservation temporaire après création réussie de l'événement
          releaseTemporaryReservation(currentPoll.id, slot);
        } catch (calendarError) {
          // Si erreur calendrier, libérer la réservation temporaire
          releaseTemporaryReservation(currentPoll.id, slot);
          // Si erreur calendrier, continuer quand même avec la validation
          logger.warn(
            "Erreur lors de la création de l'événement calendrier",
            "poll",
            calendarError,
          );
          toast({
            title: "Attention",
            description:
              "L'événement n'a pas pu être créé automatiquement dans le calendrier, mais votre choix a été enregistré.",
            variant: "default",
          });
        }
      }

      // Marquer le créneau comme validé dans le poll
      const allPolls = getAllPolls();
      const pollIndex = allPolls.findIndex((p) => p.id === currentPoll.id);

      if (pollIndex === -1) {
        logger.error("Poll non trouvé dans getAllPolls", "poll", { pollId: currentPoll.id });
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la validation. Veuillez réessayer.",
          variant: "destructive",
        });
        setIsValidating(false);
        return;
      }

      const updatedPoll = {
        ...allPolls[pollIndex],
        validatedSlot: slot,
        updated_at: new Date().toISOString(),
      };
      allPolls[pollIndex] = updatedPoll as import("../lib/pollStorage").Poll;
      savePolls(allPolls);
      setPollState(updatedPoll);

      logger.info("Créneau validé avec succès", "poll", { pollId: currentPoll.id, slot });

      setValidatedSlot(slotKey);
      toast({
        title: eventCreated ? "Créneau validé !" : "Choix enregistré",
        description: eventCreated
          ? "L'événement a été créé dans le calendrier du professionnel."
          : "Votre choix a été enregistré. Le professionnel sera notifié.",
      });
    } catch (error) {
      logger.error("Erreur lors de la validation du créneau", "poll", error);
      toast({
        title: "Erreur lors de la validation",
        description: error instanceof Error ? error.message : "Impossible de valider le créneau.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Si un créneau a été validé, afficher l'écran de confirmation
  if (validatedSlot || (pollState && pollState.validatedSlot)) {
    const slot = validatedSlot
      ? pollState?.proposedSlots?.find(
          (s: { date: string; start: string; end: string }) =>
            `${s.date}-${s.start}-${s.end}` === validatedSlot,
        )
      : pollState?.validatedSlot;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background pb-8">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <Card className="bg-white dark:bg-card border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">
                      RDV Confirmé !
                    </CardTitle>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Votre rendez-vous a été planifié avec succès.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {slot && (
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-600/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {new Date(`${slot.date}T00:00:00`).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-mono text-lg">
                        {slot.start} - {slot.end}
                      </span>
                    </div>
                  </div>
                )}
                <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    ✅ L'événement a été créé automatiquement dans le calendrier du professionnel.
                  </AlertDescription>
                </Alert>

                {/* Ajouter à mon calendrier */}
                {slot && (
                  <div className="space-y-3">
                    <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Ajouter à mon calendrier :
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => {
                          const startDate = new Date(`${slot.date}T${slot.start}:00`);
                          const endDate = new Date(`${slot.date}T${slot.end}:00`);
                          const event = {
                            title: poll?.title || pollState?.title || "Rendez-vous",
                            description: poll?.description || pollState?.description || "",
                            start: startDate,
                            end: endDate,
                          };
                          const icsContent = generateICS(event);
                          downloadICS(
                            `rendez-vous-${slot.date}-${slot.start.replace(":", "h")}.ics`,
                            icsContent,
                          );
                          toast({
                            title: "Fichier téléchargé",
                            description: "Ajoutez le fichier .ics à votre calendrier.",
                          });
                        }}
                        variant="outline"
                        className="flex-1 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                        data-testid="availability-vote-download-ics"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger .ics
                      </Button>
                      <Button
                        onClick={() => {
                          const startDate = new Date(`${slot.date}T${slot.start}:00`);
                          const endDate = new Date(`${slot.date}T${slot.end}:00`);
                          const event = {
                            title: poll?.title || pollState?.title || "Rendez-vous",
                            description: poll?.description || pollState?.description || "",
                            start: startDate,
                            end: endDate,
                          };
                          window.open(generateGoogleCalendarLink(event), "_blank");
                        }}
                        variant="outline"
                        className="flex-1 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                        data-testid="availability-vote-google-calendar"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Google Calendar
                      </Button>
                      <Button
                        onClick={() => {
                          const startDate = new Date(`${slot.date}T${slot.start}:00`);
                          const endDate = new Date(`${slot.date}T${slot.end}:00`);
                          const event = {
                            title: poll?.title || pollState?.title || "Rendez-vous",
                            description: poll?.description || pollState?.description || "",
                            start: startDate,
                            end: endDate,
                          };
                          window.open(generateOutlookCalendarLink(event), "_blank");
                        }}
                        variant="outline"
                        className="flex-1 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Outlook
                      </Button>
                    </div>
                  </div>
                )}

                {/* Voir les résultats si autorisé */}
                {(poll?.resultsVisibility === "public" || poll?.resultsVisibility === "voters") && (
                  <Button
                    onClick={() => navigate(`/poll/${poll.slug || poll.id}/results`)}
                    variant="outline"
                    className="w-full border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 mb-2"
                    data-testid="availability-vote-view-results"
                  >
                    Voir les résultats
                  </Button>
                )}

                <Button
                  onClick={() => navigate("/availability")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="availability-vote-back-home"
                >
                  Retour à l'accueil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Si des créneaux sont proposés, les afficher
  const proposedSlots = pollState?.proposedSlots || poll?.proposedSlots || [];
  const hasProposedSlots = proposedSlots.length > 0;

  if (submitted && !hasProposedSlots) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background pb-8">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <Card className="bg-white dark:bg-card border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">
                      Disponibilités envoyées !
                    </CardTitle>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Le professionnel recevra vos disponibilités et vous proposera des créneaux
                      optimaux.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
                  <AlertDescription className="text-blue-700 dark:text-blue-300">
                    <strong>Prochaines étapes :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Le professionnel analysera vos disponibilités</li>
                      <li>Il vous proposera des créneaux optimaux</li>
                      <li>Vous pourrez valider un créneau directement ici</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                {(poll?.resultsVisibility === "public" || poll?.resultsVisibility === "voters") && (
                  <Button
                    onClick={() => navigate(`/poll/${poll.slug || poll.id}/results`)}
                    variant="outline"
                    className="w-full border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 mb-2"
                    data-testid="availability-vote-view-results"
                  >
                    Voir les résultats
                  </Button>
                )}
                <Button
                  onClick={() => navigate("/availability")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="availability-vote-back-home"
                >
                  Retour à l'accueil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Bouton fermer */}
      <Button
        onClick={() => navigate("/availability")}
        variant="ghost"
        size="icon"
        className="fixed top-24 right-4 z-50 p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
        title="Fermer"
        aria-label="Fermer"
        data-testid="availability-vote-close"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="pt-20">
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <Card className="bg-[#1e1e1e] border-gray-700">
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
            <CardContent className="space-y-6">
              {/* Instructions */}
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-gray-300">
                  <strong>Indiquez vos disponibilités</strong>
                  <p className="mt-2 text-sm">
                    Vous pouvez écrire librement vos disponibilités, par exemple :
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>"Disponible mardi et jeudi après-midi"</li>
                    <li>"Libre la semaine prochaine sauf vendredi"</li>
                    <li>"Tous les matins de 9h à 12h"</li>
                    <li>"Lundi 14h, mercredi 10h ou 15h"</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Formulaire de saisie */}
              <div>
                <Label htmlFor="availability" className="text-gray-300 mb-2 block">
                  Vos disponibilités *
                </Label>
                <Textarea
                  id="availability"
                  value={availabilityText}
                  onChange={(e) => setAvailabilityText(e.target.value)}
                  placeholder="Ex: Disponible mardi et jeudi après-midi, ou mercredi matin..."
                  className="bg-[#2a2a2a] border-gray-700 text-white min-h-[150px] placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-2">{availabilityText.length} caractères</p>
              </div>

              {/* Afficher les créneaux proposés s'ils existent */}
              {hasProposedSlots && (
                <div className="space-y-4">
                  <div className="border-t border-gray-700 pt-6">
                    <Label className="text-gray-300 mb-3 block flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      Créneaux proposés par le professionnel
                    </Label>
                    <div className="space-y-3">
                      {proposedSlots.map(
                        (
                          slot: {
                            date: string;
                            start: string;
                            end: string;
                            score?: number;
                            reasons?: string[];
                            proposedBy?: "professional" | "system";
                          },
                          index: number,
                        ) => (
                          <Card key={index} className="bg-[#2a2a2a] border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-medium">
                                      {new Date(`${slot.date}T00:00:00`).toLocaleDateString(
                                        "fr-FR",
                                        {
                                          weekday: "long",
                                          day: "numeric",
                                          month: "long",
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-green-400" />
                                    <span className="text-green-300 font-mono text-lg">
                                      {slot.start} - {slot.end}
                                    </span>
                                  </div>
                                  {slot.score !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-yellow-400" />
                                      <span className="text-yellow-300 text-sm">
                                        Score: {slot.score}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  onClick={() => handleValidateSlot(slot)}
                                  disabled={isValidating}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  data-testid="availability-vote-validate-slot"
                                >
                                  {isValidating ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Validation...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Valider ce créneau
                                    </>
                                  )}
                                </Button>
                              </div>
                              {slot.reasons && slot.reasons.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                  <p className="text-xs text-gray-400 mb-1">
                                    Pourquoi ce créneau ?
                                  </p>
                                  <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                    {slot.reasons.map((reason: string, idx: number) => (
                                      <li key={idx}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Note MVP */}
              {!hasProposedSlots && (
                <Alert>
                  <AlertDescription className="text-sm text-green-300">
                    💡 <strong>Note MVP v1.0</strong> : Vos disponibilités seront analysées
                    automatiquement par l'IA et le professionnel recevra des créneaux optimaux
                    proposés.
                  </AlertDescription>
                </Alert>
              )}

              {/* Bouton d'envoi - masquer si des créneaux sont déjà proposés */}
              {!hasProposedSlots && (
                <Button
                  onClick={handleSubmit}
                  disabled={!availabilityText.trim() || isParsing}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="availability-vote-submit"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer mes disponibilités
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPollVote;
