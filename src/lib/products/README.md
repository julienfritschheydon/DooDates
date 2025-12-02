# Products Services Documentation

## 📁 Structure

```
src/lib/products/
├── date-polls/
│   ├── date-polls-service.ts (314 lignes)
│   └── index.ts (wrapper rétrocompatible)
├── form-polls/
│   ├── form-polls-service.ts (434 lignes)
│   └── index.ts
├── quizz/
│   ├── quizz-service.ts (456 lignes)
│   └── index.ts
└── index.ts (interface unifiée + factory)
```

## 🔄 Types Partagés

### PollType
```typescript
type PollType = "date" | "form" | "quizz";
```

### BasePoll
```typescript
interface BasePoll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  type?: PollType;
  slug: string;
  status: "active" | "archived" | "deleted";
  created_at: string;
  updated_at: string;
}
```

## 🛠️ Interface Unifiée

### Helper Functions
- `getPollType(poll: any): PollType | null` - Détecte le type de sondage
- `isDatePoll(poll: any): boolean` - Vérifie si c'est un sondage de dates
- `isFormPoll(poll: any): boolean` - Vérifie si c'est un sondage de formulaire
- `isQuizz(poll: any): boolean` - Vérifie si c'est un quizz

### Factory Function
```typescript
createPollService(type: PollType): Promise<any>
```

## 📦 Services Spécifiques

### Date Polls Service
- **Gestion** : Créneaux horaires, fuseaux horaires, validation
- **Types** : `DatePoll`, `DatePollSettings`, `TimeSlot`
- **Fonctions** : CRUD, validation, export

### Form Polls Service  
- **Gestion** : Questions, réponses, résultats
- **Types** : `FormPoll`, `Question`, `Response`
- **Fonctions** : CRUD, validation, analyse

### Quizz Service
- **Gestion** : Questions, scoring, correction
- **Types** : `Quizz`, `QuizQuestion`, `QuizResult`
- **Fonctions** : CRUD, notation, rapports

## 🔧 Rétrocompatibilité

Chaque service exporte des wrappers avec aliases :
- `getDatePolls` → `getPolls`
- `DatePoll` → `Poll`
- Etc.

## 🚀 Points d'Extension

1. **Nouveaux types de sondages** : Ajouter un nouveau dossier dans `products/`
2. **Fonctionnalités partagées** : Ajouter dans `index.ts`
3. **Tests** : Utiliser les patterns existants dans `__tests__/`

## 📋 Usage Exemple

```typescript
import { getPollType, createPollService } from './products';

// Détecter le type
const type = getPollType(myPoll);

// Créer un service
const service = await createPollService(type);

// Utiliser le service
const polls = await service.getPolls();
```
