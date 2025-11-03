import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ErrorFactory, logError } from "@/lib/error-handling";

interface DocsViewerProps {
  docPath: string; // Ex: "01-Guide-Demarrage-Rapide.md"
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ docPath }) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        setLoading(true);
        // Import du fichier Markdown depuis public/docs/
        const response = await fetch(`/docs/${docPath}`);
        if (!response.ok) {
          throw ErrorFactory.notFound("Document non trouvé", "Le document demandé n'existe pas");
        }

        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur de chargement";
        setError(errorMsg);
        logError(err, { component: "DocsViewer", docPath });
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
  }, [docPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
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
            // Ancre dans la page (table des matières)
            if (href?.startsWith("#")) {
              return (
                <a
                  href={href}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const id = href.substring(1);
                    const element = document.getElementById(id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  {...props}
                >
                  {children}
                </a>
              );
            }
            
            // Lien vers un autre document (commence par ./)
            if (href?.startsWith("./")) {
              const docName = href.replace("./", "").replace(".md", "");
              return (
                <Link
                  to={`/docs/${docName}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
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
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors inline-flex items-center gap-1"
                {...props}
              >
                {children}
                <span className="text-xs">🔗</span>
              </a>
            );
          },

          // Tableaux stylés
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                {...props}
              />
            </div>
          ),

          // Headings avec ID pour les ancres
          h1: ({ node, children, ...props }) => {
            const id = children?.toString().toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '');
            return <h1 id={id} {...props}>{children}</h1>;
          },
          h2: ({ node, children, ...props }) => {
            const id = children?.toString().toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '');
            return <h2 id={id} {...props}>{children}</h2>;
          },
          h3: ({ node, children, ...props }) => {
            const id = children?.toString().toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '');
            return <h3 id={id} {...props}>{children}</h3>;
          },
          h4: ({ node, children, ...props }) => {
            const id = children?.toString().toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '');
            return <h4 id={id} {...props}>{children}</h4>;
          },
          
          // Code blocks
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-blue-600 dark:text-blue-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono my-4"
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
