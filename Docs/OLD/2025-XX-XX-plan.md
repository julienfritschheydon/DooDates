# Plan: DooDates AI Scheduling Assistant

## Notes
- **Core Strategy**: The project has pivoted from a "modern Doodle" to a revolutionary "AI-first scheduling assistant". The key differentiator is the conversational UI, positioning it as a Blue Ocean product.
- **Business Model**: A hybrid one-time payment model has been finalized:
  - **Free**: Basic, limited functionality (3 active polls, no history).
  - **Pro (15€)**: For power users, offering 100 lifetime polls, calendar sync, and full history.
  - **Premium (25€)**: The full experience, including the core AI Assistant and integrations.
  - **Add-ons**: For specific needs like Enterprise bots or white-labeling.
- **Refined Specifications**: The MVP feature set has been refined and expanded with granular technical and functional details. Key changes include adding a "copy poll" feature and focusing on a core, robust user experience before layering on complex AI features. This provides a clear development blueprint.
- **Development Strategy**: The rollout will be phased. First, build the core classic UI to validate the market (Free tier). Next, introduce the Pro features and monetization. Finally, launch the game-changing Premium AI features.

## Task List

### Phase 0: Project Foundation & Setup
- [x] Initialize Next.js project (`npx create-next-app@latest doodates`).
- [x] Install core dependencies (`Supabase`, `Prisma`, `Stripe`, `date-fns`, `next-intl`).
- [x] Set up Supabase project (Database, Auth, Storage).
- [x] Define initial Prisma schema (`User`, `Poll`, `Vote`, `Participant`).
- [x] Establish project structure (e.g., `app/[locale]`, `components/ui`, `lib`, `services`).

### Phase 1: Core MVP (Classic Interface - Free/Pro Tiers)
- [ ] **Authentication & User Management**
  - [ ] Implement email/password and social login (Google, GitHub) with Supabase Auth.
  - [ ] Create user profile page with account deletion (GDPR compliant).
  - [ ] Set up granular notification settings (email, push).
- [ ] **Dashboard & Poll Management**
  - [ ] Build a responsive dashboard with list/grid views, search, and filters.
  - [ ] Separate tabs for "Created Polls" and "Participated Polls".
  - [ ] Implement smart poll statuses (e.g., Urgent, In Progress, Finished).
  - [ ] Allow poll deletion (soft delete) and archiving.
  - [ ] Implement "Copy Poll" feature with intelligent date adaptation.
- [ ] **Poll Creation**
  - [ ] Build a multi-step creation form with real-time validation (Zod).
  - [ ] Include advanced options: deadlines, anonymous voting, comments.
  - [ ] Implement local draft saving.
- [ ] **Voting & Results**
  - [ ] Design a mobile-first, real-time voting grid using Supabase subscriptions.
  - [ ] Support advanced voting options (conditional, multiple choices).
  - [ ] Display results with clear visualizations (e.g., bar charts).
  - [ ] Implement an optional threaded comment system for polls.
- [ ] **Sharing & Export**
  - [ ] Generate shareable public links with customizable slugs and QR codes.
  - [ ] Add Open Graph tags for social media previews.
  - [ ] Implement basic `.ics` export for selected time slots.

### Phase 2: Monetization & Pro Features
- [ ] **Payments**
  - [ ] Integrate Stripe for one-time payments (Pro & Premium).
  - [ ] Create a pricing page detailing the tiers.
  - [ ] Implement logic to unlock features based on user's tier.
- [ ] **Pro Tier Features**
  - [ ] Full calendar integration (2-way sync with Google Calendar).
  - [ ] Advanced customization (add logo/branding to poll page).
  - [ ] Implement permanent poll history and search.

### Phase 3: The AI Assistant (Premium Tier)
- [ ] **AI Stack Integration**
  - [ ] Set up Vercel AI SDK for streaming responses.
  - [ ] Integrate with OpenAI API (GPT-4).
  - [ ] Choose and set up a vector database (e.g., Pinecone, Supabase pgvector) for conversation memory.
- [ ] **Conversational UI**
  - [ ] Develop the main chat interface.
  - [ ] Implement Natural Language Understanding for parsing requests (e.g., "Plan a meeting with Julien next week").
  - [ ] Handle clarifications and confirmations via chat.
  - [ ] Automate poll creation and sending invitations based on conversation.
- [ ] **Intelligent Features**
  - [ ] Implement automatic reminders for non-voters.
  - [ ] Proactively suggest the best time slot once a consensus is reached.
  - [ ] Integrate with Slack for creating polls via slash commands.

## Current Goal
Set up the project foundation and build the core MVP features for the classic UI.