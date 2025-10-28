# Système de Feedback IA

## Vue d'ensemble

Système de feedback pour les propositions de l'IA :
- 👍 **Thumb Up** : Feedback positif silencieux
- 👎 **Thumb Down** : Formulaire + email automatique

## Quick Start

### 1. Template EmailJS

Créer `template_ai_feedback` sur https://dashboard.emailjs.com/

**Sujet :** `❌ IA Feedback - Proposition rejetée`

**Corps :**
```
❌ FEEDBACK IA NÉGATIF

📝 DEMANDE : {{user_request}}
🤖 GÉNÉRÉ : {{generated_content}}
❌ RAISONS : {{reasons}}
💬 COMMENTAIRE : {{comment}}

📊 CONTEXTE :
- Poll ID : {{poll_id}}
- Titre : {{poll_title}}
- Type : {{poll_type}}

🕐 {{timestamp}}
```


