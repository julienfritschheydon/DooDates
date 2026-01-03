# 🔧 Guide d'Intégration - Documentation Web

Guide technique pour intégrer la documentation utilisateur dans l'application DooDates.

---

## 📋 Vue d'Ensemble

Cette documentation est conçue pour être affichée comme des pages web dans la section **Settings** de l'application DooDates.

**Technologies :**

- React 18+ / TypeScript
- Markdown → HTML (via react-markdown)
- Routing React Router
- Styling TailwindCSS

---

## 🗂️ Structure des Fichiers

```
Docs/USER-DOCUMENTATION/
├── README.md                          # Index principal
├── 01-Guide-Demarrage-Rapide.md      # ✅ Créé
├── 02-Concepts-Base.md                # ✅ Créé
├── 03-Sondages-Dates.md               # ⏳ À créer
├── 04-Formulaires-Questionnaires.md   # ⏳ À créer
├── 05-Assistant-IA.md                 # ✅ Créé
├── 06-Analytics-IA.md                 # ✅ Créé
├── 07-Simulation-Reponses.md          # ⏳ À créer
├── 08-Gestion-Resultats.md            # ⏳ À créer
├── 09-Export-Partage.md               # ✅ Créé
├── 10-Tableau-Bord.md                 # ⏳ À créer
├── 11-Cas-Usage.md                    # ✅ Créé
├── 12-Bonnes-Pratiques.md             # ✅ Créé
├── 13-Personnalisation.md             # ⏳ À créer
├── 14-FAQ.md                          # ✅ Créé
├── 15-Glossaire.md                    # ✅ Créé
├── 16-Raccourcis-Clavier.md           # ⏳ À créer
└── 17-Resolution-Problemes.md         # ✅ Créé
```

**Total : 10/17 guides créés (59%)**

---

## 🛠️ Installation des Dépendances

```bash
npm install react-markdown remark-gfm rehype-raw rehype-sanitize
```

**Packages :**

- `react-markdown` : Rendu Markdown → React
- `remark-gfm` : Support GitHub Flavored Markdown (tableaux, listes)
- `rehype-raw` : Support HTML dans Markdown
- `rehype-sanitize` : Sécurité XSS

---

## 📦 Composant DocsViewer

Créez `src/components/docs/DocsViewer.tsx` :

```typescript
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Link } from 'react-router-dom';

interface DocsViewerProps {
  docPath: string; // Ex: "01-Guide-Demarrage-Rapide.md"
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ docPath }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        setLoading(true);
        // Import du fichier Markdown
        const response = await fetch(`/docs/${docPath}`);
        if (!response.ok) throw new Error('Document non trouvé');

        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
  }, [docPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p className="font-semibold">Erreur de chargement</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="docs-content prose prose-lg max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Liens internes → React Router Links
          a: ({ node, href, children, ...props }) => {
            // Lien interne (commence par ./)
            if (href?.startsWith('./')) {
              const docName = href.replace('./', '').replace('.md', '');
              return (
                <Link
                  to={`/docs/${docName}`}
                  className="text-primary hover:underline"
                  {...props}
                >
                  {children}
                </Link>
              );
            }
            // Lien externe
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
              >
                {children} 🔗
              </a>
            );
          },

          // Tableaux stylés
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
            </div>
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

---

## 🎨 Styles CSS Personnalisés

Créez `src/styles/docs.css` :

```css
/* Prose styles pour la documentation */
.docs-content {
  @apply text-gray-900 dark:text-gray-100;
  line-height: 1.8;
}

.docs-content h1 {
  @apply text-4xl font-bold mb-6 mt-8 border-b-2 border-primary pb-3;
}

.docs-content h2 {
  @apply text-3xl font-semibold mb-4 mt-8 text-primary;
}

.docs-content h3 {
  @apply text-2xl font-semibold mb-3 mt-6;
}

.docs-content h4 {
  @apply text-xl font-medium mb-2 mt-4 text-gray-700 dark:text-gray-300;
}

.docs-content p {
  @apply mb-4 leading-relaxed;
}

.docs-content ul,
.docs-content ol {
  @apply mb-4 ml-6 space-y-2;
}

