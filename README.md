# DooDates 🗓️

**Modern AI-powered scheduling tool with conversational interface**

🔒 **Private & Proprietary Repository**  
Access restricted to authorized team members only.

## 🎯 Project Overview

DooDates revolutionizes event scheduling through:
- **AI Conversational Interface**: "Organise réunion mardi-mercredi avec Paul et Marie" → Automatic poll creation
- **Mobile-First Design**: Modern 2025 UI with micro-animations
- **One-Time Payment**: No subscriptions, transparent pricing
- **Blue Ocean Strategy**: Unique positioning vs traditional form-based tools

## 🎯 Différenciation

DooDates se distingue par son **interface conversationnelle IA** pour créer des sondages en langage naturel, contrairement aux outils traditionnels basés sur des formulaires.

## 🛠️ Technical Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **UI Components**: Shadcn/ui + Radix UI primitives (49 components)
- **AI Interface**: Google Gemini 2.0 Flash + Custom chat components
- **State Management**: React hooks + TanStack Query v5
- **Styling**: TailwindCSS + Lucide icons
- **Build Tool**: Vite with SWC for fast compilation
- **Testing**: Vitest + Playwright E2E (507+ tests)
- **Storage**: localStorage + Supabase (PostgreSQL) ready
- **AI**: Google Gemini API with conversational context
- **Deployment**: Netlify (configured)
- **Branching Strategy**: Git Worktrees with progressive testing pipeline

## 🌿 Branching Strategy

DooDates uses a progressive testing pipeline with Git Worktrees:

```
main (Production)
├── pre-prod (Pre-production - Full regression tests)
│   └── staging (Staging - E2E functional tests)
│       └── testing (Testing - Unit tests)
│           ├── feature/* (New features)
│           └── bug/* (Bug fixes)
```

### Worktrees Setup
- `DooDates/` → `main` (Production)
- `DooDates-develop/` → `staging` (Development)
- `DooDates-testing/` → `testing` (Integration tests)
- `DooDates-pre-prod/` → `pre-prod` (Regression tests)

### Test Pipeline
- **Testing**: 66 unit tests (5-15 min)
- **Staging**: 12+ E2E tests (20-45 min)
- **Pre-prod**: 45+ regression tests (30-45 min)
- **Production**: Monitoring only

### Promotion Scripts
```bash
./scripts/promote-to-staging.sh    # testing → staging
./scripts/promote-to-main.sh       # pre-prod → main
```

*See [Branching-Strategy.md](./Docs/Branching-Strategy.md) for complete details*

## 🚀 Current Status

### ✅ Phase 1-3: Core Features (COMPLETED)

**🗳️ Date Polls**
- AI-powered poll creation via conversation
- Visual calendar interface with date selection
- Real-time voting with swipe gestures
- Results visualization with participant tracking
- Anonymous & named voting support

**📋 Form Polls (Questionnaires)**
- AI-generated questionnaires from natural language
- 6 question types: Single choice, Multiple choice, Text, Matrix, Rating (1-5), NPS (0-10)
- Conditional logic (show/hide questions based on answers)
- Matrix questions with customizable rows/columns
- "Other" option with free text
- 4 export formats: CSV, PDF, JSON, Markdown
- Real-time results with charts and statistics

**🤖 AI Conversational Interface**
- Google Gemini 2.0 Flash integration
- Natural language understanding
- Context-aware responses
- Automatic poll type detection (date vs form)
- Conversation history & resume
- Voice input support

**💾 Data Management**
- localStorage for guest users
- Supabase integration ready
- Auto-save functionality
- Data export capabilities
- Conversation persistence

**🎨 UI/UX**
- Mobile-first responsive design
- Dark mode support
- Onboarding tour
- Toast notifications
- Loading states & error handling

### 🔄 Phase 4: Advanced Features (IN PROGRESS)
- Poll modification via AI
- Advanced analytics
- Email notifications (Resend integration)
- Authentication & user accounts

