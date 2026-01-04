# DooDates MVP - Spécifications Techniques

## 🎯 Objectif

Créer un assistant IA de planification qui surpasse tous les outils existants par l'expérience conversationnelle, avec un modèle économique freemium + premium.

👤 "Organise une réunion avec Paul et Marie mardi ou mercredi après-midi"

🤖 "Parfait ! Je crée un sondage pour mardi 15h-17h et mercredi 14h-16h.
Emails de Paul et Marie ?"

👤 "paul@email.com et marie@email.com"

🤖 "Sondage créé et envoyé ! Je vous tiens au courant des réponses."

## 🚀 Différenciation vs Concurrents (Analyse Complète)

### Points Faibles Identifiés Tous Concurrents

#### Doodle (Leader Établi)

- **UX datée** : Interface corporate 2010, pas de micro-animations
- **Mobile non-natif** : Adaptation desktop, pas mobile-first
- **Processus lourd** : 7+ étapes pour créer un sondage
- **Sélection complexe** : Calendrier peu intuitif, pas de suggestions
- **Paywall agressif** : Fonctionnalités importantes en "Pro"

#### Framadate (Alternative Française)

- **Même paradigme** : Formulaires → tableaux classiques malgré design amélioré
- **Durée limitée** : 180 jours puis suppression automatique
- **Pas d'innovation** : Évolution incrémentale, pas révolutionnaire
- **Interface 2015** : Plus colorée que Doodle mais toujours datée
- **Aucune IA** : Processus entièrement manuel

### Avantages Concurrentiels DooDates

#### 🎨 **Interface Ultra-Moderne (2025)**

```
Timeful (2020s)           vs           DooDates (2025)
├─ Design épuré                       ├─ Design system futuriste
├─ Couleurs vibrantes                 ├─ Gradients + animations
├─ Heatmap statique                   ├─ Visualisations interactives
└─ Interface moderne                  └─ Interface révolutionnaire
```

#### 📱 **Mobile-First Experience**

```
Tous Concurrents          vs           DooDates
├─ Desktop→Mobile adapt              ├─ Mobile-first natif
├─ Touch targets standards           ├─ Large touch targets
├─ Gestures basiques                 ├─ Swipe, drag, haptic
└─ Interface adaptée                 └─ Interface fluide
```

#### ⚡ **Création Ultra-Rapide**

```
Timeful (Meilleur): 3-4 étapes      DooDates: 1 étape
├─ 1. Nom + description             ├─ 💬 "Organise réunion
├─ 2. Dates + heures                │     mardi-mercredi
├─ 3. Options avancées              │     avec Paul et Marie"
└─ 4. Validation                    └─ ✨ Sondage créé !
```

#### 🤖 **IA Conversationnelle (RÉVOLUTIONNAIRE)**

- **UNIQUE AU MONDE** : Aucun concurrent (même Timeful) ne fait ça
- **Blue Ocean confirmé** : Même le meilleur concurrent reste manuel
- Création par langage naturel vs formulaires (même modernes)
- Compréhension contextuelle vs saisie manuelle
- Automatisation complète vs processus multi-étapes

#### 💰 **Modèle Économique Optimal**

```
Doodle: Abonnement    Framadate: Limité    Timeful: Gratuit    DooDates: Hybride
├─ Coût récurrent    ├─ 180 jours max     ├─ Pas de revenue   ├─ Paiement unique
├─ Fonctions bridées ├─ Contraintes tech  ├─ Pas de premium   ├─ Fonctions complètes
└─ ROI incertain     └─ Pas pérenne       └─ Pas scalable     └─ ROI immédiat
```

### 🎯 Conclusion Stratégique

**Timeful est le meilleur concurrent actuel** (surpasse Doodle/Framadate) **MAIS** :

- Reste dans l'ancien paradigme formulaires → calendrier → votes
- Aucune IA ni automatisation
- **Confirme notre Blue Ocean** : Même le leader technique n'a pas d'IA

**DooDates = Seul concurrent avec IA conversationnelle au monde** 🚀

## 🛠️ Stack Technique Recommandée (2025)

### Frontend

- **Next.js 15** (React 18 + App Router)
- **TypeScript** pour la robustesse
- **TailwindCSS** pour le design moderne rapide
- **next-intl** pour l'internationalisation
- **Framer Motion** pour les animations fluides

