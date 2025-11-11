# 🗄️ DooDates - Architecture & Schéma de Base de Données

> **📌 Document de Référence Officiel**  
> **Version** : 2.0 - Architecture Conversation-Centric  
> **Date** : 7 Novembre 2025  
> **Provider** : Supabase (PostgreSQL 15+)

---

## 📋 Vue d'Ensemble

### Principe Central

**DooDates utilise une architecture centrée sur les conversations** où tout (sondages, formulaires, interactions IA) est organisé autour de conversations.

**🎯 UNE CONVERSATION = UN PROJET**

Chaque projet (création d'un sondage ou formulaire) est représenté par une conversation, qu'il soit créé :
- Via l'assistant IA conversationnel 🤖
- Via le formulaire de création manuelle 📝

### Configuration Technique

- **Provider** : Supabase (PostgreSQL 15+)
- **Sécurité** : Row Level Security (RLS) activé sur toutes les tables
- **Environnements** : dev, staging, prod
- **Backup** : Automatique quotidien (30 jours dev, 90 jours prod)
- **Monitoring** : Supabase Dashboard + Sentry

### 📝 Avantages de cette Architecture

1. **Cohérence** : Tout est dans une seule table principale
2. **Traçabilité** : Chaque poll a son historique de création
3. **Flexibilité** : Facile d'ajouter de nouveaux types de polls
4. **Simplicité** : Moins de jointures, moins de tables
5. **Context-aware** : Le poll connaît toujours son contexte de création

---

## 🔄 Flux de Données

### Création via IA

```
1. Utilisateur démarre conversation
   ↓
2. Messages échangés avec l'IA
   ↓
3. IA génère poll_data
   ↓
4. Sauvegarde dans conversations.poll_data
   ↓
5. poll_status = 'active', génération du slug
   ↓
6. Partage via URL avec slug
```

### Création Manuelle

```
1. Utilisateur accède /create
   ↓
2. Création implicite d'une conversation
   ↓
3. Remplissage du formulaire
   ↓
4. Sauvegarde dans conversations.poll_data
   ↓
5. poll_status = 'active', génération du slug
```

---

## 📊 Tables Principales

### 1. 🗨️ Conversations (Table Centrale)

**La table principale qui contient TOUT** : sondages, formulaires, historique IA.

```sql
CREATE TABLE conversations (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL pour invités
  session_id TEXT NOT NULL,
  
  -- Métadonnées conversation
  title TEXT,
  first_message TEXT,  -- Aperçu (100 premiers caractères)
  message_count INTEGER DEFAULT 0,
  
  -- Contenu conversationnel
  messages JSONB NOT NULL DEFAULT '[]',  -- Historique complet des messages
  context JSONB DEFAULT '{}',            -- Contexte de la conversation
  
  -- Données du sondage/formulaire (NOUVEAU - Architecture V2)
  poll_data JSONB,  -- Contient TOUTES les données du poll/form
  poll_type TEXT CHECK (poll_type IN ('date', 'form')),
  poll_status TEXT DEFAULT 'draft' CHECK (poll_status IN ('draft', 'active', 'closed', 'archived')),
  poll_slug TEXT UNIQUE,  -- Slug pour partage public
  
  -- Anciens champs (compatibilité)
  poll_id UUID,  -- Obsolète, conservé pour migration
  related_poll_id UUID,  -- Obsolète
  
  -- État et organisation
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'archived')),
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Structure `poll_data` (JSONB)

**Pour un Sondage de Dates** (`poll_type = 'date'`) :

```json
{
  "type": "date",
  "title": "Réunion d'équipe",
  "description": "Trouvons une date pour notre prochaine réunion",
  "dates": ["2024-11-15", "2024-11-16", "2024-11-17"],
  "timeSlots": {
    "2024-11-15": [
      {"start": "14:00", "end": "15:00"},
      {"start": "15:00", "end": "16:00"}
    ]
  },
  "settings": {
    "allowAnonymousVotes": true,
    "allowMaybeVotes": true,
    "sendNotifications": false,
    "timeGranularity": 60
  },
  "creatorEmail": "user@example.com"
}
```

**Pour un Formulaire** (`poll_type = 'form'`) :

```json
{
  "type": "form",
  "title": "Inscription événement",
  "description": "Inscription pour notre événement annuel",
  "questions": [
    {
      "id": "q1",
      "type": "text",
      "label": "Nom complet",
      "required": true
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "label": "Préférence de menu",
      "options": ["Végétarien", "Vegan", "Sans gluten"],
      "required": true
    }
  ],
  "settings": {
    "displayMode": "all-at-once",
    "allowAnonymous": true
  }
}
```

#### Champ `messages` (JSONB)

Historique complet de la conversation avec l'IA :

```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "Je veux organiser une réunion mardi ou mercredi",
    "timestamp": "2025-11-07T14:30:00Z"
  },
  {
    "id": "msg-2",
    "role": "assistant", 
    "content": "Parfait ! Pour quelle semaine souhaitez-vous organiser cette réunion ?",
    "timestamp": "2025-11-07T14:30:02Z",
    "metadata": {
      "function_call": "ask_clarification"
    }
  }
]
```

#### Indexes

```sql
-- Index primaires
CREATE INDEX idx_conversations_user_id ON conversations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Index pour polls
CREATE INDEX idx_conversations_poll_slug ON conversations(poll_slug) WHERE poll_slug IS NOT NULL;
CREATE INDEX idx_conversations_poll_type ON conversations(poll_type) WHERE poll_type IS NOT NULL;
CREATE INDEX idx_conversations_poll_status ON conversations(poll_status) WHERE poll_status IS NOT NULL;
CREATE INDEX idx_conversations_user_polls ON conversations(user_id) WHERE poll_data IS NOT NULL;

