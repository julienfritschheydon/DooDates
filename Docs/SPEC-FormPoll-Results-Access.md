# Spécification : Accès aux résultats FormPoll + Email de confirmation

**Date :** 02/11/2025  
**Statut :** SPEC - À implémenter  
**Priorité :** HAUTE (Phase 0 - Pré-bêta)

---

## 🎯 Problème

Actuellement, après avoir voté sur un FormPoll :
1. ❌ Le votant voit "Voir les résultats" mais **ne peut pas accéder aux résultats** (403/non autorisé)
2. ❌ Pas d'option pour le **créateur** de contrôler qui peut voir les résultats
3. ❌ Le votant ne peut pas **recevoir une copie de ses réponses par email**

**Impact utilisateur :** Frustration, manque de transparence, pas de trace des réponses.

---

## 💡 Solution proposée

### Feature 1 : Paramètre "Visibilité des résultats" (2h)

**Objectif :** Permettre au créateur de choisir qui peut voir les résultats.

#### Modèle de données

Ajouter un champ `resultsVisibility` dans l'interface `Poll` :

```typescript
// src/lib/pollStorage.ts
export interface Poll {
  // ... champs existants
  resultsVisibility?: "creator-only" | "voters" | "public";
  // "creator-only" : Seul le créateur (défaut pour compatibilité)
  // "voters" : Créateur + personnes ayant voté
  // "public" : Tout le monde (même sans voter)
}
```

#### Interface créateur

**Fichier :** `src/components/polls/FormPollCreator.tsx`

Ajouter une section "Paramètres de visibilité" dans l'éditeur :

```tsx
<div className="border rounded-lg p-4">
  <h3 className="font-semibold mb-2">Visibilité des résultats</h3>
  <div className="space-y-2">
    <label className="flex items-center gap-2">
      <input 
        type="radio" 
        name="resultsVisibility" 
        value="creator-only"
        checked={draft.resultsVisibility === "creator-only"}
        onChange={(e) => updateDraft({ resultsVisibility: e.target.value })}
      />
      <span>Moi uniquement</span>
      <span className="text-xs text-gray-500">(par défaut)</span>
    </label>
    <label className="flex items-center gap-2">
      <input 
        type="radio" 
        name="resultsVisibility" 
        value="voters"
        checked={draft.resultsVisibility === "voters"}
        onChange={(e) => updateDraft({ resultsVisibility: e.target.value })}
      />
      <span>Personnes ayant voté</span>
      <span className="text-xs text-gray-500">(recommandé)</span>
    </label>
    <label className="flex items-center gap-2">
      <input 
        type="radio" 
        name="resultsVisibility" 
        value="public"
        checked={draft.resultsVisibility === "public"}
        onChange={(e) => updateDraft({ resultsVisibility: e.target.value })}
      />
      <span>Public (tout le monde)</span>
    </label>
  </div>
</div>
```

#### Contrôle d'accès

**Fichier :** `src/components/polls/FormPollResults.tsx`

Ajouter une vérification d'accès au début du composant :

```typescript
// Vérifier si l'utilisateur a le droit de voir les résultats
const canViewResults = useMemo(() => {
  const visibility = poll?.resultsVisibility || "creator-only";
  
  // 1. Public : tout le monde peut voir
  if (visibility === "public") return true;
  
  // 2. Créateur : vérifier si c'est le créateur (via localStorage ou auth)
  const isCreator = poll?.creator_id === getCurrentUserId(); // À implémenter
  if (isCreator) return true;
  
  // 3. Voters : vérifier si l'utilisateur a voté
  if (visibility === "voters") {
    const hasVoted = checkIfUserHasVoted(poll.id); // À implémenter
    return hasVoted;
  }
  
  return false;
}, [poll]);

if (!canViewResults) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-2">Accès restreint</h2>
          <p className="text-gray-700">
            Le créateur de ce sondage a choisi de ne pas partager les résultats publiquement.
          </p>
          {poll?.resultsVisibility === "voters" && (
            <p className="text-sm text-gray-600 mt-2">
              💡 Votez pour voir les résultats !
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Helpers à créer

```typescript
// src/lib/pollStorage.ts

