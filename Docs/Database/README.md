# 📚 Documentation Base de Données DooDates

## 📖 Document Principal

**👉 [DATABASE-SCHEMA-COMPLETE.md](./DATABASE-SCHEMA-COMPLETE.md)**

C'est le **document de référence officiel** pour l'architecture et le schéma complet de base de données de DooDates.

### Architecture Actuelle

DooDates utilise une **architecture centrée sur les conversations** :

- Table principale : `conversations`
- Les sondages sont stockés dans `conversations.poll_data` (JSONB)
- Principe : **UNE CONVERSATION = UN PROJET**

### Contenu du Document

- 📋 Vue d'ensemble et principes architecturaux
- 🔄 Flux de données (création IA et manuelle)
- 📊 Tables principales avec schémas SQL complets
- 🔒 RLS Policies et sécurité
- 🔧 Triggers et fonctions PostgreSQL
- 🚀 Guide de migration
- 🔍 Requêtes courantes et exemples

---

## 📂 Structure du Dossier

```
Database/
├── README.md                        ← Vous êtes ici
├── DATABASE-SCHEMA-COMPLETE.md      ← 📌 Document officiel
└── Archive/
    ├── README.md
    └── 5. Database-Schema-OBSOLETE.md  ← Ancien schéma (ne plus utiliser)
```

---

## ⚠️ Important

Le dossier `Archive/` contient des documents obsolètes conservés uniquement pour référence historique.

**Ne pas utiliser les documents dans Archive/** pour développer de nouvelles fonctionnalités.

---

**Dernière mise à jour :** 7 novembre 2025
