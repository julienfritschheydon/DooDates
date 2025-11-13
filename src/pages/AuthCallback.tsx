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

        if (error) {
          logger.error("Erreur OAuth callback", "auth", { error, errorDescription });
          setStatus("error");
          setErrorMessage(errorDescription || error || "Erreur lors de la connexion");
          return;
        }

        // Supabase gère automatiquement l'échange du code via getSession()
        // On attend un peu pour que Supabase traite le callback
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error("Erreur lors de la récupération de la session", "auth", sessionError);
          setStatus("error");
          setErrorMessage(sessionError.message || "Erreur lors de la récupération de la session");
          return;
        }

        if (session) {
          logger.info("Session OAuth récupérée avec succès", "auth", { userId: session.user.id });
          setStatus("success");

          // Rediriger vers la page de prototype calendrier après un court délai
          setTimeout(() => {
            navigate("/calendar-prototype", { replace: true });
          }, 1500);
        } else {
          logger.warn("Aucune session trouvée après le callback OAuth", "auth");
          setStatus("error");
          setErrorMessage("Aucune session trouvée. Veuillez réessayer.");
        }
      } catch (err) {
        logger.error("Exception lors du traitement du callback", "auth", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
      }
    };

    handleCallback();
  }, [navigate]);

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
                  onClick={() => navigate("/calendar-prototype")}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retour au prototype
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
