# Phase 3 : Migration complète Supabase - Quotas utilisateurs authentifiés

## 📋 Informations du projet

**Project Supabase :**

- **Project URL** : `outmbbisrrdiumlweira.supabase.co`
- **Edge Function URL** : `https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking`
- **User ID exemple** : `3b1802f9-db46-48c7-86b0-199830f56f53`

**Pour obtenir un JWT Token :**

- Via application web : Se connecter → Console navigateur (F12) → Exécuter le script JavaScript fourni ci-dessous
- ⚠️ Les tokens expirent après 1 heure
- ⚠️ Le Dashboard ne stocke pas les tokens JWT (ils sont générés lors de la connexion)

## 🏗️ Architecture

### Tables Supabase

#### `quota_tracking`

Table principale pour les quotas utilisateurs authentifiés.

```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users, UNIQUE)
- conversations_created (INTEGER)
- polls_created (INTEGER)  -- Somme des 4 compteurs séparés (affichage uniquement, maintenu via trigger)
- date_polls_created (INTEGER)  -- Compteur séparé pour polls de type "date"
- form_polls_created (INTEGER)  -- Compteur séparé pour polls de type "form"
- quizz_created (INTEGER)  -- Compteur séparé pour polls de type "quizz"
- availability_polls_created (INTEGER)  -- Compteur séparé pour polls de type "availability"
- ai_messages (INTEGER)
- analytics_queries (INTEGER)
- simulations (INTEGER)
- total_credits_consumed (INTEGER)
- subscription_start_date (TIMESTAMPTZ)
- last_reset_date (TIMESTAMPTZ)
- period_start, period_end (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

**Note :** Depuis décembre 2024, les quotas sont séparés par type de poll. Chaque type a son propre compteur et sa propre limite indépendante. Voir `Docs/ARCHITECTURE/2025-12-04-QUOTA-SEPARATION-BY-PRODUCT.md` pour plus de détails.

#### `quota_tracking_journal`

Journal détaillé de toutes les consommations.

```sql
- id (UUID, PK)
- quota_tracking_id (UUID, FK → quota_tracking)
- user_id (UUID, FK → auth.users)
- action (TEXT)
- credits (INTEGER)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

### Edge Function : `quota-tracking`

3 endpoints :

1. **`checkQuota`** : Vérifie les limites sans consommer
   - Utilisé pour l'UI (affichage progression)
   - Retourne `{ allowed: boolean, currentQuota: {...} }`

2. **`consumeCredits`** : Consomme des crédits atomiquement
   - Transaction SQL avec `FOR UPDATE`
   - Bloque si quota atteint
   - Retourne `{ success: boolean, quota: {...} }`

3. **`getJournal`** : Récupère l'historique
   - Retourne `{ success: boolean, journal: [...] }`

### Fonctions SQL

- `ensure_quota_tracking_exists(user_id)` : Crée ou récupère le quota
- `consume_quota_credits(user_id, action, credits, metadata)` : Consommation atomique

## 🚀 Déploiement

### 1. Créer les tables

**Via Supabase Dashboard :**

