import React from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { SignInInput, SignUpInput } from "../lib/schemas";
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
    session: Session | null;
    loading: boolean;
    error: string | null;
    signIn: (data: SignInInput) => Promise<{
        error?: AuthError;
    }>;
    signUp: (data: SignUpInput) => Promise<{
        error?: AuthError;
    }>;
    signInWithGoogle: () => Promise<{
        error?: AuthError;
    }>;
    signOut: () => Promise<{
        error?: AuthError;
    }>;
    updateProfile: (updates: Partial<Profile>) => Promise<{
        error?: any;
    }>;
    refreshProfile: () => Promise<void>;
}
export declare function useAuth(): AuthContextType;
interface AuthProviderProps {
    children: React.ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
