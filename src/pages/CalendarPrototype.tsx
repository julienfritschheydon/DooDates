import { useState } from "react";
import { googleCalendar } from "@/lib/google-calendar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Calendar, Clock, FileText } from "lucide-react";
import { logError, ErrorFactory } from "@/lib/error-handling";

export default function CalendarPrototype() {
  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Test lecture événements
  const testReadEvents = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEvents([]);
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = await googleCalendar.getEvents(startDate, endDate);
      setEvents(result);
      setSuccess(`✅ ${result.length} événement(s) récupéré(s) avec succès`);
      console.log("Événements récupérés:", result);
    } catch (err: any) {
      setError(`Erreur lecture événements: ${err.message || "Erreur inconnue"}`);
      logError(
        ErrorFactory.network(
          "Erreur lecture événements",
          "Impossible de lire les événements du calendrier",
        ),
        { context: { error: err } },
      );
    } finally {
      setLoading(false);
    }
  };

  // Test lecture créneaux occupés
  const testReadFreeBusy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setBusySlots([]);
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = await googleCalendar.getFreeBusy(startDate, endDate);
      setBusySlots(result);
      setSuccess(`✅ ${result.length} créneau(x) occupé(s) identifié(s)`);
      console.log("Créneaux occupés:", result);
    } catch (err: any) {
      setError(`Erreur lecture FreeBusy: ${err.message || "Erreur inconnue"}`);
      logError(
        ErrorFactory.network("Erreur lecture FreeBusy", "Impossible de lire les créneaux occupés"),
        { context: { error: err } },
      );
    } finally {
      setLoading(false);
    }
  };

  // Test création événement
  const testCreateEvent = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCreatedEvent(null);
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Demain
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h

      const event = await googleCalendar.createEvent({
        summary: "Test DooDates - Prototype Calendrier",
        description:
          "Événement créé automatiquement par le prototype DooDates. Vous pouvez le supprimer.",
        start: {
          dateTime: start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      setCreatedEvent(event);
      setSuccess(`✅ Événement créé avec succès ! ID: ${event.id}`);
      console.log("Événement créé:", event);
    } catch (err: any) {
      setError(`Erreur création événement: ${err.message || "Erreur inconnue"}`);
      logError(
        ErrorFactory.network(
          "Erreur création événement",
          "Impossible de créer l'événement dans le calendrier",
        ),
        { context: { error: err } },
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prototype Calendrier - Connexion requise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vous devez être connecté avec Google pour tester le prototype d'intégration
              calendrier.
            </p>
            <Button onClick={signInWithGoogle} className="w-full">
              Se connecter avec Google
            </Button>
            <Alert>
              <AlertDescription>
                <strong>Note :</strong> Cette connexion demandera les permissions de lecture et
                d'écriture sur votre Google Calendar.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prototype Calendrier Google
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button onClick={testReadEvents} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Test Lecture Événements
                </>
              )}
            </Button>
            <Button onClick={testReadFreeBusy} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Test Lecture FreeBusy
                </>
              )}
            </Button>
            <Button onClick={testCreateEvent} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Test Création Événement
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {events.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Événements récupérés ({events.length})
              </h3>
              <div className="bg-muted p-4 rounded-lg max-h-64 overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(
                    events.map((e) => ({
                      id: e.id,
                      summary: e.summary,
                      start: e.start?.dateTime || e.start?.date,
                      end: e.end?.dateTime || e.end?.date,
                    })),
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          )}

          {busySlots.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Créneaux occupés ({busySlots.length})
              </h3>
              <div className="bg-muted p-4 rounded-lg max-h-64 overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(
                    busySlots.map((slot) => ({
                      start: new Date(slot.start).toLocaleString("fr-FR"),
                      end: new Date(slot.end).toLocaleString("fr-FR"),
                    })),
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          )}

          {createdEvent && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Événement créé ✅
              </h3>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <pre className="text-sm">
                  {JSON.stringify(
                    {
                      id: createdEvent.id,
                      summary: createdEvent.summary,
                      start: createdEvent.start?.dateTime || createdEvent.start?.date,
                      end: createdEvent.end?.dateTime || createdEvent.end?.date,
                      htmlLink: createdEvent.htmlLink,
                    },
                    null,
                    2,
                  )}
                </pre>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vérifiez votre Google Calendar pour voir l'événement créé.
                  {createdEvent.htmlLink && (
                    <a
                      href={createdEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Ouvrir dans Google Calendar →
                    </a>
                  )}
                </p>
              </div>
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Instructions :</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Testez d'abord la lecture pour vérifier que l'OAuth fonctionne</li>
                <li>Ensuite testez la création d'événement</li>
                <li>Vérifiez dans Google Calendar que l'événement apparaît bien</li>
                <li>Vous pouvez supprimer l'événement test depuis Google Calendar</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
