# Technical Bible: Sondages de Dates

## Écran : landing

## Documentation Technique Interne : Sondages de Dates (Landing Page)

Cette documentation détaille la structure technique et les choix de conception de la page d'atterrissage des "Sondages de Dates", en se basant sur le code React fourni et la capture d'écran de la section héro.

---

### 1. Technologies & Composants Clés

- **React (avec Hooks):** `useEffect`, `useState` pour la gestion de l'état local et des effets secondaires.
- **React Router DOM:** `useNavigate` et `Link` pour la navigation client-side.
- **Lucide React:** Bibliothèque d'icônes utilisée pour enrichir l'interface utilisateur (ex: `Calendar`, `Sparkles`, `ArrowRight`, `Users`, `Zap`, `CheckCircle2`).
- **Composants Internes:**
  - `ProductButton`: Composant générique pour les boutons d'action spécifiques aux produits.
  - `Footer`: Composant de pied de page partagé.
  - `ProductSidebar`: Barre latérale de navigation spécifique aux produits, gérant son propre état (ouverte/fermée).
- **Utilitaires:**
  - `cn` (alias de `clsx` ou `tailwind-merge`): Pour la fusion conditionnelle et optimisée des classes Tailwind CSS.
  - `useStaggeredAnimation`: Hook personnalisé pour l'animation séquentielle des éléments.
- **Styling:** Tailwind CSS est utilisé pour l'ensemble du style, avec une forte utilisation de dégradés et de pseudo-classes (`group-hover`).

---

### 2. Structure Générale de la Page

La `LandingPage` est architecturée comme une application React mono-page, divisée en deux zones principales via Flexbox :

1.  **`ProductSidebar`**: La barre latérale de navigation, auto-suffisante.
2.  **Contenu Principal**: Le reste de l'écran, prenant l'espace disponible (`flex-1`).

Le fond de page est un sombre `#030712`, avec des effets visuels intégrés pour une immersion.

---

### 3. Détail des Sections

#### 3.1. Effets de Fond (`Background Effects`)

- **Implémentation:** Un `div` `fixed inset-0 pointer-events-none` pour garantir que les effets sont purement visuels et n'interagissent pas avec l'utilisateur.
- **Motif de grille:** Généré avec des `linear-gradient` sur `background-image` et `background-size`, avec une faible opacité (`opacity-[0.02]`) pour un effet subtil et technique.
- **Orbes de dégradé:** Deux `div` positionnés absolument (`top-0 right-0`, `bottom-0 left-0`) avec des `bg-blue-500/10`, `bg-cyan-500/10`, `rounded-full` et `blur-[Xpx]` créent des halos lumineux discrets, ajoutant de la profondeur à l'interface.
- **Cohérence Visuelle:** Ces éléments contribuent à l'esthétique "dark mode", moderne et technologique de l'application.

#### 3.2. En-tête de Navigation (`header`)

- **Implémentation:** `border-b border-white/5` pour une séparation douce.
- **Logo / Nom du Produit:**
  - Un `div` carré avec un dégradé (`bg-gradient-to-br from-blue-500 to-cyan-400`) et une ombre (`shadow-lg shadow-blue-500/20`) encadre l'icône `Calendar` (Lucide, `w-5 h-5 text-white`).
  - Le texte "Date Polls" (`text-lg font-semibold tracking-tight`) affiche le nom du produit.
- **Cohérence Visuelle:** Le logo utilise la palette de couleurs principale (bleu/cyan), renforçant l'identité visuelle dès l'en-tête.

#### 3.3. Section Héro (`Hero Section`)

