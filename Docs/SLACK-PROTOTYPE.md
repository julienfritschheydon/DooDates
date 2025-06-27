# DooDates Slack Integration - Prototype Simple

## 📋 Fonctionnalités Slack - Faisabilité

### ✅ Techniquement Possible
- **Bot Slack** : API officielle Slack bien documentée
- **Commandes slash** : `/doodate Réunion équipe mardi mercredi`
- **Intégration webhook** : Notifications dans channels
- **OAuth Slack** : Authentification utilisateurs

### 🛠️ Prototype Simple (1-2 jours)
```
/doodate [titre] [dates/créneaux]
→ Crée sondage DooDates
→ Poste lien dans channel
→ Notifications votes en temps réel
```

### 📈 Potentiel Business
- **Acquisition** : Viral dans équipes Slack
- **Rétention** : Workflow intégré quotidien
- **Monétisation** : Plans équipe/entreprise

## 🎯 Concept

**Commande Slack** : `/doodate [titre] [options temporelles]`
**Résultat** : Sondage DooDates créé et partagé dans le channel

## 🛠️ Faisabilité Technique

### ✅ Totalement Réalisable
- **API Slack** : Bien documentée, stable
- **Slash Commands** : Standard, facile à implémenter
- **OAuth Slack** : Authentification utilisateurs
- **Webhooks** : Notifications temps réel

### 📋 Architecture Simple
```
Slack Command → DooDates API → Sondage créé → Lien posté dans Slack
```

## 🚀 Prototype MVP (2-3 jours de dev)

### Fonctionnalités Minimales
1. **Commande slash** : `/doodate`
2. **Parsing basique** : Titre + dates
3. **Création sondage** : Via API DooDates
4. **Réponse Slack** : Lien vers sondage

### Exemple d'Usage
```
/doodate Réunion équipe mardi mercredi 14h-16h
→ "Sondage créé ! 🗓️ Réunion équipe - Votez ici : https://doodates.app/poll/reunion-equipe-abc123"
```

## 🔧 Implémentation Technique

### 1. Configuration Slack App
```javascript
// Slack App Manifest
{
  "display_information": {
    "name": "DooDates",
    "description": "Créez des sondages de dates en une commande"
  },
  "features": {
    "slash_commands": [
      {
        "command": "/doodate",
        "url": "https://api.doodates.app/slack/command",
        "description": "Créer un sondage de dates"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": ["commands", "chat:write"]
    }
  }
}
```

### 2. Endpoint API DooDates
```javascript
// /api/slack/command
app.post('/slack/command', async (req, res) => {
  const { text, user_id, channel_id } = req.body;
  
  // Parse commande : "Réunion équipe mardi mercredi 14h-16h"
  const parsed = parseSlackCommand(text);
  
  // Créer sondage via API interne
  const poll = await createPoll({
    title: parsed.title,
    options: parsed.dates,
    creator_slack_id: user_id
  });
  
  // Réponse Slack
  res.json({
    response_type: "in_channel",
    text: `🗓️ Sondage créé ! **${poll.title}**`,
    attachments: [{
      color: "good",
      actions: [{
        type: "button",
        text: "Voter maintenant",
        url: `https://doodates.app/poll/${poll.slug}`
      }]
    }]
  });
});
```

### 3. Parsing Intelligent
```javascript
function parseSlackCommand(text) {
  // "Réunion équipe mardi mercredi 14h-16h"
  const words = text.split(' ');
  
  // Extraire titre (premiers mots avant dates)
  const dateKeywords = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
  const titleWords = [];
  const dateWords = [];
  
  let foundDate = false;
  for (const word of words) {
    if (dateKeywords.some(d => word.toLowerCase().includes(d))) {
      foundDate = true;
    }
    
    if (!foundDate) {
      titleWords.push(word);
    } else {
      dateWords.push(word);
    }
  }
  
  return {
    title: titleWords.join(' ') || 'Nouveau sondage',
    dates: parseDates(dateWords.join(' '))
  };
}
```

## 📈 Potentiel Business

### Acquisition Virale
- **Effet réseau** : 1 utilisateur → équipe complète
- **Adoption naturelle** : Workflow quotidien Slack
- **Bouche-à-oreille** : Partage entre équipes

### Métriques Potentielles
- **1 installation** → 10-50 utilisateurs (équipe)
- **Rétention élevée** : Usage quotidien
- **Conversion premium** : Fonctionnalités équipe

## 🎯 Roadmap Slack

### Phase 1 : Prototype (1 semaine)
- Commande slash basique
- Parsing simple titre + dates
- Création sondage automatique

### Phase 2 : Améliorations (2 semaines)
- Parsing intelligent avancé
- Notifications votes temps réel
- Intégration calendriers équipe

### Phase 3 : Premium (1 mois)
- Analytics équipe
- Templates récurrents
- Gestion permissions

## 💡 Fonctionnalités Avancées (Future)

### Notifications Temps Réel
```
@channel Nouveau vote sur "Réunion équipe" par @paul.dupont
Résultats actuels : Mardi 14h (3 oui, 1 peut-être)
```

### Templates Équipe
```
/doodate template:standup semaine-prochaine
→ Utilise template pré-configuré équipe
```

### Analytics Slack
```
/doodate stats
→ Affiche métriques équipe : sondages créés, participation, etc.
```

---

**Conclusion : Prototype Slack techniquement simple et business impact élevé**
**Recommandation : Priorité haute pour différenciation concurrentielle**
