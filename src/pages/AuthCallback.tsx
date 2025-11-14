import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        logger.info("Traitement du callback OAuth", "auth");

        // Récupérer le hash de l'URL (Supabase utilise le hash pour les callbacks OAuth)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Vérifier s'il y a une erreur dans les paramètres
        const error = hashParams.get("error") || queryParams.get("error");
        const errorDescription =
          hashParams.get("error_description") || queryParams.get("error_description");
        const errorCode = queryParams.get("error_code");

        if (error) {
          logger.error("Erreur OAuth callback", "auth", { error, errorDescription, errorCode });

          // Décoder l'erreur si elle est encodée
          let decodedError = errorDescription;
          try {
            decodedError = decodeURIComponent(errorDescription || error);
          } catch {
            decodedError = errorDescription || error;
          }

          setStatus("error");

          // Message d'erreur spécifique pour "Unable to exchange external code"
          if (
            decodedError.includes("Unable to exchange external code") ||
            errorCode === "unexpected_failure"
          ) {
            setErrorMessage(
              "Erreur lors de l'échange du code OAuth. Vérifiez que le Client Secret dans Supabase correspond au Client ID utilisé.",
            );
          } else {
            setErrorMessage(decodedError || error || "Erreur lors de la connexion");
          }
          return;
        }

        // Écouter les changements d'authentification avec onAuthStateChange
        // Cela permet de capturer l'échange du code automatiquement
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          logger.info("Changement d'état auth détecté", "auth", { event });

          if (event === "SIGNED_IN" && session) {
            logger.info("Session OAuth récupérée avec succès", "auth", { userId: session.user.id });
            setStatus("success");

            // Rediriger vers le dashboard après un court délai
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          } else if (event === "SIGNED_OUT") {
            logger.warn("Utilisateur déconnecté pendant le callback", "auth");
            setStatus("error");
            setErrorMessage("La connexion a échoué. Veuillez réessayer.");
          }
        });

        // Essayer aussi getSession() immédiatement au cas où la session serait déjà disponible
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error("Erreur lors de la récupération de la session", "auth", sessionError);

          // Si l'erreur contient "exchange", c'est un problème de configuration Supabase
          if (
            sessionError.message?.includes("exchange") ||
            sessionError.message?.includes("code")
          ) {
            setStatus("error");
            setErrorMessage(
              "Erreur lors de l'échange du code OAuth. Vérifiez que le Client Secret dans Supabase correspond au Client ID utilisé.",
            );
          } else {
            // Attendre un peu pour voir si onAuthStateChange déclenche
            setTimeout(() => {
              if (status === "loading") {
                setStatus("error");
                setErrorMessage(
                  sessionError.message || "Erreur lors de la récupération de la session",
                );
              }
            }, 2000);
          }
          return;
        }

        if (session) {
          logger.info("Session OAuth récupérée immédiatement", "auth", { userId: session.user.id });
          setStatus("success");

          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        } else {
          // Attendre que onAuthStateChange se déclenche
          logger.info("Aucune session immédiate, attente du callback Supabase...", "auth");

          // Timeout de sécurité après 5 secondes
          setTimeout(() => {
            if (status === "loading") {
              logger.warn("Timeout: aucune session après 5 secondes", "auth");
              setStatus("error");
              setErrorMessage(
                "La connexion prend trop de temps. Vérifiez votre configuration Supabase (Client Secret).",
              );
            }
          }, 5000);
        }

        // Nettoyer l'abonnement au démontage
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        logger.error("Exception lors du traitement du callback", "auth", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
      }
    };

    handleCallback();
  }, [navigate, status]);

  return (
    <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion en cours...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
              <p className="text-center text-muted-foreground">Traitement de votre connexion...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-green-800">
                  ✅ Connexion réussie ! Redirection en cours...
                </AlertDescription>
              </Alert>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Erreur :</strong>{" "}
                  {errorMessage || "Une erreur est survenue lors de la connexion."}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Aller au dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
