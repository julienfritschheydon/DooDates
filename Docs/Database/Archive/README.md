# Archive - Anciens Documents de Base de Données

## 📁 Contenu

Ce dossier contient les documents de base de données obsolètes, conservés pour référence historique uniquement.

---

## 🚫 `5. Database-Schema-OBSOLETE.md`

**Date de création :** 23 juin 2025  
**Archivé le :** 7 novembre 2025  
**Raison :** Architecture remplacée par le modèle "conversation-centric"

### Pourquoi obsolète ?

Ce document décrivait une architecture avec tables séparées :
- `polls` - Table principale des sondages
- `poll_options` - Options de dates
- `votes` - Table des votes

**Cette architecture n'est plus utilisée.**

### Architecture actuelle

Voir : `../DATABASE-SCHEMA-COMPLETE.md`

L'architecture actuelle est centrée sur la table `conversations` :
- **UNE CONVERSATION = UN PROJET**
- Toutes les données du poll sont dans `conversations.poll_data` (JSONB)
- Plus simple, plus flexible, plus cohérent

---

## ⚠️ Ne pas utiliser ces documents

Les documents dans ce dossier sont **obsolètes** et ne doivent pas être utilisés pour développer de nouvelles fonctionnalités.

Référez-vous toujours à `DATABASE-SCHEMA-COMPLETE.md` pour l'architecture actuelle.

