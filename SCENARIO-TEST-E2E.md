# 🧪 Scénario de Test End-to-End DooDates

## 📋 **Checklist Complète - Tests Fonctionnels**

### **Phase 1 : Création de Sondage**
- [ ] **Page d'accueil** : Interface charge correctement
- [ ] **Bouton +** : Ouvre le créateur de sondage
- [ ] **Sélection dates** : Calendrier fonctionne, sélection multiple
- [ ] **Navigation mois** : Flèches précédent/suivant
- [ ] **Mémoire dates** : Dates conservées entre changements de mois

### **Phase 2 : Configuration Avancée**
- [ ] **Bouton "Ajouter horaires"** : Active la sélection d'heures
- [ ] **Granularité** : Test 15min, 30min, 1h, 2h, 4h
- [ ] **Créneaux horaires** : Sélection/désélection fonctionne
- [ ] **Continuité visuelle** : Blocs adjacents sans gaps
- [ ] **Heures étendues** : Bouton + pour étendre 7h-22h

### **Phase 3 : Finalisation & Sauvegarde**
- [ ] **Titre obligatoire** : Impossible de continuer sans titre
- [ ] **Bouton "Partager sondage"** : Finalise la création
- [ ] **Redirection dashboard** : Retour automatique
- [ ] **Sondage visible** : Apparaît dans la liste
- [ ] **Compteurs initiaux** : 0 participant, 0 vote

### **Phase 4 : Édition de Sondage**
- [ ] **Bouton "Modifier"** : Ouvre l'éditeur
- [ ] **Données chargées** : Titre, dates, horaires présents
- [ ] **Modification titre** : Changement sauvegardé
- [ ] **Ajout/suppression dates** : Fonctionne
- [ ] **Modification horaires** : Granularité + créneaux
- [ ] **Sauvegarde** : Retour dashboard avec changements

### **Phase 5 : Interface de Vote**
- [ ] **Bouton "Voter"** : Navigation même onglet
- [ ] **Header correct** : Titre, 0 participant, expiration
- [ ] **Options affichées** : Toutes les dates du sondage
- [ ] **Horaires visibles** : Si configurés dans le sondage
- [ ] **Swipe/Clic votes** : Oui/Non/Peut-être fonctionnent
- [ ] **Compteurs temps réel** : Nombres se mettent à jour
- [ ] **Badge "1er"** : Apparaît sur l'option avec le meilleur score

### **Phase 6 : Soumission Vote**
- [ ] **Bouton "Envoyer votes"** : Apparaît après vote
- [ ] **Formulaire votant** : Nom obligatoire, email optionnel
- [ ] **Validation** : Impossible de soumettre sans nom
- [ ] **Soumission réussie** : Message de confirmation
- [ ] **Retour dashboard** : Navigation automatique

### **Phase 7 : Vérification Dashboard**
- [ ] **Compteur participants** : +1 participant
- [ ] **Compteur votes** : Nombre correct de votes
- [ ] **Cohérence chiffres** : Dashboard = Interface vote

### **Phase 8 : Résultats**
- [ ] **Bouton "Résultats"** : Navigation correcte
- [ ] **Statistiques globales** : Participants, dates, votes
- [ ] **Tableau détaillé** : Oui/Non/Peut-être par date
- [ ] **Votes par participant** : Section complète
- [ ] **Dates correctes** : Seulement celles du sondage
- [ ] **Bouton "Participer au vote"** : Retour interface vote

### **Phase 9 : Tests Multi-Votants**
- [ ] **2ème votant** : Nouveau vote avec nom différent
- [ ] **Compteurs mis à jour** : 2 participants
- [ ] **Badge "1er"** : Se déplace selon scores
- [ ] **3ème votant** : Confirme la logique
- [ ] **Résultats cohérents** : Toutes les données correctes

### **Phase 10 : Fonctionnalités Dashboard**
- [ ] **Bouton "Copier"** : Lien dans le presse-papier
- [ ] **Bouton "Lien"** : Partage fonctionne
- [ ] **Bouton "Supprimer"** : Confirmation + suppression
- [ ] **Recherche** : Filtrage par titre
- [ ] **Statuts** : Actif/Fermé selon dates

### **Phase 11 : Navigation & UX**
- [ ] **Boutons retour** : Fonctionnent partout
- [ ] **Menu TopNav** : Navigation fluide
- [ ] **Responsive mobile** : Interface adaptée

### **Phase 12 : Edge Cases**
- [ ] **Sondage sans horaires** : Vote simple dates
- [ ] **Sondage 1 seule date** : Interface correcte
- [ ] **Votes identiques** : Gestion égalités
- [ ] **Noms identiques** : Distinction possible
- [ ] **Suppression avec votes** : Gestion propre

## 🎯 **Données de Test Suggérées**

### **Sondage 1 : Simple**
- Titre : "Réunion équipe"
- Dates : 3 jours consécutifs
- Pas d'horaires

### **Sondage 2 : Complet**
- Titre : "Formation weekend"
- Dates : Samedi + Dimanche
- Horaires : 9h-17h, granularité 1h
- 3 votants minimum

### **Sondage 3 : Complexe**
- Titre : "Conférence tech"
- Dates : 5 dates non-consécutives
- Horaires : 8h-20h, granularité 30min
- Test édition + suppression

## ✅ **Validation Finale**
- [ ] **Aucune erreur console** : 0 erreur JavaScript
- [ ] **Performance** : Chargement < 2s
- [ ] **Données persistantes** : localStorage fonctionne
- [ ] **Cohérence générale** : UX fluide et logique
