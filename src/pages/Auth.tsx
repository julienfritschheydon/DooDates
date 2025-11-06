import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SignInForm } from "../components/auth/SignInForm";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, SignUpInput } from "../lib/schemas";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { logError, ErrorFactory } from "../lib/error-handling";
import { logger } from "@/lib/logger";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { signUp, loading, error } = useAuth();
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Inscription</CardTitle>
        <CardDescription className="text-center">Créez votre compte DooDates</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
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
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
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
              <p className="text-sm text-destructive">{errors.password.message}</p>
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
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Erreurs générales */}
          {(errors.root || error) && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root?.message || error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
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
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Redirection des utilisateurs authentifiés (sauf si paramètre ?force=true)
  const forceAccess = searchParams.get("force") === "true";
  useEffect(() => {
    if (user && !loading && !forceAccess) {
      const returnTo = localStorage.getItem("doodates-return-to");
      if (returnTo === "create") {
        localStorage.removeItem("doodates-return-to");
        localStorage.removeItem("doodates-connect-calendar");
        navigate("/create", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate, forceAccess]);

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

  // Interface d'authentification normale
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">DooDates</h1>
          <p className="mt-2 text-sm text-gray-600">Planification intelligente de rendez-vous</p>
        </div>

        {/* Message si utilisateur déjà connecté */}
        {user && forceAccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Vous êtes déjà connecté en tant que {user.email}
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs">
              Retour à l'accueil
            </Button>
          </div>
        )}

        {mode === "signin" ? (
          <SignInForm onSuccess={handleAuthSuccess} onSwitchToSignUp={() => setMode("signup")} />
        ) : (
          <SignUpForm onSuccess={handleAuthSuccess} onSwitchToSignIn={() => setMode("signin")} />
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
        logError(ErrorFactory.auth("OAuth Error", "Erreur OAuth"), {
          component: "Auth",
          operation: "handleOAuthCallback",
          metadata: { error, errorDescription },
        });
        navigate("/auth", { replace: true });
        return;
      }

      // Attendre que Supabase traite la session
      const timer = setTimeout(() => {
        if (user) {
          logger.info("User authenticated, redirecting appropriately", "auth");
          const returnTo = localStorage.getItem("doodates-return-to");
          if (returnTo === "create") {
            localStorage.removeItem("doodates-return-to");
            navigate("/create", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else if (!loading) {
          logger.warn("No user found after callback, redirecting to auth", "auth");
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
        <h2 className="text-lg font-semibold text-gray-900">Connexion en cours...</h2>
        <p className="text-sm text-gray-600 mt-2">
          Veuillez patienter pendant que nous finalisons votre connexion.
        </p>
        {user && (
          <p className="text-xs text-green-600 mt-2">Utilisateur connecté, redirection...</p>
        )}
      </div>
    </div>
  );
}

// Export par défaut pour compatibilité avec l'import existant dans App.tsx
export default Auth;
