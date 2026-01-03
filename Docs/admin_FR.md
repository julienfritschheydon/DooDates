# Technical Bible: Administration & Quotas

## Écran : quotas

````markdown
## Documentation Technique Interne : Écran 'Administration & Quotas'

### 1. Introduction

L'écran `AdminQuotaDashboard` est une interface d'administration interne conçue pour surveiller et gérer l'utilisation des ressources par les utilisateurs non connectés (guests), identifiés via _fingerprinting_. Il fournit une vue agrégée et détaillée des consommations de crédits, des activités et permet des actions administratives (blocage, réinitialisation, suppression).

### 2. Accès et Autorisations

L'accès à ce tableau de bord est strictement réservé aux administrateurs.

- **Logique de Vérification :** La vérification est effectuée dans le `useEffect` initial du composant. Un utilisateur est considéré comme administrateur si :
  - Son rôle dans le profil utilisateur (`profile.preferences.role`) est `'admin'`.
  - Son adresse email se termine par `'@doodates.com'` ou est `'admin@doodates.com'`.
- **Vue "Accès Restreint" (Image Jointe) :** Si l'utilisateur n'est pas authentifié comme administrateur, le composant affiche un message clair de restriction d'accès.
  - **Composants Visuels :** Une icône `ShieldAlert` (provenant de `lucide-react`) symbolise l'interdiction, un titre `Accès restreint`, et un paragraphe explicatif.
  - **Action :** Un bouton `Retour à l'accueil` (visuellement présent sur la capture, mais non spécifié dans le JSX fourni pour le `return !isAdmin` block) redirigerait normalement l'utilisateur vers une page non-admin.

```jsx
// Extrait de code pour la vue d'accès restreint
if (!isAdmin) {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center p-8 text-center bg-gray-50">
      <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
      <h2 className="text-xl font-bold text-gray-900">Accès restreint</h2>
      <p className="mt-2 text-gray-600">Ce tableau de bord est réservé aux administrateurs.</p>
      {/* <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md">Retour à l'accueil</button> */}
      {/* Le bouton "Retour à l'accueil" n'est pas présent dans le code source fourni mais figure sur l'image */}
    </div>
  );
}
```
````

### 3. Composants et Technologies Clés

- **React Hooks :** `useState`, `useEffect`, `useMemo` pour la gestion de l'état, les effets de bord et l'optimisation des calculs.
- **Contexte d'Authentification :** `useAuth` pour récupérer les informations de l'utilisateur connecté.
- **Base de Données :** `supabase` pour les interactions avec les tables `guest_quotas` et `guest_quota_journal`.
- **Logging :** `logger` pour la journalisation des erreurs.
- **Utilitaires :** `calculateTotalPollsCreated` pour des calculs spécifiques de quotas.
- **Icônes :** `lucide-react` pour les icônes (ex: `CreditCard`, `Search`, `Fingerprint`, `ShieldAlert`).
- **Graphiques :** `recharts` (`LineChart`, `BarChart`, `ResponsiveContainer`) pour la visualisation des données.
- **Styling :** Tailwind CSS (implicite via les classes CSS).

### 4. Structures de Données (Interfaces)

- **`GuestQuota` :** Représente les quotas consommés par un utilisateur non connecté (fingerprint).
  - `id`: ID unique de l'entrée.
  - `fingerprint`: Identifiant unique du guest.
  - `ip_address`: Adresse IP hachée (en production).
  - `user_agent`: User-agent du client.
  - `first_seen_at`: Date de la première activité.
  - `last_activity_at`: Date de la dernière activité.
  - `total_credits_consumed`: Total des crédits consommés.
  - `date_polls_created`, `form_polls_created`, `quizz_created`, `availability_polls_created`, `conversations_created`, `ai_messages`, `analytics_queries`, `simulations`: Compteurs spécifiques par type d'action/ressource.
  - `is_blocked`, `blocked_until`, `blocked_reason`: Statut de blocage.

- **`QuotaJournalEntry` :** Enregistre chaque action qui consomme un quota.
  - `id`, `fingerprint`, `action_type`, `cost`, `resource_id`, `created_at`, `metadata`.

### 5. Flux de Données et Logique

#### 5.1. Initialisation et Chargement des Données

