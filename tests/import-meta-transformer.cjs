// Custom transformer to replace import.meta.env with process.env for Jest
const { default: tsJest } = require("ts-jest");

// Create ts-jest transformer with diagnostics disabled to avoid import.meta type errors
const tsJestTransformer = tsJest.createTransformer({
  tsconfig: {
    module: "esnext",
    target: "ES2020",
    moduleResolution: "node",
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    jsx: "react-jsx",
    skipLibCheck: true,
    baseUrl: ".",
    paths: {
      "@/*": ["./src/*"],
    },
  },
  diagnostics: {
    // Ignore TypeScript errors about import.meta since we're transforming them
    ignoreCodes: [1343, 2339],
  },
});

module.exports = {
  process(sourceText, sourcePath, config) {
    // Transform import.meta to process for Jest compatibility
    let transformedSource = sourceText
      // Transform typeof import.meta checks (must come before other replacements)
      .replace(/typeof\s+import\.meta\s*!==\s*["']undefined["']/g, 'typeof process !== "undefined"')
      .replace(/typeof\s+import\.meta\s*===\s*["']undefined["']/g, 'typeof process === "undefined"')
      // Transform specific environment variables (must come before generic .env replacement)
      .replace(/import\.meta\.env\.VITE_GEMINI_API_KEY/g, "process.env.VITE_GEMINI_API_KEY")
      .replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, "process.env.VITE_SUPABASE_URL")
      .replace(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/g, "process.env.VITE_SUPABASE_ANON_KEY")
      .replace(/import\.meta\.env\.DEV\s*===\s*true/g, '(process.env.NODE_ENV === "development")')
      .replace(/import\.meta\.env\.DEV/g, '(process.env.NODE_ENV === "development")')
      .replace(/import\.meta\.env\.PROD/g, '(process.env.NODE_ENV === "production")')
      .replace(/import\.meta\.env\?\.MODE/g, "process.env.NODE_ENV")
      .replace(/import\.meta\.env\.MODE/g, "process.env.NODE_ENV")
      // Transform generic import.meta.env array access (must come before generic .env)
      .replace(/import\.meta\.env\[/g, "process.env[")
      // Transform all remaining import.meta.env to process.env
      .replace(/import\.meta\.env/g, "process.env")
      // Finally, replace any remaining bare import.meta references
      .replace(/import\.meta/g, "undefined");

    // Then use ts-jest to compile TypeScript
    return tsJestTransformer.process(transformedSource, sourcePath, config);
  },
};
