/**
 * AI Night Tester - Configuration
 *
 * Configuration for the autonomous AI testing agent
 */

export const config = {
  // Ollama settings
  ollama: {
    baseUrl: "http://localhost:11434",
    fastModel: "qwen2.5:0.5b", // Very fast for navigation
    deepModel: "gemma2:2b", // Smarter for issue analysis
    timeout: 60000,
  },

  // Test duration
  duration: {
    default: 8 * 60 * 60 * 1000, // 8 hours in ms
    short: 30 * 60 * 1000, // 30 minutes
    debug: 5 * 60 * 1000, // 5 minutes
  },

  // Application settings
  app: {
    baseUrl: process.env.BASE_URL || "https://julienfritschheydon.github.io/DooDates",
    startPages: ["/date", "/form", "/availability", "/quizz"],
  },

  // Test behavior
  behavior: {
    maxActionsPerPage: 10, // Force navigate after N actions on same page
    screenshotOnEveryAction: false,
    screenshotOnIssue: true,
    waitBetweenActions: 500, // 0.5s between actions (was 1s)
    maxConsecutiveErrors: 5, // Stop if too many errors in a row
    excludeText: [
      "Login",
      "Sign in",
      "Se connecter",
      "Connexion",
      "Sign up",
      "S'inscrire",
      "Activer le micro",
      "micro",
      "Joindre un fichier",
      "Attach file",
      "Prendre une photo",
      "Fichier (photo/PDF)",
      "Fichier",
      "Upload",
      "Passer à Pro",
      "Nous contacter",
      "Informations sur la confidentialité",
      "Email",
      "Français",
      "Anglais",
      "English",
      "French",
      "Language",
      "Langue",
      "Mentions légales",
      "Conditions d'utilisation",
      "Privacy Policy",
      "Cookie",
    ], // Avoid auth, blocking actions, and distractions
    // Randomly switch screen sizes
    randomizeViewport: false, // Disabled for stability during LLM heavy runs
  },

  // Screen sizes (Viewports)
  viewports: [
    { name: "Desktop", width: 1280, height: 800, isMobile: false },
    { name: "Tablet", width: 768, height: 1024, isMobile: false },
    { name: "Mobile", width: 375, height: 667, isMobile: true },
  ],

  // User Personas
  personas: [
    {
      id: "new_user",
      name: "The New User",
      description: "Unfamiliar with the interface, reads carefully, hesitates.",
      frustrationTolerance: "low",
    },
    {
      id: "power_user",
      name: "The Power User",
      description: "Moves fast, uses keyboard shortcuts, expects efficiency.",
      frustrationTolerance: "high",
    },
    {
      id: "mobile_user",
      name: "The Mobile User",
      description: "Simulates mobile constraints (though running on desktop), hates small buttons.",
      frustrationTolerance: "medium",
    },
  ],

  // Testing Missions
  missions: [
    /* 
        {
            id: 'create_date',
            name: 'Le Créateur (Sondage Dates)',
            personaId: 'power_user',
            goal: 'Suis cette séquence logique : 1. Va sur "/date". 2. Clique sur "Créer mon sondage". 3. Dans le chat, tape "Organiser un apéro vendredi soir". 4. Sélectionne 2 ou 3 dates sur le calendrier. 5. Clique sur "Continuer" jusqu\'à la page de partage.',
            successCondition: '/poll/',
        },
        {
            id: 'create_form',
            name: 'Le Créateur (Formulaire)',
            personaId: 'power_user',
            goal: 'Suis cette séquence logique : 1. Va sur "/form". 2. Clique sur "Créer un formulaire". 3. Tape "Questionnaire de satisfaction" dans le chat IA. 4. Clique sur "Ajouter" pour valider la création du formulaire. 5. Vérifie que les questions apparaissent.',
            successCondition: '/workspace/form',
        },
        */
    {
      id: "vote_flow",
      name: "Le Votant (Parcours complet)",
      personaId: "new_user",
      goal: 'Simule un votant réel : 1. Trouve un sondage accessible (ou va sur "/poll/demo" si dispo). 2. Saisis ton nom "AI Tester". 3. Coche des options disponibles. 4. Valide ton vote. 5. Vérifie la confirmation.',
      successCondition: "Merci pour votre vote",
    },
    /*
        {
            id: 'create_and_play_quiz',
            name: 'Le Candidat (Quiz)',
            personaId: 'new_user',
            goal: 'Crée et joue un quiz complet : 1. Va sur "/quizz/workspace". 2. Tape "Crée un quizz sur les Capitales" dans le chat. 3. Clique sur "Créer" ou "Finaliser". 4. Lance le jeu ("Play"). 5. Entre ton nom "Quiz Master". 6. Réponds aux questions jusqu\'à voir ton score.',
            successCondition: 'Score',
        },
        {
            id: 'create_availability',
            name: 'Le Planificateur - Availability',
            personaId: 'power_user',
            goal: '1. Go to /availability/workspace/availability, 2. Fill title "Team Sync", 3. Add availability options, 4. Click "Créer le sondage", 5. Click "Voir le sondage" (Eye icon) to open poll, 6. Click "M\'inscrire comme participant" or fill name, 7. Select slots, 8. Click "Envoyer mes disponibilités".',
            successCondition: '/poll/'
        },
        */
    {
      id: "vote_flow_dashboard",
      name: "Le Votant - Dashboard",
      personaId: "new_user",
      goal: '1. Go to /form/dashboard, 2. Find a poll in the list (or create one if empty), 3. Click the "Tester" button (Eye icon) on a poll card, 4. Answer the questions, 5. Submit the form.',
      successCondition: "Merci",
    },
    {
      id: "explore_docs",
      name: "L'Apprenti - Docs",
      personaId: "new_user",
      goal: '1. Go to /docs, 2. Click on "Guide de démarrage", 3. Read about Polls, 4. Click on "Date Polls", 5. Click on "Settings".',
      successCondition: "/docs",
    },
    {
      id: "data_control_check",
      name: "L'Auditeur Data RGPD",
      personaId: "power_user",
      goal: 'Visite la page "/data-control" (Data Control). 1. Vérifie que la page charge sans erreur console. 2. Identifie les boutons d\'export ("Exporter mes données"). 3. Identifie les zones de suppression ("Supprimer mon compte"). 4. Ne clique PAS sur supprimer, mais vérifie la présence des modales de confirmation.',
      successCondition: "/data-control",
    },
    {
      id: "vote_access_public",
      name: "Le Visiteur Public (Vote)",
      personaId: "new_user",
      goal: "Teste l'accès public aux votes. 1. Accède à une URL de vote connue (ex: \"/poll/demo-vote\" ou via un lien Dashboard). 2. Vérifie que la page est accessible sans login. 3. Tente une interaction simple (clic sur une option). 4. Vérifie que l'UI réagit (sélection visible).",
      successCondition: "option",
    },
  ],

  // Product groups for sequential testing (Date → Form → Availability → Quizz)
  productGroups: [
    {
      id: "date",
      name: "Sondages de Dates",
      routes: ["/date", "/date/workspace/date", "/date/dashboard", "/date/settings", "/date/docs"],
    },
    {
      id: "form",
      name: "Formulaires",
      routes: ["/form", "/form/workspace/form", "/form/dashboard", "/form/settings", "/form/docs"],
    },
    {
      id: "availability",
      name: "Disponibilités",
      routes: [
        "/availability",
        "/availability/workspace/availability",
        "/availability/dashboard",
        "/availability/settings",
        "/availability/docs",
      ],
    },
    {
      id: "quizz",
      name: "Quiz",
      routes: ["/quizz", "/quizz/create"],
    },
  ],

  // Routes to test (priority order) - flattened from productGroups
  priorityRoutes: [
    // Landing pages
    "/date",
    "/form",
    "/availability",
    // Workspaces
    "/date/workspace/date",
    "/form/workspace/form",
    "/availability/workspace/availability",
    // Dashboards
    "/date/dashboard",
    "/form/dashboard",
    "/availability/dashboard",
    // Settings
    "/date/settings",
    "/form/settings",
    "/availability/settings",
    // Documentation
    "/date/docs",
    "/form/docs",
    "/availability/docs",
    // Quizz
    "/quizz",
  ],

  // Output paths
  output: {
    reportsDir: "./scripts/ai-night-tester/reports",
    screenshotsDir: "./scripts/ai-night-tester/reports/screenshots",
  },
};

export type Config = typeof config;
