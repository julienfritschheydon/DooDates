import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Search,
  AlertTriangle,
  UserX,
  ShieldAlert,
  Fingerprint,
  Info,
  Clock,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

type TimeRange = "24h" | "7d" | "30d" | "all";

interface GuestQuota {
  id: string;
  fingerprint: string;
  ip_address: string; // Hashé en prod
  user_agent: string;
  first_seen_at: string;
  last_activity_at: string;
  total_credits_consumed: number;
  polls_created: number; // Conserved for display compatibility
  date_polls_created: number;
  form_polls_created: number;
  quizz_created: number;
  availability_polls_created: number; // Added
  conversations_created: number;
  ai_messages: number;
  analytics_queries: number;
  simulations: number;
  is_blocked: boolean;
  blocked_until: string | null;
  blocked_reason: string | null;
}

interface QuotaJournalEntry {
  id: string;
  fingerprint: string;
  action_type: string;
  cost: number;
  resource_id: string | null;
  created_at: string;
  metadata: any;
}

const POLL_TYPE_COLORS = {
  date: "#3b82f6", // blue-500
  form: "#8b5cf6", // violet-500
  quizz: "#ec4899", // pink-500
  availability: "#10b981", // emerald-500
};

const AdminQuotaDashboard: React.FC = () => {
  const { user } = useAuth();
  const [quotas, setQuotas] = useState<GuestQuota[]>([]);
  const [journal, setJournal] = useState<QuotaJournalEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // New state for test sessions filtering
  const [includeTestSessions, setIncludeTestSessions] = useState(false);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  // Vérification basique admin (à renforcer backend)
  useEffect(() => {
    if (user?.email?.endsWith("@doodates.com") || user?.email === "admin@doodates.com") {
      setIsAdmin(true);
      void loadQuotas();
    }
  }, [user]);

  const loadQuotas = async () => {
    setIsLoadingData(true);
    setLoadError(null);
    try {
      // 1. Charger les quotas actuels
      const { data: qData, error: qError } = await supabase
        .from("guest_quotas")
        .select("*")
        .order("last_activity_at", { ascending: false })
        .limit(100);

      if (qError) throw qError;

      // 2. Charger le journal récent
      const timeFilter =
        timeRange === "24h"
          ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          : timeRange === "7d"
            ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: jData, error: jError } = await supabase
        .from("guest_quota_journal")
        .select("*")
        .gte("created_at", timeFilter)
        .order("created_at", { ascending: false })
        .limit(500); // Increased limit for better stats

      if (jError) throw jError;

      setQuotas(qData || []);
      setJournal(jData || []);
    } catch (err: any) {
      logger.error("Failed to load admin quota data", "quota", err);
      setLoadError(err.message || "Erreur de chargement");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleBlockUser = async (fingerprint: string) => {
    if (!confirm("Bloquer cet utilisateur pour 24h ?")) return;
    try {
      const { error } = await supabase
        .from("guest_quotas")
        .update({
          is_blocked: true,
          blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          blocked_reason: "Admin action",
        })
        .eq("fingerprint", fingerprint);

      if (error) throw error;
      void loadQuotas();
    } catch (e) {
      alert("Erreur lors du blocage");
    }
  };

  const handleResetUser = async (fingerprint: string) => {
    if (!confirm("Réinitialiser les compteurs de cet utilisateur ?")) return;
    try {
      const { error } = await supabase
        .from("guest_quotas")
        .update({
          total_credits_consumed: 0,
          polls_created: 0,
          date_polls_created: 0, // Reset specific counters
          form_polls_created: 0,
          quizz_created: 0,
          availability_polls_created: 0, // Reset availability
          conversations_created: 0,
          ai_messages: 0,
          analytics_queries: 0,
          simulations: 0,
          is_blocked: false,
          blocked_until: null,
          blocked_reason: null,
        })
        .eq("fingerprint", fingerprint);

      if (error) throw error;
      void loadQuotas();
    } catch (e) {
      alert("Erreur lors de la réinitialisation");
    }
  };

  const handleDeleteUser = async (fingerprint: string) => {
    try {
      // 1. Delete journal entries first (foreign key constraint)
      const { error: journalError } = await supabase
        .from("guest_quota_journal")
        .delete()
        .eq("fingerprint", fingerprint);

      if (journalError) throw journalError;

      // 2. Delete quota entry
      const { error: quotaError } = await supabase
        .from("guest_quotas")
        .delete()
        .eq("fingerprint", fingerprint);

      if (quotaError) throw quotaError;

      setShowDeleteConfirm(null);
      void loadQuotas();
    } catch (e) {
      logger.error("Failed to delete user data", "quota", e);
      alert("Erreur lors de la suppression des données");
    }
  };

  // Helper to identify test sessions
  const isTestUserSession = (fingerprint: string): boolean => {
    // Known test patterns
    const testPatterns = [
      'guest_suspicious_',
      'guest_active_',
      'guest_test_',
      'guest_demo_',
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

  // Filtrer les quotas affichés
  const filteredQuotas = useMemo(() => {
    let filtered = quotas;

    // Filter by search query
    if (search) {
      const lSearch = search.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.fingerprint.toLowerCase().includes(lSearch) || q.id.toLowerCase().includes(lSearch),
      );
    }

    // Filter out test sessions unless included
    // Note: If explicitly searching for a test user, we include them regardless of the checkbox
    if (!includeTestSessions && !search) {
      filtered = filtered.filter((q) => !isTestUserSession(q.fingerprint));
    }

    return filtered;
  }, [quotas, search, includeTestSessions]);

  const displayQuotas = useMemo(() => {
    let filtered = filteredQuotas;
    if (selectedBar) {
      filtered = filtered.filter(q => q.fingerprint === selectedBar);
    }
    return filtered;
  }, [filteredQuotas, selectedBar]);

  // Stats agrégées
  const stats = useMemo(() => {
    const totalRequests = journal.length;
    const uniqueUsers = new Set(journal.map((j) => j.fingerprint)).size;
    const totalCredits = journal.reduce((sum, j) => sum + j.cost, 0);

    // Filter journal entries to exclude test sessions for stats if needed
    const relevantJournal = includeTestSessions
      ? journal
      : journal.filter(j => !isTestUserSession(j.fingerprint));

    const distribution = relevantJournal.reduce(
      (acc, curr) => {
        acc[curr.action_type] = (acc[curr.action_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const chartData = Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top consumers (from filtered quotas)
    const topConsumers = [...filteredQuotas]
      .sort((a, b) => b.total_credits_consumed - a.total_credits_consumed)
      .slice(0, 5)
      .map((q) => ({
        name: q.fingerprint.substring(0, 8),
        fullFingerprint: q.fingerprint, // Store full fingerprint for click handler
        credits: q.total_credits_consumed,
        polls: q.polls_created,
      }));

    return { totalRequests, uniqueUsers, totalCredits, distribution, chartData, topConsumers };
  }, [journal, filteredQuotas, includeTestSessions]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      // If clicking on top consumers chart
      if (payload.fullFingerprint) {
        setSelectedBar(payload.fullFingerprint === selectedBar ? null : payload.fullFingerprint);
        setSearch(payload.fullFingerprint === selectedBar ? "" : payload.fullFingerprint);
      }
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedBar(null);
    setIncludeTestSessions(false);
  };

  const getFingerprintType = (fp: string) => {
    if (fp.startsWith("guest_suspicious_")) return { type: "Suspicious Test", color: "text-red-600", icon: "⚠️" };
    if (fp.startsWith("guest_active_")) return { type: "Active Test", color: "text-blue-600", icon: "🧪" };
    if (fp.startsWith("guest_test_")) return { type: "Test", color: "text-gray-600", icon: "🧪" };
    if (fp.startsWith("guest_demo_")) return { type: "Demo", color: "text-purple-600", icon: "🎓" };
    if (fp.startsWith("dev-")) return { type: "Real User", color: "text-green-600", icon: "👤" };
    return { type: "Unknown", color: "text-gray-500", icon: "❓" };
  };

  const getFingerprintInsights = (q: GuestQuota) => {
    const insights = [];

    // Analyze poll creation pattern
    const productTypes = [];
    if (q.date_polls_created > 0) productTypes.push("Date");
    if (q.form_polls_created > 0) productTypes.push("Form");
    if (q.quizz_created > 0) productTypes.push("Quiz");
    if (q.availability_polls_created > 0) productTypes.push("Avail");

    if (productTypes.length > 1) {
      insights.push(`Multi-produit (${productTypes.join(", ")})`);
    } else if (productTypes.length === 1) {
      insights.push(`Focus ${productTypes[0]}`);
    }

    // Analyze AI usage
    if (q.ai_messages > 10) insights.push("Utilisateur IA intensif");
    if (q.simulations > 2) insights.push("Expérimente simulations");

    // Analyze Activity
    const hoursSinceLastActivity = (Date.now() - new Date(q.last_activity_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastActivity < 1) insights.push("🟢 Actif maintenant");
    else if (hoursSinceLastActivity < 24) insights.push("🟡 Actif aujourd'hui");

    return insights;
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const handleUserClick = (q: GuestQuota) => {
    // Navigate to detail view or open modal (future implementation)
    // For now, toggle expansion
    toggleRowExpansion(q.id);
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-8 text-center bg-gray-50">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Accès restreint</h2>
        <p className="mt-2 text-gray-600">
          Ce tableau de bord est réservé aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Fingerprint className="h-6 w-6 text-blue-600" />
            Guest Quota Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring des utilisateurs non connectés (Fingerprinting)
          </p>
        </div>
        <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
          {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === r
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Utilisateurs Uniques", value: stats.uniqueUsers, icon: UserX, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Requêtes Totales", value: stats.totalRequests, icon: Fingerprint, color: "text-purple-600 bg-purple-50 border-purple-100" },
          { label: "Crédits Consommés", value: stats.totalCredits, icon: CreditCard, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Utilisateurs Bloqués", value: quotas.filter((q) => q.is_blocked).length, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-100" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 shadow-sm flex items-center justify-between ${stat.color.split(" ").slice(1).join(" ")} bg-white`}>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color.split(" ")[0]} opacity-80`} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Consumers Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm h-80">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Top 5 Consommateurs de crédits
            {includeTestSessions && <span className="text-xs font-normal text-gray-500 ml-2">(incl. tests)</span>}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topConsumers} layout="vertical" onClick={handleBarClick} className="cursor-pointer">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="credits" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.topConsumers.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fullFingerprint === selectedBar ? "#2563eb" : "#93c5fd"}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Distribution Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm h-80">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Distribution des actions
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isLoadingData ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Empty state when filtering removes all real users */}
          {filteredQuotas.length === 0 && !includeTestSessions && quotas.length > 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Aucun utilisateur actif visible</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                Toutes les sessions détectées ({quotas.length}) semblent être des tests automatisés ou des bots.
                Activez l'option ci-dessous pour les afficher.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIncludeTestSessions(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Afficher les sessions de test
                </button>
              </div>
            </div>
          )}

          {/* Test Sessions Hidden Banner */}
          {!includeTestSessions && quotas.length > filteredQuotas.length && filteredQuotas.length > 0 && (
            <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-blue-700">
                    {quotas.length - filteredQuotas.length} sessions de test masquées pour clarté.
                  </p>
                  <p className="mt-3 text-sm md:mt-0 md:ml-6">
                    <button
                      onClick={() => setIncludeTestSessions(true)}
                      className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600"
                    >
                      Afficher tout <span aria-hidden="true">&rarr;</span>
                    </button>
                  </p>
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
        </div >
      )}
    </div>
  );
};

export default AdminQuotaDashboard;

import { Eye } from "lucide-react";