- **`useEffect` d'authentification :** Au montage du composant et aux changements de `user` ou `profile`, vérifie les droits `isAdmin`. Si `true`, déclenche le chargement des quotas via `loadQuotas()`.
- **`loadQuotas()` :**
  - Met `isLoadingData` à `true`.
  - Interroge la table `guest_quotas` (limitée à 100, ordonnée par `last_activity_at` descendant).
  - Interroge la table `guest_quota_journal` (limitée à 500, filtrée par `created_at` selon `timeRange` et ordonnée par `created_at` descendant).
  - Gère les erreurs de chargement (`setLoadError`).
  - Met à jour les états `quotas` et `journal`.

#### 5.2. Gestion de l'État (`useState`)

- `quotas`: Liste des objets `GuestQuota`.
- `journal`: Liste des objets `QuotaJournalEntry`.
- `isLoadingData`: Indique si les données sont en cours de chargement.
- `isAdmin`: Booléen pour les droits d'accès.
- `search`: Terme de recherche textuel pour filtrer les fingerprints.
- `timeRange`: Période de temps pour le journal (`"24h"`, `"7d"`, `"30d"`).
- `loadError`: Message d'erreur si le chargement échoue.
- `expandedRows`: `Set` de `id` pour gérer l'expansion des lignes du tableau.
- `showDeleteConfirm`: `fingerprint` de l'utilisateur en attente de confirmation de suppression.
- `includeTestSessions`: Booléen pour inclure/exclure les sessions de test des filtres et statistiques.
- `selectedBar`: `fingerprint` sélectionné dans le graphique "Top Consommateurs" pour filtrer le tableau.

#### 5.3. Filtrage et Agrégation des Données (`useMemo`)

- **`isTestUserSession(fingerprint: string)` :** Fonction utilitaire pour identifier les fingerprints de sessions de test basés sur des préfixes connus (`guest_suspicious_`, `guest_active_`, `guest_test_`, etc.).
- **`filteredQuotas` :** Applique les filtres de recherche (`search`) et exclut les sessions de test si `includeTestSessions` est `false`. Optimisé par `useMemo`.
- **`displayQuotas` :** Filtre `filteredQuotas` en fonction de `selectedBar` (un fingerprint cliqué dans le graphique des top consommateurs). Optimisé par `useMemo`.
- **`stats` :** Calcule des statistiques agrégées à partir du `journal` et des `filteredQuotas`. Optimisé par `useMemo`.
  - `totalRequests`, `uniqueUsers`, `totalCredits`.
  - `distribution`: Répartition des `action_type`.
  - `chartData`: Données formatées pour les graphiques de distribution.
  - `topConsumers`: Liste des 5 plus gros consommateurs de crédits, incluant un `fullFingerprint` pour l'interaction.

#### 5.4. Actions Administratives

- **`handleBlockUser(fingerprint: string)` :** Bloque un utilisateur pendant 24h en mettant à jour `is_blocked` et `blocked_until`. Requiert une confirmation.
- **`handleResetUser(fingerprint: string)` :** Réinitialise tous les compteurs de quotas (`total_credits_consumed`, `date_polls_created`, etc.) et lève le blocage pour un utilisateur. Requiert une confirmation.
- **`handleDeleteUser(fingerprint: string)` :** Supprime toutes les entrées de `guest_quota_journal` _puis_ l'entrée `guest_quotas` associée à un fingerprint. Ceci est crucial pour respecter les contraintes de clé étrangère. Requiert une confirmation (via `showDeleteConfirm`).

#### 5.5. Logique d'Interaction

- **`handleBarClick(data: any)` :** Détecte le clic sur une barre du graphique des top consommateurs. Si un `fullFingerprint` est présent, il filtre le tableau des quotas et met à jour le champ de recherche. Un second clic sur la même barre annule le filtre.
- **`toggleRowExpansion(id: string)` :** Gère l'expansion/réduction des lignes du tableau pour afficher les détails d'un quota.
- **`handleUserClick(q: GuestQuota)` :** Action principale au clic sur une ligne du tableau, déclenche l'expansion de la ligne.
- **`clearFilters()` :** Réinitialise la recherche et les filtres de barres.

### 6. Interface Utilisateur (Composants React et Cohérence Visuelle)

L'interface est structurée pour une consultation rapide des KPIs et une exploration détaillée des utilisateurs.

#### 6.1. En-tête et Sélection de Période

- **Titre :** `Guest Quota Dashboard` avec l'icône `Fingerprint`.
- **Description :** `Monitoring des utilisateurs non connectés (Fingerprinting)`.
- **Sélecteur de Période :** Boutons (`24h`, `7d`, `30d`) pour filtrer les données du journal. Le bouton actif est mis en évidence (`bg-blue-100 text-blue-700`).