- **Implémentation:** Animée par l'état `heroVisible` et une transition `transition-all duration-700` avec un délai, offrant une apparition douce des éléments.
- **Badge:** `Planification intelligente` (`Sparkles` Lucide icon) dans un `div` stylisé (`px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm`). Met en avant un bénéfice clé.
- **Titre (`h1`):** "Trouvez la date parfaite". La partie "parfaite" utilise un dégradé (`bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400`) appliqué au texte via `bg-clip-text text-transparent`, créant un impact visuel fort et distinctif.
- **Description (`p`):** "Fini les allers-retours par email. Proposez des dates, laissez voter, et notre IA suggère le créneau idéal." Décrit clairement la proposition de valeur.
- **Bouton CTA (`ProductButton`):** "Créer un sondage" (`ArrowRight` icône Lucide). Navigue vers `/create/date`. Utilise un dégradé `bg-gradient-to-r from-blue-600 to-cyan-500` avec des effets de `hover` et `shadow` pour inciter à l'action.
- **Aperçu Visuel (Mockup de Calendrier):**
  - **Implémentation:** Apparaît avec un délai supplémentaire (`delay-300`) et une transition `duration-1000`.
  - Le mockup représente une interface de calendrier minimaliste dans un conteneur stylisé (`rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm`).
  - Des ronds "feux tricolores" (`w-3 h-3 rounded-full bg-red-500/60`) simulent les contrôles d'une fenêtre.
  - La grille affiche les jours de la semaine et des dates (`grid grid-cols-7 gap-2`). Les dates sélectionnées (5, 6) sont mises en évidence avec `bg-blue-500/20 text-blue-300 border border-blue-500/30`. Une date (le 11) montre une variante verte `bg-green-500/20` pour un potentiel créneau "idéal".
- **Concordance avec l'image:** La capture d'écran fournie correspond _exactement_ à cette section héro, y compris les effets de fond, le badge, le titre, la description, le bouton CTA et le mockup du calendrier.

#### 3.4. Section Fonctionnalités (`Features Section`)

- **Implémentation:** Utilise le hook `useStaggeredAnimation` pour une apparition décalée des 3 cartes de fonctionnalités (`featureVisible[i]`, `transitionDelay: `${i \* 100}ms`).
- **Titre:** "Simple. Rapide. Intelligent." avec "Intelligent." en dégradé bleu pour l'accentuation.
- **Structure:** Une grille `md:grid-cols-3 gap-6` pour présenter trois fonctionnalités clés.
- **Cartes de Fonctionnalités:**
  - Chaque carte (`div.group`) est une zone cliquable stylisée (`p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03]`) avec un effet de bordure coloré au survol (`hover:border-${feature.color}-500/20`).
  - **Icône:** `Calendar`, `Users`, `Zap` (Lucide) dans un cercle avec un fond semi-transparent et coloré (`bg-${feature.color}-500/10`), s'animant au survol (`group-hover:scale-110`).
  - **Contenu:** Titre (`h3`) et description (`p`).
- **Cohérence Visuelle:** Les couleurs dynamiques des icônes et des bordures au survol renforcent la modernité et l'interactivité de l'interface.

#### 3.5. Section "Comment ça marche" (`How it works`)

- **Implémentation:** Les étapes sont animées de manière décalée grâce à `useStaggeredAnimation` (`stepVisible[i]`, `transitionDelay: `${i \* 150}ms`).
- **Structure:** Une grille `md:grid-cols-2 gap-16 items-center` avec le texte des étapes à gauche et une illustration à droite.
- **Titre:** "3 étapes, zéro friction" avec "zéro friction" en dégradé cyan.
- **Étapes (à gauche):**
  - Chaque étape est numérotée (01, 02, 03) dans un cercle avec un dégradé (`bg-gradient-to-br from-blue-500 to-cyan-500`).
  - Titre (`h4`) et description (`p`) détaillant le processus.
