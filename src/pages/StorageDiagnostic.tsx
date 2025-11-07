import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import * as ConversationStorage from "@/lib/storage/ConversationStorageSimple";
import { getAllPolls } from "@/lib/pollStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  HardDrive, 
  User, 
  MessageSquare, 
  FileText,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface DiagnosticResult {
  localStorage: {
    conversations: number;
    polls: number;
    messages: number;
    conversationsList: any[];
    pollsList: any[];
  };
  supabase: {
    connected: boolean;
    user: any;
    conversations: any[];
    messages: any[];
    profile: any;
    errors: {
      conversations?: string;
      messages?: string;
      profile?: string;
    };
  };
  timestamp: string;
}

export default function StorageDiagnostic() {
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug: Log user state
  useEffect(() => {
    console.log('🔍 StorageDiagnostic - Auth State:', {
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
      hasUser: !!user
    });
  }, [user, authLoading]);

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check localStorage
      const conversations = ConversationStorage.getConversations();
      const polls = getAllPolls();
      const messagesObj = JSON.parse(localStorage.getItem('doodates_messages') || '{}');
      const messageCount = Object.keys(messagesObj).length;

      // 2. Check Supabase
      const supabaseResult = {
        connected: false,
        user: null,
        conversations: [],
        messages: [],
        profile: null,
        errors: {} as any
      };

      console.log('🔍 runDiagnostic - user state:', { 
        hasUser: !!user, 
        userId: user?.id,
        userEmail: user?.email
      });

      if (user?.id) {
        supabaseResult.connected = true;
        supabaseResult.user = {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        };
        console.log('✅ User detected, checking Supabase...', { userId: user.id });

        // Check conversations
        const { data: convs, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (convError) {
          supabaseResult.errors.conversations = `${convError.code}: ${convError.message}`;
        } else {
          supabaseResult.conversations = convs || [];
        }

        // Check messages
        const { data: msgs, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (msgError) {
          supabaseResult.errors.messages = `${msgError.code}: ${msgError.message}`;
        } else {
          supabaseResult.messages = msgs || [];
        }

        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          supabaseResult.errors.profile = `${profileError.code}: ${profileError.message}`;
        } else {
          supabaseResult.profile = profile;
        }
      }

      setResult({
        localStorage: {
          conversations: conversations.length,
          polls: polls.length,
          messages: messageCount,
          conversationsList: conversations.slice(0, 5),
          pollsList: polls.slice(0, 5)
        },
        supabase: supabaseResult,
        timestamp: new Date().toISOString()
      });

      console.log('🎯 Diagnostic complete:', {
        connected: supabaseResult.connected,
        userEmail: supabaseResult.user?.email,
        conversationsCount: supabaseResult.conversations.length,
        hasErrors: Object.keys(supabaseResult.errors).length > 0
      });
    } catch (error: any) {
      logError(ErrorFactory.system('Erreur diagnostic', 'Impossible de charger les données de diagnostic'), {
        component: 'StorageDiagnostic',
        operation: 'runDiagnostic',
        error
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Ne lancer le diagnostic que si l'auth est chargé
    if (!authLoading) {
      runDiagnostic();
    }
  }, [user, authLoading]);

  const getStatusIcon = (hasError: boolean, hasData: boolean) => {
    if (hasError) return <XCircle className="h-5 w-5 text-red-500" />;
    if (hasData) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (hasError: boolean, hasData: boolean) => {
    if (hasError) return <Badge variant="destructive">Erreur</Badge>;
    if (hasData) return <Badge className="bg-green-500">OK</Badge>;
    return <Badge variant="secondary">Vide</Badge>;
  };

  if (authLoading || !result) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <div className="text-center">
              <p className="text-lg text-gray-900 mb-2">
                {authLoading ? 'Vérification de l\'authentification...' : 'Diagnostic en cours...'}
              </p>
              <p className="text-sm text-gray-600">
                {authLoading ? 'Chargement de votre session' : 'Analyse de vos données'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">🔍 Diagnostic de Stockage</h1>
              <p className="text-gray-700">
                Vérification complète de vos données localStorage et Supabase
              </p>
            </div>
            <Button onClick={runDiagnostic} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Dernière mise à jour : {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <HardDrive className="h-4 w-4 text-blue-600" />
                localStorage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {result.localStorage.conversations + result.localStorage.polls}
              </div>
              <p className="text-xs text-gray-600">éléments stockés localement</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <Database className="h-4 w-4 text-purple-600" />
                Supabase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {result.supabase.connected ? result.supabase.conversations.length : 0}
              </div>
              <p className="text-xs text-gray-600">
                {result.supabase.connected ? 'conversations en base' : 'non connecté'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                <User className="h-4 w-4 text-green-600" />
                Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {result.supabase.connected ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">Connecté</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-900">Invité</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {result.supabase.user?.email || 'Mode invité'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {!result.supabase.connected && (
          <Alert className="mb-6 border-yellow-400 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-gray-900 font-semibold">Mode Invité</AlertTitle>
            <AlertDescription className="text-gray-700">
              Vous n'êtes pas connecté. Vos données sont uniquement stockées dans le navigateur et
              seront perdues si vous videz le cache ou changez d'appareil.
            </AlertDescription>
          </Alert>
        )}

        {Object.keys(result.supabase.errors).length > 0 && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-400">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-gray-900 font-semibold">Erreurs Supabase détectées</AlertTitle>
            <AlertDescription className="text-gray-700">
              <div className="mt-2 space-y-1">
                {Object.entries(result.supabase.errors).map(([key, error]) => (
                  <div key={key} className="text-sm text-gray-800">
                    <strong>{key}:</strong> {error}
                  </div>
                ))}
              </div>
              <Button
                className="mt-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                size="sm"
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le Dashboard Supabase
              </Button>
              <p className="text-sm mt-2 text-gray-800">
                💡 <strong>Solution :</strong> Exécutez le script{' '}
                <code className="bg-red-100 px-1 py-0.5 rounded text-gray-900">sql-scripts/fix-400-errors.sql</code>{' '}
                dans le SQL Editor de Supabase.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* localStorage Section */}
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-gray-900">localStorage (Stockage Local)</CardTitle>
              </div>
              {getStatusBadge(
                false,
                result.localStorage.conversations > 0 || result.localStorage.polls > 0
              )}
            </div>
            <CardDescription className="text-gray-600">
              Données stockées dans votre navigateur (temporaire)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">{result.localStorage.conversations}</div>
                  <div className="text-sm text-gray-700">Conversations</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold text-gray-900">{result.localStorage.polls}</div>
                  <div className="text-sm text-gray-700">Formulaires</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <Database className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">{result.localStorage.messages}</div>
                  <div className="text-sm text-gray-700">Conversations avec messages</div>
                </div>
              </div>
            </div>

            {result.localStorage.conversationsList.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-900">Dernières conversations :</h4>
                <div className="space-y-2">
                  {result.localStorage.conversationsList.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm border border-gray-200"
                    >
                      <span className="truncate flex-1 text-gray-900">{conv.title}</span>
                      <Badge variant="outline" className="text-xs bg-white text-gray-900 border-gray-300">
                        {conv.userId === 'guest' ? 'Invité' : 'Utilisateur'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.localStorage.pollsList.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-gray-900">Derniers formulaires :</h4>
                <div className="space-y-2">
                  {result.localStorage.pollsList.map((poll) => (
                    <div
                      key={poll.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm border border-gray-200"
                    >
                      <span className="truncate flex-1 text-gray-900">{poll.title}</span>
                      <Badge variant="outline" className="text-xs bg-white text-gray-900 border-gray-300">
                        {poll.type || 'form'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supabase Section */}
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-gray-900">Supabase (Base de Données)</CardTitle>
              </div>
              {getStatusBadge(
                Object.keys(result.supabase.errors).length > 0,
                result.supabase.connected && result.supabase.conversations.length > 0
              )}
            </div>
            <CardDescription className="text-gray-600">
              Données stockées dans la base de données (permanent)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result.supabase.connected ? (
              <div className="text-center py-8 text-gray-700">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50 text-gray-400" />
                <p className="text-gray-900">Vous devez être connecté pour voir les données Supabase</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => (window.location.href = '/auth')}>
                  Se connecter
                </Button>
              </div>
          ) : (
            <>
                {/* User Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Utilisateur connecté</span>
                  </div>
                  <div className="text-sm space-y-1 ml-7 text-gray-800">
                    <div>
                      <strong className="text-gray-900">Email :</strong> {result.supabase.user?.email}
                    </div>
                    <div>
                      <strong className="text-gray-900">ID :</strong>{' '}
                      <code className="text-xs bg-white px-1 py-0.5 rounded text-gray-900 border border-gray-200">
                        {result.supabase.user?.id?.substring(0, 20)}...
                      </code>
                    </div>
                  </div>
                </div>

                {/* Profile Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {getStatusIcon(
                    !!result.supabase.errors.profile,
                    !!result.supabase.profile
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Profil utilisateur</div>
                    <div className="text-sm text-gray-700">
                      {result.supabase.errors.profile
                        ? result.supabase.errors.profile
                        : result.supabase.profile
                          ? `Plan: ${result.supabase.profile.plan_type || 'free'}`
                          : 'Profil trouvé'}
                    </div>
                  </div>
                </div>

                {/* Conversations Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {getStatusIcon(
                    !!result.supabase.errors.conversations,
                    result.supabase.conversations.length > 0
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Conversations ({result.supabase.conversations.length})
                    </div>
                    <div className="text-sm text-gray-700">
                      {result.supabase.errors.conversations ||
                        `${result.supabase.conversations.length} conversations en base de données`}
                    </div>
                  </div>
                </div>

                {/* Messages Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {getStatusIcon(
                    !!result.supabase.errors.messages,
                    result.supabase.messages.length > 0
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Messages ({result.supabase.messages.length})</div>
                    <div className="text-sm text-gray-700">
                      {result.supabase.errors.messages ||
                        `${result.supabase.messages.length} messages en base de données`}
                    </div>
                  </div>
                </div>

                {/* Conversations List */}
                {result.supabase.conversations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-gray-900">Conversations en base :</h4>
                    <div className="space-y-2">
                      {result.supabase.conversations.slice(0, 5).map((conv: any) => (
                        <div
                          key={conv.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm border border-gray-200"
                        >
                          <span className="truncate flex-1 text-gray-900">{conv.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-white text-gray-900 border-gray-300">
                              {conv.message_count || 0} msg
                            </Badge>
                            <Badge
                              variant={conv.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs bg-white text-gray-900 border-gray-300"
                            >
                              {conv.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">🎯 Résumé et Recommandations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.supabase.connected && result.supabase.conversations.length > 0 ? (
              <Alert className="border-green-400 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-gray-900 font-semibold">✅ Tout fonctionne correctement !</AlertTitle>
                <AlertDescription className="text-gray-700">
                  Vos données sont sauvegardées en base de données Supabase. Elles sont sécurisées et
                  synchronisées entre vos appareils.
                </AlertDescription>
              </Alert>
            ) : result.supabase.connected &&
              Object.keys(result.supabase.errors).length > 0 ? (
              <Alert variant="destructive" className="bg-red-50 border-red-400">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-gray-900 font-semibold">⚠️ Erreurs détectées</AlertTitle>
                <AlertDescription className="text-gray-700">
                  <p className="mb-2 text-gray-800">
                    Vos données sont sauvegardées mais certaines opérations échouent.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">Actions recommandées :</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800">
                      <li>
                        Ouvrez le{' '}
                        <a
                          href="https://supabase.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 hover:text-blue-800"
                        >
                          Dashboard Supabase
                        </a>
                      </li>
                      <li>Allez dans "SQL Editor" &gt; "New query"</li>
                      <li>
                        Copiez le contenu du fichier{' '}
                        <code className="bg-red-100 px-1 py-0.5 rounded text-gray-900">
                          sql-scripts/fix-400-errors.sql
                        </code>
                      </li>
                      <li>Exécutez le script (Run ou Ctrl+Enter)</li>
                      <li>Actualisez cette page</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-400 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-gray-900 font-semibold">⚠️ Mode invité</AlertTitle>
                <AlertDescription className="text-gray-700">
                  <p className="mb-2 text-gray-800">Vos données sont uniquement stockées localement.</p>
                  <p className="text-sm text-gray-800">
                    <strong>Connectez-vous</strong> pour sauvegarder vos données en base de données
                    et les synchroniser entre vos appareils.
                  </p>
                  <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={() => (window.location.href = '/auth')}>
                    Se connecter maintenant
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-700 space-y-2 mt-4">
              <p>
                <strong className="text-gray-900">💡 Conseil :</strong> Pour une meilleure sécurité et synchronisation,
                connectez-vous avec un compte utilisateur.
              </p>
              <p>
                <strong className="text-gray-900">📚 Documentation :</strong> Consultez le fichier{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-900">DIAGNOSTIC_CONSOLE.md</code> pour plus d'informations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

