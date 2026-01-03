# 📋 Guide de Test Manuel - DooDates

## Vue d'ensemble

Ce guide fournit une checklist complète pour les tests manuels de DooDates, couvrant tous les scénarios utilisateur critiques, les tests d'interface, de performance, d'accessibilité et de compatibilité cross-browser.

## 🎯 Objectifs des Tests Manuels

- Valider l'expérience utilisateur complète
- Vérifier les workflows critiques
- Tester la responsivité et l'accessibilité
- Confirmer la compatibilité cross-browser
- Identifier les problèmes UX non détectés par les tests automatisés

---

## ✅ Soucis résolus:

### 🔧 Corrections techniques appliquées:

- ✅ **TopNav manquant pendant création de sondage**: Ajout de `<TopNav />` dans PollCreator.tsx
- ✅ **Erreur "Failed to fetch" lors création sondage**: Amélioration gestion d'erreur réseau dans usePolls.ts
- ✅ **Interface chat unifiée**: ChatInterface utilise maintenant uniquement GeminiChatInterface
- ✅ **Support créneaux multiples même date**: Logique corrigée dans PollCreator pour timeSlotsByDate
- ✅ **Tests de régression navigation**: Création tests Playwright pour vérifier présence TopNav

### 📋 Tâches en cours:

- 🔄 **Hooks de conversations**: Implémentation useConversations et useConversationStorage
- 🔄 **Composant ConversationHistory**: Interface complète historique conversations IA
- 🔄 **Mise à jour workflow**: Documentation dans DooDates-Spec-Kit-Workflow.md

## 📱 Pré-requis de Test

### Environnements de Test

- [x] **Local Development**: `npm run dev` fonctionnel
- [x] **Staging Environment**: URL de staging accessible
- [ ] **Production Environment**: URL de production accessible

### Comptes de Test

- [x] **Compte Invité**: Navigation sans authentification
- [ ] **Compte Test Authentifié**: Email/mot de passe valides
- [ ] **Compte Premium**: Accès aux fonctionnalités premium (si applicable)

### Outils de Test

- [ ] **DevTools**: Pour inspection responsive et performance
- [ ] **Lighthouse**: Pour audit accessibilité et performance
- [ ] **Screen Reader**: NVDA (Windows) ou VoiceOver (Mac)

## 👤 Scénarios Utilisateur Invité

### 🆕 Première Visite

- [x] **Landing Page**: Page d'accueil se charge correctement
- [x] **Navigation**: Menu principal accessible et fonctionnel
- [x] **CTA Principal**: Bouton "Créer une conversation" visible et attractif
- [ ] **Responsive**: Interface s'adapte sur mobile/tablet

### 💬 Création de Conversation

- [x] **Accès Direct**: Clic sur "Créer conversation" fonctionne
- [x] **Interface Chat**: GeminiChatInterface se charge correctement
- [x] **Premier Message**: Saisie et envoi du premier message
- [x] **Réponse IA**: Réponse de Gemini s'affiche correctement
- [ ] **Sauvegarde Auto**: Conversation sauvée automatiquement en localStorage

### 📊 Limite Quota Invité

- [ ] **Compteur Quota**: Indicateur "1/1 conversations" visible
- [ ] **Tentative Dépassement**: Création d'une 2ème conversation bloquée
- [ ] **Modal Upgrade**: AuthIncentiveModal s'affiche avec message clair
- [ ] **CTA Inscription**: Boutons "S'inscrire" et "Se connecter" fonctionnels
- [ ] **Fermeture Modal**: Modal se ferme correctement (X, ESC, clic extérieur)

### 💾 Persistance Données

- [ ] **Fermeture Navigateur**: Fermer et rouvrir le navigateur
- [ ] **Conversation Restaurée**: Conversation précédente toujours accessible
- [ ] **Contexte IA**: Historique des messages préservé
- [ ] **Reprise Chat**: Possibilité de continuer la conversation

### 🔄 Migration vers Compte

- [ ] **Inscription Depuis Modal**: Processus d'inscription fluide
- [ ] **Migration Automatique**: Conversation invité migrée vers compte
- [ ] **Quota Étendu**: Nouvelles limites appliquées (ex: 1000 conversations)
- [ ] **Données Préservées**: Aucune perte de données lors migration

---

## 🔐 Scénarios Utilisateur Authentifié

