# Interrogation orale pour Quizz – Concept & Gestion des crédits

## 1. Objectif produit

- **But**  
  Permettre à l’utilisateur de s’entraîner à l’oral sur un quizz existant (aide aux devoirs, révisions, préparation d’oraux).
- **Vision**  
  L’IA joue le rôle de prof :
  - Pose les questions à l’oral.
  - Écoute la réponse de l’élève.
  - Juge si c’est correct / partiel / faux.
  - Explique en langage simple pourquoi c’est bon ou ce qui manque.

---

## 2. Expérience utilisateur

### 2.1. Point d’entrée

- Depuis la fiche d’un quizz existant (`QuizzApp` / `QuizzList`) :
  - Bouton : **« Démarrer une interrogation orale »**
- Conditions d’accès :
  - **Réservé aux comptes payants** (voir section crédits).
  - Pour les comptes gratuits : affichage d’un teaser + CTA upgrade.

### 2.2. Déroulé d’une session

1. **Sélection du mode**
   - Ordre des questions : séquentiel ou aléatoire.
   - Mode d’évaluation :
     - *Strict* : réponse attendue assez précise, peu de tolérance.
     - *Pédagogique* : plus tolérant, insiste sur explication.

2. **Pour chaque question**
   - L’IA lit la question à voix haute (TTS).
   - L’écran affiche également l’énoncé (accessibilité).
   - L’utilisateur clique sur **« Répondre »** → activation micro (STT).
   - L’IA :
     - Transcrit la réponse.
     - Évalue la réponse (LLM) :
       - `status`: correct / partiel / faux
       - `explication`: courte explication pédagogique.
   - Affichage + voix de feedback :
     - « C’est correct, bravo : … »
     - « C’est presque ça, tu as oublié de mentionner … »
     - « Ce n’est pas correct, la bonne réponse est … parce que … »

3. **Fin de session**
   - Récap :
     - Score global (ex. 7/10).
     - Synthèse : points forts / points à revoir.
   - Option : **Relancer** uniquement les questions ratées.

---

## 3. Architecture fonctionnelle (MVP)

### 3.1. Entrées

- Quizz existant (structure déjà utilisée par `QuizzCreate`).
- Pour chaque question :
  - Texte de la question.
  - Type : QCM / réponse courte / ouverte.
  - Réponse attendue ou éléments de corrigé (texte libre, mots-clés).

### 3.2. Composants techniques

- **TTS (Text-to-Speech)** – lecture des questions
  - MVP : Web Speech API (`speechSynthesis`) côté navigateur.
  - Évolution possible : TTS externe meilleure qualité (coût par caractère).

- **STT (Speech-to-Text)** – écoute des réponses
  - MVP : Web Speech API (`SpeechRecognition`) si support navigateur ok.
  - Version “pro” : API externe (Whisper / Google / …) → consommation de crédits.

- **LLM (Gemini)** – évaluation pédagogique
  - Prompt avec :
    - Question.
    - Réponse attendue (ou corrigé).
    - Transcription de l’élève.
  - Sortie structurée : `status`, `score`, `explication`.

---

## 4. Gestion des crédits & monétisation

### 4.1. Principe général

- **Interrogation orale = feature premium**  
  - Disponible **uniquement pour les clients payants** (abonnement ou packs de crédits).
  - Les comptes gratuits voient la feature mais ne peuvent lancer qu’un **nombre très limité** de sessions de démo (ex. 1–2 sessions de 3 questions).

- **Unité de consommation**  
  - 1 *session d’interrogation orale* consomme des crédits en fonction :
    - Du nombre de questions.
    - De la durée d’écoute (STT).
    - Du nombre d’appels LLM (évaluation par question).

### 4.2. Modèle de crédit (proposition)

- **Par question orale** :
  - 1 question posée à l’oral = **X crédits de base**
  - 1 réponse de l’élève évaluée par LLM = **Y crédits**
- **Formule simplifiée pour l’utilisateur** :
  - Interne : on calcule au token / secondes d’audio.
  - Externe (UX) : on affiche quelque chose de lisible, par ex. :
    - « Ce quizz de 10 questions consommera environ **5 crédits** »
    - Barres de progression / solde visible avant lancement.

Exemple (indicatif, à ajuster après calculs réels coûts API) :

- 1 question orale = 0,2 crédit  
- 1 session de 10 questions = 2 crédits

#### 4.2.1. Exemple chiffré coût → prix → marge

Objectif : vérifier que le prix en crédits couvre largement les coûts API.

- Hypothèses coût :
  - Coût API Gemini + STT ≈ **0,002 €** par question (ordre de grandeur).
  - Session de 10 questions → **0,02 €** de coût technique brut.
- Hypothèse prix :
  - 1 crédit vendu ≈ **0,10 €** (ex. 10 € les 100 crédits).
  - Session de 10 questions = 2 crédits → **0,20 €** facturés.

Marge brute approximative :

- Recette : 0,20 €
- Coût : 0,02 €
- **Marge brute ≈ 0,18 €** (soit ~90 %) avant autres coûts (infra, support, paiement, etc.).

Conclusion :

- Tant que les hypothèses restent dans cet ordre de grandeur, le modèle « 2 crédits / 10 questions » laisse une marge confortable.
- Les valeurs exactes seront recalibrées après mesure réelle des coûts (tokens LLM, durée audio moyenne, latence, etc.).

### 4.3. Distinction gratuit vs payant

- **Comptes gratuits**
  - Accès lecture/écriture quizz normal (QCM texte).
  - Interrogation orale :
    - Limité à un **mini-mode démo** :
      - 1 quizz exemple prédéfini.
      - 3 questions max par session.
      - 1 session / jour max.
    - L’UI met en avant : « Fonction complète réservée aux comptes Pro ».

- **Comptes payants**
  - Interrogation orale disponible sur tous leurs quizz.
  - Consommation sur un **solde de crédits** :
    - Affiché dans le header / page quizz.
    - Message clair si solde insuffisant :
      - « Solde insuffisant pour lancer cette interrogation (besoin de 3 crédits, il vous reste 1). »

### 4.4. Contrôle des coûts techniques

- **Limites par session** :
  - Nb max de questions orales par session (ex. 20).
  - Timer max par question (ex. 60–90 secondes de réponse oralisée).
- **Optimisations** :
  - TTS en Web Speech API (0 coût côté serveur pour le MVP).
  - STT/LLM :
    - Calcul précis du coût moyen/heure d’utilisation.
    - Ajustement des crédits en fonction.

---

## 5. Roadmap MVP

1. **MVP technique interne** (sans paywall)
   - POC dans une page dédiée :
     - Lecture question (TTS navigateur).
     - Enregistrement / transcription via Web Speech API.
     - Envoi transcription + corrigé à Gemini pour évaluation.
   - Aucun comptage de crédits → juste valider UX & faisabilité.

2. **Intégration produit + paywall soft**
   - Bouton « Interrogation orale » sur un quizz réel.
   - Limite stricte sur comptes gratuits (ex. 1 session de 3 questions).
   - Tracking de consommation en base (même si pas encore facturé réellement).

3. **Monétisation / crédits**
   - Page de gestion / affichage du solde.
   - Définition finale des barèmes crédits.
   - Intégration au système de paiement (si déjà en place à ce moment-là).
