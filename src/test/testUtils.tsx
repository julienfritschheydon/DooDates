import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
// Mock types for AuthContext since they're not exported
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferences: Record<string, any>;
  plan_type: "free" | "pro" | "premium";
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  signIn: (data: any) => Promise<{ error?: any }>;
  signUp: (data: any) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>;
}
import type { User } from "@supabase/supabase-js";

// Create a test QueryClient with disabled retries and caching
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock user for testing
export const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: [],
};

// Mock AuthContext value
export const mockAuthContext: AuthContextType = {
  user: mockUser,
  profile: null,
  session: null,
  loading: false,
  error: null,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
};

// Mock AuthContext for guest users
export const mockGuestAuthContext: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
};

interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  authContext?: AuthContextType;
}

// Test wrapper with QueryClient and AuthContext
export const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  queryClient = createTestQueryClient(),
  authContext = mockAuthContext,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Mock AuthContext Provider - using React.createContext */}
      {React.createElement(
        React.createContext<AuthContextType | null>(null).Provider,
        { value: authContext },
        children,
      )}
    </QueryClientProvider>
  );
};

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: {
    queryClient?: QueryClient;
    authContext?: AuthContextType;
    renderOptions?: Omit<RenderOptions, "wrapper">;
  },
) => {
  const { queryClient, authContext, renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper queryClient={queryClient} authContext={authContext}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to render with guest context
export const renderWithGuestContext = (ui: React.ReactElement, options?: RenderOptions) => {
  return renderWithProviders(ui, {
    authContext: mockGuestAuthContext,
    renderOptions: options,
  });
};