-- Index GIN pour recherche JSON
CREATE INDEX idx_conversations_poll_data ON conversations USING GIN(poll_data);
CREATE INDEX idx_conversations_messages ON conversations USING GIN(messages);
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);
```

#### RLS Policies

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateur peut voir ses conversations
CREATE POLICY "Users can view own conversations" ON conversations 
  FOR SELECT USING (auth.uid() = user_id);

-- Insertion : utilisateur peut créer ses conversations
CREATE POLICY "Users can insert own conversations" ON conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mise à jour : utilisateur peut modifier ses conversations
CREATE POLICY "Users can update own conversations" ON conversations 
  FOR UPDATE USING (auth.uid() = user_id);

-- Suppression : utilisateur peut supprimer ses conversations
CREATE POLICY "Users can delete own conversations" ON conversations 
  FOR DELETE USING (auth.uid() = user_id);

-- Lecture publique : tout le monde peut voir les polls actifs via slug
CREATE POLICY "Anyone can view active polls by slug" ON conversations
  FOR SELECT USING (
    poll_status = 'active' 
    AND poll_slug IS NOT NULL
  );
```

---

### 2. 👤 Profiles (Profils Utilisateurs)

Extension de `auth.users` avec données métier.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  preferences JSONB DEFAULT '{}',
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Champ `preferences` (JSONB)

```json
{
  "language": "fr",
  "notifications": {
    "email_invitations": true,
    "email_reminders": true,
    "push_notifications": false
  },
  "ui": {
    "theme": "light",
    "default_granularity": 60
  },
  "privacy": {
    "public_profile": false,
    "allow_anonymous_votes": true
  }
}
```

#### Indexes & RLS

```sql
-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_plan ON profiles(plan_type);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
```

---

### 3. 🗳️ Votes (Réponses aux Sondages)

Stockage des votes pour les sondages et formulaires.

```sql
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,  -- Lien vers conversation
  voter_name TEXT NOT NULL,
  voter_email TEXT NOT NULL,
  voter_id UUID REFERENCES profiles(id),  -- NULL si anonyme
  vote_data JSONB NOT NULL,  -- Données du vote
  comment TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, voter_email)
);
```

#### Structure `vote_data` (JSONB)

**Pour sondage de dates** :

```json
{
  "2024-11-15": {
    "vote": "yes",
    "timeSlots": {
      "14:00-15:00": "yes",
      "15:00-16:00": "maybe"
    }
  },
  "2024-11-16": {
    "vote": "no"
  }
}
```

**Pour formulaire** :

```json
{
  "q1": {
    "answer": "Jean Dupont"
  },
  "q2": {
    "answer": "Végétarien"
  }
}
```

#### Indexes & RLS

```sql
-- Indexes
CREATE INDEX idx_votes_conversation ON votes(conversation_id);
CREATE INDEX idx_votes_email ON votes(voter_email);
CREATE INDEX idx_votes_voter_id ON votes(voter_id) WHERE voter_id IS NOT NULL;
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Voter peut gérer ses propres votes
CREATE POLICY "Voters can manage own votes" ON votes 
  FOR ALL USING (
    voter_email = auth.email() 
    OR voter_id = auth.uid()
  );

-- Créateur du sondage peut voir tous les votes
CREATE POLICY "Poll creators can view all votes" ON votes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Tout le monde peut voir les votes des polls actifs
CREATE POLICY "Anyone can view active poll votes" ON votes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.poll_status = 'active'
    )
  );

-- Permettre le vote anonyme sur polls actifs
CREATE POLICY "Anyone can vote on active polls" ON votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.poll_status = 'active'
    )
  );
```

---

### 4. 📊 Analytics_Events (Événements Analytics)