### Backend

- **Next.js API Routes** (évite backend séparé)
- **Supabase** (BaaS complet)
  - PostgreSQL database
  - Authentication intégrée
  - Real-time subscriptions
  - Edge functions

### IA Conversationnelle

- **OpenAI GPT-4** pour compréhension naturelle
- **LangChain** pour workflows conversationnels
- **Pinecone** (vector database) pour contexte utilisateur
- **Vercel AI SDK** pour intégration streaming

### Infrastructure

- **Vercel** pour le déploiement
- **Supabase Cloud** pour la base de données
- **Cloudflare** pour les domaines et CDN
- **Upstash Redis** pour le cache (si besoin)

### Intégrations

- **Slack SDK** pour bot Slack
- **Google Calendar API** pour synchronisation
- **Twilio** pour SMS (notifications)
- **Stripe** pour paiements premium

### Outils complémentaires

- **Prisma** comme ORM (avec Supabase)
- **Zod** pour la validation de données
- **React Hook Form** pour les formulaires
- **date-fns** pour la gestion des dates

## 📋 Fonctionnalités MVP (Phase 1)

### 🔐 Authentification

- [ ] Inscription/connexion email + mot de passe
- [ ] Récupération de mot de passe
- [ ] Profil utilisateur basique (nom, email, préférences) y compris effacer son compte
- [ ] Sessions persistantes

### 📊 Sondages de dates

- [ ] **Création de sondage**
  - [ ] Formulaire multi-étapes optimisé
  - [ ] Étape 1: Titre (max 100 chars) + Description optionnelle (max 500 chars)
  - [ ] Étape 2: Sélection dates/créneaux avec calendrier visuel
  - [ ] Étape 3: Options avancées (deadline, anonymat, commentaires)
  - [ ] Validation temps réel avec Zod schema
  - [ ] Sauvegarde automatique en brouillon (localStorage)
  - [ ] Prévisualisation avant publication

- [ ] **Copier un ancien sondage**
  - [ ] Duplication intelligente
  - [ ] Sélection depuis historique avec recherche/filtres
  - [ ] Copie titre + description avec suffixe "(Copie)"
  - [ ] Adaptation automatique des dates (décalage +7/+14 jours)
  - [ ] Réinitialisation votes et participants
  - [ ] Nouveau slug unique généré automatiquement
  - [ ] Option "Copier et modifier" vs "Copier et publier"

- [ ] **Interface de vote moderne**
  - [ ] Design mobile-first responsive
  - [ ] Grille adaptative (1-3 colonnes selon écran)
  - [ ] Interactions tactiles optimisées (large touch targets)
  - [ ] Feedback visuel immédiat (hover, active, selected states)
  - [ ] Animations micro-interactions (Framer Motion)
  - [ ] Loading states et skeleton screens
  - [ ] Gestion offline avec cache local

- [ ] **Fonctionnalités avancées**
  - [ ] Vote conditionnel ("Si oui" / "Si non" / "Peut-être")
  - [ ] Votes multiples ou exclusifs (paramétrable)
  - [ ] Contraintes participants min/max par créneau
  - [ ] Vote anonyme vs nominatif (paramétrable)
  - [ ] Modification de vote autorisée (paramétrable)
  - [ ] Deadline automatique avec countdown visuel

- [ ] **Affichage des résultats en temps réel**
  - [ ] Real-time via Supabase subscriptions
  - [ ] WebSocket connection avec auto-reconnect
  - [ ] Mise à jour instantanée sans refresh
  - [ ] Indicateur "quelqu'un vote en ce moment"
  - [ ] Animations d'apparition des nouveaux votes
  - [ ] Synchronisation offline/online automatique

- [ ] **Visualisations avancées**
  - [ ] Graphiques barres horizontales (Chart.js ou Recharts)
  - [ ] Code couleur par niveau de disponibilité
  - [ ] Détail participants par créneau (hover/click)
  - [ ] Export visuel des résultats (PNG/PDF)
  - [ ] Vue calendrier avec heatmap disponibilités

