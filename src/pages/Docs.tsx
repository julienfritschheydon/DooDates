import React from "react";
import { Routes, Route, Link, useParams, useLocation } from "react-router-dom";
import { DocsViewer } from "@/components/docs/DocsViewer";
import { Book, HelpCircle, Zap, BarChart, FileText, Home } from "lucide-react";
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
      { id: "06-Analytics-IA", name: "Analytics IA" },
      { id: "07-Simulation-Reponses", name: "Simulation de Réponses" },
      { id: "08-Gestion-Resultats", name: "Gestion des Résultats" },
      { id: "09-Export-Partage", name: "Export et Partage" },
      { id: "10-Tableau-Bord", name: "Tableau de Bord" },
    ],
  },
  {
    title: "Guides Pratiques",
    icon: Book,
    docs: [
      { id: "11-Cas-Usage", name: "Cas d'Usage" },
      { id: "12-Bonnes-Pratiques", name: "Bonnes Pratiques" },
      { id: "13-Personnalisation", name: "Personnalisation" },
    ],
  },
  {
    title: "Support",
    icon: HelpCircle,
    docs: [
      { id: "14-FAQ", name: "FAQ" },
      { id: "15-Glossaire", name: "Glossaire" },
      { id: "16-Raccourcis-Clavier", name: "Raccourcis Clavier" },
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
          to="/docs/11-Cas-Usage"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <Book className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">💼 Cas d'Usage</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">8 exemples pratiques détaillés</p>
        </Link>

        <Link
          to="/docs/06-Analytics-IA"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">📊 Analytics IA</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Analyse automatique de vos résultats</p>
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

        <Link
          to="/docs/12-Bonnes-Pratiques"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <Book className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">✨ Bonnes Pratiques</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Optimisez vos sondages</p>
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

export const Docs: React.FC = () => {
  const location = useLocation();
  const currentDoc = location.pathname.split("/docs/")[1];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
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

        <nav className="p-4 space-y-6">
          <Link
            to="/docs"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              !currentDoc
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
        <div className="max-w-4xl mx-auto p-8">
          <Routes>
            <Route path="/" element={<DocsHome />} />
            <Route path="/:docId" element={<DocsViewerWrapper />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
