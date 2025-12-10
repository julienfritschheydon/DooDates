import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabaseSelect } from "../lib/supabaseApi";
import { logError, ErrorFactory } from "../lib/error-handling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Calendar, MessageSquare, BarChart3, Brain, Search, FileText, Clock, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface UserActivity {
  id: string;
  fingerprint: string;
  conversations_created: number;
  polls_created: number;
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

const AdminUserActivity: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const fingerprint = searchParams.get('fingerprint');

  const isAdmin = !!user && (profile?.preferences as { role?: string } | null)?.role === "admin";

  const [userActivity, setUserActivity] = React.useState<UserActivity | null>(null);
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

    try {
      // Load user quota data
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
      }
    } catch (error) {
      logError(
        ErrorFactory.network(
          "Failed to load user activity - Impossible de charger l'activité utilisateur",
          error
        )
      );
      setError("Erreur lors du chargement de l'activité utilisateur");
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.close()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Activité Utilisateur
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getFingerprintType(fingerprint).icon} {getFingerprintType(fingerprint).type}
              </Badge>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {fingerprint.substring(0, 12)}...
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Chargement de l'activité utilisateur...</div>
          </div>
        ) : error ? (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : userActivity ? (
          <Card>
            <CardHeader>
              <CardTitle>Informations Utilisateur</CardTitle>
              <CardDescription>
                Détails de l'activité pour le fingerprint: {fingerprint}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Identité</h4>
                  <div className="space-y-1">
                    <div className="text-sm"><strong>Fingerprint:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{userActivity.fingerprint}</code></div>
                    <div className="text-sm"><strong>ID:</strong> {userActivity.id}</div>
                    <div className="text-sm"><strong>Type:</strong> {getFingerprintType(userActivity.fingerprint).icon} {getFingerprintType(userActivity.fingerprint).type}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Activité</h4>
                  <div className="space-y-1">
                    <div className="text-sm"><strong>Conversations:</strong> {userActivity.conversations_created}</div>
                    <div className="text-sm"><strong>Sondages:</strong> {userActivity.polls_created}</div>
                    <div className="text-sm"><strong>Messages IA:</strong> {userActivity.ai_messages}</div>
                    <div className="text-sm"><strong>Crédits consommés:</strong> <span className="font-bold">{userActivity.total_credits_consumed}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default AdminUserActivity;
