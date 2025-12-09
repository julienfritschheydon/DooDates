import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Plus, Trash2, Eye, Copy, BarChart3 } from "lucide-react";
import {
  getQuizz,
  deleteQuizzById,
  getQuizzResponses,
  type Quizz,
} from "@/lib/products/quizz/quizz-service";
import { useToast } from "@/hooks/use-toast";
import { ErrorFactory, logError } from "@/lib/error-handling";
import { Button } from "@/components/ui/button";

export const QuizzList: React.FC = () => {
  const [quizzList, setQuizzList] = useState<Quizz[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadQuizz();
  }, []);

  const loadQuizz = () => {
    try {
      const data = getQuizz();
      setQuizzList(data);
    } catch (error) {
      const processedError = ErrorFactory.api(
        "Erreur chargement quiz",
        "Erreur lors du chargement des quiz",
        {
          originalError: error as unknown,
          source: "QuizzList.loadQuizz",
        },
      );
      logError(processedError, { component: "QuizzList", operation: "loadQuizz" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce quiz ?")) {
      deleteQuizzById(id);
      loadQuizz();
      toast({ title: "Quiz supprimé" });
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/quizz/${slug}/vote`;
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié !" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-yellow-500" />
            Aide aux Devoirs
          </h1>
          <p className="text-gray-600 mt-1">Créez des quiz éducatifs pour vos enfants</p>
        </div>
        <Link
          to="/quizz/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Nouveau Quiz
        </Link>
      </div>

      {/* Liste */}
      {quizzList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun quiz pour le moment</h3>
          <p className="text-gray-500 mb-6">
            Créez votre premier quiz pour aider vos enfants dans leurs devoirs
          </p>
          <Link
            to="/quizz/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Créer un quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzList.map((quiz) => {
            const responses = getQuizzResponses(quiz.id);
            const responseCount = responses.length;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{quiz.title}</h3>
                  <div className="flex gap-2">
                    {responseCount > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {responseCount} réponse{responseCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      {quiz.questions?.length || 0} questions
                    </span>
                  </div>
                </div>

                {quiz.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    onClick={() => navigate(`/quizz/${quiz.slug || quiz.id}/vote`)}
                    size="sm"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Tester
                  </Button>
                  <Button
                    onClick={() => navigate(`/quizz/${quiz.slug || quiz.id}/results`)}
                    size="sm"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Voir les résultats"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleCopyLink(quiz.slug || quiz.id)}
                    size="sm"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Copier le lien"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(quiz.id)}
                    size="sm"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