- [ ] **Partage par lien public**
  - [ ] Génération de liens intelligents
  - [ ] Slug personnalisable (doodates.com/poll/mon-sondage)
  - [ ] URL courtes avec service intégré (doo.to/abc123)
  - [ ] QR Code généré automatiquement
  - [ ] Meta tags Open Graph pour prévisualisation sociale
  - [ ] Password protection optionnel
  - [ ] Expiration automatique configurable

- [ ] **Partage social optimisé**
  - [ ] Boutons natifs (WhatsApp, Telegram, Email, Copy)
  - [ ] Messages pré-formatés adaptés par plateforme
  - [ ] Deep linking mobile (ouvre app si installée)
  - [ ] Analytics de partage et ouvertures
  - [ ] Suivi des participants par source

- [ ] **Commentaires optionnels**
  - [ ] Système de commentaires avancé
  - [ ] Threading (réponses aux commentaires)
  - [ ] Markdown support basique (gras, italique, liens)
  - [ ] Mentions @participant avec notifications
  - [ ] Modération automatique (filtre spam/grossièretés)
  - [ ] Export des commentaires avec les résultats
  - [ ] Notifications temps réel des nouveaux commentaires

- [ ] **Effacer un sondage**
  - [ ] Suppression sécurisée
  - [ ] Confirmation double avec saisie titre
  - [ ] Soft delete (30 jours avant suppression définitive)
  - [ ] Notification participants si sondage actif
  - [ ] Export automatique avant suppression
  - [ ] Anonymisation RGPD complète
  - [ ] Logs audit pour conformité

### 👤 Gestion utilisateur

- [ ] Dashboard personnel avec historique des sondages
- [ ] Sondages créés vs sondages auxquels j'ai participé
- [ ] Duplication/modèle de sondage
- [ ] Paramètres de notification
- [ ] Effacer un compte

### 📱 Expérience utilisateur (Détails techniques)

#### Interface responsive mobile-first

- [ ] **Design système et composants**
  - [ ] Design tokens configurables (couleurs, espacements, typographie)
  - [ ] Composants UI réutilisables avec Storybook
  - [ ] Grille adaptative CSS Grid + Flexbox
  - [ ] Breakpoints optimisés (320px, 768px, 1024px, 1440px)
  - [ ] Touch targets minimum 44px (accessibilité)
  - [ ] Gestures tactiles avancées (swipe, pinch, long press)

- [ ] **Performance mobile**
  - [ ] Bundle splitting par route (lazy loading)
  - [ ] Images optimisées avec Next.js Image (WebP, AVIF)
  - [ ] Service Worker pour cache agressif
  - [ ] Préchargement intelligent des ressources critiques
  - [ ] Tree shaking automatique
  - [ ] Code minification et compression Gzip/Brotli

#### Design moderne avec micro-animations

- [ ] **Animation système Framer Motion**
  - [ ] Transitions de page fluides (slide, fade, scale)
  - [ ] Loading states animés (skeleton, shimmer, pulse)
  - [ ] Micro-interactions (button hover, card lift, success checkmarks)
  - [ ] Animations de feedback (error shake, success bounce)
  - [ ] Spring physics pour naturalité
  - [ ] Respect des préférences `prefers-reduced-motion`

- [ ] **États visuels avancés**
  - [ ] Hover states desktop avec fallback tactile
  - [ ] Focus visible conforme WCAG 2.1
  - [ ] Active states pour feedback immédiat
  - [ ] Loading states avec progress indicators
  - [ ] Empty states avec illustrations engageantes
  - [ ] Error states avec actions de récupération

#### Mode sombre/clair

- [ ] **Implémentation technique**
  - [ ] CSS custom properties pour thèmes
  - [ ] Détection automatique `prefers-color-scheme`
  - [ ] Toggle persistant dans localStorage
  - [ ] Synchronisation cross-tab/device
  - [ ] Transitions fluides entre thèmes (0.3s ease)
  - [ ] Contraste optimisé WCAG AA (4.5:1 minimum)

- [ ] **Optimisations avancées**
  - [ ] Images adaptatives par thème (logos, illustrations)
  - [ ] Graphiques/charts adaptatifs (couleurs, contraste)
  - [ ] Syntax highlighting code adaptatif
  - [ ] Favicon dynamique selon thème
  - [ ] Status bar adaptation mobile (theme-color meta)
  - [ ] Mode automatique selon heure du jour

#### Feedback utilisateur en temps réel

