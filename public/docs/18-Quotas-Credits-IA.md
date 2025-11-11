# 📊 Quotas et Crédits IA - Guide Complet

## 🎯 Vue d'ensemble

DooDates utilise un système de **crédits IA** pour garantir un accès équitable à l'intelligence artificielle tout en maintenant un service gratuit généreux.

---

## 💳 Système de Crédits

### Qu'est-ce qu'un crédit IA ?

Un **crédit IA** est consommé à chaque fois que vous utilisez une fonctionnalité d'intelligence artificielle :

- ✨ Création d'un sondage via l'assistant IA
- 💬 Modification d'un sondage via conversation
- 📊 Génération d'insights automatiques sur les résultats
- ❓ Question libre à l'IA sur vos résultats
- 🎯 Utilisation d'une Quick Query (analyse rapide)

**Important :** 1 conversation = 1 crédit, peu importe le nombre de messages échangés dans cette conversation.

---

## 📈 Quotas par Type de Compte

### 🆓 Mode Invité (Sans compte)

```
┌─────────────────────────────────────┐
│  🤖 Crédits IA : 12 / 20            │
│  ████████████░░░░░░░░░░░ 60%       │
└─────────────────────────────────────┘
```

**Caractéristiques :**
- **20 crédits IA** à vie
- Pas de reset mensuel
- Pas de création de compte nécessaire
- Données stockées localement (localStorage)
- Rétention : 30 jours

**Idéal pour :**
- Tester DooDates sans engagement
- Créer quelques sondages ponctuels
- Découvrir les fonctionnalités IA

---

### 👤 Compte Gratuit (Authentifié)

```
┌─────────────────────────────────────┐
│  🤖 Crédits IA : 234 / 1000         │
│  ████████░░░░░░░░░░░░░░░ 23%       │
└─────────────────────────────────────┘
```

**Caractéristiques :**
- **1000 crédits IA** au total
- Pas de reset mensuel (quota à vie)
- Synchronisation cloud (Supabase)
- Rétention : 365 jours (1 an)
- Accès à toutes les fonctionnalités de base

**Idéal pour :**
- Utilisation régulière de DooDates
- Sondages professionnels
- Collaboration en équipe
- Historique long terme

---

### 💼 Pro & 🚀 Premium

```
┌─────────────────────────────────────┐
│  🤖 Crédits IA : Illimités ∞        │
│  ██████████████████████████ 100%   │
└─────────────────────────────────────┘
```

**Caractéristiques :**
- **Crédits IA illimités**
- Fonctionnalités avancées exclusives
- Support prioritaire
- Analyses IA avancées
- Exports personnalisés

**Idéal pour :**
- Entreprises et organisations
- Utilisation intensive
- Besoins avancés en analytics

---

## 🔍 Détail des Consommations

### Actions qui consomment 1 crédit

| Action | Crédit | Détails |
|--------|--------|---------|
| 💬 **Créer un sondage via IA** | 1 | Toute la conversation compte pour 1 crédit |
| ✏️ **Modifier un sondage via IA** | 1 | Par session de modification |
| 💡 **Insight automatique** | 1 | Généré à l'ouverture des résultats |
| ❓ **Question libre** | 1 | Par question posée à l'IA |
| 🎯 **Quick Query** | 1 | Par analyse rapide lancée |

### Actions qui NE consomment PAS de crédit

| Action | Crédit | Détails |
|--------|--------|---------|
| 📝 **Créer un sondage manuellement** | 0 | Interface graphique classique |
| 📊 **Consulter les graphiques** | 0 | Visualisations natives |
| 📥 **Exporter les résultats** | 0 | CSV, PDF, JSON, Markdown |
| 👥 **Partager un sondage** | 0 | Liens de partage illimités |
| 🗳️ **Voter sur un sondage** | 0 | Réponses illimitées |

---

## ⚠️ Que se passe-t-il quand j'atteins la limite ?

### Mode Invité (20/20 crédits épuisés)

```
┌─────────────────────────────────────────────┐
│  ⚠️ Crédits IA épuisés                      │
│                                             │
│  Vous avez utilisé vos 20 crédits gratuits │
│                                             │
│  Options :                                  │
│  1. Créer un compte → +1000 crédits        │
│  2. Continuer sans IA → Fonctions de base  │
└─────────────────────────────────────────────┘
```

**Ce que vous pouvez encore faire :**
- ✅ Créer des sondages manuellement (interface graphique)
- ✅ Consulter les résultats et graphiques
- ✅ Exporter vos données
- ✅ Partager vos sondages
- ❌ Utiliser l'assistant IA pour créer/modifier
- ❌ Générer des insights automatiques
- ❌ Poser des questions à l'IA

---

### Compte Gratuit (1000/1000 crédits épuisés)

```
┌─────────────────────────────────────────────┐
│  ⚠️ Quota atteint                           │
│                                             │
│  Vous avez utilisé vos 1000 crédits        │
│                                             │
│  Options :                                  │
│  1. Passer en Pro → Crédits illimités      │
│  2. Continuer sans IA → Fonctions de base  │
└─────────────────────────────────────────────┘
```

