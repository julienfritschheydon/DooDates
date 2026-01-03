# Shared API Architecture

## Current State Analysis

The current application handles Authentication, Quotas, and Conversations using a mix of client-side logic, local storage, and server-side Edge Functions.

### 1. Authentication

- **Source of Truth**: `AuthContext.tsx`
- **Mechanism**: Supabase Auth (GoTrue)
- **State**: `user`, `profile`, `session`
- **Persistence**: `localStorage` (sb-\*) + Supabase Session

### 2. Quotas

- **Fragmented Implementation**:
  - **Guests**: `useFreemiumQuota` -> `guestQuotaService` -> Supabase (`user_quotas`) OR `QuotaService` -> `localStorage` (Fallback).
  - **Authenticated**: `useFreemiumQuota` -> `quotaTracking` -> Edge Function (`quota-tracking`).
- **Duplication**: Limits defined in `QuotaService.ts`, `useFreemiumQuota.ts`, and `quota-tracking/index.ts`.

### 3. Conversations

- **Storage Split**:
  - **Guests**: `localStorage` (`doodates_conversations`).
  - **Authenticated**: Supabase (`conversations` table).
- **Bridge**: `ConversationService.ts` attempts to unify loading but logic is complex and scattered.

## Proposed Shared API

We propose a unified `SharedApiService` to abstract these differences.

### Interface Definition

```typescript
interface ISharedApi {
  // Identity
  getIdentity(): Promise<{ userId: string; isGuest: boolean }>;

  // Quotas
  checkQuota(action: QuotaAction): Promise<QuotaCheckResult>;
  consumeQuota(action: QuotaAction, amount: number): Promise<QuotaConsumptionResult>;
  getQuotaStatus(): Promise<QuotaStatus>;

  // Storage (Conversations)
  saveConversation(conversation: Conversation): Promise<void>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversations(): Promise<Conversation[]>;
}
```

### Implementation Strategy

1.  **Unified Quota Service**:
    - Create `UnifiedQuotaService.ts` that implements the interface.
    - Internally switches between `GuestQuotaStrategy` and `AuthQuotaStrategy`.
    - Centralize limits in a shared constant file (`src/constants/limits.ts`).

2.  **Unified Storage Service**:
    - Create `UnifiedStorageService.ts`.
    - Internally switches between `LocalStorageStrategy` and `SupabaseStorageStrategy`.

3.  **API Layer**:
    - Expose these services via a React Context (`SharedApiContext`) or a singleton.

## Benefits

- **Consistency**: Single source of truth for limits and logic.
- **Maintainability**: Easier to update limits or add new quota types.
- **Security**: Centralized enforcement points.
