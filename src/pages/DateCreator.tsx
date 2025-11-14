import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PollCreatorComponent from "@/components/PollCreator";
import { getAllPolls } from "@/lib/pollStorage";
import type { DatePollSuggestion } from "@/lib/gemini";
import { X, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreatePageLayout } from "@/components/layout/CreatePageLayout";

export default function DateCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const [published, setPublished] = useState(false);
  const [publishedPoll, setPublishedPoll] = useState<import("../types/poll").Poll | null>(null);
  const { toast } = useToast();

  // Charger les données du sondage à éditer
  const initialData = useMemo<DatePollSuggestion | undefined>(() => {
    if (!editId) return undefined;

    const existing = getAllPolls().find((p) => p.id === editId && p.type !== "form");

    if (!existing) return undefined;

    // Extraire les dates depuis le sondage
    const dates: string[] = [];

    // Méthode 1: Depuis settings.selectedDates
    if (existing.settings?.selectedDates?.length > 0) {
      dates.push(...existing.settings.selectedDates);
    }

    // Méthode 2: Depuis les options du sondage
    if (dates.length === 0 && existing.options) {
      existing.options.forEach((option: import("../types/poll").PollOption) => {
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
      timeSlotsByDate:
        (existing.settings as import("../../lib/pollStorage").PollSettings | undefined)
          ?.timeSlotsByDate || {},
    } as DatePollSuggestion;
  }, [editId]);

  // Écran de succès après publication
  if (published && publishedPoll) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-8">
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="bg-[#3c4043] rounded-lg border border-gray-700 p-8 text-center space-y-6">
              {/* Icône de succès */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
              </div>

              {/* Message de succès */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Sondage publié !</h1>
                <p className="text-gray-300">
                  Votre sondage "{publishedPoll.title}" est maintenant actif et prêt à recevoir des
                  votes.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  <Check className="w-5 h-5" />
                  Aller au Tableau de bord
                </Link>
                <Link
                  to={`/poll/${publishedPoll.slug || publishedPoll.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-gray-300 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Voir le sondage
                </Link>
              </div>

              {/* Lien de partage */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Lien de partage :</p>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                  <code className="px-4 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                    {window.location.origin}/poll/{publishedPoll.slug || publishedPoll.id}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/poll/${publishedPoll.slug || publishedPoll.id}`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Lien copié !",
                        description: "Le lien a été copié dans le presse-papiers.",
                      });
                    }}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CreatePageLayout>
      <div className="pb-8">
        {/* Calendar creator component */}
        <PollCreatorComponent
          onBack={(createdPoll?: import("../../lib/pollStorage").Poll) => {
            if (createdPoll) {
              setPublishedPoll(createdPoll);
              setPublished(true);
            } else {
              navigate(-1);
            }
          }}
          initialData={initialData}
        />
      </div>
    </CreatePageLayout>
  );
}
