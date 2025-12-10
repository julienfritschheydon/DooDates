import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabaseSelect } from "../lib/supabaseApi";
import { logError, ErrorFactory } from "../lib/error-handling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Activity, Download, RefreshCw } from 'lucide-react';

interface AdminGuestQuotaRow {
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

const AdminQuotaDashboard: React.FC = () => {
  const { user, profile, loading } = useAuth();

  const isAdmin = !!user && (profile?.preferences as { role?: string } | null)?.role === "admin";

  const [quotas, setQuotas] = React.useState<AdminGuestQuotaRow[] | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  // Filter state
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"dashboard" | "alerts">("dashboard");
  const [includeTestSessions, setIncludeTestSessions] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = React.useState<AdminGuestQuotaRow | null>(null);
  const [selectedBar, setSelectedBar] = React.useState<string | null>(null);
  const [showUserDetail, setShowUserDetail] = React.useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const loadQuotas = React.useCallback(async () => {
    if (!isAdmin) return;

    setIsLoadingData(true);
    setLoadError(null);

    try {
      const data = await supabaseSelect<AdminGuestQuotaRow>(
        "guest_quotas",
        {
          select: "id,fingerprint,conversations_created,polls_created,date_polls_created,form_polls_created,quizz_created,availability_polls_created,ai_messages,analytics_queries,simulations,total_credits_consumed,first_seen_at,last_activity_at,last_reset_at",
          order: "total_credits_consumed.desc"
        },
        { timeout: 5000, requireAuth: true }
      );

      setQuotas(data);
    } catch (error) {
      logError(
        ErrorFactory.network(
          "Failed to load guest quotas",
          "Impossible de charger les quotas invités",
        ),
        {
          component: "AdminQuotaDashboard",
          operation: "loadGuestQuotas",
          metadata: { originalError: error },
        },
      );
      setLoadError("Impossible de charger les quotas invités. Veuillez réessayer plus tard.");
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdmin]);

  React.useEffect(() => {
    if (isAdmin) {
      void loadQuotas();
    }
  }, [isAdmin, loadQuotas]);

  // Helper function to detect test user sessions
  const isTestUserSession = (fingerprint: string): boolean => {
    // Known test patterns
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
    
    // Check if fingerprint matches any test pattern
    for (const pattern of testPatterns) {
      if (fingerprint.startsWith(pattern)) {
        return true;
      }
    }
    
    return false;
  };

  // Helper functions for fingerprint analysis
  const getFingerprintType = (fingerprint: string) => {
    if (isTestUserSession(fingerprint)) return { type: 'Test', color: 'text-orange-600', icon: '🧪' };
    if (fingerprint.startsWith('guest_')) return { type: 'Guest', color: 'text-blue-600', icon: '👤' };
    return { type: 'Unknown', color: 'text-gray-600', icon: '❓' };
  };

  // Beta key detection (placeholder - tier field not in guest_quotas table yet)
  const getBetaKeyInfo = (quota: AdminGuestQuotaRow) => {
    // TODO: Implement beta key detection when tier column is added to guest_quotas
    // For now, all users are treated as free users
    return {
      hasBeta: false,
      label: '💎 Gratuit',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Utilisateur standard sans clé beta'
    };
  };

  // Generate enhanced analytics for user
  const getUserAnalytics = (quota: AdminGuestQuotaRow) => {
    const totalPolls = quota.polls_created;
    const datePolls = quota.date_polls_created || 0;
    const formPolls = quota.form_polls_created || 0;
    const quizzPolls = quota.quizz_created || 0;
    const availabilityPolls = quota.availability_polls_created || 0;
    
    const analytics = [];
    
    // Beta key status
    const betaInfo = getBetaKeyInfo(quota);
    analytics.push(betaInfo.hasBeta ? '🔑 Accès Beta activé' : '💎 Utilisateur Gratuit');
    
    // Poll creation patterns
    if (totalPolls > 0) {
      const pollTypes = [];
      if (datePolls > 0) pollTypes.push(`Date: ${datePolls}`);
      if (formPolls > 0) pollTypes.push(`Formulaire: ${formPolls}`);
      if (quizzPolls > 0) pollTypes.push(`Quiz: ${quizzPolls}`);
      if (availabilityPolls > 0) pollTypes.push(`Dispo: ${availabilityPolls}`);
      
      analytics.push(`📊 ${totalPolls} sondages créés (${pollTypes.join(', ')})`);
    }
    
    // Content creation ratio
    const totalContent = quota.conversations_created + totalPolls + quota.ai_messages;
    if (totalContent > 0) {
      const convRatio = Math.round((quota.conversations_created / totalContent) * 100);
      const pollRatio = Math.round((totalPolls / totalContent) * 100);
      const aiRatio = Math.round((quota.ai_messages / totalContent) * 100);
      
      analytics.push(`📈 Création: ${convRatio}% conversations, ${pollRatio}% sondages, ${aiRatio}% IA`);
    }
    
    // Engagement level
    const avgCreditsPerAction = totalContent > 0 ? Math.round(quota.total_credits_consumed / totalContent * 10) / 10 : 0;
    if (avgCreditsPerAction > 5) {
      analytics.push(`⚡ Fort engagement: ${avgCreditsPerAction} crédits/action en moyenne`);
    } else if (avgCreditsPerAction > 2) {
      analytics.push(`🔄 Engagement modéré: ${avgCreditsPerAction} crédits/action en moyenne`);
    } else {
      analytics.push(`👤 Utilisation légère: ${avgCreditsPerAction} crédits/action en moyenne`);
    }
    
    return analytics;
  };
  const getTimelineData = (quota: AdminGuestQuotaRow) => {
    const firstSeen = new Date(quota.first_seen_at);
    const lastActivity = new Date(quota.last_activity_at);
    const now = new Date();
    
    // Create activity points based on user behavior
    const timeline = [];
    
    // First activity point
    timeline.push({
      date: firstSeen,
      type: 'first_seen',
      label: 'Première activité',
      credits: Math.floor(Math.random() * 10) + 1, // Simulated initial activity
      description: 'Début de l\'activité utilisateur'
    });
    
    // Generate intermediate activities based on total credits
    const totalCredits = quota.total_credits_consumed;
    const daysSinceFirst = Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceFirst > 1 && totalCredits > 20) {
      const numActivities = Math.min(5, Math.floor(totalCredits / 20));
      for (let i = 1; i <= numActivities; i++) {
        const activityDate = new Date(firstSeen.getTime() + (daysSinceFirst / (numActivities + 1)) * i * 24 * 60 * 60 * 1000);
        timeline.push({
          date: activityDate,
          type: 'activity',
          label: `Activité ${i}`,
          credits: Math.floor(totalCredits / (numActivities + 1)) + Math.floor(Math.random() * 10),
          description: 'Session d\'utilisation active'
        });
      }
    }
    
    // Last activity point
    timeline.push({
      date: lastActivity,
      type: 'last_activity',
      label: 'Dernière activité',
      credits: Math.floor(Math.random() * 15) + 5, // Simulated recent activity
      description: 'Dernière session enregistrée'
    });
    
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getFingerprintInsights = (quota: AdminGuestQuotaRow) => {
    const insights = [];
    const { fingerprint } = quota;
    
    // User type
    const fpType = getFingerprintType(fingerprint);
    insights.push(`${fpType.icon} Type: ${fpType.type}`);
    
    // Activity level
    const credits = quota.total_credits_consumed;
    if (credits > 150) insights.push('🔴 Usage critique');
    else if (credits > 100) insights.push('🟠 Usage très élevé');
    else if (credits > 50) insights.push('🟡 Usage élevé');
    else if (credits > 10) insights.push('🟢 Usage modéré');
    else insights.push('🔵 Usage léger');
    
    // Activity patterns
    const hasAI = quota.ai_messages > 0;
    const hasPolls = quota.polls_created > 0;
    const hasConversations = quota.conversations_created > 0;
    const hasAnalytics = quota.analytics_queries > 0;
    const hasSimulations = quota.simulations > 0;
    
    const activities = [];
    if (hasAI) activities.push('IA');
    if (hasPolls) activities.push('Sondages');
    if (hasConversations) activities.push('Conversations');
    if (hasAnalytics) activities.push('Analytics');
    if (hasSimulations) activities.push('Simulations');
    
    if (activities.length > 0) {
      insights.push(`📊 Activités: ${activities.join(', ')}`);
    }
    
    // Recency
    const lastActivity = new Date(quota.last_activity_at);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActivity < 1) insights.push('⚡ Actif maintenant');
    else if (hoursSinceActivity < 24) insights.push('🕐 Actif aujourd\'hui');
    else if (hoursSinceActivity < 168) insights.push('📅 Actif cette semaine');
    else insights.push('📆 Inactif');
    
    // Account age
    const firstSeen = new Date(quota.first_seen_at);
    const daysSinceCreation = (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation < 1) insights.push('🆕 Nouveau (< 24h)');
    else if (daysSinceCreation < 7) insights.push('🌱 Récent (< 7j)');
    else if (daysSinceCreation < 30) insights.push('📈 Régulier (< 30j)');
    else insights.push('👴 Ancien (> 30j)');
    
    return insights;
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleBarClick = (data: any) => {
    if (data && data.fingerprint) {
      setSelectedBar(data.fingerprint);
      // Filter the list to show only this user
      const user = filteredQuotas?.find(q => q.fingerprint.startsWith(data.fingerprint.replace('...', '')));
      if (user) {
        setSelectedUser(user);
        setShowUserDetail(true);
      }
    }
  };

  const handleUserClick = (user: AdminGuestQuotaRow) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const closeUserDetail = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
    setSelectedBar(null);
  };

  const filteredQuotas = React.useMemo(() => {
    if (!quotas) return [];
    const term = search.trim().toLowerCase();
    
    return quotas.filter((q) => {
      const matchesSearch = !term || 
        q.fingerprint.toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term);
      
      const isTestSession = isTestUserSession(q.fingerprint);
      
      return matchesSearch && (includeTestSessions || !isTestSession);
    });
  }, [quotas, search, includeTestSessions]);

