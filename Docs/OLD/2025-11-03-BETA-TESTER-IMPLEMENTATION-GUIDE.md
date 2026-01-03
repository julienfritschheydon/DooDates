# Guide d'Implémentation - Système Beta Testeurs

**Date:** 3 novembre 2025  
**Status:** Phase 1 - Setup initial

---

## ✅ CE QUI A ÉTÉ CRÉÉ

### 1. Documentation complète

- ✅ `Docs/USER-DOCUMENTATION/18-QUOTAS-PRICING-FINAL.md` - Spec complète système quotas & pricing
- ✅ `Docs/2. Planning.md` - Section "💰 NOUVEAU SYSTÈME QUOTAS & PRICING" ajoutée
- ✅ Ce guide d'implémentation

### 2. Base de données (SQL)

- ✅ `sql-scripts/create-beta-keys-and-quotas.sql` - Tables, fonctions, cron jobs
  - Table `beta_keys` (clés beta testeurs)
  - Table `user_quotas` (quotas utilisateurs)
  - 7 fonctions PostgreSQL
  - 2 cron jobs (reset quotas, expiration clés)
  - RLS policies (sécurité)

### 3. Service TypeScript

- ✅ `src/services/BetaKeyService.ts` - Service complet gestion clés beta
  - Génération clés
  - Redemption (activation)
  - Tracking (bugs, feedback)
  - Export CSV
  - Statistiques

### 4. Page Pricing (UI)

- ✅ `src/pages/Pricing.tsx` - Page pricing complète avec:
  - 3 tiers (Gratuit, Premium, Pro)
  - Toggle Monthly/Annual
  - Section Beta Testeur
  - Packs crédits additionnels
  - FAQ complète
  - Route `/pricing` configurée
  - TopNav intégré dans la page (Home, Documentation, Connexion/Créer)
  - Bouton "Tarifs" dans sidebar principale de l'app (après "Tableau de bord")

---

## 🚀 PROCHAINES ÉTAPES (ORDRE D'IMPLÉMENTATION)

### Phase 1: Setup Base de données (30 min)

**1. Exécuter migration SQL**

```bash
# Dans Supabase Dashboard → SQL Editor
# Copier/coller le contenu de: sql-scripts/create-beta-keys-and-quotas.sql
# Exécuter (F5)
```

**2. Vérifier tables créées**

```sql
-- Dans Supabase SQL Editor
SELECT tablename FROM pg_tables
WHERE tablename IN ('beta_keys', 'user_quotas');

-- Devrait retourner 2 lignes
```

**3. Tester génération de 5 clés test**

```sql
SELECT * FROM generate_beta_key(5, 'Test initial', 3);

-- Devrait retourner 5 codes BETA-XXXX-XXXX-XXXX
```

**4. Vérifier clés générées**

```sql
SELECT code, status, expires_at
FROM beta_keys
WHERE notes = 'Test initial';
```

---

### Phase 2: Composants UI (2-3h)

#### A. Composant Redemption (utilisateur)

**Fichier:** `src/components/settings/BetaKeyRedemption.tsx`

```typescript
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BetaKeyService, formatBetaKey } from '@/services/BetaKeyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function BetaKeyRedemption() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoading(true);

    const result = await BetaKeyService.redeemKey(user.id, code);

    if (result.success) {
      toast.success('🎉 Clé Beta activée ! Vous avez maintenant 1000 crédits/mois.');
      // Refresh page ou redirect
      window.location.href = '/dashboard';
    } else {
      toast.error(result.error || 'Erreur lors de l\'activation');
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎁 Clé Beta Testeur</CardTitle>
        <CardDescription>
          Vous avez reçu une clé d'accès beta ? Activez-la ici pour obtenir 1000 crédits/mois pendant 3 mois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="BETA-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(formatBetaKey(e.target.value))}
              maxLength={19}
              className="font-mono"
            />
            <Button
              onClick={handleRedeem}
              disabled={loading || code.length < 19}
            >
              {loading ? 'Activation...' : 'Activer'}
            </Button>
          </div>

          <p className="text-sm text-gray-600">
            Entrez le code que vous avez reçu par email. Format: BETA-XXXX-XXXX-XXXX
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Intégration dans Settings:**

Ajouter dans `src/pages/Settings.tsx` (ou équivalent):

```typescript
import { BetaKeyRedemption } from '@/components/settings/BetaKeyRedemption';

