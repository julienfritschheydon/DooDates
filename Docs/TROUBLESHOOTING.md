# Guide de Dépannage DooDates

**Dernière mise à jour : 15 Octobre 2025**

## 🚨 Problèmes Critiques et Solutions

### NOUVEAU - Menu Sticky Disparaît au Scroll (15/10/2025) ✅ RÉSOLU

**Symptôme :**
Le TopNav (menu principal avec logo + boutons) disparaît lors du scroll dans les pages, notamment sur la page de chat/accueil.

**Cause :**
Le positionnement `sticky` ne fonctionne pas correctement dans un contexte de scroll complexe avec `overflow-y-auto` dans les composants enfants. Le scroll interne empêche le sticky de fonctionner.

**Solution Appliquée :**

#### 1. TopNav en `fixed` (au lieu de `sticky`)
```tsx
// src/components/TopNav.tsx
<nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b...">
```

#### 2. Padding-top sur TOUTES les pages (80px pour compenser le menu fixe)

**Pages modifiées :**
- `src/pages/Index.tsx` - Page chat/accueil
- `src/pages/Vote.tsx` - Page de vote
- `src/pages/Results.tsx` - Page résultats
- `src/pages/PollCreator.tsx` - Créateur de sondage
- `src/pages/FormCreator.tsx` - Créateur de formulaire
- `src/pages/CreateChooser.tsx` - Choix du type de sondage
- `src/components/Dashboard.tsx` - Tableau de bord
- `src/components/polls/FormPollResults.tsx` - Résultats formulaire

**Pattern appliqué partout :**
```tsx
<div className="min-h-screen bg-gray-50">
  <TopNav />
  <div className="pt-20">  {/* 80px padding-top */}
    {/* Contenu de la page */}
  </div>
</div>
```

#### 3. Header Chat sticky sous le TopNav

```tsx
// src/components/GeminiChatInterface.tsx
<div className="sticky top-[80px] z-40 bg-white border-b...">
  {/* IA connectée + Conversations + Nouveau chat */}
</div>
```

**Hiérarchie Z-index :**
- TopNav : `z-50` (tout en haut)
- Header Chat : `z-40` (sous le TopNav mais au-dessus du contenu)

**Résultat :**
 Le menu reste **TOUJOURS** visible en haut de page, peu importe le scroll  
 Le header chat reste collé sous le TopNav sur la page d'accueil  
 Fonctionne sur toutes les pages (mobile et desktop)

**Fichiers modifiés :**
- `src/components/TopNav.tsx` : `fixed` au lieu de `sticky`
- `src/components/GeminiChatInterface.tsx` : Header sticky + retrait `overflow-y-auto`
- 8 fichiers de pages : Ajout `pt-20` pour compenser le TopNav fixe

---

### NOUVEAU - Erreur 401 RLS et Client Supabase Timeout

**Symptôme :**
```
HTTP 401: {"code":"42501","message":"new row violates row-level security policy"}
```
ou bouton bloqué sur "Création en cours..."

**Cause :**
1. Politiques RLS incorrectes (USING au lieu de WITH CHECK)
2. Client Supabase qui se bloque sur getSession() et insert()

**Solution :**
1. **Corriger les RLS policies** : Exécuter `alternative-rls-fix.sql`
2. **Contourner les timeouts** : Utiliser fetch direct avec JWT token

**Fichiers affectés :**
- `src/hooks/usePolls.ts` : Fetch direct au lieu du client Supabase
- `src/components/SupabaseTest.tsx` : Test avec récupération token localStorage
- `alternative-rls-fix.sql` : Policies permissives pour authenticated users

**Code de contournement :**
```typescript
// Récupération token JWT depuis localStorage
const supabaseSession = localStorage.getItem('supabase.auth.token');
const sessionData = JSON.parse(supabaseSession);
const token = sessionData?.access_token;

// Insertion avec fetch direct
const response = await fetch(`${SUPABASE_URL}/rest/v1/polls`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### 1. "Database error saving new user" (OAuth)

**Symptôme :**
```
error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

**Cause :**
Les triggers automatiques pour créer les profils utilisateurs ne sont pas configurés dans Supabase.

**Solution :**
1. Aller dans Supabase Dashboard → SQL Editor
2. Exécuter le fichier `database-triggers-fix.sql`
3. Vérifier que les triggers sont créés avec la requête de vérification
4. Tester l'authentification Google

**Fichiers concernés :**
- `database-triggers-fix.sql` (correction immédiate)
- `Docs/5. Database-Schema.md` (documentation complète)

---