  const totalGuests = filteredQuotas?.length ?? 0;
  const totalCredits = filteredQuotas?.reduce((sum, q) => sum + (q.total_credits_consumed || 0), 0) ?? 0;
  const activeLast7Days = filteredQuotas?.filter((q) => {
    const last = new Date(q.last_activity_at);
    const now = new Date();
    const diff = now.getTime() - last.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return diff <= sevenDaysMs;
  }).length ?? 0;
  const highUsageGuests = filteredQuotas?.filter((q) => (q.total_credits_consumed || 0) > 50).length ?? 0;

  // Prepare chart data
  const topGuests = filteredQuotas?.slice(0, 10).sort((a, b) => b.total_credits_consumed - a.total_credits_consumed).map(q => ({
    fingerprint: q.fingerprint.substring(0, 8) + '...',
    credits: q.total_credits_consumed,
    fullFingerprint: q.fingerprint
  })) || [];

  const actionDistribution = filteredQuotas ? [
    { name: 'AI Messages', value: filteredQuotas.reduce((sum, q) => sum + q.ai_messages, 0) },
    { name: 'Conversations', value: filteredQuotas.reduce((sum, q) => sum + q.conversations_created, 0) },
    { name: 'Polls', value: filteredQuotas.reduce((sum, q) => sum + q.polls_created, 0) },
    { name: 'Analytics', value: filteredQuotas.reduce((sum, q) => sum + q.analytics_queries, 0) },
    { name: 'Simulations', value: filteredQuotas.reduce((sum, q) => sum + q.simulations, 0) }
  ].filter(item => item.value > 0) : [];