- [ ] **Système de notifications toast**
  - [ ] Positioning intelligent (évite le clavier mobile)
  - [ ] Stacking automatique avec limite (max 3)
  - [ ] Auto-dismiss configurable par type
  - [ ] Actions rapides intégrées (Annuler, Voir plus)
  - [ ] Animations entrée/sortie fluides
  - [ ] Persistence cross-tab pour notifications importantes

- [ ] **Feedback contextuel avancé**
  - [ ] Validation de formulaire en temps réel (debounced)
  - [ ] Indicateurs de progression multi-étapes
  - [ ] Confirmations visuelles inline (✓ Sauvegardé)
  - [ ] Hints proactifs basés sur comportement
  - [ ] Tooltips intelligents (apparition conditionnelle)
  - [ ] Error recovery suggestions automatiques

#### Notifications push

- [ ] **PWA Push Notifications**
  - [ ] Service Worker avec notification API
  - [ ] Permission progressive (pas de spam immédiat)
  - [ ] Subscription management utilisateur
  - [ ] Fallback email si push indisponible
  - [ ] Deep linking vers contenu spécifique
  - [ ] Badge counter sur icône app

- [ ] **Stratégie de notifications intelligente**
  - [ ] Timing optimal basé sur timezone utilisateur
  - [ ] Frequency capping (max 3 par jour)
  - [ ] Grouping par contexte (même sondage)
  - [ ] Personalization basée sur historique
  - [ ] A/B testing pour optimiser engagement
  - [ ] Analytics détaillées (delivered, opened, clicked)

### 🌍 International (Détails techniques)

#### Support multilingue (EN, FR, ES, DE)

- [ ] **Architecture i18n avec next-intl**
  - [ ] Routing par locale (/en/poll, /fr/sondage)
  - [ ] Messages hiérarchiques par namespace
  - [ ] Fallback intelligent (DE → EN si traduction manquante)
  - [ ] Pluralization rules par langue (0, 1, few, many)
  - [ ] Interpolation avec variables typées
  - [ ] Messages dynamiques côté serveur et client

- [ ] **Gestion des traductions**
  - [ ] Fichiers JSON structurés par page/composant
  - [ ] Validation TypeScript des clés de traduction
  - [ ] Missing translations detection en dev
  - [ ] Traduction automatique suggestions (GPT-4)
  - [ ] Version control des changements traductions
  - [ ] Crowdsourcing platform intégration (future)

#### Gestion des fuseaux horaires

- [ ] **Gestion temporelle robuste avec date-fns-tz**
  - [ ] Détection automatique timezone navigateur
  - [ ] Conversion bidirectionnelle UTC ↔ Local
  - [ ] Affichage multi-timezone pour organisateurs globaux
  - [ ] Calcul intelligent heures chevauchement
  - [ ] DST (Daylight Saving Time) handling automatique
  - [ ] Validation cohérence dates cross-timezone

- [ ] **UX timezone-aware**
  - [ ] Sélecteur timezone avec recherche intelligente
  - [ ] Aperçu heures locales participants
  - [ ] Warnings automatiques conflits timezone
  - [ ] Suggestions créneaux optimaux multi-timezone
  - [ ] Calendrier visuel avec bandes horaires
  - [ ] Export .ics avec timezone metadata correcte

#### Formats de date localisés

- [ ] **Localisation formats avec Intl API**
  - [ ] Formats date courts/longs par locale
  - [ ] Premiers jours semaine (lundi vs dimanche)
  - [ ] Formats heures 12h/24h automatiques
  - [ ] Noms mois/jours traduits dynamiquement
  - [ ] Formats relatifs intelligents ("hier", "dans 3 jours")
  - [ ] Calendriers alternatifs (Hijri, Hebrew) future

- [ ] **Cohérence cross-platform**
  - [ ] Parsing robuste formats utilisateur
  - [ ] Validation input avec feedback localisé
  - [ ] Fallback formats si Intl indisponible
  - [ ] Testing automatisé toutes locales
  - [ ] Screenshots comparatifs par locale
  - [ ] QA workflow traductions avant release

## 🏗️ Architecture Base de Données

### Table `users`

```sql
- id (uuid, pk)
- email (text, unique)
- name (text)
- created_at (timestamp)
- updated_at (timestamp)
- preferences (jsonb) -- langue, timezone, etc.
```

