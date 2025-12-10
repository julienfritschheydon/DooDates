# Politique de Confidentialité - Fournisseur IA et Logs de Conversations

> **DooDates** – Version 1.0 – 10 Décembre 2025
> 
> Document complémentaire à la Politique de Confidentialité principale, spécifique au traitement des données par le fournisseur IA et à l'utilisation des logs de conversations.

---

## 1. Rôle du Fournisseur IA (Google Gemini)

### 1.1 Statut de Sous-traitant

**Google LLC** (fournisseur du service Gemini) agit en qualité de **sous-traitant** au sens du RGPD pour le compte de DooDates.

- **Contrat de sous-traitance** : Les conditions d'utilisation de Google Cloud/Gemini incluent les clauses contractuelles types (SCC) requises par le RGPD
- **Finalités strictes** : Le traitement par Google est limité à la fourniture du service de génération de texte pour assister les utilisateurs dans la création de sondages
- **Pas de finalité autonome** : Google n'utilise les données que pour exécuter les instructions de DooDates, sans finalité commerciale propre

### 1.2 Transferts Hors UE

Les données sont transférées vers les serveurs de Google situés **en dehors de l'Union Européenne** (principalement aux États-Unis).

**Mécanismes de protection :**
- **Clauses Contractuelles Types (CCT)** : Intégrées dans l'accord Google Cloud
- **Certification Privacy Shield** : Google maintient une conformité avec les standards EU-US (bien que le Privacy Shield ait été invalidé, Google maintient des équivalents)
- **Engagements contractuels** : Google s'engage à fournir un niveau de protection équivalent à celui exigé par le RGPD

**Pays concernés :**
- États-Unis (serveurs primaires)
- Autres pays où Google opère des centres de données (avec garanties équivalentes)

### 1.3 Durée de Conservation chez le Fournisseur

**Configuration de DooDates :**
- **Désactivation de l'entraînement** : Les données des conversations DooDates ne sont PAS utilisées pour entraîner les modèles Gemini
- **Logs minimisés** : Configuration appliquée pour minimiser la durée de conservation des logs côté Google
- **Durée maximale** : **30 jours** pour les logs de requêtes API (configuration Google Cloud)
- **Suppression automatique** : Les données sont automatiquement purgées après la période de rétention configurée

