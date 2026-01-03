# 🔒 BUGFIX - Quota AI Messages pour Guests

**Date:** 10 novembre 2025  
**Priorité:** 🚨 CRITIQUE  
**Statut:** ✅ CORRIGÉ (2 bugs identifiés et résolus)

---

## 🐛 Problème identifié

### Scénario d'abus

Un utilisateur guest pouvait **spammer Gemini sans limite** dans une même conversation :

```
Guest user:
1. Message "Bonjour" → Appel Gemini #1 → 1 crédit consommé
2. Message "Comment ça va ?" → Appel Gemini #2 → 1 crédit consommé
3. Message "Aide-moi" → Appel Gemini #3 → 1 crédit consommé
...
100. Message "Test" → Appel Gemini #100 → 1 crédit consommé

Résultat : 100 appels Gemini = 100 crédits consommés
Mais quota conversations : 1/5 seulement !
```

### Impact

- ❌ **Abus possible** : Spam illimité de Gemini dans une conversation
- ❌ **Coûts** : Explosion des coûts API Gemini
- ❌ **Sécurité** : Quota conversations inefficace

---

## ✅ Solution implémentée

### Option 2 : Limite totale de messages IA (RECOMMANDÉE)

**Quota guests :**

- ✅ **5 conversations** max
- ✅ **20 messages IA** max (TOTAL, toutes conversations confondues)
- ✅ **50 crédits** max au total

**Exemple d'utilisation :**

```
Conversation 1 : 15 messages IA → Reste 5 crédits
Conversation 2 : 5 messages IA → Reste 0 crédits
Conversation 3 : ❌ BLOQUÉE (plus de crédits)
```

---

## 📝 Modifications apportées

### 1. **Schema Supabase** ✅ (Déjà existant)

La colonne `ai_messages` existait déjà dans `guest_quotas` :

```sql
CREATE TABLE guest_quotas (
  ...
  ai_messages INTEGER DEFAULT 0 NOT NULL,
  ...
);
```

### 2. **quotaTracking.ts** ✅

**Avant (Fire-and-forget) :**

```typescript
export function consumeAiMessageCredits(...): void {
  consumeCredits(...).catch((error) => {
    logger.error("Erreur", error);
  });
}
```

**Après (Bloquant) :**

```typescript
export async function consumeAiMessageCredits(...): Promise<void> {
  await consumeCredits(userId, 1, "ai_message", { conversationId });
}
```

### 3. **useMessageSender.ts** ✅

**🐛 Bug #1 : userId incorrect**

```typescript
// ❌ AVANT
const { getCurrentUserId } = await import("../lib/pollStorage");
const currentUserId = getCurrentUserId(); // Retourne 'dev-mhtf9miz-re89ci'
consumeAiMessageCredits(currentUserId, conversationId);
// → Ne passait JAMAIS par le système Supabase !
```

**🐛 Bug #2 : Vérification en cache non rafraîchie**

```typescript
// ❌ AVANT
const quotaCheck = checkAiMessageQuota(aiQuota); // Cache jamais mis à jour
if (!quotaCheck.canProceed) {
  return; // Ne bloquait JAMAIS
}
```

**✅ Correction finale :**

```typescript
// 1. Supprimer la vérification en cache (non fiable)
// 2. Utiliser user?.id || null pour les guests
// 3. VÉRIFIER ET CONSOMMER QUOTA AVANT d'appeler Gemini
try {
  const { user } = useAuth();
  const userId = user?.id || null; // ✅ null pour guests → système Supabase
  await consumeAiMessageCredits(userId, conversationId);
} catch (error) {
  // Afficher toast + message d'erreur
  toast({
    title: "Limite atteinte",
    description: "Vous avez atteint la limite de messages IA...",
    variant: "destructive",
  });
  return; // BLOQUER l'appel Gemini
}

// Appel Gemini seulement si quota OK
const pollResponse = await geminiAPI.generatePoll(trimmedInput);
```

**Bug critique corrigé :**