1. Aller dans **Database** → **SQL Editor**
2. Ouvrir le fichier `sql-scripts/create-quota-tracking-table.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL du Dashboard
5. Cliquer sur **Run** (ou `Ctrl+Enter`)

**Vérification :**

```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('quota_tracking', 'quota_tracking_journal');
```

### 2. Déployer l'Edge Function

**Via Supabase Dashboard (Recommandé) :**

1. Aller dans **Edge Functions** (menu gauche)
2. Cliquer sur **Create a new function**
3. Nom de la fonction : `quota-tracking`
4. Ouvrir le fichier `supabase/functions/quota-tracking/index.ts`
5. Copier tout le contenu
6. Coller dans l'éditeur de code du Dashboard
7. Cliquer sur **Deploy** (ou `Ctrl+S`)
8. Attendre la confirmation "Function deployed successfully"

**Via ligne de commande (si Supabase CLI configuré) :**

```bash
cd supabase/functions/quota-tracking
supabase functions deploy quota-tracking
```

### 3. Obtenir le JWT Token pour les tests

**Méthode 1 : Depuis votre application (via localStorage)**

⚠️ **Note :** Cette méthode peut être complexe. Préférez la **Méthode 2** (Dashboard) qui est plus simple et fiable.

1. Ouvrir votre application dans le navigateur
2. Ouvrir la console développeur (F12)
3. Se connecter avec un compte utilisateur
4. Exécuter dans la console :

   ```javascript
   // Récupérer le token depuis localStorage (où Supabase le stocke)
   const supabaseSession = localStorage.getItem(
     "sb-" + window.location.hostname.split(".")[0] + "-auth-token",
   );
   if (supabaseSession) {
     const session = JSON.parse(supabaseSession);
     console.log("JWT Token:", session.access_token);
   } else {
     // Alternative : chercher toutes les clés Supabase dans localStorage
     for (let i = 0; i < localStorage.length; i++) {
       const key = localStorage.key(i);
       if (key && key.includes("auth-token")) {
         const session = JSON.parse(localStorage.getItem(key));
         console.log("JWT Token:", session.access_token);
         break;
       }
     }
   }
   ```

   **Ou méthode encore plus simple :**

   ```javascript
   // Chercher automatiquement la clé Supabase dans localStorage
   const sessionKey = Object.keys(localStorage).find((key) => key.includes("auth-token"));
   if (sessionKey) {
     try {
       const session = JSON.parse(localStorage.getItem(sessionKey));
       if (session && session.access_token) {
         console.log("JWT Token:", session.access_token);
       } else {
         console.log("Token non trouvé. Essayez la Méthode 2 (Dashboard)");
       }
     } catch (e) {
       console.log("Erreur:", e, "- Essayez la Méthode 2 (Dashboard)");
     }
   } else {
     console.log("Aucune session trouvée. Connectez-vous d'abord ou utilisez la Méthode 2");
   }
   ```

5. Copier le token affiché dans la console

**Méthode 2 : Via votre application web (⭐ La plus simple)**

⚠️ **Note** : Le Dashboard Supabase ne stocke pas les tokens JWT (ils sont générés dynamiquement lors de la connexion). Pour obtenir un token valide :

1. Ouvrir votre application dans le navigateur
2. Se connecter avec le compte utilisateur dont vous voulez le token
3. Ouvrir la console développeur (F12)
4. Exécuter ce code dans la console :
   ```javascript
   // Trouver la clé Supabase dans localStorage
   const sessionKey = Object.keys(localStorage).find((key) => key.includes("auth-token"));
   if (sessionKey) {
     const session = JSON.parse(localStorage.getItem(sessionKey));
     if (session && session.access_token) {
       console.log("JWT Token:", session.access_token);
       // Copier automatiquement dans le presse-papiers
       navigator.clipboard.writeText(session.access_token).then(() => {
         console.log("✅ Token copié dans le presse-papiers !");
       });
     }
   }
   ```
5. Le token sera affiché dans la console et copié automatiquement

**Méthode 2b : Via Supabase Dashboard (si disponible)**

Certaines versions du Dashboard ont un bouton pour générer/copier un token :

1. Aller dans **Authentication** → **Users**
2. Sélectionner un utilisateur
3. Chercher un bouton **"Generate JWT"**, **"Copy JWT"** ou **"View JWT"** dans le panneau de détails
4. Si disponible, cliquer dessus pour obtenir le token

**Méthode 3 : Créer un utilisateur de test**

1. Aller dans **Authentication** → **Users** → **Add user**
2. Créer un utilisateur avec email/mot de passe
3. Une fois créé, cliquer sur **Copy JWT** pour récupérer son token

**Méthode 4 : Via l'API Supabase (pour scripts)**

```bash
# Se connecter et récupérer le token
curl -X POST 'https://outmbbisrrdiumlweira.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your-password"
  }'
```

La réponse contiendra `access_token` qui est votre JWT.

**Informations du projet :**

- **Project URL** : `outmbbisrrdiumlweira.supabase.co`
- **Edge Function URL** : `https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking`

### 4. Vérifier le déploiement

**Via Supabase Dashboard :**

1. Aller dans **Edge Functions** → `quota-tracking`
2. Cliquer sur **Test function** (ou utiliser l'onglet **Invoke**)
3. Configurer la requête :
   ```json
   {
     "endpoint": "checkQuota",
     "action": "other",
     "credits": 0
   }
   ```
4. Ajouter l'en-tête d'authentification :
   - **Authorization** : `Bearer VOTRE_JWT_TOKEN_ICI`
   - (Utiliser le token obtenu via une des méthodes ci-dessus)
5. Cliquer sur **Invoke**

**Via ligne de commande :**

**Pour PowerShell (Windows) :**

```powershell
# Méthode recommandée avec Invoke-RestMethod
# ⚠️ IMPORTANT : Remplacez "VOTRE_TOKEN_ICI" par un vrai JWT token obtenu via le Dashboard
# Voir section "### 3. Obtenir le JWT Token pour les tests" ci-dessus
$token = "VOTRE_TOKEN_ICI"  # ⬅️ REMPLACER PAR UN VRAI TOKEN !

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    endpoint = "checkQuota"
    action = "other"
    credits = 0
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

**Alternative PowerShell avec curl.exe (si curl est installé) :**

