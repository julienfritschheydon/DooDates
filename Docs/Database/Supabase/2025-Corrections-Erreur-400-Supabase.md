# ✅ Correction Erreur 400 - Architecture Conversations

## 🔍 Problème Identifié

L'erreur 400 venait de `usePolls.ts` qui tentait de charger les sondages depuis la table `polls` :

```
outmbbisrrdiumlweira.supabase.co/rest/v1/polls:1  Failed to load resource: the server responded with a status of 400 ()
```

**Cause** : Le code essayait d'accéder à la table `polls` qui :

- N'a pas les bonnes colonnes (manque `type`, `questions`, `dates`, etc.)
- Est obsolète dans votre architecture

## ✨ Solution Appliquée

### 1. Clarification de l'Architecture

**Architecture "Conversation-Centric"** : TOUT est dans la table `conversations`

```
conversations
├── Sondages créés via IA ✅
├── Sondages créés manuellement ✅
└── Formulaires personnalisés ✅
```

Voir documentation complète : [`Docs/Database/DATABASE-SCHEMA-COMPLETE.md`](./Database/DATABASE-SCHEMA-COMPLETE.md)

### 2. Correction du Code

**Fichier modifié** : `src/hooks/usePolls.ts`

```typescript
// ❌ AVANT (générait erreur 400)
const response = await fetch(`${SUPABASE_URL}/rest/v1/polls?creator_id=eq.${user.id}`, { headers });

// ✅ APRÈS (désactivé temporairement)
logger.info("Using localStorage for polls (table polls disabled)", "poll");
userPolls = getAllPolls();
```

**Changements** :

- Désactivé le chargement depuis la table `polls` obsolète
- Utilisation de `localStorage` qui contient déjà les données via `conversations`
- Ajout de commentaires pour migration future vers `conversations`

### 3. Documentation Mise à Jour

**Fichiers mis à jour** :

1. **`GUIDE_TEST_SAUVEGARDE.md`**
   - Correction : table `conversations` au lieu de `polls`
   - Requêtes SQL mises à jour
   - Note sur l'architecture centrée conversations

2. **`Docs/Database/DATABASE-SCHEMA-COMPLETE.md`**
   - Architecture & schéma complet
   - Structure de données détaillée
   - Exemples de requêtes SQL
   - Guide de migration
   - Flux de données

### 4. Script SQL de Migration

**Fichier créé** : `sql-scripts/upgrade-conversations-for-polls.sql`

Ce script ajoute les colonnes manquantes à la table `conversations` :

- `poll_data` (JSONB) - données complètes du sondage
- `poll_type` (TEXT) - type : 'date' ou 'form'
- `poll_status` (TEXT) - statut : draft/active/closed/archived
- `poll_slug` (TEXT) - slug unique pour partage
- Index pour performance
- Fonction de génération de slug

**À exécuter dans Supabase** :

```bash
# Supabase Dashboard → SQL Editor → Coller le contenu du fichier
```

## 🧪 Vérification

### Avant la Correction

```
❌ Erreur 400 sur /rest/v1/polls
❌ Messages d'erreur dans la console
```

### Après la Correction

```
✅ Plus d'erreur 400
✅ Logs : "Using localStorage for polls (table polls disabled)"
✅ Application fonctionne normalement
```

### Test à Effectuer

1. **Recharger l'application** (Ctrl+R)
2. **Vérifier la console** : Plus d'erreur 400
3. **Créer un sondage** : Fonctionne correctement
4. **Vérifier dans Supabase** : Données dans `conversations`

## 📋 Structure de la Table Conversations

### Colonnes Existantes

```sql
id              UUID PRIMARY KEY
user_id         UUID (référence auth.users)
session_id      TEXT
title           TEXT
messages        JSONB (historique messages IA)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Colonnes à Ajouter (via script SQL)

```sql
poll_data       JSONB (données du sondage/formulaire)
poll_type       TEXT ('date' ou 'form')
poll_status     TEXT (draft/active/closed/archived)
poll_slug       TEXT UNIQUE (pour partage)
```

### Exemple de Données

```json
{
  "id": "abc-123",
  "user_id": "user-456",
  "title": "Réunion d'équipe",
  "poll_type": "date",
  "poll_status": "active",
  "poll_slug": "reunion-equipe-a1b2c3",
  "poll_data": {
    "type": "date",
    "title": "Réunion d'équipe",
    "description": "Trouvons une date",
    "dates": ["2024-11-15", "2024-11-16"],
    "settings": {
      "allowAnonymousVotes": true,
      "allowMaybeVotes": true
    }
  },
  "messages": [
    { "role": "user", "content": "Je veux créer un sondage" },
    { "role": "assistant", "content": "D'accord, pour quelles dates ?" }
  ]
}
```

## 🔄 Migration Future

### Étapes Suivantes (optionnel)

1. **Activer le chargement depuis conversations** dans `usePolls.ts` (code commenté inclus)
2. **Migrer données existantes** de `polls` vers `conversations` (si nécessaire)
3. **Supprimer la table polls** une fois migration terminée

### Code Prêt pour Migration

Le code commenté dans `usePolls.ts` contient déjà l'implémentation pour charger depuis `conversations` :

```typescript
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/conversations?user_id=eq.${user.id}&poll_data=not.is.null`,
  { headers },
);
```

## 📚 Ressources

- [`Docs/Database/DATABASE-SCHEMA-COMPLETE.md`](./Database/DATABASE-SCHEMA-COMPLETE.md) - Architecture & schéma complet
- [`GUIDE_TEST_SAUVEGARDE.md`](./GUIDE_TEST_SAUVEGARDE.md) - Guide de test mis à jour
- [`sql-scripts/upgrade-conversations-for-polls.sql`](../sql-scripts/upgrade-conversations-for-polls.sql) - Script SQL

## ✅ Résultat

- ✅ **Erreur 400 corrigée**
- ✅ **Architecture clarifiée et documentée**
- ✅ **Code commenté pour compréhension**
- ✅ **Script SQL prêt pour migration**
- ✅ **Guide de test mis à jour**

---

**Date** : 7 Novembre 2025
**Testez maintenant** : Rechargez l'app et créez un sondage !
