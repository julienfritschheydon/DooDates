# Technical Bible: Disponibilités

## Écran : landing
## Documentation Interne: Composant `LandingPage` (Disponibilités)

### 1. Objectif du Composant

Le composant `LandingPage` sert de page d'accueil (landing page) pour le produit "Disponibilités". Son rôle est de présenter de manière engageante les fonctionnalités clés du produit, d'expliquer son fonctionnement succinctement et d'inciter l'utilisateur à créer sa première disponibilité.

### 2. Fonctionnalités Réelles & Visibles (Analyse Code + Capture d'Écran)

La `LandingPage` est structurée en plusieurs sections distinctes, chacune ayant un objectif précis :

*   **En-tête de Navigation Simplifié:**
    *   **Visuel:** Le logo du produit "Availability" (icône d'horloge stylisée et texte) est affiché.
    *   **Code:** Intégré dans la `<header>` de la page. L'icône `Clock` de `lucide-react` est utilisée.
    *   **Sidebar:** La `ProductSidebar` est auto-suffisante et gère son propre état d'ouverture/fermeture, affichant un menu hamburger à gauche. L'état `sidebarOpen` est utilisé pour ajuster le `padding-top` de la section Hero, assurant une cohérence visuelle lorsque la sidebar est ouverte ou fermée.

*   **Section Hero (Présentation Principale):**
    *   **Visuel:** Contient un badge "Synchronisation intelligente", un titre accrocheur ("Vos agendas, enfin synchronisés" avec un gradient de couleurs sur "enfin synchronisés"), une description concise et un bouton d'appel à l'action.
    *   **Code:**
        *   Badge avec icône `Sparkles`.
        *   Titre principal `<h1>` utilisant `bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent` pour l'effet de texte dégradé.
        *   Bouton CTA (`ProductButton` de type `primary` et `size="lg"`) qui navigue vers `/create/availability` lors du clic.
        *   Animation de fade-in et slide-up contrôlée par l'état `heroVisible` via un `setTimeout`.

*   **Aperçu Visuel (Grille Semainière - Mockup):**
    *   **Visuel:** Directement sous la section Hero, une grille stylisée représentant une semaine typique (jours, heures) avec des créneaux marqués comme "Disponible" et des créneaux "Commun" (en surbrillance verte). Une légende explicative est présente en dessous.
    *   **Code:**
        *   Il s'agit d'une **maquette visuelle statique** implémentée avec une grille CSS (`grid grid-cols-8`).
        *   Les créneaux sont générés par un `map` sur les jours et les heures.
        *   Des conditions (`isAvailable`, `isOverlap`) définissent le style des cases (`bg-emerald-500/15` pour disponible, `bg-emerald-500/40 border border-emerald-500` pour commun), simulant un calendrier visuel sans interactivité.
        *   Animation de fade-in et slide-up retardée, dépendant de `heroVisible`.

*   **Section Caractéristiques (Points Forts):**
    *   **Visuel:** Présente trois cartes décrivant les avantages clés du produit (Vue semaine intuitive, Superposition visuelle, Fuseaux horaires), chacune avec une icône distinctive et un gradient de couleur.
    *   **Code:**
        *   Utilise un `grid md:grid-cols-3` pour l'affichage des cartes.
        *   Chaque carte possède un arrière-plan en dégradé (`bg-gradient-to-br`) et une icône de `lucide-react`.
        *   Les cartes bénéficient d'une animation "staggered" (décalée dans le temps) grâce au hook `useStaggeredAnimation`.

*   **Section Cas d'Utilisation:**
    *   **Visuel:** Deux colonnes : une liste d'exemples d'utilisation (Réunions d'équipe, Cours, Entretiens) avec des emojis et des descriptions, et une illustration visuelle montrant la disponibilité de plusieurs participants.
    *   **Code:**
        *   Utilise un `grid md:grid-cols-2`.
        *   La partie illustration simule une vue de participants avec des barres de progression et un résumé des créneaux communs trouvés.

*   **Appel à l'Action Final:**
    *   **Visuel:** Un titre incitatif, une description et un bouton CTA final, similaire à celui de la section Hero.
    *   **Code:** Utilise le même `ProductButton` et navigue vers la même route (`/create/availability`).

*   **Effets de Fond:**
    *   **Visuel:** Un motif de points subtil et des orbes lumineuses en dégradé en arrière-plan, contribuant à l'ambiance visuelle du site.
    *   **Code:** Éléments `fixed inset-0 pointer-events-none` avec des styles `backgroundImage` et des `div` pour les orbes, utilisant `bg-emerald-500/10`, `rounded-full`, et `blur`.

### 3. Composants React Utilisés

*   **`ProductSidebar` (`@/components/layout/products/ProductSidebar`)**: Gère la navigation latérale spécifique au produit, incluant le bouton hamburger. `productType="availability"` est passé en prop.
*   **`ProductButton` (`@/components/products/ProductButton`)**: Composant de bouton réutilisable avec des variantes de rôle et de taille, utilisé pour les principaux appels à l'action.
*   **`Footer` (`@/components/shared/Footer`)**: Composant de pied de page standard.
*   **Icônes Lucide-React**: `Clock`, `ArrowRight`, `Users`, `Zap`, `Sparkles`, `CheckCircle2`, `Calendar`, `MousePointer`, `CalendarDays`, `Layers`, `Globe` sont importées et utilisées pour enrichir visuellement l'interface.
*   **`cn` (`@/lib/utils`)**: Utilitaire pour fusionner et conditionner les classes CSS (équivalent à `clsx` ou `classnames`).

### 4. Logique & Animations

*   **`useStaggeredAnimation(itemCount, delay)` (Custom Hook)**:
    *   **Rôle:** Ce hook gère l'animation séquentielle d'éléments. Il prend le nombre d'éléments (`itemCount`) et un délai (`delay`) entre chaque apparition.
    *   **Mécanisme:** Il initialise un tableau d'états `visibleItems` à `false`. Dans un `useEffect`, il parcourt chaque élément et programme un `setTimeout` pour changer son état à `true` après un délai progressif (`i * delay`).
    *   **Application:** Utilisé pour les cartes de fonctionnalités (`featureVisible`) et les étapes (`stepVisible`), créant un effet d'apparition fluide et décalé.

*   **`heroVisible` (État)**:
    *   **Rôle:** Contrôle la visibilité et l'animation d'entrée de la section Hero.
    *   **Mécanisme:** Un `useEffect` déclenche un `setTimeout` de 100ms après le montage initial pour passer `heroVisible` à `true`, permettant aux éléments de la section Hero de s'animer (`opacity-0 -> opacity-100`, `translate-y-8 -> translate-y-0`).

*   **`sidebarOpen` (État)**:
    *   **Rôle:** Gère l'état d'ouverture/fermeture de la barre latérale. Bien que la `ProductSidebar` soit auto-suffisante, l'état est maintenu localement pour ajuster le `padding-top` de la section Hero (`sidebarOpen ? "pt-20" : "pt-6"`), évitant un chevauchement visuel lorsque la sidebar est ouverte et pousse le contenu.

*   **Navigation**: La fonction `useNavigate` de `react-router-dom` est utilisée pour rediriger l'utilisateur vers la page de création d'une disponibilité (`/create/availability`) via les boutons CTA.

### 5. Cohérence Visuelle

Le design de la `LandingPage` est hautement cohérent et utilise des principes esthétiques modernes :

*   **Palette de Couleurs:** Une dominante de couleurs sombres (`#030712`) contrastée par des accents lumineux de verts et turquoises (émeraude, teal, cyan) pour les éléments interactifs, les dégradés et les surbrillances. Cela crée une ambiance technologique et apaisante.
*   **Typographie:** Utilisation de polices sans empattement, fortes et expressives (`font-bold`, `tracking-tight`), avec des tailles généreuses pour les titres. L'effet `bg-clip-text text-transparent` sur les titres majeurs ajoute une touche de modernité.
*   **Éléments Graphiques:**
    *   **Dégradés:** Abondamment utilisés pour les fonds de badges, les icônes des caractéristiques, les boutons CTA et les orbes de fond, conférant profondeur et dynamisme.
    *   **Coins Arrondis:** Très présents (`rounded-lg`, `rounded-full`, `rounded-2xl`) pour adoucir l'interface.
    *   **Ombres (`shadow-lg`)**: Utilisées pour donner du relief aux éléments interactifs comme les boutons.
    *   **Flou (`backdrop-blur-sm`, `blur-[...]`)**: Appliqué pour créer des effets de transparence et de profondeur subtils, notamment sur les cartes et les orbes de fond.
*   **Animations:** Les animations de fade-in, slide-up et les animations "staggered" contribuent à une expérience utilisateur fluide et engageante, rendant l'interface plus vivante et interactive.
*   **Maquette de Grille:** La représentation visuelle de la grille de disponibilité est claire et intuitive, utilisant des codes couleurs distincts pour "disponible" et "commun", facilitant la compréhension du concept en un coup d'œil.

### 6. Remarques Techniques

*   **Styling:** Utilisation exclusive de [Tailwind CSS](https://tailwindcss.com/) pour le stylisme, appliqué directement via des `className` pour une maintenance simplifiée et une clarté du code.
*   **Structure HTML Sémantique:** La page utilise des balises sémantiques (`<header>`, `<section>`, `<h1>`, `<p>`, `<footer>`) pour améliorer l'accessibilité et la structure du document.
*   **Performance des Animations:** L'utilisation de `opacity` et `translate` (via les classes Tailwind `translate-y-`) pour les animations est optimisée pour le GPU, offrant des transitions fluides. Les `setTimeout` sont gérés par `clearTimeout` dans les `useEffect` pour éviter les fuites de mémoire.
*   **Responsivité:** La structure utilise des classes comme `md:grid-cols-3` et `sm:flex-row` pour s'adapter aux différentes tailles d'écran.
*   **Réutilisabilité:** L'utilisation de composants comme `ProductButton`, `ProductSidebar` et `Footer` favorise la réutilisabilité et la cohérence de l'interface à travers l'application.

## Écran : dashboard
Cette documentation interne détaille l'implémentation et les fonctionnalités de l'écran "Disponibilités" (tableau de bord) basé sur le code source React fourni et la capture d'écran.

---

## Documentation Technique : Écran 'Disponibilités' (Dashboard)

### 1. Architecture Générale & Composants React

L'écran des "Disponibilités" est construit autour d'une architecture modulaire React, utilisant des composants génériques pour une meilleure réutilisabilité à travers différentes fonctionnalités du produit.

*   **`AvailabilityPollsDashboard` (Composant Racine):**
    *   Ce composant est le point d'entrée pour l'affichage du tableau de bord des sondages de disponibilité.
    *   Il établit la structure principale de la page grâce à une `div` utilisant Flexbox (`className="flex min-h-screen bg-gray-50"`), organisant la barre latérale et le contenu principal.
    *   Bien que `bg-gray-50` suggère un fond clair, l'interface utilisateur affichée est en mode sombre, ce qui indique que des styles globaux ou des thèmes sont appliqués au niveau supérieur ou que les composants enfants appliquent leur propre arrière-plan sombre.

*   **`ProductSidebar` (Barre Latérale de Navigation):**
    *   Intégré sur le côté gauche de l'écran, ce composant est responsable de la navigation principale.
    *   Il est configuré avec la prop `productType="availability"`, ce qui lui permet d'afficher les options de menu spécifiques aux sondages de disponibilité.
    *   Le commentaire du code (`Sidebar auto-suffisante avec son hamburger`) confirme qu'il gère son propre état d'ouverture/fermeture et inclut l'icône de menu (hamburger) visible en haut à gauche de la capture d'écran.

*   **`ProductDashboard` (Contenu Principal du Tableau de Bord):**
    *   Ce composant générique est le conteneur du contenu principal du tableau de bord.
    *   Comme `ProductSidebar`, il reçoit la prop `productType="availability"`, ce qui lui permet d'adapter son contenu et ses fonctionnalités pour gérer spécifiquement les "disponibilités".
    *   Il est responsable de l'affichage de l'en-tête, de la barre d'information des crédits, de la barre de recherche, des filtres, des options d'affichage, et de l'état vide ou de la liste des éléments de disponibilité.

### 2. Fonctionnalités Clés & Composants Visuels

Le `ProductDashboard` (dans le contexte `productType="availability"`) intègre les fonctionnalités et éléments visuels suivants :

*   **En-tête du Tableau de Bord:**
    *   **Titre:** "Vos Disponibilités".
    *   **Sous-titre:** "Gérez vos sondages de disponibilité."
    *   Ces éléments sont statiques et décrivent la section actuelle.

*   **Barre d'Information des Crédits (`InfoBar` / `UsageTracker`):**
    *   Située sous l'en-tête, cette barre met en évidence l'utilisation des ressources.
    *   **Indicateur d'utilisation:** "0/100 crédits utilisés" avec une barre de progression visuelle (actuellement vide).
    *   **Action/Information:** Un message contextuel "Créez un compte pour synchroniser vos données".
    *   **Liens d'action:** Boutons/liens "Journal" (probablement pour l'historique d'utilisation) et "En savoir plus" (documentation ou aide).
    *   Visuellement, elle se distingue par un fond vert distinctif et des icônes explicites.

*   **Barre de Recherche (`SearchBar`):**
    *   Un champ de saisie (`input` stylisé) avec le placeholder "Rechercher une conversation ou un sondage...".
    *   Elle permet aux utilisateurs de filtrer rapidement les sondages affichés.
    *   Une icône de loupe est intégrée à gauche du champ.

*   **Options de Filtrage & Affichage (`FilterTabs` / `ViewToggle`):**
    *   **Filtres par statut:** Une série de boutons de type "onglets" pour filtrer les sondages : "Tous", "Brouillon", "Actif", "Terminé", "Archivé", "Tags", "Tous les dossiers". Le filtre "Tous" est actuellement actif, souligné par une couleur de fond verte.
    *   **Options d'affichage:** Deux icônes en haut à droite de cette section permettent de basculer entre différentes vues (ex: vue grille / vue liste) pour les sondages.

*   **État Vide (`EmptyState`):**
    *   Actuellement, le tableau de bord affiche un état vide car aucune disponibilité n'a été créée.
    *   **Icône centrale:** Une grande icône d'horloge suggère l'idée de planification ou d'attente.
    *   **Message principal:** "Aucune disponibilité".
    *   **Message secondaire:** "Créez votre première disponibilité pour commencer".
    *   **Bouton d'action:** Un bouton primaire prominent "Créer une disponibilité" de couleur verte invite l'utilisateur à initier la création d'un sondage.

### 3. Cohérence Visuelle

L'interface présente une cohérence visuelle forte, orientée vers un thème sombre et une utilisation stratégique des couleurs :

*   **Thème Sombre (Dark Mode):** Le tableau de bord utilise des arrière-plans sombres (presque noirs) pour le conteneur principal et des nuances plus claires de gris foncé pour les panneaux secondaires (ex: la zone de contenu principal, la barre de recherche, les filtres inactifs). Cela assure un contraste élevé et une lisibilité optimale du texte.
*   **Couleur d'Accentuation (Vert):** La couleur verte est utilisée pour les éléments interactifs et les indicateurs d'état positifs. On la retrouve sur :
    *   Le bouton d'action principal "Créer une disponibilité".
    *   La barre de progression et le fond de la barre d'information des crédits.
    *   L'état actif des filtres (ici "Tous").
    *   Les icônes liées à l'information et aux actions.
*   **Typographie & Iconographie:** Une police de caractères claire et moderne est utilisée, avec une hiérarchie visuelle marquée par la taille et le poids. L'iconographie est minimaliste et fonctionnelle, renforçant la compréhension des actions et des états.

---

## Écran : create
### Documentation Technique Interne : Création d'un Sondage de Disponibilités

**Contexte :**
L'écran "Créer un Sondage Disponibilités" permet aux utilisateurs de configurer et de lancer un nouveau sondage pour recueillir les disponibilités de leurs clients, afin de proposer des créneaux optimaux. Cette interface est une étape clé dans le flux de gestion des rendez-vous et des événements.

**Structure des Composants React :**

1.  **`AvailabilityWorkspace` (./pages/availability/index.tsx)**
    *   **Rôle :** Point d'entrée de la fonctionnalité de création de sondage de disponibilités. Agit comme un composant conteneur minimal.
    *   **Implémentation :**
        ```typescript
        import React from "react";
        import WorkspaceLayout from "@/components/layout/WorkspaceLayout";

        const AvailabilityWorkspace: React.FC = () => {
          return <WorkspaceLayout productType="availability" />;
        };

        export default AvailabilityWorkspace;
        ```
    *   **Analyse :** Ce composant ne contient pas la logique ou l'UI spécifique du formulaire de création. Il délègue l'affichage de l'ensemble de la page au composant `WorkspaceLayout`, en lui passant une prop `productType` de valeur `"availability"`. Cela indique que `WorkspaceLayout` est responsable de la structure globale de l'interface (navigation, en-tête, pied de page) et du rendu conditionnel du contenu spécifique au type de produit.

2.  **`WorkspaceLayout` (./components/layout/WorkspaceLayout.tsx)**
    *   **Rôle :** (Déduit de l'utilisation) Composant de layout générique fournissant le cadre structurel de l'application (barre latérale de navigation - symbolisée par le hamburger menu en haut à gauche, zone de contenu principale, etc.). Il est probable que `WorkspaceLayout` utilise la prop `productType` pour décider quel contenu spécifique afficher dans sa zone principale, ou pour charger dynamiquement le composant de création de sondage.
    *   **Implémentation :** Non fournie, mais son rôle est de wrapper l'interface visible avec une mise en page cohérente.

**Analyse de l'Interface Utilisateur (Écran `create` des Disponibilités) :**

L'écran présente un formulaire modulaire et intuitif, intégré dans un thème sombre, mettant l'accent sur la clarté et l'organisation des informations.

1.  **Conteneur Principal du Formulaire :**
    *   Un `Card` ou un `Modal` centré, avec des bords arrondis et un fond sombre (`#272E3B`), contraste avec le fond général de l'application (`#1A1A1A`).
    *   **Composant React probable :** `<Card>` ou `<Modal>` (composant d'une bibliothèque UI interne ou externe).

2.  **En-tête du Formulaire :**
    *   **Titre :** "Créer un Sondage Disponibilités" (H2/H3), accompagné d'une icône de calendrier (`<CalendarIcon>`).
    *   **Description :** Texte explicatif concis ("Vos clients indiquent leurs disponibilités, vous proposez les créneaux optimaux.").
    *   **Composant React probable :** Un `<Header>` ou `<FormHeader>` personnalisé contenant un `<Icon>` et du texte.

3.  **Champs de Saisie du Sondage :**
    *   **Titre du sondage :**
        *   `Label` : "Titre du sondage *" (indique un champ obligatoire).
        *   `Input` type `text` avec un `placeholder` explicatif ("Ex: Planification rendez-vous - Novembre 2025").
        *   **Composant React probable :** `<Input label="Titre du sondage *" placeholder="..." required />`.
    *   **Description (optionnel) :**
        *   `Label` : "Description (optionnel)".
        *   `Textarea` avec un `placeholder` pertinent ("Ex: Indiquez vos disponibilités pour planifier notre prochain rendez-vous...").
        *   **Composant React probable :** `<Textarea label="Description (optionnel)" placeholder="..." optional />`.

4.  **Sections Interactives (Modules de Configuration) :**
    *   **Règles Intelligentes d'Optimisation :**
        *   Un bloc de contenu (`Card` ou `Panel`) intégrant une icône (étoile/étincelle), un titre, une description courte, et un bouton "Développer" avec une icône de chevron bas (`<ChevronDownIcon>`).
        *   **Fonctionnalité :** Indique une section déroulante/accordéon pour des options supplémentaires. Le libellé "Développer" suggère un état initialement replié.
        *   **Composant React probable :** `<CollapsiblePanel icon={<SparkleIcon />} title="..." description="..." defaultExpanded={false} />`.
    *   **Paramètres avancés :**
        *   Un bloc similaire avec une icône d'engrenage (`<SettingsIcon>`), un titre et une icône de chevron droit (`<ChevronRightIcon>`).
        *   **Fonctionnalité :** Indique une section cliquable qui pourrait soit dérouler plus d'options directement dans le formulaire, soit naviguer vers une nouvelle page/modal dédiée aux paramètres avancés. L'icône du chevron droit suggère plus souvent une navigation.
        *   **Composant React probable :** `<ClickablePanel icon={<SettingsIcon />} title="..." onClick={handleNavigateToAdvancedSettings} />`.

5.  **Boutons d'Action :**
    *   **Créer le sondage :**
        *   Bouton principal (couleur verte), avec une icône de coche (`<CheckIcon>`).
        *   **Composant React probable :** `<Button type="submit" variant="primary" icon={<CheckIcon />}>Créer le sondage</Button>`.
    *   **Enregistrer le brouillon :**
        *   Bouton secondaire (fond sombre, texte blanc), sans icône.
        *   **Composant React probable :** `<Button type="button" variant="secondary">Enregistrer le brouillon</Button>`.

**Cohérence Visuelle et Expérience Utilisateur (UX) :**

*   **Thème sombre :** L'interface adhère à un thème sombre cohérent, avec des contrastes subtils pour les éléments interactifs et les champs de formulaire.
*   **Typographie :** Utilisation uniforme d'une même police de caractères, avec des tailles et des graisses variées pour hiérarchiser l'information.
*   **Espacement et Alignement :** Les éléments sont bien espacés et alignés, facilitant la lecture et la navigation. L'utilisation d'un système de grille ou de classes d'espacement (ex: Tailwind CSS `gap-y-X`) est probable.
*   **Icônes :** Les icônes sont utilisées de manière significative pour renforcer la compréhension des actions et des sections.
*   **Interactivité :** Les sections d'optimisation et de paramètres avancés sont clairement identifiées comme interactives, permettant une UX progressive où les détails complexes peuvent être cachés jusqu'à ce que l'utilisateur souhaite les explorer.
*   **État des Boutons :** Des styles clairs distinguent l'action principale (`primary` / vert) de l'action secondaire (`secondary` / neutre).

