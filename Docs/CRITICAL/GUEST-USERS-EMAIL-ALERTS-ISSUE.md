# 🚨 Problème Critique : Utilisateurs Invités et Alertes Email

## 📋 Description

**Problème identifié le 10/12/2025** : Les utilisateurs invités (non connectés) ne reçoivent pas d'alertes email avant la suppression automatique de leurs données.

## ⚠️ Impact

- **Risque élevé** : Perte de données sans préavis pour les invités
- **UX négatif** : Les invités peuvent perdre leur travail sans avertissement
- **Conformité RGPD** : Manque de transparence pour les utilisateurs non identifiés

## 🎯 Solutions Proposées

### Solution 1 : Email Optionnel (Recommandée)

**Implémentation :**

- Ajouter un champ email optionnel lors de la création (mode invité)
- Stocker l'email dans localStorage + base de données
- Envoyer les alertes à cet email
- Permettre la conversion invité → compte

**Avantages :**

- ✅ Garde l'expérience frictionless (email optionnel)
- ✅ Protège les données des invités
- ✅ Facilite la conversion vers compte
- ✅ Compatible avec système existant

**Inconvénients :**

- ⚠️ Nécessite modification UI/UX
- ⚠️ Gestion des emails invalides

### Solution 2 : Rétention Longue (1 an pour tous)

**Implémentation :**

- Uniformiser la rétention à 365 jours pour tous les utilisateurs (invités et connectés)
- Garder les alertes in-app et email pour garantir la transparence
- Warning "Connectez-vous pour sauvegarder vos données" pour la pérennité au-delà d'un an

**Avantages :**

- ✅ Simple à implémenter
- ✅ Pas de modification UI majeure
- ✅ Incite à la connexion

**Inconvénients :**

- ⚠️ Ne résout pas le fond (pas d'alerte email)
- ⚠️ Stockage plus long des données

### Solution 3 : Alertes In-App Renforcées

**Implémentation :**

- Bannières visibles dans l'app
- Notifications push (si possible)
- Compteurs de temps restants
- Messages contextuels

**Avantages :**

- ✅ Visible immédiatement
- ✅ Pas besoin d'email

**Inconvénients :**

- ⚠️ Nécessite que l'utilisateur revienne sur l'app
- ⚠️ Facilement ignoré

## 🚀 Implémentation Recommandée

### Phase 1 : Email Optionnel (Priorité haute)

```typescript
// Dans FormPollCreator, DatePollCreator, etc.
const [guestEmail, setGuestEmail] = useState('')

// UI ajoutée
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email pour recevoir vos alertes (optionnel)
  </label>
  <input
    type="email"
    value={guestEmail}
    onChange={(e) => setGuestEmail(e.target.value)}
    placeholder="votre@email.com"
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
  />
  <p className="text-xs text-gray-500 mt-1">
    Recevez un rappel avant la suppression de vos données
  </p>
</div>
```

### Phase 2 : Logique Backend

```typescript
// Dans DataRetentionService
async function calculateUpcomingDeletions(userId: string, settings: RetentionSettings) {
  // Vérifier si utilisateur invité avec email
  const guestEmail = await getGuestEmail(userId);

  if (guestEmail) {
    // Envoyer alerte à l'email de l'invité
    warnings.push({
      ...warning,
      userEmail: guestEmail,
      userId,
    });
  } else {
    // Alertes in-app seulement
    console.log(`Utilisateur invité ${userId} sans email - alertes in-app uniquement`);
  }
}
```

### Phase 3 : Conversion Invité → Compte

```typescript
// Flow de conversion
const handleConvertToAccount = async () => {
  // Pré-remplir email avec celui de l'invité
  // Conserver les données existantes
  // Migrer vers compte authentifié
};
```

## 📊 Tests Requis

### Tests Fonctionnels

- [ ] Création sondage en mode invité avec email
- [ ] Réception alerte email 30 jours avant suppression
- [ ] Conversion invité → compte conserve les données
- [ ] Gestion emails invalides/doublons

### Tests UX

- [ ] Champ email optionnel visible mais non intrusif
- [ ] Messages clairs sur la protection des données
- [ ] Flow conversion fluide
- [ ] Accessibilité du formulaire

### Tests Edge Cases

- [ ] Email déjà utilisé par un compte
- [ ] Plusieurs créations avec même email
- [ ] Modification email après création
- [ ] Suppression email (retour alertes in-app)

## 🕐 Timeline

### Vendredi 12/12 (Jour 10)

- **Matin (2h)** : Implémentation email optionnel
- **Après-midi (1h)** : Tests et validation

### Lundi 15/12

- Déploiement en production
- Monitoring des alertes invités

## 📈 Monitoring

### Métriques à suivre

- **Taux de conversion** invité → compte
- **Pourcentage d'invités avec email**
- **Taux de succès des alertes email invités**
- **Réduction des suppressions non prévues**

### Dashboard

```sql
-- Vue pour monitoring invités
CREATE VIEW guest_users_monitoring AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_guests,
  COUNT(*) FILTER (WHERE guest_email IS NOT NULL) as guests_with_email,
  COUNT(*) FILTER (WHERE converted_to_account = true) as converted_guests
FROM user_activities
WHERE is_guest = true
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🔧 Modifications Requises

### Fichiers à modifier

1. `src/components/polls/FormPollCreator.tsx` - Ajout champ email invité
2. `src/components/date-polls/DatePollCreator.tsx` - Ajout champ email invité
3. `src/services/DataRetentionService.ts` - Logique alertes invités
4. `src/lib/storage.ts` - Stockage email invité
5. `sql-scripts/` - Tables pour emails invités

### Nouvelles tables SQL

```sql
-- Emails d'invités pour alertes
CREATE TABLE guest_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  converted_to_account_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(guest_id, email)
);

-- Index pour performances
CREATE INDEX idx_guest_emails_guest_id ON guest_emails(guest_id);
CREATE INDEX idx_guest_emails_email ON guest_emails(email);
```

## ✅ Validation Finale

Le problème sera considéré résolu quand :

1. ✅ Les invités peuvent fournir un email optionnel
2. ✅ Les alertes sont envoyées à cet email
3. ✅ Les invités sans email ont des alertes in-app visibles
4. ✅ La conversion vers compte est fluide
5. ✅ Les tests couvrent tous les cas d'usage

**Priorité : CRITIQUE - À résoudre avant production complète** 🚨