#### 6.2. Cartes KPI (Key Performance Indicators)

Quatre cartes affichent des métriques clés :

- `Utilisateurs Uniques` (`UserX`).
- `Requêtes Totales` (`Fingerprint`).
- `Crédits Consommés` (`CreditCard`).
- `Utilisateurs Bloqués` (`AlertTriangle`).
  Chaque carte a une icône `lucide-react` et une couleur thématique (`blue`, `purple`, `amber`, `red`) pour une lecture rapide.

#### 6.3. Section Graphiques (`recharts`)

Deux graphiques fournissent une visualisation des données :

- **Top 5 Consommateurs de crédits :**
  - `BarChart` horizontal.
  - Affiche les 5 fingerprints ayant consommé le plus de crédits.
  - Interactivité : un clic sur une barre filtre le tableau des quotas sur ce fingerprint spécifique. La barre sélectionnée change de couleur.
- **Distribution des actions :**
  - `LineChart`.
  - Montre la fréquence des différents types d'actions enregistrées dans le journal (ex: `date_poll_created`, `ai_message`).
- Utilise `ResponsiveContainer` pour l'adaptabilité sur différentes tailles d'écran.
- Les tooltips sont stylisés pour s'intégrer à l'UI.

#### 6.4. Barre de Filtres et Options

- **Champ de recherche :** `input` avec icône `Search` pour filtrer les quotas par fingerprint ou ID.
- **Checkbox `Inclure tests` :** Permet d'afficher ou de masquer les sessions d'utilisateurs de test.
- **Indicateur de filtre actif :** Si un fingerprint est sélectionné via le graphique, un badge `Filtre: [fingerprint]` est affiché.
- **Bouton `Rafraîchir les données` :** Pour recharger les données depuis Supabase, avec un spinner (`↻`) pendant le chargement.
- **Gestion Mobile :** Les filtres sont regroupés dans un `details` (`Filtres & Options`) pour une meilleure ergonomie sur mobile.

#### 6.5. Tableau des Quotas

- Tableau (`<table>`) des `GuestQuota`, optimisé pour l'affichage des données tabulaires.
- **Colonnes :**
  - **Info :** Bouton pour déplier/replier les détails d'un quota (`📋`/`📖`).
  - **Fingerprint :** Affichage tronqué (`...`), avec un `fpType` (Test, Suspicious Test, Real User, etc.) et une couleur associée (`getFingerprintType`).
  - **Conversations :** Nombre de conversations créées.
  - **Polls (tot / date / form / quiz / dispo) :** Détail de la création de sondages par type, et un total.
  - **IA / Analytics / Simulations :** Détail des utilisations spécifiques.
  - **Crédits :** `total_credits_consumed`.
  - **Dernière activité :** `last_activity_at` formatée.
- **Lignes dépliables :** Au clic sur une ligne, une nouvelle ligne (`bg-blue-50`) s'affiche en dessous avec des détails supplémentaires :
  - `Analyse détaillée du fingerprint` (insights générés par `getFingerprintInsights`).
  - Fingerprint complet.
  - Dates `first_seen_at` et `last_activity_at`.

#### 6.6. Messages d'État (Tableau)

- **Chargement :** Un spinner (`h-8 w-8 animate-spin`) est affiché pendant `isLoadingData`.
- **Pas de données / Filtrage :**
  - Si aucun quota ne correspond aux filtres, un message (`Aucun guest ne correspond...`) est affiché.
  - Si tous les quotas sont des sessions de test masquées, un message (`Aucun utilisateur actif visible`) avec un bouton `Afficher les sessions de test` est présenté pour encourager l'activation du filtre.
  - Si des sessions de test sont masquées mais des utilisateurs réels sont présents, une bannière bleue (`X sessions de test masquées`) apparaît avec un lien pour les afficher.

### 7. Cohérence Visuelle

L'ensemble de l'interface respecte les conventions de style définies par Tailwind CSS, assurant une expérience utilisateur cohérente et moderne. Les icônes de `lucide-react` sont utilisées de manière significative pour améliorer la compréhension visuelle des données et des actions. Les graphiques `recharts` sont intégrés avec des couleurs et des styles qui s'alignent avec le thème général de l'application. Les interactions (hover sur les lignes, clic sur les barres de graphique) sont visuellement supportées pour guider l'utilisateur.

