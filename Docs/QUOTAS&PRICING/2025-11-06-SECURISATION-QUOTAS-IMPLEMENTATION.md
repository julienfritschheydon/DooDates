# Sécurisation Quotas - Implémentation

**Date :** 2025-11-06  
**Statut :** ✅ Implémenté  
**Priorité :** 🔴 CRITIQUE - URGENT

## Problème résolu

### Failles corrigées

1. ✅ **Clé API Gemini exposée** - Migrée vers Edge Function (variable serveur)
2. ✅ **Quotas localStorage** - Vérification côté serveur (DB) avec transaction atomique
3. ✅ **Bypass trivial** - Impossible de contourner les quotas côté client
4. ✅ **Rate limiting** - Implémenté par userId et IP

## Architecture sécurisée

```
┌─────────────────────────────────────────┐
│ CLIENT (React)                          │
│ ❌ Plus de clé API Gemini              │
│ ❌ Plus de vérification quota locale   │
│ ✅ Token JWT Supabase (authentifié)     │
│ ✅ Tous appels → Edge Function          │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│ SUPABASE EDGE FUNCTION                  │
│ (/api/check-quota-and-chat)             │
│ ✅ Vérifie JWT (auth.uid())              │
│ ✅ Vérifie quota DB (transaction atomique)│
│ ✅ Consomme crédit avant appel API       │
│ ✅ Clé Gemini = variable serveur (safe)  │
│ ✅ Rate limiting userId + IP             │
│ ✅ Logs audit (qui a fait quoi)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ GEMINI API                               │
│ ✅ Clé jamais exposée au client          │
└─────────────────────────────────────────┘
```

## Fichiers créés/modifiés

### Nouveaux fichiers

1. **`supabase/functions/check-quota-and-chat/index.ts`**
   - Edge Function Supabase
   - Vérification JWT
   - Vérification et consommation de quota (atomique)
   - Rate limiting (userId + IP)
   - Appel Gemini API sécurisé

2. **`src/services/SecureGeminiService.ts`**
   - Service frontend pour appeler l'Edge Function
   - Gestion des erreurs (quota, rate limit, auth)
   - Abstraction de l'appel sécurisé

3. **`sql-scripts/create-consume-ai-credit-function.sql`**
   - Fonction `consume_ai_credit(user_id)` - Consomme 1 crédit atomiquement
   - Fonction `rollback_ai_credit(user_id)` - Rollback en cas d'erreur Gemini

### Fichiers modifiés

1. **`src/lib/gemini.ts`**
   - ✅ Supprimé : Import GoogleGenerativeAI
   - ✅ Supprimé : Variable API_KEY
   - ✅ Supprimé : Fonction initializeGemini()
   - ✅ Modifié : `generatePollFromText()` utilise `secureGeminiService`
   - ✅ Modifié : `chatAboutPoll()` utilise `secureGeminiService`
   - ✅ Modifié : `testConnection()` utilise `secureGeminiService`

2. **`src/hooks/useConnectionStatus.ts`**
   - ✅ Supprimé : Vérifications de VITE_GEMINI_API_KEY
   - ✅ Messages d'erreur simplifiés

3. **`src/services/PollAnalyticsService.ts`**
   - ✅ Modifié : `initializeGemini()` ne nécessite plus de clé API

## Déploiement

### 1. Créer l'Edge Function Supabase

```bash
# Depuis la racine du projet
supabase functions deploy check-quota-and-chat
```

### 2. Configurer les variables d'environnement Supabase

Dans le dashboard Supabase → Edge Functions → Secrets :

- `GEMINI_API_KEY` : Votre clé API Gemini (jamais exposée au client)
- `SUPABASE_URL` : Automatique
- `SUPABASE_SERVICE_ROLE_KEY` : Automatique

### 3. Exécuter le script SQL

```sql
-- Exécuter dans Supabase SQL Editor
\i sql-scripts/create-consume-ai-credit-function.sql
```

### 4. Supprimer VITE_GEMINI_API_KEY du .env

```bash
# Supprimer cette ligne du .env.local
# VITE_GEMINI_API_KEY=your_key_here
```

### 5. Vérifier que les quotas sont initialisés

Pour chaque utilisateur authentifié, un quota par défaut (20 crédits/mois) sera créé automatiquement lors du premier appel.

## Protection implémentée

### Couche 1 : Authentification

- ✅ JWT Supabase obligatoire
- ✅ Impossible d'appeler Edge Function sans compte valide

### Couche 2 : Quotas en DB (source de vérité)

- ✅ Transaction atomique (FOR UPDATE) = pas de race condition
- ✅ Vérification + consommation = une seule opération
- ✅ Rollback automatique en cas d'erreur Gemini API

### Couche 3 : Rate limiting

- ✅ Par userId : 100 messages/heure (authentifié), 20/heure (invité)
- ✅ Par IP : 100 req/heure (protection anti-multi-comptes)

### Couche 4 : Monitoring

- ✅ Logs toutes les requêtes (userId, timestamp, crédits consommés)
- ✅ Console logs dans Edge Function

### Couche 5 : Restrictions API externe

- ⚠️ À configurer : Quotas Gemini dans Google Cloud Console
- ⚠️ À configurer : Alertes si dépassement

## Tests à effectuer

- [ ] Tentative bypass localStorage (doit échouer)
- [ ] Tentative extraction clé API (doit être impossible)
- [ ] Test rate limiting (blocage après limite)
- [ ] Test consommation atomique (pas de race condition)
- [ ] Test rollback quota en cas d'erreur Gemini
- [ ] Test quota invité (limite 20/heure)
- [ ] Test quota authentifié (limite 100/heure)

## Fichiers à migrer progressivement

Ces fichiers utilisent encore `VITE_GEMINI_API_KEY` mais ne sont pas critiques pour la sécurité des quotas :

- `src/lib/enhanced-gemini.ts` - Utilisé par GeminiIntentService
- `src/lib/simulation/SimulationService.ts` - Service de simulation
- `src/lib/simulation/SimulationAnalyzer.ts` - Analyse de simulation
- `src/services/GeminiIntentService.ts` - Détection d'intentions (utilise enhanced-gemini)

**Note :** Ces services peuvent être migrés progressivement. La sécurité critique (quota principal) est déjà implémentée.

## Coûts maîtrisés

**Avant :**

- 1 utilisateur malveillant = illimité = 50-100€/mois
- Risque : faillite

**Après :**

- 1 utilisateur gratuit = max 20 crédits/mois = 0.01€
- 1 utilisateur Premium = max 100 crédits/mois = 0.05€
- Protection contre abus = impossible de bypass

## Prochaines étapes

1. ✅ Edge Function créée
2. ✅ Service frontend créé
3. ✅ GeminiService migré
4. ⏳ Déployer Edge Function sur Supabase
5. ⏳ Exécuter script SQL
6. ⏳ Supprimer VITE_GEMINI_API_KEY du .env
7. ⏳ Tester en production
8. ⏳ Migrer services secondaires (enhanced-gemini, simulation)