### 🚪 Authentification

- [ ] **Inscription**: Création de compte avec email/mot de passe
- [ ] **Confirmation Email**: Email de confirmation reçu et fonctionnel
- [ ] **Connexion**: Login avec identifiants corrects
- [ ] **Erreurs Auth**: Messages d'erreur clairs pour identifiants incorrects
- [ ] **Mot de Passe Oublié**: Processus de reset fonctionnel

### 📚 Gestion Multiple Conversations

- [ ] **Création Multiple**: Créer 5+ conversations sans problème
- [ ] **Liste Conversations**: ConversationHistory affiche toutes les conversations
- [ ] **Tri Chronologique**: Conversations triées par date de modification
- [ ] **Aperçu Messages**: Premier message visible dans ConversationCard
- [ ] **Statuts Visuels**: Indicateurs de statut (🟡🟢🔗) corrects

### 🔍 Recherche et Navigation

- [ ] **Barre Recherche**: ConversationSearch fonctionnelle
- [ ] **Recherche Temps Réel**: Résultats filtrés en temps réel
- [ ] **Highlighting**: Termes recherchés surlignés
- [ ] **Filtres**: Filtres par statut et date fonctionnels
- [ ] **Clear Filters**: Bouton reset filtres opérationnel

### ⚡ Actions Rapides

- [ ] **Reprendre Conversation**: Clic sur conversation ouvre le chat
- [ ] **Contexte Restauré**: Historique IA complet restauré
- [ ] **Renommer**: Renommage inline avec validation
- [ ] **Supprimer**: Modal confirmation + suppression effective
- [ ] **Menu Actions**: Dropdown actions accessible et fonctionnel

### 🔗 Liens Bidirectionnels

- [ ] **Conversation → Sondage**: Création sondage depuis conversation
- [ ] **Badge "Créé par IA"**: Badge visible sur sondages liés
- [ ] **Sondage → Conversation**: Lien retour vers conversation source
- [ ] **Navigation Fluide**: Transitions entre chat et sondage
- [ ] **Métadonnées**: Informations de liaison préservées

### 🔄 Synchronisation Multi-Appareils

- [ ] **Connexion Appareil 2**: Se connecter sur 2ème appareil/onglet
- [ ] **Données Synchronisées**: Conversations identiques sur les 2 appareils
- [ ] **Modifications Temps Réel**: Changements reflétés instantanément
- [ ] **Gestion Conflits**: Résolution conflits de modification simultanée

### 🚪 Déconnexion

- [ ] **Logout**: Bouton déconnexion fonctionnel
- [ ] **Nettoyage Session**: Données sensibles effacées
- [ ] **Redirection**: Retour à la page d'accueil
- [ ] **Reconnexion**: Possibilité de se reconnecter

---

## 📱 Tests Interface Mobile

### 📐 Responsive Design

- [ ] **Breakpoints**: Test sur 320px, 768px, 1024px, 1440px
- [ ] **Navigation Mobile**: Menu hamburger fonctionnel
- [ ] **Touch Targets**: Boutons suffisamment grands (44px min)
- [ ] **Scroll Vertical**: Scroll fluide sans débordement horizontal

### 👆 Interactions Tactiles

- [ ] **Tap Conversations**: Tap sur ConversationCard ouvre le chat
- [ ] **Swipe Actions**: Actions swipe (si implémentées)
- [ ] **Long Press**: Menu contextuel sur long press
- [ ] **Pinch Zoom**: Zoom accessible mais contrôlé
- [ ] **Keyboard Mobile**: Clavier virtuel n'obstrue pas l'interface

### 🎨 Adaptation Visuelle

- [ ] **Texte Lisible**: Taille de police adaptée mobile
- [ ] **Espacement**: Marges et paddings appropriés
- [ ] **Images**: Images responsive et optimisées
- [ ] **Modals Mobile**: Modals s'adaptent à l'écran mobile

### ⚡ Performance Mobile

- [ ] **Temps Chargement**: Page se charge en <3s sur 3G
- [ ] **Interactions Fluides**: Pas de lag lors des taps
- [ ] **Scroll Performance**: Scroll à 60fps
- [ ] **Mémoire**: Pas de crash sur appareils low-end

---

## 🚀 Tests Performance Utilisateur

### ⏱️ Temps de Chargement