**Ce que vous pouvez encore faire :**
- ✅ Toutes les fonctionnalités de base (sans IA)
- ✅ Accès à tous vos sondages existants
- ✅ Exports et partages illimités
- ❌ Nouvelles interactions IA

---

## 💡 Optimiser Vos Crédits

### 🎯 Conseils pour économiser

1. **Utilisez l'interface graphique d'abord**
   ```
   Créez vos sondages simples manuellement
   → Réservez l'IA pour les cas complexes
   ```

2. **Désactivez les insights automatiques**
   ```
   Paramètres → Analytics IA → "Insights auto : OFF"
   → Économie de 1 crédit par ouverture de résultats
   ```

3. **Groupez vos questions à l'IA**
   ```
   Au lieu de 3 questions séparées (3 crédits)
   → Posez 1 question groupée (1 crédit)
   
   ❌ "Quel est le taux de satisfaction ?"
   ❌ "Qui a le mieux répondu ?"
   ❌ "Quelle est la tendance ?"
   
   ✅ "Donne-moi le taux de satisfaction, les meilleurs 
       répondants et la tendance générale"
   ```

4. **Consultez les graphiques natifs d'abord**
   ```
   Les graphiques classiques sont gratuits
   → Utilisez l'IA uniquement pour analyses complexes
   ```

5. **Modifiez manuellement les petits changements**
   ```
   Ajouter 1 option → Interface graphique (gratuit)
   Restructurer tout le sondage → IA (1 crédit)
   ```

---

## 📊 Suivi de Votre Quota

### Indicateur dans l'interface

L'indicateur de quota est visible en permanence dans le header du Dashboard :

```
┌────────────────────────────────────────┐
│  🤖 Conversations IA : 234 / 1000      │
│  ████████░░░░░░░░░░░░░░░ 23%         │
└────────────────────────────────────────┘
```

**Codes couleur :**
- 🟢 **Vert** (0-75%) : Quota confortable
- 🟡 **Jaune** (75-90%) : Attention, quota bientôt atteint
- 🔴 **Rouge** (90-100%) : Quota presque épuisé
- ⚫ **Gris** (100%) : Quota épuisé

---

## 🔄 Reset et Renouvellement

### Mode Invité
- ❌ **Pas de reset** : 20 crédits à vie
- ✅ **Solution** : Créer un compte gratuit pour 1000 crédits

### Compte Gratuit
- ❌ **Pas de reset mensuel** : 1000 crédits à vie
- ✅ **Solution** : Passer en Pro pour crédits illimités

### Pro & Premium
- ✅ **Crédits illimités** : Pas de limite, pas de reset nécessaire

---

## 🤔 Questions Fréquentes

### Pourquoi 20 crédits pour les invités ?

**Réponse :** 20 crédits permettent de :
- Créer 10-15 sondages complets avec l'IA
- Tester toutes les fonctionnalités
- Découvrir la valeur de DooDates
- Décider si un compte gratuit vous convient

C'est **4x plus généreux** que la plupart des concurrents (qui offrent 5 crédits).

---

### Pourquoi pas de reset mensuel pour le compte gratuit ?

**Réponse :** 1000 crédits représentent :
- **Plusieurs années d'utilisation** pour un utilisateur moyen
- Pas de stress de "fin de mois"
- Simplicité : pas de gestion de renouvellement

Si vous atteignez 1000 crédits, c'est que DooDates vous apporte une vraie valeur → Le plan Pro devient pertinent.

---

### Les crédits expirent-ils ?

**Non.** Vos crédits ne expirent jamais :
- Mode invité : 20 crédits disponibles indéfiniment
- Compte gratuit : 1000 crédits disponibles indéfiniment
- Seule limite : Rétention des données (30 jours invité, 365 jours gratuit)

---

### Puis-je acheter des crédits supplémentaires ?

**Non.** DooDates propose uniquement :
- 🆓 **Gratuit** : Quotas fixes (20 ou 1000)
- 💼 **Pro** : Crédits illimités

Pas de système de "packs de crédits" pour simplifier la tarification.

---

### Comment voir mon historique de consommation ?

Actuellement, seul le compteur global est affiché. Une page détaillée d'historique est prévue dans une future mise à jour.

---

## 🚀 Passer au Plan Pro

### Avantages du Plan Pro

| Fonctionnalité | Gratuit | Pro |
|----------------|---------|-----|
| Crédits IA | 1000 | ∞ Illimités |
| Sondages | Illimités | Illimités |
| Réponses | Illimitées | Illimitées |
| Analytics IA | 1000 requêtes | ∞ Illimitées |
| Exports | Tous formats | Tous formats + API |
| Support | Communauté | Prioritaire |
| Rétention | 365 jours | Illimitée |

### Tarification

- **💼 Pro** : 9€/mois (ou 90€/an, -17%)
- **🚀 Premium** : 29€/mois (ou 290€/an, -17%)

[Voir les détails des plans →](/pricing)

---

## 📞 Besoin d'aide ?

- 📧 **Email** : support@doodates.com
- 💬 **Discord** : [Rejoindre la communauté](https://discord.gg/doodates)
- 📚 **Documentation** : [Retour à l'accueil](/docs)

---

**Dernière mise à jour :** 10 novembre 2025
