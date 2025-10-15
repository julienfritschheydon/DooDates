import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SignInForm } from "../components/auth/SignInForm";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, SignUpInput } from "../lib/schemas";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { logError, ErrorFactory } from '../lib/error-handling';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { signUp, signInWithGoogle, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsSubmitting(true);

    try {
      const { error } = await signUp(data);

      if (error) {
        setError("root", {
          message: error.message || "Erreur lors de l'inscription",
        });
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError("root", {
        message: "Une erreur inattendue s'est produite",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError("root", {
          message: error.message || "Erreur de connexion Google",
        });
      }
    } catch (err) {
      setError("root", {
        message: "Erreur de connexion Google",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Inscription</CardTitle>
        <CardDescription className="text-center">
          Créez votre compte DooDates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bouton Google */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuer avec Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou créer un compte avec
            </span>
          </div>
        </div>

        {/* Formulaire inscription */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Votre nom complet"
                className="pl-10"
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Erreurs générales */}
          {(errors.root || error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {errors.root?.message || error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon compte
          </Button>
        </form>

        {/* Lien vers connexion */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Déjà un compte ? </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={onSwitchToSignIn}
          >
            Se connecter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  // Détecter l'intention de connexion calendrier
  const connectCalendar = searchParams.get("connect") === "calendar";
  const needsCalendarConnection =
    localStorage.getItem("doodates-connect-calendar") === "true";

  // Auto-connexion Google pour le calendrier (une seule fois)
  useEffect(() => {
    if (
      (connectCalendar || needsCalendarConnection) &&
      !user &&
      !loading &&
      !autoConnectAttempted
    ) {
      logError(ErrorFactory.auth('Google Calendar connection error', 'Erreur de connexion Google Calendar'), {
        component: 'Auth',
        operation: 'handleAutoConnect',
        originalError: null
      });
      console.log("🗓️ Connexion automatique au calendrier Google...");
      setAutoConnectAttempted(true);

      const timer = setTimeout(async () => {
        try {
          const { error } = await signInWithGoogle();
          if (error) {
            logError(ErrorFactory.auth('Google Calendar connection error', 'Erreur de connexion Google Calendar'), {
              component: 'Auth',
              operation: 'handleAutoConnect',
              originalError: error
            });
            setAutoConnectAttempted(false); // Permettre une nouvelle tentative
          }
        } catch (err) {
          logError(ErrorFactory.auth('Google Calendar connection error', 'Erreur de connexion Google Calendar'), {
            component: 'Auth', 
            operation: 'handleAutoConnect',
            originalError: err
          });
          setAutoConnectAttempted(false); // Permettre une nouvelle tentative
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    connectCalendar,
    needsCalendarConnection,
    user,
    loading,
    autoConnectAttempted,
    signInWithGoogle,
  ]);

  // Redirection des utilisateurs authentifiés
  useEffect(() => {
    if (user && !loading) {
      const returnTo = localStorage.getItem("doodates-return-to");
      if (returnTo === "create") {
        localStorage.removeItem("doodates-return-to");
        localStorage.removeItem("doodates-connect-calendar");
        navigate("/create", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleAuthSuccess = () => {
    const returnTo = localStorage.getItem("doodates-return-to");
    if (returnTo === "create") {
      localStorage.removeItem("doodates-return-to");
      localStorage.removeItem("doodates-connect-calendar");
      navigate("/create", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  // Affichage du loading pendant l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Authentification en cours...</p>
        </div>
      </div>
    );
  }

  // Interface spéciale pour la connexion calendrier
  if (connectCalendar || needsCalendarConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">DooDates</h1>
            <p className="mt-2 text-sm text-gray-600">
              Connexion à votre calendrier Google
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connecter votre calendrier Google
              </h2>
              <p className="text-sm text-gray-600">
                Nous vous redirigeons vers Google pour accéder à votre
                calendrier et suggérer les meilleurs créneaux disponibles.
              </p>
              {!autoConnectAttempted ? (
                <div className="flex items-center justify-center mt-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    Connexion en cours...
                  </span>
                </div>
              ) : (
                <Button
                  onClick={async () => {
                    setAutoConnectAttempted(false);
                    await signInWithGoogle();
                  }}
                  className="w-full"
                >
                  Réessayer la connexion
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface d'authentification normale
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">DooDates</h1>
          <p className="mt-2 text-sm text-gray-600">
            Planification intelligente de rendez-vous
          </p>
        </div>

        {mode === "signin" ? (
          <SignInForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignUp={() => setMode("signup")}
          />
        ) : (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignIn={() => setMode("signin")}
          />
        )}
      </div>
    </div>
  );
}

export function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Vérifier s'il y a des erreurs dans l'URL
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        logError(ErrorFactory.auth('OAuth Error', 'Erreur OAuth'), {
          component: 'Auth',
          operation: 'handleOAuthCallback', 
          metadata: { error, errorDescription }
        });
        navigate("/auth", { replace: true });
        return;
      }

      // Attendre que Supabase traite la session
      const timer = setTimeout(() => {
        if (user) {
          console.log("User authenticated, redirecting appropriately");
          const returnTo = localStorage.getItem("doodates-return-to");
          if (returnTo === "create") {
            localStorage.removeItem("doodates-return-to");
            navigate("/create", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else if (!loading) {
          console.log("No user found after callback, redirecting to auth");
          navigate("/auth", { replace: true });
        }
      }, 2000); // Augmenté à 2 secondes pour laisser plus de temps

      return () => clearTimeout(timer);
    };

    handleCallback();
  }, [user, loading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">
          Connexion en cours...
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Veuillez patienter pendant que nous finalisons votre connexion.
        </p>
        {user && (
          <p className="text-xs text-green-600 mt-2">
            Utilisateur connecté, redirection...
          </p>
        )}
      </div>
    </div>
  );
}

// Export par défaut pour compatibilité avec l'import existant dans App.tsx
export default Auth;
