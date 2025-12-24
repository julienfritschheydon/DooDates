# 🔧 Résolution de Problèmes

Guide de dépannage pour résoudre rapidement les problèmes courants.

---

## 📋 Table des Matières

1. [Problèmes de Connexion](#problèmes-de-connexion)
2. [Problèmes de Création](#problèmes-de-création)
3. [Problèmes de Vote](#problèmes-de-vote)
4. [Problèmes d'Export](#problèmes-dexport)
5. [Problèmes Analytics IA](#problèmes-analytics-ia)
6. [Problèmes de Performance](#problèmes-de-performance)
7. [Contact Support](#contact-support)

---

## 🔐 Problèmes de Connexion

### ❌ "Impossible de se connecter avec Google"

**Causes possibles :**

1. **Bloqueur de pop-ups activé**
   ```
   Solution :
   1. Autorisez les pop-ups pour doodates.com
   2. Réessayez la connexion
   ```

2. **Cookies tiers désactivés**
   ```
   Solution (Chrome) :
   1. Paramètres → Confidentialité → Cookies
   2. Autorisez "accounts.google.com"
   3. Rafraîchissez la page
   ```

3. **Extensions bloquantes (AdBlock, Privacy Badger)**
   ```
   Solution :
   1. Désactivez temporairement les extensions
   2. Reconnectez-vous
   3. Réactivez les extensions après connexion
   ```

---

### ❌ "Session expirée"

**Solution :**
```
1. Cliquez sur "Se reconnecter"
2. Reconnectez-vous avec Google
3. Vos données sont préservées
```

**Prévention :**
```
Paramètres → "Rester connecté" → Activé
```

---

### ❌ "Compte déjà existant avec cet email"

**Cause :** Email utilisé avec un autre mode de connexion

**Solution :**
```
1. Essayez de vous connecter avec Google
   (même email que votre compte existant)
2. Les comptes seront fusionnés automatiquement
```

---

## 📝 Problèmes de Création

### ❌ Assistant IA ne répond pas

**Symptômes :** Message envoyé, pas de réponse après 10 secondes

**Solutions :**

1. **Vérifier la connexion internet**
   ```
   → Ouvrez un autre site pour tester
   → Réessayez si connexion rétablie
   ```

2. **Quota IA épuisé**
   ```
   Vérifiez en haut à droite : "Conversations IA : 50/50"
   
   Solutions :
   • Attendez le 1er du mois (reset)
   • Passez en Pro (conversations illimitées)
   • Créez manuellement (Dashboard → Nouveau)
   ```

3. **Requête trop vague**
   ```
   ❌ "Crée un sondage"
   ✅ "Crée un sondage de dates pour une réunion mardi ou jeudi"
   ```

---

### ❌ "Erreur lors de la création du sondage"

**Message d'erreur technique affiché**

**Solutions :**

1. **Vérifier le navigateur**
   ```
   Navigateurs supportés :
   ✅ Chrome 90+
   ✅ Firefox 88+
   ✅ Safari 14+
   ✅ Edge 90+
   
   → Mettez à jour si version ancienne
   ```

2. **Vider le cache**
   ```
   Chrome :
   1. Ctrl+Shift+Delete
   2. Cochez "Images et fichiers en cache"
   3. Période : "Dernières 24 heures"
   4. Effacer
   5. Rafraîchissez DooDates
   ```

3. **Mode navigation privée**
   ```
   Testez en navigation privée :
   Chrome : Ctrl+Shift+N
   Firefox : Ctrl+Shift+P
   
   Si ça fonctionne → Problème d'extension
   ```

---

### ❌ Impossible d'ajouter plus de 100 questions

**Limitation technique : 100 questions max par formulaire**

**Solutions :**
```
1. Diviser en 2 formulaires séparés
   Formulaire A : Questions 1-50
   Formulaire B : Questions 51-100

2. Utiliser la logique conditionnelle
   → Réduit les questions affichées par répondant

3. Regrouper avec des questions Matrix
   → 1 question matrix = plusieurs items
```

---

## 🗳️ Problèmes de Vote

### ❌ "Vous avez déjà voté"

**Cause :** Cookie de vote déjà présent

**Solutions :**

1. **Vote légitime à modifier**
   ```
   → Cliquez sur "Modifier mon vote"
   → Changez vos réponses
   → Enregistrez
   ```

2. **Voter depuis un autre appareil**
   ```
   → Normal : 1 vote par appareil en mode invité
   → Solution : Utilisez un autre appareil/navigateur
   ```

3. **Erreur de cookie**
   ```
   1. Supprimez les cookies de doodates.com
   2. Rafraîchissez la page
   3. Revotez
   ```

---

### ❌ Questions conditionnelles ne s'affichent pas

**Cause :** Logique conditionnelle mal configurée ou réponse inattendue

**Vérifications :**

1. **Réponse attendue**
   ```
   Exemple :
   Q1 : "Êtes-vous satisfait ?" → Réponse : "Non"
   Q2 (si Q1 = "Non") : "Pourquoi ?" → Devrait s'afficher
   
   Si Q2 ne s'affiche pas :
   → Vérifiez que la condition est bien "Q1 = Non"
   → Pas "Q1 ≠ Oui" (différent si option "Neutre" existe)
   ```

2. **Tester en mode aperçu**
   ```
   Créateur : Dashboard → Sondage → "Aperçu"
   → Testez toutes les branches conditionnelles
   ```

---

### ❌ Lien de vote invalide

**Message : "Sondage introuvable"**

**Causes possibles :**

1. **Sondage supprimé**
   ```
   → Le créateur a supprimé le sondage
   → Contactez-le pour vérification
   ```

2. **Sondage clôturé avec deadline**
   ```
   → Date de clôture dépassée
   → Demandez au créateur de le rouvrir
   ```

3. **Lien réinitialisé**
   ```
   → Le créateur a généré un nouveau lien
   → Demandez le nouveau lien
   ```

---

## 📤 Problèmes d'Export

### ❌ Export CSV illisible dans Excel

**Problème :** Caractères bizarres (é → Ã©)

**Cause :** Problème d'encodage UTF-8

**Solution :**
```
1. N'ouvrez PAS le CSV en double-cliquant
2. Excel → Données → Obtenir des données externes
3. Sélectionnez le fichier CSV
4. Choisissez "Délimité" → Virgule
5. IMPORTANT : Encodage UTF-8
6. Terminer
```

**Alternative :** Utilisez Google Sheets (gère mieux UTF-8)

---

### ❌ Export PDF bloqué / ne se télécharge pas

**Solutions :**

1. **Autoriser les téléchargements**
   ```
   Chrome :
   1. Paramètres → Confidentialité → Paramètres des sites
   2. Téléchargements automatiques
   3. Autorisez doodates.com
   ```

2. **PDF trop volumineux**
   ```
   Si > 1000 réponses → PDF peut être lourd (> 20 MB)
   
   Solution :
   • Exportez en CSV pour Excel
   • Ou filtrez les réponses (ex: 100 dernières)
   ```

3. **Essayer un autre navigateur**
   ```
   Firefox gère mieux les gros PDF que Chrome
   ```

---

### ❌ Export JSON mal formaté

**Problème :** Erreur de parsing JSON

**Cause :** Caractères spéciaux non échappés

**Solution :**
```
1. Dashboard → Sondage
2. Export → JSON
3. Cochez "Échapper les caractères spéciaux"
4. Réessayez
```

**Validation JSON :**
```
Collez votre JSON dans : https://jsonlint.com/
→ Vérifie la validité et signale les erreurs
```

---

## 🤖 Problèmes Analytics IA

### ❌ "Quota IA épuisé"

**Message : "Vous avez atteint votre limite mensuelle"**

**Solutions :**

1. **Attendez le reset**
   ```
   Reset automatique le 1er de chaque mois (00:00 UTC)
   Exemple : 50 conversations épuisées le 20 nov
   → Nouvelles 50 conversations le 1er déc
   ```

2. **Passez en Pro**
   ```
   Compte → Abonnement → Voir les offres
   ```
   
   Consultez la **[page Tarifs](/pricing)** pour choisir l'offre adaptée.

3. **Optimisez votre usage**
   ```
   • Désactivez les insights automatiques
     (Paramètres → Analytics IA → Insights auto : OFF)
   • Consultez d'abord les graphiques standards
   • Posez des questions groupées
   ```

---

### ❌ Insights IA peu pertinents

**Problème :** L'IA génère des insights génériques ou faux

**Causes :**

1. **Trop peu de réponses**
   ```
   < 10 réponses → Insights peu fiables
   
   Solution : Attendez 30+ réponses
   ```

2. **Questions mal formulées**
   ```
   Exemple : Question ambiguë
   "Êtes-vous satisfait du produit et du prix ?"
   → L'IA ne peut pas segmenter les 2 aspects
   
   Solution : 1 question = 1 idée
   ```

3. **Données incohérentes**
   ```
   Exemple : Âge = "Bleu" (erreur de saisie)
   → Fausse l'analyse IA
   
   Solution : Validez les réponses aberrantes
   ```

---

### ❌ Quick Query ne répond pas

**Symptômes :** Clic sur Quick Query, rien ne se passe

**Solutions :**

1. **Rafraîchir la page**
   ```
   F5 ou Ctrl+R
   → Recharge les données
   ```

2. **Vérifier le quota**
   ```
   Quota IA épuisé ? (voir section précédente)
   ```

3. **Connexion internet**
   ```
   Analytics IA nécessite connexion stable
   → Vérifiez votre connexion
   ```

---

## ⚡ Problèmes de Performance

### ❌ Application lente / freeze

**Causes possibles :**

1. **Trop d'onglets ouverts**
   ```
   Solution : Fermez les onglets inutiles
   Chrome peut ralentir avec 20+ onglets
   ```

2. **Formulaire très long**
   ```
   > 50 questions → Peut ralentir sur mobile
   
   Solution :
   • Mode multi-étapes (plus fluide)
   • Divisez en plusieurs formulaires
   ```

3. **Cache saturé**
   ```
   Solution : Vider le cache (voir section Création)
   ```

---

### ❌ Graphiques ne s'affichent pas

**Solutions :**

1. **Désactiver extensions**
   ```
   Certaines extensions bloquent les graphiques :
   • AdBlock
   • NoScript
   • Privacy Badger
   
   → Désactivez temporairement
   ```

2. **Vérifier JavaScript**
   ```
   1. Paramètres navigateur
   2. Confidentialité
   3. Vérifiez que JavaScript est autorisé
   ```

3. **Essayer un autre navigateur**
   ```
   Chrome recommandé pour meilleure compatibilité
   ```

---

## 📱 Problèmes Mobile

### ❌ Interface mal affichée sur smartphone

**Solutions :**

1. **Mode responsive**
   ```
   Zoom du navigateur = 100%
   (Pincer pour dézoomer si besoin)
   ```

2. **Orientation portrait**
   ```
   DooDates optimisé pour portrait sur mobile
   → Basculez en mode portrait
   ```

3. **Navigateur obsolète**
   ```
   iOS : Safari 14+
   Android : Chrome 90+
   
   → Mettez à jour votre OS/navigateur
   ```

---

### ❌ QR Code ne scanne pas

**Solutions :**

1. **Distance optimale**
   ```
   Maintenez votre téléphone à :
   • 10-30 cm du QR Code
   • Cadrez bien le QR Code entier
   • Stabilisez (pas de mouvements)
   ```

2. **Luminosité**
   ```
   • QR Code bien éclairé (pas d'ombre)
   • Pas de reflet sur le QR Code
   ```

3. **Application QR Code**
   ```
   iOS : Appareil photo natif (iOS 11+)
   Android : Google Lens ou app dédiée
   
   Si échec : Saisissez le lien manuellement
   ```

---

## 🆘 Contact Support

### Avant de contacter le support

**Checklist :**
- [ ] J'ai vérifié cette page de dépannage
- [ ] J'ai consulté la [FAQ](./14-FAQ.md)
- [ ] J'ai essayé dans un autre navigateur
- [ ] J'ai vidé mon cache

---

### Informations à fournir

**Pour un support efficace, incluez :**

```
1. Description du problème
   "Impossible d'exporter en PDF, erreur '504 Timeout'"

2. Étapes pour reproduire
   "1. Dashboard → Résultats
    2. Clic sur Exporter
    3. Sélection PDF
    4. Erreur après 30 secondes"

3. Environnement technique
   • Navigateur : Chrome 120.0.6099.109
   • OS : Windows 11
   • Type de compte : Gratuit
   • Sondage concerné : ID abc123

4. Capture d'écran (si pertinent)
   → Joindre une image de l'erreur

5. Message d'erreur exact (si affiché)
   "Error 504: Gateway Timeout"
```

---

### Canaux de Support

**1. Chat en ligne 💬**
```
• Disponible : Lun-Ven 9h-18h CET
• Réponse : < 5 minutes
• Accès : Icône 💬 en bas à droite
```

**2. Email 📧**
```
• support@doodates.com
• Réponse :
  - Gratuit : < 48h
  - Pro : < 8h
  - Premium : < 2h
```

**3. Signaler un bug 🐛**
```
• Icône 🐛 en bas de page
• Formulaire détaillé
• Suivez le traitement en temps réel
```

---

### Support Premium

**Plan Premium inclut :**
- ✅ **Support prioritaire** : < 2h
- ✅ **Chat dédié** : Disponible 24/7
- ✅ **Appel téléphonique** : Sur RDV
- ✅ **Gestionnaire de compte** : Dédié

---

## 🔍 Ressources Complémentaires

**Documentation complète :**
- [FAQ](./14-FAQ.md) - 50+ questions/réponses
- [Glossaire](./15-Glossaire.md) - Tous les termes techniques
- [Guide de démarrage](./01-Guide-Demarrage-Rapide.md) - Bases

**Communauté :**
- [Forum DooDates](https://forum.doodates.com) - Entraide communautaire
- [Discord](https://discord.gg/doodates) - Chat temps réel
- [Status Page](https://status.doodates.com) - État des services

---

**[← Raccourcis](./16-Raccourcis-Clavier.md) | [Accueil](./README.md)**

---

**© 2025 DooDates - Résolution de Problèmes v1.0**

