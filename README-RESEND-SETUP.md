# 📧 Configuration Resend pour DooDates

## Configuration des emails avec Resend

### 1. Créer un compte Resend
- Aller sur [resend.com](https://resend.com)
- Créer un compte gratuit (1000 emails/mois)

### 2. Obtenir la clé API
- Dashboard Resend → API Keys
- Créer une nouvelle clé API
- Copier la clé (format: `re_xxxxx`)

### 3. Configurer les variables d'environnement
Ajouter dans votre fichier `.env` :

```bash
# Email Service (Resend)
VITE_RESEND_API_KEY=re_your_api_key_here
```

### 4. Domaine personnalisé (optionnel)
Pour production, configurer votre domaine :
- Resend Dashboard → Domains
- Ajouter `doodates.app` 
- Suivre les instructions DNS

### 5. Mode développement
Sans clé API, les emails sont loggés dans la console :
```
📧 Email à envoyer (mode dev): {
  to: ['user@example.com'],
  subject: '📅 Invitation sondage',
  poll_url: 'http://localhost:8080/vote/abc123'
}
```

### 6. Templates d'emails
Les templates HTML sont dans `src/lib/email-service.ts` :
- `generatePollCreatedTemplate()` - Invitation sondage
- `generateNewVoteTemplate()` - Notification nouveau vote

### 7. Fonctionnalités
- ✅ Invitation participants lors création sondage
- ✅ Notification créateur au nouveau vote
- ✅ Templates HTML responsive
- ✅ Fallback mode dev (logs console)
- ✅ Gestion d'erreurs complète

### Limites Resend gratuit
- 1000 emails/mois
- 10 emails/jour en mode test
- Support email inclus 