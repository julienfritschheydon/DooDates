# 📚 Documentation DooDates

## 🗂️ Organisation des Documents

### 🎯 Documents Principaux (À Utiliser)

| Document                                                         | Description                                                      | Statut        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- | ------------- |
| **[DATABASE-SCHEMA-COMPLETE.md](./DATABASE-SCHEMA-COMPLETE.md)** | **Schéma de BDD complet** - Architecture conversation-centric V2 | ✅ **À JOUR** |
| **[Branching-Strategy.md](./Branching-Strategy.md)**             | **Stratégie de branches** - Git Worktrees + Tests progressifs    | ✅ **À JOUR** |
| **[GUIDE_TEST_SAUVEGARDE.md](../GUIDE_TEST_SAUVEGARDE.md)**      | Guide de test pour vérifier la sauvegarde Supabase               | ✅ **À JOUR** |
| **[CORRECTIONS-ERREUR-400.md](../CORRECTIONS-ERREUR-400.md)**    | Explication et correction de l'erreur 400                        | ✅ **À JOUR** |

### 📖 Documents de Référence

| Document                                                                     | Description                                                              | Statut        |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------- |
| [DATABASE-SCHEMA-COMPLETE.md](./Database/DATABASE-SCHEMA-COMPLETE.md)        | 📌 **Architecture & Schéma BDD complet** - Modèle "conversation-centric" | ✅ **ACTUEL** |
| [5. Database-Schema.md](./Database/Archive/5.%20Database-Schema-OBSOLETE.md) | Ancien schéma V1 centré polls (obsolète)                                 | 📦 Archivé    |

---

## 🏗️ Architecture DooDates

### Principe Central

**DooDates utilise une architecture "Conversation-Centric"** où TOUT est dans la table `conversations` :

```
conversations (table centrale)
├── Sondages créés via IA ✅
├── Sondages créés manuellement ✅
└── Formulaires personnalisés ✅
```

### Tables Principales

1. **`conversations`** - Table centrale (sondages, formulaires, historique IA)
2. **`profiles`** - Profils utilisateurs
3. **`votes`** - Votes sur sondages/formulaires
4. **`analytics_events`** - Événements tracking

### ❌ Tables Obsolètes

- **`polls`** - Table obsolète V1, ne plus utiliser
- **`poll_options`** - Table obsolète V1, ne plus utiliser

---

## 🚀 Démarrage Rapide

### 1. Configuration Supabase

Exécutez le script SQL d'upgrade :

```bash
# Dans Supabase Dashboard → SQL Editor
# Copiez et exécutez : sql-scripts/upgrade-conversations-for-polls.sql
```

### 2. Vérification

Suivez le guide de test :

```bash
# Ouvrir : GUIDE_TEST_SAUVEGARDE.md
# Suivre les étapes 1-6
```

### 3. Code

Le code est déjà mis à jour :

- ✅ `src/hooks/usePolls.ts` - Ne charge plus depuis table `polls`
- ✅ Utilise `localStorage` (qui reflète `conversations`)

---

## 📊 Schéma Simplifié

```
┌─────────────────────────────────────────────┐
│           conversations                      │
│  (Table Centrale)                           │
├─────────────────────────────────────────────┤
│ • id                                        │
│ • user_id (FK → profiles)                  │
│ • title                                     │
│ • messages (JSONB)                          │
│ • poll_data (JSONB) ← Données sondage     │
│ • poll_type ('date' | 'form')              │
│ • poll_status ('draft' | 'active'...)      │
│ • poll_slug (pour partage)                 │
└─────────────────────────────────────────────┘
         ↓ conversation_id
┌─────────────────────────────────────────────┐
│              votes                          │
├─────────────────────────────────────────────┤
│ • id                                        │
│ • conversation_id (FK)                     │
│ • voter_name                                │
│ • voter_email                               │
│ • vote_data (JSONB)                        │
└─────────────────────────────────────────────┘
```

---

## 🔍 Exemples de Requêtes

### Récupérer mes sondages

```sql
SELECT
  id, title, poll_type, poll_status, poll_slug,
  poll_data, created_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_data IS NOT NULL
ORDER BY updated_at DESC;
```

### Récupérer un sondage public

```sql
SELECT *
FROM conversations
WHERE poll_slug = 'reunion-equipe-a1b2c3'
  AND poll_status = 'active';
```

### Récupérer les votes

```sql
SELECT
  v.voter_name, v.voter_email, v.vote_data, v.created_at
FROM votes v
JOIN conversations c ON v.conversation_id = c.id
WHERE c.poll_slug = 'reunion-equipe-a1b2c3'
ORDER BY v.created_at DESC;
```

---

## 🛠️ Scripts SQL Disponibles

| Script                                | Description                           | Quand l'utiliser |
| ------------------------------------- | ------------------------------------- | ---------------- |
| `00-INIT-DATABASE-COMPLETE.sql`       | Initialisation complète BDD           | Nouveau projet   |
| `upgrade-conversations-for-polls.sql` | Ajoute colonnes polls à conversations | Migration V1→V2  |
| `fix-400-errors.sql`                  | Correction erreurs 400 anciennes      | Obsolète (V1)    |

---

## 📖 Lecture Recommandée

### Pour Développeurs

1. **[DATABASE-SCHEMA-COMPLETE.md](./DATABASE-SCHEMA-COMPLETE.md)** - Comprendre l'architecture
2. **[GUIDE_TEST_SAUVEGARDE.md](../GUIDE_TEST_SAUVEGARDE.md)** - Tester la sauvegarde
3. **[CORRECTIONS-ERREUR-400.md](../CORRECTIONS-ERREUR-400.md)** - Comprendre la migration

### Pour DevOps

1. **`sql-scripts/upgrade-conversations-for-polls.sql`** - Script de migration
2. **[DATABASE-SCHEMA-COMPLETE.md](./DATABASE-SCHEMA-COMPLETE.md)** - Section "Migration et Stratégie"

---

## 🆘 Support

### Problèmes Courants

**Erreur 400 sur `/rest/v1/polls`**

- ✅ Corrigé - Le code ne charge plus depuis `polls`
- 📖 Voir [CORRECTIONS-ERREUR-400.md](../CORRECTIONS-ERREUR-400.md)

**Données non sauvegardées**

- 📖 Suivre [GUIDE_TEST_SAUVEGARDE.md](../GUIDE_TEST_SAUVEGARDE.md)
- Vérifier table `conversations`, pas `polls`

---

**Date de mise à jour** : 7 Novembre 2025  
**Version** : 2.0 - Architecture Conversation-Centric