- **Illustration (à droite):**
  - Un mockup de résultats de sondage est présenté dans un conteneur stylisé similaire aux autres cartes.
  - Il affiche un titre (`Réunion d'équipe - Janvier` avec l'icône `CheckCircle2`), et une liste d'options de dates avec le nombre de votes et des barres de progression.
  - La barre de progression est verte (`bg-green-500`) si le vote est à 100%, et bleue (`bg-blue-500`) sinon, simulant la désignation d'une date optimale.
- **Cohérence Visuelle:** Les dégradés et les styles des conteneurs sont repris, assurant une harmonie visuelle. L'illustration est un exemple concret de l'utilité du produit.

#### 3.6. CTA Final (`section.cta-final`)

- **Implémentation:** Similaire au CTA de la section héro.
- **Titre (`h2`):** "Prêt à simplifier vos planifications ?"
- **Description (`p`):** "Rejoignez des milliers d'équipes..."
- **Bouton CTA (`ProductButton`):** "Créer mon premier sondage — Gratuit". Navigue vers `/create/date`. Même style impactant que le bouton initial.

#### 3.7. Pied de Page (`Footer`)

- **Implémentation:** Utilise le composant générique `Footer`, assurant une cohérence à travers l'application.

---

### 4. Gestion des Animations

Le hook `useStaggeredAnimation` est central pour l'effet de "mise en scène" des éléments.

- Il prend en paramètre le nombre d'éléments et un délai.
- Il gère un état `visibleItems` (un tableau de booléens).
- Avec `useEffect`, il déclenche des `setTimeout` séquentiels pour mettre à jour l'état de visibilité de chaque élément, créant un effet d'apparition en cascade.
- Les classes `opacity-100 translate-y-0` (ou `translate-x-0`) combinées aux classes `opacity-0 translate-y-8` (ou `-translate-x-8`) sur les éléments, avec des transitions (`transition-all duration-X`), réalisent l'animation CSS.

---

### 5. Cohérence Visuelle et Branding

- **Palette de couleurs:** Dominance de bleu (`blue-500`, `blue-400`), cyan (`cyan-500`, `cyan-400`), et quelques touches de vert et de violet, le tout sur un fond sombre (`#030712`).
- **Dégradés:** Largement utilisés pour les titres, les boutons, les icônes et les fonds d'éléments, créant une esthétique moderne et dynamique.
- **Typographie:** Des polices claires et lisibles, avec des tailles et graisses variées pour hiérarchiser l'information.
- **Bordures et Ombres:** Des bordures fines (`border-white/5`) et des ombres subtiles donnent du relief aux composants.
- **Icônes:** Les icônes Lucide sont utilisées de manière cohérente avec la palette de couleurs, ajoutant une compréhension visuelle rapide.

---

### 6. Points Techniques Spécifiques

- **Gestion de la Sidebar:** Bien que la capture d'écran ne montre pas la sidebar ouverte en mode desktop (où elle est par défaut), le code inclut une logique `sidebarOpen ? "pt-20" : "pt-6"` pour ajuster le `padding-top` de la section héro, anticipant un comportement où la sidebar pourrait être masquée ou affichée, influençant le décalage vertical du contenu principal.
- **Navigation:** L'utilisation de `useNavigate` et `ProductButton` centralise la logique de navigation vers la page de création de sondage.

## Écran : dashboard

Voici la documentation technique interne pour l'écran "Sondages de Dates" du dashboard.

---

## Documentation Interne : Dashboard "Sondages de Dates"

### 1. Vue d'Ensemble du Composant `DatePollsDashboard`

Ce document décrit la structure et les fonctionnalités de l'interface utilisateur "Sondages de Dates", telle qu'implémentée par le composant React `DatePollsDashboard`. Ce composant sert de point d'entrée principal pour la gestion des sondages de dates et est conçu pour s'intégrer harmonieusement dans un écosystème de produits plus large.

**Fichier Source :** `DatePollsDashboard.tsx`

**Rôle :**
Le composant `DatePollsDashboard` est responsable de l'agencement global de la page des sondages de dates. Il combine une barre latérale de navigation (`ProductSidebar`) avec la zone de contenu principale du tableau de bord (`ProductDashboard`).

**Structure (code) :**

```jsx
// ... imports ...
const DatePollsDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50"> {/* Conteneur principal, flexbox pour sidebar/contenu */}
      <ProductSidebar productType="date" /> {/* Sidebar, spécifique aux "date" products */}
      <div className="flex-1"> {/* Contenu principal prenant l'espace restant */}
        <ProductDashboard productType="date" /> {/* Dashboard, spécifique aux "date" products */}
      </div>
    </div>
  );
};
export default DatePollsDashboard;
```

**Observation Thème :** Bien que le conteneur racine utilise `bg-gray-50`, la capture d'écran montre un thème sombre prédominant. Cela indique que le composant `ProductDashboard` (ou un thème global appliqué) est responsable de l'application de la palette de couleurs sombres pour son contenu, superposant ou remplaçant le fond par défaut du wrapper.

### 2. Composants React Utilisés et Leurs Rôles

Le `DatePollsDashboard` orchestre deux composants principaux, chacun recevant une prop `productType` pour adapter son contenu et son comportement.

#### 2.1. `ProductSidebar`

- **Chemin Infére :** `src/components/layout/products/ProductSidebar.tsx`
- **Description :** Composant de navigation latérale. Bien qu'il ne soit pas visiblement ouvert sur la capture, la présence de l'icône "hamburger" en haut à gauche confirme son intégration. Il est conçu pour être "auto-suffisant" et gérer son état (ouvert/fermé).
- **Prop `productType="date"` :** Cette prop est cruciale pour que la sidebar affiche les liens et options de navigation spécifiques aux "Sondages de Dates", assurant une expérience utilisateur contextuelle.
- **Fonctionnalité Observée :** Accès à la navigation principale et aux réglages contextuels (implicite).

#### 2.2. `ProductDashboard`

- **Chemin Infére :** `src/components/products/ProductDashboard.tsx`
- **Description :** Ce composant constitue l'intégralité de la zone de contenu principale visible sur la capture d'écran. Il est chargé d'afficher le titre, les informations de compte, les filtres et la liste des sondages (ou l'état vide).
- **Prop `productType="date"` :** Indique au dashboard qu'il doit afficher et gérer les données relatives aux sondages de dates.

