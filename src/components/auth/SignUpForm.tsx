import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, SignUpInput } from "../../lib/schemas";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { logError, ErrorFactory } from "../../lib/error-handling";
import { LazyIcon } from "../../lib/lazy-icons";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  onFormChange?: (hasData: boolean) => void;
}

export function SignUpForm({ onSuccess, onSwitchToSignIn, onFormChange }: SignUpFormProps) {
  const { signUp, signInWithGoogle, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
  });

  // 🔧 FIX BUG #3: Détecter si des données sont saisies
  React.useEffect(() => {
    const subscription = watch((value) => {
      const hasData = !!(value.email || value.password || value.confirmPassword || value.fullName);
      onFormChange?.(hasData);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFormChange]);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError("root", {
          message: error.message || "Erreur de connexion Google",
        });
      } else {
        onSuccess?.();
      }
    } catch (err) {
      logError(
        ErrorFactory.validation(
          "Erreur lors de la connexion Google",
          "Une erreur inattendue s'est produite lors de la connexion Google",
        ),
        { metadata: { originalError: err } },
      );
      setError("root", {
        message: "Une erreur inattendue s'est produite avec Google",
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

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
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full relative"
          disabled={isGoogleSubmitting || loading}
          onClick={handleGoogleSignIn}
        >
          {isGoogleSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <LazyIcon 
            name="Chrome" 
            fallback={<div className="w-4 h-4 mr-2 bg-blue-500 rounded" />}
            className="mr-2 h-4 w-4"
          />
          Continuer avec Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou créer un compte avec email
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
            {/* 🔧 FIX BUG #4: Afficher toutes les contraintes dès le départ */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Votre mot de passe doit contenir :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Au moins 8 caractères</li>
                <li>Une lettre minuscule</li>
                <li>Une lettre majuscule</li>
                <li>Un chiffre</li>
              </ul>
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
