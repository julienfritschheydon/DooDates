import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

// Mock des dépendances
vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
  isLocalDevelopment: false,
}));

vi.mock("../lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../lib/e2e-detection", () => ({
  isE2ETestingEnvironment: vi.fn(() => false),
}));

vi.mock("../lib/supabaseApi", () => ({
  getSupabaseSessionFromLocalStorage: vi.fn(() => null),
  supabaseSelectSingle: vi.fn(),
  supabaseUpdate: vi.fn(),
  supabaseInsert: vi.fn(),
}));

// Composant de test pour utiliser le hook
function TestComponent({ onAuth }: { onAuth: (auth: any) => void }) {
  const auth = useAuth();
  onAuth(auth);
  return (
    <div>
      <div data-testid="user-id">{auth.user?.id || "no-user"}</div>
      <div data-testid="loading">{auth.loading ? "loading" : "not-loading"}</div>
      <div data-testid="error">{auth.error || "no-error"}</div>
    </div>
  );
}

describe.skip("AuthContext", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    app_metadata: { provider: "email" },
    user_metadata: {},
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockSession = {
    user: mockUser,
    access_token: "test-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    token_type: "bearer" as const,
  };

  const mockProfile = {
    id: "test-user-id",
    email: "test@example.com",
    full_name: "Test User",
    avatar_url: null,
    timezone: "Europe/Paris",
    preferences: {},
    plan_type: "free" as const,
    subscription_expires_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Provider initialization", () => {
    it("should initialize with loading state", async () => {
      const mockOnAuth = vi.fn();

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Should start with loading=true
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            loading: true,
            user: null,
            session: null,
            error: null,
          })
        );
      });
    });

    it("should initialize with session from localStorage", async () => {
      const mockOnAuth = vi.fn();
      const { getSupabaseSessionFromLocalStorage } = await import("../lib/supabaseApi");

      vi.mocked(getSupabaseSessionFromLocalStorage).mockReturnValue(mockSession);

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            loading: false,
            user: mockUser,
            session: mockSession,
          })
        );
      });
    });
  });

  describe("Authentication methods", () => {
    it("should handle successful sign in", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const signInResult = await result.signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(signInResult.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(logger.info).toHaveBeenCalledWith("Connexion réussie", "auth", {
        email: "test@example.com",
      });
    });

    it("should handle sign in error with user-friendly message", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as any,
      });

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const signInResult = await result.signIn({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

      expect(signInResult.error?.message).toBe("Email ou mot de passe incorrect");
    });

    it("should handle sign up", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const signUpResult = await result.signUp({
        email: "newuser@example.com",
        password: "password123",
        fullName: "New User",
      });

      expect(signUpResult.error).toBeNull();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: {
          data: {
            full_name: "New User",
          },
        },
      });
    });

    it("should handle Google OAuth sign in", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/oauth" },
        error: null,
      });

      // Mock window.location
      Object.defineProperty(window, "location", {
        value: {
          origin: "http://localhost:3000",
          pathname: "/dashboard",
          search: "",
        },
        writable: true,
      });

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const googleResult = await result.signInWithGoogle();

      expect(googleResult.error).toBeNull();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes:
            "email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar",
        },
      });
      expect(localStorage.getItem("auth_return_to")).toBe("/dashboard");
    });

    it("should handle sign out and cleanup", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      // Set up initial authenticated state
      const { getSupabaseSessionFromLocalStorage } = await import("../lib/supabaseApi");
      vi.mocked(getSupabaseSessionFromLocalStorage).mockReturnValue(mockSession);

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for user to be set
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            user: mockUser,
            session: mockSession,
          })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const signOutResult = await result.signOut();

      expect(signOutResult.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("Déconnexion réussie", "auth");
    });
  });

  describe("Profile management", () => {
    it("should update profile successfully", async () => {
      const mockOnAuth = vi.fn();
      const { supabaseUpdate } = await import("../lib/supabaseApi");

      vi.mocked(supabaseUpdate).mockResolvedValue({
        ...mockProfile,
        full_name: "Updated Name",
      });

      // Set up initial authenticated state
      const { getSupabaseSessionFromLocalStorage } = await import("../lib/supabaseApi");
      vi.mocked(getSupabaseSessionFromLocalStorage).mockReturnValue(mockSession);

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for user to be set
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenCalledWith(
          expect.objectContaining({ user: mockUser })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const updateResult = await result.updateProfile({
        full_name: "Updated Name",
      });

      expect(updateResult.error).toBeNull();
      expect(supabaseUpdate).toHaveBeenCalledWith(
        "profiles",
        { full_name: "Updated Name" },
        { id: `eq.${mockUser.id}` },
        { timeout: 5000 }
      );
    });

    it("should handle update profile without authenticated user", async () => {
      const mockOnAuth = vi.fn();

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load (no user)
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ user: null, loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const updateResult = await result.updateProfile({
        full_name: "Should Fail",
      });

      expect(updateResult.error).toBe("Utilisateur non connecté");
    });
  });

  describe("Local development mode", () => {
    it("should disable authentication in local development", async () => {
      // Mock the entire supabase module to return isLocalDevelopment = true
      vi.doMock("../lib/supabase", () => ({
        supabase: {
          auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
          },
        },
        isLocalDevelopment: true,
      }));

      const mockOnAuth = vi.fn();

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const signInResult = await result.signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(signInResult.error?.message).toContain(
        "L'authentification n'est pas disponible en mode développement local"
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "Tentative de connexion en mode local",
        "auth",
        { email: "test@example.com" }
      );
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside provider", () => {
      expect(() => {
        render(<TestComponent onAuth={() => {}} />);
      }).toThrow("useAuth must be used within an AuthProvider");
    });
  });

  describe("Error handling", () => {
    it("should handle network errors during sign in", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");

      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error("Network error")
      );

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      const signInResult = await result.signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(signInResult.error?.message).toBe("Network error");
      expect(logger.error).toHaveBeenCalledWith(
        "Exception lors de la connexion",
        "auth",
        expect.any(Error)
      );
    });
  });

  describe("Analytics tracking", () => {
    it("should track sign in events", async () => {
      const mockOnAuth = vi.fn();
      const { supabase } = await import("../lib/supabase");
      const { supabaseInsert } = await import("../lib/supabaseApi");

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      vi.mocked(supabaseInsert).mockResolvedValue({} as any);

      render(
        <AuthProvider>
          <TestComponent onAuth={mockOnAuth} />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockOnAuth).toHaveBeenLastCalledWith(
          expect.objectContaining({ loading: false })
        );
      });

      const { result } = await waitFor(() => {
        const lastCall = mockOnAuth.mock.calls[mockOnAuth.mock.calls.length - 1];
        return { result: lastCall[0] };
      });

      await result.signIn({
        email: "test@example.com",
        password: "password123",
      });

      // Trigger auth state change
      await waitFor(() => {
        expect(supabaseInsert).toHaveBeenCalledWith(
          "analytics_events",
          expect.objectContaining({
            event_type: "user_signed_in",
            event_data: expect.objectContaining({
              method: "email",
            }),
            user_id: mockUser.id,
          }),
          { timeout: 2000 }
        );
      });
    });
  });
});