**Sections Détailées du `ProductDashboard` (selon la capture) :**

1.  **En-tête du Dashboard :**
    - **Titre Principal :** `Vos Sondages de Dates` (balise `<h1>` ou similaire).
    - **Sous-titre / Description :** `Gérez vos sondages et planifiez vos événements.` (balise `<p>` ou similaire).

2.  **Barre d'Informations / Crédits :**
    - Un bandeau informatif indiquant l'utilisation des crédits.
    - **Jauge de Crédits :** `0/100 crédits utilisés` (probablement un composant `ProgressBar` ou `UsageMeter` interne).
    - **Appel à l'Action (CTA) :** `Créez un compte pour synchroniser vos données`.
    - **Actions Secondaires :** Boutons/Liens `Journal` et `En savoir plus` (menant à des pages d'aide ou de détails).

3.  **Barre de Recherche et Options d'Affichage :**
    - **Champ de Recherche :** Input text avec placeholder `Rechercher une conversation ou un sondage...` (composant `SearchInput`).
    - **Options de Mise en Page :** Deux icônes (grid et liste) permettant de basculer entre différentes vues des sondages. Il s'agit probablement de boutons d'état (`ToggleButtonGroup` ou équivalent) qui modifient l'affichage du contenu listé.

4.  **Filtres et Catégories :**
    - Un ensemble de boutons de filtre permettant d'organiser les sondages par statut ou par dossier.
    - **Boutons de Filtre :** `Tous` (actif), `Brouillon`, `Actif`, `Terminé`, `Archivé`, `Tags`, `Tous les dossiers`. Ces éléments sont des composants `Button` ou `Chip` stylisés, où l'état "actif" est visuellement mis en évidence (fond bleu).

5.  **État Vide (Empty State) :**
    - Cette section est affichée lorsqu'aucun sondage de dates n'a été créé ou ne correspond aux filtres.
    - **Icône Visuelle :** Une grande icône de calendrier (composant `CalendarIcon` ou similaire).
    - **Message Principal :** `Aucun sondage de dates` (balise `<h3>` ou `<h2>`).
    - **Message Secondaire :** `Créez votre premier sondage pour commencer.`
    - **Bouton d'Action :** `Créer un sondage` (composant `Button` primaire), qui déclenche probablement une modal ou une navigation vers un formulaire de création.

### 3. Cohérence Visuelle et Expérience Utilisateur

- **Thème Sombre :** L'interface utilise un thème sombre élégant qui offre un bon contraste pour le texte et les éléments interactifs.
- **Typographie :** La hiérarchie du texte est claire, avec des tailles de police et des graisses différentes pour les titres, sous-titres et informations secondaires.
- **Éléments Interactifs :** Les boutons et les champs de recherche sont bien définis. L'état actif du filtre "Tous" est clairement indiqué par un fond bleu distinct.
- **Feedback Visuel :** L'état vide du dashboard est bien géré, fournissant des informations claires et une action directe pour l'utilisateur, ce qui améliore l'onboarding et réduit la frustration.
- **Navigation :** L'intégration de la `ProductSidebar` et du bouton hamburger suggère une navigation cohérente à travers les différents produits de l'application.

---

## Écran : create

## Documentation Technique Interne : Écran de Création de Sondages de Dates (Create Date Poll Screen)

### 1. Introduction

Cet écran est dédié à la création de nouveaux sondages de dates. Il utilise une structure de layout générique `WorkspaceLayout` qui s'adapte en fonction du type de produit. L'interface est scindée en deux panneaux principaux : un assistant IA interactif à gauche et un formulaire de création de sondage spécifique aux dates à droite.

### 2. Composant Racine (`DateWorkspace`)

```jsx
import React from "react";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";

const DateWorkspace: React.FC = () => {
  return <WorkspaceLayout productType="date" />;
};

export default DateWorkspace;
```

Le composant `DateWorkspace` est un composant fonctionnel React simple qui sert de point d'entrée pour la page de création de sondage de dates. Sa principale responsabilité est de rendre le `WorkspaceLayout` en lui passant la prop `productType="date"`. Cette prop est cruciale car elle indique au `WorkspaceLayout` de configurer son contenu et son comportement pour un contexte de sondage de dates, notamment en affichant les composants pertinents dans le panneau de droite.

### 3. Structure Générale (`WorkspaceLayout`)

Le `WorkspaceLayout` est un composant de layout de haut niveau qui gère la structure globale de l'interface utilisateur. Il est responsable de :

- L'affichage d'une barre de navigation supérieure (non visible dans son intégralité ici, mais le menu hamburger est présent).
- La division de l'écran en deux colonnes principales :
  - Un panneau de gauche pour l'assistant IA.
  - Un panneau de droite pour le contenu spécifique au `productType`.
- La gestion du thème visuel (sombre par défaut).

### 4. Panneau Gauche : Assistant IA

Ce panneau est un composant générique, probablement un `AIChatPanel` ou similaire, encapsulé dans le `WorkspaceLayout`.

- **Composants Clés :**
  - `HamburgerMenuIcon` : Icône de menu pour la navigation ou l'ouverture d'une sidebar.
  - `AIAvatar` : Icône circulaire avec une étoile stylisée, représentant l'assistant IA.
  - `AIChatMessage` : Composant d'affichage de texte pour les messages de l'IA, incluant des suggestions sous forme de liste.
  - `AIChatInput` : Champ de saisie pour interagir avec l'IA.
    - **Fonctionnalités :**
      - **Saisie texte :** Permet à l'utilisateur de décrire le sondage.
      - **Pièce jointe :** Icône de trombone (`AttachmentIcon`) suggérant la possibilité d'ajouter des fichiers ou contextes.
      - **Saisie vocale :** Icône de microphone (`MicrophoneIcon`) pour la dictée vocale.
      - **Envoi :** Icône d'avion en papier (`SendIcon`) pour soumettre la requête à l'IA.
- **Fonctionnalités Réelles :**
  - Guide l'utilisateur dans la création de sondages et de questionnaires via une interface conversationnelle.
  - Propose des exemples de requêtes pour les sondages de dates ("Réunion d'équipe la semaine prochaine", "Déjeuner mardi ou mercredi") et les questionnaires ("Questionnaire de satisfaction client", "Sondage d'opinion sur notre produit").
  - Interprète les requêtes utilisateur pour pré-remplir ou générer des éléments du formulaire du panneau de droite.
- **Cohérence Visuelle :**
  - Utilise le thème sombre global.
  - Typographie et espacement cohérents avec le reste de l'application.
  - L'icône de l'IA est distinctive et bien intégrée.

### 5. Panneau Droit : Création du Sondage de Dates

Ce panneau est le contenu spécifique rendu par le `WorkspaceLayout` lorsque `productType="date"`. Il est probablement géré par un composant comme `DatePollForm` ou `CreateDatePollContent`.

- **Composants Clés :**
  - **Titre du sondage :**
    - `FormField` (wrapper générique pour les champs de formulaire) contenant un `TextInput`.
    - **Props :** `label="Titre du sondage *"` (indiquant un champ obligatoire), `placeholder="Ex: Réunion équipe marketing"`.
    - **Fonctionnalité :** Permet la saisie libre du titre du sondage.

  - **Sélection de Dates (`DatePicker` / `Calendar` component) :**
    - Un composant de sélection de dates avancé, probablement un `DatePicker` custom ou d'une bibliothèque UI (ex: `react-day-picker`, Chakra UI's `Calendar`, etc.).
    - **Fonctionnalités :**
      - Affichage multi-mois (ici, décembre 2025 et janvier 2026).
      - Navigation entre les mois via des flèches (`ArrowLeftIcon`, `ArrowRightIcon`).
      - Affichage des jours de la semaine (`Lun`, `Mar`, etc.).
      - Sélection de dates multiples (le `29` décembre est en surbrillance bleue, suggérant une sélection).
      - Les dates sont clairement affichées dans une grille.
    - **État Actuel :** Le `29` décembre 2025 est sélectionné.

  - **Paramètres et Partage (`Collapsible` / `Accordion` component) :**
    - Un composant de type `Collapsible` ou `Accordion` qui permet d'afficher/masquer du contenu additionnel.
    - **Props :** `label="Paramètres et Partage"`, `icon={GearIcon}`.
    - **Fonctionnalités :** Au clic, il déploie un panneau contenant des options de configuration (ex: visibilité des participants, date limite de réponse, etc.) et de partage du sondage.

  - **Boutons d'Action (`Button` component) :**
    - `Button` pour "Enregistrer le brouillon" :
      - **Props :** `variant="secondary"` ou `style="outline"` pour un bouton moins proéminent.
      - **Fonctionnalité :** Sauvegarde l'état actuel du sondage sans le publier.
    - `Button` pour "Publier le sondage" :
      - **Props :** `variant="primary"` ou `style="solid"` avec une couleur distinctive (bleu ici).
      - **Fonctionnalité :** Finalise la création et rend le sondage accessible aux participants.

- **Cohérence Visuelle :**
  - Intégration parfaite dans le thème sombre.
  - Les champs de saisie ont un style uniforme avec des bords arrondis et un fond sombre.
  - Les sélecteurs de dates sont clairs et intuitifs, avec un état de sélection bien visible.
  - Les boutons utilisent des variantes pour indiquer leur hiérarchie d'action.

### 6. Cohérence Visuelle Globale

L'interface maintient une cohérence visuelle forte grâce à :

- **Thème sombre uniforme :** Tous les éléments utilisent des couleurs de fond sombres et des textes clairs, réduisant la fatigue visuelle.
- **Typographie cohérente :** Utilisation d'une même police de caractères et de tailles adaptées pour les titres, labels et contenus.
- **Iconographie unifiée :** Les icônes sont de style plat et minimaliste, s'intégrant bien au design.
- **Rayons de bordure (Border-radius) :** Les champs de saisie, les boutons et les conteneurs partagent des rayons de bordure similaires pour une sensation de douceur.
- **Espacement :** Un système d'espacement (padding/margin) est appliqué de manière cohérente pour une meilleure lisibilité et organisation des éléments.
