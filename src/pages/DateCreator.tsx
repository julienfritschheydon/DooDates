import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PollCreatorComponent from "@/components/PollCreator";
import { getAllPolls } from "@/lib/pollStorage";
import type { DatePollSuggestion } from "@/lib/gemini";
import { X } from "lucide-react";

export default function DateCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  // Charger les données du sondage à éditer
  const initialData = useMemo<DatePollSuggestion | undefined>(() => {
    if (!editId) return undefined;
    
    const existing = getAllPolls().find(
      (p) => p.id === editId && p.type !== "form"
    );
    
    if (!existing) return undefined;

    // Extraire les dates depuis le sondage
    const dates: string[] = [];
    
    // Méthode 1: Depuis settings.selectedDates
    if ((existing as any).settings?.selectedDates?.length > 0) {
      dates.push(...(existing as any).settings.selectedDates);
    }
    
    // Méthode 2: Depuis les options du sondage
    if (dates.length === 0 && (existing as any).options) {
      (existing as any).options.forEach((option: any) => {
        if (option.option_date && !dates.includes(option.option_date)) {
          dates.push(option.option_date);
        }
      });
    }

    // Méthode 3: Depuis le champ dates
    if (dates.length === 0 && existing.dates?.length > 0) {
      dates.push(...existing.dates);
    }

    return {
      title: existing.title || "",
      dates: dates,
      type: "date",
      timeSlotsByDate: (existing as any).settings?.timeSlotsByDate || {},
    } as DatePollSuggestion;
  }, [editId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Bouton retour */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
            title="Retour"
            aria-label="Retour"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Calendar creator component */}
      <PollCreatorComponent 
        onBack={() => navigate(-1)} 
        initialData={initialData}
      />
    </div>
  );
}
