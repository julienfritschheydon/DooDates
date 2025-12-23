/**
 * AI Night Tester - Configuration
 * 
 * Configuration for the autonomous AI testing agent
 */

export const config = {
    // Ollama settings
    ollama: {
        baseUrl: 'http://localhost:11434',
        model: 'qwen2.5:0.5b',
        timeout: 30000, // 30s is plenty for this tiny model
    },

    // Test duration
    duration: {
        default: 8 * 60 * 60 * 1000, // 8 hours in ms
        short: 30 * 60 * 1000,       // 30 minutes
        debug: 5 * 60 * 1000,        // 5 minutes
    },

    // Application settings
    app: {
        baseUrl: process.env.BASE_URL || 'http://localhost:8080/DooDates',
        startPages: [
            '/',
            '/date-polls',
            '/form-polls',
            '/availability-polls',
        ],
    },

    // Test behavior
    behavior: {
        maxActionsPerPage: 10,        // Force navigate after N actions on same page
        screenshotOnEveryAction: false,
        screenshotOnIssue: true,
        waitBetweenActions: 1000,     // 1s between actions
        maxConsecutiveErrors: 5,      // Stop if too many errors in a row
        excludeText: ['Login', 'Sign in', 'Se connecter', 'Connexion', 'Sign up', 'S\'inscrire', 'Activer le micro', 'micro', 'Joindre un fichier', 'Attach file', 'Prendre une photo', 'Fichier (photo/PDF)', 'Fichier', 'Upload'], // Avoid auth and blocking actions
        // Randomly switch screen sizes
        randomizeViewport: true,
    },

    // Screen sizes (Viewports)
    viewports: [
        { name: 'Desktop', width: 1280, height: 800, isMobile: false },
        { name: 'Tablet', width: 768, height: 1024, isMobile: false },
        { name: 'Mobile', width: 375, height: 667, isMobile: true },
    ],

    // User Personas
    personas: [
        {
            id: 'new_user',
            name: 'The New User',
            description: 'Unfamiliar with the interface, reads carefully, hesitates.',
            frustrationTolerance: 'low',
        },
        {
            id: 'power_user',
            name: 'The Power User',
            description: 'Moves fast, uses keyboard shortcuts, expects efficiency.',
            frustrationTolerance: 'high',
        },
        {
            id: 'mobile_user',
            name: 'The Mobile User',
            description: 'Simulates mobile constraints (though running on desktop), hates small buttons.',
            frustrationTolerance: 'medium',
        },
    ],

    // Testing Missions
    missions: [
        {
            id: 'create_date_poll',
            name: 'Le Créateur (Sondage Dates)',
            personaId: 'power_user',
            goal: 'Suis cette séquence logique : 1. Va sur "/date-polls". 2. Clique sur "Créer mon sondage". 3. Dans le chat, tape "Organiser un apéro vendredi soir". 4. Sélectionne 2 ou 3 dates sur le calendrier. 5. Clique sur "Continuer" jusqu\'à la page de partage.',
            successCondition: '/poll/',
        },
        {
            id: 'create_form_poll',
            name: 'Le Créateur (Formulaire)',
            personaId: 'power_user',
            goal: 'Suis cette séquence logique : 1. Va sur "/form-polls". 2. Clique sur "Créer un formulaire". 3. Tape "Questionnaire de satisfaction" dans le chat IA. 4. Clique sur "Ajouter" pour valider la création du formulaire. 5. Vérifie que les questions apparaissent.',
            successCondition: '/workspace/form',
        },
        {
            id: 'vote_flow',
            name: 'Le Votant (Parcours complet)',
            personaId: 'new_user',
            goal: 'Simule un votant réel : 1. Trouve un sondage accessible (ou va sur "/poll/demo" si dispo). 2. Saisis ton nom "AI Tester". 3. Coche des options disponibles. 4. Valide ton vote. 5. Vérifie la confirmation.',
            successCondition: 'Merci pour votre vote',
        },
        {
            id: 'create_and_play_quiz',
            name: 'Le Candidat (Quiz)',
            personaId: 'new_user',
            goal: 'Crée et joue un quiz complet : 1. Va sur "/quizz/workspace". 2. Tape "Crée un quizz sur les Capitales" dans le chat. 3. Clique sur "Créer" ou "Finaliser". 4. Lance le jeu ("Play"). 5. Entre ton nom "Quiz Master". 6. Réponds aux questions jusqu\'à voir ton score.',
            successCondition: 'Score',
        },
        {
            id: 'create_availability_poll',
            name: 'Le Planificateur - Availability',
            personaId: 'power_user',
            goal: '1. Go to /availability-polls/workspace/availability, 2. Fill title "Team Sync", 3. Add availability options, 4. Click "Créer le sondage", 5. Click "Voir le sondage" (Eye icon) to open poll, 6. Click "M\'inscrire comme participant" or fill name, 7. Select slots, 8. Click "Envoyer mes disponibilités".',
            successCondition: '/poll/'
        },
        {
            id: 'vote_flow_dashboard',
            name: 'Le Votant - Dashboard',
            personaId: 'new_user',
            goal: '1. Go to /form-polls/dashboard, 2. Find a poll in the list (or create one if empty), 3. Click the "Tester" button (Eye icon) on a poll card, 4. Answer the questions, 5. Submit the form.',
            successCondition: 'Merci'
        },
        {
            id: 'explore_docs',
            name: 'L\'Apprenti - Docs',
            personaId: 'new_user',
            goal: '1. Go to /docs, 2. Click on "Guide de démarrage", 3. Read about Polls, 4. Click on "Date Polls", 5. Click on "Settings".',
            successCondition: '/docs'
        },
    ],

    // Routes to test (priority order)
    priorityRoutes: [
        // Landing pages
        '/date-polls',
        '/form-polls',
        '/availability-polls',
        // Workspaces
        '/date-polls/workspace/date',
        '/form-polls/workspace/form',
        '/availability-polls/workspace/availability',
        // Dashboards
        '/date-polls/dashboard',
        '/form-polls/dashboard',
        '/availability-polls/dashboard',
        // Settings
        '/date-polls/settings',
        '/form-polls/settings',
        '/availability-polls/settings',
        // Documentation
        '/date-polls/docs',
        '/form-polls/docs',
        '/availability-polls/docs',
        // Quizz
        '/quizz',
    ],

    // Output paths
    output: {
        reportsDir: './scripts/ai-night-tester/reports',
        screenshotsDir: './scripts/ai-night-tester/reports/screenshots',
    },
};

export type Config = typeof config;
