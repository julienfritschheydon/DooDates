import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabaseSelect } from "../lib/supabaseApi";
import { logError, ErrorFactory } from "../lib/error-handling";
import { calculateTotalPollsCreated } from "../lib/quotaTracking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Calendar, MessageSquare, BarChart3, Brain, Search, FileText, Clock, TrendingUp, History, List } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserActivity {
  id: string;
  fingerprint: string;
  conversations_created: number;
  // polls_created supprimé - calculer à la volée avec calculateTotalPollsCreated()
  date_polls_created?: number | null;
  form_polls_created?: number | null;
  quizz_created?: number | null;
  availability_polls_created?: number | null;
  ai_messages: number;
  analytics_queries: number;
  simulations: number;
  total_credits_consumed: number;
  first_seen_at: string;
  last_activity_at: string;
  last_reset_at: string | null;
}

interface ConversationRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_id: string;
}

interface JournalEntryRow {
  id: string;
  created_at: string;
  action: string;
  credits: number;
  metadata: any;
  fingerprint: string;
}

// Action colors mapping (consistent with Dashboard)
const getActionColor = (action: string) => {
  switch (action) {
    case 'conversation_created': return 'bg-blue-500';
    case 'poll_created': return 'bg-green-500';
    case 'ai_message': return 'bg-purple-500';
    case 'analytics_query': return 'bg-orange-500';
    case 'simulation': return 'bg-pink-500';
    default: return 'bg-gray-400';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'conversation_created': return 'Nouvelle Conversation';
    case 'poll_created': return 'Nouveau Sondage';
    case 'ai_message': return 'Message IA';
    case 'analytics_query': return 'Analyse IA';
    case 'simulation': return 'Simulation';
    default: return action;
  }
};

