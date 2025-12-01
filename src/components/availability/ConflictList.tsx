import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { X, Clock, MapPin, Calendar } from "lucide-react";
import { ProposedSlot } from "@/services/schedulingOptimizer";

interface ConflictListProps {
    conflictingSlots: ProposedSlot[];
}

export const ConflictList: React.FC<ConflictListProps> = ({ conflictingSlots }) => {
    if (conflictingSlots.length === 0) return null;

    return (
        <Card className="bg-[#1e1e1e] border-red-900/50 mb-6">
            <CardHeader>
                <CardTitle className="text-xl text-red-400 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Conflits détectés
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-300">
                    <AlertDescription>
                        Certains créneaux demandés par le client entrent en conflit avec votre calendrier.
                        Ils ont été exclus des propositions automatiques.
                    </AlertDescription>
                </Alert>
                <div className="space-y-3">
                    {conflictingSlots.map((slot, index) => (
                        <div
                            key={index}
                            className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-red-900/50 transition-colors"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="font-medium text-red-200 text-lg">
                                        {new Date(slot.date).toLocaleDateString("fr-FR", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                        })}
                                    </div>
                                    <Badge variant="outline" className="border-red-900 text-red-400 bg-red-950/30">
                                        {slot.start} - {slot.end}
                                    </Badge>
                                </div>

                                {slot.conflictDetails ? (
                                    <div className="flex flex-col gap-1.5 mt-2 pl-2 border-l-2 border-red-900/30">
                                        <div className="flex items-center gap-2 text-red-300 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            {slot.conflictDetails.summary}
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                <span>{slot.conflictDetails.start} - {slot.conflictDetails.end}</span>
                                            </div>

                                            {slot.conflictDetails.location && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="truncate max-w-[200px]">{slot.conflictDetails.location}</span>
                                                </div>
                                            )}

                                            {slot.conflictDetails.calendarSummary && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="italic">{slot.conflictDetails.calendarSummary}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-400/80 italic text-sm">
                                        {slot.reasons?.[0] || "Conflit détecté"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
