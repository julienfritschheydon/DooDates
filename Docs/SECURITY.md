# Politique de Sécurité - DooDates

> **Version :** 1.0  
> **Dernière mise à jour :** Janvier 2026  
> **Contact sécurité :** security@doodates.com

---

## 🔒 Engagement de Sécurité

DooDates s'engage à protéger la sécurité et la confidentialité des données de ses utilisateurs. Cette politique décrit nos pratiques de sécurité, notre processus de signalement des vulnérabilités, et nos engagements en matière de protection des données.

---

## 🛡️ Mesures de Sécurité Techniques

### Architecture de Sécurité

DooDates utilise une **architecture de défense en profondeur** avec plusieurs couches de sécurité :

```
┌─────────────────────────────────────────┐
│ CLIENT (React)                          │
│ ✅ Token JWT Supabase (authentifié)     │
│ ✅ Tous appels → Edge Function          │
│ ❌ Aucune clé API exposée               │
└─────────────────────────────────────────┘
              ↓ HTTPS (TLS 1.3)
┌─────────────────────────────────────────┐
│ SUPABASE EDGE FUNCTION                  │
│ ✅ Vérifie JWT (auth.uid())              │
│ ✅ Vérifie quota DB (transaction atomique)│
│ ✅ Rate limiting userId + IP             │
│ ✅ Logs audit (qui a fait quoi)          │
│ ✅ Clés API = variables serveur (safe)   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ BASE DE DONNÉES (PostgreSQL)            │
│ ✅ Row Level Security (RLS) activé       │
│ ✅ Chiffrement au repos (AES-256)       │
│ ✅ Backups chiffrés quotidiens           │
└─────────────────────────────────────────┘
```

### Chiffrement

#### En Transit
- **TLS 1.3** : Toutes les communications client-serveur sont chiffrées
- **HTTPS obligatoire** : Redirection automatique HTTP → HTTPS
- **HSTS** : Headers HTTP Strict Transport Security activés
- **Certificats** : Renouvellement automatique via GitHub Pages

#### Au Repos
- **Base de données** : Chiffrement AES-256 natif Supabase
- **Backups** : Sauvegardes chiffrées avec clés de chiffrement gérées par Supabase
- **Secrets** : Variables d'environnement chiffrées (GitHub Secrets, Supabase Secrets)
- **Mots de passe** : Hachage avec bcrypt (via Supabase Auth, salt automatique)

### Authentification & Autorisation

#### Authentification
- **Provider** : Supabase Auth (GoTrue)
- **Méthodes** : Email/mot de passe, OAuth (Google, GitHub)
- **Sessions** : Tokens JWT avec expiration courte (15 minutes)
- **Refresh tokens** : Rotation automatique, révocation possible
- **2FA** : Authentification à deux facteurs (planifiée)

#### Autorisation
- **Row Level Security (RLS)** : Activé sur toutes les tables sensibles
- **Politiques RLS** : Contrôle d'accès granulaire par utilisateur et ressource
- **Permissions** : 
  - Créateur : Accès complet à ses propres ressources
  - Participants : Accès en lecture seule aux sondages partagés
  - Invités : Accès limité avec quotas stricts
- **Admin tokens** : Tokens d'administration séparés pour gestion

#### Exemple de Politique RLS
```sql
-- Les utilisateurs ne peuvent accéder qu'à leurs propres conversations
CREATE POLICY "Users can only access their own conversations"
ON conversations
FOR ALL
USING (auth.uid() = creator_id);
```

### Infrastructure

#### Hébergement
- **Frontend** : GitHub Pages (CDN global, HTTPS automatique)
- **Base de données** : Supabase (PostgreSQL 15+, région configurable)
- **Edge Functions** : Supabase Edge Functions (serverless, isolation par fonction)
- **Storage** : Supabase Storage (fichiers, images)

#### Sécurité Réseau
- **Firewall** : Restrictions d'accès configurées
- **DDoS Protection** : Protection via GitHub Pages et Supabase
- **Rate Limiting** : 
  - Par utilisateur : 100 requêtes/heure (authentifié), 20/heure (invité)
  - Par IP : 100 requêtes/heure (protection anti-multi-comptes)