- [ ] **First Contentful Paint**: <1.5s
- [ ] **Largest Contentful Paint**: <2.5s
- [ ] **Time to Interactive**: <3.5s
- [ ] **Cumulative Layout Shift**: <0.1

### 📊 Performance avec Volume

- [ ] **100+ Conversations**: Interface reste fluide
- [ ] **Recherche Instantanée**: Résultats en <200ms
- [ ] **Scroll Virtualisé**: Pas de lag avec longues listes
- [ ] **Pagination**: Chargement progressif efficace

### 💾 Gestion Mémoire

- [ ] **Usage RAM**: Pas d'augmentation excessive
- [ ] **Memory Leaks**: Pas de fuites mémoire détectées
- [ ] **Garbage Collection**: Nettoyage automatique efficace
- [ ] **Long Sessions**: Stabilité après 1h+ d'utilisation

### 🌐 Performance Réseau

- [ ] **Offline Graceful**: Gestion perte connexion
- [ ] **Retry Logic**: Tentatives automatiques de reconnexion
- [ ] **Caching**: Données mises en cache intelligemment
- [ ] **Compression**: Réponses compressées (gzip/brotli)

---

## ♿ Tests Accessibilité

### ⌨️ Navigation Clavier

- [ ] **Tab Order**: Ordre de tabulation logique
- [ ] **Focus Visible**: Indicateurs de focus clairs
- [ ] **Skip Links**: Liens de saut de navigation
- [ ] **Keyboard Shortcuts**: Raccourcis clavier documentés
- [ ] **Escape Key**: ESC ferme modals et menus

### 🔊 Lecteurs d'Écran

- [ ] **NVDA/JAWS**: Navigation fluide avec lecteur d'écran
- [ ] **VoiceOver**: Compatibilité macOS/iOS
- [ ] **Landmarks**: Régions ARIA correctement définies
- [ ] **Headings**: Hiérarchie de titres logique (h1→h6)
- [ ] **Alt Text**: Images avec texte alternatif descriptif

### 🎨 Contraste et Visibilité

- [ ] **Contraste Couleurs**: Ratio 4.5:1 minimum (AA)
- [ ] **Contraste Élevé**: Ratio 7:1 pour AAA
- [ ] **Focus Indicators**: Contraste suffisant pour focus
- [ ] **Error States**: Messages d'erreur contrastés

### 🔤 Lisibilité

- [ ] **Taille Police**: 16px minimum sur mobile
- [ ] **Line Height**: 1.5 minimum pour lisibilité
- [ ] **Zoom 200%**: Interface utilisable à 200% zoom
- [ ] **Dyslexie**: Police et espacement adaptés

### 🏷️ Sémantique HTML

- [ ] **HTML Valide**: Markup HTML5 valide
- [ ] **ARIA Labels**: Labels appropriés pour éléments interactifs
- [ ] **Form Labels**: Tous les champs ont des labels
- [ ] **Button Types**: Types de boutons corrects (button/submit)

---

## 🌐 Tests Cross-Browser

### 🖥️ Desktop Browsers

#### Chrome (Latest)

- [ ] **Fonctionnalités Core**: Toutes les fonctions principales
- [ ] **LocalStorage**: Persistance données
- [ ] **CSS Grid/Flexbox**: Layout correct
- [ ] **ES6+ Features**: JavaScript moderne supporté
- [ ] **DevTools**: Pas d'erreurs console

#### Firefox (Latest)

- [ ] **Compatibilité CSS**: Styles identiques à Chrome
- [ ] **JavaScript**: Toutes les fonctions JS
- [ ] **Storage API**: localStorage/sessionStorage
- [ ] **Performance**: Temps de réponse similaires
- [ ] **Extensions**: Pas de conflits avec extensions populaires

#### Safari (Latest)

- [ ] **WebKit Rendering**: Rendu correct
- [ ] **Touch Events**: Support événements tactiles
- [ ] **iOS Compatibility**: Préparation pour mobile
- [ ] **Privacy Features**: Gestion ITP (Intelligent Tracking Prevention)

#### Edge (Latest)

- [ ] **Chromium Base**: Comportement similaire à Chrome
- [ ] **Legacy Support**: Pas de régression vs IE11 (si supporté)
- [ ] **Windows Integration**: Fonctionnalités Windows spécifiques

