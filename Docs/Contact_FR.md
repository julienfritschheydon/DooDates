# Fiche Technique : Page de Contact

## 1. Vue d'ensemble

La page de contact de DooDates a été conçue pour offrir aux utilisateurs un moyen simple et efficace de communiquer avec l'équipe de support. Elle vise à rassurer les utilisateurs sur la disponibilité de l'aide et à faciliter la prise de contact pour toute question, suggestion ou besoin d'assistance.

## 2. Éléments Visuels & UI

La page utilise un thème en mode sombre (`bg-[#0a0a0a]`) avec des accents visuels modernes et des dégradés subtils pour créer une expérience utilisateur agréable.

- **Badge "Contact"** : Un badge informatif (`<span className="text-sm text-purple-400 font-medium">Contact</span>`) est affiché en haut de la section principale, signalant clairement le propos de la page.
- **Titres Gradient** : Le titre principal "Écrivez-nous" utilise un dégradé de couleurs (`from-purple-400 to-blue-400`) pour un effet visuel accrocheur.
- **Gradients de fond** : Des dégradés de couleurs (violet et bleu) appliqués avec un flou important (`blur-[120px]`) sont utilisés en arrière-plan pour ajouter de la profondeur et une touche esthétique sans distraire du contenu principal.
- **Effets de Transparence/Flou (Backdrop Blur)** : La section d'en-tête et le bloc d'information de l'email utilisent un `backdrop-blur-sm` pour créer un effet de verre dépoli, améliorant la superposition des éléments.

## 3. Coordonnées & Support

La page fournit un point de contact clair pour les utilisateurs.

- **Email de Support** : L'adresse email officielle du support est `support@doodates.com`, affichée de manière proéminente.
- **Délai de Réponse** : Un message indique aux utilisateurs qu'une réponse sera apportée "dans les meilleurs délais".
- **Actions Disponibles** :
  - **Retour à l'accueil** : Un bouton (`<Button variant="outline">`) permet aux utilisateurs de revenir facilement à la page d'accueil de l'application.

## 4. Détails d'Implémentation

La page est construite en utilisant des composants React et s'appuie sur une structure modulaire.

- **Composants Réutilisés** :
  - `Button` : Le composant de bouton est importé de `@/components/ui/button` et est utilisé pour le bouton "Retour à l'accueil".
  - `Footer` : Le composant `Footer` est importé de `@/components/shared/Footer`, assurant une cohérence visuelle et fonctionnelle avec les autres pages de l'application.
- **Navigation** : Le composant `Link` de `react-router-dom` est utilisé pour gérer la navigation vers la page d'accueil.
- **Styling** : L'application des styles est gérée directement via les `className`s, utilisant probablement Tailwind CSS pour une approche utilitaire et réactive. Des classes comme `min-h-screen`, `max-w-7xl`, `mx-auto`, `px-4`, `py-32`, `text-center`, `relative`, `z-10`, `flex-1`, `border`, `rounded-full`, `bg-white/5`, `border-white/10`, `mb-6`, `text-sm`, `text-purple-400`, `font-medium`, `text-5xl`, `md:text-6xl`, `font-bold`, `mb-8`, `tracking-tight`, `text-transparent`, `bg-clip-text`, `bg-gradient-to-r`, `from-purple-400`, `to-blue-400`, `text-xl`, `text-gray-300`, `mb-12`, `max-w-2xl`, `mx-auto`, `leading-relaxed`, `p-8`, `max-w-xl`, `backdrop-blur-sm`, `mb-12`, `text-2xl`, `text-white`, `mb-2`, `text-gray-400` et `gap-4` sont utilisées pour définir la mise en page, la typographie, les couleurs et les espacements.
- **Structure HTML** : La page utilise une structure `div` pour organiser le contenu, avec des sections dédiées à l'en-tête, au contenu principal et au pied de page. Des divs avec `overflow-hidden` et `pointer-events-none` sont utilisées pour les éléments d'arrière-plan afin d'améliorer l'esthétique.