- **CORS** : Restrictions strictes aux domaines autorisés uniquement

#### Monitoring & Alertes
- **Logs d'accès** : Tous les accès sont loggés (timestamp, userId, IP, action)
- **Alertes automatiques** : 
  - Usage suspect (> 50 crédits/heure)
  - Tentatives d'accès non autorisées
  - Erreurs critiques
- **Métriques** : Performance, disponibilité, erreurs
- **Dashboards** : Supabase Dashboard, monitoring personnalisé

### Pratiques de Développement

#### Code Review
- **Obligatoire** : Toutes les modifications sont revues avant fusion
- **Checklist sécurité** : Vérification des bonnes pratiques
- **Tests requis** : Tests unitaires et E2E avant fusion

#### Tests de Sécurité
- **Tests unitaires** : Validation des fonctions critiques
- **Tests E2E** : Validation des workflows complets
- **Tests de sécurité** : 
  - Isolation des données utilisateurs
  - Vérification des quotas
  - Tests de rate limiting
- **Tests d'intégration** : Validation des Edge Functions

#### Gestion des Dépendances
- **Mises à jour régulières** : Scan et mise à jour automatiques
- **Dependabot** : Alertes GitHub pour vulnérabilités connues
- **Audit** : `npm audit` dans CI/CD avant déploiement
- **Versions** : Pin des versions majeures pour stabilité

#### Secrets & Configuration
- **Jamais dans le code** : Aucun secret dans le code source
- **Variables d'environnement** : 
  - `.env.local` pour développement (gitignored)
  - GitHub Secrets pour CI/CD
  - Supabase Secrets pour Edge Functions
- **Rotation** : Rotation régulière des clés API
- **Accès limité** : Seuls les membres autorisés ont accès aux secrets

### Audit Trails & Logs

#### Logs d'Accès
- **Toutes les requêtes** : Timestamp, userId, IP, endpoint, méthode HTTP
- **Actions utilisateurs** : Création, modification, suppression de ressources
- **Consommation quotas** : Suivi détaillé des crédits utilisés
- **Authentification** : Connexions, déconnexions, échecs

#### Logs de Sécurité
- **Tentatives d'accès non autorisées** : Alertes immédiates
- **Usage suspect** : Détection d'anomalies (rate limiting, quotas)
- **Modifications critiques** : Changements de configuration, suppressions

#### Rétention des Logs
- **Logs d'accès** : 30 jours
- **Logs de sécurité** : 90 jours
- **Logs d'audit** : 12 mois (pour conformité)

#### Accès aux Logs
- **Équipe technique** : Accès aux logs via Supabase Dashboard
- **Export** : Export possible pour audit externe
- **Anonymisation** : Logs anonymisés avant partage (si nécessaire)

### Gestion des Incidents de Sécurité

#### Processus de Réponse

1. **Détection** : 
   - Monitoring automatique
   - Signalement par utilisateur
   - Audit externe

2. **Évaluation** :
   - Classification de la sévérité (critique/haute/moyenne/basse)
   - Impact estimé (données, utilisateurs, service)

3. **Containment** :
   - Isolation de la vulnérabilité
   - Limitation des accès si nécessaire
   - Communication aux utilisateurs affectés (si applicable)

4. **Correction** :
   - Développement du correctif
   - Tests de régression
   - Déploiement en production

5. **Post-Incident** :
   - Analyse post-mortem
   - Amélioration des processus
   - Communication publique (si nécessaire)

#### Communication

- **Utilisateurs affectés** : Notification dans les 72h (si données compromises)
- **Communauté** : Publication dans le hall of fame (si applicable)
- **Autorités** : Notification CNIL si nécessaire (dans les 72h)

### Mesures Anti-Abus

#### Protection des Quotas
- **Vérification serveur** : Tous les quotas vérifiés côté serveur (impossible de bypass)
- **Transactions atomiques** : Vérification et consommation en une seule opération
- **Rate limiting** : Limites par utilisateur et par IP

#### Protection contre le Spam
- **Cooldowns** : Délais minimum entre actions
- **Validation** : Validation des données avant traitement
- **Blacklist** : Liste d'IPs/emails bloqués (si nécessaire)

