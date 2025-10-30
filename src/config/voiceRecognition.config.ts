/**
 * Configuration stable pour la reconnaissance vocale
 * NE PAS MODIFIER sans tests approfondis
 * 
 * Cette configuration est le résultat de multiples itérations et tests.
 * Web Speech API a des limitations inhérentes :
 * - S'arrête après quelques secondes de silence
 * - Perd des mots lors des redémarrages
 * - Qualité variable selon le navigateur
 * 
 * Pour une meilleure qualité, migrer vers Whisper API (voir Planning.md)
 * 
 * Source: https://github.com/remarkablemark/web-speech-api-demo/blob/gh-pages/speech-recognition.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * HISTORIQUE DES TESTS (30 Oct 2025)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TEST 1: interimResults: true, continuous: true, autoRestart: false
 * ✅ RÉSULTAT: "beaucoup mieux" - Accumule correctement le texte
 * ⚠️ PROBLÈME: S'arrête après quelques secondes de silence
 * 
 * TEST 2: interimResults: true, continuous: false, autoRestart: false
 * ❌ RÉSULTAT: S'arrête après 2-3 mots seulement
 * 📝 NOTE: C'est la config de remarkablemark mais pour leur mode "interim only"
 * 
 * TEST 3: interimResults: true, continuous: true, autoRestart: true (300ms)
 * ❌ RÉSULTAT: Redémarre en boucle, perd des mots, expérience horrible
 * 📝 NOTE: Le redémarrage automatique crée des coupures
 * 
 * TEST 4: Boucle depuis 0 vs resultIndex
 * ✅ RÉSULTAT: Boucle depuis resultIndex + accumulation fonctionne mieux
 * 📝 NOTE: event.resultIndex pointe vers les nouveaux résultats
 * 
 * TEST 5: interimResults: true, continuous: true, autoRestart: false, boucle resultIndex
 * ❌ RÉSULTAT: S'arrête après 2-3 mots ("créer un" puis stop)
 * 📝 NOTE: Même problème que continuous: false
 * 🤔 HYPOTHÈSE: Le problème n'est pas la config mais le comportement de l'API
 * 
 * TEST 6: Même config que TEST 5, sans réinitialisation au démarrage
 * ❌ RÉSULTAT: S'arrête après 3 mots ("créer un son" puis stop)
 * 📝 NOTE: Comportement identique, pas d'amélioration
 * 
 * TEST 7: Page de test isolée avec config EXACTE de remarkablemark
 * ✅ RÉSULTAT: PARFAIT ! Phrase longue capturée en une seule fois
 * 📝 CONFIG: continuous: false, interimResults: true
 * 🎯 DÉCOUVERTE: continuous: false fonctionne MIEUX que continuous: true !
 * 
 * TEST 8: Application de la config dans le hook + optimisation useEffect
 * ✅ RÉSULTAT: PARFAIT ! "créer un sondage pour un déjeuner mardi ou mercredi"
 * 📝 FIX CRITIQUE: Utiliser des refs pour onTranscriptChange et onError
 * 🎯 DÉCOUVERTE: Les fonctions en dépendances causaient 15 re-configurations !
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CONCLUSION FINALE - CONFIGURATION VALIDÉE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CONFIGURATION QUI MARCHE (testée et validée en production):
 * - continuous: false (contre-intuitif mais c'est ça qui marche !)
 * - interimResults: true
 * - autoRestart: false
 * - Boucle depuis event.resultIndex
 * - Accumulation avec finalTranscriptRef (ref pour persister)
 * - Callbacks dans des refs (évite re-renders inutiles)
 * 
 * Cette config permet de capturer des phrases longues en une seule session.
 * 
 * OPTIMISATION CRITIQUE:
 * Les callbacks (onTranscriptChange, onError) doivent être stockés dans des refs
 * et non dans les dépendances du useEffect, sinon ça cause des re-configurations
 * massives (15x par événement au lieu de 1x au démarrage).
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const VOICE_RECOGNITION_CONFIG = {
  /**
   * Langue de reconnaissance
   */
  lang: 'fr-FR' as const,

  /**
   * Afficher les résultats intermédiaires pendant la reconnaissance
   * ✅ VALIDÉ: true (config remarkablemark qui marche)
   */
  interimResults: true,

  /**
   * Mode continu
   * ✅ VALIDÉ: false (contre-intuitif mais c'est ça qui marche !)
   * 📝 NOTE: Avec interimResults: true, il faut continuous: false
   */
  continuous: false,

  /**
   * Redémarrage automatique
   * ❌ TESTÉ: true crée des coupures et perd des mots
   * ✅ TESTÉ: false fonctionne mieux (utilisateur contrôle)
   */
  autoRestart: false,

  /**
   * Délai avant redémarrage (en ms)
   * Utilisé seulement si autoRestart = true
   */
  restartDelay: 100,

  /**
   * Ignorer l'erreur "no-speech" (silence détecté)
   * true = ne pas afficher d'erreur pour le silence
   */
  ignoreNoSpeechError: true,
} as const;

/**
 * Messages d'erreur personnalisés
 */
export const VOICE_RECOGNITION_ERRORS = {
  'no-speech': 'Aucune parole détectée',
  'audio-capture': 'Impossible d\'accéder au microphone',
  'not-allowed': 'Permission microphone refusée',
  'network': 'Erreur réseau',
  'aborted': 'Reconnaissance interrompue',
  'service-not-allowed': 'Service de reconnaissance non autorisé',
} as const;

/**
 * Limites connues de Web Speech API
 */
export const VOICE_RECOGNITION_LIMITATIONS = {
  /**
   * Durée maximale avant arrêt automatique (estimation)
   */
  maxContinuousDuration: 15000, // 15 secondes

  /**
   * Délai de silence avant arrêt (estimation)
   */
  silenceTimeout: 3000, // 3 secondes

  /**
   * Navigateurs supportés
   */
  supportedBrowsers: ['Chrome', 'Edge', 'Safari (partiel)'],

  /**
   * Navigateurs NON supportés
   */
  unsupportedBrowsers: ['Firefox', 'Safari iOS'],
} as const;
