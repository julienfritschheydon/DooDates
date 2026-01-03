# Stratégie Quotas Freemium - DooDates

## 📊 Quotas Actuels (Octobre 2025)

### Guest Users (Non authentifiés)

- **Messages IA** : 10 messages max (lifetime)
- **Polls par conversation** : 2 max
- **Cooldown** : 3 secondes entre messages
- **Reset** : Jamais (localStorage persistant)

### Authenticated Users

- **Messages IA** : 100 messages/mois
- **Polls par conversation** : 5 max
- **Cooldown** : 3 secondes entre messages
- **Reset** : Mensuel automatique

---

## 🎤 Impact Reconnaissance Vocale

### Problématique Identifiée

La reconnaissance vocale facilite grandement l'usage du chat :

- **Vitesse** : Parler est 3-4x plus rapide que taper
- **Friction réduite** : Pas besoin de clavier
- **Usage mobile** : Beaucoup plus pratique
- **Accessibilité** : Utilisateurs avec difficultés de frappe

**Conséquence** : Augmentation significative de la consommation de tokens Gemini

### Ajustements Appliqués

#### Avant Reconnaissance Vocale

```typescript
guest: {
  aiMessages: 20,
  pollsPerConversation: 3,
}
authenticated: {
  aiMessages: 200,
  pollsPerConversation: 10,
}
cooldown: 2000ms
```

#### Après Reconnaissance Vocale (Réduction -50%)

```typescript
guest: {
  aiMessages: 10,        // -50%
  pollsPerConversation: 2, // -33%
}
authenticated: {
  aiMessages: 100,       // -50%
  pollsPerConversation: 5, // -50%
}
cooldown: 3000ms         // +50%
```

---

## 📈 Rationale

### 1. Réduction Messages IA (-50%)

**Raison** : Compensation directe de l'usage facilité

- Parler = plus de messages envoyés
- Moins de réflexion avant envoi
- Tendance à "converser" plus naturellement

**Impact** : Maintien coûts Gemini API stables

### 2. Réduction Polls/Conversation (-33% à -50%)

**Raison** : Corrélation usage vocal ↔ création polls

- Plus de messages = plus de polls générés
- Utilisateurs plus engagés = plus de demandes

**Impact** : Évite abus système gratuit

### 3. Augmentation Cooldown (+50%)

**Raison** : Anti-spam renforcé

- Reconnaissance vocale = envois très rapides
- Besoin de ralentir le rythme
- Protection API Gemini

**Impact** : Expérience reste fluide mais contrôlée

---

## 🎯 Objectifs Stratégiques

### Court Terme (3 mois)

1. **Monitorer usage réel** avec reconnaissance vocale
2. **Ajuster quotas** selon données collectées
3. **Tester conversion** guest → authenticated

### Moyen Terme (6 mois)

1. **A/B Testing** sur quotas
2. **Segmentation utilisateurs** (casual vs power users)
3. **Offres premium** avec quotas illimités

### Long Terme (12 mois)

1. **Modèle économique validé**
2. **Quotas optimisés** pour rentabilité
3. **Features premium** différenciantes

---

## 📊 Métriques à Suivre

### Engagement

- Taux d'utilisation reconnaissance vocale
- Nombre moyen messages/session
- Durée moyenne sessions

### Conversion

- % guests atteignant limite
- % guests → authenticated après limite
- Temps moyen avant conversion

### Coûts

- Coût moyen/utilisateur (tokens Gemini)
- ROI reconnaissance vocale
- Coût acquisition vs LTV

---

## 🔄 Plan de Révision

### Mensuel

- Analyse métriques usage
- Vérification coûts API
- Ajustements mineurs si nécessaire

### Trimestriel

- Révision stratégie complète
- A/B tests quotas
- Décisions majeures

### Annuel

- Refonte modèle économique
- Nouvelles offres premium
- Stratégie long terme

---

## 🚨 Alertes & Seuils

### Coûts API Gemini

- **Alerte** : +30% vs mois précédent
- **Action** : Réduire quotas temporairement

### Taux Conversion

- **Alerte** : <5% guests → authenticated
- **Action** : Revoir incentives auth

### Satisfaction Utilisateurs

- **Alerte** : Plaintes quotas trop bas
- **Action** : Augmenter légèrement + communiquer valeur auth

---

## 📝 Notes Techniques

### Implémentation

- Fichier : `src/hooks/useAiMessageQuota.ts`
- Service : `src/services/AiQuotaService.ts`
- Storage : localStorage (guest) + Supabase (auth)

### Tests

- Tests unitaires : `useAiMessageQuota.test.ts`
- Tests E2E : À créer (limite messages, polls, cooldown)

### Documentation

- Guide utilisateur : À créer
- FAQ quotas : À créer
- Messaging in-app : Implémenté (toasts + modal auth)

---

**Dernière mise à jour** : 29 octobre 2025
**Prochaine révision** : Décembre 2025