#### Protection des Données
- **Minimisation** : Collecte uniquement des données nécessaires
- **Pseudonymisation** : Données analytics pseudonymisées
- **Anonymisation** : Fonction d'anonymisation disponible pour les utilisateurs

---

## 🐛 Signalement de Vulnérabilités

### Comment signaler une vulnérabilité ?

Nous prenons la sécurité très au sérieux. Si vous découvrez une vulnérabilité de sécurité, merci de nous la signaler de manière responsable.

**Email :** security@doodates.com  
**Sujet :** `[SECURITY] Description brève de la vulnérabilité`

### Informations à inclure

- Description détaillée de la vulnérabilité
- Étapes pour reproduire le problème
- Impact potentiel (données affectées, utilisateurs concernés)
- Suggestions de correction (si vous en avez)
- Votre nom et coordonnées (optionnel, pour crédit dans le hall of fame)

### Processus de traitement

1. **Accusé de réception** : Nous confirmons la réception sous **24 heures**
2. **Évaluation** : Analyse de la vulnérabilité sous **48 heures** (critiques) ou **7 jours** (non-critiques)
3. **Correction** : Développement et test d'un correctif
4. **Déploiement** : Mise en production du correctif
5. **Communication** : Notification publique (si nécessaire) après correction

### Engagements

- **Réponse rapide** : < 48h pour les vulnérabilités critiques
- **Confidentialité** : Nous ne divulguons pas les détails avant correction
- **Reconnaissance** : Crédit dans notre hall of fame (si souhaité)
- **Pas de poursuites** : Nous ne poursuivrons pas les chercheurs en sécurité agissant de bonne foi

### Vulnérabilités hors scope

- Attaques par déni de service (DoS/DDoS)
- Spam ou phishing
- Problèmes nécessitant un accès physique à l'appareil
- Problèmes de configuration côté client (navigateur, extensions)

---

## 📋 Bonnes Pratiques pour les Utilisateurs

### Protection de votre compte

- **Mot de passe fort** : Utilisez un mot de passe unique et complexe
- **Authentification à deux facteurs** : Activez la 2FA si disponible
- **Sessions** : Déconnectez-vous sur les appareils partagés
- **Liens suspects** : Ne cliquez pas sur des liens non vérifiés

### Partage de sondages

- **Liens publics** : Les sondages peuvent être accessibles via lien direct
- **Données sensibles** : Évitez de partager des informations personnelles sensibles dans les sondages
- **Anonymisation** : Utilisez la fonction d'anonymisation pour les réponses si nécessaire

### Signaler un problème

Si vous suspectez un problème de sécurité :
1. Ne partagez pas publiquement les détails
2. Contactez-nous à security@doodates.com
3. Incluez autant d'informations que possible

---

## 📊 Historique des Failles Corrigées

### Transparence

Nous publions un historique des failles de sécurité corrigées pour maintenir la transparence avec notre communauté.

**Format :**
- Date de découverte
- Date de correction
- Type de vulnérabilité (sans détails techniques exploitables)
- Impact (faible/moyen/élevé)
- Remerciements (si applicable)

### Exemple (à compléter)

| Date | Type | Impact | Statut |
|------|------|--------|--------|
| - | - | - | Aucune faille signalée à ce jour |

---

## 🔍 Audits de Sécurité

### Audits internes

- **Révision trimestrielle** : Audit interne des pratiques de sécurité
- **Tests de pénétration** : Tests réguliers (planifiés)
- **Scan de dépendances** : Automatisé via GitHub Dependabot

### Audits externes

- **Communauté** : Encouragement des audits par la communauté
- **Professionnels** : Audit professionnel planifié (post-lancement)
- **Certifications** : Visée ISO 27001, SOC 2 Type II (en cours)

---

## 📞 Contacts

- **Sécurité** : security@doodates.com
- **DPO / Confidentialité** : privacy@doodates.com
- **Support général** : support@doodates.com

---

## 📝 Mises à Jour

Cette politique est mise à jour régulièrement pour refléter l'évolution de nos pratiques de sécurité. La date de dernière mise à jour est indiquée en haut du document.

**Historique des versions :**
- **v1.0** (Janvier 2026) : Version initiale

---

*Dernière mise à jour : Janvier 2026*