### 2. Erreurs de Validation Formulaire

**Symptôme :**
```
Property 'confirmPassword' does not exist on type 'FieldErrors<...>'
```

**Cause :**
Le schéma Zod ne correspond pas aux champs du formulaire.

**Solution :**
Vérifier que le schéma dans `src/lib/schemas.ts` contient tous les champs utilisés dans les formulaires.

**Exemple de correction :**
```typescript
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
  fullName: z.string().min(1)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
```

---

### 3. Problèmes de Redirection OAuth

**Symptôme :**
La page reste sur "Redirection..." sans rediriger.

**Cause :**
Le composant AuthCallback ne gère pas correctement la session Supabase.

**Solution :**
1. Vérifier que `AuthCallback` est importé dans `App.tsx`
2. Vérifier la route `/auth/callback`
3. Augmenter le timeout dans `AuthCallback` si nécessaire

**Code de diagnostic :**
```javascript
// Dans AuthCallback, ajouter des logs
console.log('User:', user);
console.log('Loading:', loading);
console.log('Search params:', searchParams.toString());
```

---

### 4. Erreurs de Build TypeScript

**Symptôme :**
```
Cannot find name 'SignUpForm'. Did you mean 'SignInForm'?
```

**Cause :**
Composant non exporté ou mal importé.

**Solution :**
1. Vérifier que le composant est bien défini
2. Vérifier l'export/import
3. Utiliser `reapply` si l'édition automatique a échoué

---

### 5. Problèmes de Configuration Supabase

**Symptôme :**
Erreurs de connexion à la base de données.

**Diagnostic :**
```bash
# Vérifier les variables d'environnement
Get-Content .env.local
```

**Solution :**
1. Vérifier `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
2. Vérifier que le projet Supabase est actif
3. Vérifier les politiques RLS

---

## 🔧 Outils de Diagnostic

### Vérification de l'État de l'Application

```bash
# Build pour vérifier les erreurs TypeScript
npm run build

# Vérifier les variables d'environnement
Get-Content .env.local

# Vérifier les dépendances
npm list @supabase/supabase-js
```

### Vérification Base de Données

```sql
-- Vérifier les triggers
SELECT triggername, tgfoid::regproc 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
WHERE c.relname = 'users' AND t.tgname LIKE '%auth%';

-- Vérifier les profils créés
SELECT COUNT(*) FROM public.profiles;

-- Vérifier les utilisateurs auth
SELECT COUNT(*) FROM auth.users;
```

### Logs de Débogage

```javascript
// Dans AuthContext
console.log('Auth state change:', event, session?.user?.id);

// Dans AuthCallback
console.log('Callback params:', window.location.search);

// Dans les formulaires
console.log('Form errors:', errors);
console.log('Submission data:', data);
```

---

## 📋 Checklist de Vérification

### Avant de Tester l'Authentification

- [ ] Base de données : 6 tables créées
- [ ] Triggers : `handle_new_user` configuré
- [ ] RLS Policies : Activées sur toutes les tables
- [ ] Google OAuth : Client ID configuré dans Supabase
- [ ] Variables d'environnement : `.env.local` correct
- [ ] Build : Aucune erreur TypeScript

### Après un Problème d'Authentification

- [ ] Console navigateur : Vérifier les erreurs JavaScript
- [ ] Network tab : Vérifier les requêtes Supabase
- [ ] Supabase logs : Vérifier les erreurs serveur
- [ ] Database : Vérifier si l'utilisateur est créé
- [ ] Profile : Vérifier si le profil est créé

---

## 🚀 Actions de Récupération Rapide

### Si l'authentification ne fonctionne pas du tout :

1. Redémarrer le serveur de développement
2. Vider le cache navigateur
3. Vérifier les credentials Supabase
4. Re-exécuter les triggers SQL

### Si les utilisateurs sont créés mais sans profils :

1. Exécuter `database-triggers-fix.sql`
2. Créer manuellement les profils manquants :
```sql
INSERT INTO public.profiles (id, email, full_name, plan_type)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'free'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

### Si les redirections OAuth échouent :

1. Vérifier les URLs de callback dans Google Cloud Console
2. Vérifier la configuration Supabase Auth
3. Tester avec un compte Google différent

---

## 📞 Support et Ressources

- **Documentation Supabase Auth** : https://supabase.com/docs/guides/auth
- **Google OAuth Setup** : https://developers.google.com/identity/protocols/oauth2
- **React Hook Form** : https://react-hook-form.com/
- **Zod Validation** : https://zod.dev/

---

*Dernière mise à jour : 22 Janvier 2025* 