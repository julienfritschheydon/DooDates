# Dépannage Authentification Google

## Problème : "Continuer avec Google" ne fonctionne pas

### Vérifications à effectuer :

1. **Variables d'environnement** (fichier `.env.local`)
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Configuration Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet
   - Authentication → Providers → Google
   - Vérifier que Google OAuth est **activé**
   - Vérifier les URLs de redirection autorisées :
     - `http://localhost:8080/auth/callback` (développement)
     - `https://yourdomain.com/auth/callback` (production)

3. **Console navigateur** (F12 → Console)
   - Rechercher les erreurs avec "Google" ou "OAuth"
   - Vérifier les messages de log : 
     - `🔄 Tentative de connexion Google...`
     - `✅ Redirection Google OAuth démarrée`

4. **Configuration Google Cloud Console**
   - Créer un projet sur https://console.cloud.google.com/
   - Activer l'API Google Calendar
   - Configurer OAuth 2.0 avec les bonnes URLs de redirection

## ✅ Solution étape par étape

### Étape 1 : Google Cloud Console

1. **Aller sur https://console.cloud.google.com/**
2. **Créer ou sélectionner un projet**
3. **Activer les APIs nécessaires :**
   - Aller dans **"APIs & Services"** → **"Library"**
   - Rechercher et activer **"Google Calendar API"**
   - Rechercher et activer **"Google+ API"** (pour l'authentification)

4. **Configurer OAuth 2.0 :**
   - **"APIs & Services"** → **"Credentials"**
   - **"Create Credentials"** → **"OAuth 2.0 Client ID"**
   - **Application type :** `Web application`
   - **Authorized redirect URIs :**
     ```
     https://ffbhbcktfqxxoqlinzm.supabase.co/auth/v1/callback
     http://localhost:8080/auth/callback
     https://doodates.app/auth/callback
     ```

5. **Copier Client ID et Client Secret**

### Étape 2 : Configuration Supabase

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. **Coller Client ID et Client Secret** de Google Cloud Console
3. **Site URL :** `http://localhost:8080` (développement)
4. **Redirect URLs :**
   ```
   http://localhost:8080/auth/callback
   https://doodates.app/auth/callback
   ```

### Étape 3 : Fichier .env.local

```bash
# Configuration Supabase  
VITE_SUPABASE_URL=https://ffbhbcktfqxxoqlinzm.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme_ici

# Configuration de développement  
VITE_APP_ENV=development
```

## 🔧 Fonctionnalités Google Calendar

### Après connexion réussie :

1. **Retour automatique** au créateur de sondage
2. **État "Calendrier connecté"** affiché en vert
3. **Bouton "Analyser disponibilités"** pour suggérer des créneaux libres
4. **Suggestions automatiques** basées sur votre agenda Google

### Permissions demandées :
- `email profile` : Informations de base
- `https://www.googleapis.com/auth/calendar.readonly` : Lecture du calendrier

### Utilisation :
1. Sélectionner des dates dans le calendrier
2. Cliquer sur **"Analyser disponibilités"**
3. Les créneaux libres sont automatiquement suggérés
4. Modifiez selon vos préférences

## 🚨 Problèmes fréquents

### "Token Google Calendar indisponible"
- Vérifiez que l'API Google Calendar est activée
- Reconnectez-vous pour obtenir les nouvelles permissions

### "Erreur 403 Forbidden"
- Vérifiez que l'API Google Calendar est activée dans Google Cloud Console
- Vérifiez les quotas d'API

### "Aucune suggestion de créneaux"
- Votre calendrier est peut-être vide pour ces dates
- Les créneaux par défaut (9h-12h, 14h-17h) sont analysés

### Pas de redirection vers le créateur
- Vérifiez que les URLs de callback sont correctes
- Videz le cache du navigateur

### Test de diagnostic :

1. Ouvrir la console navigateur (F12)
2. Cliquer sur "Continuer avec Google"
3. Noter les messages de log
4. Vérifier l'onglet Network pour les requêtes
5. Partager les logs d'erreur si le problème persiste

### Configuration Google Cloud Console :

1. Aller sur https://console.cloud.google.com/
2. Créer un projet ou sélectionner un projet existant
3. Activer l'API Google+ ou Google Identity
4. Créer des identifiants OAuth 2.0
5. Ajouter les URLs de redirection autorisées
6. Copier Client ID et Client Secret dans Supabase

### Support :

Si le problème persiste, fournir :
- Messages d'erreur de la console
- Configuration Supabase (sans les clés secrètes)
- Navigateur et version utilisés 