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

## 📊 Strategic Position

- **Market**: €2.8B scheduling software (7-8% annual growth)
- **Competition**: Doodle (dated), Framadate (basic), Timeful (no AI)
- **Differentiation**: Only tool with AI conversational scheduling
- **Business Model**: Free → Pro (€15) → Premium (€25) + Add-ons

## 🛠️ Technical Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **UI Components**: Shadcn/ui + Radix UI primitives (49 components)
- **AI Interface**: Custom chat components with React Query
- **State Management**: React hooks + TanStack Query
- **Styling**: TailwindCSS + CSS modules + Framer Motion
- **Build Tool**: Vite with SWC for fast compilation
- **Testing**: Jest + Testing Library (planned)
- **Backend**: Next.js API routes + Supabase (PostgreSQL) - planned
- **AI**: OpenAI GPT-4, LangChain, Vercel AI SDK - planned
- **Payments**: Stripe integration - planned

## 🚀 Current Status

### ✅ Phase 1: AI Interface Foundation (COMPLETED)
- **Chat Interface**: Full conversational UI with message handling
- **Component Library**: 49 Shadcn/ui components ready for use
- **Modern Setup**: React 18 + Vite + TypeScript configuration
- **Responsive Design**: Mobile-first with TailwindCSS
- **Development Environment**: Hot reload, ESLint, PostCSS configured

### 🔄 Phase 2: MVP Core (IN PROGRESS)
- Authentication & user management
- AI-to-poll conversion logic
- Database integration (Supabase)
- Real-time voting system
- Calendar integration

### 📋 Upcoming Phases
- **Phase 3**: Monetization (Stripe, Pro features)
- **Phase 4**: Scale & Optimize (Performance, Enterprise)

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
```

### Project Structure
```
DooDates/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main chat interface
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── ui/                  # 49 Shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx            # Main application page
│   │   └── NotFound.tsx         # 404 error page
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   └── main.tsx                 # Application entry point
├── Docs/                        # Strategic documentation
├── public/                      # Static assets
└── package.json                 # Dependencies and scripts
```

## 🎨 UI Components Available

The project includes 49 pre-built Shadcn/ui components:
- **Forms**: Input, Button, Checkbox, Radio, Select, Textarea
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Navigation**: Menu, Breadcrumb, Pagination, Tabs
- **Layout**: Card, Sheet, Dialog, Drawer, Separator
- **Data Display**: Table, Badge, Avatar, Calendar
- **Overlays**: Popover, Tooltip, Hover Card, Context Menu

## 📁 Documentation

- [`Docs/DooDates-Complete-Strategy.md`](./Docs/DooDates-Complete-Strategy.md) - Comprehensive business & technical strategy
- [`Docs/MVP-Specs.md`](./Docs/MVP-Specs.md) - Detailed MVP specifications
- [`Docs/Competitors/`](./Docs/Competitors/) - Competitive analysis with screenshots

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

## 🚧 Known Issues & Next Steps

### Current Limitations
- Chat interface is placeholder (no AI backend yet)
- No user authentication system
- No poll creation logic implemented
- Database integration pending

### Immediate Next Steps
1. **Setup Supabase database** with authentication
2. **Implement AI chat backend** with OpenAI integration
3. **Create poll conversion logic** from chat messages
4. **Add user registration/login** flow
5. **Implement real-time voting** system

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
