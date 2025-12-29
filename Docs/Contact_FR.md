# Fiche Technique : Page de Contact

## 1. Vue d'ensemble
La page de contact de DooDates a pour objectif principal de fournir aux utilisateurs un moyen simple et direct de communiquer avec l'équipe de support. Elle sert de point central pour toute question, suggestion ou demande d'assistance, visant à offrir une expérience utilisateur fluide et à renforcer la relation avec la communauté DooDates.

## 2. Éléments Visuels & UI
La page adopte un thème en mode sombre (`bg-[#0a0a0a] text-white`) avec des accents visuels modernes et subtils :
- **Gradients d'arrière-plan** : Deux gradients diffus (violet et bleu) sont positionnés stratégiquement en arrière-plan pour créer une ambiance douce et dynamique, sans distraire du contenu principal.
- **Badges informatifs** :
    - Un badge "Contact" (`bg-white/5 border border-white/10`) en violet clair met en évidence la nature de la page.
    - Un badge "Assistance Prioritaire Active" (`bg-green-500/10 border border-green-500/20`) en vert indique un niveau de service élevé ou une réactivité accrue du support.
- **Typographie** : Le titre principal utilise une typographie audacieuse (`text-5xl md:text-6xl font-bold`) avec un effet de texte dégradé (`bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400`) pour les mots clés, captant l'attention de l'utilisateur.

## 3. Coordonnées & Support
- **Adresse E-mail** : L'adresse de support directe est `support@doodates.com`, affichée de manière proéminente dans un bloc stylisé (`bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm`).
- **Confirmation de Réponse** : Un message informatif "Nous vous répondrons dans les meilleurs délais" rassure les utilisateurs sur la prise en charge de leur demande.
- **Actions Disponibles** : Un bouton "Retour à l'accueil" (`Button variant="outline"`) permet aux utilisateurs de naviguer facilement vers la page principale de l'application.

## 4. Détails d'Implémentation
La page est développée en React, utilisant des composants réutilisables pour une maintenance et une évolutivité facilitées :
- **Composants UI** :
    - `Button` : Utilisé pour le bouton de navigation "Retour à l'accueil", provenant de `@/components/ui/button`.
    - `Link` : Composant de `react-router-dom` pour la navigation client-side, sans rechargement complet de la page.
    - `Footer` : Un composant partagé (`@/components/shared/Footer`) assure la cohérence du bas de page à travers l'application.
- **Styling** : Le stylisme est principalement géré avec Tailwind CSS, comme en témoignent les nombreuses classes utilitaires.
    - **Gradients** : Des classes telles que `bg-gradient-to-br from-purple-500 to-blue-500` et `bg-gradient-to-r from-white to-gray-400` sont utilisées pour les éléments visuels et le texte.
    - **Effets** : Des classes comme `blur-[120px]` et `backdrop-blur-sm` ajoutent des effets visuels modernes.
- **Structure de la page** : La page est structurée avec un conteneur principal `min-h-screen flex flex-col` pour occuper toute la hauteur de l'écran, un `header` distinct, un `div` central pour le contenu principal et un `footer`.
- **Réactivité** : L'utilisation de classes Tailwind comme `md:text-6xl` indique une conception réactive pour s'adapter à différentes tailles d'écran.