### 📋 Upcoming Phases
- **Phase 5**: Monetization (Stripe, Pro features)
- **Phase 6**: Scale & Optimize (Performance, Enterprise)

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run all tests
npm test
```

### Project Structure
```
DooDates/
├── src/
│   ├── components/
│   │   ├── GeminiChatInterface.tsx  # AI chat interface
│   │   ├── PollCreator.tsx          # Date poll creator
│   │   ├── polls/                   # Poll components
│   │   │   ├── FormPollCreator.tsx  # Form poll creator
│   │   │   ├── FormPollVote.tsx     # Form voting interface
│   │   │   ├── FormPollResults.tsx  # Results display
│   │   │   ├── ConditionalRuleEditor.tsx
│   │   │   ├── NPSInput.tsx         # NPS question component
│   │   │   └── QuestionCard.tsx     # Question editor
│   │   ├── voting/                  # Voting components
│   │   ├── chat/                    # Chat components
│   │   └── ui/                      # 49 Shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx                # Chat/Home page
│   │   ├── Vote.tsx                 # Voting page
│   │   ├── Results.tsx              # Results page
│   │   └── Dashboard.tsx            # User dashboard
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAutoSave.ts
│   │   ├── useConversations.ts
│   │   ├── usePolls.ts
│   │   └── useVoting.ts
│   ├── lib/
│   │   ├── gemini.ts                # Gemini AI integration
│   │   ├── pollStorage.ts           # Poll data management
│   │   ├── exports.ts               # Export functionality
│   │   ├── conditionalEvaluator.ts  # Conditional logic
│   │   └── date-utils.ts            # Date utilities
│   ├── types/                       # TypeScript types
│   └── main.tsx                     # Application entry point
├── tests/
│   └── e2e/                         # Playwright E2E tests
├── Docs/                            # Strategic documentation
├── public/                          # Static assets
└── package.json                     # Dependencies and scripts
```

## 🎨 Features & Components

### Poll Types
- **Date Polls**: Schedule meetings with visual calendar
- **Form Polls**: Surveys, questionnaires, feedback forms

### Question Types
- **Single Choice**: Radio buttons
- **Multiple Choice**: Checkboxes
- **Text**: Free text input
- **Matrix**: Grid of options (Likert scales)
- **Rating**: 1-5 stars
- **NPS**: Net Promoter Score (0-10)

### Advanced Features
- **Conditional Logic**: Show/hide questions based on answers
- **Export Formats**: CSV, PDF, JSON, Markdown
- **Real-time Results**: Live statistics and charts
- **Voice Input**: Speech-to-text for chat
- **Mobile Optimized**: Swipe gestures, responsive design

### UI Components (49 Shadcn/ui)
- **Forms**: Input, Button, Checkbox, Radio, Select, Textarea
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Navigation**: Menu, Breadcrumb, Pagination, Tabs
- **Layout**: Card, Sheet, Dialog, Drawer, Separator
- **Data Display**: Table, Badge, Avatar, Calendar
- **Overlays**: Popover, Tooltip, Hover Card, Context Menu

## 📁 Documentation

### Strategic Docs
- [`Docs/DooDates-Complete-Strategy.md`](./Docs/DooDates-Complete-Strategy.md) - Business & technical strategy
- [`Docs/2. Planning.md`](./Docs/2.%20Planning.md) - Development roadmap
- [`Docs/Competitors/`](./Docs/Competitors/) - Competitive analysis

### Technical Docs
- [`Docs/Form-Poll-AI-Creation.md`](./Docs/Form-Poll-AI-Creation.md) - AI questionnaire generation
- [`Docs/Export.md`](./Docs/Export.md) - Export specifications
- [`Docs/TESTS-GUIDE-V2.md`](./Docs/TESTS/TESTS-GUIDE-V2.md) - Testing guide
- [`Docs/USEEFFECT_GUIDELINES.md`](./Docs/USEEFFECT_GUIDELINES.md) - React best practices

### API Documentation
- Google Gemini 2.0 Flash integration
- Conditional logic evaluation
- Export system (CSV, PDF, JSON, Markdown)
- Poll storage & retrieval

## 🔧 Development Guidelines

### Code Quality
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for React + TypeScript best practices
- **Prettier**: Code formatting (configured in ESLint)
- **Git**: Conventional commits encouraged

### Component Guidelines
- Use functional components with hooks
- Leverage Shadcn/ui components for consistency
- Follow mobile-first responsive design
- Implement proper TypeScript types

### State Management
- React hooks for local state
- TanStack Query for server state
- Context API for global state (planned)

## 🧪 Testing

### Test Coverage
- **507+ unit tests** with Vitest
- **E2E tests** with Playwright (5 browsers)
- **CI/CD** with GitHub Actions
- **Automated regression testing**

### Test Categories
- Conditional logic evaluation (30 tests)
- Export functionality (15 tests)
- Poll storage (27 tests)
- Conversation management (25+ tests)
- UI components (400+ tests)

## 🚧 Known Limitations & Next Steps

### Current Limitations
- Guest mode only (localStorage)
- No email notifications yet
- No user authentication (Supabase ready)
- No payment integration

### Immediate Next Steps
1. **Poll modification via AI** - Edit existing polls conversationally
2. **User authentication** - Supabase Auth integration
3. **Email notifications** - Resend integration
4. **Advanced analytics** - Detailed insights and trends
5. **Monetization** - Stripe payment integration

## 🔐 Security & Compliance

- **Private Repository**: Proprietary license with IP protection
- **Environment Variables**: Use `.env.local` for sensitive data
- **HTTPS Only**: Production deployment with SSL/TLS
- **GDPR Ready**: Privacy-first data handling approach

## 👥 Team Access

This repository is private and confidential. All contributors must:
- Sign NDA before repository access
- Follow security best practices
- Use proper commit signing
- Never share proprietary information

---

**© 2025 DooDates - All Rights Reserved**  
*Revolutionary AI scheduling - No subscriptions, just results.*
# Test trigger 12/29/2025 17:59:38