// Dans le JSX:
<BetaKeyRedemption />
```

---

#### B. Badge Beta Tester (TopBar)

**Fichier:** Modifier `src/components/layout/TopBar.tsx`

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits'; // À créer

export function TopBar() {
  const { user } = useAuth();
  const { tier, credits } = useCredits();

  return (
    <header>
      {/* ... autres éléments ... */}

      {/* Badge Beta Tester */}
      {tier === 'beta' && (
        <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
          🎁 Beta Tester
        </div>
      )}

      {/* Indicateur crédits */}
      {user && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">⚡</span>
          <span className="font-semibold">{credits.remaining}/{credits.total}</span>
        </div>
      )}
    </header>
  );
}
```

---

#### C. Page Admin Gestion Clés

**Fichier:** `src/pages/admin/BetaKeys.tsx`

```typescript
import { useState, useEffect } from 'react';
import { BetaKeyService, BetaKey } from '@/services/BetaKeyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function AdminBetaKeysPage() {
  const [keys, setKeys] = useState<BetaKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await BetaKeyService.getAllKeys();
      setKeys(data);
    } catch (error) {
      toast.error('Erreur chargement clés');
    } finally {
      setLoading(false);
    }
  };

  const generateKeys = async () => {
    setGenerating(true);
    try {
      const newKeys = await BetaKeyService.generateKeys(count, notes);
      toast.success(`${count} clés générées !`);

      // Télécharger CSV automatiquement
      await loadKeys();
      BetaKeyService.downloadCSV(keys, `beta-keys-${Date.now()}.csv`);
    } catch (error) {
      toast.error('Erreur génération clés');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gestion Clés Beta</h1>

      {/* Formulaire génération */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Générer nouvelles clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Nombre de clés</label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Batch Nov 2025"
              />
            </div>
            <Button onClick={generateKeys} disabled={generating}>
              {generating ? 'Génération...' : `Générer ${count} clés`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste clés */}
      <Card>
        <CardHeader>
          <CardTitle>Clés générées ({keys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Activée le</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead>Bugs</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-mono text-sm">{key.code}</TableCell>
                  <TableCell>
                    <StatusBadge status={key.status} />
                  </TableCell>
                  <TableCell>{key.assigned_to || '-'}</TableCell>
                  <TableCell>
                    {key.redeemed_at ? new Date(key.redeemed_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{new Date(key.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell>{key.bugs_reported}</TableCell>
                  <TableCell>{key.feedback_score || '-'}/5</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    used: 'bg-blue-100 text-blue-800',
    expired: 'bg-gray-100 text-gray-800',
    revoked: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
}
```

**Ajouter route:**

```typescript
// Dans src/App.tsx ou équivalent
import { AdminBetaKeysPage } from '@/pages/admin/BetaKeys';

<Route path="/admin/beta-keys" element={<AdminBetaKeysPage />} />
```

---

#### Ajouter l'indicateur de quota dans la sidebar (2 min)

### Phase 3: Hook useCredits (1h)

**Fichier:** `src/hooks/useCredits.ts`

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface UserQuota {
  tier: "free" | "premium" | "pro" | "beta";
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  max_polls: number;
  reset_date: string;
}

export function useCredits() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadQuota();
    } else {
      setQuota(null);
      setLoading(false);
    }
  }, [user]);

  const loadQuota = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_quotas")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setQuota(data);
    } catch (error) {
      console.error("Failed to load quota:", error);
    } finally {
      setLoading(false);
    }
  };

  const consumeCredits = async (amount: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc("consume_credits", {
        p_user_id: user.id,
        p_amount: amount,
      });

      if (error || !data.success) {
        return false;
      }

      // Recharger quota après consommation
      await loadQuota();
      return true;
    } catch (error) {
      console.error("Failed to consume credits:", error);
      return false;
    }
  };

  return {
    quota,
    loading,
    tier: quota?.tier || "free",
    credits: {
      total: quota?.credits_total || 0,
      used: quota?.credits_used || 0,
      remaining: quota?.credits_remaining || 0,
    },
    consumeCredits,
    refreshQuota: loadQuota,
  };
}
```

---

## 🧪 TESTS (30 min)

### 1. Test génération clés (SQL)

```sql
-- Générer 5 clés test
SELECT * FROM generate_beta_key(5, 'Test manuel', 3);

