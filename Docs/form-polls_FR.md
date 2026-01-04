# Technical Bible: Formulaires & Sondages

## Écran : landing

Voici la documentation technique interne pour l'écran d'atterrissage "Formulaires & Sondages".

---

## Documentation Technique Interne : Écran d'atterrissage "Formulaires & Sondages" (Landing Page)

**Fichier Source :** `LandingPage.tsx`

### 1. Vue d'ensemble et Objectif

Cet écran est la page d'accueil de la fonctionnalité "Formulaires & Sondages". Son rôle est de présenter les capacités principales du produit, inciter l'utilisateur à créer un formulaire et mettre en avant l'intégration de l'IA et l'analyse visuelle des résultats. La page utilise des animations fluides pour améliorer l'expérience utilisateur et des composants réutilisables pour la cohérence.

### 2. Composants React Utilisés

- **`LandingPage` (Composant Principal)** :
  - Contient toute la logique et la structure de la page.
  - Gère les états d'animation (`heroVisible`, `featureVisible`) via `useState` et des hooks custom.
  - Utilise `useNavigate` de `react-router-dom` pour la navigation vers l'écran de création de formulaire.
- **`ProductButton` (`@/components/products/ProductButton`)** :
  - Bouton d'action réutilisable spécifique aux produits, utilisé pour les Call-to-Action (CTA).
  - Prend des props comme `product`, `variantRole`, `size`, `onClick`, `className`.
  - Exemple : Le CTA principal utilise `variantRole="primary"` et une classe `bg-gradient-to-r from-violet-600 to-fuchsia-500`.
- **`ProductSidebar` (`@/components/layout/products/ProductSidebar`)** :
  - Composant de barre latérale de navigation, auto-suffisant avec sa logique de "hamburger menu".
  - Prend une prop `productType="form"` pour adapter son contenu/liens.
- **`Footer` (`@/components/shared/Footer`)** :
  - Composant de pied de page partagé à travers l'application.
- **`cn` (`@/lib/utils`)** :
  - Utilitaire pour fusionner et conditionnellement appliquer des classes Tailwind CSS (similaire à `clsx`). Améliore la lisibilité des classes conditionnelles.