**Types de données conservés temporairement par Google :**
- Logs de requêtes API (timestamps, tokens d'authentification, métadonnées techniques)
- Contenu des prompts envoyés à Gemini (uniquement le temps du traitement)
- Réponses générées par Gemini (uniquement le temps du traitement)

---

## 2. Utilisation des Logs de Conversations

### 2.1 Finalités des Logs côté DooDates

Les logs de conversations sont conservés côté DooDates **uniquement pour les finalités suivantes** :

1. **Continuité de service** : Permettre aux utilisateurs de reprendre leurs conversations en cours
2. **Amélioration du produit** : Analyse agrégée et anonymisée pour améliorer les fonctionnalités IA
3. **Support technique** : Diagnostic des problèmes et assistance aux utilisateurs
4. **Sécurité** : Détection d'abus et de comportements malveillants

### 2.2 Anonymisation et Agrégation

**Principes appliqués :**
- **Anonymisation systématique** : Pour toute analyse d'amélioration, les données sont préalablement anonymisées
- **Agrégation uniquement** : Seules les statistiques agrégées sont utilisées (ex: types de requêtes les plus fréquentes)
- **Pas d'analyse individuelle** : Aucune analyse du contenu de conversations spécifiques n'est réalisée

**Processus d'anonymisation :**
```typescript
// Exemple de processus appliqué
const anonymizedLog = {
  timestamp: original.timestamp,
  messageType: original.type,  // ex: "creation_sondage", "modification_form"
  pollType: original.pollType, // ex: "date", "form", "quizz"
  questionCount: original.questions.length,
  // Suppression de : nom, email, contenu textuel brut
}
```

### 2.3 Opt-out pour l'Amélioration du Produit

**Mécanisme de consentement :**
- **Opt-in par défaut** : Les utilisateurs peuvent choisir d'activer l'amélioration du produit via leurs données
- **Opt-out simple** : Un bouton dans les paramètres permet de désactiver cette utilisation
- **Réversibilité** : L'utilisateur peut changer son choix à tout moment
- **Effet rétroactif** : En cas d'opt-out, les données futures ne sont plus utilisées, mais les données passées peuvent rester dans les logs techniques nécessaires au fonctionnement

**Interface utilisateur :**
```
[ ] Autoriser l'utilisation de mes conversations pour améliorer DooDates
    (données anonymisées et agrégées uniquement)
```

**Conséquences de l'opt-out :**
- ✅ Fonctionnalités IA complètement conservées
- ✅ Support technique toujours disponible
- ❌ Les données ne contribuent plus aux améliorations du produit
- ✅ Aucun impact sur l'utilisation courante de DooDates

---

## 3. Droits des Utilisateurs

### 3.1 Accès aux Données IA

Les utilisateurs peuvent demander :
- **La liste de leurs conversations** avec l'IA
- **L'export de leurs données** de conversation (format JSON lisible)
- **La suppression de leurs conversations** de nos systèmes

### 3.2 Suppression et Effacement

**Suppression côté DooDates :**
- Immédiate sur demande via l'interface utilisateur
- Complete dans un délai de 30 jours pour les logs techniques
- Trace de suppression conservée 12 mois (uniquement la date, pas le contenu)

**Suppression côté Google :**
- Les données sont automatiquement supprimées après 30 jours maximum
- En cas de demande explicite, nous pouvons forcer la suppression via l'API Google
- Aucune garantie de suppression immédiate côté Google (dépend de leurs processus)

### 3.3 Portabilité

Les utilisateurs peuvent exporter :
- Leurs conversations au format JSON
- Les sondages créés via l'IA
- L'historique de leurs interactions avec les fonctionnalités IA

---

## 4. Mesures de Sécurité

### 4.1 Chiffrement

**En transit** : TLS 1.3 pour toutes les communications avec les API Google
**Au repos** : Chiffrement AES-256 côté DooDates, Google gère son propre chiffrement

### 4.2 Contrôle d'accès

- **Authentification forte** : Accès aux logs limité aux administrateurs système
- **Journalisation des accès** : Tous les accès aux logs sont tracés
- **Principe de moindre privilège** : Seul le personnel nécessaire peut accéder aux données

### 4.3 Audit et Conformité

- **Audit régulier** : Vérification trimestrielle des configurations de protection des données
- **Tests d'intrusion** : Sécurité des intégrations avec les API Google testée annuellement
- **Documentation** : Tous les traitements sont documentés et disponibles pour les autorités de contrôle

---

## 5. Contact et Exercice des Droits

### 5.1 Coordonnées du DPO

Pour toute question relative au traitement des données par l'IA :

**Email** : `privacy@doodates.com`  
**Délai de réponse** : 30 jours maximum

### 5.2 Procédures de réclamation

En cas de réclamation concernant le traitement par le fournisseur IA :

1. **Contactez-nous d'abord** : Nous traiterons votre demande et coordonnerons avec Google si nécessaire
2. **Autorité de contrôle** : Vous pouvez contacter la CNIL (France) ou l'autorité de protection des données de votre pays
3. **Voies de recours** : Droit de saisir les tribunaux compétents

---

## 6. Évolutions de cette Politique

Cette politique peut être mise à jour pour :
- Tenir compte des évolutions techniques des services IA
- Intégrer de nouvelles mesures de protection
- Répondre aux exigences réglementaires

Toute modification sera notifiée aux utilisateurs 30 jours avant son entrée en vigueur.

---

## 7. Résumé pour les Utilisateurs

> **En bref** : Vos conversations avec l'IA DooDates sont traitées par Google comme sous-traitant, avec des protections RGPD complètes. Les données sont conservées maximum 30 jours chez Google et 12 mois chez DooDates. Vous pouvez choisir que vos données ne servent pas à améliorer le produit, et vous disposez de droits d'accès, de modification et de suppression sur vos conversations.