-- Vérifier
SELECT code, status, expires_at FROM beta_keys WHERE notes = 'Test manuel';
```

### 2. Test redemption (SQL)

```sql
-- Remplacer USER_ID et CODE
SELECT * FROM redeem_beta_key(
  'USER_ID_ICI'::uuid,
  'BETA-XXXX-XXXX-XXXX'
);

-- Vérifier tier mis à jour
SELECT tier, credits_total FROM user_quotas WHERE user_id = 'USER_ID_ICI'::uuid;
```

### 3. Test UI (Manuel)

- [ ] Aller sur `/settings`
- [ ] Voir section "Clé Beta"
- [ ] Entrer une clé test
- [ ] Vérifier activation
- [ ] Vérifier badge "Beta Tester" dans TopBar
- [ ] Vérifier crédits (1000/1000)

### 4. Test Admin (Manuel)

- [ ] Aller sur `/admin/beta-keys`
- [ ] Générer 10 clés
- [ ] Télécharger CSV
- [ ] Vérifier table affiche bien les clés

---

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### Base de données

- [ ] Migration SQL exécutée en production
- [ ] Tables `beta_keys` et `user_quotas` créées
- [ ] Fonctions PostgreSQL testées
- [ ] Cron jobs configurés
- [ ] RLS policies activées

### Code

- [ ] Service `BetaKeyService` testé
- [ ] Composant `BetaKeyRedemption` intégré dans Settings
- [ ] Badge Beta Tester affiché dans TopBar
- [ ] Page admin `/admin/beta-keys` accessible
- [ ] Hook `useCredits` fonctionnel

### Sécurité

- [ ] RLS policies empêchent accès non autorisé
- [ ] Admin seul peut générer clés
- [ ] Users peuvent activer clés uniquement pour eux-mêmes
- [ ] Validation format clé côté client et serveur

### Tests

- [ ] Génération 20 clés test OK
- [ ] Redemption clé valide OK
- [ ] Erreur clé invalide OK
- [ ] Erreur clé déjà utilisée OK
- [ ] Badge Beta visible après activation OK
- [ ] Crédits 1000/1000 après activation OK

---

## 🎁 DISTRIBUTION CLÉS BETA TESTEURS

### 1. Générer 20 clés production

```typescript
// Dans console admin
const keys = await BetaKeyService.generateKeys(20, "Batch Beta Nov 2025");
BetaKeyService.downloadCSV(keys, "beta-keys-prod-nov2025.csv");
```

### 2. Email template

```
Sujet: 🎉 Bienvenue dans la bêta DooDates !

Bonjour [Prénom],

Merci d'avoir accepté de tester DooDates en avant-première !

🎁 Votre clé beta: BETA-XXXX-XXXX-XXXX

Ce que vous obtenez:
✓ 1000 crédits IA/mois (3 mois)
✓ Toutes les fonctionnalités Pro
✓ Support prioritaire Discord
✓ Badge "Beta Tester" exclusif

Comment activer:
1. Créez votre compte: https://doodates.com/signup
2. Paramètres → Clé Beta → Entrez votre code
3. Commencez à créer !

Questions ? Rejoignez notre Discord: [lien]

À bientôt,
Julien
```

### 3. Tracker engagement

- [ ] Créer Google Sheet avec liste testeurs
- [ ] Colonnes: Nom, Email, Clé, Date activation, Sondages créés, Bugs reportés
- [ ] Update hebdomadaire

---

## 🐛 TROUBLESHOOTING

### "Function generate_beta_key does not exist"

→ Réexécuter migration SQL complète

### "RLS policy violation"

→ Vérifier que l'utilisateur est admin (raw_user_meta_data.role = 'admin')

### "Clé déjà utilisée" alors qu'elle est active

→ Vérifier status dans DB: `SELECT * FROM beta_keys WHERE code = 'XXX';`

### Badge Beta ne s'affiche pas

→ Vérifier tier dans DB: `SELECT tier FROM user_quotas WHERE user_id = 'XXX';`

---

**Prêt à démarrer l'implémentation !** 🚀

Commencez par Phase 1 (SQL), puis Phase 2 (UI), puis Phase 3 (Hook).
Total estimé: **4-5h** pour système complet opérationnel.