/**
 * Vérifie si l'utilisateur actuel a voté sur ce poll
 */
export function checkIfUserHasVoted(pollId: string): boolean {
  const deviceId = getDeviceId();
  const responses = getFormResponses(pollId);
  
  // Vérifier si une réponse existe avec cet appareil
  return responses.some(r => {
    const respondentId = getRespondentId(r);
    return respondentId.includes(deviceId);
  });
}

/**
 * Récupère l'ID de l'utilisateur actuel (device ID ou user ID si authentifié)
 */
export function getCurrentUserId(): string {
  // TODO: Si authentification Supabase active, retourner user.id
  // Sinon, retourner device ID
  return getDeviceId();
}
```

---

### Feature 2 : Bouton conditionnel "Voir les résultats" (30min)

**Objectif :** Afficher le bouton uniquement si l'utilisateur a le droit.

**Fichier :** `src/components/polls/FormPollVote.tsx` (lignes 224-249)

Modifier l'écran de confirmation post-vote :

```tsx
if (submitted) {
  const visibility = poll.resultsVisibility || "creator-only";
  const canSeeResults = visibility === "public" || visibility === "voters";
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 pt-20">
        <h1 className="text-2xl font-bold mb-2">Merci pour votre participation !</h1>
        <p className="text-gray-600">Votre réponse a été enregistrée.</p>
        
        <div className="mt-6 space-y-3">
          {canSeeResults ? (
            <Link
              to={`/poll/${poll.slug || poll.id}/results`}
              className="inline-block text-white px-4 py-2 rounded transition-colors"
              style={{ backgroundColor: "var(--theme-primary, #3B82F6)" }}
            >
              Voir les résultats
            </Link>
          ) : (
            <div className="text-sm text-gray-500">
              ℹ️ Les résultats ne sont pas publics pour ce sondage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Feature 3 : Email de confirmation avec copie des réponses (3h)

**Objectif :** Permettre au votant de recevoir ses réponses par email (optionnel).

#### Interface de vote

**Fichier :** `src/components/polls/FormPollVote.tsx`

Ajouter un champ email optionnel avant le bouton "Soumettre" :

```tsx
// Ajouter dans le state
const [voterEmail, setVoterEmail] = useState("");
const [wantsEmailCopy, setWantsEmailCopy] = useState(false);

// Ajouter dans le formulaire (avant le bouton submit)
<div className="border-t pt-4">
  <label className="flex items-center gap-2 mb-3">
    <input
      type="checkbox"
      checked={wantsEmailCopy}
      onChange={(e) => setWantsEmailCopy(e.target.checked)}
    />
    <span className="text-sm">Recevoir une copie de mes réponses par email</span>
  </label>
  
  {wantsEmailCopy && (
    <div>
      <label className="block text-sm mb-1" htmlFor="voter-email">
        Votre email
      </label>
      <input
        id="voter-email"
        type="email"
        className="w-full rounded px-3 py-2 border"
        value={voterEmail}
        onChange={(e) => setVoterEmail(e.target.value)}
        placeholder="votremail@example.com"
        required={wantsEmailCopy}
      />
    </div>
  )}
</div>
```

#### Stockage de l'email

Modifier `FormResponse` pour inclure l'email :

```typescript
// src/lib/pollStorage.ts
export interface FormResponse {
  id: string;
  pollId: string;
  respondentName?: string;
  respondentEmail?: string; // NOUVEAU
  created_at: string;
  items: FormResponseItem[];
}
```

Modifier `addFormResponse` pour accepter l'email :

```typescript
export function addFormResponse(data: {
  pollId: string;
  respondentName?: string;
  respondentEmail?: string; // NOUVEAU
  items: FormResponseItem[];
}): FormResponse {
  // ... code existant
  const response: FormResponse = {
    id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    pollId: data.pollId,
    respondentName: data.respondentName,
    respondentEmail: data.respondentEmail, // NOUVEAU
    created_at: new Date().toISOString(),
    items: data.items,
  };
  // ... reste du code
}
```

#### Service d'envoi d'email

**Fichier à créer :** `src/services/EmailService.ts`

```typescript
import { Poll, FormResponse, FormQuestionShape } from "@/lib/pollStorage";

interface EmailResponseData {
  poll: Poll;
  response: FormResponse;
  questions: FormQuestionShape[];
}

/**
 * Envoie un email de confirmation avec les réponses du votant
 */
export async function sendVoteConfirmationEmail(data: EmailResponseData): Promise<void> {
  const { poll, response, questions } = data;
  
  if (!response.respondentEmail) {
    throw new Error("Email du votant manquant");
  }
  
  // Générer le contenu HTML de l'email
  const emailHtml = generateEmailHtml(data);
  
  // TODO: Intégration avec Resend API
  // Pour l'instant, log en console (MVP)
  console.log("📧 Email à envoyer:", {
    to: response.respondentEmail,
    subject: `Vos réponses : ${poll.title}`,
    html: emailHtml,
  });
  
  // PHASE 2 : Vraie implémentation avec Resend
  /*
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("⚠️ VITE_RESEND_API_KEY manquante, email non envoyé");
    return;
  }
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "DooDates <noreply@doodates.com>",
      to: response.respondentEmail,
      subject: `Vos réponses : ${poll.title}`,
      html: emailHtml,
    }),
  });
  
  if (!response.ok) {
    throw new Error("Erreur lors de l'envoi de l'email");
  }
  */
}

/**
 * Génère le HTML de l'email de confirmation
 */
function generateEmailHtml(data: EmailResponseData): string {
  const { poll, response, questions } = data;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; }
        .question { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; }
        .question-title { font-weight: bold; margin-bottom: 8px; }
        .answer { color: #3B82F6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vos réponses : ${poll.title}</h1>
          <p>Merci d'avoir participé !</p>
        </div>
        <div class="content">
          <p><strong>Nom :</strong> ${response.respondentName || "Anonyme"}</p>
          <p><strong>Date :</strong> ${new Date(response.created_at).toLocaleString("fr-FR")}</p>
          <hr>
  `;
  
  // Ajouter chaque question/réponse
  response.items.forEach((item) => {
    const question = questions.find(q => q.id === item.questionId);
    if (!question) return;
    
    let answerDisplay = "";
    const kind = question.kind || question.type || "single";
    
    if (kind === "text") {
      answerDisplay = String(item.value);
    } else if (kind === "single") {
      const option = question.options?.find(o => o.id === item.value);
      answerDisplay = option?.label || String(item.value);
    } else if (kind === "multiple") {
      const ids = Array.isArray(item.value) ? item.value : [];
      const labels = ids.map(id => {
        const opt = question.options?.find(o => o.id === id);
        return opt?.label || id;
      });
      answerDisplay = labels.join(", ");
    } else if (kind === "rating" || kind === "nps") {
      answerDisplay = `${item.value}/${kind === "nps" ? 10 : (question.ratingScale || 5)}`;
    }
    
    html += `
      <div class="question">
        <div class="question-title">${question.title}</div>
        <div class="answer">${answerDisplay}</div>
      </div>
    `;
  });
  
  html += `
        </div>
        <div class="footer">
          <p>Cet email a été généré automatiquement par DooDates.</p>
          <p><a href="${window.location.origin}/poll/${poll.slug || poll.id}/results">Voir les résultats</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
}
```

#### Appel du service après soumission

**Fichier :** `src/components/polls/FormPollVote.tsx`

Modifier la fonction `onSubmit` :

```typescript
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  const v = validate();
  if (v) {
    setError(v);
    return;
  }
  if (!poll) return;

  const items = Object.keys(answers).map((qid) => ({
    questionId: qid,
    value: answers[qid],
  }));
  
  try {
    const response = addFormResponse({
      pollId: poll.id,
      respondentName: voterName.trim(),
      respondentEmail: wantsEmailCopy ? voterEmail.trim() : undefined,
      items,
    });
    
    // Envoyer l'email si demandé
    if (wantsEmailCopy && voterEmail.trim()) {
      try {
        await sendVoteConfirmationEmail({
          poll,
          response,
          questions: questions,
        });
      } catch (emailError) {
        console.error("Erreur envoi email:", emailError);
        // Ne pas bloquer la soumission si l'email échoue
      }
    }
    
    setSubmitted(true);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
    setError(errorMessage);
  }
};
```

---

## 📋 Checklist d'implémentation

### Phase 1 : Visibilité des résultats (2h30)
- [ ] Ajouter `resultsVisibility` dans `Poll` interface
- [ ] Ajouter UI radio buttons dans `FormPollCreator.tsx`
- [ ] Créer `getCurrentUserId()` helper
- [ ] Créer `checkIfUserHasVoted()` helper
- [ ] Ajouter contrôle d'accès dans `FormPollResults.tsx`
- [ ] Modifier bouton "Voir les résultats" dans `FormPollVote.tsx`
- [ ] Tester les 3 modes (creator-only, voters, public)

### Phase 2 : Email de confirmation (3h)
- [ ] Ajouter `respondentEmail` dans `FormResponse` interface
- [ ] Ajouter checkbox + input email dans `FormPollVote.tsx`
- [ ] Modifier `addFormResponse()` pour accepter email
- [ ] Créer `EmailService.ts` avec `sendVoteConfirmationEmail()`
- [ ] Créer `generateEmailHtml()` avec template
- [ ] Intégrer appel service dans `onSubmit()`
- [ ] Tester envoi email (console.log MVP)
- [ ] (LATER) Intégrer Resend API

### Phase 3 : Tests (1h)
- [ ] Test manuel : Créer poll avec "creator-only" → vérifier accès refusé
- [ ] Test manuel : Créer poll avec "voters" → voter → vérifier accès autorisé
- [ ] Test manuel : Créer poll avec "public" → vérifier accès sans voter
- [ ] Test manuel : Voter avec email → vérifier console.log email
- [ ] Test E2E : Workflow complet vote + résultats

---

## 🎯 Temps estimé total : 6h30

- Feature 1 (Visibilité) : 2h30
- Feature 2 (Bouton conditionnel) : 30min (inclus dans Feature 1)
- Feature 3 (Email) : 3h
- Tests : 1h

---

## 📊 Impact utilisateur

**Avant :**
- ❌ Frustration : "Voir les résultats" ne marche pas
- ❌ Pas de contrôle pour le créateur
- ❌ Pas de trace des réponses

**Après :**
- ✅ Transparence : Le créateur choisit qui voit les résultats
- ✅ Confiance : Le votant peut recevoir ses réponses par email
- ✅ Flexibilité : 3 modes de visibilité (creator-only, voters, public)

---

## 🔄 Évolutions futures (post-bêta)

1. **Resend API** - Vraie intégration email (actuellement console.log)
2. **Templates email personnalisables** - Le créateur peut customiser le message
3. **Export PDF des réponses** - Joindre un PDF à l'email
4. **Notifications créateur** - Email au créateur quand quelqu'un vote
5. **Résultats en temps réel** - WebSocket pour mise à jour live

---

## 📚 Fichiers à modifier/créer

**Modifiés :**
- `src/lib/pollStorage.ts` - Types + helpers
- `src/components/polls/FormPollCreator.tsx` - UI visibilité
- `src/components/polls/FormPollResults.tsx` - Contrôle d'accès
- `src/components/polls/FormPollVote.tsx` - Email + bouton conditionnel

**Créés :**
- `src/services/EmailService.ts` - Service d'envoi email
- `Docs/SPEC-FormPoll-Results-Access.md` - Cette spec

**Tests :**
- Tests manuels (checklist ci-dessus)
- Tests E2E à ajouter dans `tests/e2e/form-poll-results-access.spec.ts`