const AdminUserActivity: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const fingerprint = searchParams.get('fingerprint');

  const isAdmin = !!user && (profile?.preferences as { role?: string } | null)?.role === "admin";

  const [userActivity, setUserActivity] = React.useState<UserActivity | null>(null);
  const [conversations, setConversations] = React.useState<ConversationRow[]>([]);
  const [journal, setJournal] = React.useState<JournalEntryRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Helper functions
  const isTestUserSession = (fingerprint: string): boolean => {
    const testPatterns = [
      'guest_suspicious_',
      'guest_active_',
      'guest_test_',
      'guest_demo_',
      'guest_dev_',
      'guest_high_usage_',
      'guest_medium_',
      'guest_normal_',
      'guest_low_',
    ];
    for (const pattern of testPatterns) {
      if (fingerprint.startsWith(pattern)) {
        return true;
      }
    }
    return false;
  };

  const getFingerprintType = (fingerprint: string) => {
    if (isTestUserSession(fingerprint)) return { type: 'Test', color: 'text-orange-600', icon: '🧪' };
    if (fingerprint.startsWith('guest_')) return { type: 'Guest', color: 'text-blue-600', icon: '👤' };
    return { type: 'Unknown', color: 'text-gray-600', icon: '❓' };
  };

  const loadUserActivity = React.useCallback(async () => {
    if (!isAdmin || !fingerprint) return;

    setIsLoading(true);
    setError(null);

    // Reset states
    setConversations([]);
    setJournal([]);

    try {
      // 1. Load user quota data (Summary) - Critical, fail if this fails
      const userData = await supabaseSelect<UserActivity>(
        "guest_quotas",
        {
          select: "*",
          fingerprint: `eq.${fingerprint}`
        },
        { timeout: 5000, requireAuth: true }
      );

      if (userData && userData.length > 0) {
        setUserActivity(userData[0]);
      } else {
        setError("Aucune activité trouvée pour cet utilisateur");
        // Don't stop here, try to load other data anyway
      }

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), { operation: 'Failed to load user quota', component: 'AdminUserActivity' });
      // This is non-critical for viewing logs, but important for context
    }

    // Parallel fetching for independent data
    const promises = [];

    // 2. Load Conversations
    // Only fetch if fingerprint is a valid UUID to avoid 400 errors on Supabase uuid column
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidPattern.test(fingerprint);

    if (isValidUUID) {
      const fetchConversations = async () => {
        try {
          const conversationsData = await supabaseSelect<ConversationRow>(
            "conversations",
            {
              select: "id,title,created_at,updated_at,message_count,user_id",
              user_id: `eq.${fingerprint}`,
              order: "updated_at.desc"
            },
            { timeout: 5000, requireAuth: true }
          );
          if (conversationsData) setConversations(conversationsData);
        } catch (e) {
          console.warn("Could not fetch conversations", e);
        }
      };
      promises.push(fetchConversations());
    } else {
      // Just for debugging/clarity
      console.log("Skipping conversations fetch: fingerprint is not a UUID (guest/hash detected)", fingerprint);
    }

    // 3. Load Activity Journal (Polls, etc.)
    const fetchJournal = async () => {
      try {
        console.log("Fetching journal for fingerprint:", fingerprint);
        const journalData = await supabaseSelect<JournalEntryRow>(
          "guest_quota_journal",
          {
            select: "*",
            fingerprint: `eq.${fingerprint}`,
            order: "created_at.desc",
            limit: "100"
          },
          { timeout: 5000, requireAuth: true }
        );
        if (journalData) {
          console.log("Journal data received:", journalData.length, "entries");
          setJournal(journalData);
        }
      } catch (e) {
        logError(e instanceof Error ? e : new Error(String(e)), { operation: 'Could not fetch journal', component: 'AdminUserActivity' });
      }
    };
    promises.push(fetchJournal());

    await Promise.all(promises);
    setIsLoading(false);

  }, [isAdmin, fingerprint]);

  React.useEffect(() => {
    if (isAdmin && fingerprint) {
      loadUserActivity();
    }
  }, [isAdmin, fingerprint, loadUserActivity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Accès réservé aux administrateurs
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!fingerprint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Aucun fingerprint spécifié
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.close()} // Assuming opened in new tab
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Fermer
              </Button>
              <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Activité Utilisateur
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                {getFingerprintType(fingerprint).icon} {getFingerprintType(fingerprint).type}
              </Badge>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-800 border border-slate-200">
                {fingerprint}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-slate-600">Chargement de l'activité utilisateur...</div>
          </div>
        ) : error && !userActivity ? (
          <Alert className="mb-6 bg-red-50 text-red-900 border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6 flex flex-col h-full">
            {/* Summary Card */}
            {userActivity && (
              <Card className="shrink-0 bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-slate-900">Vue d'ensemble</CardTitle>
                  <CardDescription className="text-slate-500">
                    Crédits consommés: <span className="font-bold text-slate-900">{userActivity.total_credits_consumed}</span> •
                    Dernière activité: {new Date(userActivity.last_activity_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-xs text-blue-700 font-medium uppercase">Conversations</span>
                      <span className="text-2xl font-bold text-blue-900">{userActivity.conversations_created}</span>
                    </div>
                    <div className="flex flex-col p-3 bg-green-50 rounded-lg border border-green-100">
                      <span className="text-xs text-green-700 font-medium uppercase">Sondages</span>
                      <span className="text-2xl font-bold text-green-900">{calculateTotalPollsCreated({
                        datePollsCreated: userActivity.date_polls_created || 0,
                        formPollsCreated: userActivity.form_polls_created || 0,
                        quizzCreated: userActivity.quizz_created || 0,
                        availabilityPollsCreated: userActivity.availability_polls_created || 0,
                      })}</span>
                    </div>
                    <div className="flex flex-col p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <span className="text-xs text-purple-700 font-medium uppercase">IA Calls</span>
                      <span className="text-2xl font-bold text-purple-900">{userActivity.ai_messages}</span>
                    </div>
                    <div className="flex flex-col p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <span className="text-xs text-orange-700 font-medium uppercase">Queries</span>
                      <span className="text-2xl font-bold text-orange-900">{userActivity.analytics_queries}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for Detailed Lists */}
            <Tabs defaultValue="conversations" className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="conversations" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                    <MessageSquare className="h-4 w-4" />
                    Conversations ({conversations.length})
                  </TabsTrigger>
                  <TabsTrigger value="journal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                    <History className="h-4 w-4" />
                    Historique Journal ({journal.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="conversations" className="flex-1 min-h-0 border border-slate-200 rounded-md bg-white shadow-sm mt-0">
                <ScrollArea className="h-[500px] md:h-full">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Aucune conversation trouvée.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {conversations.map((conv) => (
                        <div key={conv.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-slate-900">
                              {conv.title || "Sans titre"}
                            </h3>
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> {conv.message_count} messages
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Créé le {new Date(conv.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs font-mono text-slate-400">ID: {conv.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="journal" className="flex-1 min-h-0 border border-slate-200 rounded-md bg-white shadow-sm mt-0">
                <ScrollArea className="h-[500px] md:h-full">
                  {journal.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Aucun historique d'activité trouvé.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {journal.map((entry) => (
                        <div key={entry.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${getActionColor(entry.action)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-slate-900">
                                {getActionLabel(entry.action)}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(entry.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 mb-1">
                              Consommé: <span className="font-semibold text-slate-800">{entry.credits} crédit(s)</span>
                            </div>
                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div className="bg-slate-50 p-2 rounded text-xs font-mono text-slate-700 overflow-x-auto border border-slate-100">
                                {JSON.stringify(entry.metadata, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserActivity;