### Table `polls`

```sql
- id (uuid, pk)
- user_id (uuid, fk)
- title (text)
- description (text)
- slug (text, unique) -- pour URLs propres
- settings (jsonb) -- config poll
- created_at (timestamp)
- expires_at (timestamp)
- status (enum: active, closed, expired)
```

### Table `poll_options`

```sql
- id (uuid, pk)
- poll_id (uuid, fk)
- option_type (enum: date, datetime, text)
- option_value (text) -- date ISO ou texte
- created_at (timestamp)
```

### Table `votes`

```sql
- id (uuid, pk)
- poll_id (uuid, fk)
- voter_name (text) -- nom du votant
- voter_email (text, optional)
- votes (jsonb) -- {option_id: "yes|no|maybe"}
- created_at (timestamp)
- updated_at (timestamp)
```

## 🎨 Design System

### Couleurs principales

- **Primary**: #3B82F6 (blue-500)
- **Secondary**: #10B981 (emerald-500)
- **Accent**: #F59E0B (amber-500)
- **Dark**: #1F2937 (gray-800)
- **Light**: #F9FAFB (gray-50)

### Composants clés

- **PollCard**: Carte de sondage avec preview
- **VoteGrid**: Interface de vote avec tableau
- **DatePicker**: Sélecteur de dates moderne
- **UserAvatar**: Avatar utilisateur avec initiales
- **ShareModal**: Modal de partage avec liens/QR

## 🚀 Plan de développement (4 semaines)

### Semaine 1: Setup & Auth

- [x] Setup Next.js + Supabase + Vercel
- [x] Configuration TypeScript + TailwindCSS
- [x] System d'authentification complet
- [x] Layout de base + navigation

### Semaine 2: Core Features

- [x] Création de sondages
- [x] Interface de vote
- [x] Base de données + API
- [x] Dashboard utilisateur basique

### Semaine 3: UX & Polish

- [x] Design responsive mobile
- [x] Animations et micro-interactions
- [x] Gestion des erreurs
- [x] Optimisations performance

### Semaine 4: International & Deploy

- [x] Internationalisation (4 langues)
- [x] Tests utilisateur
- [x] SEO basique
- [x] Déploiement production

## 📊 Métriques de succès

### MVP Goals (1 mois)

- **50+ sondages créés**
- **20+ utilisateurs inscrits**
- **80%+ taux de complétion des votes**
- **<2s temps de chargement**
- **>95% uptime**

### Feedback qualitatif

- "Plus moderne que Framadate"
- "Plus simple que Doodle"
- "J'aime avoir mon historique"
- "Interface mobile excellente"

## 🔮 Roadmap Post-MVP

### Phase 2 (Mois 2-3): Premium Features

- [ ] Rappels automatiques
- [ ] Personnalisation avancée (branding)
- [ ] Synchronisation calendriers (Google, Outlook)
- [ ] Analytics détaillées des sondages

### Phase 3 (Mois 4-6): Monétisation

- [ ] Plans premium (10€ unique)
- [ ] API publique pour intégrations
- [ ] Templates de sondages avancés

### Phase 4 (Mois 6+): Scale

- [ ] Intégrations visioconférence (Zoom, Meet)
- [ ] Workflow automatiques

## 💰 Business Model (Modèle Hybride)

### Approche 1: Paiement Unique Limité (Recommandé)

- **Gratuit**:
  - 3 sondage actif
  - 20 votes/mois
  - Interface basique
  - Pas d'historique
- **DooDates Pro (15€ unique)**:
  - **100 sondages lifetime** (limité mais généreux)
  - Votes illimités
  - Historique permanent
  - Personnalisation complète
  - Intégration calendriers
  - Support

### Approche 2: Options Premium Modulaires

- **Gratuit**: Base limitée (comme ci-dessus)

- **IA Assistant (10€ unique)**:
  - Interface conversationnelle
  - Compréhension naturelle
  - Création automatique de sondages
  - Apprentissage personnalisé

- **Intégrations Pro (8€ unique)**:
  - Slack/Teams bot
  - Synchronisation calendriers
  - Webhooks et API
  - Notifications SMS

