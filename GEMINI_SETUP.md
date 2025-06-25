# Configuration de Gemini 2.5 pour DooDates

## 🚀 Guide de configuration

### 1. Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://ai.google.dev/)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Get API Key"
4. Créez un nouveau projet ou sélectionnez un existant
5. Copiez votre clé API

### 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Configuration pour Gemini 2.5
VITE_GEMINI_API_KEY=votre_clé_api_ici
```

**⚠️ Important :** 
- Ne commitez JAMAIS ce fichier dans Git
- Remplacez `votre_clé_api_ici` par votre vraie clé API

### 3. Test de la configuration

1. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

2. Ouvrez l'application dans votre navigateur
3. Vous devriez voir "Gemini 2.5 connecté" dans l'interface de chat
4. Testez avec une demande simple comme : "Créé un sondage pour une réunion demain"

## 🧪 Fonctionnalités

### Génération automatique de sondages
L'IA peut créer des sondages à partir de descriptions en langage naturel :

**Exemples de prompts :**
- "Organise une réunion d'équipe la semaine prochaine"
- "Créé un sondage pour un déjeuner entre amis ce weekend"
- "Planifie un entretien client mardi ou mercredi matin"
- "Trouve un créneau pour une formation en ligne"

### Chat conversationnel
- Aide à la création de sondages
- Conseils sur la planification
- Réponses aux questions sur l'application

## 🔧 Modèle utilisé

Le projet utilise le modèle **Gemini 2.0 Flash Experimental** qui offre :
- Génération rapide de réponses
- Compréhension contextuelle avancée
- Support multilingue (français)
- Parsing intelligent des demandes

## 🛠️ Développement

### Structure du code

- `src/lib/gemini.ts` : Service principal pour l'intégration Gemini
- `src/components/GeminiChatInterface.tsx` : Interface utilisateur
- `src/components/ChatInterface.tsx` : Wrapper pour l'interface

### Personnalisation

Vous pouvez modifier les prompts dans `src/lib/gemini.ts` pour adapter les réponses à vos besoins.

## 🐛 Dépannage

### Problèmes courants

1. **"Hors ligne" affiché** : Vérifiez votre clé API
2. **Erreur de connexion** : Vérifiez votre connexion internet
3. **Réponses incohérentes** : Reformulez votre demande

### Logs de débogage

Ouvrez la console du navigateur (F12) pour voir les logs détaillés.

## 📝 Exemple d'utilisation

1. Ouvrez l'interface de chat
2. Tapez : "Je veux organiser un barbecue le weekend prochain"
3. L'IA génère automatiquement :
   - Un titre pour le sondage
   - Des dates proposées
   - Des créneaux horaires appropriés
4. Cliquez sur "Utiliser ce sondage" pour le personnaliser

## 🔐 Sécurité

- Les clés API ne sont jamais exposées côté client
- Les conversations ne sont pas stockées
- Respecte les limites de l'API Google

## 📋 Limitations actuelles

- Nécessite une connexion internet
- Limité par les quotas de l'API Google
- Supporte principalement le français 