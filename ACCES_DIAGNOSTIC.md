# 🔍 Accès à la Page de Diagnostic

## ✨ Page de Test Interactive

J'ai créé une **page de diagnostic visuelle** pour vérifier facilement si vos données sont sauvegardées.

---

## 🚀 Comment y accéder

### **Étape 1 : Lancez votre application**

```bash
npm run dev
```

### **Étape 2 : Ouvrez votre navigateur**

Naviguez vers :

```
http://localhost:8080/diagnostic/storage
```

**Ou cliquez simplement sur ce lien dans votre navigateur :**
👉 [http://localhost:8080/diagnostic/storage](http://localhost:8080/diagnostic/storage)

---

## 📊 Ce que vous verrez

La page affiche :

### 1️⃣ **Résumé du Stockage**
- Nombre d'éléments en localStorage
- Nombre d'éléments en Supabase
- État de connexion utilisateur

### 2️⃣ **localStorage (Stockage Local)**
- Conversations sauvegardées localement
- Formulaires sauvegardés localement
- Messages par conversation
- Liste détaillée des 5 derniers éléments

### 3️⃣ **Supabase (Base de Données)**
- État de connexion
- Profil utilisateur
- Conversations en base de données
- Messages en base de données
- **Erreurs détaillées** si problèmes

### 4️⃣ **Recommandations**
- Alertes si vous n'êtes pas connecté
- Solutions pour corriger les erreurs 400
- Liens directs vers le dashboard Supabase
- Instructions pour exécuter le script SQL de correction

---

## 🎯 Fonctionnalités

✅ **Actualisation en temps réel** : Bouton pour relancer le diagnostic
✅ **Interface visuelle claire** : Cartes avec icônes et badges de statut
✅ **Détection automatique des erreurs** : Affichage des erreurs avec codes
✅ **Solutions intégrées** : Liens et instructions pour corriger les problèmes
✅ **Responsive** : Fonctionne sur mobile et desktop

---

## 🔧 Résolution des Problèmes

### Si vous voyez des erreurs 400

La page affichera une alerte avec :
- Le code d'erreur exact
- Les détails de l'erreur
- Un bouton pour ouvrir le dashboard Supabase
- Les instructions pour exécuter le script SQL

**Action à faire :**

1. Cliquez sur "Ouvrir le Dashboard Supabase"
2. Allez dans **"SQL Editor"** > **"New query"**
3. Copiez le contenu du fichier `sql-scripts/fix-400-errors.sql`
4. Cliquez sur **"Run"** (ou Ctrl+Enter)
5. Revenez sur la page de diagnostic et cliquez sur **"Actualiser"**

### Si vous n'êtes pas connecté

La page affichera :
- Un badge "Invité" dans le résumé
- Une alerte jaune expliquant que les données sont uniquement locales
- Un bouton "Se connecter" pour accéder à l'authentification

---

## 📚 Documentation

Pour plus de détails :
- **Guide complet** : `DIAGNOSTIC_CONSOLE.md`
- **Script SQL de correction** : `sql-scripts/fix-400-errors.sql`

---

## 🎨 Aperçu de l'Interface

La page utilise :
- **shadcn/ui components** pour une interface moderne
- **Lucide Icons** pour les icônes
- **Tailwind CSS** pour le style
- **Layout responsive** qui s'adapte à votre écran

**Composants utilisés :**
- Cards (cartes d'information)
- Badges (statuts colorés)
- Alerts (alertes informatives)
- Buttons (boutons d'action)
- Tables (tableaux de données)

---

## ✅ Ce que la page vérifie

### localStorage
- [x] Nombre de conversations
- [x] Nombre de formulaires/polls
- [x] Nombre de conversations avec messages
- [x] Détails des dernières conversations
- [x] Détails des derniers formulaires

### Supabase
- [x] Connexion utilisateur
- [x] Profil utilisateur (table `profiles`)
- [x] Conversations (table `conversations`)
- [x] Messages (table `messages`)
- [x] Erreurs détaillées avec codes

---

## 🚨 Problèmes Courants

### "La page ne charge pas"

**Vérifiez :**
1. Que l'application est bien lancée (`npm run dev`)
2. Que vous utilisez le bon port (8080 par défaut)
3. Qu'il n'y a pas d'erreurs dans la console

### "Erreur 400 sur profiles"

**Solution :**
- La table `profiles` a des colonnes manquantes
- Exécutez le script SQL `fix-400-errors.sql`

### "Erreur 400 sur conversations"

**Solution :**
- Les RLS Policies sont trop restrictives
- Exécutez le script SQL `fix-400-errors.sql`

---

## 💡 Conseil

**Utilisez cette page pour :**
- ✅ Vérifier régulièrement l'état de vos données
- ✅ Diagnostiquer rapidement les problèmes
- ✅ Valider que vos modifications fonctionnent
- ✅ Comprendre où sont stockées vos données

---

**Dernière mise à jour** : 7 Novembre 2025

