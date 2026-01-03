import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, BarChart3, Users, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminQuotaDashboard from "./AdminQuotaDashboard";
import AdminUserActivity from "./AdminUserActivity";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";

type AdminTab = "quotas" | "activity" | "performance";

const Admin: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to 'quotas'
  const currentTab = (searchParams.get("tab") as AdminTab) || "quotas";

  const [isAdmin, setIsAdmin] = useState(false);

  // Vérification admin (même logique que AdminQuotaDashboard)
  useEffect(() => {
    const hasRoleAdmin =
      !!user && (profile?.preferences as { role?: string } | null)?.role === "admin";

    const hasEmailAdmin =
      !!user && (user.email?.endsWith("@doodates.com") || user.email === "admin@doodates.com");

    const nextIsAdmin = hasRoleAdmin || hasEmailAdmin;
    setIsAdmin(nextIsAdmin);
  }, [user, profile]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center bg-gray-50">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Accès restreint</h2>
        <p className="mt-2 text-gray-600">Ce tableau de bord est réservé aux administrateurs.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          data-testid="admin-back-home"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-blue-600" />
            Administration DooDates
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tableau de bord administrateur - Gestion des quotas, activité utilisateurs et
            performances
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger
              value="quotas"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Quotas Invités</span>
              <span className="sm:hidden">Quotas</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activité Utilisateur</span>
              <span className="sm:hidden">Activité</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
              <span className="sm:hidden">Perf</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotas" className="space-y-4">
            <AdminQuotaDashboard />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <AdminUserActivity />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <PerformanceDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