Tracking des événements pour analytics et monitoring.

```sql
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Types d'Événements

- `poll_created` : Sondage créé
- `poll_shared` : Sondage partagé
- `vote_cast` : Vote effectué
- `conversation_started` : Conversation IA démarrée
- `user_signup` : Inscription utilisateur

#### Indexes & RLS

```sql
-- Indexes
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut insérer des événements
CREATE POLICY "Anyone can insert analytics" ON analytics_events 
  FOR INSERT WITH CHECK (true);

-- Seul le propriétaire peut voir ses analytics
CREATE POLICY "Users can view own analytics" ON analytics_events 
  FOR SELECT USING (auth.uid() = user_id);
```

---

## ⚠️ Tables Obsolètes (À NE PLUS UTILISER)

### ❌ Table `polls` - OBSOLÈTE

Cette table existe encore pour compatibilité avec l'ancien code mais **NE DOIT PLUS ÊTRE UTILISÉE**.

**Pourquoi obsolète** :
- Architecture V1 qui séparait polls et conversations
- Manque de colonnes nécessaires (`poll_type`, `questions`, etc.)
- Génère des erreurs 400 si utilisée

**Migration** : Toutes les données doivent être dans `conversations.poll_data`

**État actuel** :
- ✅ Code mis à jour pour ne plus l'utiliser
- ⚠️ Table conservée temporairement pour migration
- 📅 Suppression prévue après vérification complète

---

## 🔍 Requêtes Courantes

### Récupérer les Sondages d'un Utilisateur

```sql
SELECT 
  id,
  title,
  poll_type,
  poll_status,
  poll_slug,
  poll_data,
  first_message,
  message_count,
  created_at,
  updated_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_data IS NOT NULL  -- Filtre conversations avec sondage
ORDER BY updated_at DESC;
```

### Récupérer un Sondage par Slug (Accès Public)

```sql
SELECT 
  id,
  title,
  poll_type,
  poll_status,
  poll_data,
  created_at
FROM conversations
WHERE poll_slug = 'mon-sondage-a1b2c3'
  AND poll_status = 'active';
```

### Récupérer les Votes d'un Sondage

```sql
SELECT 
  v.id,
  v.voter_name,
  v.voter_email,
  v.vote_data,
  v.comment,
  v.created_at
FROM votes v
JOIN conversations c ON v.conversation_id = c.id
WHERE c.poll_slug = 'mon-sondage-a1b2c3'
ORDER BY v.created_at DESC;
```

### Récupérer l'Historique de Conversation

```sql
SELECT 
  id,
  title,
  first_message,
  message_count,
  messages,
  poll_type,
  created_at,
  updated_at
FROM conversations
WHERE user_id = auth.uid()
  AND status = 'active'
ORDER BY updated_at DESC
LIMIT 10;
```

### Statistiques d'un Sondage

```sql
SELECT 
  c.id,
  c.title,
  c.poll_slug,
  c.poll_status,
  COUNT(DISTINCT v.id) as vote_count,
  COUNT(DISTINCT v.voter_email) as unique_voters,
  MAX(v.created_at) as last_vote_at
FROM conversations c
LEFT JOIN votes v ON v.conversation_id = c.id
WHERE c.user_id = auth.uid()
  AND c.poll_data IS NOT NULL
GROUP BY c.id, c.title, c.poll_slug, c.poll_status
ORDER BY c.created_at DESC;
```

---

## 🚀 Migration du Code Existant

### ❌ Ancien Code (Table `polls`)

```typescript
// Charger depuis table polls (OBSOLÈTE)
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/polls?creator_id=eq.${user.id}`,
  { headers }
);
```

### ✅ Nouveau Code (Table `conversations`)

```typescript
// Charger depuis conversations
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/conversations?user_id=eq.${user.id}&poll_data=not.is.null`,
  { headers }
);
```

---

## ⚠️ Points d'Attention

### Invités (Guest Users)

Les utilisateurs non connectés créent des conversations avec `user_id = NULL`.
Utiliser `session_id` pour les identifier.

```sql
-- Conversations d'un invité
SELECT * FROM conversations 
WHERE user_id IS NULL 
  AND session_id = 'guest-session-123';
```

### Performance et Indexation

Index critiques pour les performances :

```sql
-- Index pour accès rapide aux polls publics
CREATE INDEX idx_conversations_poll_slug ON conversations(poll_slug);

-- Index pour requêtes utilisateur
CREATE INDEX idx_conversations_user_polls ON conversations(user_id) 
  WHERE poll_data IS NOT NULL;

