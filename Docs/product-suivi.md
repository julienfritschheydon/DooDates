# 🕵️ Veille Concurrentielle & Monitoring

Ce document centralise les sources à surveiller pour les 4 axes produits de DooDates.
**Objectif :** Suivre les nouveautés (changelogs), les roadmaps publiques et les inspirations UX.

---

## 📅 1. Date Polls (Sondages de Dates)

Concurrents directs pour la planification d'événements classique.

| Produit       | Type              | Sources de Veille (Changelog / Blog / Roadmap)                                                          | Notes                                                                                |
| :------------ | :---------------- | :------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| **Doodle**    | Leader historique | [Product Updates (Help Center)](https://help.doodle.com/hc/en-us/sections/360003058852-Product-Updates) | Surveiller l'intégration Outlook/Google et les features payantes devenant gratuites. |
| **Calendly**  | Scheduling        | [What's New](https://calendly.com/blog/category/product-news)                                           | Focus sur "Meeting Polls" (beta) qui attaque directement Doodle.                     |
| **Rallly**    | Open-source       | [GitHub Releases](https://github.com/lukevella/rallly/releases)                                         | Très bonne source d'inspiration UX "clean". Changelog technique détaillé.            |
| **Framadate** | Libre             | [GitLab Changelog](https://framagit.org/framasoft/framadate/framadate/-/blob/master/CHANGELOG.md)       | Rythme plus lent, mais utile pour voir les standards open-source.                    |

---

## 📝 2. Formulaires (Forms)

Concurrents pour la création de formulaires, enquêtes et collecte de données.

| Produit          | Type             | Sources de Veille                                                                               | Notes                                                                                       |
| :--------------- | :--------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Typeform**     | Premium / Design | [Changelog & What's New](https://www.typeform.com/help/a/whats-new-at-typeform-360029586111/)   | **LA** référence UX/UI. Surveiller leurs features AI ("Create with AI").                    |
| **Tally.so**     | Challenger       | [Changelog complet](https://tally.so/changelog)                                                 | Roadmap très transparente. Excellent pour voir ce qui est "tendance" chez les indie makers. |
| **Google Forms** | Standard         | [Google Workspace Updates](https://workspaceupdates.googleblog.com/search/label/Google%20Forms) | Surveiller les intégrations profondes avec l'écosystème Google.                             |
| **Jotform**      | Entreprise       | [Jotform Blog](https://www.jotform.com/blog/category/new-features/)                             | Très riche en fonctionnalités "lourdes" (paiements, signatures, PDF).                       |

---

## 🗓️ 3. Availability Polls (Dispos / Grilles)

Concurrents focalisés sur la superposition de disponibilités (Grilles horaires).

| Produit         | Type            | Sources de Veille                                                        | Notes                                                                                           |
| :-------------- | :-------------- | :----------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **LettuceMeet** | Social / Simple | [Twitter / Blog](https://lettucemeet.com/) (Pas de changelog centralisé) | Très populaire pour l'UX mobile et l'aspect "social". Surveiller l'intégration Google Calendar. |
| **When2meet**   | Historique      | (Site statique, peu d'updates)                                           | La référence "low-tech" mais ultra-rapide. À surveiller pour la simplicité radicale.            |
| **Calendly**    | Pro             | [Meeting Polls](https://calendly.com/features/meeting-polls)             | Tentative de Calendly de capturer ce marché via les "Meeting Polls".                            |

---

## 🧠 4. AI Quizz & Learning

Concurrents pour l'éducation, la formation et les quiz interactifs.

| Produit     | Type               | Sources de Veille                                                   | Notes                                                                                          |
| :---------- | :----------------- | :------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------- |
| **Kahoot!** | Gamification       | [Kahoot! News](https://kahoot.com/blog/)                            | Leader. Surveiller leurs nouveaux modes de jeu et l'intégration IA pour générer des questions. |
| **Quizizz** | Éducation          | [Blog & Updates](https://t.me/s/quizizz_updates) (ou site officiel) | Vient de rebrander en "Wayground". Très agressif sur les features IA pour profs.               |
| **Quizlet** | Étude / Flashcards | [Quizlet Blog](https://quizlet.com/blog)                            | Focus sur l'apprentissage "solo" et l'IA (Magic Notes).                                        |

---

## 🤖 5. Outils Monitoring Automatisé

_Idées pour la phase d'automatisation (Janvier)_

- **Outils de scraping :** `Cheerio` (Node.js) ou `Puppeteer` pour extraire les textes des pages ci-dessus.
- **Agrégateurs RSS :** Feedly (pour centraliser les blogs manuellement dans un premier temps).
- **Visualping.io :** Pour être notifié visuellement quand une page changelog change (version gratuite suffisante pour 5-10 pages).
