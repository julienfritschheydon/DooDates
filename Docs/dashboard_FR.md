---

## Fiche Technique PRO : Dashboard Admin / Quotas

**Objectif du Composant :** `AdminQuotaDashboard`

**ATTENTION :** La capture d'écran fournie ne correspond PAS au code source de `AdminQuotaDashboard`. Le code source décrit un tableau de bord d'administration pour la gestion des quotas "Guest" (utilisateurs non connectés), avec un thème clair. L'image présente un tableau de bord utilisateur pour "Vos Sondages de Dates", avec un thème sombre. Cette fiche technique est rédigée exclusivement sur la base du code source et ne tiendra pas compte des éléments visuels de l'image.

---

### 1. Vue d'ensemble

Le composant `AdminQuotaDashboard` est une interface d'administration dédiée à la surveillance et à la gestion des quotas d'utilisation des utilisateurs non connectés, identifiés par "fingerprinting". Il fournit aux administrateurs une vue détaillée de l'activité des "guests", leur consommation de crédits, ainsi que des outils pour investiguer et intervenir sur des sessions spécifiques.

- **Public Cible :** Administrateurs de la plateforme (identifiés par rôle ou email).
- **Fonctionnalités Clés :**
  - **Monitoring en temps réel :** Affichage des utilisateurs "guest" avec leurs statistiques de consommation.
  - **Journal d'activité :** Consultation des actions récentes effectuées par les "guests".
  - **Statistiques agrégées :** Aperçu global de l'activité (utilisateurs uniques, requêtes totales, crédits consommés, utilisateurs bloqués).
  - **Visualisation des données :** Graphiques pour la distribution des actions et les principaux consommateurs de ressources.
  - **Filtrage et Recherche :** Capacité à filtrer les données par période, rechercher des utilisateurs spécifiques, et inclure/exclure des sessions de test.
  - **Actions administratives :** Bloquer, réinitialiser les quotas, et supprimer les données d'un "guest".
  - **Détection des sessions de test :** Identification automatique de certains "fingerprints" comme étant des sessions de test.

---

### 2. Aspects Techniques

- **Technologies Frontend :**
  - **React :** Utilisation intensive des hooks `useState`, `useEffect`, `useMemo` pour la gestion de l'état local et l'optimisation des calculs.
  - **Icônes :** `lucide-react` est utilisé pour les icônes (CreditCard, Search, AlertTriangle, UserX, ShieldAlert, Fingerprint, Info, Clock, Trash2, Eye).
  - **Graphiques :** `recharts` est employé pour la création des graphiques (LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Bar, Cell).
- **Base de Données & Backend (via Supabase) :**
  - **Supabase :** Interaction directe avec la base de données via le client `supabase` (importé de `@/lib/supabase`).
  - **Tables Principales :**
    - `guest_quotas` : Stocke les informations et compteurs de quotas pour chaque "guest" (id, fingerprint, ip_address, user_agent, first_seen_at, last_activity_at, total_credits_consumed, date_polls_created, form_polls_created, quizz_created, availability_polls_created, conversations_created, ai_messages, analytics_queries, simulations, is_blocked, blocked_until, blocked_reason).
    - `guest_quota_journal` : Enregistre chaque action coûtant des crédits (id, fingerprint, action_type, cost, resource_id, created_at, metadata).
  - **Sécurité des données :** L'adresse IP est mentionnée comme étant "Hashé en prod", ce qui est une bonne pratique de confidentialité.
- **Gestion de l'Authentification et Autorisation :**
  - `useAuth` (depuis `@/contexts/AuthContext`) est utilisé pour récupérer les informations `user` et `profile`.
  - L'accès est restreint par une vérification `isAdmin` côté client, basée sur le rôle `admin` dans `profile.preferences` ou sur l'adresse email de l'utilisateur (`@doodates.com` ou `admin@doodates.com`). Le code mentionne que cette vérification est "basique" et à "renforcer backend".
- **Chargement des Données :**
  - La fonction `loadQuotas` effectue des requêtes asynchrones vers Supabase pour récupérer les quotas et les entrées de journal.
  - Un filtre temporel (`24h`, `7d`, `30d`) est appliqué pour le journal.
  - Un état `isLoadingData` gère l'affichage d'un indicateur de chargement.