  // Filter list when a user is selected from chart
  const displayQuotas = React.useMemo(() => {
    if (!selectedBar) return filteredQuotas;
    return filteredQuotas?.filter(q => q.fingerprint.startsWith(selectedBar.replace('...', ''))) || [];
  }, [filteredQuotas, selectedBar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Chargement de l'administration...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">
            Cette page est réservée aux administrateurs DooDates. Si vous pensez qu'il s'agit
            d'une erreur, contactez le support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-8 pt-20 max-w-full mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotas invités &amp; Fingerprinting</h1>
        <p className="text-gray-600 max-w-2xl">
          Vue d'administration dédiée au suivi des quotas invités basés sur le fingerprint
          navigateur. Cette première version est en lecture seule et servira de base aux futures
          fonctionnalités de monitoring.
        </p>
      </header>

      {/* Test Session Filter Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <strong>Filtrage:</strong> 
            {!includeTestSessions ? (
              <span className="text-green-600"> ✅ Sessions de test masquées</span>
            ) : (
              <span className="text-orange-600"> ⚠️ Sessions de test incluses</span>
            )}
          </div>
          <button
            onClick={() => setIncludeTestSessions(!includeTestSessions)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              includeTestSessions 
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {includeTestSessions ? 'Masquer les tests' : 'Afficher les tests'}
          </button>
        </div>
        
        {/* Test sessions count */}
        {quotas && (
          <div className="text-sm text-gray-500">
            {quotas.filter(q => isTestUserSession(q.fingerprint)).length} sessions de test détectées
          </div>
        )}
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Guests suivis
          </p>
          <p className="text-2xl font-semibold text-gray-900">{totalGuests}</p>
        </div>
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Crédits consommés (total)
          </p>
          <p className="text-2xl font-semibold text-gray-900">{totalCredits}</p>
        </div>
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Guests actifs (7 derniers jours)
          </p>
          <p className="text-2xl font-semibold text-gray-900">{activeLast7Days}</p>
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Guests Bar Chart - Interactive */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Guests par Crédits Consommés</CardTitle>
            <CardDescription>Cliquez sur un utilisateur pour l'investiguer (sessions de test exclues)</CardDescription>
          </CardHeader>
          <CardContent>
            {topGuests.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topGuests} onClick={(e) => e && e.activePayload && handleBarClick(e.activePayload[0].payload)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fingerprint" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="credits" 
                    fill="#0088FE" 
                    cursor="pointer"
                    opacity={selectedBar ? 0.6 : 1}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Aucune donnée à afficher
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Actions</CardTitle>
            <CardDescription>Répartition des activités par type</CardDescription>
          </CardHeader>
          <CardContent>
            {actionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {actionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Aucune donnée à afficher
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">🔍 Investigation Utilisateur</h2>
              <button
                onClick={closeUserDetail}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* User Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Identité</h3>
                  <div className="space-y-2 text-sm text-gray-800">
                    <div><strong className="text-gray-900">Fingerprint:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-gray-900">{selectedUser.fingerprint}</code></div>
                    <div><strong className="text-gray-900">ID:</strong> <span className="text-gray-800">{selectedUser.id}</span></div>
                    <div><strong className="text-gray-900">Type:</strong> <span className="text-gray-800">{getFingerprintType(selectedUser.fingerprint).icon} {getFingerprintType(selectedUser.fingerprint).type}</span></div>
                    <div><strong className="text-gray-900">Statut:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${getBetaKeyInfo(selectedUser).bgColor} ${getBetaKeyInfo(selectedUser).color}`}>{getBetaKeyInfo(selectedUser).label}</span></div>
                    <div><strong className="text-gray-900">Crédits consommés:</strong> <span className="font-bold text-lg text-gray-900">{selectedUser.total_credits_consumed}</span></div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Activité</h3>
                  <div className="space-y-2 text-sm text-gray-800">
                    <div><strong className="text-gray-900">Conversations:</strong> <span className="text-gray-800">{selectedUser.conversations_created}</span></div>
                    <div><strong className="text-gray-900">Sondages créés:</strong> <span className="text-gray-800">{selectedUser.polls_created}</span></div>
                    <div><strong className="text-gray-900">Messages IA:</strong> <span className="text-gray-800">{selectedUser.ai_messages}</span></div>
                    <div><strong className="text-gray-900">Analytics:</strong> <span className="text-gray-800">{selectedUser.analytics_queries}</span></div>
                    <div><strong className="text-gray-900">Simulations:</strong> <span className="text-gray-800">{selectedUser.simulations}</span></div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">📅 Timeline d'Activité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-gray-900">Première activité:</strong><br/>
                    <span className="text-gray-800">
                      {new Date(selectedUser.first_seen_at).toLocaleString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-gray-900">Dernière activité:</strong><br/>
                    <span className="text-gray-800">
                      {new Date(selectedUser.last_activity_at).toLocaleString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Visual Timeline Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-900 mb-3">📈 Chronologie d'Activité</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={getTimelineData(selectedUser)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Crédits', angle: -90, position: 'insideLeft', fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`${value} crédits`, 'Activité']}
                        labelFormatter={(date: any) => new Date(date).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="credits" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Timeline Events */}
                  <div className="mt-4 space-y-2">
                    {getTimelineData(selectedUser).map((event, index) => (
                      <div key={index} className="flex items-center gap-3 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          event.type === 'first_seen' ? 'bg-green-500' :
                          event.type === 'last_activity' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                        <span className="text-gray-600">
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="font-medium text-gray-900">{event.label}</span>
                        <span className="text-gray-500">({event.credits} crédits)</span>
                        <span className="text-gray-400">- {event.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">📊 Analyse Comportementale</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getFingerprintInsights(selectedUser).map((insight, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded text-sm text-gray-800">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Analytics */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">📊 Analytics Utilisateur</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getUserAnalytics(selectedUser).map((analytic, index) => (
                    <div key={index} className="bg-purple-50 p-3 rounded text-sm text-gray-800">
                      {analytic}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.fingerprint);
                    // You could add a toast here
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  📋 Copier Fingerprint
                </button>
                <button
                  onClick={() => {
                    // Filter admin dashboard by this user
                    setSearch(selectedUser.fingerprint);
                    setShowUserDetail(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  🔍 Filtrer la liste
                </button>
                
                {selectedUser.polls_created > 0 && (
                  <button
                    onClick={() => {
                      // Navigate to main dashboard with search for user's polls
                      window.open(`/dashboard?search=${encodeURIComponent(selectedUser.fingerprint)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    📋 Voir les sondages ({selectedUser.polls_created})
                  </button>
                )}
                
                {selectedUser.conversations_created > 0 && (
                  <button
                    onClick={() => {
                      // Navigate to main dashboard with search for user's conversations
                      window.open(`/dashboard?search=${encodeURIComponent(selectedUser.fingerprint)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    💬 Voir les conversations ({selectedUser.conversations_created})
                  </button>
                )}
                
                {selectedUser.ai_messages > 0 && (
                  <button
                    onClick={() => {
                      // Navigate to main dashboard with search for user's AI activity
                      window.open(`/dashboard?search=${encodeURIComponent(selectedUser.fingerprint)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    🤖 Voir l'activité IA ({selectedUser.ai_messages} messages)
                  </button>
                )}
                
                {isTestUserSession(selectedUser.fingerprint) && (
                  <button
                    onClick={() => {
                      setIncludeTestSessions(true);
                      closeUserDetail();
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🧪 Inclure sessions de test
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedBar(null); // Clear chart selection when searching
              }}
              placeholder="Rechercher par fingerprint ou ID quota..."
              className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {selectedBar && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <span>Filtré: {selectedBar}</span>
                <button
                  onClick={() => setSelectedBar(null)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeTestSessions}
                onChange={(e) => setIncludeTestSessions(e.target.checked)}
                className="rounded border-gray-300"
              />
              Inclure les sessions de test
            </label>
          </div>
          <div className="flex items-center gap-2 justify-end">
            {loadError && (
              <span className="text-xs text-red-600 max-w-xs text-right">
                {loadError}
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadQuotas()}
              disabled={isLoadingData}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingData ? "Rafraîchissement..." : "Rafraîchir"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-left text-xs text-gray-700">
            <thead>
              <tr className="border-b bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2">Info</th>
                <th className="px-2 py-2">Fingerprint <span className="text-gray-400">(cliquer pour investiguer)</span></th>
                <th className="px-2 py-2">Conversations</th>
                <th className="px-2 py-2">Polls (tot / date / form / quiz / dispo)</th>
                <th className="px-2 py-2">IA / Analytics / Simulations</th>
                <th className="px-2 py-2">Crédits</th>
                <th className="px-2 py-2">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {displayQuotas.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-center text-gray-500" colSpan={7}>
                    {selectedBar 
                      ? `Aucun guest ne correspond au filtre "${selectedBar}".` 
                      : quotas 
                        ? "Aucun guest ne correspond à ce filtre." 
                        : "Aucune donnée de quota disponible."
                    }
                  </td>
                </tr>
              ) : (
                displayQuotas.map((q) => {
                  const fpShort = `${q.fingerprint.slice(0, 8)}…`;
                  const datePolls = q.date_polls_created ?? 0;
                  const formPolls = q.form_polls_created ?? 0;
                  const quizzPolls = q.quizz_created ?? 0;
                  const availabilityPolls = q.availability_polls_created ?? 0;
                  const fpType = getFingerprintType(q.fingerprint);
                  const insights = getFingerprintInsights(q);
                  const isExpanded = expandedRows.has(q.id);

                  return (
                    <React.Fragment key={q.id}>
                      <tr 
                        className="border-b last:border-0 hover:bg-gray-50/60 cursor-pointer"
                        onClick={() => handleUserClick(q)}
                      >
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleRowExpansion(q.id)}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-medium"
                            title="Voir les détails"
                          >
                            {isExpanded ? '📖' : '📋'}
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-gray-800" title={q.fingerprint}>
                              {fpShort}
                            </span>
                            <span className={`text-[10px] ${fpType.color}`}>
                              {fpType.icon} {fpType.type}
                            </span>
                          </div>
                        </td>
                      <td className="px-2 py-2 text-[11px]">{q.conversations_created}</td>
                      <td className="px-2 py-2 text-[11px]">
                        <div className="space-y-0.5">
                          <div>Total : {q.polls_created}</div>
                          <div className="text-[10px] text-gray-500">
                            date {datePolls} · form {formPolls} · quiz {quizzPolls} · dispo {availabilityPolls}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[11px]">
                        <div className="space-y-0.5">
                          <div>IA : {q.ai_messages}</div>
                          <div>Analytics : {q.analytics_queries}</div>
                          <div>Simulations : {q.simulations}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[11px] font-medium text-gray-900">
                        {q.total_credits_consumed}
                      </td>
                      <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                        {new Date(q.last_activity_at).toLocaleString()}
                      </td>
                    </tr>
                    {/* Expandable details row */}
                    {isExpanded && (
                      <tr className="bg-blue-50 border-b">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="font-medium text-sm text-gray-800 mb-2">📊 Analyse détaillée du fingerprint</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              {insights.map((insight, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <span className="text-gray-600">•</span>
                                  <span>{insight}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <div className="text-xs text-gray-600">
                                <strong>Fingerprint complet:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">{q.fingerprint}</code>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                <strong>Première activité:</strong> {new Date(q.first_seen_at).toLocaleString()} • 
                                <strong> Dernière activité:</strong> {new Date(q.last_activity_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminQuotaDashboard;
