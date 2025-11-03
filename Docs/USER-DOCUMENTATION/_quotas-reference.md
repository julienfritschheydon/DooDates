# Référence Quotas DooDates

> ⚠️ **Ce fichier est une référence pour les autres docs**
> 
> Les valeurs ci-dessous sont synchronisées avec `src/constants/quotas.ts`
> 
> Lors de mises à jour, modifier:
> 1. `src/constants/quotas.ts` (source de vérité)
> 2. Ce fichier
> 3. Tous les docs qui référencent ces valeurs

---

## 📊 Quotas Actuels

### Mode Anonyme (Invité)

- **Conversations IA** : `5` (création de sondages avec l'IA)
- **Messages IA** : `10` par conversation
- **Analytics IA** : `5` requêtes par jour
- **Polls** : `2` par conversation
- **Stockage** : `50 MB`
- **Rétention** : `30 jours`

### Mode Authentifié (Gratuit)

- **Conversations IA** : `1000` 
- **Messages IA** : `100` par mois
- **Analytics IA** : `50` requêtes par jour
- **Polls** : `5` par conversation
- **Stockage** : `1000 MB` (1 GB)
- **Rétention** : `365 jours` (1 an)

---

## 🔍 Définitions

### Conversation IA
Une **conversation IA** = une session de création de sondage avec l'IA.
- ✅ **Compte** : Créer un nouveau sondage via le chat IA
- ❌ **Ne compte PAS** : Modifier un sondage existant, création manuelle ("Créer sans IA")

### Message IA
Un **message IA** = un message envoyé à l'IA.
- ✅ **Compte** : Chaque message dans le chat (création ou modification)
- ❌ **Ne compte PAS** : Messages système, erreurs

### Analytics IA
Une **requête analytics IA** = une question posée à l'IA sur vos résultats.
- ✅ **Compte** : Questions dans le panneau Analytics
- ❌ **Ne compte PAS** : Insights automatiques (gratuits)

---

## 📝 Comment utiliser dans la doc

### Markdown standard
Copiez-collez les valeurs ci-dessus en remplaçant les anciennes.

### Exemple
```markdown
Mode invité : **5 conversations IA** (création de sondages)
Mode authentifié : **1000 conversations IA**
```

---

**Dernière synchronisation** : 3 novembre 2025  
**Source de vérité** : `src/constants/quotas.ts`

