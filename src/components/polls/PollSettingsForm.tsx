import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Eye,
  Mail,
  Settings,
  Shield,
  User,
  List,
  ArrowRight,
  Check,
  Layout,
  Palette,
} from "lucide-react";
import type { DatePollSettings } from "@/lib/products/date-polls/date-polls-service";
import type { FormPollSettings } from "@/lib/products/form-polls/form-polls-service";
import { ThemeSelector } from "./ThemeSelector";
import { Button } from "@/components/ui/button";

interface PollSettingsFormProps {
  settings: DatePollSettings | FormPollSettings;
  onSettingsChange: (settings: DatePollSettings | FormPollSettings) => void;
  pollType: "date" | "form";
  // Props additionnelles pour les formulaires
  themeId?: string;
  onThemeChange?: (id: string) => void;
  displayMode?: "all-at-once" | "multi-step";
  onDisplayModeChange?: (mode: "all-at-once" | "multi-step") => void;
  resultsVisibility?: "creator-only" | "voters" | "public";
  onResultsVisibilityChange?: (vis: "creator-only" | "voters" | "public") => void;
}

type TabType = "basic" | "advanced" | "email" | "visibility" | "theme" | "display";

export function PollSettingsForm({
  settings,
  onSettingsChange,
  pollType,
  themeId,
  onThemeChange,
  displayMode,
  onDisplayModeChange,
  resultsVisibility,
  onResultsVisibilityChange,
}: PollSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "basic", label: "Basique", icon: <Settings className="w-4 h-4" /> },
    { id: "advanced", label: "Avancé", icon: <Shield className="w-4 h-4" /> },
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "visibility", label: "Visibilité", icon: <Eye className="w-4 h-4" /> },
  ];

  // Ajouter les onglets spécifiques aux formulaires
  if (pollType === "form") {
    tabs.splice(1, 0, { id: "display", label: "Affichage", icon: <Layout className="w-4 h-4" /> });
    tabs.splice(2, 0, { id: "theme", label: "Thème", icon: <Palette className="w-4 h-4" /> });
  }

  const updateSetting = <K extends keyof (DatePollSettings | FormPollSettings)>(
    key: K,
    value: (DatePollSettings | FormPollSettings)[K],
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const renderBasicSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Paramètres d'affichage</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Afficher le logo DooDates</p>
                <p className="text-sm text-gray-300">
                  Montrer le branding DooDates sur le formulaire
                </p>
              </div>
            </div>
            <label htmlFor="showLogo" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="showLogo"
                className="sr-only peer"
                checked={settings.showLogo ?? true}
                onChange={(e) => updateSetting("showLogo", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Temps estimé de complétion</p>
                <p className="text-sm text-gray-300">
                  Afficher le temps approximatif pour répondre
                </p>
              </div>
            </div>
            <label
              htmlFor="showEstimatedTime"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="showEstimatedTime"
                className="sr-only peer"
                checked={settings.showEstimatedTime ?? false}
                onChange={(e) => updateSetting("showEstimatedTime", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Nombre de questions</p>
                <p className="text-sm text-gray-300">Afficher "Question X sur Y"</p>
              </div>
            </div>
            <label
              htmlFor="showQuestionCount"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="showQuestionCount"
                className="sr-only peer"
                checked={settings.showQuestionCount ?? false}
                onChange={(e) => updateSetting("showQuestionCount", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Contrôle d'accès</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Connexion requise</p>
                <p className="text-sm text-gray-300">
                  Les utilisateurs doivent se connecter avec Google
                </p>
              </div>
            </div>
            <label
              htmlFor="requireAuth"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="requireAuth"
                className="sr-only peer"
                checked={settings.requireAuth ?? false}
                onChange={(e) => updateSetting("requireAuth", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Une réponse par personne</p>
                <p className="text-sm text-gray-300">Prévenir les réponses multiples (cookie)</p>
              </div>
            </div>
            <label
              htmlFor="oneResponsePerPerson"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="oneResponsePerPerson"
                className="sr-only peer"
                checked={settings.oneResponsePerPerson ?? false}
                onChange={(e) => updateSetting("oneResponsePerPerson", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Modification après soumission</p>
                <p className="text-sm text-gray-300">Permettre de modifier sa réponse</p>
              </div>
            </div>
            <label
              htmlFor="allowEditAfterSubmit"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="allowEditAfterSubmit"
                className="sr-only peer"
                checked={settings.allowEditAfterSubmit ?? false}
                onChange={(e) => updateSetting("allowEditAfterSubmit", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Limites</h3>

        <div className="grid grid-cols-2 gap-4">
          {pollType === "form" && (
            <>
              <div>
                <label
                  htmlFor="maxResponses"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Nombre maximum de réponses
                </label>
                <input
                  type="number"
                  id="maxResponses"
                  min="1"
                  placeholder="Illimité"
                  value={(settings as FormPollSettings).maxResponses || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    updateSetting("maxResponses", value);
                  }}
                  className="w-full px-3 py-2 border border-gray-600 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-300 mt-1">Laisser vide pour illimité</p>
              </div>

              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-300 mb-1">
                  Date limite
                </label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  value={(settings as FormPollSettings).expiresAt || ""}
                  onChange={(e) =>
                    updateSetting(
                      "expiresAt" as keyof (DatePollSettings | FormPollSettings),
                      e.target.value || undefined,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-600 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-300 mt-1">Optionnel</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Confirmation par email</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Recevoir une copie par email</p>
                <p className="text-sm text-gray-300">
                  Envoyer un récapitulatif des réponses par email
                </p>
              </div>
            </div>
            <label
              htmlFor="sendEmailCopy"
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="sendEmailCopy"
                className="sr-only peer"
                checked={settings.sendEmailCopy ?? false}
                onChange={(e) => updateSetting("sendEmailCopy", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.sendEmailCopy && (
            <div className="ml-8">
              <label
                htmlFor="emailForCopy"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Adresse email
              </label>
              <input
                type="email"
                id="emailForCopy"
                placeholder="votremail@example.com"
                value={settings.emailForCopy || ""}
                onChange={(e) => updateSetting("emailForCopy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required={settings.sendEmailCopy}
              />
              <p className="text-xs text-gray-300 mt-1">
                Obligatoire si l'option email est activée
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVisibilitySettings = () => {
    // Utiliser la prop externalisée si disponible, sinon fallback sur settings
    const currentVisibility = resultsVisibility || settings.resultsVisibility || "public";

    const handleChange = (vis: "creator-only" | "voters" | "public") => {
      if (onResultsVisibilityChange) {
        onResultsVisibilityChange(vis);
      } else {
        updateSetting("resultsVisibility", vis);
      }
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Visibilité des résultats</h3>

          <div className="space-y-3">
            {[
              {
                value: "creator-only",
                label: "Créateur uniquement",
                description: "Seul le créateur peut voir les résultats",
              },
              {
                value: "voters",
                label: "Participants après vote",
                description: "Visible après avoir voté",
              },
              {
                value: "public",
                label: "Public",
                description: "Tout le monde peut voir les résultats",
              },
            ].map((option) => (
              <label
                key={option.value}
                htmlFor={`vis-${option.value}`}
                className="flex items-center cursor-pointer p-3 rounded-lg border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 transition-all"
              >
                <input
                  type="radio"
                  id={`vis-${option.value}`}
                  name="resultsVisibility"
                  value={option.value}
                  checked={currentVisibility === option.value}
                  onChange={(e) =>
                    handleChange(e.target.value as "creator-only" | "voters" | "public")
                  }
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-600 bg-gray-700"
                />
                <div className="ml-4">
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderThemeSettings = () => (
    <ThemeSelector selectedThemeId={themeId || ""} onThemeChange={onThemeChange || (() => {})} />
  );

  const renderDisplaySettings = () => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Mode d'affichage du formulaire
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1 : Classique */}
        <Button
          type="button"
          size="default"
          variant="outline"
          onClick={() => onDisplayModeChange && onDisplayModeChange("all-at-once")}
          className={`p-4 h-auto rounded-lg border-2 text-left transition-all flex flex-col items-start ${
            displayMode === "all-at-once"
              ? "border-purple-500 bg-purple-900/20"
              : "border-gray-700 hover:border-gray-600 bg-transparent text-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <List className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white">Classique</span>
            {displayMode === "all-at-once" && <Check className="w-4 h-4 text-purple-400 ml-auto" />}
          </div>
          <p className="text-xs text-gray-300 mb-2">Toutes les questions visibles en même temps</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>✓ Rapide à remplir</p>
            <p>✓ Vue d'ensemble</p>
            <p>⚠ Peut intimider si &gt;5 questions</p>
          </div>
        </Button>

        {/* Option 2 : Multi-step */}
        <Button
          type="button"
          size="default"
          variant="outline"
          onClick={() => onDisplayModeChange && onDisplayModeChange("multi-step")}
          className={`p-4 h-auto rounded-lg border-2 text-left transition-all flex flex-col items-start ${
            displayMode === "multi-step"
              ? "border-purple-500 bg-purple-900/20"
              : "border-gray-700 hover:border-gray-600 bg-transparent text-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <ArrowRight className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white">Une par une</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
              Style Typeform
            </span>
            {displayMode === "multi-step" && <Check className="w-4 h-4 text-purple-400 ml-auto" />}
          </div>
          <p className="text-xs text-gray-300 mb-2">Une question à la fois, plein écran</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>✓ +25% taux complétion</p>
            <p>✓ Moins intimidant</p>
            <p>✓ Parfait mobile</p>
          </div>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#1e1e1e] rounded-lg border border-gray-700">
      <div className="border-b border-gray-700 bg-[#0a0a0a] rounded-t-lg">
        <div
          className="flex space-x-2 px-4 overflow-x-auto"
          role="tablist"
          aria-label="Paramètres du sondage"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e] ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-400 bg-purple-500/10"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-white/5"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="p-6"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "basic" && renderBasicSettings()}
        {activeTab === "display" && renderDisplaySettings()}
        {activeTab === "theme" && renderThemeSettings()}
        {activeTab === "advanced" && renderAdvancedSettings()}
        {activeTab === "email" && renderEmailSettings()}
        {activeTab === "visibility" && renderVisibilitySettings()}
      </div>
    </div>
  );
}