---

**Fin de la documentation technique.**

```

## Écran : activity
Voici la documentation technique interne pour l'écran "Administration & Quotas - Activité Utilisateur", basé sur le composant React `AdminUserActivity`.

---

## Documentation Technique Interne : Écran "Administration & Quotas - Activité Utilisateur"

**Nom du Composant :** `AdminUserActivity`
**Chemin :** `[votre-chemin]/AdminUserActivity.tsx`
**URL :** `/admin/activity?fingerprint=<fingerprint_id>`

### 1. Description Générale

L'écran `AdminUserActivity` est une interface d'administration permettant de consulter l'activité détaillée d'un utilisateur spécifique, identifié par son `fingerprint`. Il fournit une vue d'ensemble des consommations de quotas, ainsi que des listes détaillées de ses conversations et de son historique d'actions (journal). Cet écran est strictement réservé aux administrateurs.

### 2. Accès et Autorisation

*   **Vérification des Accès :** L'accès à ce composant est contrôlé par le hook `useAuth`. Seuls les utilisateurs dont le `profile?.preferences?.role` est défini sur `"admin"` sont autorisés à y accéder.
*   **Comportement en cas d'Accès Restreint :**
    *   Si l'utilisateur n'est pas administrateur (`!isAdmin`), un message d'erreur est affiché au centre de l'écran, utilisant le composant `Alert` de Shadcn UI, avec la description "Accès réservé aux administrateurs".
    *   L'image fournie illustre un écran "Accès restreint" avec une icône de bouclier et un bouton "Retour à l'accueil", typique d'une gestion d'accès global. Bien que le composant `AdminUserActivity` affiche une `Alert` plus simple pour cette condition (`!isAdmin`), la cohérence visuelle est maintenue via l'utilisation de composants UI standardisés.
*   **Paramètre requis :** Un `fingerprint` doit être fourni via les paramètres de l'URL (`useSearchParams`). Sans `fingerprint`, une `Alert` indique "Aucun fingerprint spécifié".

### 3. Fonctionnalités et Données Affichées

#### 3.1. En-tête de la Page

*   **Navigation :** Un bouton "Fermer" (`Button` de Shadcn UI avec icône `ArrowLeft` de `lucide-react`) permet de fermer l'onglet (si ouvert dans un nouvel onglet).
*   **Titre :** "Activité Utilisateur" avec l'icône `User` de `lucide-react`.
*   **Identification Utilisateur :**
    *   Un `Badge` affiche le type de fingerprint (Guest, Test, Unknown) déterminé par la fonction `getFingerprintType`. Cette fonction utilise des motifs (`guest_suspicious_`, `guest_test_`, etc.) pour catégoriser le `fingerprint`.
    *   Le `fingerprint` complet est affiché dans un bloc `<code>` stylisé.

#### 3.2. Vue d'Ensemble (Carte Récapitulative)

*   Utilise les composants `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` de Shadcn UI.
*   **Données Principales :**
    *   **Crédits Consommés :** `userActivity.total_credits_consumed`.
    *   **Dernière Activité :** `userActivity.last_activity_at`.
*   **Statistiques Détaillées (grid 2x2) :**
    *   **Conversations :** `userActivity.conversations_created`.
    *   **Sondages :** Calculé dynamiquement par `calculateTotalPollsCreated` en additionnant `date_polls_created`, `form_polls_created`, `quizz_created`, `availability_polls_created` depuis `userActivity`.
    *   **IA Calls (Messages IA) :** `userActivity.ai_messages`.
    *   **Queries (Analyses IA) :** `userActivity.analytics_queries`.
*   **Cohérence Visuelle :** Chaque métrique est présentée dans un bloc coloré (`bg-blue-50`, `bg-green-50`, etc.) avec des couleurs différentes pour une identification rapide, reflétant potentiellement les couleurs d'actions du tableau de bord principal.

#### 3.3. Navigation par Onglets (Détails)

Les détails de l'activité sont organisés via des onglets utilisant les composants `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de Shadcn UI.

##### a) Onglet "Conversations"

*   **Données :** Affiche une liste des conversations créées par l'utilisateur.
    *   **Source :** Table `conversations` de Supabase, filtrée par `user_id = fingerprint`.
    *   **Condition de chargement :** Les conversations ne sont chargées que si le `fingerprint` est un UUID valide, pour éviter des erreurs sur les requêtes Supabase (`isValidUUID` check). Pour les `guest_` fingerprints (qui ne sont pas des UUID), cette section sera vide.
