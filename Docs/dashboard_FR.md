```markdown
# Fiche Technique : Dashboard Admin / Quotas

## Vue d'ensemble

Le "Guest Quota Dashboard" est une interface d'administration essentielle conçue pour surveiller et gérer l'activité des utilisateurs non connectés sur la plateforme. Il utilise le *fingerprinting* pour suivre la consommation de crédits et la création de ressources (sondages, conversations, interactions IA, etc.). Cet outil offre une visibilité sur les métriques clés, l'identification des utilisateurs à forte consommation, la distribution des actions, et permet des actions administratives directes comme le blocage ou la réinitialisation des quotas. L'objectif est de prévenir les abus et d'assurer une utilisation équitable des ressources.

## Technique

### Technologies Utilisées
*   **Frontend Framework:** React.js
*   **Gestion d'état:** `useState`, `useEffect`, `useMemo` de React
*   **Composants d'interface:** Lucide-React (icônes)
*   **Graphiques:** Recharts (LineChart, BarChart)
*   **Base de Données & Authentification:** Supabase (pour la persistance des données et la vérification des rôles)
*   **Utilitaires:** `@/contexts/AuthContext`, `@/lib/supabase`, `@/lib/logger`, `@/lib/quotaTracking`

### Modèle de Données

Deux interfaces principales structurent les données affichées :

1.  **`GuestQuota` (guest_quotas table):**
    *   `id`: Identifiant unique du quota.
    *   `fingerprint`: Empreinte numérique de l'utilisateur (identifiant unique).
    *   `ip_address`: Adresse IP de l'utilisateur (hachée en production pour la confidentialité).
    *   `user_agent`: User-Agent du navigateur de l'utilisateur.
    *   `first_seen_at`: Date et heure de la première activité.
    *   `last_activity_at`: Date et heure de la dernière activité.
    *   `total_credits_consumed`: Nombre total de crédits consommés par l'utilisateur.
    *   `date_polls_created`, `form_polls_created`, `quizz_created`, `availability_polls_created`: Compteurs pour les différents types de sondages créés.
    *   `conversations_created`: Nombre de conversations initiées.
    *   `ai_messages`: Nombre de messages envoyés à l'IA.
    *   `analytics_queries`: Nombre de requêtes d'analyse effectuées.
    *   `simulations`: Nombre de simulations réalisées.
    *   `is_blocked`: Indique si l'utilisateur est bloqué.
    *   `blocked_until`: Date jusqu'à laquelle l'utilisateur est bloqué.
    *   `blocked_reason`: Raison du blocage.

2.  **`QuotaJournalEntry` (guest_quota_journal table):**
    *   `id`: Identifiant unique de l l'entrée du journal.
    *   `fingerprint`: Empreinte numérique de l'utilisateur associé.
    *   `action_type`: Type d'action réalisée (ex: `create_poll_date`, `send_ai_message`).
    *   `cost`: Coût en crédits de l'action.
    *   `resource_id`: ID de la ressource créée ou affectée par l'action.
    *   `created_at`: Date et heure de l'enregistrement de l'action.
    *   `metadata`: Données additionnelles concernant l'action.

### Flux de Données et Logique Applicative

1.  **Vérification Admin (`useEffect`):** Au chargement du composant, l'application vérifie si l'utilisateur a un rôle `admin` via `AuthContext` ou si son email correspond à un domaine ou une adresse email admin spécifique (`@doodates.com`, `admin@doodates.com`). L'accès au dashboard est strictement contrôlé.
2.  **Chargement des Données (`loadQuotas`):**
    *   Récupère les 100 dernières entrées `guest_quotas` triées par `last_activity_at`.
    *   Récupère les 500 dernières entrées `guest_quota_journal` filtrées par `created_at` selon la `timeRange` sélectionnée (24h, 7j, 30j).
    *   Les erreurs sont gérées via `setLoadError` et `logger.error`.
3.  **Filtrage et Agrégation des Données (`useMemo`):**
    *   **`filteredQuotas`:** Filtre les `quotas` par une chaîne de `search` (fingerprint, ID) et exclut par défaut les sessions de test (`isTestUserSession`).
    *   **`displayQuotas`:** Applique un filtre supplémentaire si une barre de `Top Consumers` est sélectionnée.
    *   **`stats`:** Calcule des statistiques agrégées à partir du `journal` et des `filteredQuotas` :
        *   `totalRequests`, `uniqueUsers`, `totalCredits`.
        *   `distribution` des actions (types d'actions et leur fréquence).
        *   `chartData` pour la distribution des actions.
        *   `topConsumers` (les 5 utilisateurs les plus consommateurs, y compris le calcul des sondages totaux via `calculateTotalPollsCreated`).
4.  **Actions Administratives:**
    *   **`handleBlockUser`:** Bloque un utilisateur pour 24h via `supabase.from("guest_quotas").update()`.
    *   **`handleResetUser`:** Réinitialise tous les compteurs de consommation et les états de blocage d'un utilisateur.
    *   **`handleDeleteUser`:** Supprime toutes les entrées du journal (`guest_quota_journal`) puis l'entrée de quota (`guest_quotas`) pour un utilisateur. Gère la contrainte de clé étrangère.
5.  **Détection des sessions de test (`isTestUserSession`):** Une fonction utilitaire identifie les fingerprints correspondant à des patterns de test connus (ex: `guest_suspicious_`, `guest_test_`).
6.  **Insights des utilisateurs (`getFingerprintInsights`):** Analyse les données d'un `GuestQuota` pour générer des observations contextuelles (multi-produit, utilisateur IA intensif, état d'activité récent).
7.  **Gestion de l'UI:** `expandedRows` pour l'expansion des détails dans le tableau, `showDeleteConfirm` pour une confirmation de suppression.

### Intégrations
*   **Supabase:** Utilisé comme backend pour les opérations CRUD sur les tables `guest_quotas` et `guest_quota_journal`.
*   **`AuthContext`:** Fournit l'état de l'utilisateur (`user`, `profile`) pour la vérification des droits d'administrateur.
*   **`logger`:** Pour l'enregistrement des erreurs et la télémétrie.
*   **`calculateTotalPollsCreated`:** Fonction utilitaire pour calculer le total des sondages à partir des compteurs spécifiques.

## Interface Utilisateur (UI/UX)

Le dashboard est conçu pour être intuitif et riche en informations, avec une structure claire et des éléments interactifs.

### Layout Général
*   **En-tête:** Titre (`Guest Quota Dashboard`), sous-titre explicatif, et un sélecteur de `timeRange` (24h, 7j, 30j) pour filtrer les données affichées.
*   **KPI Cards:** Quatre cartes affichant des indicateurs clés de performance : "Utilisateurs Uniques", "Requêtes Totales", "Crédits Consommés", et "Utilisateurs Bloqués". Chaque carte intègre une icône pertinente et un code couleur.
*   **Section Graphiques:**
    *   **"Top 5 Consommateurs de crédits" (BarChart):** Affiche les 5 utilisateurs (fingerprints raccourcis) ayant consommé le plus de crédits. Cliquable pour filtrer le tableau principal.
    *   **"Distribution des actions" (LineChart):** Présente la fréquence des différents types d'actions enregistrées dans le journal.
*   **Section Tableau des Quotas:** La section principale listant les utilisateurs.
    *   **Filtres:** Champ de recherche (`Search`) pour le fingerprint/ID, une case à cocher pour "Inclure tests", un bouton "Rafraîchir les données".
    *   **Tableau:** Affiche les détails pour chaque `GuestQuota` :
        *   Info (bouton d'expansion)
        *   Fingerprint (raccourci, type avec icône et couleur)
        *   Conversations
        *   Polls (total et détail par type)
        *   IA / Analytics / Simulations
        *   Crédits consommés
        *   Dernière activité
    *   **Ligne de détails (expansible):** Chaque ligne du tableau peut être étendue pour révéler des analyses détaillées (`getFingerprintInsights`), le fingerprint complet, et les dates de première/dernière activité.
    *   **Message d'état:** Affiche un message si aucun utilisateur ne correspond aux filtres ou si les sessions de test sont masquées.

### Interactivité et Expérience Utilisateur
*   **Sélection de Plage Horaire:** Les boutons "24h", "7d", "30d" permettent de modifier la période d'analyse.
*   **Recherche et Filtres:** Un champ de recherche dynamique et une checkbox "Inclure tests" permettent d'affiner la liste des utilisateurs. Un indicateur "Filtre: {fingerprint}" apparaît lorsque le graphique "Top Consumers" est utilisé pour filtrer.
*   **Graphiques Interactifs:** Le BarChart des "Top Consumers" est cliquable, permettant de filtrer le tableau principal sur le fingerprint sélectionné.
*   **Expansion des Lignes:** Le bouton "📋" / "📖" dans le tableau permet de développer/réduire les détails d'un utilisateur.
*   **Chargement et Erreurs:** Des indicateurs de chargement (spinner) sont affichés pendant le fetch des données. Les erreurs de chargement sont affichées de manière discrète.
*   **Actions Contextuelles:** Des actions (Bloquer, Réinitialiser, Supprimer) sont disponibles via des boutons de confirmation pour chaque utilisateur.

### Design et Accessibilité
*   **Responsive Design:** Utilise des classes Tailwind CSS (`sm:`, `lg:`) pour s'adapter aux différentes tailles d'écran.
*   **Iconographie:** Utilisation d'icônes Lucide-React pour renforcer la compréhension visuelle.
*   **Couleurs:** Palette de couleurs cohérente pour les types de sondages, les indicateurs KPI et les types de fingerprint.
*   **Messages clairs:** Messages d'erreur et d'information compréhensibles.
*   **État vide:** Un état explicite est prévu lorsque tous les utilisateurs "réels" sont filtrés et que seules des sessions de test restent.

## Maintenance et Évolution

### Points Forts
*   **Modularité:** Le code est bien structuré avec des composants React et des fonctions utilitaires (`isTestUserSession`, `getFingerprintInsights`).
*   **Observabilité:** Intégration du `logger` pour un suivi des erreurs robuste.
*   **Clarté du Code:** Utilisation de `useMemo` pour optimiser les calculs et éviter les re-rendus inutiles, ce qui améliore la performance.
*   **Sécurité:** Vérification du rôle d'administrateur côté client et utilisation de Supabase pour les opérations de base de données.

### Axes d'Amélioration et Évolution
*   **Renforcement de la sécurité backend:** La vérification admin est actuellement aussi côté client. Un renforcement côté serveur est crucial pour les actions sensibles (blocage, suppression).
*   **Gestion des très grands datasets:** Si le nombre de `guest_quotas` ou `guest_quota_journal` dépasse significativement les limites actuelles (100/500), des stratégies de pagination ou de chargement infini seront nécessaires.
*   **Détail utilisateur dédié:** Plutôt qu'une simple expansion de ligne, un clic sur un utilisateur pourrait ouvrir un modal ou naviguer vers une page de détails plus complète avec un historique journalier.
*   **Filtrage par IP:** L'adresse IP étant hachée, un mécanisme de recherche par IP (si déhachage ou indexation est possible) pourrait être utile pour certains cas d'investigation.
*   **Actions groupées:** Possibilité de bloquer/réinitialiser/supprimer plusieurs utilisateurs en sélectionnant des lignes.
*   **Alertes:** Intégration de seuils d'alerte pour la consommation de crédits ou la détection de comportements suspects.
*   **Personnalisation des blocs:** Permettre aux administrateurs de définir des durées de blocage et des raisons personnalisées.
*   **Graphiques de tendance:** Ajout de graphiques montrant l'évolution des crédits consommés ou des actions au fil du temps.
*   **Tests End-to-End:** Mise en place de tests E2E pour s'assurer que les actions admin fonctionnent correctement après chaque déploiement.
```