- **Logique Métier et Optimisation :**
  - **Calculs de Quotas :** `calculateTotalPollsCreated` (importé de `@/lib/quotaTracking`) est utilisé pour agréger les différents types de sondages.
  - **Mémoïsation :** `useMemo` est utilisé pour `filteredQuotas`, `displayQuotas`, et `stats` afin d'optimiser les performances en évitant les recalculs coûteux lors des rendus.
  - **Identification des sessions de test :** La fonction `isTestUserSession` utilise des préfixes de `fingerprint` spécifiques (ex: `guest_suspicious_`, `guest_test_`) pour marquer les sessions de test.
  - **Insights utilisateur :** `getFingerprintInsights` génère des observations basées sur les données de quotas de l'utilisateur (multi-produit, IA intensif, actif, etc.).
- **Actions Administratives :**
  - `handleBlockUser` : Met à jour `is_blocked` et `blocked_until` pour un fingerprint donné.
  - `handleResetUser` : Remet à zéro tous les compteurs de quotas et débloque un utilisateur.
  - `handleDeleteUser` : Supprime les entrées du journal puis la ligne de quota pour un fingerprint. Gère l'ordre pour respecter les contraintes de clé étrangère.
- **Gestion des Erreurs :** `try-catch` est utilisé pour les opérations Supabase, avec `logger.error` pour le logging interne et `setLoadError`/`alert` pour l'utilisateur.

---

### 3. UI Détaillée (Basée sur le code, PAS l'image)

Le tableau de bord est conçu avec une esthétique moderne et fonctionnelle, utilisant des composants visuels pour présenter les données de manière claire. Le thème général est clair.

- **Structure de la Page :**
  - Conteneur principal (`max-w-7xl mx-auto`) avec un fond `bg-slate-50`.
- **En-tête du Dashboard :**
  - Titre : "Guest Quota Dashboard" avec une icône `Fingerprint` bleue.
  - Sous-titre : "Monitoring des utilisateurs non connectés (Fingerprinting)".
  - **Sélecteur de Plage de Temps :** Un groupe de boutons ("24h", "7d", "30d") permet de filtrer les données du journal.
- **Cartes KPI (Key Performance Indicators) :**
  - Une grille de 4 cartes affichant des métriques clés :
    - "Utilisateurs Uniques" (icône `UserX`, bleu).
    - "Requêtes Totales" (icône `Fingerprint`, violet).
    - "Crédits Consommés" (icône `CreditCard`, ambre).
    - "Utilisateurs Bloqués" (icône `AlertTriangle`, rouge).
  - Chaque carte a une icône, un titre, une valeur et un fond coloré associé.
- **Section Graphiques :**
  - Disposition en grille, avec 2 graphiques interactifs :
    - **Top 5 Consommateurs de crédits (BarChart) :**
      - Titre : "Top 5 Consommateurs de crédits" avec icône `AlertTriangle` ambre.
      - Barres horizontales représentant les fingerprints (raccourcis) et leur consommation de crédits.
      - Interaction : Un clic sur une barre filtre le tableau des quotas ci-dessous pour n'afficher que cet utilisateur. La barre sélectionnée change de couleur.
    - **Distribution des actions (LineChart) :**
      - Titre : "Distribution des actions" avec icône `Clock` bleue.
      - Graphique linéaire montrant la fréquence des différents types d'actions (ex: création de sondage, messages IA).
- **Messages d'État et d'Information :**
  - **Accès restreint :** Message "Accès restreint" avec icône `ShieldAlert` rouge si l'utilisateur n'est pas admin.
  - **Chargement :** Un spinner (`animate-spin`) s'affiche pendant le chargement des données.
  - **Erreur :** Un message `loadError` peut être affiché.
  - **Filtre "Aucun utilisateur actif" :** Une bannière informative apparaît si tous les utilisateurs réels sont masqués par les filtres (e.g., seuls des tests sont présents). Inclut un bouton "Afficher les sessions de test".
  - **Bannière "Tests Masqués" :** Un bandeau bleu indique si des sessions de test sont masquées, avec un lien pour les afficher.
