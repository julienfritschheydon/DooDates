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
    // Récupérer l'URL de redirection UNE SEULE FOIS au début
    // et la sauvegarder dans une variable pour éviter de la perdre
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);

    const returnToFromQuery = queryParams.get("returnTo");
    const returnToFromHash = hashParams.get("returnTo");
    const returnToFromStorage = localStorage.getItem("auth_return_to");

    // Sauvegarder la valeur AVANT de la supprimer
    const returnTo = returnToFromQuery || returnToFromHash || returnToFromStorage || "/dashboard";

    // Supprimer auth_return_to UNE SEULE FOIS après l'avoir récupéré
    if (returnToFromStorage) {
      localStorage.removeItem("auth_return_to");
    }

    // Fonction helper pour récupérer l'URL de redirection (utilise la valeur sauvegardée)
    const getReturnTo = () => returnTo;

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

    // Flag pour éviter les redirections multiples
    let redirectHandled = false;

    // Fonction helper pour rediriger
    const handleRedirect = () => {
      if (redirectHandled) {
        return;
      }
      redirectHandled = true;

      // Nettoyer le hash de l'URL
      window.history.replaceState(null, "", window.location.pathname + window.location.search);

      // Attendre un peu pour que AuthContext détecte la session
      setTimeout(() => {
        navigate(getReturnTo(), { replace: true });
      }, 500);
    };

    // Écouter les changements d'authentification avec onAuthStateChange
    // Supabase avec detectSessionInUrl: true traite automatiquement le hash de l'URL
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session && !redirectHandled) {
        setStatus("success");
        handleRedirect();
      } else if (event === "SIGNED_OUT") {
        setStatus("error");
        setErrorMessage("La connexion a échoué. Veuillez réessayer.");
      } else if (event === "TOKEN_REFRESHED" && session && !redirectHandled) {
        setStatus("success");
        handleRedirect();
      }
    });

    // Vérifier immédiatement la session au cas où Supabase l'aurait déjà traitée
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          return;
        }
        if (session && !redirectHandled) {
          setStatus("success");
          handleRedirect();
        }
      } catch (err) {
        logger.error("Exception lors de la vérification de session", "auth", err);
      }
    };

    // Vérifier immédiatement
    checkSession();

    // Polling pour vérifier périodiquement si la session est disponible
    // (au cas où Supabase traiterait le hash de manière asynchrone)
    let checkAttempts = 0;
    const maxAttempts = 20; // 20 tentatives × 500ms = 10 secondes max
    const checkInterval = setInterval(() => {
      if (redirectHandled) {
        clearInterval(checkInterval);
        return;
      }

      checkAttempts++;
      checkSession();

      if (checkAttempts >= maxAttempts) {
        clearInterval(checkInterval);
        if (!redirectHandled) {
          // Rediriger quand même (l'utilisateur pourra se reconnecter si nécessaire)
          handleRedirect();
        }
      }
    }, 500);

    // Timeout de sécurité : si après 10 secondes rien ne s'est passé, rediriger quand même
    const safetyTimeout = setTimeout(() => {
      if (!redirectHandled) {
        clearInterval(checkInterval);
        handleRedirect();
      }
    }, 10000);

    // Nettoyer l'abonnement et les timeouts au démontage
    return () => {
      subscription.unsubscribe();
      clearInterval(checkInterval);
      clearTimeout(safetyTimeout);
    };
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
