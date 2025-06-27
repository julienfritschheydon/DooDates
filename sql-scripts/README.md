# 📋 Scripts SQL pour DooDates

## 🎯 Configuration pour sondages anonymes (recommandé)

Pour permettre la création de sondages sans authentification (comme Doodle/Framadate) :

### **Ordre d'exécution :**

1. **`clean-rls-policies.sql`** - Nettoie toutes les politiques RLS existantes
2. **`modify-for-anonymous.sql`** - Modifie les politiques pour permettre les sondages anonymes  
3. **`add-admin-token-column.sql`** - Ajoute la colonne admin_token pour la gestion des sondages anonymes

### **Résultat :**
- ✅ Création de sondages sans compte
- ✅ Lien d'administration pour sondages anonymes
- ✅ Emails fonctionnels
- ✅ Stratégie alignée avec la concurrence

---

## 📜 Autres scripts disponibles

### **Scripts de base :**
- `database-rls-fix.sql` - Configuration RLS de base (authentification obligatoire)
- `database-triggers-fix.sql` - Configuration des triggers de base

### **Scripts de debug :**
- `debug-rls-policies.sql` - Scripts pour diagnostiquer les problèmes RLS
- `alternative-rls-fix.sql` - Version alternative des politiques RLS

### **Scripts expérimentaux :**
- `allow-anonymous-polls.sql` - Première version pour sondages anonymes (obsolète)
- `clean-anonymous-polls.sql` - Version intermédiaire (obsolète)
- `force-clean-rls.sql` - Nettoyage agressif (obsolète)

---

## 🚀 Instructions d'utilisation

1. **Ouvrez Supabase Dashboard → SQL Editor**
2. **Exécutez les scripts dans l'ordre recommandé**
3. **Vérifiez qu'il n'y a pas d'erreurs**
4. **Testez la création de sondages sans authentification**

---

## ⚠️ Notes importantes

- Toujours exécuter `clean-rls-policies.sql` en premier pour éviter les conflits
- Les scripts sont idempotents (peuvent être réexécutés sans problème)
- En cas de problème, recommencer avec `clean-rls-policies.sql` 