### 📱 Mobile Browsers

#### iOS Safari

- [ ] **Touch Gestures**: Tous les gestes tactiles
- [ ] **Viewport**: Meta viewport correct
- [ ] **Home Screen**: PWA installable
- [ ] **iOS Quirks**: Gestion spécificités iOS

#### Android Chrome

- [ ] **Material Design**: Respect guidelines Android
- [ ] **Back Button**: Gestion bouton retour Android
- [ ] **Permissions**: Demandes permissions appropriées
- [ ] **Performance**: Fluidité sur appareils variés

### 🔧 Features Spécifiques

#### LocalStorage/IndexedDB

- [ ] **Chrome**: Stockage local fonctionnel
- [ ] **Firefox**: Persistance données
- [ ] **Safari**: Gestion quotas Safari
- [ ] **Edge**: Compatibilité stockage
- [ ] **Mobile**: Limitations stockage mobile

#### Modern JavaScript

- [ ] **ES6 Modules**: Import/export
- [ ] **Async/Await**: Fonctions asynchrones
- [ ] **Arrow Functions**: Syntaxe moderne
- [ ] **Template Literals**: Chaînes template
- [ ] **Destructuring**: Déstructuration objets/arrays

---

## 📝 Checklist de Test Complet

### 🚀 Avant de Commencer

- [ ] Environnement de test configuré
- [ ] Comptes de test créés
- [ ] Navigateurs installés et à jour
- [ ] Outils d'accessibilité installés
- [ ] Checklist imprimée ou accessible

### 📋 Exécution des Tests

- [ ] **Scénarios Invité**: Tous les tests passés
- [ ] **Scénarios Authentifié**: Tous les tests passés
- [ ] **Interface Mobile**: Tests responsive complets
- [ ] **Performance**: Métriques dans les seuils
- [ ] **Accessibilité**: Conformité WCAG 2.1 AA
- [ ] **Cross-Browser**: Compatibilité vérifiée

### 🐛 Gestion des Bugs

- [ ] **Documentation**: Bugs documentés avec captures
- [ ] **Prioritisation**: Bugs classés par criticité
- [ ] **Reproduction**: Steps de reproduction clairs
- [ ] **Environment**: Environnement et navigateur spécifiés

### ✅ Validation Finale

- [ ] **Tous les tests critiques**: Status PASS
- [ ] **Bugs bloquants**: Aucun bug critique ouvert
- [ ] **Performance**: Métriques acceptables
- [ ] **Accessibilité**: Conformité validée
- [ ] **Documentation**: Tests documentés

---

## 📊 Rapport de Test

### Template de Rapport

```markdown
# Rapport de Test Manuel - DooDates

**Date**: [DATE]
**Testeur**: [NOM]
**Version**: [VERSION]
**Environnement**: [STAGING/PROD]

## Résumé Exécutif

- **Tests Exécutés**: X/Y
- **Taux de Réussite**: X%
- **Bugs Critiques**: X
- **Bugs Mineurs**: X

## Détail par Catégorie

### Scénarios Utilisateur Invité: ✅/❌

### Scénarios Utilisateur Authentifié: ✅/❌

### Interface Mobile: ✅/❌

### Performance: ✅/❌

### Accessibilité: ✅/❌

### Cross-Browser: ✅/❌

## Bugs Identifiés

[Liste des bugs avec priorité et description]

## Recommandations

[Actions recommandées avant mise en production]
```

---

## 🎯 Critères de Validation

### ✅ Critères de Succès

- **Fonctionnalités Core**: 100% fonctionnelles
- **Performance**: Métriques Core Web Vitals respectées
- **Accessibilité**: WCAG 2.1 AA minimum
- **Cross-Browser**: Support navigateurs principaux
- **Mobile**: Interface parfaitement responsive
- **Bugs Critiques**: 0 bug bloquant

### ❌ Critères d'Échec

- **Fonctionnalité Cassée**: Feature principale non fonctionnelle
- **Performance Dégradée**: Temps de chargement >5s
- **Accessibilité**: Non-conformité WCAG
- **Bug Critique**: Perte de données utilisateur
- **Incompatibilité**: Navigateur principal non supporté

---

_Ce guide doit être mis à jour régulièrement pour refléter les évolutions de l'application et les nouveaux scénarios de test._
