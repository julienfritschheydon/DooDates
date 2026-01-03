# 🔐 Accès au Tableau de Bord Admin

## 📍 URL d'Accès

```
http://localhost:8080/DooDates/admin
```

En production :

```
https://votre-domaine.com/DooDates/admin
```

## 🔑 Authentification Requise

L'accès au tableau de bord admin est **protégé** et nécessite :

### Option 1 : Email Admin

- Email se terminant par `@doodates.com`
- OU email exact : `admin@doodates.com`

### Option 2 : Rôle Admin

- Profil utilisateur avec `role: "admin"` dans les préférences

## 📊 Onglets Disponibles

Le tableau de bord admin contient **3 onglets** :

### 1. 👥 **Quotas Invités** (`/admin?tab=quotas`)

- Monitoring des utilisateurs non connectés (fingerprinting)
- Statistiques de consommation de crédits
- Gestion des quotas et blocages
- Graphiques de consommation

**Fonctionnalités :**

- Recherche par fingerprint
- Filtrage des sessions de test
- Top 5 des consommateurs
- Distribution des actions
- Blocage/réinitialisation d'utilisateurs

### 2. 📈 **Activité Utilisateur** (`/admin?tab=activity`)

- Détails d'activité par fingerprint
- Historique des actions
- Conversations créées
- Journal des événements

**Accès :**

```
/admin?tab=activity&fingerprint=guest_xxx
```

### 3. ⚡ **Performance** (`/admin?tab=performance`)

- Métriques E2E (temps de chargement)
- Scores Lighthouse CI
- Web Vitals en temps réel
- Alertes de régression
- Évolution sur 7 jours

**Métriques trackées :**

- Performance Score
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)
- First Input Delay (FID)
- Temps de chargement des dashboards

## 🔄 Redirections Automatiques

Les anciennes URLs redirigent automatiquement vers la nouvelle interface :

| Ancienne URL           | Nouvelle URL             |
| ---------------------- | ------------------------ |
| `/performance`         | `/admin?tab=performance` |
| `/admin/quotas`        | `/admin?tab=quotas`      |
| `/admin/user-activity` | `/admin?tab=activity`    |

## 🚀 Accès Rapide

### Via Navigation Directe

```typescript
// Dans votre code React
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

// Aller à l'admin
navigate("/admin");

// Aller directement à un onglet
navigate("/admin?tab=performance");
navigate("/admin?tab=quotas");
navigate("/admin?tab=activity");
```

### Via Liens HTML

```html
<a href="/DooDates/admin">Admin Dashboard</a>
<a href="/DooDates/admin?tab=performance">Performance</a>
<a href="/DooDates/admin?tab=quotas">Quotas</a>
```

## 🛡️ Sécurité

### Protection Backend

- Les tables admin ont des **Row Level Security (RLS)** policies
- Seuls les utilisateurs authentifiés avec rôle admin peuvent lire/écrire
- Les endpoints API vérifient les permissions

### Protection Frontend

- Vérification du rôle admin avant affichage
- Redirection automatique si non autorisé
- Message d'erreur clair

### Configuration du Rôle Admin

#### Méthode 1 : Via Supabase Dashboard

```sql
-- Dans Supabase SQL Editor
UPDATE profiles
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE user_id = 'votre-user-id';
```

#### Méthode 2 : Via Email

1. Créer un compte avec email `admin@doodates.com`
2. OU créer un compte avec email `@doodates.com`

## 📱 Responsive Design

Le tableau de bord admin est **responsive** et fonctionne sur :

- 💻 Desktop (optimisé)
- 📱 Tablette (adapté)
- 📱 Mobile (simplifié)

## 🔍 Debugging

### Vérifier si vous êtes admin

```typescript
// Dans la console du navigateur
const { user, profile } = useAuth();
console.log("User:", user?.email);
console.log("Role:", profile?.preferences?.role);
console.log(
  "Is Admin:",
  user?.email?.endsWith("@doodates.com") || profile?.preferences?.role === "admin",
);
```

### Logs

Les tentatives d'accès sont loggées dans :

- Console navigateur (dev)
- Supabase logs (prod)

## 📚 Ressources Associées

- **Performance Monitoring** : `Docs/PERFORMANCE/README.md`
- **Installation Guide** : `Docs/PERFORMANCE/INSTALLATION-GUIDE.md`
- **Quota System** : Documentation à venir

## 🎯 Prochaines Étapes

1. Configurer votre compte admin
2. Accéder à `/admin`
3. Explorer les 3 onglets
4. Configurer les alertes de performance
5. Monitorer les quotas utilisateurs

---

**Note** : En développement local, assurez-vous que les variables d'environnement Supabase sont configurées pour activer l'authentification.
