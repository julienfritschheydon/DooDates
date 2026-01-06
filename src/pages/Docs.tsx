import React, { useState, useMemo, useEffect } from "react";
import { Routes, Route, Link, useParams, useLocation } from "react-router-dom";
import { DocsViewer } from "@/components/docs/DocsViewer";
import { logError, handleError } from "@/lib/error-handling";
import {
  Book,
  HelpCircle,
  Zap,
  BarChart,
  FileText,
  Home,
  Search,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/styles/docs.css";

const docCategories = [
  {
    title: "Pour Commencer",
    icon: Zap,
    docs: [
      { id: "01-Guide-Demarrage-Rapide", name: "Guide de Démarrage Rapide" },
      { id: "02-Concepts-Base", name: "Concepts de Base" },
    ],
  },
  {
    title: "Fonctionnalités",
    icon: BarChart,
    docs: [
      { id: "03-Sondages-Dates", name: "Sondages de Dates" },
      { id: "04-Formulaires-Questionnaires", name: "Formulaires et Questionnaires" },
      { id: "05-Assistant-IA", name: "Assistant IA Conversationnel" },
      { id: "08-Gestion-Resultats", name: "Gestion des Résultats" },
      { id: "10-Tableau-Bord", name: "Tableau de Bord" },
    ],
  },
  {
    title: "Support",
    icon: HelpCircle,
    docs: [
      { id: "14-FAQ", name: "FAQ" },
      { id: "17-Resolution-Problemes", name: "Résolution de Problèmes" },
    ],
  },
];

const DocsHome: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
        📚 Documentation DooDates
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Bienvenue dans la documentation complète de DooDates. Explorez nos guides pour tirer le
        meilleur parti de la plateforme.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <Link
          to="/docs/01-Guide-Demarrage-Rapide"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">🚀 Démarrer</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Guide de démarrage rapide en 5 minutes</p>
        </Link>

        <Link
          to="/docs/05-Assistant-IA"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">🤖 Assistant IA</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Créez des sondages en parlant naturellement
          </p>
        </Link>

        <Link
          to="/docs/14-FAQ"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">❓ FAQ</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Réponses aux questions fréquentes</p>
        </Link>
      </div>
    </div>
  );
};

const DocsViewerWrapper: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();

  if (!docId) {
    return <DocsHome />;
  }

  return <DocsViewer docPath={`${docId}.md`} />;
};

interface DocContent {
  id: string;
  name: string;
  category: string;
  categoryIcon: typeof Zap;
  content: string;
}

export const Docs: React.FC = () => {
  const location = useLocation();
  const currentDoc = location.pathname.split("/docs/")[1];
  const [searchQuery, setSearchQuery] = useState("");
  const [docContents, setDocContents] = useState<Map<string, string>>(new Map());
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fermer la sidebar sur mobile lors des changements de route
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Flatten all docs for search
  const allDocs = useMemo(() => {
    return docCategories.flatMap((category) =>
      category.docs.map((doc) => ({
        ...doc,
        category: category.title,
        categoryIcon: category.icon,
      })),
    );
  }, []);

  // Load all markdown files content
  useEffect(() => {
    const loadAllDocs = async () => {
      setIsLoadingContent(true);
      const baseUrl = import.meta.env.BASE_URL || "/";
      const contents = new Map<string, string>();

      const loadPromises = allDocs.map(async (doc) => {
        try {
          const response = await fetch(`${baseUrl}docs/${doc.id}.md`);
          if (response.ok) {
            const text = await response.text();
            contents.set(doc.id, text);
          }
        } catch (error) {
          logError(
            handleError(
              error,
              { component: "Docs", metadata: { docId: doc.id } },
              `Failed to load ${doc.id}.md`,
            ),
          );
        }
      });

      await Promise.all(loadPromises);
      setDocContents(contents);
      setIsLoadingContent(false);
    };

    loadAllDocs();
  }, [allDocs]);

  // Filter docs based on search query (including content)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const results: Array<{
      doc: DocContent;
      matches: Array<{ text: string; index: number }>;
    }> = [];

    allDocs.forEach((doc) => {
      const content = docContents.get(doc.id) || "";
      const contentLower = content.toLowerCase();
      const nameLower = doc.name.toLowerCase();
      const idLower = doc.id.toLowerCase();
      const categoryLower = doc.category.toLowerCase();

      // Search in title, ID, category, or content
      if (
        nameLower.includes(query) ||
        idLower.includes(query) ||
        categoryLower.includes(query) ||
        contentLower.includes(query)
      ) {
        // Find matches in content for highlighting
        const matches: Array<{ text: string; index: number }> = [];
        const lines = content.split("\n");
        lines.forEach((line, lineIndex) => {
          const lineLower = line.toLowerCase();
          if (lineLower.includes(query)) {
            // Find all occurrences in this line
            let index = 0;
            while ((index = lineLower.indexOf(query, index)) !== -1) {
              const start = Math.max(0, index - 50);
              const end = Math.min(line.length, index + query.length + 50);
              matches.push({
                text: line.substring(start, end),
                index: lineIndex,
              });
              index += query.length;
            }
          }
        });

        results.push({
          doc: {
            id: doc.id,
            name: doc.name,
            category: doc.category,
            categoryIcon: doc.categoryIcon,
            content,
          },
          matches: matches.slice(0, 3), // Limit to 3 matches per doc
        });
      }
    });

    return results;
  }, [searchQuery, allDocs, docContents]);

  // Helper function to highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Backdrop pour fermer la sidebar en cliquant à l'extérieur (mobile uniquement) */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Fermer le menu"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Bouton hamburger (mobile uniquement) */}
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isSidebarOpen}
          data-testid="docs-button"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col
        ${isMobile ? "fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-300" : ""}
        ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}
      `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />← Retour à DooDates
          </Link>
          <Link
            to="/docs"
            className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
          >
            <FileText className="w-5 h-5" />
            Documentation
          </Link>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                isLoadingContent ? "Chargement de la documentation..." : "Rechercher dans la doc..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoadingContent}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isLoadingContent && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <nav className="p-4 space-y-6 overflow-y-auto flex-1">
          <Link
            to="/docs"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              !currentDoc && !searchQuery.trim()
                ? "bg-primary text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>

          {docCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <category.icon className="w-4 h-4" />
                {category.title}
              </h3>
              <ul className="space-y-1">
                {category.docs.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      to={`/docs/${doc.id}`}
                      onClick={() => setSearchQuery("")}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        currentDoc === doc.id
                          ? "bg-primary text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {doc.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className={`max-w-4xl mx-auto p-8 ${isMobile ? "pt-16" : ""}`}>
          {searchQuery.trim() && searchResults.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Résultats de recherche
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} trouvé
                  {searchResults.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-4">
                {searchResults.map((result) => {
                  const category = docCategories.find((cat) => cat.title === result.doc.category);
                  return (
                    <Link
                      key={result.doc.id}
                      to={`/docs/${result.doc.id}`}
                      onClick={() => setSearchQuery("")}
                      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {category && (
                          <category.icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                            {highlightText(result.doc.name, searchQuery)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {result.doc.category}
                          </p>
                          {result.matches.length > 0 && (
                            <div className="space-y-2">
                              {result.matches.map((match, idx) => (
                                <p
                                  key={idx}
                                  className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                                >
                                  ...{highlightText(match.text, searchQuery)}...
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : searchQuery.trim() && searchResults.length === 0 && !isLoadingContent ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Aucun résultat trouvé
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aucun document ne correspond à "{searchQuery}"
              </p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<DocsHome />} />
              <Route path="/:docId" element={<DocsViewerWrapper />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
};