- **Tableau des Quotas :**
  - **Barre de Filtres et Options :**
    - Champ de recherche ("Rechercher (fingerprint, ID)...") avec icône `Search`.
    - Checkbox "Inclure tests" pour afficher/masquer les sessions de test.
    - Un indicateur "Filtre: {selectedBar}" apparaît si un utilisateur a été sélectionné via le graphique, avec un bouton pour effacer le filtre.
    - Bouton "Rafraîchir les données" avec une icône de rechargement.
  - **Structure du Tableau :**
    - **Colonnes :** "Info" (pour l'expansion des détails), "Fingerprint" (avec raccourci et type/icône), "Conversations", "Polls (tot / date / form / quiz / dispo)", "IA / Analytics / Simulations", "Crédits", "Dernière activité".
    - **Lignes cliquables :** Chaque ligne est cliquable pour "investiguer" (actuellement, cela déclenche l'expansion des détails de la ligne).
    - **Détails de Ligne Expansés (bg-blue-50) :**
      - Titre "Analyse détaillée du fingerprint".
      - Une grille d'insights textuels générés (`Multi-produit`, `Utilisateur IA intensif`, `Actif maintenant`).
      - Affichage du fingerprint complet.
      - Dates de première et dernière activité.
      - Les actions administratives (bloquer, réinitialiser, supprimer) sont implémentées dans le code mais ne sont pas directement exposées par un bouton visible dans la structure HTML fournie pour chaque ligne du tableau dans cet extrait. Elles seraient probablement accessibles via un menu contextuel ou une section dédiée lors de l'expansion.

---

### 4. Maintenance & Améliorations Possibles

- **Sécurité :**
  - **Renforcer l'autorisation :** La vérification `isAdmin` doit être doublée et validée impérativement côté backend pour toutes les actions administratives sensibles (blocage, réinitialisation, suppression).
  - **Protection CSRF :** S'assurer que les actions sensibles sont protégées contre les attaques CSRF.
- **Performance :**
  - **Pagination :** Si le nombre de `guest_quotas` ou `guest_quota_journal` dépasse les limites actuelles (`limit(100)`, `limit(500)`), implémenter une pagination ou un scroll infini pour éviter de charger trop de données simultanément.
  - **Indexation de la BDD :** Vérifier que les colonnes utilisées pour le filtrage (`fingerprint`, `created_at`, `last_activity_at`) sont correctement indexées dans Supabase.
- **Évolutivité :**
  - **Nouveaux types de quotas :** Faciliter l'ajout de nouveaux types de compteurs de quotas (e.g., "features_x_created") en mettant à jour les interfaces et la logique de calcul de manière modulaire.
  - **Configuration des sessions de test :** Les patterns de `isTestUserSession` pourraient être externalisés dans une configuration ou une table de base de données pour faciliter la gestion sans modification de code.
- **UI/UX :**
  - **Actions directes dans le tableau :** Ajouter des boutons d'action (`Bloquer`, `Réinitialiser`, `Supprimer`) directement visibles sur chaque ligne du tableau ou dans la section détaillée pour une meilleure ergonomie. Utiliser un modal de confirmation pour `Delete` (comme `showDeleteConfirm` le suggère).
  - **Détail des fingerprints :** Ajouter une option pour copier le fingerprint complet au clic.
  - **Historique détaillé :** L'expansion des lignes pourrait montrer un historique plus détaillé des actions du "guest" (extraites du `guest_quota_journal`), filtré par ce `fingerprint`.
  - **Tooltips :** Des tooltips pourraient être ajoutés sur les noms de colonnes ou les icônes pour clarifier leur signification.
  - **Thème :** S'assurer que le thème clair est cohérent avec le reste du tableau de bord d'administration.
- **Testabilité :**
  - Écrire des tests unitaires pour les fonctions de logique métier (`isTestUserSession`, `getFingerprintType`, `getFingerprintInsights`, calculs de `stats`).
  - Écrire des tests d'intégration pour les interactions avec Supabase et les rendus de composants.
- **Observabilité :**
  - Le `logger` est déjà en place. S'assurer que les logs sont collectés et monitorés.
  - Ajouter des métriques personnalisées pour suivre l'utilisation de ce tableau de bord d'administration lui-même.

---