-- Index GIN pour recherches JSON
CREATE INDEX idx_conversations_poll_data ON conversations USING GIN(poll_data);
```

---

## 🔧 Triggers et Fonctions

### Fonction : Mise à Jour Automatique `updated_at`

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_votes
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Fonction : Création Automatique du Profil

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Europe/Paris')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Fonction : Génération de Slug Unique

```sql
CREATE OR REPLACE FUNCTION generate_conversation_poll_slug(poll_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  -- Convertir titre en slug
  base_slug := lower(regexp_replace(poll_title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 50);
  
  -- Ajouter suffixe aléatoire unique
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 Migration et Stratégie

### Migration de l'Ancienne Architecture

Si vous avez des données dans l'ancienne table `polls` :

```sql
-- Migration des polls vers conversations
INSERT INTO conversations (
  id,
  user_id,
  session_id,
  title,
  poll_type,
  poll_status,
  poll_slug,
  poll_data,
  created_at,
  updated_at
)
SELECT 
  p.id,
  p.creator_id,
  'migrated-' || p.id,  -- Session ID temporaire
  p.title,
  'date',  -- Tous les anciens polls sont de type date
  p.status,
  p.slug,
  jsonb_build_object(
    'type', 'date',
    'title', p.title,
    'description', p.description,
    'settings', p.settings
  ),
  p.created_at,
  p.updated_at
FROM polls p
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = p.id
);

-- Mettre à jour les références dans votes
UPDATE votes v
SET conversation_id = p.id
FROM polls p
WHERE v.poll_id = p.id
  AND v.conversation_id IS NULL;
```

### Stratégie de Backup

- **Backup automatique** : Quotidien via Supabase
- **Backup manuel** : Avant chaque déploiement majeur
- **Rétention** :
  - Dev : 30 jours
  - Staging : 60 jours  
  - Prod : 90 jours
- **Test de restore** : Mensuel sur environnement de test

---

## 🎯 État d'Implémentation

### ✅ Déjà Implémenté

- ✅ `usePolls.ts` charge depuis `conversations` (ligne 607)
- ✅ Structure `poll_data` définie et utilisée
- ✅ Support mode local via `localStorage`
- ✅ Architecture conversation-centric en place
- ✅ RLS policies configurées

### 🚧 En Cours

- ⚙️ Création manuelle → sauvegarder dans `conversations` (actuellement en mode local)
- ⚙️ Migration complète de `pollStorage.ts`
- ⚙️ Tests E2E de la nouvelle architecture

### 📋 TODO

- [ ] Implémenter création directe dans `conversations` (sans passer par localStorage)
- [ ] Migrer données existantes de `polls` vers `conversations` (si nécessaire)
- [ ] Supprimer toutes les références à la table `polls` dans le code
- [ ] Nettoyer la table `polls` en production (après migration complète)
- [ ] Mettre à jour les types TypeScript pour refléter l'architecture finale

---

## 🎯 Checklist de Migration

### Phase 1 : Préparation
- [x] Documenter nouvelle architecture
- [x] Créer script SQL d'upgrade (`upgrade-conversations-for-polls.sql`)
- [x] Désactiver chargement depuis table `polls`
- [x] Mettre à jour documentation

### Phase 2 : Implémentation
- [ ] Exécuter script SQL sur Supabase
- [ ] Activer chargement depuis `conversations` dans code
- [ ] Tester création de sondages
- [ ] Tester vote sur sondages
- [ ] Tester historique conversations

### Phase 3 : Migration Données
- [ ] Migrer données existantes de `polls` → `conversations`
- [ ] Vérifier intégrité des données
- [ ] Mettre à jour références dans `votes`

### Phase 4 : Nettoyage
- [ ] Supprimer références à `polls` dans le code
- [ ] Archiver table `polls` (ou supprimer après validation)
- [ ] Mettre à jour types TypeScript

---

## 📚 Ressources Complémentaires

### Documentation
- **Guide de test** : [`GUIDE_TEST_SAUVEGARDE.md`](../GUIDE_TEST_SAUVEGARDE.md)
- **Corrections erreur 400** : [`CORRECTIONS-ERREUR-400.md`](../CORRECTIONS-ERREUR-400.md)

### Scripts SQL
- **Script d'upgrade** : [`upgrade-conversations-for-polls.sql`](../../sql-scripts/upgrade-conversations-for-polls.sql)
- **Script d'initialisation** : [`00-INIT-DATABASE-COMPLETE.sql`](../../sql-scripts/00-INIT-DATABASE-COMPLETE.sql)

### Archives
- **Ancien schéma (obsolète)** : `Archive/5. Database-Schema-OBSOLETE.md` - Pour référence historique uniquement

---

**Version** : 2.0 - Architecture Conversation-Centric  
**Date** : 7 Novembre 2025  
**Status** : ✅ Production Ready (après migration)  
**Audience** : Développeurs, DBA, DevOps