```powershell
# Utiliser curl.exe au lieu de curl (alias PowerShell)
# Note: Utiliser des guillemets doubles pour PowerShell
curl.exe -X POST https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjZZQVhsVCtQN3N6VUljTmsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL291dG1iYmlzcnJkaXVtbHdlaXJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzYjE4MDJmOS1kYjQ2LTQ4YzctODZiMC0xOTk4MzBmNTZmNTMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTA5MjAwLCJpYXQiOjE3NjMxMDU2MDAsImVtYWlsIjoianVsaWVuLmZyaXRzY2grZG9vZGF0ZXMyQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJqdWxpZW4uZnJpdHNjaCtkb29kYXRlczJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikp1bGllbiBGcml0c2NoIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJyb2xlIjoiYWRtaW4iLCJzdWIiOiIzYjE4MDJmOS1kYjQ2LTQ4YzctODZiMC0xOTk4MzBmNTZmNTMifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MzEwNTYwMH1dLCJzZXNzaW9uX2lkIjoiMjFmYTIzNWEtMmU2Yy00MmFmLWIxNjMtZGU1OGJhMmQ3ZTI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.QXqibDQXOrlbU2GacCoNUv5FayJvgt6xlOcRl2uBev4" `
  -H "Content-Type: application/json" `
  -d "{\"endpoint\": \"checkQuota\", \"action\": \"other\", \"credits\": 0}"
```

**⚠️ Note importante pour PowerShell :**

- Utiliser `Invoke-RestMethod` (méthode recommandée ci-dessus) est plus fiable
- Si vous utilisez `curl.exe`, les backticks `` ` `` sont nécessaires pour les continuations de ligne
- Les guillemets simples `'...'` dans PowerShell ne fonctionnent pas pour les chaînes JSON, utilisez des guillemets doubles `"..."` avec échappement `\"`

**Pour Bash/Linux/Mac :**

```bash
curl -X POST https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjZZQVhsVCtQN3N6VUljTmsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL291dG1iYmlzcnJkaXVtbHdlaXJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzYjE4MDJmOS1kYjQ2LTQ4YzctODZiMC0xOTk4MzBmNTZmNTMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTA5MjAwLCJpYXQiOjE3NjMxMDU2MDAsImVtYWlsIjoianVsaWVuLmZyaXRzY2grZG9vZGF0ZXMyQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJqdWxpZW4uZnJpdHNjaCtkb29kYXRlczJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikp1bGllbiBGcml0c2NoIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJyb2xlIjoiYWRtaW4iLCJzdWIiOiIzYjE4MDJmOS1kYjQ2LTQ4YzctODZiMC0xOTk4MzBmNTZmNTMifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MzEwNTYwMH1dLCJzZXNzaW9uX2lkIjoiMjFmYTIzNWEtMmU2Yy00MmFmLWIxNjMtZGU1OGJhMmQ3ZTI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.QXqibDQXOrlbU2GacCoNUv5FayJvgt6xlOcRl2uBev4" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "checkQuota", "action": "other", "credits": 0}'
```

**Résultat attendu :**

```json
{
  "success": true,
  "allowed": true,
  "currentQuota": {
    "conversationsCreated": 0,
    "pollsCreated": 0,
    "aiMessages": 0,
    "analyticsQueries": 0,
    "simulations": 0,
    "totalCreditsConsumed": 0,
    "userId": "3b1802f9-db46-48c7-86b0-199830f56f53"
  }
}
```

**Note :**

- Project URL : `outmbbisrrdiumlweira.supabase.co`
- Edge Function URL : `https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking`
- User ID (exemple) : `3b1802f9-db46-48c7-86b0-199830f56f53`
- ⚠️ Le token JWT expire après 1 heure. Si vous obtenez une erreur "Invalid token", récupérez un nouveau token via le Dashboard.

### ⚠️ Dépannage

#### Erreur "Hôte inconnu" ou "Host unknown"

Si vous obtenez l'erreur **"Hôte inconnu"** ou **"Could not resolve host"**, cela signifie que l'Edge Function n'est **pas encore déployée**.

**Solution :**

1. **Vérifier si l'Edge Function existe**
   - Aller dans Supabase Dashboard → **Edge Functions**
   - Vérifier si `quota-tracking` apparaît dans la liste
   - Si elle n'existe pas, passez à l'étape 2

2. **Déployer l'Edge Function**
   - Voir section "### 2. Déployer l'Edge Function" ci-dessus
   - Copier le code depuis `supabase/functions/quota-tracking/index.ts`
   - Coller dans le Dashboard et cliquer sur **Deploy**