.docs-content li {
  @apply leading-relaxed;
}

.docs-content a {
  @apply text-primary hover:text-primary-dark underline transition-colors;
}

.docs-content blockquote {
  @apply border-l-4 border-primary bg-primary-light bg-opacity-10 pl-4 py-2 my-4 italic;
}

.docs-content table {
  @apply w-full border-collapse;
}

.docs-content th {
  @apply bg-primary text-white px-4 py-2 text-left font-semibold;
}

.docs-content td {
  @apply border border-gray-300 dark:border-gray-700 px-4 py-2;
}

.docs-content tr:nth-child(even) {
  @apply bg-gray-50 dark:bg-gray-800;
}

/* Code blocks */
.docs-content pre {
  @apply bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4;
}

.docs-content code:not(pre code) {
  @apply bg-gray-100 dark:bg-gray-800 text-sm px-1.5 py-0.5 rounded font-mono;
}

/* Badges et icônes */
.docs-content .badge {
  @apply inline-block bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold;
}

/* Responsive */
@media (max-width: 768px) {
  .docs-content h1 {
    @apply text-3xl;
  }

  .docs-content h2 {
    @apply text-2xl;
  }

  .docs-content table {
    @apply text-sm;
  }
}
```

---

## 🗺️ Navigation et Routing

### Page Settings avec Docs

`src/pages/Settings.tsx` :

```typescript
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { DocsViewer } from '@/components/docs/DocsViewer';
import { Book, HelpCircle, Zap, BarChart, FileText } from 'lucide-react';

const docCategories = [
  {
    title: 'Pour Commencer',
    icon: Zap,
    docs: [
      { id: '01-Guide-Demarrage-Rapide', name: 'Guide de Démarrage Rapide' },
      { id: '02-Concepts-Base', name: 'Concepts de Base' },
    ],
  },
  {
    title: 'Fonctionnalités',
    icon: BarChart,
    docs: [
      { id: '05-Assistant-IA', name: 'Assistant IA Conversationnel' },
      { id: '06-Analytics-IA', name: 'Analytics IA' },
      { id: '09-Export-Partage', name: 'Export et Partage' },
    ],
  },
  {
    title: 'Guides Pratiques',
    icon: Book,
    docs: [
      { id: '11-Cas-Usage', name: "Cas d'Usage" },
      { id: '12-Bonnes-Pratiques', name: 'Bonnes Pratiques' },
    ],
  },
  {
    title: 'Support',
    icon: HelpCircle,
    docs: [
      { id: '14-FAQ', name: 'FAQ' },
      { id: '15-Glossaire', name: 'Glossaire' },
      { id: '17-Resolution-Problemes', name: 'Résolution de Problèmes' },
    ],
  },
];

