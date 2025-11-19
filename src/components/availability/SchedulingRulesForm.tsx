import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
// Note: Select non utilisé pour l'instant, mais peut être ajouté plus tard si besoin
import { Settings, Clock, Sparkles, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WeeklyTimeSlotsGrid, type WeeklyTimeSlots } from "./WeeklyTimeSlotsGrid";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SchedulingRules {
  minLatencyMinutes?: number;
  maxLatencyMinutes?: number;
  preferNearTerm?: boolean;
  preferHalfDays?: boolean;
  preferredTimes?: Array<{ day: string; start: string; end: string }>; // Heures préférées par jour (remplace "jours préférés")
  slotDurationMinutes?: number;
}

interface SchedulingRulesFormProps {
  rules: SchedulingRules;
  onChange: (rules: SchedulingRules) => void;
}

export function SchedulingRulesForm({ rules, onChange }: SchedulingRulesFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const updateRule = <K extends keyof SchedulingRules>(key: K, value: SchedulingRules[K]) => {
    onChange({ ...rules, [key]: value });
  };

  const addTimeRange = (day?: string) => {
    const currentTimes = rules.preferredTimes || [];
    updateRule("preferredTimes", [
      ...currentTimes,
      { day: day || "monday", start: "09:00", end: "12:00" },
    ]);
  };

  const updateTimeRange = (index: number, field: "day" | "start" | "end", value: string) => {
    const currentTimes = rules.preferredTimes || [];
    const newTimes = [...currentTimes];
    newTimes[index] = { ...newTimes[index], [field]: value };
    updateRule("preferredTimes", newTimes);
  };

  const removeTimeRange = (index: number) => {
    const currentTimes = rules.preferredTimes || [];
    const newTimes = currentTimes.filter((_, i) => i !== index);
    updateRule("preferredTimes", newTimes.length > 0 ? newTimes : undefined);
  };

  // Conversion entre WeeklyTimeSlots et preferredTimes
  const weeklyTimeSlotsToPreferredTimes = (
    weeklySlots: WeeklyTimeSlots,
  ): Array<{ day: string; start: string; end: string }> => {
    const preferredTimes: Array<{ day: string; start: string; end: string }> = [];

    Object.entries(weeklySlots).forEach(([day, slots]) => {
      const enabledSlots = slots
        .filter((s) => s.enabled)
        .sort((a, b) => {
          const aMinutes = a.hour * 60 + a.minute;
          const bMinutes = b.hour * 60 + b.minute;
          return aMinutes - bMinutes;
        });

      if (enabledSlots.length === 0) return;

      // Grouper les slots consécutifs en plages horaires
      let currentBlock: {
        start: { hour: number; minute: number };
        end: { hour: number; minute: number };
      } | null = null;
      const granularity = rules.slotDurationMinutes || 30;

      for (const slot of enabledSlots) {
        const slotMinutes = slot.hour * 60 + slot.minute;
        const slotEndMinutes = slotMinutes + (slot.duration || granularity);

        if (!currentBlock) {
          currentBlock = {
            start: { hour: slot.hour, minute: slot.minute },
            end: {
              hour: Math.floor(slotEndMinutes / 60),
              minute: slotEndMinutes % 60,
            },
          };
        } else {
          const currentEndMinutes = currentBlock.end.hour * 60 + currentBlock.end.minute;
          if (slotMinutes <= currentEndMinutes + granularity) {
            // Slot adjacent → Étendre le bloc
            currentBlock.end = {
              hour: Math.floor(slotEndMinutes / 60),
              minute: slotEndMinutes % 60,
            };
          } else {
            // Nouveau bloc → Sauvegarder l'ancien
            preferredTimes.push({
              day,
              start: `${currentBlock.start.hour.toString().padStart(2, "0")}:${currentBlock.start.minute.toString().padStart(2, "0")}`,
              end: `${currentBlock.end.hour.toString().padStart(2, "0")}:${currentBlock.end.minute.toString().padStart(2, "0")}`,
            });
            currentBlock = {
              start: { hour: slot.hour, minute: slot.minute },
              end: {
                hour: Math.floor(slotEndMinutes / 60),
                minute: slotEndMinutes % 60,
              },
            };
          }
        }
      }

      // Sauvegarder le dernier bloc
      if (currentBlock) {
        preferredTimes.push({
          day,
          start: `${currentBlock.start.hour.toString().padStart(2, "0")}:${currentBlock.start.minute.toString().padStart(2, "0")}`,
          end: `${currentBlock.end.hour.toString().padStart(2, "0")}:${currentBlock.end.minute.toString().padStart(2, "0")}`,
        });
      }
    });

    return preferredTimes;
  };

  const preferredTimesToWeeklyTimeSlots = useCallback(
    (preferredTimes?: Array<{ day: string; start: string; end: string }>): WeeklyTimeSlots => {
      const weeklySlots: WeeklyTimeSlots = {};
      const granularity = rules.slotDurationMinutes || 30;

      if (!preferredTimes || preferredTimes.length === 0) {
        return weeklySlots;
      }

      preferredTimes.forEach((timeRange) => {
        const [startHour, startMinute] = timeRange.start.split(":").map(Number);
        const [endHour, endMinute] = timeRange.end.split(":").map(Number);

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (!weeklySlots[timeRange.day]) {
          weeklySlots[timeRange.day] = [];
        }

        // Créer des slots pour chaque intervalle de granularité
        for (let minutes = startMinutes; minutes < endMinutes; minutes += granularity) {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;

          weeklySlots[timeRange.day].push({
            hour,
            minute,
            enabled: true,
            duration: granularity,
          });
        }
      });

      return weeklySlots;
    },
    [rules.slotDurationMinutes],
  );

  // État local pour WeeklyTimeSlotsPicker
  const weeklyTimeSlots = useMemo(() => {
    return preferredTimesToWeeklyTimeSlots(rules.preferredTimes);
  }, [rules.preferredTimes, preferredTimesToWeeklyTimeSlots]);

  const handleWeeklyTimeSlotsChange = (newWeeklySlots: WeeklyTimeSlots) => {
    const newPreferredTimes = weeklyTimeSlotsToPreferredTimes(newWeeklySlots);
    updateRule("preferredTimes", newPreferredTimes.length > 0 ? newPreferredTimes : undefined);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-[#333] transition-all duration-200 group border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg text-white flex items-center gap-2 group-hover:text-purple-300 transition-colors">
                    Règles Intelligentes d'Optimisation
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    Configurez les préférences pour l'optimisation automatique des créneaux
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors hidden sm:inline">
                  {isOpen ? "Réduire" : "Développer"}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-6 h-6 text-purple-400 transition-transform duration-200 group-hover:scale-110" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 transition-transform duration-200 group-hover:text-purple-400 group-hover:scale-110" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Durée standard des créneaux */}
            <div>
              <Label className="text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Durée standard des créneaux (minutes)
              </Label>
              <Input
                type="number"
                min="15"
                max="480"
                step="15"
                value={rules.slotDurationMinutes || 60}
                onChange={(e) =>
                  updateRule("slotDurationMinutes", parseInt(e.target.value) || undefined)
                }
                placeholder="60"
                className="bg-[#1e1e1e] border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Durée par défaut d'un créneau (ex: 60 min)
              </p>
            </div>

            {/* Temps entre séances */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Temps minimum entre séances (min)
                  <span className="text-xs text-gray-500 ml-2">(Règle 1 : Minimiser gaps)</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  value={rules.minLatencyMinutes || 15}
                  onChange={(e) =>
                    updateRule("minLatencyMinutes", parseInt(e.target.value) || undefined)
                  }
                  placeholder="15"
                  className="bg-[#1e1e1e] border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Réduit les temps morts entre rendez-vous. Ex: 15-30 min recommandé.
                </p>
              </div>
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Temps maximum entre séances (min)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="240"
                  step="5"
                  value={rules.maxLatencyMinutes || 30}
                  onChange={(e) =>
                    updateRule("maxLatencyMinutes", parseInt(e.target.value) || undefined)
                  }
                  placeholder="30"
                  className="bg-[#1e1e1e] border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limite l'espacement maximum entre deux séances consécutives.
                </p>
              </div>
            </div>

            {/* Préférences booléennes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preferNearTerm"
                  checked={rules.preferNearTerm || false}
                  onCheckedChange={(checked) => updateRule("preferNearTerm", checked === true)}
                  className="border-gray-600"
                />
                <Label htmlFor="preferNearTerm" className="text-gray-300 cursor-pointer">
                  Prioriser les créneaux proches dans le temps
                  <span className="text-xs text-gray-500 ml-2">(Règle 2)</span>
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6 -mt-2">
                Planifie rapidement les rendez-vous. Bonus pour créneaux &lt; 7 jours.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preferHalfDays"
                  checked={rules.preferHalfDays || false}
                  onCheckedChange={(checked) => updateRule("preferHalfDays", checked === true)}
                  className="border-gray-600"
                />
                <Label htmlFor="preferHalfDays" className="text-gray-300 cursor-pointer">
                  Préférer créer des demi-journées complètes (grouper les créneaux)
                  <span className="text-xs text-gray-500 ml-2">(Règle 3)</span>
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6 -mt-2">
                Optimise la productivité en créant des blocs de temps complets (matin/après-midi).
              </p>
            </div>

            {/* Heures préférées par jour - Utilise le composant réutilisable */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Heures préférées par jour (optionnel)
                  <span className="text-xs text-gray-500 ml-2">(Règle 4)</span>
                </Label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Configurez des plages horaires spécifiques pour chaque jour de la semaine en
                sélectionnant les créneaux disponibles.
              </p>
              <WeeklyTimeSlotsGrid
                value={weeklyTimeSlots}
                onChange={handleWeeklyTimeSlotsChange}
                timeGranularity={rules.slotDurationMinutes || 30}
              />
            </div>

            {/* Note Version actuelle */}
            <div className="p-3 bg-green-500/10 border border-green-600/30 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-xs text-green-300 mb-2">
                    ✅ <strong>Optimisation automatique active</strong> : Ces règles sont utilisées
                    pour l'optimisation automatique des créneaux proposés à vos clients.
                  </p>
                  {!user && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-300">
                        <strong>Connexion recommandée</strong> : Connectez votre calendrier Google
                        Calendar pour activer l'optimisation complète.
                      </p>
                      <Button
                        onClick={async () => {
                          const result = await signInWithGoogle();
                          if (result.error) {
                            toast({
                              title: "Erreur de connexion",
                              description:
                                result.error.message ||
                                "Impossible de se connecter à Google Calendar.",
                              variant: "destructive",
                            });
                          } else {
                            toast({
                              title: "Connexion en cours",
                              description:
                                "Redirection vers Google pour autoriser l'accès à votre calendrier...",
                            });
                          }
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3"
                      >
                        <Calendar className="w-3 h-3 mr-1.5" />
                        Connecter Google Calendar
                      </Button>
                    </div>
                  )}
                  {user && (
                    <p className="text-xs text-green-300">
                      ✅ Calendrier Google Calendar connecté - Optimisation complète activée.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