- **`useStaggeredAnimation` (Hook Custom)** :
  - Hook personnalisé qui gère l'animation d'entrée échelonnée pour un groupe d'éléments.
  - Prend `itemCount` (nombre d'éléments à animer) et `delay` (délai entre chaque élément).
  - Retourne un tableau de booleéns `visibleItems` pour contrôler l'opacité et la transformation des éléments.

### 3. Fonctionnalités et Structure Technique

#### 3.1. Structure de base et Mise en page

- La page est contenue dans un `div` principal avec `flex min-h-screen bg-[#030712]` pour un fond sombre et une hauteur minimale d'écran.
- La `ProductSidebar` est rendue à gauche, et le contenu principal prend le reste de l'espace (`flex-1 text-white overflow-hidden`).

#### 3.2. Effets Visuels de Fond

- Un `div.fixed.inset-0.pointer-events-none` contient des éléments visuels non interactifs :
  - **Motif de lignes diagonales :** Appliqué via CSS `repeating-linear-gradient` avec une opacité très faible (`opacity-[0.015]`).
  - **Orbes de dégradé :** Deux `div` circulaires (`rounded-full`) avec des dégradés violets/fuchsia de faible opacité (`bg-violet-500/10`, `bg-fuchsia-500/10`) et des filtres `blur` créant un effet lumineux diffus.

#### 3.3. Header de Navigation

- `header` avec `border-b border-white/5` pour une séparation subtile.
- **Branding :** Un logo (`FileText` de `lucide-react`) est intégré dans un cercle avec un dégradé (`bg-gradient-to-br from-violet-500 to-fuchsia-500`), accompagné du texte "Form Polls".

#### 3.4. Section Héro (Visible sur la capture d'écran)

- **Animation d'entrée :** Contrôlée par l'état `heroVisible`. Utilise des classes Tailwind pour `opacity` et `translate-y` avec des `transition-all duration-700` pour un effet de fondu et de glissement vers le haut.
- **Badge "Propulsé par l'IA" :**
  - `inline-flex` avec l'icône `Sparkles` de `lucide-react`.
  - Styles : `rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm` pour un effet semi-transparent et flou.
- **Titre Principal (`h1`) :**
  - "Des formulaires qui convertissent".
  - La partie "qui convertissent" utilise un dégradé de texte : `bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent`.
- **Sous-titre :** Décrit la proposition de valeur (`p.text-gray-400`).
- **Call-to-Action (CTA) :** Un `ProductButton` (`onClick={() => navigate("/create/form")}`) avec le texte "Créer un formulaire" et l'icône `ArrowRight` de `lucide-react`. Le bouton a un dégradé prononcé et des effets de survol (`hover:from-violet-500 hover:to-fuchsia-400`).

#### 3.5. Prévisualisation Visuelle du Formulaire (Visible sur la capture d'écran)

- **Animation :** Également contrôlée par `heroVisible` avec un `delay-300` supplémentaire pour apparaître après le texte principal du héro.
- **Conteneur du Mockup :** `rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 shadow-2xl` pour une apparence élégante et semi-transparente.
- **Effet de fondu en bas :** Un `div` absolu avec `bg-gradient-to-t from-[#030712]` crée un fondu vers le bas, intégrant harmonieusement le mockup au fond.
- **Mockup de Questions :**
  - **Question de satisfaction (Emojis) :** Utilise un `map` pour générer les options d'emoji. L'option "😍" est stylisée différemment (`bg-violet-500/30 border-2 border-violet-500 scale-110`) pour indiquer une sélection.
  - **Question de recommandation (Texte) :** Similaire, utilise un `map` pour les options "Oui", "Peut-être", "Non". L'option "Oui" est sélectionnée avec des styles `bg-violet-500/30 border border-violet-500`.

#### 3.6. Section Fonctionnalités (Non visible sur la capture d'écran)

- Présente trois caractéristiques clés dans une grille (`md:grid-cols-3`).
- **Animation :** Chaque carte de fonctionnalité utilise l'état `featureVisible[i]` du hook `useStaggeredAnimation` pour une apparition échelonnée (`opacity-100 translate-y-0`) avec un `transitionDelay` pour un effet progressif.
- **Structure de chaque carte :**
  - Une icône (`MessageSquare`, `Palette`, `BarChart3` de `lucide-react`) placée dans un cercle avec un dégradé (`bg-gradient-to-br ${feature.gradient}`).
  - Un titre et une description concise.

#### 3.7. Section Statistiques (Non visible sur la capture d'écran)

- Divisée en deux colonnes (`md:grid-cols-2`) : un mockup de graphique et des statistiques textuelles.
- **Mockup de Graphique :** Une représentation simplifiée d'un graphique à barres, générée via un `map` sur des hauteurs de barres. Comprend un effet de flou en arrière-plan.
- **Statistiques Clés :** Deux blocs affichant des métriques comme le "Temps de réponse moyen" et le "Taux de complétion", stylisés avec des bordures subtiles.

#### 3.8. Appel à l'Action Final (Non visible sur la capture d'écran)

- Un CTA de fin de page, réutilisant le `ProductButton` avec le même style que le CTA principal.

#### 3.9. Footer

- Utilisation du composant `Footer` partagé.

### 4. Cohérence Visuelle et Expérience Utilisateur

- **Palette de couleurs :** Dominance de teintes sombres (#030712) avec des accents lumineux de violet et fuchsia pour les éléments interactifs, les titres et les icônes, créant une ambiance moderne et technologique.
- **Typographie :** Utilise des polices modernes et épurées (implicitement définies via Tailwind) pour une lisibilité optimale sur fond sombre.
- **Animations :** Les animations d'entrée (héro, fonctionnalités) sont fluides et ajoutent une touche de dynamisme, guidant l'œil de l'utilisateur à travers le contenu sans être intrusives.
- **Réactivité :** L'utilisation intensive de classes Tailwind CSS (`md:grid-cols-3`, `sm:flex-row`, etc.) assure une bonne adaptation de l'interface sur différentes tailles d'écran.
- **Icônes :** Utilisation cohérente d'icônes `lucide-react` pour renforcer visuellement le texte et les fonctionnalités.

---

## Écran : dashboard

## Documentation Interne : `FormPollsDashboard` (Écran Tableau de bord Formulaires & Sondages)

### 1. Description Générale

Le composant `FormPollsDashboard` est la page de tableau de bord principale pour la gestion des formulaires et sondages. Il orchestre l'affichage d'une barre latérale de navigation spécifique au produit et du contenu dynamique du tableau de bord. Il est conçu comme un conteneur de haut niveau, déléguant la majeure partie de sa logique de présentation et fonctionnelle à des composants enfants réutilisables.

### 2. Composants React Utilisés et Rôles

Ce composant s'appuie sur deux composants React génériques pour construire son interface :

- **`ProductSidebar`**:
  - **Chemin**: `@/components/layout/products/ProductSidebar`
  - **Rôle**: Gère la navigation latérale de l'application. Elle est configurée pour le type de produit "form", affichant ainsi les liens et actions pertinents pour les formulaires et sondages. Comme indiqué dans le code, elle est "auto-suffisante avec son hamburger", signifiant qu'elle inclut la logique pour son affichage (par exemple, un état replié/déplié via l'icône hamburger) et sa navigation interne sans nécessiter de props supplémentaires de son parent autre que le `productType`.
  - **Propriétés utilisées**:
    - `productType="form"`: Indique au `ProductSidebar` de se configurer pour le contexte "formulaires".

- **`ProductDashboard`**:
  - **Chemin**: `@/components/products/ProductDashboard`
  - **Rôle**: Constitue la majeure partie du contenu principal du tableau de bord. Ce composant est responsable de l'affichage du titre, des fonctionnalités de recherche, de filtrage, des indicateurs de statut (crédits), et de la liste des éléments du produit (dans ce cas, les formulaires), y compris l'état vide. Sa nature générique lui permet de s'adapter à différents types de produits.
  - **Propriétés utilisées**:
    - `productType="form"`: Indique au `ProductDashboard` de charger et d'afficher le contenu spécifique aux "formulaires".

### 3. Fonctionnalités Réelles (Basées sur l'UI et le Code)

L'écran `FormPollsDashboard` présente les fonctionnalités suivantes, toutes gérées principalement par les composants enfants :

1.  **Barre Latérale Collapsible (`ProductSidebar`)**:
    - Visible en tant qu'icône de menu hamburger en haut à gauche.
    - Fournit l'accès à la navigation principale spécifique aux "Formulaires & Sondages" lorsqu'elle est ouverte.
    - Utilise `productType="form"` pour adapter son contenu de navigation.

2.  **En-tête du Tableau de Bord (`ProductDashboard`)**:
    - **Titre**: "Vos Formulaires"
    - **Description**: "Gérez vos formulaires et analysez les réponses."
    - Ces éléments sont dynamiquement affichés par `ProductDashboard` en fonction du `productType` fourni.

3.  **Barre d'Information/Crédits (`ProductDashboard`)**:
    - Affiche un indicateur d'utilisation : "0/100 crédits utilisés" avec une barre de progression.
    - Message incitatif : "Créez un compte pour synchroniser vos données".
    - Liens d'action : "Journal" et "En savoir plus" (ce dernier avec une icône de lien externe).

4.  **Recherche et Filtrage (`ProductDashboard`)**:
    - **Champ de recherche**: "Rechercher une conversation ou un sondage..." avec une icône de loupe.
    - **Filtres par statut/catégorie**: Boutons cliquables pour "Tous", "Brouillon", "Actif", "Terminé", "Archivé", "Tags", "Tous les dossiers". Le filtre "Tous" est actuellement sélectionné et mis en évidence (couleur violette).
    - **Options d'affichage**: Deux icônes en haut à droite (grille et liste) pour basculer entre les modes d'affichage des formulaires.

5.  **Affichage des Formulaires (État Vide) (`ProductDashboard`)**:
    - Lorsque aucun formulaire n'est créé, `ProductDashboard` affiche un message d'état vide :
      - Icône de document.
      - Titre: "Aucun formulaire"
      - Sous-titre: "Créez votre premier formulaire pour commencer"
      - Bouton d'action principal: "Créer un formulaire" (mis en évidence en violet).
    - Ce bloc est le point d'entrée pour l'utilisateur pour initier la création d'un nouveau formulaire.

### 4. Cohérence Visuelle et Remarques Techniques

- **Layout Flexbox**: Le conteneur racine utilise `display: flex` et `min-h-screen` pour garantir une disposition à deux colonnes (sidebar et contenu principal) prenant toute la hauteur de l'écran. `flex-1` sur le contenu principal assure qu'il occupe l'espace restant après la sidebar.
- **Thème Visuel**: L'interface utilisateur est dominée par un thème sombre (arrière-plans sombres, texte clair, accents violets).
  - **Incohérence Notée**: Le code source indique `bg-gray-50` pour le conteneur principal, ce qui correspondrait à un fond très clair. Cependant, la capture d'écran montre clairement un fond sombre. Cela suggère fortement que le style `bg-gray-50` est soit :
    - Surchargé par des styles globaux ou un thème CSS plus spécifique (par exemple, via un composant `ThemeProvider` ou un utilitaire de thème Tailwind CSS configuré en mode sombre).
    - Une relique du code qui n'est plus active ou visuellement pertinente en raison d'une configuration de thème ultérieure.
    - Il est crucial de vérifier la source des styles qui définissent le thème sombre pour maintenir la cohérence et la maintenabilité.
- **Réutilisabilité**: L'utilisation de `ProductSidebar` et `ProductDashboard` avec la prop `productType` démontre une architecture modulaire et réutilisable, permettant de créer facilement des dashboards pour d'autres types de produits en réutilisant ces composants génériques.
- **Composants Atomiques/Moléculaires**: Les éléments comme la barre de progression des crédits, les boutons de filtre, le champ de recherche, et l'état vide sont probablement des composants plus petits encapsulés au sein de `ProductDashboard`, garantissant la cohérence visuelle et comportementale à travers l'application.

## Écran : create

Cette documentation interne détaille l'écran de création de formulaires et sondages, tel qu'implémenté via le composant `FormWorkspace` et son `WorkspaceLayout` associé.

---

### Documentation Technique : Écran "Formulaires & Sondages" - Création

**Source Composant React :** `FormWorkspace.tsx`

```jsx
import React from "react";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";

const FormWorkspace: React.FC = () => {
  return <WorkspaceLayout productType="form" />;
};

export default FormWorkspace;
```

**Analyse du Composant Racine :**
Le composant `FormWorkspace` est un wrapper simple. Il délègue la majeure partie de la logique de rendu et de la structure de l'interface utilisateur au composant générique `WorkspaceLayout`. Le prop `productType="form"` est crucial, car il indique à `WorkspaceLayout` de charger et d'afficher l'interface spécifique à la création de formulaires/sondages.

---

#### Structure Globale des Composants (Déduite de l'image et du code)

L'écran est structuré autour d'un `WorkspaceLayout` qui, pour `productType="form"`, intègre deux panneaux principaux : un assistant IA interactif sur la gauche et un éditeur de formulaire sur la droite.

1.  **`WorkspaceLayout`**:
    - Fournit la structure de base de l'application (barre latérale de navigation générale, en-tête, etc., bien que non entièrement visible ici).
    - Contient un slot pour le contenu spécifique au produit, qui, dans ce cas, est l'interface de création de formulaire.

2.  **`FormCreationPage`** (composant principal rendu par `WorkspaceLayout` pour `productType="form"`) :
    - Structure en deux colonnes principales, probablement gérée par CSS Grid ou Flexbox.
      - `AIChatPanel` (colonne gauche)
      - `FormEditorPanel` (colonne droite)

---

#### Fonctionnalités et Composants Réels

**1. Panel d'Assistant IA (`AIChatPanel`) - Colonne Gauche**

- **Rôle :** Guider l'utilisateur dans la création rapide de formulaires ou de sondages via des prompts textuels.
- **Composants Principaux :**
  - `AIAvatar` : Icône centrale stylisée (étoile violette sur fond sombre) représentant l'assistant IA.
  - `AITextContent` : Bloc de texte affichant des messages de bienvenue, des instructions et des exemples (ex: "Sondages de dates", "Questionnaires"). Utilise des balises `p` et `ul`/`li` pour la structure.
  - `AIChatInput` : Composant `Input` de type `textarea` ou `div[contenteditable]` au bas, avec:
    - `AttachmentButton` : `IconButton` pour joindre des fichiers.
    - `MicrophoneButton` : `IconButton` pour la saisie vocale.
    - `SendButton` : `IconButton` pour envoyer le message.
- **Fonctionnalité :** Interface conversationnelle pour la génération de brouillons de formulaires basés sur la description textuelle de l'utilisateur.

**2. Éditeur de Formulaire (`FormEditorPanel`) - Colonne Droite**

- **Rôle :** Interface graphique pour la construction et la personnalisation détaillées du formulaire.
- **Composants Principaux :**
  - **Titre du Formulaire :**
    - `Label` : "Titre du formulaire \*" (indique un champ obligatoire).
    - `Input` : Composant `Input` de texte avec un `placeholder` (Ex: "Questionnaire de satisfaction client").
  - **Gestion des Questions :**
    - `AddQuestionButton` : `Button` avec icône `+` et texte "Q1", permettant d'ajouter une nouvelle question.
    - **Bloc de Question (`QuestionBlock`) :** Conteneur pour une question individuelle.
      - `QuestionTypeSelect` : Composant `Select` (`Dropdown`) affichant le type de question actuel (ex: "Choix unique") et permettant de le modifier.
      - `QuestionToolbar` : Un `ButtonGroup` ou une série d'`IconButton`s pour les actions sur la question :
        - `MoveUpButton`
        - `MoveDownButton`
        - `DuplicateButton`
        - `DeleteButton`
        - `ConditionsButton` (avec icône `chainlink` ou `flow`).
      - `QuestionTitleInput` : `Input` de texte pour l'intitulé de la question (ex: "Nouvelle question").
      - **Liste d'Options (`OptionList`) :**
        - `OptionInput` : Composant `Input` de texte pour chaque option (ex: "Option 1", "Option 2"), accompagné d'un `DeleteButton` (icône `trash`).
        - `AddOptionButton` : `Button` avec icône `+` pour ajouter une nouvelle option.
        - `Checkbox` : Deux `Checkbox` pour "Option 'Autre'" et "Obligatoire".
  - **Paramètres de Configuration :**
    - `CollapsibleSection` : Composant de type `Disclosure` ou `Accordion` avec un `SettingsIcon` et le label "Paramètres de configuration", permettant de déplier/replier les options avancées du formulaire.
  - **Actions du Formulaire (Footer) :**
    - `AIIntegrationButton` : `Button` avec icône `sparkle` et le texte "Tester avec l'IA". Comporte un `Badge` numérique (`20`) indiquant un coût ou un quota.
    - `SaveDraftButton` : `Button` avec le texte "Enregistrer le brouillon".
    - `PublishFormButton` : `Button` de type `primary` (couleur violette) avec le texte "Publier le formulaire".

---

#### Cohérence Visuelle et UX

- **Thème Sombre :** L'interface utilise un thème sombre (`dark mode`) avec un arrière-plan noir profond, texte blanc/gris clair et des accents de couleur violette pour les éléments interactifs et les actions primaires.
- **Typographie :** Utilisation d'une police sans-serif claire et moderne, assurant une bonne lisibilité des titres, labels et contenus.
- **Palette de Couleurs :** Limité à une base sombre, des textes lumineux, et un violet distinctif. Cela crée un contraste élevé et une focalisation claire sur les éléments d'action.
- **Icônes :** Un jeu d'icônes uniforme est utilisé partout, améliorant la compréhension visuelle des actions et des types de contenu.
- **Espacement et Alignement :** L'espacement est cohérent, utilisant des marges et des paddings définis pour créer une hiérarchie visuelle claire et séparer logiquement les sections. Les éléments sont alignés pour une lecture facile.
- **Éléments Interactifs :** Les `Input`s, `Button`s, `Select`s et `Checkbox`s présentent un style uniforme (coins arrondis, couleurs de fond/bordure cohérentes), signalant clairement leur nature interactive. Le bouton "Publier le formulaire" est visuellement accentué comme l'action principale.
- **Expérience Utilisateur :** La disposition des éléments est intuitive, avec l'assistant IA à gauche pour la génération et l'éditeur détaillé à droite pour la personnalisation, suivant un flux de travail logique. Les fonctionnalités de gestion des questions sont regroupées de manière ergonomique.
