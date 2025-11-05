import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, ClipboardList, X } from "lucide-react";

export default function CreateChooser() {
  const navigate = useNavigate();
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePreload = (path: string) => {
    // Précharger après 300ms de hover pour éviter les préchargements accidentels
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
    preloadTimeoutRef.current = setTimeout(() => {
      if (path === "/create/date" && typeof (window as any).preloadPollCreator === "function") {
        (window as any).preloadPollCreator();
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-4xl mx-auto p-6 pt-20 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 right-6 p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold mb-2 text-white">Créer un nouveau sondage</h1>
        <p className="text-gray-400 mb-6">
          Choisissez le type de sondage qui correspond à votre besoin.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/create/date"
            data-testid="poll-type-date"
            onMouseEnter={() => handlePreload("/create/date")}
            onMouseLeave={handleMouseLeave}
            className="group block rounded-lg border border-gray-700 bg-[#1e1e1e] p-5 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-blue-50 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Sondage Dates</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Proposez des jours et horaires. Idéal pour organiser des réunions.
                </p>
                <ul className="mt-3 text-sm text-gray-400 list-disc pl-5 space-y-1">
                  <li>Sélection de dates sur calendrier</li>
                  <li>Créneaux horaires optionnels</li>
                  <li>Résultats agrégés par disponibilités</li>
                </ul>
                <span className="inline-block mt-4 text-blue-600 group-hover:underline">
                  Commencer →
                </span>
              </div>
            </div>
          </Link>

          <Link
            to="/create/form"
            data-testid="poll-type-form"
            className="group block rounded-lg border border-gray-700 bg-[#1e1e1e] p-5 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-violet-50 text-violet-600">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Sondage Formulaire</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Questions à choix unique/multiples ou texte libre.
                </p>
                <ul className="mt-3 text-sm text-gray-400 list-disc pl-5 space-y-1">
                  <li>Questions personnalisées</li>
                  <li>Limite de choix pour questions multiples</li>
                  <li>Résultats agrégés automatiques</li>
                </ul>
                <span className="inline-block mt-4 text-violet-600 group-hover:underline">
                  Commencer →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
