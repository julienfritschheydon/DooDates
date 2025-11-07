import React from "react";
import { RenderOptions } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
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
  signIn: (data: any) => Promise<{
    error?: any;
  }>;
  signUp: (data: any) => Promise<{
    error?: any;
  }>;
  signOut: () => Promise<{
    error?: any;
  }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{
    error?: any;
  }>;
}
import type { User } from "@supabase/supabase-js";
export declare const createTestQueryClient: () => QueryClient;
export declare const mockUser: User;
export declare const mockAuthContext: AuthContextType;
export declare const mockGuestAuthContext: AuthContextType;
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  authContext?: AuthContextType;
}
export declare const TestWrapper: React.FC<TestWrapperProps>;
export declare const renderWithProviders: (
  ui: React.ReactElement,
  options?: {
    queryClient?: QueryClient;
    authContext?: AuthContextType;
    renderOptions?: Omit<RenderOptions, "wrapper">;
  },
) => import("@testing-library/react").RenderResult<
  typeof import("@testing-library/dom/types/queries"),
  HTMLElement,
  HTMLElement
>;
export declare const renderWithGuestContext: (
  ui: React.ReactElement,
  options?: RenderOptions,
) => import("@testing-library/react").RenderResult<
  typeof import("@testing-library/dom/types/queries"),
  HTMLElement,
  HTMLElement
>;
export {};