3. **Vérifier l'URL correcte**
   - Dans Supabase Dashboard → **Settings** → **API**
   - Trouver **Project URL** (format : `https://xxxxx.supabase.co`)
   - L'URL de l'Edge Function doit être : `https://xxxxx.supabase.co/functions/v1/quota-tracking`
   - ⚠️ **Important** : L'URL correcte est `https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking`
   - Si votre project ID est différent, remplacez `outmbbisrrdiumlweira` par votre vrai project ID
   - Exemple si votre project ID est `abc123xyz` :
     ```powershell
     Invoke-RestMethod -Uri "https://abc123xyz.supabase.co/functions/v1/quota-tracking" ...
     ```

4. **Tester après déploiement**
   - Attendre 1-2 minutes après le déploiement
   - Réessayer la commande PowerShell ou utiliser le Dashboard pour tester

#### Erreur "Invalid JWT" (401)

Si vous obtenez l'erreur **"Invalid JWT"** ou **"code: 401"**, cela signifie que :

1. ✅ L'Edge Function est bien déployée (sinon vous auriez "Hôte inconnu" ou "Could not resolve host")
2. ❌ Le token JWT utilisé n'est pas valide ou est expiré

**Causes possibles :**

- Le token a expiré (les tokens expirent après 1 heure)
- Le token n'a pas été copié correctement (caractères manquants)
- Le token provient d'un autre projet Supabase

**Solutions :**

1. **Remplacer le placeholder par un vrai token**
   - Dans votre commande PowerShell, vous avez probablement `$token = "VOTRE_TOKEN_ICI"`
   - ⚠️ **Remplacez `"VOTRE_TOKEN_ICI"` par un vrai token JWT**
   - Obtenir un token : Se connecter à votre application → Console navigateur (F12) → Exécuter le script JavaScript fourni dans la section "Méthode 2"

2. **Vérifier que le token n'est pas expiré**
   - Les tokens expirent après 1 heure
   - Si le token est ancien, récupérez-en un nouveau via le Dashboard

3. **Exemple avec un vrai token :**

   ```powershell
   # Remplacer par votre vrai token depuis le Dashboard
   $token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjZZQVhsVCtQN3N6VUljTmsiLCJ0eXAiOiJKV1QifQ..."

   $headers = @{
       "Authorization" = "Bearer $token"
       "Content-Type" = "application/json"
   }

   $body = @{
       endpoint = "checkQuota"
       action = "other"
       credits = 0
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking" `
       -Method Post `
       -Headers $headers `
       -Body $body
   ```

4. **Utiliser le script de test automatique :**

   ```powershell
   # Exécuter le script de test complet
   .\tests\test-quota-tracking-edge-function.ps1 -Token "VOTRE_JWT_TOKEN"

   # Le script teste automatiquement les 3 endpoints :
   # - checkQuota
   # - consumeCredits
   # - getJournal
   ```

## 📊 Monitoring

### Supabase Dashboard

- Visualiser consommation par utilisateur : `SELECT * FROM quota_tracking`
- Voir l'historique : `SELECT * FROM quota_tracking_journal ORDER BY created_at DESC`

### Logs Edge Function

**Via Supabase Dashboard :**

1. Aller dans **Edge Functions** → `quota-tracking`
2. Cliquer sur l'onglet **Logs**
3. Voir toutes les requêtes avec :
   - Timestamp
   - Status code
   - Durée d'exécution
   - Logs détaillés (console.log)

**Format des logs :**

```
[timestamp] [requestId] 🚀 QUOTA TRACKING EDGE FUNCTION
[timestamp] [requestId] ✅ Utilisateur authentifié: USER_ID
[timestamp] [requestId] 💳 Consume credits: ai_message, 1 crédits
```

**Filtrage :**

- Filtrer par status code (200, 400, 500, etc.)
- Filtrer par date/heure
- Rechercher dans les logs avec `Ctrl+F`

## ⚠️ Notes importantes

1. **Guests** : Continuent d'utiliser `guest_quotas` (fingerprinting) - pas de changement
2. **E2E Tests** : Utilisent localStorage directement (pas d'appel serveur)
3. **Cache** : 5 secondes TTL pour éviter les appels répétés
4. **Timeout** : 2 secondes max pour les appels Edge Function

## 🔮 Évolutions futures

- Intégration avec `user_quotas` (tiers free/premium/pro)
- Reset mensuel automatique via cron job
- Alertes si consommation suspecte (> 50 crédits/heure)
- Dashboard admin avec visualisation des quotas

## 📚 Références

- Planning : `Docs/2. Planning.md` lignes 414-447
- Architecture guests : `Docs/ARCHITECTURE/2025-11-12-FINGERPRINT-QUOTAS.md`
- Script SQL : `sql-scripts/create-quota-tracking-table.sql`
- Edge Function : `supabase/functions/quota-tracking/index.ts`
- Migration : `sql-scripts/migrate-localstorage-to-quota-tracking.ts`