*   **Éléments par conversation :**
    *   Titre (`conv.title` ou "Sans titre").
    *   Date de dernière mise à jour (`conv.updated_at`).
    *   Nombre de messages (`conv.message_count` avec icône `MessageSquare`).
    *   Date de création (`conv.created_at` avec icône `Clock`).
    *   ID de conversation (`conv.id`).
*   **Composants :** Chaque entrée est un `div` stylisé. Le contenu est enveloppé dans un `ScrollArea` de Shadcn UI pour la gestion du défilement.
*   **État vide :** Message "Aucune conversation trouvée." si la liste est vide.

##### b) Onglet "Historique Journal"

*   **Données :** Affiche une liste des actions journalisées pour l'utilisateur.
    *   **Source :** Table `guest_quota_journal` de Supabase, filtrée par `fingerprint` et limitée aux 100 dernières entrées (`order: "created_at.desc", limit: "100"`).
*   **Éléments par entrée :**
    *   Type d'action (`entry.action`, transformé en label lisible par `getActionLabel`).
    *   Date et heure de l'action (`entry.created_at`).
    *   Crédits consommés (`entry.credits`).
    *   Métadonnées (`entry.metadata`) affichées sous forme de JSON formaté si présentes.
*   **Composants :** Chaque entrée est un `div` stylisé. Un petit cercle coloré (`h-2 w-2 rounded-full`) indique visuellement le type d'action, basé sur `getActionColor` (ex: `bg-blue-500` pour `conversation_created`). Le contenu est enveloppé dans un `ScrollArea`.
*   **Fonctions d'aide :**
    *   `getActionColor(action: string)`: Mappe le type d'action à une classe CSS de couleur (`bg-blue-500`, `bg-green-500`, etc.).
    *   `getActionLabel(action: string)`: Mappe le type d'action à un libellé français lisible ("Nouvelle Conversation", "Nouveau Sondage", etc.).
*   **État vide :** Message "Aucun historique d'activité trouvé." si la liste est vide.

### 4. Gestion des Données et Erreurs

*   **Sources de Données :** `supabaseSelect` est utilisé pour interagir avec les tables Supabase `guest_quotas`, `conversations`, et `guest_quota_journal`.
*   **Chargement :** L'état `isLoading` gère l'affichage d'un message "Chargement de l'activité utilisateur..."
*   **Erreurs :**
    *   Les erreurs lors du chargement des quotas (`guest_quotas`) sont considérées comme critiques et affichent une `Alert` rouge.
    *   Les erreurs lors du chargement des conversations ou du journal sont capturées mais ne bloquent pas l'affichage général (messages `console.warn` ou `logError`).
    *   `logError` et `ErrorFactory` sont utilisés pour une gestion d'erreurs centralisée et structurée.
*   **`loadUserActivity` :** Une fonction `React.useCallback` qui orchestre le chargement de toutes les données en parallèle (via `Promise.all`) après un chargement initial séquentiel du `guest_quotas`.

### 5. Composants React Essentiels Utilisés

*   **Hooks React :** `useState`, `useEffect`, `useCallback`.
*   **Hooks Custom :** `useAuth` (pour l'authentification/profil), `useSearchParams` (pour lire les paramètres URL).
*   **Utilitaires :** `supabaseSelect` (pour les requêtes API Supabase), `logError`, `ErrorFactory`, `calculateTotalPollsCreated`.
*   **Composants Shadcn UI :**
    *   `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
    *   `Badge`
    *   `Button`
    *   `Alert`, `AlertDescription`
    *   `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
    *   `ScrollArea`
    *   `Separator` (non utilisé directement dans la structure présentée, mais importé)
*   **Icônes (`lucide-react`) :** `ArrowLeft`, `User`, `Calendar` (non utilisé), `MessageSquare`, `BarChart3` (non utilisé), `Brain` (non utilisé), `Search` (non utilisé), `FileText` (non utilisé), `Clock`, `TrendingUp` (non utilisé), `History`, `List` (non utilisé).

### 6. Cohérence Visuelle

L'interface est construite avec Shadcn UI et stylisée avec Tailwind CSS, assurant une apparence moderne, réactive et cohérente avec le reste de l'application. Les couleurs des badges et des indicateurs d'action sont harmonisées pour une meilleure lisibilité.

```