export const Settings: React.FC = () => {
  const location = useLocation();
  const currentDoc = location.pathname.split('/docs/')[1];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentation
          </h2>
        </div>

        <nav className="p-4 space-y-6">
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
                      to={`/settings/docs/${doc.id}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        currentDoc === doc.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            <Route
              path="/docs/:docId"
              element={<DocsViewerWrapper />}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const DocsViewerWrapper: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  return <DocsViewer docPath={`${docId}.md`} />;
};

const DocsHome: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">📚 Documentation DooDates</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Bienvenue dans la documentation complète de DooDates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link
          to="/settings/docs/01-Guide-Demarrage-Rapide"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">🚀 Démarrer</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Guide de démarrage rapide en 5 minutes
          </p>
        </Link>

        <Link
          to="/settings/docs/14-FAQ"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">❓ FAQ</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Réponses aux questions fréquentes
          </p>
        </Link>
      </div>
    </div>
  );
};
```

---

## 📂 Configuration Vite

Ajoutez dans `vite.config.ts` :

```typescript
export default defineConfig({
  // ... autres configs

  // Copier les fichiers Markdown dans public
  publicDir: "public",

  build: {
    rollupOptions: {
      input: {
        // Inclure les fichiers Markdown
        docs: "Docs/USER-DOCUMENTATION/*.md",
      },
    },
  },
});
```

**OU** copiez manuellement les fichiers :

```bash
# Script de build
mkdir -p public/docs
cp Docs/USER-DOCUMENTATION/*.md public/docs/
```

---

## 🔍 Recherche dans la Documentation

Composant optionnel `DocsSearch.tsx` :

```typescript
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';

interface DocsSearchProps {
  docs: Array<{ id: string; name: string; content: string }>;
  onSelect: (docId: string) => void;
}

export const DocsSearch: React.FC<DocsSearchProps> = ({ docs, onSelect }) => {
  const [query, setQuery] = useState('');

  const fuse = useMemo(
    () =>
      new Fuse(docs, {
        keys: ['name', 'content'],
        threshold: 0.3,
        includeScore: true,
      }),
    [docs]
  );

  const results = query.length > 2 ? fuse.search(query).slice(0, 5) : [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher dans la documentation..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {results.map((result) => (
            <button
              key={result.item.id}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              onClick={() => {
                onSelect(result.item.id);
                setQuery('');
              }}
            >
              <p className="font-medium">{result.item.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Score: {(1 - (result.score || 0)).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## ✅ Checklist d'Intégration

**Avant de déployer :**

- [ ] Installer les dépendances npm
- [ ] Créer le composant `DocsViewer`
- [ ] Ajouter les styles CSS (`docs.css`)
- [ ] Configurer le routing dans Settings
- [ ] Copier les fichiers `.md` dans `public/docs/`
- [ ] Tester la navigation entre les pages
- [ ] Vérifier les liens internes (`.md` → routes React)
- [ ] Tester le responsive mobile
- [ ] Vérifier le mode sombre
- [ ] Ajouter la recherche (optionnel)

---

## 🎨 Personnalisation

### Changer les Couleurs

Dans `tailwind.config.ts` :

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // Bleu DooDates
          light: "#60A5FA",
          dark: "#2563EB",
        },
      },
    },
  },
};
```

### Ajouter un Header Personnalisé

```typescript
<div className="docs-header border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
  <h1 className="text-3xl font-bold">{docTitle}</h1>
  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
    <span>⏱️ {estimatedReadTime} min de lecture</span>
    <span>📅 Mis à jour : {lastUpdate}</span>
  </div>
</div>
```

---

## 📱 Support Mobile

Les pages sont déjà responsive, mais ajustements possibles :

```css
/* Navigation mobile sticky */
@media (max-width: 768px) {
  aside {
    position: fixed;
    left: -100%;
    transition: left 0.3s ease;
    z-index: 40;
  }

  aside.open {
    left: 0;
  }

  /* Bouton hamburger */
  .mobile-menu-button {
    display: block;
  }
}
```

---

## 🚀 Performance

### Lazy Loading des Docs

```typescript
const DocsViewer = React.lazy(() => import('./components/docs/DocsViewer'));

<React.Suspense fallback={<LoadingSpinner />}>
  <DocsViewer docPath={docPath} />
</React.Suspense>
```

### Cache des Fichiers Markdown

```typescript
const docsCache = new Map<string, string>();

const loadDoc = async (docPath: string) => {
  if (docsCache.has(docPath)) {
    return docsCache.get(docPath);
  }

  const response = await fetch(`/docs/${docPath}`);
  const text = await response.text();
  docsCache.set(docPath, text);

  return text;
};
```

---

## 📊 Analytics (Optionnel)

Tracker les pages vues :

```typescript
useEffect(() => {
  // Google Analytics
  gtag("event", "page_view", {
    page_title: docTitle,
    page_location: window.location.href,
    page_path: `/docs/${docId}`,
  });

  // Plausible Analytics
  plausible("pageview", {
    props: { doc: docId },
  });
}, [docId]);
```

---

## 🔗 Liens Utiles

- [react-markdown Documentation](https://github.com/remarkjs/react-markdown)
- [TailwindCSS Typography](https://tailwindcss.com/docs/typography-plugin)
- [Fuse.js (Recherche)](https://fusejs.io/)

---

**Besoin d'aide ?** support@doodates.com

---

**© 2025 DooDates - Guide d'Intégration**
