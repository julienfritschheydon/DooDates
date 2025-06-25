import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SignInInput, SignUpInput } from '../lib/schemas';

// Variables d'environnement pour validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferences: Record<string, any>;
  plan_type: 'free' | 'pro' | 'premium';
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
  
  // Méthodes d'authentification
  signIn: (data: SignInInput) => Promise<{ error?: AuthError }>;
  signUp: (data: SignUpInput) => Promise<{ error?: AuthError }>;
  signInWithGoogle: () => Promise<{ error?: AuthError }>;
  signOut: () => Promise<{ error?: AuthError }>;
  
  // Méthodes de profil
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération du profil utilisateur
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  // Mise à jour du profil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: 'Utilisateur non connecté' } };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProfile(data);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  // Actualisation du profil
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Connexion email/password
  const signIn = async (data: SignInInput) => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      return { error };
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const signUp = async (data: SignUpInput) => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      return { error };
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Connexion Google
  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      console.log('🔄 Tentative de connexion Google...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly',
        },
      });

      if (error) {
        console.error('❌ Google OAuth Error:', error);
        setError(`Erreur Google OAuth: ${error.message}`);
        setLoading(false);
        return { error };
      }

      console.log('✅ Redirection Google OAuth démarrée');
      // Ne pas setLoading(false) ici car la redirection va se faire
      return { error: null };
    } catch (err) {
      console.error('❌ Google OAuth Exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion Google';
      setError(`Erreur connexion: ${errorMessage}`);
      setLoading(false);
      return { error: { message: errorMessage } as AuthError };
    }
  };

  // Déconnexion
  const signOut = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      
      // Nettoyer l'état local
      setUser(null);
      setProfile(null);
      setSession(null);

      return { error };
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Effet pour écouter les changements d'authentification
  useEffect(() => {
    let mounted = true;

    // Récupérer la session initiale
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        }
        
        setLoading(false);
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setError(null);

        if (session?.user) {
          // Récupérer le profil pour les nouveaux utilisateurs
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);

        // Analytics pour les événements d'auth
        if (event === 'SIGNED_IN') {
          // Tracker la connexion
          supabase.from('analytics_events').insert({
            event_type: 'user_signed_in',
            event_data: {
              method: session?.user?.app_metadata?.provider || 'email',
              timestamp: new Date().toISOString(),
            },
            user_id: session?.user?.id,
          });
        } else if (event === 'SIGNED_OUT') {
          // Tracker la déconnexion
          supabase.from('analytics_events').insert({
            event_type: 'user_signed_out',
            event_data: {
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 