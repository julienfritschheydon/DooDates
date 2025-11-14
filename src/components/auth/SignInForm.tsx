import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInSchema, SignInInput } from "../../lib/schemas";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Mail, Lock } from "lucide-react";
import { logError, ErrorFactory } from "../../lib/error-handling";

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const { signIn, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    console.log("SignInForm: onSubmit appelé", { email: data.email });
    setIsSubmitting(true);

    try {
      console.log("SignInForm: Appel signIn...");
      const { error } = await signIn(data);
      console.log("SignInForm: signIn terminé", { error });

      if (error) {
        // Le message d'erreur est déjà formaté dans AuthContext
        setError("root", {
          message: error.message || "Erreur de connexion",
        });
      } else {
        console.log("SignInForm: Connexion réussie, appel onSuccess");
        onSuccess?.();
      }
    } catch (err) {
      logError(
        ErrorFactory.validation(
          "Erreur lors de la soumission",
          "Une erreur inattendue s'est produite lors de la connexion",
        ),
        { error: err },
      );
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
        <CardTitle className="text-2xl text-center">Connexion</CardTitle>
        <CardDescription className="text-center">
          Connectez-vous à votre compte DooDates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formulaire email/password */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                autoComplete="email"
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
                autoComplete="current-password"
                className="pl-10"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Erreurs générales */}
          {(errors.root || error) && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root?.message || error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            onClick={(e) => {
              console.log("SignInForm: Bouton cliqué", {
                isSubmitting,
                loading,
                disabled: isSubmitting,
              });
              // Ne pas empêcher la soumission du formulaire
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>

        {/* Lien vers inscription */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Pas encore de compte ? </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={onSwitchToSignUp}
          >
            S'inscrire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