- `getCurrentUserId()` retournait un `deviceId` (ex: `'dev-mhtf9miz-re89ci'`)
- Cela empêchait le passage par le système Supabase de quotas guests
- Maintenant : `user?.id || null` → `null` pour guests → quotas Supabase ✅

### 4. **useFreemiumQuota.ts** ✅

Ajout de `aiMessages` dans les types et la logique :

```typescript
export interface QuotaUsage {
  conversations: number;
  polls: number;
  aiMessages: number;  // ← NOUVEAU
  storageUsed: number;
}

export interface QuotaStatus {
  conversations: { ... };
  polls: { ... };
  aiMessages: {  // ← NOUVEAU
    used: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
  storage: { ... };
}
```

### 5. **guestQuotaService.ts** ✅ (Déjà configuré)

Limites déjà définies :

```typescript
const GUEST_LIMITS = {
  CONVERSATIONS: 5,
  POLLS: 5,
  AI_MESSAGES: 20, // ← Limite messages IA
  ANALYTICS_QUERIES: 10,
  SIMULATIONS: 2,
  TOTAL_CREDITS: 50,
} as const;
```

---

## 🧪 Tests à effectuer

### Test 1 : Blocage après 20 messages IA

```bash
# 1. Nettoyer Supabase
DELETE FROM guest_quotas;
DELETE FROM guest_quota_journal;

# 2. Clear localStorage + reload
localStorage.clear();
location.reload();

# 3. Envoyer 20 messages IA dans une conversation
"Message 1" → ✅ Gemini répond (1/20)
"Message 2" → ✅ Gemini répond (2/20)
...
"Message 20" → ✅ Gemini répond (20/20)

# 4. Tenter un 21ème message
"Message 21" → ❌ Toast "Limite atteinte" + message bloqué
```

### Test 2 : Répartition sur plusieurs conversations

```bash
# 1. Conversation 1 : 10 messages IA
→ Quota : 10/20 messages IA utilisés

# 2. Conversation 2 : 10 messages IA
→ Quota : 20/20 messages IA utilisés

# 3. Conversation 3 : Tentative 1 message
→ ❌ BLOQUÉ (limite atteinte)
```

### Test 3 : Persistence après localStorage.clear()

```bash
# 1. Utiliser 15 messages IA
→ Quota : 15/20

# 2. localStorage.clear() + reload
→ Quota toujours 15/20 (récupéré par fingerprint)

# 3. Tenter un message
→ ✅ Autorisé (16/20)
```

---

## 📊 Résumé des fichiers modifiés

| Fichier                         | Lignes               | Changement                                                                               |
| ------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `src/hooks/useMessageSender.ts` | 37, 97, 155-156, 281 | ✅ Import `useAuth` + appel hook + suppression vérification cache + `user?.id \|\| null` |
| `src/lib/quotaTracking.ts`      | 387-392              | ✅ Rendre `consumeAiMessageCredits` bloquant                                             |
| `src/hooks/useFreemiumQuota.ts` | 26-61, 105-180       | ✅ Ajout `aiMessages` dans types et logique                                              |

**Total :** 3 fichiers modifiés, ~15 lignes critiques

---

## ✅ Statut final

**🎯 2 BUGS CORRIGÉS - PRÊT POUR TESTS**

### Corrections appliquées :

1. ✅ **Bug userId** : Utilisation de `user?.id || null` au lieu de `getCurrentUserId()`
2. ✅ **Bug cache** : Suppression de la vérification préalable en cache non rafraîchie
3. ✅ **Blocage Supabase** : `consumeAiMessageCredits` maintenant bloquant avec vérification temps réel

### Comportement attendu :

- ✅ Quota messages IA vérifié en temps réel dans Supabase
- ✅ Blocage après 20 messages IA (toutes conversations confondues)
- ✅ Toast + message d'erreur dans le chat
- ✅ Aucun appel Gemini après blocage
- ✅ Types TypeScript mis à jour
- ✅ Persistence via fingerprint

**Prochaine étape :** Tests manuels pour valider le blocage après 20 messages IA.
