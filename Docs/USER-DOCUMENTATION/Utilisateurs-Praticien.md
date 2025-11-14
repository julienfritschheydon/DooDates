# Utilisateurs (Praticien) - Documentation

*Documentation pour les professionnels utilisant DooDates*  
*Date : Décembre 2025*

---

## 🎯 Vue d'ensemble

Cette documentation s'adresse aux **professionnels libéraux** (thérapeutes, consultants, coachs, etc.) qui utilisent DooDates pour gérer leurs rendez-vous avec leurs clients.

---

## 📋 Fonctionnalités principales

### 1. Création de sondages

#### Sondages de dates classiques
- Créer un sondage avec plusieurs dates/heures proposées
- Les clients votent pour leurs créneaux préférés
- Vous sélectionnez le créneau final

#### Sondages de disponibilités (Agenda Intelligent)
- Créer un sondage "inversé" où les clients indiquent leurs disponibilités
- Le système propose automatiquement les créneaux optimaux depuis votre calendrier
- Les clients valident directement → événement créé automatiquement

### 2. Intégration calendrier

#### Connexion Google Calendar
- Connecter votre compte Google Calendar
- Le système lit automatiquement vos créneaux occupés/libres
- Création automatique des événements après validation client

#### Configuration
- Activer l'intégration dans les paramètres
- Autoriser l'accès à votre calendrier
- Les événements sont créés dans votre calendrier principal

### 3. Règles d'optimisation intelligentes

#### Configuration des règles
- **Durée standard** : Durée par défaut d'un créneau (ex: 60 min)
- **Temps entre séances** : Minimiser les gaps dans votre agenda
- **Prioriser créneaux proches** : Planifier rapidement les rendez-vous
- **Groupement demi-journées** : Créer des blocs de temps complets
- **Heures préférées** : Définir vos horaires préférés par jour

#### Optimisation automatique
- Le système analyse votre calendrier
- Propose les créneaux qui minimisent les gaps
- Priorise les créneaux proches dans le temps
- Groupe les créneaux en demi-journées si activé

---

## 🔧 Guide d'utilisation

### Créer un sondage disponibilités

1. **Accéder à la création** : Cliquer sur "Créer un sondage" → "Sondage Disponibilités"
2. **Configurer le sondage** :
   - Titre et description
   - Règles d'optimisation (optionnel)
3. **Partager le lien** : Envoyer le lien généré à votre client
4. **Suivre les résultats** : Le client indique ses disponibilités → Le système propose des créneaux optimaux
5. **Validation automatique** : Le client valide → Événement créé dans votre calendrier

### Gérer les règles d'optimisation

1. **Ouvrir les règles** : Dans le formulaire de création, cliquer sur "Règles Intelligentes d'Optimisation"
2. **Configurer** :
   - Durée standard des créneaux
   - Temps minimum/maximum entre séances
   - Activer/désactiver les optimisations (créneaux proches, demi-journées)
   - Définir les heures préférées par jour
3. **Sauvegarder** : Les règles sont appliquées automatiquement lors de l'optimisation

---

## 💡 Conseils d'utilisation

### Optimiser votre agenda fragmenté

**Problème** : Votre agenda est fragmenté avec de nombreux petits créneaux libres.

**Solution** :
- Activer "Groupement demi-journées" dans les règles
- Activer "Minimiser les gaps" (temps minimum entre séances)
- Le système proposera des créneaux qui remplissent les gaps existants

### Planifier rapidement

**Problème** : Vous voulez planifier les rendez-vous rapidement.

**Solution** :
- Activer "Prioriser les créneaux proches" dans les règles
- Le système proposera d'abord les créneaux dans les 7 prochains jours

### Respecter vos horaires de travail

**Problème** : Vous ne travaillez que certains jours/heures.

**Solution** :
- Configurer "Heures préférées par jour" dans les règles
- Le système ne proposera que les créneaux dans ces plages horaires

---

## ⚠️ Limitations connues

### Calendrier
- **Phase 1** : Support Google Calendar uniquement
- **Phase 2** : Outlook et iCloud si demandés

### Clients anonymes
- Les clients n'ont pas besoin de compte pour voter/valider
- Pas de suivi individuel des préférences clients

### Gestion conflits
- Réservation temporaire de 15 minutes lors de la sélection
- Vérification avant validation finale

---

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation complète : `Docs/FEEDBACK-AGENDA-INTELLIGENT.md`
- Vérifier les tests E2E : `tests/e2e/availability-poll-workflow.spec.ts`

---

*Document créé : Décembre 2025*