- **Analytics & Automation (5€ unique)**:
  - Rappels automatiques
  - Analytics détaillées
  - Templates avancés
  - Export PDF professionnel

- **Modèle Hybride Recommandé ⭐**

```
GRATUIT                 PRO (15€)              PREMIUM (25€)
├─ 3 sondages          ├─ 100 sondages         ├─ 500 sondages
├─ 20 votes/mois       ├─ Votes illimités      ├─ Votes illimités
├─ 30 jours            ├─ Historique permanent ├─ Historique permanent
└─ Interface basique   ├─ Personnalisation     ├─ Tout Pro +
                       ├─ Export avancé        ├─ IA Assistant
                       └─ Support email        ├─ Intégrations Slack
                                              ├─ Calendriers sync
                                              ├─ Rappels auto
                                              └─ Analytics avancées
```

### Add-ons (Optionnels)

- **Enterprise Slack Bot**: +10€/équipe
- **SMS Notifications**: +3€ (100 SMS inclus)
- **Custom Domain**: +5€ (votredomaine.com/sondage)
- **White Label**: +20€ (supprime branding DooDates)

### Analyse Financière

#### Coûts mensuels

- **Infrastructure**: 120$/mois
- **Total**: ~120€/mois

#### Revenus cibles

- **Break-even**: 20 ventes Pro/mois OU 13 ventes Premium/mois
- **Objectif réaliste Y1**:
  - 150 Pro (15€) = 2250€
  - 50 Premium (25€) = 1250€
  - Add-ons = 500€
  - **Total Y1**: 4000€ (rentable dès mois 6)

#### Avantages du modèle hybride

✅ **Simple**: 2 tiers principaux seulement  
✅ **Prévisible**: Paiement unique = pas d'abonnement  
✅ **Flexible**: Add-ons pour besoins spécifiques  
✅ **Scalable**: Premium inclut IA (différenciateur clé)  
✅ **Rentable**: Limites raisonnables (100-500 sondages)

#### Justification des limites

- **100 sondages** = ~2 ans d'usage intensif pour utilisateur individuel
- **500 sondages** = ~5-10 ans d'usage, même pour freelances actifs
- **Coût d'opportunité** : Client satisfait = bouche-à-oreille
- **LTV élevée** : Pas de churn d'abonnement

### Stratégie de pricing

1. **Phase MVP**: Gratuit seulement (validation marché)
2. **Phase 2**: Lancement Pro 15€ (fonctionnalités standard)
3. **Phase 3**: Lancement Premium 25€ (avec IA)
4. **Phase 4**: Add-ons enterprise

### Métriques de succès

- **Conversion gratuit → Pro**: >5%
- **Conversion Pro → Premium**: >20%
- **NPS**: >50 (satisfaction élevée)
- **Support tickets**: <2% des utilisateurs/mois

## 🔧 Commandes de développement

```bash
# Setup initial
npx create-next-app@latest doodates --typescript --tailwind --app
cd doodates
npm install @supabase/supabase-js @supabase/auth-ui-react
npm install prisma @prisma/client
npm install next-intl framer-motion react-hook-form zod
npm install date-fns lucide-react

# Development
npm run dev           # Mode développement
npm run build        # Build production
npm run start        # Start production
npx prisma studio    # Admin base de données
```

## 📁 Structure projet

```
doodates/
├── app/
│   ├── [locale]/
│   │   ├── dashboard/
│   │   ├── poll/[slug]/
│   │   └── page.tsx
│   ├── api/
│   └── globals.css
├── components/
│   ├── ui/           # Composants de base
│   ├── forms/        # Formulaires
│   └── layout/       # Layout components
├── lib/
│   ├── supabase.ts   # Client Supabase
│   ├── auth.ts       # Utils auth
│   └── utils.ts      # Utilitaires
├── types/
└── prisma/
    └── schema.prisma
```

## ✅ Prêt à commencer !

Cette stack vous donne:

- **Développement rapide** (Next.js + Supabase)
- **Moderne et scalable** (TypeScript + PostgreSQL)
- **International ready** (next-intl + timezone support)
- **Coût minimal** (Vercel + Supabase tiers gratuits pour commencer)
- **Production ready** (monitoring, analytics, SEO inclus)

**Prochaine étape**: `npx create-next-app@latest doodates` ? 🚀
