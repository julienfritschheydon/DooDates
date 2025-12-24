# 📤 Export et Partage

Guide complet pour exporter vos résultats et partager vos sondages efficacement.

---

## 📋 Table des Matières

1. [Formats d'Export](#formats-dexport)
2. [Export CSV](#export-csv)
3. [Export PDF](#export-pdf)
4. [Export JSON](#export-json)
5. [Export Markdown](#export-markdown)
6. [Partage de Sondages](#partage-de-sondages)
7. [Liens et QR Codes](#liens-et-qr-codes)

---

## 📊 Formats d'Export

DooDates propose **4 formats d'export** gratuits et illimités :

| Format | Usage Principal | Taille | Compatibilité |
|--------|----------------|--------|---------------|
| **CSV** | Analyse de données, Excel | Légère | ⭐⭐⭐⭐⭐ |
| **PDF** | Rapports imprimables, présentations | Moyenne | ⭐⭐⭐⭐⭐ |
| **JSON** | Intégrations techniques, API | Très légère | ⭐⭐⭐ |
| **Markdown** | Documentation, GitHub, Notion | Très légère | ⭐⭐⭐⭐ |

**Tous les formats sont :**
- ✅ **Gratuits** (pas de paywall)
- ✅ **Illimités** (aucune restriction de nombre)
- ✅ **Complets** (toutes les données incluses)

---

## 📊 Export CSV

### À Quoi Sert le CSV ?

**CSV (Comma-Separated Values)** = Format de tableur universel

**Utilisations courantes :**
- 📊 Analyse Excel / Google Sheets
- 📈 Graphiques personnalisés
- 🔢 Calculs statistiques avancés
- 💾 Import dans logiciels métier (CRM, ERP)

---

### Contenu du CSV

**Sondages de dates :**
```csv
Nom,Email,Date,Horaire,Disponibilité,Timestamp
Alice Martin,alice@email.com,2025-11-12,14h-16h,Disponible,2025-11-01 09:23:15
Bob Chen,bob@email.com,2025-11-12,14h-16h,Peut-être,2025-11-01 10:45:32
Claire Dubois,claire@email.com,2025-11-12,14h-16h,Disponible,2025-11-01 11:12:08
```

**Formulaires :**
```csv
ID,Timestamp,Q1_Satisfaction,Q2_NPS,Q3_Commentaire
1,2025-11-01 09:23:15,5,9,"Excellent service !"
2,2025-11-01 10:45:32,4,8,"Très bien dans l'ensemble"
3,2025-11-01 11:12:08,3,6,"Améliorations nécessaires"
```

---

### Exporter en CSV

**Étapes :**
```
1. Ouvrez les résultats de votre sondage
2. Cliquez sur "Exporter" (bouton en haut à droite)
3. Sélectionnez "CSV"
4. Téléchargement automatique : resultats_[nom-sondage].csv
```

**Options avancées :**
- ✅ **Séparateur** : Virgule (,) ou Point-virgule (;)
- ✅ **Encodage** : UTF-8 (recommandé) ou ISO-8859-1
- ✅ **En-têtes** : Noms lisibles ou IDs techniques

---

### Ouvrir le CSV dans Excel

**Méthode recommandée :**
```
1. Excel → Données → Obtenir des données externes → À partir d'un fichier texte
2. Sélectionnez votre fichier .csv
3. Choisissez "Délimité" → Virgule
4. Encodage UTF-8
5. Cliquez sur "Terminer"
```

**⚠️ NE PAS double-cliquer directement sur le .csv** (problèmes d'encodage)

---

### Analyse dans Google Sheets

**Importation :**
```
1. Google Sheets → Fichier → Importer
2. Glissez-déposez votre .csv
3. Type de séparateur : Virgule
4. Convertir texte en nombres : Oui
5. Importer
```

**Graphiques automatiques :**
```
1. Sélectionnez vos données
2. Insertion → Graphique
3. Google Sheets suggère automatiquement le type optimal
```

---

## 📄 Export PDF

### À Quoi Sert le PDF ?

**PDF (Portable Document Format)** = Format universel pour partage et impression

**Utilisations courantes :**
- 📑 Rapports de réunion
- 📊 Présentations client
- 📧 Envoi par email
- 🖨️ Impression physique

---

### Contenu du PDF

**Le PDF inclut :**
- 📊 **Tous les graphiques** (camemberts, barres, NPS)
- 📈 **Statistiques détaillées** (moyennes, médianes, distributions)
- 💡 **Insights IA** (si activés)
- 📋 **Liste des réponses** (anonymisées si configuré)
- 🎨 **Branding DooDates** (ou votre logo si Premium)

**Exemple de structure :**
```
Page 1 : Couverture
  - Titre du sondage
  - Période de collecte
  - Nombre de réponses

Page 2-3 : Vue d'ensemble
  - Statistiques globales
  - Graphiques principaux

Page 4-N : Détails par question
  - Question 1 : Graphique + stats
  - Question 2 : Graphique + stats
  - ...

Page N+1 : Insights IA
  - 3-5 insights clés

Page N+2 : Annexes
  - Réponses texte libres
  - Métadonnées
```

---

### Exporter en PDF

**Étapes :**
```
1. Résultats → Bouton "Exporter"
2. Sélectionnez "PDF"
3. Configurez les options (voir ci-dessous)
4. Cliquez sur "Générer PDF"
5. Téléchargement : rapport_[nom-sondage]_[date].pdf
```

**Options PDF :**
- ✅ **Inclure les insights IA** (Oui/Non)
- ✅ **Anonymiser les noms** (Oui/Non)
- ✅ **Graphiques en couleur** (Oui) ou N&B (Non)
- ✅ **Format** : A4 (défaut), Letter, A3
- ✅ **Orientation** : Portrait (défaut) ou Paysage

---

### Personnalisation (Plan Premium)

**Branding personnalisé :**
- 🎨 Votre logo en en-tête
- 🎨 Couleurs de votre charte graphique
- 🎨 Suppression du logo DooDates
- 🎨 Pied de page personnalisé

---

## 🔧 Export JSON

### À Quoi Sert le JSON ?

**JSON (JavaScript Object Notation)** = Format technique pour développeurs

**Utilisations courantes :**
- 💻 Intégrations API
- 🔗 Webhooks vers autres apps
- 📦 Backup technique
- 🤖 Traitement automatisé

---

### Structure du JSON

**Exemple de sondage :**
```json
{
  "poll": {
    "id": "abc123",
    "title": "Réunion Sprint Planning",
    "type": "date",
    "created_at": "2025-11-01T09:00:00Z",
    "closed": false
  },
  "responses": [
    {
      "id": "resp_001",
      "voter": "Alice Martin",
      "email": "alice@email.com",
      "timestamp": "2025-11-01T09:23:15Z",
      "votes": [
        {
          "date": "2025-11-12",
          "time": "14h-16h",
          "availability": "available"
        }
      ]
    }
  ],
  "stats": {
    "total_voters": 8,
    "completion_rate": 0.89,
    "most_popular_slot": "2025-11-12 14h-16h"
  }
}
```

---

### Exporter en JSON

**Étapes :**
```
1. Résultats → Exporter → JSON
2. Options :
   - Pretty (lisible) ou Compact (optimisé)
   - Inclure métadonnées (Oui/Non)
3. Télécharger
```

**Usage technique (webhook) :**
```javascript
// DooDates peut envoyer automatiquement en JSON vers une URL
POST https://votre-app.com/webhooks/doodates
Content-Type: application/json

{
  "event": "poll_closed",
  "poll_id": "abc123",
  "data": { ... }
}
```

---

## 📝 Export Markdown

### À Quoi Sert le Markdown ?

**Markdown** = Format texte léger pour documentation

**Utilisations courantes :**
- 📖 Documentation GitHub
- 📓 Notes Notion, Obsidian
- 💬 Messages Slack/Discord
- ✍️ Articles de blog

---

### Contenu Markdown

**Exemple :**
````markdown
# 📊 Résultats : Réunion Sprint Planning

**Période :** 1-5 novembre 2025  
**Réponses :** 8/8 (100%)

## 🏆 Meilleure Option

**Mercredi 13 nov, 14h-16h**
- ✅ 8 disponibles (100%)

## 📈 Toutes les Options

| Date | Horaire | Disponibles | % |
|------|---------|-------------|---|
| Lundi 11 nov | 14h-16h | 7/8 | 87% |
| Mercredi 13 nov | 14h-16h | 8/8 | 100% ✅ |
| Jeudi 14 nov | 9h-11h | 6/8 | 75% |

## 👥 Participants

- ✅ Alice Martin
- ✅ Bob Chen
- ✅ Claire Dubois
- ... (5 autres)
````

---

### Exporter en Markdown

**Étapes :**
```
1. Résultats → Exporter → Markdown
2. Copier dans le presse-papier
   ou
   Télécharger : resultats.md
```

**Utilisations pratiques :**
- Coller dans un README GitHub
- Importer dans Notion
- Partager sur Slack (rendu formaté automatique)

---

## 🔗 Partage de Sondages

### Types de Liens

DooDates génère **3 types de liens** :

#### 1. Lien de Vote 🗳️
```
https://doodates.com/vote/abc123
```
**Usage :** Pour que les gens votent/répondent

**Paramètres optionnels :**
```
?name=Alice          # Pré-rempli le nom
?email=alice@...     # Pré-rempli l'email
?lang=en             # Langue (fr, en, es, de)
```

---

#### 2. Lien de Résultats 📊
```
https://doodates.com/results/abc123
```
**Usage :** Voir uniquement les résultats (lecture seule)

**Visibilité :** Selon paramètres (public / participants / créateur)

---

#### 3. Lien d'Édition ✏️
```
https://doodates.com/edit/abc123?token=xyz789
```
**Usage :** Modifier le sondage (privé, token requis)

**⚠️ Ne partagez jamais ce lien publiquement !**

---

### Partager par Email

**Template recommandé :**

**Objet :** [Sondage] Votre avis sur [Sujet]

**Corps :**
```
Bonjour [Prénom],

J'aimerais avoir votre avis sur [contexte].

🗳️ Répondez en 3 minutes : https://doodates.com/vote/abc123

Vos réponses sont confidentielles et anonymes.

Merci d'avance !
[Votre nom]

P.S. Le sondage ferme le [date]
```

**Astuce :** Personnalisez avec le nom du destinataire (+30% de taux de réponse)

---

### Partager sur WhatsApp

**Message court :**
```
👋 Salut !

J'ai besoin de ton avis sur [sujet].
2 minutes max : https://doodates.com/vote/abc123

Merci ! 🙏
```

**⚡ Partage direct :**
```
https://wa.me/?text=Votez ici : https://doodates.com/vote/abc123
```

---

### Partager sur Réseaux Sociaux

**Twitter/X :**
```
🗳️ Votre avis compte !

[Question du sondage en 1 phrase]

Votez en 2 min : https://doodates.com/vote/abc123

#sondage #votez
```
**Limite :** 280 caractères

**LinkedIn :**
```
📊 Étude en cours

Je réalise une enquête sur [sujet] pour [objectif].

Votre expertise m'est précieuse ! Merci de prendre 5 minutes
pour répondre : https://doodates.com/vote/abc123

Les résultats seront partagés sous 2 semaines.

#enquête #feedback #[secteur]
```

---

## 🔲 QR Codes

### Générer un QR Code

**Étapes :**
```
1. Dashboard → Votre sondage
2. Bouton "Partager"
3. Cliquez sur "Générer QR Code"
4. QR Code généré instantanément
```

**Options :**
- ✅ **Taille** : Petit (200px), Moyen (500px), Grand (1000px)
- ✅ **Format** : PNG (défaut), SVG (vectoriel)
- ✅ **Couleur** : Noir/Blanc (défaut), Personnalisé
- ✅ **Logo** : Ajouter logo au centre (Premium)

---

### Usages des QR Codes

**1. Événements physiques 🎪**
```
Imprimez et affichez le QR Code :
• Stand d'accueil
• Tables de restaurant
• Écrans de projection
• Flyers distribués
```

**2. Magasins 🏪**
```
• En caisse (feedback post-achat)
• Sur les produits (satisfaction)
• Dans les cabines d'essayage
```

**3. Restaurants 🍽️**
```
• Sur les tables (enquête satisfaction)
• Sur le menu (préférences)
• À la caisse (NPS)
```

**4. Conférences 🎤**
```
• Slide de fin de présentation
• Badge des participants
• Signalétique événement
```

---

### Taille d'Impression Recommandée

| Distance de scan | Taille minimale |
|------------------|-----------------|
| 10 cm (table) | 3x3 cm |
| 50 cm (affiche) | 5x5 cm |
| 1 mètre (poster) | 10x10 cm |
| 2 mètres (écran) | 20x20 cm |

**Règle simple :** Taille (cm) = Distance (cm) / 10

---

### Télécharger le QR Code

**Formats disponibles :**
- **PNG** : Pour impression, réseaux sociaux
- **SVG** : Pour édition graphique, grande taille
- **PDF** : Pour impression professionnelle

**Astuce :** SVG = qualité infinie, idéal pour agrandir

---

## 🔐 Sécurité et Confidentialité

### Liens Privés vs Publics

**Lien public (par défaut) :**
- ✅ Partageable librement
- ✅ Pas d'authentification requise
- ⚠️ Accessible à quiconque a le lien

**Lien privé (option) :**
```
Paramètres → Accès → "Restreint"
→ Connexion Google obligatoire pour voter
```
**Avantage :** 1 vote par personne garanti

---

### Désactiver un Lien

**Si le lien a fuité :**
```
1. Dashboard → Sondage concerné
2. Menu ⋮ → "Réinitialiser le lien"
3. Nouveau lien généré, ancien lien invalide
4. Partagez le nouveau lien
```

**⚠️ Attention :** Les anciens votants devront revoter

---

### Expiration Automatique

**Configurer une deadline :**
```
Paramètres → Deadline → Activée
→ Date : 15/11/2025
→ Heure : 23:59

Le lien devient inactif automatiquement après cette date.
```

---

## 📊 Statistiques de Partage

### Tracking des Liens

**Métriques disponibles :**
- 👁️ **Vues** : Nombre de clics sur le lien
- ✅ **Conversions** : Nombre de votes effectifs
- 📈 **Taux de conversion** : Votes / Vues
- ⏱️ **Temps moyen** : Durée entre clic et vote

**Accès :**
```
Résultats → Onglet "Partage"
→ Graphique de performance
```

---

### Optimiser le Taux de Conversion

**Benchmark DooDates :**
- 📊 **Taux moyen** : 45% (45 votes pour 100 vues)
- ✅ **Bon taux** : > 60%
- ⚠️ **Faible taux** : < 30%

**Si taux faible, vérifiez :**
- ❓ Message d'invitation clair ?
- ❓ Durée annoncée ?
- ❓ Incentive proposé ?
- ❓ Sondage trop long ? (> 5 min)

---

## 🎯 Récapitulatif

**Vous savez maintenant :**
- ✅ Exporter en 4 formats (CSV, PDF, JSON, Markdown)
- ✅ Partager par email, WhatsApp, réseaux sociaux
- ✅ Générer et utiliser des QR Codes
- ✅ Sécuriser et tracker vos partages

---

**[← Résultats](./08-Gestion-Resultats.md) | [Accueil](./README.md) | [Dashboard →](./10-Tableau-Bord.md)**

---

**© 2025 DooDates - Export et Partage v1.0**

