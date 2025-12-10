import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabaseSelect } from "../lib/supabaseApi";
import { logError, ErrorFactory } from "../lib/error-handling";

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
  const [search, setSearch] = React.useState("");

  const loadQuotas = React.useCallback(async () => {
    if (!isAdmin) return;

    setIsLoadingData(true);
    setLoadError(null);

    try {
      const data = await supabaseSelect<AdminGuestQuotaRow>(
        "guest_quotas",
        {
          select: "*",
          order: "last_activity_at.desc",
        },
        { timeout: 5000, requireAuth: true },
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

  const filteredQuotas = React.useMemo(() => {
    if (!quotas) return [];
    const term = search.trim().toLowerCase();
    if (!term) return quotas;

    return quotas.filter((q) => {
      return (
        q.fingerprint.toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term)
      );
    });
  }, [quotas, search]);

  const totalGuests = quotas?.length ?? 0;
  const totalCredits = quotas?.reduce((sum, q) => sum + (q.total_credits_consumed || 0), 0) ?? 0;
  const activeLast7Days = quotas?.filter((q) => {
    const last = new Date(q.last_activity_at);
    const now = new Date();
    const diff = now.getTime() - last.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return diff <= sevenDaysMs;
  }).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-8 pt-20 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotas invités &amp; Fingerprinting</h1>
        <p className="text-gray-600 max-w-2xl">
          Vue d'administration dédiée au suivi des quotas invités basés sur le fingerprint
          navigateur. Cette première version est en lecture seule et servira de base aux futures
          fonctionnalités de monitoring.
        </p>
      </header>

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

      <section className="rounded-lg border border-gray-200 bg-white/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par fingerprint ou ID quota..."
              className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
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
                <th className="px-2 py-2">Fingerprint</th>
                <th className="px-2 py-2">Conversations</th>
                <th className="px-2 py-2">Polls (tot / date / form / quiz / dispo)</th>
                <th className="px-2 py-2">IA / Analytics / Simulations</th>
                <th className="px-2 py-2">Crédits</th>
                <th className="px-2 py-2">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotas.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-center text-gray-500" colSpan={6}>
                    {quotas ? "Aucun guest ne correspond à ce filtre." : "Aucune donnée de quota disponible."}
                  </td>
                </tr>
              ) : (
                filteredQuotas.map((q) => {
                  const fpShort = `${q.fingerprint.slice(0, 8)}…`;
                  const datePolls = q.date_polls_created ?? 0;
                  const formPolls = q.form_polls_created ?? 0;
                  const quizzPolls = q.quizz_created ?? 0;
                  const availabilityPolls = q.availability_polls_created ?? 0;

                  return (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50/60">
                      <td className="px-2 py-2 font-mono text-[11px] text-gray-800" title={q.fingerprint}>
                        {fpShort}
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
