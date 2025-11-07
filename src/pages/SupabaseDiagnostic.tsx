/**
 * Supabase Diagnostic Page
 * Tests all Supabase operations and displays results
 */

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  duration?: number;
  message?: string;
  data?: any;
  error?: any;
}

export const SupabaseDiagnostic: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...update } : r)));
  };

  // Helper: Add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout après ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Supabase Connection
    const test1Index = 0;
    addResult({ name: "1. Connexion Supabase", status: "pending" });
    try {
      const start = Date.now();
      const url = (supabase as any).supabaseUrl;
      const key = (supabase as any).supabaseKey;
      updateResult(test1Index, {
        status: "success",
        duration: Date.now() - start,
        message: `✅ Connecté à ${url}`,
        data: { url, hasKey: !!key },
      });
    } catch (error: any) {
      updateResult(test1Index, {
        status: "error",
        message: `❌ ${error.message}`,
        error,
      });
    }

    // Test 2: Auth Status
    const test2Index = 1;
    addResult({ name: "2. Statut d'authentification", status: "pending" });
    try {
      const start = Date.now();
      const {
        data: { session },
        error,
      } = await withTimeout(supabase.auth.getSession(), 5000);
      if (error) throw error;
      updateResult(test2Index, {
        status: "success",
        duration: Date.now() - start,
        message: session
          ? `✅ Authentifié: ${session.user.email}`
          : "⚠️ Non authentifié (mode guest)",
        data: { userId: session?.user?.id, email: session?.user?.email },
      });
    } catch (error: any) {
      updateResult(test2Index, {
        status: "error",
        message: `❌ ${error.message}`,
        error,
      });
    }

    // Test 3: Read profiles
    const test3Index = 2;
    addResult({ name: "3. Lecture table profiles", status: "pending" });
    try {
      const start = Date.now();
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").limit(1),
        5000,
      );
      if (error) throw error;
      updateResult(test3Index, {
        status: "success",
        duration: Date.now() - start,
        message: `✅ Table accessible (${data?.length || 0} lignes)`,
        data,
      });
    } catch (error: any) {
      updateResult(test3Index, {
        status: "error",
        message: `❌ ${error.message}`,
        error,
      });
    }

    // Test 4: Read polls
    const test4Index = 3;
    addResult({ name: "4. Lecture table polls", status: "pending" });
    try {
      const start = Date.now();
      const { data, error } = await withTimeout(supabase.from("polls").select("*").limit(1), 5000);
      if (error) throw error;
      updateResult(test4Index, {
        status: "success",
        duration: Date.now() - start,
        message: `✅ Table accessible (${data?.length || 0} lignes)`,
        data,
      });
    } catch (error: any) {
      updateResult(test4Index, {
        status: "error",
        message: `❌ ${error.message}`,
        error,
      });
    }

    // Test 5: Read conversations
    const test5Index = 4;
    addResult({ name: "5. Lecture table conversations", status: "pending" });
    try {
      const start = Date.now();
      const { data, error } = await withTimeout(
        supabase.from("conversations").select("*").limit(1),
        5000,
      );
      if (error) throw error;
      updateResult(test5Index, {
        status: "success",
        duration: Date.now() - start,
        message: `✅ Table accessible (${data?.length || 0} lignes)`,
        data,
      });
    } catch (error: any) {
      updateResult(test5Index, {
        status: "error",
        message: `❌ ${error.message}`,
        error,
      });
    }

    // Test 6: Insert conversation (authenticated only)
    if (user) {
      const test6Index = 5;
      addResult({ name: "6. Insertion conversation", status: "pending" });
      const testConvId = crypto.randomUUID();
      try {
        const start = Date.now();
        const testData = {
          id: testConvId,
          user_id: user.id,
          session_id: testConvId,
          title: "Test Diagnostic " + new Date().toISOString(),
          first_message: "Message de test",
          message_count: 0,
          messages: [],
          context: { test: true },
          poll_id: null,
          related_poll_id: null,
          is_favorite: false,
          status: "active",
        };
        const { data, error } = await withTimeout(
          supabase.from("conversations").insert(testData).select(),
          10000,
        );
        if (error) throw error;
        updateResult(test6Index, {
          status: "success",
          duration: Date.now() - start,
          message: `✅ Insertion réussie (${Date.now() - start}ms)`,
          data,
        });

        // Test 7: Update conversation
        const test7Index = 6;
        addResult({ name: "7. Mise à jour conversation", status: "pending" });
        try {
          const start2 = Date.now();
          const { data: updateData, error: updateError } = await withTimeout(
            supabase
              .from("conversations")
              .update({ title: "Test Diagnostic UPDATED" })
              .eq("id", testConvId)
              .select(),
            10000,
          );
          if (updateError) throw updateError;
          updateResult(test7Index, {
            status: "success",
            duration: Date.now() - start2,
            message: `✅ Mise à jour réussie (${Date.now() - start2}ms)`,
            data: updateData,
          });
        } catch (error: any) {
          updateResult(test7Index, {
            status: "error",
            message: `❌ ${error.message}`,
            error,
          });
        }

        // Test 8: Delete conversation
        const test8Index = 7;
        addResult({ name: "8. Suppression conversation", status: "pending" });
        try {
          const start3 = Date.now();
          const { error: deleteError } = await withTimeout(
            supabase.from("conversations").delete().eq("id", testConvId),
            10000,
          );
          if (deleteError) throw deleteError;
          updateResult(test8Index, {
            status: "success",
            duration: Date.now() - start3,
            message: `✅ Suppression réussie (${Date.now() - start3}ms)`,
          });
        } catch (error: any) {
          updateResult(test8Index, {
            status: "error",
            message: `❌ ${error.message}`,
            error,
          });
        }
      } catch (error: any) {
        updateResult(test6Index, {
          status: "error",
          message: `❌ ${error.message}`,
          error,
        });
      }
    } else {
      addResult({
        name: "6-8. Tests d'écriture",
        status: "error",
        message: "⚠️ Non authentifié - impossible de tester les écritures",
      });
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⚪";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">🔍 Diagnostic Supabase</h1>
          <p className="text-gray-600 mb-6">
            Teste toutes les opérations Supabase et affiche les résultats détaillés
          </p>

          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold mb-2">Utilisateur actuel:</h2>
            {user ? (
              <div className="text-sm">
                <p>✅ Authentifié</p>
                <p>Email: {user.email}</p>
                <p>ID: {user.id}</p>
              </div>
            ) : (
              <p className="text-sm">⚠️ Non authentifié (mode guest)</p>
            )}
          </div>

          {/* Run Tests Button */}
          <button
            onClick={runTests}
            disabled={isRunning}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isRunning ? "⏳ Tests en cours..." : "🚀 Lancer les tests"}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Résultats:</h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  data-test-name={result.name}
                  data-test-status={result.status}
                  className={`border rounded-lg p-4 ${
                    result.status === "success"
                      ? "border-green-200 bg-green-50"
                      : result.status === "error"
                        ? "border-red-200 bg-red-50"
                        : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold ${getStatusColor(result.status)}`}>
                      {getStatusIcon(result.status)} {result.name}
                    </h3>
                    {result.duration && (
                      <span className="text-sm text-gray-600">{result.duration}ms</span>
                    )}
                  </div>
                  {result.message && <p className="text-sm mb-2">{result.message}</p>}
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        📊 Voir les données
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {result.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                        🔴 Voir l'erreur complète
                      </summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {results.length > 0 && !isRunning && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Résumé:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {results.filter((r) => r.status === "success").length}
                  </p>
                  <p className="text-sm text-gray-600">Réussis</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {results.filter((r) => r.status === "error").length}
                  </p>
                  <p className="text-sm text-gray-600">Échoués</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {results.filter((r) => r.status === "pending").length}
                  </p>
                  <p className="text-sm text-gray-600">En cours</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
