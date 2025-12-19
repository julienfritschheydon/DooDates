import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Eye, EyeOff, Mail, Settings, Shield, User } from 'lucide-react';
import type { DatePollSettings } from '@/lib/products/date-polls/date-polls-service';
import type { FormPollSettings } from '@/lib/products/form-polls/form-polls-service';

interface PollSettingsFormProps {
  settings: DatePollSettings | FormPollSettings;
  onSettingsChange: (settings: DatePollSettings | FormPollSettings) => void;
  pollType: 'date' | 'form';
}

type TabType = 'basic' | 'advanced' | 'email' | 'visibility';

export function PollSettingsForm({ settings, onSettingsChange, pollType }: PollSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: 'Basique', icon: <Settings className="w-4 h-4" /> },
    { id: 'advanced', label: 'Avancé', icon: <Shield className="w-4 h-4" /> },
    { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { id: 'visibility', label: 'Visibilité', icon: <Eye className="w-4 h-4" /> },
  ];

  const updateSetting = <K extends keyof (DatePollSettings | FormPollSettings)>(
    key: K,
    value: (DatePollSettings | FormPollSettings)[K]
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
                <p className="text-sm text-gray-400">Montrer le branding DooDates sur le formulaire</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.showLogo ?? true}
                onChange={(e) => updateSetting('showLogo', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Temps estimé de complétion</p>
                <p className="text-sm text-gray-500">Afficher le temps approximatif pour répondre</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.showEstimatedTime ?? false}
                onChange={(e) => updateSetting('showEstimatedTime', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Nombre de questions</p>
                <p className="text-sm text-gray-400">Afficher "Question X sur Y"</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.showQuestionCount ?? false}
                onChange={(e) => updateSetting('showQuestionCount', e.target.checked)}
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
                <p className="text-sm text-gray-400">Les utilisateurs doivent se connecter avec Google</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.requireAuth ?? false}
                onChange={(e) => updateSetting('requireAuth', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Une réponse par personne</p>
                <p className="text-sm text-gray-500">Prévenir les réponses multiples (cookie)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.oneResponsePerPerson ?? false}
                onChange={(e) => updateSetting('oneResponsePerPerson', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">Modification après soumission</p>
                <p className="text-sm text-gray-400">Permettre de modifier sa réponse</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.allowEditAfterSubmit ?? false}
                onChange={(e) => updateSetting('allowEditAfterSubmit', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Limites</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre maximum de réponses
            </label>
            <input
              type="number"
              min="1"
              placeholder="Illimité"
              value={settings.maxResponses || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                updateSetting('maxResponses', value);
              }}
              className="w-full px-3 py-2 border border-gray-600 bg-[#1e1e1e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Laisser vide pour illimité</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date limite
            </label>
            <input
              type="datetime-local"
              value={settings.expiresAt || ''}
              onChange={(e) => updateSetting('expiresAt', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-600 bg-[#1e1e1e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Optionnel</p>
          </div>
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
                <p className="text-sm text-gray-400">Envoyer un récapitulatif des réponses par email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.sendEmailCopy ?? false}
                onChange={(e) => updateSetting('sendEmailCopy', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.sendEmailCopy && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                placeholder="votremail@example.com"
                value={settings.emailForCopy || ''}
                onChange={(e) => updateSetting('emailForCopy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-[#1e1e1e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={settings.sendEmailCopy}
              />
              <p className="text-xs text-gray-400 mt-1">Obligatoire si l'option email est activée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVisibilitySettings = () => {
    // Default to 'public' if not set
    const currentVisibility = settings.resultsVisibility || 'public';
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Visibilité des résultats</h3>

          <div className="space-y-3">
            {[
              {
                value: 'creator-only',
                label: 'Créateur uniquement',
                description: 'Seul le créateur peut voir les résultats'
              },
              {
                value: 'voters',
                label: 'Participants après vote',
                description: 'Visible après avoir voté'
              },
              {
                value: 'public',
                label: 'Public',
                description: 'Tout le monde peut voir les résultats'
              },
            ].map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={option.value}
                  name="resultsVisibility"
                  value={option.value}
                  checked={currentVisibility === option.value}
                  onChange={(e) => {
                    updateSetting('resultsVisibility', e.target.value as 'creator-only' | 'voters' | 'public');
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                />
                <label htmlFor={option.value} className="ml-3">
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'basic' && renderBasicSettings()}
        {activeTab === 'advanced' && renderAdvancedSettings()}
        {activeTab === 'email' && renderEmailSettings()}
        {activeTab === 'visibility' && renderVisibilitySettings()}
      </div>
    </div>
  );
}
