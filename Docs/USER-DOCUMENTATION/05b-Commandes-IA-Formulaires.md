# Guide des Commandes IA pour les Formulaires

Ce guide liste les commandes que vous pouvez utiliser avec l'assistant IA pour modifier vos formulaires rapidement.

> **Note** : Vous pouvez utiliser ces commandes vocalement ou par écrit. L'IA est flexible et comprend les variations naturelles.

## Commandes Supportées

### 1. Ajouter une question

Ajoute une nouvelle question au formulaire.

- **Format** : "Ajoute une question sur [sujet]"
- **Exemples** :
  - "Ajoute une question sur la satisfaction client"
  - "Rajoute une question concernant le budget"

### 2. Supprimer une question

Supprime une question existante par son numéro.

- **Format** : "Supprime la question [numéro]"
- **Exemples** :
  - "Supprime la question 1"
  - "Retire la deuxième question"
  - "Enlève Q3"

### 3. Changer le type de question

Modifie le type d'une question (ex: texte, choix unique, choix multiple, matrice).

- **Format** : "Change la question [numéro] en [type]"
- **Types supportés** : `choix unique`, `choix multiple`, `texte`, `matrice`
- **Exemples** :
  - "Change la question 1 en choix multiple"
  - "Mets la question 2 en texte"

### 4. Ajouter une option

Ajoute une option de réponse à une question à choix (unique ou multiple).

- **Format** : "Ajoute l'option [texte] à la question [numéro]"
- **Exemples** :
  - "Ajoute l'option Très satisfait à la question 1"
  - "Ajoute l'option Peut-être à la question 2"

### 5. Supprimer une option

Retire une option de réponse spécifique.

- **Format** : "Supprime l'option [texte] de la question [numéro]"
- **Exemples** :
  - "Supprime l'option Rouge de la question 1"

### 6. Rendre obligatoire / optionnelle

Change le statut obligatoire d'une question.

- **Format** : "Rends la question [numéro] [obligatoire/optionnelle]"
- **Exemples** :
  - "Rends la question 1 obligatoire"
  - "Rends la question 2 optionnelle"

### 7. Renommer une question

Change le titre d'une question.

- **Format** : "Renomme la question [numéro] en [nouveau titre]"
- **Exemples** :
  - "Renomme la question 1 en Votre avis global"

## Fonctionnalités Non Supportées par l'IA (à faire manuellement)

Pour l'instant, ces actions doivent être effectuées via l'interface graphique :

- **Logique Conditionnelle** : "Si Q1 est Oui alors montre Q2" (Utilisez le bouton "Conditions" dans l'éditeur).
- **Configuration avancée des Matrices** : Ajouter des lignes/colonnes spécifiques à une matrice via le chat (Utilisez l'éditeur visuel).
- **Exports** : Demander un export PDF/CSV via le chat (Utilisez le bouton "Exporter" en haut à droite).
